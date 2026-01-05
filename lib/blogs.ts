// Blog type definition - safe to import in client components
export interface Blog {
  id: string;
  business_id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  image_url?: string;
  author?: string;
  category?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  read_time?: string;
  seo_title?: string;
  seo_description?: string;
  created_at?: string;
  updated_at?: string;
}

// Database record type from Supabase
interface BlogRecord {
  id: string;
  business_id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  image_url?: string | null;
  author?: string | null;
  category?: string | null;
  tags?: string[] | null;
  status?: 'draft' | 'published' | 'archived';
  published_at?: string | null;
  read_time?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Helper function to transform database record to Blog
export function transformBlogRecord(record: BlogRecord): Blog {
  return {
    id: record.id,
    business_id: record.business_id,
    title: record.title,
    slug: record.slug,
    excerpt: record.excerpt || undefined,
    content: record.content,
    image_url: record.image_url || undefined,
    author: record.author || undefined,
    category: record.category || undefined,
    tags: record.tags && Array.isArray(record.tags) ? record.tags : undefined,
    status: record.status || 'draft',
    published_at: record.published_at || undefined,
    read_time: record.read_time || undefined,
    seo_title: record.seo_title || undefined,
    seo_description: record.seo_description || undefined,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

/**
 * Generate a URL-friendly slug from a title
 * @param title - The blog title
 * @returns A URL-friendly slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Calculate estimated reading time for blog content
 * Assumes average reading speed of 200 words per minute
 * @param content - The blog content (HTML or plain text)
 * @returns Estimated reading time as a string (e.g., "5 min read")
 */
export function calculateReadTime(content: string): string {
  // Remove HTML tags if present
  const textContent = content.replace(/<[^>]*>/g, '');
  
  // Count words (split by whitespace and filter empty strings)
  const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  
  // Calculate reading time (200 words per minute)
  const minutes = Math.ceil(wordCount / 200);
  
  // Return formatted string
  if (minutes === 0) {
    return '1 min read';
  } else if (minutes === 1) {
    return '1 min read';
  } else {
    return `${minutes} min read`;
  }
}

/**
 * Ensure slug is unique by appending a number if needed
 * This is a helper for client-side validation, but uniqueness should be
 * enforced at the database level
 * @param baseSlug - The base slug
 * @param existingSlugs - Array of existing slugs
 * @returns A unique slug
 */
export function ensureUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
  
  return uniqueSlug;
}

