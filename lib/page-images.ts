import { supabase } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Upload a page image to Supabase storage organized by business-slug
 * @param file The image file to upload
 * @param businessSlug The business slug (for organizing files)
 * @param supabaseClient Optional Supabase client (for server-side use with authentication)
 * @returns The public URL of the uploaded image, or null if upload failed
 */
export async function uploadPageImage(
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
    
    // Storage path: /business-slug/filename
    const filePath = `${sanitizedSlug}/${fileName}`;

    console.log('Uploading page image to path:', filePath);
    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.type);

    const { data, error } = await client.storage
      .from('page-assets')
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

    // Get public URL
    const publicUrl = getPageImagePublicUrl(data.path, client);
    console.log('Image uploaded successfully, public URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadPageImage:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return null;
  }
}

/**
 * Get public URL for a page image
 * @param filePath The storage path of the image
 * @param supabaseClient Optional Supabase client (for server-side use)
 * @returns The public URL of the image
 */
export function getPageImagePublicUrl(filePath: string, supabaseClient?: SupabaseClient): string {
  const client = supabaseClient || supabase;
  const { data } = client.storage
    .from('page-assets')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Delete a page image from Supabase storage
 * @param filePath The storage path of the image to delete
 * @param supabaseClient Optional Supabase client (for server-side use)
 * @returns True if deletion was successful, false otherwise
 */
export async function deletePageImage(filePath: string, supabaseClient?: SupabaseClient): Promise<boolean> {
  try {
    const client = supabaseClient || supabase;
    
    // Extract the path from URL if a full URL is provided
    const path = filePath.includes('/storage/v1/object/public/page-assets/')
      ? filePath.split('/storage/v1/object/public/page-assets/')[1]
      : filePath;

    const { error } = await client.storage
      .from('page-assets')
      .remove([path]);

    if (error) {
      console.error('Error deleting image from storage:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deletePageImage:', error);
    return false;
  }
}

