import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ensureProfileExists } from '@/lib/profiles'

const SUPER_ADMIN_EMAIL = 'yolxanderjaca@gmail.com'
const SUPER_ADMIN_NAME = 'Yolxander Jaca Gonzalez'
const SUPER_ADMIN_PASSWORD = 'TempPassword123!@#' // User should change this on first login

/**
 * API endpoint to create super admin user
 * This should be called once to set up the super admin
 * For security, you might want to add additional checks or run this as a one-time script
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add a secret key check for security
    const authHeader = request.headers.get('authorization')
    const secretKey = process.env.SUPER_ADMIN_SECRET_KEY
    
    if (secretKey && authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('Creating super admin user...')
    
    // Check if user already exists
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = usersData?.users?.find(user => 
      user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
    )
    
    let userId: string
    
    if (existingUser) {
      console.log('User already exists, updating...')
      userId = existingUser.id
      
      // Update user metadata with name
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: SUPER_ADMIN_NAME,
        },
      })
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: SUPER_ADMIN_NAME,
        },
      })
      
      if (createError || !newUser.user) {
        console.error('Error creating user:', createError)
        return NextResponse.json(
          { error: createError?.message || 'Failed to create user' },
          { status: 500 }
        )
      }
      
      userId = newUser.user.id
      console.log('User created successfully:', userId)
    }
    
    // Ensure profile exists
    const profile = await ensureProfileExists(userId)
    if (profile) {
      // Update profile with name
      await supabaseAdmin
        .from('profiles')
        .update({ full_name: SUPER_ADMIN_NAME })
        .eq('id', userId)
      console.log('Profile updated')
    }
    
    // Check if Admin role already exists
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id, role')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (existingRole) {
      // Update role to Admin if it's not already
      if (existingRole.role !== 'Admin') {
        await supabaseAdmin
          .from('user_roles')
          .update({ role: 'Admin' })
          .eq('user_id', userId)
        console.log('Role updated to Admin')
      } else {
        console.log('User already has Admin role')
      }
    } else {
      // Create Admin role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'Admin',
          invited_email: SUPER_ADMIN_EMAIL.toLowerCase(),
        })
      
      if (roleError) {
        console.error('Error assigning Admin role:', roleError)
        return NextResponse.json(
          { error: roleError.message || 'Failed to assign Admin role' },
          { status: 500 }
        )
      }
      
      console.log('Admin role assigned successfully')
    }
    
    return NextResponse.json({
      success: true,
      message: 'Super admin user created/updated successfully',
      email: SUPER_ADMIN_EMAIL,
      name: SUPER_ADMIN_NAME,
      note: 'Please change the password after first login',
    })
    
  } catch (error) {
    console.error('Error creating super admin:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

