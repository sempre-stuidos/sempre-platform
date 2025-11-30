import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserBusinesses } from '@/lib/businesses'

/**
 * Auth callback route - handles redirects for authenticated users
 * This route is primarily for backward compatibility and edge cases.
 * Email/password login happens directly in the login components.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const rawNext = requestUrl.searchParams.get('next') || '/dashboard'
  // Normalize redirectTo - convert '/' to '/dashboard'
  const next = rawNext === '/' ? '/dashboard' : rawNext

  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  // Get current user session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session || !session.user) {
    // No session - redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const user = session.user
  const email = user.email?.toLowerCase()

  if (!email) {
    return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent('No email found in user account'), request.url))
  }

  // Check user role and redirect accordingly
  let redirectPath = next
  try {
    // Check user role using supabaseAdmin to bypass RLS
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    // If no role found, also check by email (in case user_id wasn't set yet)
    let finalRole = userRole?.role
    if (!finalRole) {
      const { data: roleByEmail } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('invited_email', email)
        .maybeSingle()
      finalRole = roleByEmail?.role
    }

    console.log('Auth callback - User role check:', { userId: user.id, email, role: finalRole, roleError })

    if (finalRole === 'Admin') {
      redirectPath = '/dashboard'
    } else if (finalRole === 'Client') {
      // Get user's organizations
      const organizations = await getUserBusinesses(user.id, supabaseAdmin)
      
      console.log('Auth callback - Client user organizations:', organizations.length)
      
      if (organizations && organizations.length > 0) {
        // Redirect to first organization's client dashboard
        // If multiple orgs, user can select from client/select-org
        if (organizations.length === 1) {
          redirectPath = `/client/${organizations[0].id}/dashboard`
        } else {
          // Multiple organizations - redirect to select-org
          redirectPath = '/client/select-org'
        }
      } else {
        // Client role but no organizations - still redirect to select-org
        redirectPath = '/client/select-org'
      }
      
      console.log('Auth callback - Redirecting Client to:', redirectPath)
    }
  } catch (error) {
    console.error('Error checking user role for redirect:', error)
    // Continue with original redirect path if error
  }

  // Create the redirect response
  const redirectTo = new URL(redirectPath, request.url)
  const redirectResponse = NextResponse.redirect(redirectTo)
  
  // Copy all Supabase auth cookies to the redirect response
  cookieStore.getAll().forEach((cookie) => {
    if (cookie.name.startsWith('sb-')) {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }
  })
  
  return redirectResponse
}
