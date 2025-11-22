/**
 * Add pepefinancial@gmail.com as a member of Johnny G's Cafe
 */

import { supabaseAdmin } from '../lib/supabase'

const BUSINESS_ID = '1e747513-7a53-434e-b0b8-622e055c244a' // New business ID after reset
const USER_EMAIL = 'pepefinancial@gmail.com'

async function addPepeToBusiness() {
  console.log('Adding pepefinancial to Johnny G\'s Cafe...\n')
  
  // Find user
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
  const user = usersData?.users?.find(u => 
    u.email?.toLowerCase() === USER_EMAIL.toLowerCase()
  )
  
  if (!user) {
    console.log(`❌ User ${USER_EMAIL} not found in auth system`)
    console.log('   Creating user...')
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: USER_EMAIL,
      password: 'TempPassword123!@#',
      email_confirm: true,
      user_metadata: {
        full_name: 'Pepe Financial',
      },
    })
    
    if (createError || !newUser.user) {
      console.error('❌ Error creating user:', createError)
      return
    }
    
    console.log(`✅ Created user: ${newUser.user.id}`)
    const userId = newUser.user.id
    
    // Check if membership already exists
    const { data: existingMembership } = await supabaseAdmin
      .from('memberships')
      .select('*')
      .eq('org_id', BUSINESS_ID)
      .eq('user_id', userId)
      .maybeSingle()
    
    if (existingMembership) {
      console.log('✅ Membership already exists')
      return
    }
    
    // Create membership
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('memberships')
      .insert({
        org_id: BUSINESS_ID,
        user_id: userId,
        role: 'admin',
      })
      .select()
      .single()
    
    if (membershipError) {
      console.error('❌ Error creating membership:', membershipError)
      return
    }
    
    console.log('✅ Membership created:', membership)
    return
  }
  
  console.log(`✅ User found: ${user.email} (ID: ${user.id})`)
  
  // Check if membership already exists
  const { data: existingMembership } = await supabaseAdmin
    .from('memberships')
    .select('*')
    .eq('org_id', BUSINESS_ID)
    .eq('user_id', user.id)
    .maybeSingle()
  
  if (existingMembership) {
    console.log('✅ Membership already exists:')
    console.log(`   Role: ${existingMembership.role}`)
    console.log(`   Org ID: ${existingMembership.org_id}`)
    return
  }
  
  // Create membership
  console.log('Creating membership...')
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('memberships')
    .insert({
      org_id: BUSINESS_ID,
      user_id: user.id,
      role: 'admin',
    })
    .select()
    .single()
  
  if (membershipError) {
    console.error('❌ Error creating membership:', membershipError)
    return
  }
  
  console.log('✅ Membership created successfully:')
  console.log(`   Role: ${membership.role}`)
  console.log(`   Org ID: ${membership.org_id}`)
  console.log(`   User ID: ${membership.user_id}`)
}

addPepeToBusiness()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

