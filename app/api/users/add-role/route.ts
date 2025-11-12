import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { type UserRole } from '@/lib/invitations'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { userId, role } = body

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: 'User ID and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles: UserRole[] = ['Admin', 'Manager', 'Member', 'Developer', 'Designer', 'Client']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Get user details to get email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userError || !userData?.user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const email = userData.user.email?.toLowerCase()
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'User email not found' },
        { status: 400 }
      )
    }

    // Check if user already has a role by user_id
    const { data: existingRoleByUserId } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingRoleByUserId) {
      return NextResponse.json(
        { success: false, error: 'User already has a role assigned' },
        { status: 400 }
      )
    }

    // Check if email already exists in user_roles (unique constraint)
    const { data: existingRoleByEmail } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('invited_email', email)
      .maybeSingle()

    if (existingRoleByEmail) {
      // If it's a pending invitation (user_id is null), update it
      if (existingRoleByEmail.user_id === null) {
        const { error: updateError } = await supabaseAdmin
          .from('user_roles')
          .update({ 
            user_id: userId,
            role,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRoleByEmail.id)

        if (updateError) {
          console.error('Error updating pending invitation:', updateError)
          return NextResponse.json(
            { 
              success: false, 
              error: `Failed to update existing invitation: ${updateError.message || 'Unknown error'}` 
            },
            { status: 500 }
          )
        }

        return NextResponse.json({ success: true })
      } else {
        // Email exists and is already assigned to another user
        return NextResponse.json(
          { success: false, error: 'This email is already associated with another user role' },
          { status: 400 }
        )
      }
    }

    // Insert user role
    const { error: insertError, data: insertData } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role,
        invited_email: email,
      })
      .select()

    if (insertError) {
      console.error('Error adding user role:', insertError)
      console.error('Error details:', JSON.stringify(insertError, null, 2))
      
      // Provide more specific error messages
      let errorMessage = 'Failed to add user role'
      if (insertError.code === '23505') {
        errorMessage = 'This user or email already has a role assigned'
      } else if (insertError.code === '23503') {
        errorMessage = 'Invalid user ID - user does not exist'
      } else if (insertError.message) {
        errorMessage = insertError.message
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? insertError : undefined
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in add user role API route:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

