/**
 * Component Schema Definitions
 * 
 * Defines field types, defaults, and metadata for all page section components.
 * This enables dynamic form rendering without hardcoded switch statements.
 */

export type FieldType = 'string' | 'number' | 'boolean' | 'image' | 'object' | 'array' | 'textarea'

export interface FieldSchema {
  type: FieldType
  default?: unknown
  label?: string
  placeholder?: string
  nestedSchema?: ComponentSchema // For object/array types
  textareaFields?: string[] // Field names that should use textarea
  imageFields?: string[] // Field names that should use image picker
}

export type ComponentSchema = Record<string, FieldSchema>

export interface ComponentSchemas {
  [componentName: string]: ComponentSchema
}

/**
 * Schema definitions for all components
 */
export const componentSchemas: ComponentSchemas = {
  HeroSection: {
    badge: {
      type: 'object',
      default: { icon: 'Leaf', text: 'Made in Canada' },
      nestedSchema: {
        icon: {
          type: 'string',
          default: 'Leaf',
          label: 'Icon',
          placeholder: 'Leaf',
        },
        text: {
          type: 'string',
          default: 'Made in Canada',
          label: 'Text',
          placeholder: 'Made in Canada',
        },
      },
    },
    title: {
      type: 'string',
      default: 'Clean Beauty That Works—Made With Care in Canada',
      label: 'Title',
      placeholder: 'Clean Beauty That Works—Made With Care in Canada',
    },
    subtitle: {
      type: 'textarea',
      default: 'Luxurious hair care and skincare crafted with clean ingredients, gentle botanicals, and modern science.',
      label: 'Subtitle',
      placeholder: 'Luxurious hair care and skincare crafted with clean ingredients...',
    },
    primaryCta: {
      type: 'object',
      default: { label: 'Shop Bestsellers', href: '#products' },
      nestedSchema: {
        label: {
          type: 'string',
          default: 'Shop Bestsellers',
          label: 'Label',
          placeholder: 'Shop Bestsellers',
        },
        href: {
          type: 'string',
          default: '#products',
          label: 'Link (href)',
          placeholder: '#products',
        },
      },
    },
    secondaryCta: {
      type: 'object',
      default: { label: 'See Our Ingredients', href: '#ingredients' },
      nestedSchema: {
        label: {
          type: 'string',
          default: 'See Our Ingredients',
          label: 'Label',
          placeholder: 'See Our Ingredients',
        },
        href: {
          type: 'string',
          default: '#ingredients',
          label: 'Link (href)',
          placeholder: '#ingredients',
        },
      },
    },
    heroImage: {
      type: 'image',
      default: '',
      label: 'Hero Image',
      placeholder: 'https://images.unsplash.com/...',
    },
    accentImage: {
      type: 'image',
      default: '',
      label: 'Accent Image',
      placeholder: 'https://images.unsplash.com/...',
    },
  },

  HeroWelcome: {
    badge: {
      type: 'object',
      default: { icon: 'Leaf', text: 'Made in Canada' },
      nestedSchema: {
        icon: {
          type: 'string',
          default: 'Leaf',
          label: 'Icon',
          placeholder: 'Leaf',
        },
        text: {
          type: 'string',
          default: 'Made in Canada',
          label: 'Text',
          placeholder: 'Made in Canada',
        },
      },
    },
    title: {
      type: 'string',
      default: 'Clean Beauty That Works—Made With Care in Canada',
      label: 'Title',
      placeholder: 'Clean Beauty That Works—Made With Care in Canada',
    },
    subtitle: {
      type: 'textarea',
      default: 'Luxurious hair care and skincare crafted with clean ingredients, gentle botanicals, and modern science.',
      label: 'Subtitle',
      placeholder: 'Luxurious hair care and skincare crafted with clean ingredients...',
    },
    primaryCta: {
      type: 'object',
      default: { label: 'Shop Bestsellers', href: '#products' },
      nestedSchema: {
        label: {
          type: 'string',
          default: 'Shop Bestsellers',
          label: 'Label',
          placeholder: 'Shop Bestsellers',
        },
        href: {
          type: 'string',
          default: '#products',
          label: 'Link (href)',
          placeholder: '#products',
        },
      },
    },
    secondaryCta: {
      type: 'object',
      default: { label: 'See Our Ingredients', href: '#ingredients' },
      nestedSchema: {
        label: {
          type: 'string',
          default: 'See Our Ingredients',
          label: 'Label',
          placeholder: 'See Our Ingredients',
        },
        href: {
          type: 'string',
          default: '#ingredients',
          label: 'Link (href)',
          placeholder: '#ingredients',
        },
      },
    },
    heroImage: {
      type: 'image',
      default: '',
      label: 'Hero Image',
      placeholder: 'https://images.unsplash.com/...',
    },
    accentImage: {
      type: 'image',
      default: '',
      label: 'Accent Image',
      placeholder: 'https://images.unsplash.com/...',
    },
  },

  InfoBar: {
    hours: {
      type: 'string',
      default: '5PM - 11PM Daily',
      label: 'Hours',
      placeholder: '5PM - 11PM Daily',
    },
    phone: {
      type: 'string',
      default: '+1 (555) 123-4567',
      label: 'Phone',
      placeholder: '+1 (555) 123-4567',
    },
    tagline: {
      type: 'string',
      default: 'Fine Dining Experience',
      label: 'Tagline',
      placeholder: 'Fine Dining Experience',
    },
  },

  PromoCard: {
    eyebrow: {
      type: 'string',
      default: 'EXPLORE',
      label: 'Eyebrow',
      placeholder: 'EXPLORE',
    },
    title: {
      type: 'string',
      default: 'Delicious Breakfast Menu',
      label: 'Title',
      placeholder: 'Delicious Breakfast Menu',
    },
    hours: {
      type: 'string',
      default: '7.00am – 4.00pm',
      label: 'Hours',
      placeholder: '7.00am – 4.00pm',
    },
    ctaLabel: {
      type: 'string',
      default: 'ORDER NOW',
      label: 'CTA Label',
      placeholder: 'ORDER NOW',
    },
    ctaLink: {
      type: 'string',
      default: '/menu',
      label: 'CTA Link',
      placeholder: '/menu',
    },
    imageUrl: {
      type: 'image',
      default: '',
      label: 'Promo Image',
      placeholder: '/gourmet-breakfast.png',
    },
  },

  WhyWeStand: {
    reasons: {
      type: 'array',
      default: [],
      label: 'Reasons',
      nestedSchema: {
        title: {
          type: 'string',
          default: '',
          label: 'Title',
          placeholder: 'Title',
        },
        description: {
          type: 'textarea',
          default: '',
          label: 'Description',
          placeholder: 'Description',
        },
      },
    },
  },

  Specialties: {
    specialties: {
      type: 'array',
      default: [],
      label: 'Specialties',
      nestedSchema: {
        title: {
          type: 'string',
          default: '',
          label: 'Title',
          placeholder: 'Title',
        },
        description: {
          type: 'textarea',
          default: '',
          label: 'Description',
          placeholder: 'Description',
        },
        image: {
          type: 'image',
          default: '',
          label: 'Image',
          placeholder: 'Image URL',
        },
      },
    },
  },

  GalleryTeaser: {
    images: {
      type: 'array',
      default: [],
      label: 'Images',
      nestedSchema: {
        _item: {
          type: 'image',
          default: '',
          label: 'Image',
          placeholder: '/image.jpg',
        },
      },
    },
    ctaLabel: {
      type: 'string',
      default: 'View Full Gallery',
      label: 'CTA Button Label',
      placeholder: 'View Full Gallery',
    },
  },

  CTABanner: {
    title: {
      type: 'string',
      default: 'Ready to Dine with Us?',
      label: 'Title',
      placeholder: 'Ready to Dine with Us?',
    },
    description: {
      type: 'textarea',
      default: 'Reserve your table now...',
      label: 'Description',
      placeholder: 'Reserve your table now...',
    },
    ctaLabel: {
      type: 'string',
      default: 'Book Your Reservation',
      label: 'CTA Button Label',
      placeholder: 'Book Your Reservation',
    },
  },

  HomeHeroSection: {
    address: {
      type: 'string',
      default: '478 PARLIAMENT ST',
      label: 'Address',
      placeholder: '478 PARLIAMENT ST',
    },
    daysLabel: {
      type: 'string',
      default: 'MONDAY - SUNDAY',
      label: 'Days Label',
      placeholder: 'MONDAY - SUNDAY',
    },
    day: {
      type: 'object',
      default: {
        description: 'Have brunch at one of the oldest Restaurants in Cabbagetown',
        hours: '7AM - 4PM',
        heroImage: '/home/brunch-frame-bg.jpg',
      },
      nestedSchema: {
        description: {
          type: 'textarea',
          default: 'Have brunch at one of the oldest Restaurants in Cabbagetown',
          label: 'Day Description',
          placeholder: 'Have brunch at one of the oldest Restaurants in Cabbagetown',
        },
        hours: {
          type: 'string',
          default: '7AM - 4PM',
          label: 'Day Hours',
          placeholder: '7AM - 4PM',
        },
        heroImage: {
          type: 'image',
          default: '/home/brunch-frame-bg.jpg',
          label: 'Day Hero Image',
          placeholder: '/home/brunch-frame-bg.jpg',
        },
      },
    },
    night: {
      type: 'object',
      default: {
        description: 'Have dinner at one of the oldest Restaurants in Cabbagetown',
        hours: '7PM - 12AM',
        heroImage: '/home/jazz-frame.jpg',
      },
      nestedSchema: {
        description: {
          type: 'textarea',
          default: 'Have dinner at one of the oldest Restaurants in Cabbagetown',
          label: 'Night Description',
          placeholder: 'Have dinner at one of the oldest Restaurants in Cabbagetown',
        },
        hours: {
          type: 'string',
          default: '7PM - 12AM',
          label: 'Night Hours',
          placeholder: '7PM - 12AM',
        },
        heroImage: {
          type: 'image',
          default: '/home/jazz-frame.jpg',
          label: 'Night Hero Image',
          placeholder: '/home/jazz-frame.jpg',
        },
      },
    },
    reservationPhone: {
      type: 'string',
      default: '+16473683877',
      label: 'Reservation Phone',
      placeholder: '+16473683877',
    },
    reservationLabel: {
      type: 'string',
      default: 'Reservation',
      label: 'Reservation Label',
      placeholder: 'Reservation',
    },
  },

  HomeAboutSection: {
    title: {
      type: 'string',
      default: 'The Master Behind the Menu',
      label: 'Title',
      placeholder: 'The Master Behind the Menu',
    },
    paragraphs: {
      type: 'array',
      default: [
        "Welcome to Johnny G's! This iconic Cabbagetown spot, established in 1975, was revitalized in November 2022 by owner and Head Chef Dinesh Sharma, who brings over 30 years of restaurant experience and a lifelong passion for vibrant cuisine.",
        "Drawing on his expertise from opening over 20 restaurants across Canada since arriving from India in 2001, Chef Sharma ensures that every dish reflects his commitment to excellence, whether you're enjoying our classic breakfast and lunch staples or exploring the flavourful Indian, Hakka, and Momo dinner menu.",
        "Come in and experience a blend of beloved tradition and culinary mastery that promises to make your next meal truly special."
      ],
      label: 'Paragraphs',
      nestedSchema: {
        _item: {
          type: 'textarea',
          default: '',
          label: 'Paragraph',
          placeholder: 'Enter paragraph text...',
        },
      },
    },
  },

  HomeMenuSection: {
    title: {
      type: 'string',
      default: 'Taste Why Cabbagetown Has Loved Us for Decades',
      label: 'Title',
      placeholder: 'Taste Why Cabbagetown Has Loved Us for Decades',
    },
    description: {
      type: 'textarea',
      default: 'Explore our carefully crafted dishes',
      label: 'Description',
      placeholder: 'Explore our carefully crafted dishes',
    },
    images: {
      type: 'array',
      default: [
        '/assets/imgs/home-menu/NPCgroove-09 1.png',
        '/assets/imgs/home-menu/NPCgroove-10 1.png',
        '/assets/imgs/home-menu/NPCgroove-11 1.png',
        '/assets/imgs/home-menu/NPCgroove-13 1.png'
      ],
      label: 'Menu Images',
      nestedSchema: {
        _item: {
          type: 'image',
          default: '',
          label: 'Image',
          placeholder: '/path/to/image.png',
        },
      },
    },
  },

  HomeEventsSection: {
    title: {
      type: 'string',
      default: 'Dinner and Jazz',
      label: 'Title',
      placeholder: 'Dinner and Jazz',
    },
    description: {
      type: 'textarea',
      default: 'Join us every [day of the week] for an evening that feeds both your appetite and your soul. As the sun sets, Johnny G\'s transforms into an intimate jazz venue where talented local musicians set the perfect backdrop for an unforgettable dining experience.',
      label: 'Description',
      placeholder: 'Join us every [day of the week] for an evening that feeds both your appetite and your soul...',
    },
  },

  HomeReservationSection: {
    heading: {
      type: 'string',
      default: 'Your Table Awaits',
      label: 'Heading',
      placeholder: 'Your Table Awaits',
    },
    subheading: {
      type: 'string',
      default: 'Reserve Now',
      label: 'Subheading',
      placeholder: 'Reserve Now',
    },
  },
}

