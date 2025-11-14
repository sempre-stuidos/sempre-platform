import { supabase, supabaseAdmin } from './supabase';
import type { PageSectionV2 } from './types';

type SupabaseQueryClient = {
  from: typeof supabase.from;
};

/**
 * Get all sections for a page
 */
export async function getSectionsForPage(
  pageId: string,
  supabaseClient?: SupabaseQueryClient
): Promise<PageSectionV2[]> {
  try {
    const client = supabaseClient || supabase;
    
    const { data, error } = await client
      .from('page_sections_v2')
      .select('*')
      .eq('page_id', pageId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching sections for page:', error);
      throw error;
    }

    return (data || []) as PageSectionV2[];
  } catch (error) {
    console.error('Error in getSectionsForPage:', error);
    return [];
  }
}

/**
 * Get a section by ID
 */
export async function getSectionById(
  sectionId: string,
  supabaseClient?: SupabaseQueryClient
): Promise<PageSectionV2 | null> {
  try {
    const client = supabaseClient || supabase;
    
    const { data, error } = await client
      .from('page_sections_v2')
      .select('*')
      .eq('id', sectionId)
      .single();

    if (error || !data) {
      console.log('getSectionById - Error or no data:', error, data);
      return null;
    }

    return data as PageSectionV2;
  } catch (error) {
    console.error('Error in getSectionById:', error);
    return null;
  }
}

/**
 * Update section draft content
 */
export async function updateSectionDraft(
  sectionId: string,
  draftContent: Record<string, unknown>,
  supabaseClient?: SupabaseQueryClient
): Promise<{ success: boolean; section?: PageSectionV2; error?: string }> {
  try {
    const client = supabaseClient || supabaseAdmin;
    
    // Get current section to compare draft vs published
    const currentSection = await getSectionById(sectionId, client);
    if (!currentSection) {
      return { success: false, error: 'Section not found' };
    }

    // Determine new status
    const publishedContent = currentSection.published_content || {};
    const isDirty = JSON.stringify(draftContent) !== JSON.stringify(publishedContent);
    const newStatus = isDirty ? 'dirty' : 'published';

    const { data, error } = await client
      .from('page_sections_v2')
      .update({
        draft_content: draftContent,
        status: newStatus,
      })
      .eq('id', sectionId)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to update section draft' };
    }

    // Update page status if section is dirty
    if (newStatus === 'dirty') {
      await client
        .from('pages')
        .update({ status: 'dirty' })
        .eq('id', currentSection.page_id);
    }

    return { success: true, section: data as PageSectionV2 };
  } catch (error) {
    console.error('Error in updateSectionDraft:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Publish a section (copy draft_content to published_content)
 */
export async function publishSection(
  sectionId: string,
  supabaseClient?: SupabaseQueryClient
): Promise<{ success: boolean; section?: PageSectionV2; error?: string }> {
  try {
    const client = supabaseClient || supabaseAdmin;
    
    // Get current section
    const currentSection = await getSectionById(sectionId, client);
    if (!currentSection) {
      return { success: false, error: 'Section not found' };
    }

    const { data, error } = await client
      .from('page_sections_v2')
      .update({
        published_content: currentSection.draft_content,
        status: 'published',
      })
      .eq('id', sectionId)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to publish section' };
    }

    // Check if all sections on this page are now published
    const allSections = await getSectionsForPage(currentSection.page_id, client);
    const allPublished = allSections.every(s => s.status === 'published');
    
    if (allPublished) {
      await client
        .from('pages')
        .update({ status: 'published' })
        .eq('id', currentSection.page_id);
    }

    return { success: true, section: data as PageSectionV2 };
  } catch (error) {
    console.error('Error in publishSection:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Publish all dirty sections for a page
 */
export async function publishAllSectionsForPage(
  pageId: string,
  supabaseClient?: SupabaseQueryClient
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = supabaseClient || supabaseAdmin;
    
    // Get all dirty sections for this page
    const { data: dirtySections, error: fetchError } = await client
      .from('page_sections_v2')
      .select('*')
      .eq('page_id', pageId)
      .eq('status', 'dirty');

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    if (!dirtySections || dirtySections.length === 0) {
      // No dirty sections, just update page status
      await client
        .from('pages')
        .update({ status: 'published' })
        .eq('id', pageId);
      return { success: true };
    }

    // Update each dirty section
    for (const section of dirtySections) {
      const { error: updateError } = await client
        .from('page_sections_v2')
        .update({
          published_content: section.draft_content,
          status: 'published',
        })
        .eq('id', section.id);

      if (updateError) {
        console.error(`Error publishing section ${section.id}:`, updateError);
        // Continue with other sections
      }
    }

    // Update page status to published
    await client
      .from('pages')
      .update({ status: 'published' })
      .eq('id', pageId);

    return { success: true };
  } catch (error) {
    console.error('Error in publishAllSectionsForPage:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Discard section changes (reset draft_content to published_content)
 */
export async function discardSectionChanges(
  sectionId: string,
  supabaseClient?: SupabaseQueryClient
): Promise<{ success: boolean; section?: PageSectionV2; error?: string }> {
  try {
    const client = supabaseClient || supabaseAdmin;
    
    // Get current section
    const currentSection = await getSectionById(sectionId, client);
    if (!currentSection) {
      return { success: false, error: 'Section not found' };
    }

    const { data, error } = await client
      .from('page_sections_v2')
      .update({
        draft_content: currentSection.published_content,
        status: 'published',
      })
      .eq('id', sectionId)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to discard section changes' };
    }

    // Check if all sections on this page are now published
    const allSections = await getSectionsForPage(currentSection.page_id, client);
    const allPublished = allSections.every(s => s.status === 'published');
    
    if (allPublished) {
      await client
        .from('pages')
        .update({ status: 'published' })
        .eq('id', currentSection.page_id);
    }

    return { success: true, section: data as PageSectionV2 };
  } catch (error) {
    console.error('Error in discardSectionChanges:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get sections for a page (for public site, with preview support)
 */
export async function getPageSections(
  pageId: string,
  useDraft: boolean = false,
  previewToken?: string,
  supabaseClient?: SupabaseQueryClient
): Promise<PageSectionV2[]> {
  try {
    const client = supabaseClient || supabase;
    
    const { data, error } = await client
      .from('page_sections_v2')
      .select('*')
      .eq('page_id', pageId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching sections for page:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // If using draft or preview token, return sections with draft_content
    // Otherwise return with published_content
    const sections = data as PageSectionV2[];
    
    if (useDraft || previewToken) {
      return sections.map(section => ({
        ...section,
        // For preview, we'll use draft_content but keep the structure
        published_content: section.draft_content,
      }));
    }

    return sections;
  } catch (error) {
    console.error('Error in getPageSections:', error);
    return [];
  }
}

