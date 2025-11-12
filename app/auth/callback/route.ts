import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { linkUserToRole } from '@/lib/invitations'
import { linkTeamMemberToAuthUser } from '@/lib/team'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const rawNext = requestUrl.searchParams.get('next') || '/dashboard'
  // Normalize redirectTo - convert '/' to '/dashboard'
  const next = rawNext === '/' ? '/dashboard' : rawNext

  // Check for OAuth errors from the provider
  if (error) {
    const errorMsg = errorDescription || error || 'OAuth authentication failed'
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMsg)}`, request.url))
  }

  if (!code) {
    // Log all query parameters for debugging
    const allParams = Array.from(requestUrl.searchParams.entries())
    console.error('No authorization code received. Query params:', allParams)
    console.error('Full URL:', requestUrl.toString())
    
    // If no code, redirect to login with error
    return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent('No authorization code received. Please try signing in again.'), request.url))
  }

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

  // Exchange code for session
  const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

  if (sessionError) {
    console.error('Error exchanging code for session:', sessionError)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(sessionError.message)}`, request.url))
  }

  if (!session || !session.user) {
    return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent('No session created'), request.url))
  }

  const user = session.user
  const email = user.email?.toLowerCase()

  if (!email) {
    return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent('No email found in user account'), request.url))
  }

  try {
    // Check if this email already exists in auth.users (excluding the current user)
    // This ensures only registered users can sign in with Google
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
    
    // Find users with the same email (excluding the current user)
    const existingUsers = usersData?.users?.filter(u => 
      u.email?.toLowerCase() === email && u.id !== user.id
    ) || []

    // Check if user was just created (created_at is very recent, within last minute)
    const userCreatedAt = new Date(user.created_at)
    const now = new Date()
    const timeDiff = now.getTime() - userCreatedAt.getTime()
    const isNewUser = timeDiff < 60000 // Less than 1 minute old

    // If this is a new user (just created by Google OAuth)
    if (isNewUser) {
      // Check if email exists in user_roles (invited users)
      const { data: invitedRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('invited_email', email)
        .maybeSingle()

      // If email exists in auth.users (registered via email/password), allow sign-in (account linking)
      // OR if email is in user_roles (invited), allow sign-in
      if (existingUsers.length === 0 && !invitedRole) {
        // Email is not registered and not invited - reject sign-in
        // Delete the newly created user
        await supabaseAdmin.auth.admin.deleteUser(user.id)
        
        // Sign out the user
        await supabase.auth.signOut()
        
        // Clear any cookies and redirect with error
        const errorResponse = NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent('Your email is not registered. Please contact an administrator to receive an invitation.')}`, request.url)
        )
        // Clear auth cookies
        cookieStore.getAll().forEach((cookie) => {
          if (cookie.name.startsWith('sb-')) {
            errorResponse.cookies.delete(cookie.name)
          }
        })
        return errorResponse
      }
      
      // If there's an existing user with this email, we should link accounts
      // For now, we'll allow the Google OAuth user to sign in
      // In the future, you might want to merge accounts or use the existing user's account
      if (existingUsers.length > 0) {
        // User exists - this is account linking scenario
        // The Google OAuth user will be a separate account, but with the same email
        // You might want to handle this differently (e.g., merge accounts)
        console.log(`Account linking: Google OAuth user ${user.id} has same email as existing user(s)`)
      }
    }

    // If we get here, the user is allowed to sign in
    // Check if user has a pending invitation and link them to role
    const roleResult = await linkUserToRole(user.id, email)

    if (roleResult.success && roleResult.role) {
      // Get user info from Google OAuth metadata
      const fullName = user.user_metadata?.full_name || 
                     (user.user_metadata?.first_name && user.user_metadata?.last_name
                       ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                       : user.user_metadata?.name || 
                         user.email?.split('@')[0] || 
                         'User')
      const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture

      // Link/create team member record
      await linkTeamMemberToAuthUser(
        user.id,
        email,
        fullName,
        avatar
      )
    }
  } catch (error) {
    console.error('Error in OAuth callback:', error)
    // If there's an error, still allow the user to sign in
    // They might be an existing user trying to link their Google account
  }

  // Create the redirect response now that we know the user is allowed
  // The cookies are already set in the cookieStore, so we just need to redirect
  const redirectTo = new URL(next, request.url)
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

