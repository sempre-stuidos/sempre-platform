/**
 * Complete seeder for Luxivie Clean Beauty
 * 1. Seeds admin user (yolxanderjaca@gmail.com)
 * 2. Creates Luxivie business
 * 3. Creates Home page with all sections based on luxivie-landing Page project
 * 
 * Usage: npx tsx scripts/seed-luxivie-complete.ts
 */

import { supabaseAdmin } from '../lib/supabase'
import { ensureProfileExists } from '../lib/profiles'
import { createBusiness } from '../lib/businesses'
import { createPage } from '../lib/pages'

const ADMIN_EMAIL = 'yolxanderjaca@gmail.com'
const ADMIN_NAME = 'Yolxander Jaca Gonzalez'

const BUSINESS_NAME = "Luxivie"
const BUSINESS_TYPE = 'retail' as const
const BUSINESS_SLUG = 'luxivie'

const BUSINESS_DATA = {
  description: "Clean beauty crafted with care in Canada. Luxurious hair care and skincare with clean ingredients, gentle botanicals, and modern science.",
  address: "Toronto, Ontario, Canada",
  phone: "+1 (555) 987-6543",
  email: "hello@luxivie.com",
  website: "https://www.luxivie.com",
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
      return null
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

async function createLuxivieBusiness(creatorId: string | null): Promise<string> {
  console.log('\nStep 2: Creating Luxivie business...')
  
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
  
  // Create sections based on luxivie-landing Page project
  console.log('\nCreating page sections (based on luxivie-landing Page)...')
  
  const sections = [
    {
      key: 'hero_section',
      label: 'Hero Section',
      component: 'HeroSection',
      position: 1,
      content: {
        badge: {
          icon: 'Leaf',
          text: 'Made in Canada'
        },
        title: 'Clean Beauty That Works—Made With Care in Canada',
        subtitle: 'Luxurious hair care and skincare crafted with clean ingredients, gentle botanicals, and modern science.',
        primaryCta: {
          label: 'Shop Bestsellers',
          href: '#products'
        },
        secondaryCta: {
          label: 'See Our Ingredients',
          href: '#ingredients'
        },
        heroImage: 'https://images.unsplash.com/photo-1739980213756-753aea153bb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBiZWF1dHklMjBwcm9kdWN0JTIwbWFyYmxlfGVufDF8fHx8MTc2MzQ5NzkyN3ww&ixlib=rb-4.1.0&q=80&w=1080',
        accentImage: 'https://images.unsplash.com/photo-1763154045793-4be5374b3e70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldWNhbHlwdHVzJTIwbGVhdmVzJTIwbWluaW1hbGlzdHxlbnwxfHx8fDE3NjM0OTc5Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080'
      }
    },
    {
      key: 'brand_promise',
      label: 'Brand Promise',
      component: 'BrandPromise',
      position: 2,
      content: {
        promises: [
          {
            icon: 'MapPin',
            title: 'Made in Canada',
            description: 'Crafted with clean formulas in trusted GMP-certified facilities.'
          },
          {
            icon: 'FlaskConical',
            title: 'Backed by Clean Science',
            description: 'Effective botanical ingredients—safe, gentle, and performance-driven.'
          },
          {
            icon: 'Sparkles',
            title: 'Luxurious Yet Affordable',
            description: 'Premium results without premium pricing.'
          }
        ]
      }
    },
    {
      key: 'ingredient_transparency',
      label: 'Ingredient Transparency',
      component: 'IngredientTransparency',
      position: 3,
      content: {
        title: 'Pure, Tested, and Transparent',
        subtitle: 'Every ingredient is chosen for a reason',
        ingredients: [
          {
            icon: 'Leaf',
            name: 'Rosemary Extract',
            benefit: 'Scalp stimulation'
          },
          {
            icon: 'Droplets',
            name: 'Peppermint Oil',
            benefit: 'Cooling + soothing'
          },
          {
            icon: 'Zap',
            name: 'Biotin',
            benefit: 'Strengthening'
          },
          {
            icon: 'Shield',
            name: 'Keratin',
            benefit: 'Smoothing'
          },
          {
            icon: 'Sparkles',
            name: 'Natural Oils Blend',
            benefit: 'Nourish + shine'
          }
        ],
        ctaLabel: 'See Full Ingredient Breakdown'
      }
    },
    {
      key: 'featured_products',
      label: 'Featured Products',
      component: 'FeaturedProducts',
      position: 4,
      content: {
        title: 'Luxivie Bestsellers',
        subtitle: 'Our most-loved formulas for healthier, stronger hair',
        products: [
          {
            name: 'Rosemary + Mint Hair Oil',
            image: 'https://images.unsplash.com/photo-1549049950-48d5887197a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb3NlbWFyeSUyMG9pbCUyMGJvdHRsZXxlbnwxfHx8fDE3NjM0OTc5Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080',
            benefits: [
              'Stimulates scalp for healthier growth',
              'Cooling peppermint sensation',
              '100% natural botanical blend'
            ],
            badge: 'Bestseller'
          },
          {
            name: 'Rosemary Shampoo + Conditioner Set',
            image: 'https://images.unsplash.com/photo-1747858989102-cca0f4dc4a11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaGFtcG9vJTIwYm90dGxlJTIwY2xlYW58ZW58MXx8fHwxNzYzNDk3OTI4fDA&ixlib=rb-4.1.0&q=80&w=1080',
            benefits: [
              'Gentle cleansing without sulfates',
              'Strengthens & adds shine',
              'Safe for color-treated hair'
            ],
            badge: null
          },
          {
            name: 'Biotin-Keratin Strengthening Duo',
            image: 'https://images.unsplash.com/photo-1739980213756-753aea153bb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBiZWF1dHklMjBwcm9kdWN0JTIwbWFyYmxlfGVufDF8fHx8MTc2MzQ5NzkyN3ww&ixlib=rb-4.1.0&q=80&w=1080',
            benefits: [
              'Repairs damaged strands',
              'Reduces breakage & split ends',
              'Long-lasting smoothness'
            ],
            badge: 'Coming Soon'
          }
        ]
      }
    },
    {
      key: 'brand_story',
      label: 'Brand Story',
      component: 'BrandStory',
      position: 5,
      content: {
        title: 'Clean Beauty Rooted in Canada',
        paragraphs: [
          'Luxivie was created to bring high-quality, clean, effective, and affordable beauty to Canadians.',
          'We believe that everyone deserves access to products that are both luxurious and transparent. That\'s why every formula is crafted with care, using botanical ingredients backed by modern science.',
          'Some products are 100% made in Canada, while others are formulated here and crafted in trusted GMP-certified facilities abroad—always meeting Health Canada and FDA standards.',
          'From our bottles to your beauty ritual, Luxivie is a promise of purity, performance, and pride.'
        ],
        image: 'https://images.unsplash.com/photo-1763154045793-4be5374b3e70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldWNhbHlwdHVzJTIwbGVhdmVzJTIwbWluaW1hbGlzdHxlbnwxfHx8fDE3NjM0OTc5Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080',
        ctaLabel: 'Our Story'
      }
    },
    {
      key: 'customer_reviews',
      label: 'Customer Reviews',
      component: 'CustomerReviews',
      position: 6,
      content: {
        title: 'Customer Love',
        rating: 5,
        subtitle: 'Trusted by 10,000+ happy customers across Canada',
        reviews: [
          {
            quote: 'My hair has never felt this full. The rosemary oil has become my holy grail product!',
            name: 'Sarah M.',
            location: 'Toronto, ON',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
            initials: 'SM'
          },
          {
            quote: 'Clean, fresh scent. Canadian brand I trust. Love supporting local businesses that care.',
            name: 'Jessica K.',
            location: 'Vancouver, BC',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
            initials: 'JK'
          },
          {
            quote: 'Affordable luxury. My new go-to. Finally found products that work without breaking the bank.',
            name: 'Emily R.',
            location: 'Montreal, QC',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
            initials: 'ER'
          }
        ]
      }
    },
    {
      key: 'how_to_use',
      label: 'How To Use',
      component: 'HowToUse',
      position: 7,
      content: {
        title: 'Your Hair Care Ritual',
        subtitle: 'Simple steps for transformative results',
        steps: [
          {
            number: '1',
            icon: 'Droplets',
            title: 'Apply 2–3 drops to scalp',
            description: 'Focus on areas that need extra care'
          },
          {
            number: '2',
            icon: 'HandMetal',
            title: 'Massage gently',
            description: 'Use circular motions to stimulate blood flow'
          },
          {
            number: '3',
            icon: 'Clock',
            title: 'Leave overnight or 30 minutes',
            description: 'Let the botanicals work their magic'
          },
          {
            number: '4',
            icon: 'Sparkles',
            title: 'Rinse with Luxivie Shampoo',
            description: 'For best results, use our complete system'
          }
        ],
        ctaLabel: 'See Full Routine'
      }
    },
    {
      key: 'sustainability',
      label: 'Sustainability',
      component: 'Sustainability',
      position: 8,
      content: {
        title: 'Sustainability + Quality',
        subtitle: 'Good for your hair, good for the planet',
        features: [
          {
            icon: 'Leaf',
            title: 'Clean Ingredients',
            description: 'No harmful chemicals'
          },
          {
            icon: 'Droplet',
            title: 'No Parabens / No Sulfates',
            description: 'Gentle on hair & scalp'
          },
          {
            icon: 'Heart',
            title: 'Cruelty-Free',
            description: 'Never tested on animals'
          },
          {
            icon: 'Award',
            title: 'GMP Certified',
            description: 'Quality you can trust'
          },
          {
            icon: 'Recycle',
            title: 'Recyclable Packaging',
            description: 'Better for the planet'
          },
          {
            icon: 'Palette',
            title: 'Safe for Color-Treated Hair',
            description: 'Protects your investment'
          }
        ]
      }
    },
    {
      key: 'final_cta',
      label: 'Final CTA',
      component: 'FinalCTA',
      position: 9,
      content: {
        title: 'Ready for stronger, healthier hair?',
        subtitle: 'Join thousands of Canadians who\'ve discovered the power of clean, botanical beauty',
        primaryCta: {
          label: 'Shop Luxivie Now',
          href: '#products'
        },
        accentImage: 'https://images.unsplash.com/photo-1763154045793-4be5374b3e70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldWNhbHlwdHVzJTIwbGVhdmVzJTIwbWluaW1hbGlzdHxlbnwxfHx8fDE3NjM0OTc5Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080',
        trustBadges: [
          {
            icon: 'Package',
            text: 'Fast shipping across Canada'
          },
          {
            icon: 'Shield',
            text: 'Trusted by 10,000+ customers'
          }
        ],
        footer: {
          brandName: 'LUXIVIE',
          tagline: 'Clean beauty crafted with care in Canada',
          links: {
            shop: ['Hair Care', 'Bestsellers', 'Gift Sets', 'New Arrivals'],
            about: ['Our Story', 'Ingredients', 'Sustainability', 'Reviews'],
            support: ['Contact Us', 'FAQs', 'Shipping', 'Returns']
          },
          copyright: '© 2025 Luxivie. All rights reserved. Made with care in Canada. 🍁'
        }
      }
    }
  ]
  
  let createdCount = 0
  let updatedCount = 0
  
  for (const section of sections) {
    // Check if section already exists
    const { data: existingSection } = await supabaseAdmin
      .from('page_sections_v2')
      .select('id')
      .eq('page_id', pageId)
      .eq('key', section.key)
      .maybeSingle()
    
    if (existingSection) {
      // Update existing section
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
      updatedCount++
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
  
  console.log(`\n✅ Sections created: ${createdCount}, updated: ${updatedCount}`)
}

async function seedComplete() {
  try {
    console.log('🌱 Starting complete seeder for Luxivie...\n')
    
    // Step 1: Seed admin user (may return null if user doesn't exist)
    const adminUserId = await seedAdminUser()
    
    // Step 2: Create business
    const businessId = await createLuxivieBusiness(adminUserId)
    
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
    console.log(`   Home page ready at: /client/${businessId}/retail/pages`)
    
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

