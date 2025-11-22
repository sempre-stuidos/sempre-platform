/**
 * Check which pages are attached to which businesses
 */

import { supabaseAdmin } from '../lib/supabase'

async function checkPagesBusinessMapping() {
  console.log('Checking pages and business mapping...\n')
  
  // Find Johnny G's Cafe
  const { data: businesses, error: businessesError } = await supabaseAdmin
    .from('businesses')
    .select('id, name, slug, type, status')
    .ilike('name', '%Johnny%')
    .order('created_at', { ascending: false })
  
  if (businessesError) {
    console.error('❌ Error fetching businesses:', businessesError)
    return
  }
  
  console.log(`Found ${businesses?.length || 0} businesses with "Johnny" in name:\n`)
  businesses?.forEach(business => {
    console.log(`  - ${business.name}`)
    console.log(`    ID: ${business.id}`)
    console.log(`    Slug: ${business.slug}`)
    console.log(`    Type: ${business.type}, Status: ${business.status}`)
  })
  
  // Check all pages
  console.log('\n\nChecking all pages...\n')
  const { data: allPages, error: pagesError } = await supabaseAdmin
    .from('pages')
    .select('id, name, slug, org_id, status')
    .order('created_at', { ascending: false })
  
  if (pagesError) {
    console.error('❌ Error fetching pages:', pagesError)
    return
  }
  
  console.log(`Found ${allPages?.length || 0} total pages:\n`)
  
  // Group pages by business
  const pagesByBusiness = new Map<string, any[]>()
  
  for (const page of allPages || []) {
    if (!pagesByBusiness.has(page.org_id)) {
      pagesByBusiness.set(page.org_id, [])
    }
    pagesByBusiness.get(page.org_id)!.push(page)
  }
  
  // For each business, show its pages
  for (const [businessId, pages] of pagesByBusiness.entries()) {
    // Get business name
    const business = businesses?.find(b => b.id === businessId)
    const businessName = business?.name || 'Unknown Business'
    
    console.log(`\n📁 ${businessName} (${businessId}):`)
    console.log(`   Pages: ${pages.length}`)
    pages.forEach(page => {
      console.log(`     - ${page.name} (${page.slug}) - ${page.status}`)
    })
  }
  
  // Check if Johnny G's Cafe has pages
  const johnnyGsCafe = businesses?.find(b => 
    b.name.toLowerCase().includes("johnny") && 
    b.name.toLowerCase().includes("cafe")
  )
  
  if (johnnyGsCafe) {
    console.log(`\n\n🎯 Johnny G's Cafe Details:`)
    console.log(`   ID: ${johnnyGsCafe.id}`)
    console.log(`   Slug: ${johnnyGsCafe.slug}`)
    
    const johnnyPages = allPages?.filter(p => p.org_id === johnnyGsCafe.id) || []
    console.log(`   Pages: ${johnnyPages.length}`)
    
    if (johnnyPages.length === 0) {
      console.log(`   ⚠️  NO PAGES FOUND for Johnny G's Cafe!`)
      console.log(`\n   This is the problem - pages need to be attached to this business.`)
    } else {
      johnnyPages.forEach(page => {
        console.log(`     ✅ ${page.name} (${page.slug}) - ${page.status}`)
      })
    }
  } else {
    console.log(`\n\n❌ Johnny G's Cafe not found!`)
  }
  
  // Check for orphaned pages (pages with org_id that doesn't match any business)
  console.log(`\n\nChecking for orphaned pages...\n`)
  const allBusinessIds = new Set(businesses?.map(b => b.id) || [])
  const orphanedPages = allPages?.filter(p => !allBusinessIds.has(p.org_id)) || []
  
  if (orphanedPages.length > 0) {
    console.log(`⚠️  Found ${orphanedPages.length} orphaned pages (org_id doesn't match any business):`)
    orphanedPages.forEach(page => {
      console.log(`     - ${page.name} (${page.slug}) - org_id: ${page.org_id}`)
    })
  } else {
    console.log(`✅ No orphaned pages found`)
  }
}

checkPagesBusinessMapping()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

