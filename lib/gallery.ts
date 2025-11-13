import { supabase } from './supabase';
import { GalleryImage } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Transform database record to match GalleryImage interface
function transformGalleryImageRecord(record: Record<string, unknown>): GalleryImage {
  return {
    id: record.id as number,
    clientId: record.client_id as number,
    imageUrl: record.image_url as string,
    title: record.title as string | undefined,
    description: record.description as string | undefined,
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}

// Transform frontend interface to database record format
function transformGalleryImageToRecord(galleryImage: Partial<GalleryImage>): Record<string, unknown> {
  const record: Record<string, unknown> = {
    image_url: galleryImage.imageUrl,
    title: galleryImage.title,
    description: galleryImage.description,
  };

  if (galleryImage.clientId) {
    record.client_id = galleryImage.clientId;
  }

  return record;
}

/**
 * Get all gallery images for a client
 */
export async function getGalleryImages(
  clientId: number,
  supabaseClient?: SupabaseClient
): Promise<GalleryImage[]> {
  try {
    const client = supabaseClient || supabase;
    const { data, error } = await client
      .from('gallery_images')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gallery images:', error);
      throw error;
    }

    return data?.map(transformGalleryImageRecord) || [];
  } catch (error) {
    console.error('Error in getGalleryImages:', error);
    return [];
  }
}

/**
 * Get gallery image by ID
 */
export async function getGalleryImageById(
  id: number,
  supabaseClient?: SupabaseClient
): Promise<GalleryImage | null> {
  try {
    const client = supabaseClient || supabase;
    const { data, error } = await client
      .from('gallery_images')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching gallery image:', error);
      throw error;
    }

    return data ? transformGalleryImageRecord(data) : null;
  } catch (error) {
    console.error('Error in getGalleryImageById:', error);
    return null;
  }
}

/**
 * Create a new gallery image
 */
export async function createGalleryImage(
  clientId: number,
  galleryImage: Omit<GalleryImage, 'id' | 'clientId' | 'created_at' | 'updated_at'>,
  supabaseClient?: SupabaseClient
): Promise<GalleryImage | null> {
  try {
    const client = supabaseClient || supabase;
    const { data, error } = await client
      .from('gallery_images')
      .insert([transformGalleryImageToRecord({ ...galleryImage, clientId })])
      .select()
      .single();

    if (error) {
      console.error('Error creating gallery image:', error);
      throw error;
    }

    return data ? transformGalleryImageRecord(data) : null;
  } catch (error) {
    console.error('Error in createGalleryImage:', error);
    return null;
  }
}

/**
 * Update a gallery image
 */
export async function updateGalleryImage(
  id: number,
  updates: Partial<Omit<GalleryImage, 'id' | 'clientId' | 'created_at' | 'updated_at'>>,
  supabaseClient?: SupabaseClient
): Promise<GalleryImage | null> {
  try {
    const client = supabaseClient || supabase;
    const { data, error } = await client
      .from('gallery_images')
      .update(transformGalleryImageToRecord(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating gallery image:', error);
      throw error;
    }

    return data ? transformGalleryImageRecord(data) : null;
  } catch (error) {
    console.error('Error in updateGalleryImage:', error);
    return null;
  }
}

/**
 * Delete a gallery image
 */
export async function deleteGalleryImage(
  id: number,
  supabaseClient?: SupabaseClient
): Promise<boolean> {
  try {
    const client = supabaseClient || supabase;
    const { error } = await client
      .from('gallery_images')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting gallery image:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteGalleryImage:', error);
    return false;
  }
}

