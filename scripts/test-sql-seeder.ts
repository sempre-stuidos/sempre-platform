/**
 * Test the PostgreSQL function to seed admin user
 */

import { supabaseAdmin } from '../lib/supabase'

async function testSQLSeeder() {
  console.log('Testing PostgreSQL seed_admin_user function...\n')
  
  const { data, error } = await supabaseAdmin.rpc('seed_admin_user', {
    user_email: 'yolxanderjaca@gmail.com',
    user_name: 'Yolxander Jaca Gonzalez'
  })
  
  if (error) {
    console.error('❌ Error calling function:', error)
    process.exit(1)
  }
  
  if (data && data.length > 0) {
    const result = data[0]
    console.log('✅ Function executed successfully:')
    console.log(`   User ID: ${result.user_id}`)
    console.log(`   Email: ${result.email}`)
    console.log(`   Full Name: ${result.full_name}`)
    console.log(`   Profile Role: ${result.profile_role}`)
    console.log(`   System Role: ${result.system_role}`)
    console.log(`   Success: ${result.success}`)
    console.log(`   Message: ${result.message}`)
  } else {
    console.log('No data returned')
  }
}

testSQLSeeder()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

