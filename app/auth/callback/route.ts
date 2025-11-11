import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { linkUserToRole } from '@/lib/invitations'
import { linkTeamMemberToAuthUser } from '@/lib/team'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
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

    if (session?.user) {
      const user = session.user
      const email = user.email?.toLowerCase()

      if (email) {
        try {
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
          console.error('Error linking user to role/team member:', error)
          // Continue with redirect even if linking fails
          // The user can still sign in, and we can handle this later
        }
      }
    }

    // Redirect to the intended page or dashboard
    return NextResponse.redirect(new URL(next, request.url))
  }

  // If no code, redirect to login
  return NextResponse.redirect(new URL('/login', request.url))
}

