/**
 * Script to create a super admin user
 * Run this script once to create the super admin user with Admin role
 * 
 * Usage: npx tsx scripts/create-super-admin.ts
 */

import { supabaseAdmin } from '../lib/supabase'
import { ensureProfileExists } from '../lib/profiles'

const SUPER_ADMIN_EMAIL = 'yolxanderjaca@gmail.com'
const SUPER_ADMIN_NAME = 'Yolxander Jaca Gonzalez'
const SUPER_ADMIN_PASSWORD = 'TempPassword123!@#' // User should change this on first login

async function createSuperAdmin() {
  try {
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
        process.exit(1)
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
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (existingRole) {
      // Update role to Admin if it's not already
      const { data: currentRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()
      
      if (currentRole?.role !== 'Admin') {
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
        process.exit(1)
      }
      
      console.log('Admin role assigned successfully')
    }
    
    console.log('\n✅ Super admin user created successfully!')
    console.log(`Email: ${SUPER_ADMIN_EMAIL}`)
    console.log(`Name: ${SUPER_ADMIN_NAME}`)
    console.log(`Password: ${SUPER_ADMIN_PASSWORD}`)
    console.log('\n⚠️  Please change the password after first login!')
    
  } catch (error) {
    console.error('Error creating super admin:', error)
    process.exit(1)
  }
}

// Run the script
createSuperAdmin()
  .then(() => {
    console.log('\nScript completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })

