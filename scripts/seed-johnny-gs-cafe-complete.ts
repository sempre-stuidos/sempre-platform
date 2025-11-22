/**
 * Complete seeder for Johnny G's Cafe
 * 1. Seeds admin user (yolxanderjaca@gmail.com)
 * 2. Creates Johnny G's Cafe business
 * 3. Creates Home page with all sections based on example-restaurant project
 * 
 * Usage: npx tsx scripts/seed-johnny-gs-cafe-complete.ts
 */

import { supabaseAdmin } from '../lib/supabase'
import { ensureProfileExists } from '../lib/profiles'
import { createBusiness } from '../lib/businesses'
import { createPage } from '../lib/pages'

const ADMIN_EMAIL = 'yolxanderjaca@gmail.com'
const ADMIN_NAME = 'Yolxander Jaca Gonzalez'

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

async function seedAdminUser(): Promise<string | null> {
  console.log('Step 1: Seeding admin user...')
  console.log(`Email: ${ADMIN_EMAIL}`)
  console.log(`Name: ${ADMIN_NAME}\n`)
  
  // Check if user already exists in auth
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
  const existingUser = usersData?.users?.find(user => 
    user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  )
  
  let userId: string
  
  if (existingUser) {
    console.log('✅ User already exists in auth system')
    userId = existingUser.id
    
    // Update user metadata with name if needed
    if (existingUser.user_metadata?.full_name !== ADMIN_NAME) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: ADMIN_NAME,
        },
      })
      console.log('✅ Updated user metadata')
    }
  } else {
    console.log('⚠️  User not found in auth system')
    console.log('   Note: User must sign in via OAuth (Google) first')
    console.log('   This seeder will set up the profile and role once the user exists\n')
    
    // Try to find user by email in profiles
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', ADMIN_EMAIL)
      .maybeSingle()
    
    if (profileData) {
      userId = profileData.id
      console.log(`✅ Found profile for user: ${userId}`)
    } else {
      console.log('⚠️  User does not exist yet.')
      console.log('   Will create business without membership.')
      console.log('   User can be added as member after signing in.\n')
      return null // Return null to indicate user doesn't exist
    }
  }
  
  // Ensure profile exists
  console.log('\nEnsuring profile exists...')
  const profile = await ensureProfileExists(userId)
  if (profile) {
    await supabaseAdmin
      .from('profiles')
      .update({ 
        full_name: ADMIN_NAME,
        default_role: 'admin'
      })
      .eq('id', userId)
    console.log('✅ Profile updated with admin default role')
  }
  
  // Check if Admin role already exists
  console.log('\nChecking user roles...')
  const { data: existingRole } = await supabaseAdmin
    .from('user_roles')
    .select('id, role')
    .eq('user_id', userId)
    .maybeSingle()
  
  if (existingRole) {
    if (existingRole.role !== 'Admin') {
      await supabaseAdmin
        .from('user_roles')
        .update({ role: 'Admin' })
        .eq('user_id', userId)
      console.log('✅ Role updated to Admin')
    } else {
      console.log('✅ User already has Admin role')
    }
  } else {
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'Admin',
        invited_email: ADMIN_EMAIL.toLowerCase(),
      })
    
    if (roleError) {
      console.error('❌ Error assigning Admin role:', roleError)
      throw roleError
    }
    
    console.log('✅ Admin role assigned successfully')
  }
  
  console.log(`\n✅ Admin user seeded: ${ADMIN_NAME} (${ADMIN_EMAIL})`)
  return userId
}

