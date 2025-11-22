/**
 * Verify pages are correctly set up for Johnny G's Cafe
 */

import { supabaseAdmin } from '../lib/supabase'

async function verifySetup() {
  console.log('🔍 Verifying Pages Setup for Johnny G\'s Cafe\n')
  console.log('=' .repeat(60))
  
  // 1. Find Johnny G's Cafe
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('id, name, slug, type, status')
    .ilike('name', '%Johnny%')
    .maybeSingle()
  
  if (!business) {
    console.log('❌ Johnny G\'s Cafe not found!')
    return
  }
  
  console.log('\n✅ BUSINESS FOUND:')
  console.log(`   Name: ${business.name}`)
  console.log(`   ID: ${business.id}`)
  console.log(`   Slug: ${business.slug}`)
  console.log(`   Type: ${business.type}`)
  console.log(`   Status: ${business.status}`)
  
  // 2. Check pages
  const { data: pages } = await supabaseAdmin
    .from('pages')
    .select('id, name, slug, org_id, status')
    .eq('org_id', business.id)
  
  console.log(`\n✅ PAGES ATTACHED: ${pages?.length || 0}`)
  if (pages && pages.length > 0) {
    pages.forEach(page => {
      console.log(`   - ${page.name} (${page.slug}) - ${page.status}`)
      console.log(`     Page ID: ${page.id}`)
      console.log(`     Org ID: ${page.org_id}`)
      console.log(`     ✅ Matches business: ${page.org_id === business.id ? 'YES' : 'NO'}`)
    })
  } else {
    console.log('   ⚠️  NO PAGES FOUND!')
  }
  
  // 3. Check sections
  if (pages && pages.length > 0) {
    for (const page of pages) {
      const { data: sections } = await supabaseAdmin
        .from('page_sections_v2')
        .select('id, key, label, component, position, status, org_id')
        .eq('page_id', page.id)
        .order('position', { ascending: true })
      
      console.log(`\n   📄 Sections for "${page.name}": ${sections?.length || 0}`)
      if (sections && sections.length > 0) {
        sections.forEach(section => {
          console.log(`      - ${section.label} (${section.component}) - ${section.status}`)
          console.log(`        Section org_id: ${section.org_id}`)
          console.log(`        ✅ Matches business: ${section.org_id === business.id ? 'YES' : 'NO'}`)
        })
      }
    }
  }
  
  // 4. Check memberships
  const { data: memberships } = await supabaseAdmin
    .from('memberships')
    .select('id, user_id, org_id, role')
    .eq('org_id', business.id)
  
  console.log(`\n✅ MEMBERSHIPS: ${memberships?.length || 0}`)
  if (memberships && memberships.length > 0) {
    for (const membership of memberships) {
      const { data: user } = await supabaseAdmin.auth.admin.getUserById(membership.user_id)
      console.log(`   - ${user?.user?.email || 'Unknown'} (${membership.role})`)
      console.log(`     User ID: ${membership.user_id}`)
      console.log(`     Org ID: ${membership.org_id}`)
      console.log(`     ✅ Matches business: ${membership.org_id === business.id ? 'YES' : 'NO'}`)
    }
  } else {
    console.log('   ⚠️  NO MEMBERSHIPS FOUND!')
  }
  
  // 5. Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📋 SUMMARY:')
  console.log(`   Business ID: ${business.id}`)
  console.log(`   Pages: ${pages?.length || 0}`)
  console.log(`   Memberships: ${memberships?.length || 0}`)
  
  if (pages && pages.length > 0 && memberships && memberships.length > 0) {
    console.log('\n   ✅ Everything looks correct!')
    console.log(`\n   🔗 Use this URL to access pages:`)
    console.log(`      /client/${business.id}/restaurant/pages`)
    console.log(`\n   ⚠️  If you're using a different business ID in the URL,`)
    console.log(`      you won't see the pages!`)
  } else {
    console.log('\n   ⚠️  Setup incomplete!')
    if (!pages || pages.length === 0) {
      console.log('      - Missing pages')
    }
    if (!memberships || memberships.length === 0) {
      console.log('      - Missing memberships')
    }
  }
}

verifySetup()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

