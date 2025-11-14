import { supabase, supabaseAdmin } from './supabase';
import type { Page, PageWithSections, PageInput } from './types';

type SupabaseQueryClient = {
  from: typeof supabase.from;
};

/**
 * Get all pages for an organization
 */
export async function getPagesForOrg(
  orgId: string,
  supabaseClient?: SupabaseQueryClient
): Promise<Page[]> {
  try {
    const client = supabaseClient || supabase;
    
    const { data, error } = await client
      .from('pages')
      .select('*')
      .eq('org_id', orgId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching pages for org:', error);
      throw error;
    }

    return (data || []) as Page[];
  } catch (error) {
    console.error('Error in getPagesForOrg:', error);
    return [];
  }
}

/**
 * Get a page by ID
 */
export async function getPageById(
  pageId: string,
  supabaseClient?: SupabaseQueryClient
): Promise<Page | null> {
  try {
    const client = supabaseClient || supabase;
    
    const { data, error } = await client
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .single();

    if (error || !data) {
      console.log('getPageById - Error or no data:', error, data);
      return null;
    }

    return data as Page;
  } catch (error) {
    console.error('Error in getPageById:', error);
    return null;
  }
}

/**
 * Get a page with all its sections
 */
export async function getPageWithSections(
  pageId: string,
  supabaseClient?: SupabaseQueryClient
): Promise<PageWithSections | null> {
  try {
    const client = supabaseClient || supabase;
    
    // Get the page
    const page = await getPageById(pageId, client);
    if (!page) {
      return null;
    }

    // Get sections for this page
    const { data: sections, error: sectionsError } = await client
      .from('page_sections_v2')
      .select('*')
      .eq('page_id', pageId)
      .order('position', { ascending: true });

    if (sectionsError) {
      console.error('Error fetching sections for page:', sectionsError);
      throw sectionsError;
    }

    return {
      ...page,
      sections: (sections || []) as PageWithSections['sections'],
    };
  } catch (error) {
    console.error('Error in getPageWithSections:', error);
    return null;
  }
}

/**
 * Create a new page
 */
export async function createPage(
  orgId: string,
  data: PageInput,
  supabaseClient?: SupabaseQueryClient
): Promise<{ success: boolean; page?: Page; error?: string }> {
  try {
    const client = supabaseClient || supabaseAdmin;
    
    const { data: page, error } = await client
      .from('pages')
      .insert({
        org_id: orgId,
        name: data.name,
        slug: data.slug,
        template: data.template || null,
        status: data.status || 'draft',
      })
      .select()
      .single();

    if (error || !page) {
      return { success: false, error: error?.message || 'Failed to create page' };
    }

    return { success: true, page: page as Page };
  } catch (error) {
    console.error('Error in createPage:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update page status
 */
export async function updatePageStatus(
  pageId: string,
  status: 'published' | 'dirty' | 'draft',
  supabaseClient?: SupabaseQueryClient
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = supabaseClient || supabaseAdmin;
    
    const { error } = await client
      .from('pages')
      .update({ status })
      .eq('id', pageId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updatePageStatus:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get page by slug for an organization (for public site)
 */
export async function getPageBySlug(
  orgId: string,
  slug: string,
  supabaseClient?: SupabaseQueryClient
): Promise<Page | null> {
  try {
    const client = supabaseClient || supabase;
    
    const { data, error } = await client
      .from('pages')
      .select('*')
      .eq('org_id', orgId)
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Page;
  } catch (error) {
    console.error('Error in getPageBySlug:', error);
    return null;
  }
}

