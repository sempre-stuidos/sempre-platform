/**
 * Check pepefinancial@gmail.com membership and pages access
 */

import { supabaseAdmin } from '../lib/supabase'

const BUSINESS_ID = '58c49648-dc5a-4843-ace6-30f24611e17a'
const USER_EMAIL = 'pepefinancial@gmail.com'

async function checkMembership() {
  console.log('Checking membership and pages access...\n')
  
  // Find user
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
  const user = usersData?.users?.find(u => 
    u.email?.toLowerCase() === USER_EMAIL.toLowerCase()
  )
  
  if (!user) {
    console.log(`❌ User ${USER_EMAIL} not found in auth system`)
    return
  }
  
  console.log(`✅ User found: ${user.email} (ID: ${user.id})`)
  
  // Check membership
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('memberships')
    .select('*')
    .eq('org_id', BUSINESS_ID)
    .eq('user_id', user.id)
    .maybeSingle()
  
  if (membershipError) {
    console.error('❌ Error checking membership:', membershipError)
    return
  }
  
  if (!membership) {
    console.log(`❌ No membership found for ${USER_EMAIL} in business ${BUSINESS_ID}`)
    console.log('\nCreating membership...')
    
    const { data: newMembership, error: createError } = await supabaseAdmin
      .from('memberships')
      .insert({
        org_id: BUSINESS_ID,
        user_id: user.id,
        role: 'owner', // or 'admin', 'staff', 'client'
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error creating membership:', createError)
      return
    }
    
    console.log('✅ Membership created:', newMembership)
  } else {
    console.log(`✅ Membership found:`)
    console.log(`   Role: ${membership.role}`)
    console.log(`   Org ID: ${membership.org_id}`)
    console.log(`   User ID: ${membership.user_id}`)
  }
  
  // Check pages
  console.log('\nChecking pages...')
  const { data: pages, error: pagesError } = await supabaseAdmin
    .from('pages')
    .select('*')
    .eq('org_id', BUSINESS_ID)
  
  if (pagesError) {
    console.error('❌ Error checking pages:', pagesError)
    return
  }
  
  console.log(`✅ Found ${pages?.length || 0} pages for business:`)
  pages?.forEach(page => {
    console.log(`   - ${page.name} (${page.slug}) - ${page.status}`)
  })
  
  // Test RLS as the user
  console.log('\nTesting RLS access as user...')
  const { data: { session } } = await supabaseAdmin.auth.signInWithPassword({
    email: USER_EMAIL,
    password: 'TempPassword123!@#' // This might not work if password was changed
  })
  
  if (session) {
    const { data: pagesAsUser, error: pagesErrorAsUser } = await supabaseAdmin
      .from('pages')
      .select('*')
      .eq('org_id', BUSINESS_ID)
    
    if (pagesErrorAsUser) {
      console.error('❌ RLS Error:', pagesErrorAsUser)
    } else {
      console.log(`✅ User can see ${pagesAsUser?.length || 0} pages via RLS`)
    }
  } else {
    console.log('⚠️  Could not sign in as user (password may have changed)')
  }
}

checkMembership()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

