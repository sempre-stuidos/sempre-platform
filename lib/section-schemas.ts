/**
 * Zod Schema Definitions for Page Sections
 * 
 * These schemas enforce strict validation to prevent structural drift between
 * local draft_content and published_content in Supabase.
 * 
 * All schemas enforce flat structures - no nested section objects allowed.
 */

import { z } from "zod";

// ============================================================================
// Luxivie Section Schemas
// ============================================================================

/**
 * HeroSection Schema
 * Enforces flat structure with heroImage and accentImage as string URLs
 */
export const HeroSectionSchema = z.object({
  badge: z.object({
    icon: z.string(),
    text: z.string(),
  }),
  title: z.string(),
  subtitle: z.string(),
  heroImage: z.string().url(), // Must be string URL, not object
  primaryCta: z.object({
    href: z.string(),
    label: z.string(),
  }),
  accentImage: z.string().url(), // Must be string URL, not object
  secondaryCta: z.object({
    href: z.string(),
    label: z.string(),
  }),
});

export type HeroSectionContent = z.infer<typeof HeroSectionSchema>;

/**
 * BrandPromise Schema
 */
export const BrandPromiseSchema = z.object({
  promises: z.array(
    z.object({
      icon: z.string(),
      title: z.string(),
      description: z.string(),
    })
  ),
});

export type BrandPromiseContent = z.infer<typeof BrandPromiseSchema>;

/**
 * IngredientTransparency Schema
 */
export const IngredientTransparencySchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  ingredients: z.array(
    z.object({
      icon: z.string(),
      name: z.string(),
      benefit: z.string(),
    })
  ).optional(),
  ctaLabel: z.string().optional(),
});

export type IngredientTransparencyContent = z.infer<typeof IngredientTransparencySchema>;

/**
 * FeaturedProducts Schema
 */
export const FeaturedProductsSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  products: z.array(
    z.object({
      name: z.string(),
      image: z.string().url(),
      benefits: z.array(z.string()),
      badge: z.string().nullable().optional(),
    })
  ).optional(),
});

export type FeaturedProductsContent = z.infer<typeof FeaturedProductsSchema>;

/**
 * BrandStory Schema
 */
export const BrandStorySchema = z.object({
  title: z.string().optional(),
  paragraphs: z.array(z.string()).optional(),
  image: z.string().url().optional(),
  ctaLabel: z.string().optional(),
});

export type BrandStoryContent = z.infer<typeof BrandStorySchema>;

/**
 * CustomerReviews Schema
 */
export const CustomerReviewsSchema = z.object({
  title: z.string().optional(),
  rating: z.number().optional(),
  subtitle: z.string().optional(),
  reviews: z.array(
    z.object({
      quote: z.string(),
      name: z.string(),
      location: z.string(),
      avatar: z.string().url().optional(),
      initials: z.string().optional(),
    })
  ).optional(),
});

export type CustomerReviewsContent = z.infer<typeof CustomerReviewsSchema>;

/**
 * HowToUse Schema
 */
export const HowToUseSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  steps: z.array(
    z.object({
      number: z.string(),
      icon: z.string(),
      title: z.string(),
      description: z.string(),
    })
  ).optional(),
  ctaLabel: z.string().optional(),
});

export type HowToUseContent = z.infer<typeof HowToUseSchema>;

/**
 * Sustainability Schema
 */
export const SustainabilitySchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  features: z.array(
    z.object({
      icon: z.string(),
      title: z.string(),
      description: z.string(),
    })
  ).optional(),
});

export type SustainabilityContent = z.infer<typeof SustainabilitySchema>;

/**
 * FinalCTA Schema
 */
export const FinalCTASchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  primaryCta: z.object({
    label: z.string(),
    href: z.string(),
  }).optional(),
  accentImage: z.string().url().optional(),
  trustBadges: z.array(
    z.object({
      icon: z.string(),
      text: z.string(),
    })
  ).optional(),
});

export type FinalCTAContent = z.infer<typeof FinalCTASchema>;

// ============================================================================
// Restaurant Section Schemas
// ============================================================================

/**
 * HeroWelcome Schema (same structure as HeroSection for restaurants)
 */