async function createJohnnyGsCafeBusiness(creatorId: string | null): Promise<string> {
  console.log('\nStep 2: Creating Johnny G\'s Cafe business...')
  
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
  
  // If no creator ID, create business directly
  if (!creatorId) {
    console.log('Creating business directly (no creator user)...')
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
  
  // Create business with creator
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
  console.log('\nStep 3: Creating Home page with sections...')
  
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
  
  // Create sections based on example-restaurant project
  console.log('\nCreating page sections (based on example-restaurant)...')
  
  const sections = [
    {
      key: 'info_bar',
      label: 'Top Bar – Hours Strip',
      component: 'InfoBar',
      position: 1,
      content: {
        hours: "Hours: 5PM - 11PM Daily",
        phone: "+1 (555) 123-4567",
        tagline: "Fine Dining Experience"
      }
    },
    {
      key: 'hero_welcome',
      label: 'Hero – Welcome to Restaurant',
      component: 'HeroWelcome',
      position: 2,
      content: {
        title: "Culinary Excellence",
        subtitle: "Experience an unforgettable evening of refined cuisine and impeccable service",
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
            title: "Seasonal Ingredients",
            description: "We source the finest locally-grown produce, partnering with regional farmers for the freshest offerings each season."
          },
          {
            title: "Expert Preparation",
            description: "Our award-winning chefs bring years of international experience to every plate, crafting dishes that tell a story."
          },
          {
            title: "Refined Ambiance",
            description: "Intimate lighting, carefully curated acoustics, and thoughtful design create the perfect setting for your special occasion."
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
            title: "Evening Tasting Menu",
            description: "Our chef's carefully curated multi-course experience, showcasing the best of seasonal cuisine.",
            image: "/fine-dining-tasting-menu-plating.jpg"
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
          "/gourmet-food-presentation.jpg"
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
        title: "Ready to Dine with Us?",
        description: "Reserve your table now and prepare for an unforgettable culinary journey",
        ctaLabel: "Book Your Reservation"
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
      // Update existing section to match example-restaurant content
      const { error: updateError } = await supabaseAdmin
        .from('page_sections_v2')
        .update({
          label: section.label,
          component: section.component,
          position: section.position,
          published_content: section.content,
          draft_content: section.content,
          status: 'published',
        })
        .eq('id', existingSection.id)
      
      if (updateError) {
        console.error(`  ❌ Error updating section "${section.label}":`, updateError)
        throw updateError
      }
      
      console.log(`  ✅ Updated section: ${section.label}`)
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

async function seedComplete() {
  try {
    console.log('🌱 Starting complete seeder for Johnny G\'s Cafe...\n')
    
    // Step 1: Seed admin user (may return null if user doesn't exist)
    const adminUserId = await seedAdminUser()
    
    // Step 2: Create business
    const businessId = await createJohnnyGsCafeBusiness(adminUserId)
    
    // Step 3: Create Home page with sections
    await createHomePageWithSections(businessId)
    
    // Step 4: Verify
    console.log('\n📋 Final Verification:')
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
    
    let membershipInfo = 'No membership'
    if (adminUserId) {
      const { data: membership } = await supabaseAdmin
        .from('memberships')
        .select('user_id, role')
        .eq('org_id', businessId)
        .eq('user_id', adminUserId)
        .maybeSingle()
      membershipInfo = membership ? `${membership.role} role` : 'No membership (super admin)'
    }
    
    console.log(`   Admin User: ${ADMIN_NAME} (${ADMIN_EMAIL})${adminUserId ? ` (ID: ${adminUserId})` : ' (not found - will be added after sign-in)'}`)
    console.log(`   Business: ${business?.name} (${business?.slug})`)
    console.log(`   Type: ${business?.type}, Status: ${business?.status}`)
    console.log(`   Membership: ${membershipInfo}`)
    console.log(`   Page: ${page?.name} (${page?.slug}), Status: ${page?.status}`)
    console.log(`   Sections: ${sections?.length || 0}`)
    if (sections && sections.length > 0) {
      sections.forEach((s, idx) => {
        console.log(`     ${idx + 1}. ${s.label} (${s.component}) - ${s.status}`)
      })
    }
    
    console.log('\n✅ Complete seeder finished successfully!')
    console.log(`\n   Admin: ${ADMIN_NAME} (${ADMIN_EMAIL})`)
    console.log(`   Business: ${BUSINESS_NAME}`)
    console.log(`   Business ID: ${businessId}`)
    console.log(`   Home page ready at: /client/${businessId}/restaurant/pages`)
    
  } catch (error) {
    console.error('❌ Error in complete seeder:', error)
    process.exit(1)
  }
}

// Run the seeder
seedComplete()
  .then(() => {
    console.log('\n✅ Seeder completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seeder failed:', error)
    process.exit(1)
  })

