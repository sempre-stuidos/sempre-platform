import { supabase } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Upload a menu item image to Supabase storage
 * @param file The image file to upload
 * @param orgId The organization ID (for organizing files)
 * @param supabaseClient Optional Supabase client (for server-side use with authentication)
 * @returns The public URL of the uploaded image, or null if upload failed
 */
export async function uploadMenuItemImage(
  file: File,
  orgId: string,
  supabaseClient?: SupabaseClient
): Promise<string | null> {
  try {
    const client = supabaseClient || supabase;
    
    // Sanitize org ID for folder structure
    const sanitizedOrgId = orgId.replace(/[^a-zA-Z0-9-_]/g, '-');
    
    // Create unique filename to avoid collisions
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
    const fileName = `${timestamp}-${sanitizedFileName}`;
    
    // Storage path: /org-id/filename
    const filePath = `${sanitizedOrgId}/${fileName}`;

    console.log('Uploading image to path:', filePath);
    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.type);

    const { data, error } = await client.storage
      .from('menu-images')
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
    const publicUrl = getImagePublicUrl(data.path, client);
    console.log('Image uploaded successfully, public URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadMenuItemImage:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return null;
  }
}

/**
 * Get public URL for a menu item image
 * @param filePath The storage path of the image
 * @param supabaseClient Optional Supabase client (for server-side use)
 * @returns The public URL of the image
 */
export function getImagePublicUrl(filePath: string, supabaseClient?: SupabaseClient): string {
  const client = supabaseClient || supabase;
  const { data } = client.storage
    .from('menu-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Delete a menu item image from Supabase storage
 * @param filePath The storage path of the image to delete
 * @returns True if deletion was successful, false otherwise
 */
export async function deleteMenuItemImage(filePath: string): Promise<boolean> {
  try {
    // Extract the path from URL if a full URL is provided
    const path = filePath.includes('/storage/v1/object/public/menu-images/')
      ? filePath.split('/storage/v1/object/public/menu-images/')[1]
      : filePath;

    const { error } = await supabase.storage
      .from('menu-images')
      .remove([path]);

    if (error) {
      console.error('Error deleting image from storage:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteMenuItemImage:', error);
    return false;
  }
}

