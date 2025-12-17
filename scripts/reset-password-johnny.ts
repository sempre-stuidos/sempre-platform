/**
 * Reset password for johnnygs478@gmail.com
 * Usage: npx tsx scripts/reset-password-johnny.ts
 */

import { supabaseAdmin } from '../lib/supabase'

const USER_EMAIL = 'johnnygs478@gmail.com'
const NEW_PASSWORD = 'TempPassword123!@#' // User should change this on first login

async function resetPassword() {
  try {
    console.log(`Resetting password for ${USER_EMAIL}...\n`)
    
    // Find the user
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError)
      process.exit(1)
    }
    
    const user = usersData?.users?.find(u => 
      u.email?.toLowerCase() === USER_EMAIL.toLowerCase()
    )
    
    if (!user) {
      console.error(`❌ User ${USER_EMAIL} not found`)
      process.exit(1)
    }
    
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)
    
    // Update password
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        password: NEW_PASSWORD,
      }
    )
    
    if (updateError) {
      console.error('❌ Error updating password:', updateError)
      process.exit(1)
    }
    
    console.log('\n✅ Password reset successfully!')
    console.log(`\n📧 Email: ${USER_EMAIL}`)
    console.log(`🔑 Temporary Password: ${NEW_PASSWORD}`)
    console.log('\n⚠️  Please change this password after first login!')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

resetPassword()