/**
 * Get schema for a component
 */
export function getComponentSchema(componentName: string): ComponentSchema | null {
  return componentSchemas[componentName] || null
}

/**
 * Get field schema for a specific field in a component
 * Supports nested paths with dot notation (e.g., "day.description")
 */
export function getFieldSchema(componentName: string, fieldKey: string): FieldSchema | null {
  const schema = getComponentSchema(componentName)
  if (!schema) return null
  
  // Handle nested paths with dot notation (e.g., "day.description" or "images.0")
  if (fieldKey.includes('.')) {
    const pathSegments = fieldKey.split('.')
    const [parentKey, ...restSegments] = pathSegments
    const lastSegment = restSegments[restSegments.length - 1]
    
    // Check if the last segment is a numeric index (array item)
    const isArrayIndex = /^\d+$/.test(lastSegment)
    
    if (isArrayIndex) {
      // This is an array item (e.g., "images.0")
      const arrayFieldSchema = schema[parentKey] as FieldSchema | undefined
      
      if (arrayFieldSchema?.type === 'array' && arrayFieldSchema.nestedSchema) {
        // Return the _item schema for array items
        const itemSchema = arrayFieldSchema.nestedSchema['_item']
        if (itemSchema) {
          return itemSchema
        }
      }
      return null
    }
    
    // This is a nested object path (e.g., "day.description")
    // Navigate through the path
    let currentSchema: ComponentSchema = schema
    
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i]
      const fieldSchema = currentSchema[segment] as FieldSchema | undefined
      
      if (!fieldSchema) return null
      
      // If this is the last segment, return the field schema
      if (i === pathSegments.length - 1) {
        return fieldSchema
      }
      
      // If it's an object with nested schema, continue navigation
      if (fieldSchema.type === 'object' && fieldSchema.nestedSchema) {
        currentSchema = fieldSchema.nestedSchema
      } else {
        // Can't navigate further
        return null
      }
    }
    
    return null
  }
  
  // Backward compatibility: handle top-level keys
  return schema[fieldKey] || null
}

