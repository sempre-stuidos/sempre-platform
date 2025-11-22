/**
 * Seeder script to create "Johnny G's Cafe" business with Home page and sections
 * 
 * Usage: npx tsx scripts/seed-johnny-gs-cafe.ts
 */

import { supabaseAdmin } from '../lib/supabase'
import { createBusiness } from '../lib/businesses'
import { createPage } from '../lib/pages'

const BUSINESS_NAME = "Johnny G's Cafe"
const BUSINESS_TYPE = 'restaurant' as const
const BUSINESS_SLUG = 'johnny-gs-cafe'

const BUSINESS_DATA = {
  description: "A cozy neighborhood cafe serving fresh, locally-sourced ingredients with a focus on comfort food and community.",
  address: "123 Main Street, Downtown District, CA 90210",
  phone: "+1 (555) 123-4567",
  email: "info@johnnygscafe.com",
  website: "https://www.johnnygscafe.com",
  status: 'active' as const,
}

async function findOrCreateAdminUser(): Promise<string> {
  // Try to find an admin user
  const { data: adminRoles } = await supabaseAdmin
    .from('user_roles')
    .select('user_id')
    .eq('role', 'Admin')
    .limit(1)
  
  if (adminRoles && adminRoles.length > 0) {
    return adminRoles[0].user_id
  }
  
  // If no admin found, try to find any user
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
  if (usersData?.users && usersData.users.length > 0) {
    return usersData.users[0].id
  }
  
  // If no users exist, we'll need to create the business directly
  // For now, throw an error
  throw new Error('No users found. Please create a user first or sign in.')
}

async function createJohnnyGsCafeBusiness(): Promise<string> {
  console.log('Creating business...')
  
  // Check if business already exists
  const { data: existingBusiness } = await supabaseAdmin
    .from('businesses')
    .select('id, name, slug')
    .or(`name.eq.${BUSINESS_NAME},slug.eq.${BUSINESS_SLUG}`)
    .limit(1)
    .maybeSingle()
  
  if (existingBusiness) {
    console.log(`✅ Business already exists: ${existingBusiness.name} (ID: ${existingBusiness.id})`)
    return existingBusiness.id
  }
  
  // Find or get an admin user to create the business
  let creatorId: string
  try {
    creatorId = await findOrCreateAdminUser()
    console.log(`Using creator ID: ${creatorId}`)
  } catch (error) {
    console.log('⚠️  No users found. Creating business directly...')
    // Create business directly without membership
    const { data: newBusiness, error: createError } = await supabaseAdmin
      .from('businesses')
      .insert({
        name: BUSINESS_NAME,
        type: BUSINESS_TYPE,
        description: BUSINESS_DATA.description,
        address: BUSINESS_DATA.address,
        phone: BUSINESS_DATA.phone,
        email: BUSINESS_DATA.email,
        website: BUSINESS_DATA.website,
        status: BUSINESS_DATA.status,
        slug: BUSINESS_SLUG,
      })
      .select('id')
      .single()
    
    if (createError || !newBusiness) {
      throw new Error(createError?.message || 'Failed to create business')
    }
    
    console.log(`✅ Created business: ${BUSINESS_NAME} (ID: ${newBusiness.id})`)
    return newBusiness.id
  }
  
  // Use createBusiness function which handles membership
  const result = await createBusiness(
    BUSINESS_NAME,
    BUSINESS_TYPE,
    creatorId,
    BUSINESS_DATA.description,
    BUSINESS_DATA.address,
    BUSINESS_DATA.phone,
    BUSINESS_DATA.email,
    BUSINESS_DATA.website,
    undefined, // logo_url
    BUSINESS_DATA.status
  )
  
  if (!result.success || !result.business) {
    throw new Error(result.error || 'Failed to create business')
  }
  
  // Update slug if not set
  if (!result.business.slug) {
    await supabaseAdmin
      .from('businesses')
      .update({ slug: BUSINESS_SLUG })
      .eq('id', result.business.id)
  }
  
  console.log(`✅ Created business: ${BUSINESS_NAME} (ID: ${result.business.id})`)
  return result.business.id
}

