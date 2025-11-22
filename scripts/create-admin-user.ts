/**
 * Seeder script to create admin user "yolxanderjaca@gmail.com"
 * Creates the user in auth system and assigns Admin role
 * 
 * Usage: npx tsx scripts/create-admin-user.ts
 */

import { supabaseAdmin } from '../lib/supabase'
import { ensureProfileExists } from '../lib/profiles'

const ADMIN_EMAIL = 'yolxanderjaca@gmail.com'
const ADMIN_NAME = 'Yolxander Jaca Gonzalez'
const TEMP_PASSWORD = 'TempPassword123!@#' // User should change this on first login

async function createAdminUser() {
  try {
    console.log('Creating admin user...')
    console.log(`Email: ${ADMIN_EMAIL}`)
    console.log(`Name: ${ADMIN_NAME}\n`)
    
    // Check if user already exists
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = usersData?.users?.find(user => 
      user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
    )
    
    let userId: string
    
    if (existingUser) {
      console.log('✅ User already exists in auth system')
      userId = existingUser.id
      
      // Update user metadata with name
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: ADMIN_NAME,
        },
      })
      console.log('✅ Updated user metadata')
    } else {
      console.log('Creating new user in auth system...')
      
      // Create user via Admin API
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: TEMP_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: ADMIN_NAME,
        },
      })
      
      if (createError || !newUser.user) {
        console.error('❌ Error creating user:', createError)
        throw createError || new Error('Failed to create user')
      }
      
      userId = newUser.user.id
      console.log(`✅ Created user: ${userId}`)
      console.log(`⚠️  Temporary password: ${TEMP_PASSWORD}`)
      console.log(`   Please change password after first login!`)
    }
    
    // Ensure profile exists
    console.log('\nEnsuring profile exists...')
    const profile = await ensureProfileExists(userId)
    if (profile) {
      await supabaseAdmin
        .from('profiles')
        .update({ 
          full_name: ADMIN_NAME,
          default_role: 'admin'
        })
        .eq('id', userId)
      console.log('✅ Profile updated with admin default role')
    } else {
      console.log('⚠️  Could not ensure profile exists')
    }
    
    // Check if Admin role already exists
    console.log('\nChecking user roles...')
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id, role')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (existingRole) {
      if (existingRole.role !== 'Admin') {
        await supabaseAdmin
          .from('user_roles')
          .update({ role: 'Admin' })
          .eq('user_id', userId)
        console.log('✅ Role updated to Admin')
      } else {
        console.log('✅ User already has Admin role')
      }
    } else {
      // Create Admin role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'Admin',
          invited_email: ADMIN_EMAIL.toLowerCase(),
        })
      
      if (roleError) {
        console.error('❌ Error assigning Admin role:', roleError)
        throw roleError
      }
      
      console.log('✅ Admin role assigned successfully')
    }
    
    // Verify the setup
    console.log('\n📋 Verification:')
    const { data: finalProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, default_role')
      .eq('id', userId)
      .single()
    
    const { data: finalRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()
    
    console.log(`   User ID: ${userId}`)
    console.log(`   Email: ${ADMIN_EMAIL}`)
    console.log(`   Name: ${finalProfile?.full_name || 'N/A'}`)
    console.log(`   Profile Role: ${finalProfile?.default_role || 'N/A'}`)
    console.log(`   System Role: ${finalRole?.role || 'N/A'}`)
    
    console.log('\n✅ Admin user created successfully!')
    console.log(`\n   ${ADMIN_NAME} (${ADMIN_EMAIL}) is now an Admin`)
    if (!existingUser) {
      console.log(`   Temporary password: ${TEMP_PASSWORD}`)
      console.log(`   ⚠️  Please change password after first login!`)
    }
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    process.exit(1)
  }
}

// Run the seeder
createAdminUser()
  .then(() => {
    console.log('\n✅ Seeder completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seeder failed:', error)
    process.exit(1)
  })

