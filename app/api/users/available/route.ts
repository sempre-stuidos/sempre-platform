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

    // Get orgId from query params if provided
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    // Get all users from auth.users
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // If orgId provided, filter out users already in that organization
    let excludedUserIds = new Set<string>()
    if (orgId) {
      const { data: existingMembers, error: membersError } = await supabaseAdmin
        .from('memberships')
        .select('user_id')
        .eq('org_id', orgId)

      if (!membersError && existingMembers) {
        excludedUserIds = new Set(existingMembers.map(m => m.user_id).filter(Boolean))
      }
    }

    // Filter out users who are already members (if orgId provided) and format the response
    const availableUsers = (usersData?.users || [])
      .filter(user => !excludedUserIds.has(user.id))
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