async function createHomePageWithSections(businessId: string): Promise<void> {
  console.log('\nCreating Home page...')
  
  // Check if Home page already exists
  const { data: existingPage } = await supabaseAdmin
    .from('pages')
    .select('id, name, slug')
    .eq('org_id', businessId)
    .eq('slug', 'home')
    .maybeSingle()
  
  let pageId: string
  
  if (existingPage) {
    console.log(`✅ Home page already exists (ID: ${existingPage.id})`)
    pageId = existingPage.id
  } else {
    // Create Home page
    const pageResult = await createPage(businessId, {
      name: 'Home Page',
      slug: 'home',
      template: 'default_home',
      status: 'published',
    }, supabaseAdmin)
    
    if (!pageResult.success || !pageResult.page) {
      throw new Error(pageResult.error || 'Failed to create Home page')
    }
    
    pageId = pageResult.page.id
    console.log(`✅ Created Home page (ID: ${pageId})`)
  }
  
  // Create sections
  console.log('\nCreating page sections...')
  
  const sections = [
    {
      key: 'info_bar',
      label: 'Top Bar – Hours Strip',
      component: 'InfoBar',
      position: 1,
      content: {
        hours: "Hours: 7AM - 9PM Daily",
        phone: "+1 (555) 123-4567",
        tagline: "Fresh & Friendly Neighborhood Cafe"
      }
    },
    {
      key: 'hero_welcome',
      label: 'Hero – Welcome to Cafe',
      component: 'HeroWelcome',
      position: 2,
      content: {
        title: "Welcome to Johnny G's Cafe",
        subtitle: "Experience fresh, locally-sourced comfort food in a warm, community-focused atmosphere",
        ctaLabel: "View Our Menu",
        imageUrl: "/elegant-restaurant-interior.png"
      }
    },
    {
      key: 'why_we_stand',
      label: 'Why People Love Us',
      component: 'WhyWeStand',
      position: 3,
      content: {
        reasons: [
          {
            title: "Fresh Ingredients",
            description: "We source the finest locally-grown produce, partnering with regional farmers for the freshest offerings each season."
          },
          {
            title: "Friendly Service",
            description: "Our team brings years of hospitality experience, creating a welcoming atmosphere where every guest feels like family."
          },
          {
            title: "Community Focus",
            description: "We're more than a cafe—we're a gathering place where neighbors come together to share great food and conversation."
          }
        ]
      }
    },
    {
      key: 'specialties',
      label: 'Our Specialties',
      component: 'Specialties',
      position: 4,
      content: {
        specialties: [
          {
            title: "Breakfast Classics",
            description: "Start your day with our signature morning selections, from delicate pastries to hearty egg preparations.",
            image: "/gourmet-breakfast.png"
          },
          {
            title: "Fresh Sandwiches",
            description: "Handcrafted sandwiches made with artisanal bread, premium meats, and locally-sourced vegetables.",
            image: "/fine-dining-tasting-menu-plating.jpg"
          },
          {
            title: "Homemade Desserts",
            description: "Daily-baked pastries, cakes, and treats made from scratch with love and attention to detail.",
            image: "/luxury-desserts-plating-presentation.jpg"
          }
        ]
      }
    },
    {
      key: 'gallery_teaser',
      label: 'Gallery Teaser',
      component: 'GalleryTeaser',
      position: 5,
      content: {
        images: [
          "/plated-fine-dining-dish.jpg",
          "/elegant-restaurant-dining-room.jpg",
          "/gourmet-food-presentation.jpg",
          "/upscale-restaurant-dining-room-with-warm-lighting.jpg"
        ],
        ctaLabel: "View Full Gallery"
      }
    },
    {
      key: 'cta_banner',
      label: 'Call to Action Banner',
      component: 'CTABanner',
      position: 6,
      content: {
        title: "Ready to Visit Us?",
        description: "Come by for a meal or reserve a table for your next gathering. We'd love to welcome you!",
        ctaLabel: "Book Your Table"
      }
    }
  ]
  
  let createdCount = 0
  let skippedCount = 0
  
  for (const section of sections) {
    // Check if section already exists
    const { data: existingSection } = await supabaseAdmin
      .from('page_sections_v2')
      .select('id')
      .eq('page_id', pageId)
      .eq('key', section.key)
      .maybeSingle()
    
    if (existingSection) {
      console.log(`  ⏭️  Section "${section.label}" already exists, skipping...`)
      skippedCount++
      continue
    }
    
    // Create section
    const { error: sectionError } = await supabaseAdmin
      .from('page_sections_v2')
      .insert({
        page_id: pageId,
        org_id: businessId,
        key: section.key,
        label: section.label,
        component: section.component,
        position: section.position,
        published_content: section.content,
        draft_content: section.content,
        status: 'published',
      })
    
    if (sectionError) {
      console.error(`  ❌ Error creating section "${section.label}":`, sectionError)
      throw sectionError
    }
    
    console.log(`  ✅ Created section: ${section.label}`)
    createdCount++
  }
  
  console.log(`\n✅ Sections created: ${createdCount}, skipped: ${skippedCount}`)
}

async function seedJohnnyGsCafe() {
  try {
    console.log('🌱 Seeding Johnny G\'s Cafe...\n')
    
    // Step 1: Create business
    const businessId = await createJohnnyGsCafeBusiness()
    
    // Step 2: Create Home page with sections
    await createHomePageWithSections(businessId)
    
    // Step 3: Verify
    console.log('\n📋 Verification:')
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('id, name, slug, type, status')
      .eq('id', businessId)
      .single()
    
    const { data: page } = await supabaseAdmin
      .from('pages')
      .select('id, name, slug, status')
      .eq('org_id', businessId)
      .eq('slug', 'home')
      .single()
    
    const { data: sections } = await supabaseAdmin
      .from('page_sections_v2')
      .select('id, key, label, component, position, status')
      .eq('page_id', page?.id)
      .order('position', { ascending: true })
    
    console.log(`   Business: ${business?.name} (${business?.slug})`)
    console.log(`   Type: ${business?.type}, Status: ${business?.status}`)
    console.log(`   Page: ${page?.name} (${page?.slug}), Status: ${page?.status}`)
    console.log(`   Sections: ${sections?.length || 0}`)
    if (sections && sections.length > 0) {
      sections.forEach((s, idx) => {
        console.log(`     ${idx + 1}. ${s.label} (${s.component}) - ${s.status}`)
      })
    }
    
    console.log('\n✅ Seeding completed successfully!')
    console.log(`\n   Business: ${BUSINESS_NAME}`)
    console.log(`   Business ID: ${businessId}`)
    console.log(`   Home page is ready to be managed at /client/${businessId}/restaurant/pages`)
    
  } catch (error) {
    console.error('❌ Error seeding Johnny G\'s Cafe:', error)
    process.exit(1)
  }
}

// Run the seeder
seedJohnnyGsCafe()
  .then(() => {
    console.log('\n✅ Seeder completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seeder failed:', error)
    process.exit(1)
  })

