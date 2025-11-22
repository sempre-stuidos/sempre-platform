/**
 * Test RLS policy directly by simulating user query
 */

import { supabaseAdmin } from '../lib/supabase'
import { createClient } from '@supabase/supabase-js'

const BUSINESS_ID = '1e747513-7a53-434e-b0b8-622e055c244a'
const USER_EMAIL = 'pepefinancial@gmail.com'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testRLSDirectly() {
  console.log('Testing RLS policy directly...\n')
  
  // Get user
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
  const user = usersData?.users?.find(u => 
    u.email?.toLowerCase() === USER_EMAIL.toLowerCase()
  )
  
  if (!user) {
    console.log('❌ User not found')
    return
  }
  
  console.log(`✅ User: ${user.email} (${user.id})`)
  
  // Check membership
  const { data: membership } = await supabaseAdmin
    .from('memberships')
    .select('*')
    .eq('org_id', BUSINESS_ID)
    .eq('user_id', user.id)
    .maybeSingle()
  
  if (!membership) {
    console.log('❌ No membership found')
    return
  }
  
  console.log(`✅ Membership: ${membership.role}`)
  
  // Check pages exist
  const { data: pagesAdmin } = await supabaseAdmin
    .from('pages')
    .select('*')
    .eq('org_id', BUSINESS_ID)
  
  console.log(`✅ Pages (admin): ${pagesAdmin?.length || 0}`)
  
  // Now test with user session
  console.log('\n🔒 Testing with user session...')
  
  // Create a session for the user
  const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: USER_EMAIL,
  })
  
  if (sessionError) {
    console.error('❌ Error generating session:', sessionError)
    return
  }
  
  // Create client with user session
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  
  // Set the session
  if (sessionData.properties?.hashed_token) {
    // Try to query as the user
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ Error getting user:', userError)
    } else {
      console.log(`✅ Current user: ${currentUser?.email || 'None'}`)
    }
    
    // Try to query pages
    console.log('\n📄 Querying pages as user...')
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('*')
      .eq('org_id', BUSINESS_ID)
      .order('name', { ascending: true })
    
    if (pagesError) {
      console.error('❌ RLS Error:', JSON.stringify(pagesError, null, 2))
      console.error('   Code:', pagesError.code)
      console.error('   Message:', pagesError.message)
      console.error('   Details:', pagesError.details)
      console.error('   Hint:', pagesError.hint)
    } else {
      console.log(`✅ Pages (user): ${pages?.length || 0}`)
      pages?.forEach(page => {
        console.log(`   - ${page.name} (${page.slug})`)
      })
    }
  } else {
    console.log('⚠️  Could not get session token')
  }
  
  // Alternative: Test the RLS policy SQL directly
  console.log('\n🔍 Testing RLS policy SQL...')
  const { data: rlsTest, error: rlsError } = await supabaseAdmin.rpc('test_pages_rls', {
    test_user_id: user.id,
    test_org_id: BUSINESS_ID,
  })
  
  if (rlsError) {
    console.log('   (RPC function not available, skipping)')
  } else {
    console.log('   RLS test result:', rlsTest)
  }
}

testRLSDirectly()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

