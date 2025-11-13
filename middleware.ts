import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserOrganizations } from '@/lib/organizations'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/client/login']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Client routes
  const isClientRoute = pathname.startsWith('/client')
  const isClientLoginRoute = pathname.startsWith('/client/login')
  const isClientSelectOrgRoute = pathname.startsWith('/client/select-org')
  const isClientOrgRoute = pathname.match(/^\/client\/[^/]+\//)

  // If user is not logged in and trying to access a protected route
  if (!user && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone()
    
    // Redirect client routes to client login
    if (isClientRoute && !isClientLoginRoute) {
      redirectUrl.pathname = '/client/login'
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Redirect agency routes to regular login
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is logged in and trying to access login/register, redirect appropriately
  if (user && isPublicRoute) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo')
    const redirectUrl = request.nextUrl.clone()
    
    // For client login, redirect to select-org or dashboard
    if (pathname.startsWith('/client/login')) {
      // Check if user has organizations (simplified - actual check happens in callback)
      redirectUrl.pathname = '/client/select-org'
      redirectUrl.search = ''
      return NextResponse.redirect(redirectUrl)
    }
    
    // For regular login/register, check if user is a Client and redirect accordingly
    try {
      // Check user role using supabaseAdmin to bypass RLS
      // Use maybeSingle() to handle cases where user might not have a role
      const { data: userRole, error: roleError } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      // If no role found by user_id, try to get user email and check by email
      let finalRole = userRole?.role
      if (!finalRole && user.email) {
        const { data: roleByEmail } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('invited_email', user.email.toLowerCase())
          .maybeSingle()
        finalRole = roleByEmail?.role
      }

      console.log('Middleware - User role check:', { userId: user.id, email: user.email, role: finalRole, roleError })

      if (finalRole === 'Client') {
        // Get user's organizations
        const organizations = await getUserOrganizations(user.id, supabase)
        
        console.log('Middleware - Client user organizations:', organizations.length)
        
        if (organizations && organizations.length > 0) {
          // Redirect to first organization's client dashboard
          // If multiple orgs, user can select from client/select-org
          if (organizations.length === 1) {
            redirectUrl.pathname = `/client/${organizations[0].id}/dashboard`
          } else {
            // Multiple organizations - redirect to select-org
            redirectUrl.pathname = '/client/select-org'
          }
        } else {
          // Client role but no organizations - redirect to select-org
          redirectUrl.pathname = '/client/select-org'
        }
        redirectUrl.search = '' // Clear search params
        console.log('Middleware - Redirecting Client to:', redirectUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Error checking user role in middleware:', error)
      // Continue with regular redirect if error
    }
    
    // For regular login, redirect to dashboard or original destination
    const destination = (redirectTo && redirectTo !== '/') ? redirectTo : '/dashboard'
    redirectUrl.pathname = destination
    redirectUrl.search = '' // Clear search params
    return NextResponse.redirect(redirectUrl)
  }

  // For client organization routes, verify membership is done in the layout
  // Middleware just ensures user is authenticated
  if (isClientOrgRoute && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/client/login'
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // For client select-org route, ensure user is authenticated
  if (isClientSelectOrgRoute && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/client/login'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - API routes (including auth callback)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

