import { supabase } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Upload a gallery image to Supabase storage organized by business-slug/gallery
 * @param file The image file to upload
 * @param businessSlug The business slug (for organizing files)
 * @param supabaseClient Optional Supabase client (for server-side use with authentication)
 * @returns The storage path of the uploaded image, or null if upload failed
 */
export async function uploadGalleryImage(
  file: File,
  businessSlug: string,
  supabaseClient?: SupabaseClient
): Promise<string | null> {
  try {
    const client = supabaseClient || supabase;
    
    // Sanitize business slug for folder structure
    const sanitizedSlug = businessSlug.replace(/[^a-zA-Z0-9-_]/g, '-');
    
    // Create unique filename to avoid collisions
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
    const fileName = `${timestamp}-${sanitizedFileName}`;
    
    // Storage path: business-slug/gallery/filename
    const filePath = `${sanitizedSlug}/gallery/${fileName}`;

    console.log('Uploading gallery image to path:', filePath);
    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.type);

    const { data, error } = await client.storage
      .from('gallery')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image to storage:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    if (!data) {
      console.error('Upload succeeded but no data returned');
      return null;
    }

    console.log('Image uploaded successfully, path:', data.path);
    return data.path;
  } catch (error) {
    console.error('Error in uploadGalleryImage:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return null;
  }
}

/**
 * Get public URL for a gallery image
 * @param filePath The storage path of the image
 * @param supabaseClient Optional Supabase client (for server-side use)
 * @returns The public URL of the image
 */
export function getGalleryImagePublicUrl(
  filePath: string,
  supabaseClient?: SupabaseClient
): string {
  const client = supabaseClient || supabase;
  const { data } = client.storage
    .from('gallery')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * Delete a gallery image from Supabase storage
 * @param filePath The storage path of the image to delete
 * @param supabaseClient Optional Supabase client (for server-side use)
 * @returns True if deletion was successful
 */
export async function deleteGalleryImage(
  filePath: string,
  supabaseClient?: SupabaseClient
): Promise<boolean> {
  try {
    const client = supabaseClient || supabase;
    const { error } = await client.storage
      .from('gallery')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting gallery image from storage:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteGalleryImage:', error);
    return false;
  }
}

