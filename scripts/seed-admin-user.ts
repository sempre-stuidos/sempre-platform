/**
 * Seeder script to make "Yolxander Jaca Gonzalez" an admin user
 * This script ensures the user exists and has Admin role
 * 
 * Usage: npx tsx scripts/seed-admin-user.ts
 */

import { supabaseAdmin } from '../lib/supabase'
import { ensureProfileExists } from '../lib/profiles'

const ADMIN_EMAIL = 'yolxanderjaca@gmail.com'
const ADMIN_NAME = 'Yolxander Jaca Gonzalez'

async function seedAdminUser() {
  try {
    console.log('Seeding admin user...')
    console.log(`Email: ${ADMIN_EMAIL}`)
    console.log(`Name: ${ADMIN_NAME}\n`)
    
    // Check if user already exists in auth
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = usersData?.users?.find(user => 
      user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
    )
    
    let userId: string
    
    if (existingUser) {
      console.log('✅ User already exists in auth system')
      userId = existingUser.id
      
      // Update user metadata with name if needed
      if (existingUser.user_metadata?.full_name !== ADMIN_NAME) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            full_name: ADMIN_NAME,
          },
        })
        console.log('✅ Updated user metadata')
      }
    } else {
      console.log('⚠️  User not found in auth system')
      console.log('   Note: User must sign in via OAuth (Google) first')
      console.log('   This seeder will set up the profile and role once the user exists\n')
      
      // Try to find user by email in profiles (in case they exist but not in auth yet)
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', ADMIN_EMAIL)
        .maybeSingle()
      
      if (profileData) {
        userId = profileData.id
        console.log(`✅ Found profile for user: ${userId}`)
      } else {
        console.log('❌ User does not exist. Please sign in with Google OAuth first.')
        console.log('   After signing in, run this seeder again to assign Admin role.')
        process.exit(0)
      }
    }
    
    // Ensure profile exists
    console.log('\nEnsuring profile exists...')
    const profile = await ensureProfileExists(userId)
    if (profile) {
      // Update profile with name
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
      // Update role to Admin if it's not already
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
        process.exit(1)
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
    console.log(`   Name: ${finalProfile?.full_name || 'N/A'}`)
    console.log(`   Profile Role: ${finalProfile?.default_role || 'N/A'}`)
    console.log(`   System Role: ${finalRole?.role || 'N/A'}`)
    
    console.log('\n✅ Admin user seeded successfully!')
    console.log(`\n   ${ADMIN_NAME} (${ADMIN_EMAIL}) is now an Admin`)
    
  } catch (error) {
    console.error('❌ Error seeding admin user:', error)
    process.exit(1)
  }
}

// Run the seeder
seedAdminUser()
  .then(() => {
    console.log('\n✅ Seeder completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seeder failed:', error)
    process.exit(1)
  })