export const HeroWelcomeSchema = z.object({
  badge: z.object({
    icon: z.string(),
    text: z.string(),
  }),
  title: z.string(),
  subtitle: z.string(),
  heroImage: z.string().url(), // Must be string URL, not object
  primaryCta: z.object({
    href: z.string(),
    label: z.string(),
  }),
  accentImage: z.string().url(), // Must be string URL, not object
  secondaryCta: z.object({
    href: z.string(),
    label: z.string(),
  }),
});

export type HeroWelcomeContent = z.infer<typeof HeroWelcomeSchema>;

/**
 * InfoBar Schema
 */
export const InfoBarSchema = z.object({
  hours: z.string(),
  phone: z.string(),
  tagline: z.string(),
});

export type InfoBarContent = z.infer<typeof InfoBarSchema>;

/**
 * PromoCard Schema
 */
export const PromoCardSchema = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  hours: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaLink: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export type PromoCardContent = z.infer<typeof PromoCardSchema>;

/**
 * WhyWeStand Schema
 */
export const WhyWeStandSchema = z.object({
  reasons: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ),
});

export type WhyWeStandContent = z.infer<typeof WhyWeStandSchema>;

/**
 * Specialties Schema
 */
export const SpecialtiesSchema = z.object({
  specialties: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      image: z.string().url().optional(),
    })
  ),
});

export type SpecialtiesContent = z.infer<typeof SpecialtiesSchema>;

/**
 * GalleryTeaser Schema
 */
export const GalleryTeaserSchema = z.object({
  images: z.array(z.string().url()),
  ctaLabel: z.string().optional(),
});

export type GalleryTeaserContent = z.infer<typeof GalleryTeaserSchema>;

/**
 * CTABanner Schema
 */
export const CTABannerSchema = z.object({
  title: z.string(),
  description: z.string(),
  ctaLabel: z.string(),
});

export type CTABannerContent = z.infer<typeof CTABannerSchema>;

// ============================================================================
// Schema Registry
// ============================================================================

/**
 * Registry mapping component names to their Zod schemas
 */
export const sectionSchemas: Record<string, z.ZodSchema> = {
  HeroSection: HeroSectionSchema,
  HeroWelcome: HeroWelcomeSchema,
  BrandPromise: BrandPromiseSchema,
  IngredientTransparency: IngredientTransparencySchema,
  FeaturedProducts: FeaturedProductsSchema,
  BrandStory: BrandStorySchema,
  CustomerReviews: CustomerReviewsSchema,
  HowToUse: HowToUseSchema,
  Sustainability: SustainabilitySchema,
  FinalCTA: FinalCTASchema,
  InfoBar: InfoBarSchema,
  PromoCard: PromoCardSchema,
  WhyWeStand: WhyWeStandSchema,
  Specialties: SpecialtiesSchema,
  GalleryTeaser: GalleryTeaserSchema,
  CTABanner: CTABannerSchema,
};

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Get the Zod schema for a component type
 */
export function getSectionSchema(component: string): z.ZodSchema | null {
  return sectionSchemas[component] || null;
}

/**
 * Validate section content against its component's schema
 * Returns the parsed content if valid, throws ZodError if invalid
 */
export function validateSectionContent(
  component: string,
  content: unknown
): { success: true; data: unknown } | { success: false; error: string; details?: unknown } {
  const schema = getSectionSchema(component);
  
  if (!schema) {
    // Unknown component type - allow it but log a warning
    console.warn(`[validateSectionContent] No schema found for component: ${component}`);
    return { success: true, data: content };
  }

  try {
    const parsed = schema.parse(content);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ');
      return {
        success: false,
        error: `Validation failed for ${component}: ${errorMessage}`,
        details: error.issues,
      };
    }
    return {
      success: false,
      error: `Unexpected error validating ${component}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Safe parse section content - returns parsed data or null with error message
 */
export function safeParseSectionContent(
  component: string,
  content: unknown
): { success: true; data: unknown } | { success: false; error: string } {
  const schema = getSectionSchema(component);
  
  if (!schema) {
    return { success: true, data: content };
  }

  const result = schema.safeParse(content);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errorMessage = result.error.issues
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('; ');
    return {
      success: false,
      error: `Validation failed for ${component}: ${errorMessage}`,
    };
  }
}




























