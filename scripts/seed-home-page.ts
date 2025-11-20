#!/usr/bin/env tsx
/**
 * Seed Home Page Script
 * 
 * This script seeds a home page with sections for an organization.
 * Usage: 
 *   npx tsx scripts/seed-home-page.ts <org-slug>
 *   or
 *   npx tsx scripts/seed-home-page.ts <org-id>
 * 
 * If no argument is provided, it will seed for the first organization found.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedHomePage(orgIdentifier: string | null) {
  try {
    console.log('🌱 Starting home page seeding...')

    // Get organization
    let orgId: string | null = null
    let orgSlug: string | null = null

    if (orgIdentifier) {
      // Check if it's a UUID (org ID) or a slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgIdentifier)
      
      if (isUUID) {
        const { data: org, error } = await supabase
          .from('businesses')
          .select('id, slug, name')
          .eq('id', orgIdentifier)
          .single()

        if (error || !org) {
          console.error('❌ Organization not found:', error)
          process.exit(1)
        }

        orgId = org.id
        orgSlug = org.slug
        console.log(`✅ Found organization: ${org.name} (${org.id})`)
      } else {
        const { data: org, error } = await supabase
          .from('businesses')
          .select('id, slug, name')
          .eq('slug', orgIdentifier)
          .single()

        if (error || !org) {
          console.error('❌ Organization not found:', error)
          process.exit(1)
        }

        orgId = org.id
        orgSlug = org.slug
        console.log(`✅ Found organization: ${org.name} (${org.id})`)
      }
    } else {
      // Get first organization
      const { data: orgs, error } = await supabase
        .from('businesses')
        .select('id, slug, name')
        .limit(1)

      if (error || !orgs || orgs.length === 0) {
        console.error('❌ No organizations found. Please create an organization first.')
        process.exit(1)
      }

      const org = orgs[0]
      orgId = org.id
      orgSlug = org.slug
      console.log(`✅ Using first organization: ${org.name} (${org.id})`)
    }

    if (!orgId) {
      console.error('❌ Could not determine organization ID')
      process.exit(1)
    }

    // Ensure organization has a slug
    if (!orgSlug) {
      // Generate a slug from the organization name
      const { data: org } = await supabase
        .from('businesses')
        .select('name')
        .eq('id', orgId)
        .single()

      if (org) {
        const generatedSlug = org.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
        
        const { error: updateError } = await supabase
          .from('businesses')
          .update({ slug: generatedSlug })
          .eq('id', orgId)

        if (updateError) {
          console.error('❌ Error updating organization slug:', updateError)
        } else {
          orgSlug = generatedSlug
          console.log(`✅ Generated and set slug: ${orgSlug}`)
        }
      }
    }

    // Call the seed function
    const { data, error } = await supabase.rpc('seed_home_page_for_org', {
      org_uuid: orgId
    })

    if (error) {
      console.error('❌ Error seeding home page:', error)
      process.exit(1)
    }

    console.log('✅ Home page seeded successfully!')
    console.log(`📄 Page ID: ${data}`)
    console.log(`🌐 Public URL: http://localhost:3001/?page=home`)
    console.log(`🔗 Preview URL (after editing): http://localhost:3001/?page=home&token=<preview-token>`)
    console.log(`\n💡 Next steps:`)
    console.log(`   1. Visit http://localhost:3000/client/${orgId}/restaurant/pages`)
    console.log(`   2. Click "Edit" on the Home Page`)
    console.log(`   3. Edit sections and preview your changes!`)

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Get command line argument
const orgIdentifier = process.argv[2] || null

seedHomePage(orgIdentifier)
  .then(() => {
    console.log('\n✨ Seeding complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error)
    process.exit(1)
  })

