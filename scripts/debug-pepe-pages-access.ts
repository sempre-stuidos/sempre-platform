/**
 * Debug why pepefinancial can't see pages
 */

import { supabaseAdmin } from '../lib/supabase'
import { createClient } from '@supabase/supabase-js'

const BUSINESS_ID = '1e747513-7a53-434e-b0b8-622e055c244a'
const USER_EMAIL = 'pepefinancial@gmail.com'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function debugPagesAccess() {
  console.log('Debugging pages access for pepefinancial...\n')
  
  // Step 1: Check user exists
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
  const user = usersData?.users?.find(u => 
    u.email?.toLowerCase() === USER_EMAIL.toLowerCase()
  )
  
  if (!user) {
    console.log('❌ User not found')
    return
  }
  
  console.log(`✅ User found: ${user.email} (${user.id})`)
  
  // Step 2: Check membership
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
    console.log('❌ No membership found!')
    console.log('   This is the problem - user needs membership to see pages via RLS')
    return
  }
  
  console.log(`✅ Membership found:`)
  console.log(`   Role: ${membership.role}`)
  console.log(`   Org ID: ${membership.org_id}`)
  console.log(`   User ID: ${membership.user_id}`)
  
  // Step 3: Check pages exist (using admin client - bypasses RLS)
  const { data: pagesAdmin, error: pagesAdminError } = await supabaseAdmin
    .from('pages')
    .select('*')
    .eq('org_id', BUSINESS_ID)
  
  if (pagesAdminError) {
    console.error('❌ Error fetching pages (admin):', pagesAdminError)
    return
  }
  
  console.log(`\n✅ Pages exist (admin can see): ${pagesAdmin?.length || 0}`)
  pagesAdmin?.forEach(page => {
    console.log(`   - ${page.name} (${page.slug}) - ${page.status}`)
  })
  
  // Step 4: Test RLS by simulating user access
  console.log(`\n🔒 Testing RLS access...`)
  
  // Create a session token for the user (simulate login)
  const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: USER_EMAIL,
  })
  
  if (sessionError) {
    console.log('⚠️  Could not generate session link, testing with direct query...')
    
    // Try to query as if we're the user using RLS
    // We can't actually simulate this without a real session, but we can check the policy
    console.log('\n📋 RLS Policy Check:')
    console.log('   The "Members can view their organization pages" policy requires:')
    console.log('   1. A membership record exists')
    console.log('   2. membership.org_id = pages.org_id')
    console.log('   3. membership.user_id = auth.uid()')
    console.log(`\n   ✅ Membership exists: ${membership ? 'YES' : 'NO'}`)
    console.log(`   ✅ Membership org_id matches: ${membership?.org_id === BUSINESS_ID ? 'YES' : 'NO'}`)
    console.log(`   ✅ Membership user_id matches: ${membership?.user_id === user.id ? 'YES' : 'NO'}`)
    
    if (membership && membership.org_id === BUSINESS_ID && membership.user_id === user.id) {
      console.log('\n   ✅ All RLS conditions should be met!')
      console.log('   The issue might be:')
      console.log('   1. User is not actually logged in (no auth.uid())')
      console.log('   2. Session expired')
      console.log('   3. Browser/client not sending auth token correctly')
    }
  } else {
    console.log('✅ Session link generated')
  }
  
  // Step 5: Check if there are multiple businesses with similar names
  console.log(`\n🔍 Checking for duplicate businesses...`)
  const { data: allBusinesses } = await supabaseAdmin
    .from('businesses')
    .select('id, name, slug')
    .order('created_at', { ascending: false })
  
  const johnnyBusinesses = allBusinesses?.filter(b => 
    b.name.toLowerCase().includes('johnny')
  ) || []
  
  if (johnnyBusinesses.length > 1) {
    console.log(`⚠️  Found ${johnnyBusinesses.length} businesses with "Johnny" in name:`)
    johnnyBusinesses.forEach(b => {
      console.log(`   - ${b.name} (${b.id})`)
    })
    console.log(`\n   This might be causing confusion!`)
  } else {
    console.log(`✅ Only one Johnny business found`)
  }
  
  // Step 6: Check what business ID the user might be accessing
  console.log(`\n📝 Summary:`)
  console.log(`   Current Business ID: ${BUSINESS_ID}`)
  console.log(`   Business Name: Johnny G's Cafe`)
  console.log(`   User: ${user.email}`)
  console.log(`   Membership: ${membership ? 'EXISTS' : 'MISSING'}`)
  console.log(`   Pages: ${pagesAdmin?.length || 0}`)
  console.log(`\n   If user is accessing a different business ID, they won't see pages!`)
  console.log(`   Make sure the URL uses: /client/${BUSINESS_ID}/restaurant/pages`)
}

debugPagesAccess()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

