import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
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

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all users from auth.users
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Get all existing user_roles to filter out users who already have roles
    const { data: existingRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .not('user_id', 'is', null)

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user roles' },
        { status: 500 }
      )
    }

    // Create a set of user IDs that already have roles
    const usersWithRoles = new Set(
      existingRoles?.map(role => role.user_id).filter(Boolean) || []
    )

    // Filter out users who already have roles and format the response
    const availableUsers = (usersData?.users || [])
      .filter(user => !usersWithRoles.has(user.id))
      .map(user => {
        const metadata = user.user_metadata || {}
        return {
          id: user.id,
          email: user.email || '',
          name: metadata.full_name || metadata.name || user.email?.split('@')[0] || 'Unknown',
          avatar: metadata.avatar_url || metadata.picture || '',
        }
      })

    return NextResponse.json({ success: true, users: availableUsers })
  } catch (error) {
    console.error('Error in available users API route:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