/**
 * Get default value for a field
 */
export function getFieldDefault(componentName: string, fieldKey: string): unknown {
  const fieldSchema = getFieldSchema(componentName, fieldKey)
  return fieldSchema?.default ?? null
}

/**
 * Get all field keys for a component (for component listing)
 */
export function getComponentFieldKeys(componentName: string): string[] {
  const schema = getComponentSchema(componentName)
  return schema ? Object.keys(schema) : []
}

/**
 * Initialize content with schema defaults
 */
export function initializeContentWithDefaults(
  componentName: string,
  existingContent: Record<string, unknown> = {}
): Record<string, unknown> {
  const schema = getComponentSchema(componentName)
  if (!schema) {
    return existingContent
  }

  const initialized: Record<string, unknown> = { ...existingContent }

  // For each field in schema, ensure it exists in content
  for (const [fieldKey, fieldSchema] of Object.entries(schema)) {
    if (!(fieldKey in initialized) || initialized[fieldKey] === null || initialized[fieldKey] === undefined) {
      if (fieldSchema.type === 'object' && fieldSchema.nestedSchema) {
        // Initialize nested object with nested schema defaults
        const nestedDefault: Record<string, unknown> = {}
        for (const [nestedKey, nestedSchema] of Object.entries(fieldSchema.nestedSchema)) {
          nestedDefault[nestedKey] = nestedSchema.default ?? ''
        }
        initialized[fieldKey] = nestedDefault
      } else if (fieldSchema.type === 'array') {
        // Arrays default to empty array
        initialized[fieldKey] = []
      } else {
        initialized[fieldKey] = fieldSchema.default ?? ''
      }
    } else if (fieldSchema.type === 'object' && fieldSchema.nestedSchema && typeof initialized[fieldKey] === 'object' && initialized[fieldKey] !== null && !Array.isArray(initialized[fieldKey])) {
      // Ensure nested object has all required fields
      const nestedObj = initialized[fieldKey] as Record<string, unknown>
      const nestedDefault: Record<string, unknown> = { ...nestedObj }
      for (const [nestedKey, nestedSchema] of Object.entries(fieldSchema.nestedSchema)) {
        if (!(nestedKey in nestedDefault) || nestedDefault[nestedKey] === null || nestedDefault[nestedKey] === undefined) {
          nestedDefault[nestedKey] = nestedSchema.default ?? ''
        }
      }
      initialized[fieldKey] = nestedDefault
    }
  }

  return initialized
}


