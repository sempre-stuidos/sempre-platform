/**
 * Test pepefinancial's access to pages
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const BUSINESS_ID = '58c49648-dc5a-4843-ace6-30f24611e17a'
const USER_EMAIL = 'pepefinancial@gmail.com'

async function testPagesAccess() {
  console.log('Testing pages access for pepefinancial...\n')
  
  // Create a client (simulating what the server does)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  // Try to sign in (this won't work without password, but let's check the query)
  console.log('Note: This test requires the user to be logged in.')
  console.log('Checking pages query structure...\n')
  
  // Check membership
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.log('⚠️  No user session. This test requires authentication.')
    console.log('   The issue is likely that the user needs to be logged in.')
    return
  }
  
  console.log(`✅ User authenticated: ${user.email} (${user.id})`)
  
  // Check membership
  const { data: membership, error: membershipError } = await supabase
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
    console.log(`❌ No membership found for ${user.email} in business ${BUSINESS_ID}`)
    return
  }
  
  console.log(`✅ Membership found: ${membership.role}`)
  
  // Try to fetch pages
  console.log('\nFetching pages...')
  const { data: pages, error: pagesError } = await supabase
    .from('pages')
    .select('*')
    .eq('org_id', BUSINESS_ID)
    .order('name', { ascending: true })
  
  if (pagesError) {
    console.error('❌ Error fetching pages:', pagesError)
    console.error('   Code:', pagesError.code)
    console.error('   Message:', pagesError.message)
    console.error('   Details:', pagesError.details)
    console.error('   Hint:', pagesError.hint)
    return
  }
  
  console.log(`✅ Successfully fetched ${pages?.length || 0} pages:`)
  pages?.forEach(page => {
    console.log(`   - ${page.name} (${page.slug}) - ${page.status}`)
  })
}

testPagesAccess()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

