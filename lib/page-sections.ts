import { supabase } from './supabase';
import { PageSection } from './types';

// Transform database record to match PageSection interface
function transformPageSectionRecord(record: Record<string, unknown>): PageSection {
  return {
    id: record.id as number,
    clientId: record.client_id as number,
    sectionName: record.section_name as string,
    title: record.title as string | undefined,
    content: record.content as string | undefined,
    imageUrl: record.image_url as string | undefined,
    order: record.order as number | undefined,
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}

// Transform frontend interface to database record format
function transformPageSectionToRecord(pageSection: Partial<PageSection>): Record<string, unknown> {
  const record: Record<string, unknown> = {
    section_name: pageSection.sectionName,
    title: pageSection.title,
    content: pageSection.content,
    image_url: pageSection.imageUrl,
    order: pageSection.order ?? 0,
  };

  if (pageSection.clientId) {
    record.client_id = pageSection.clientId;
  }

  return record;
}

/**
 * Get all page sections for a client
 */
export async function getPageSections(clientId: number): Promise<PageSection[]> {
  try {
    const { data, error } = await supabase
      .from('page_sections')
      .select('*')
      .eq('client_id', clientId)
      .order('order', { ascending: true })
      .order('section_name', { ascending: true });

    if (error) {
      console.error('Error fetching page sections:', error);
      throw error;
    }

    return data?.map(transformPageSectionRecord) || [];
  } catch (error) {
    console.error('Error in getPageSections:', error);
    return [];
  }
}

/**
 * Get a specific page section by section name
 */
export async function getPageSection(
  clientId: number,
  sectionName: string
): Promise<PageSection | null> {
  try {
    const { data, error } = await supabase
      .from('page_sections')
      .select('*')
      .eq('client_id', clientId)
      .eq('section_name', sectionName)
      .single();

    if (error) {
      console.error('Error fetching page section:', error);
      throw error;
    }

    return data ? transformPageSectionRecord(data) : null;
  } catch (error) {
    console.error('Error in getPageSection:', error);
    return null;
  }
}

/**
 * Create or update a page section (upsert)
 */
export async function createOrUpdatePageSection(
  clientId: number,
  sectionData: Omit<PageSection, 'id' | 'clientId' | 'created_at' | 'updated_at'>
): Promise<PageSection | null> {
  try {
    const record = transformPageSectionToRecord({ ...sectionData, clientId });

    // Use upsert to create or update
    const { data, error } = await supabase
      .from('page_sections')
      .upsert(
        record,
        {
          onConflict: 'client_id,section_name',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error creating/updating page section:', error);
      throw error;
    }

    return data ? transformPageSectionRecord(data) : null;
  } catch (error) {
    console.error('Error in createOrUpdatePageSection:', error);
    return null;
  }
}

/**
 * Update a page section
 */
export async function updatePageSection(
  id: number,
  updates: Partial<Omit<PageSection, 'id' | 'clientId' | 'created_at' | 'updated_at'>>
): Promise<PageSection | null> {
  try {
    const { data, error } = await supabase
      .from('page_sections')
      .update(transformPageSectionToRecord(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating page section:', error);
      throw error;
    }

    return data ? transformPageSectionRecord(data) : null;
  } catch (error) {
    console.error('Error in updatePageSection:', error);
    return null;
  }
}

/**
 * Delete a page section
 */
export async function deletePageSection(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('page_sections')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting page section:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deletePageSection:', error);
    return false;
  }
}

