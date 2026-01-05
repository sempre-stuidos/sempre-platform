import { supabase } from './supabase';
import { FilesAssets } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Transform database record to match frontend interface
function transformFilesAssetsRecord(record: Record<string, unknown>): FilesAssets {
  return {
    id: record.id as number,
    name: record.name as string,
    type: record.type as "Template" | "Logo" | "Document" | "Mockup" | "Content" | "Images" | "Wireframe" | "Prototype" | "Templates" | "Video" | "Design System" | "Icons" | "Presentation",
    category: record.category as "Client Assets" | "Project Assets",
    project: record.project as string,
    size: record.size as string,
    format: record.format as string,
    uploaded: record.uploaded as string,
    status: record.status as "Active" | "Review" | "Draft" | "Processing" | "Archive",
    file_url: record.file_url as string | undefined,
    google_drive_file_id: record.google_drive_file_id as string | undefined,
    google_drive_web_view_link: record.google_drive_web_view_link as string | undefined,
    imported_from_google_drive: record.imported_from_google_drive as boolean | undefined,
    image_category: record.image_category as 'Event' | 'Menu' | null | undefined,
    product_id: record.product_id as string | undefined,
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}

// Transform frontend interface to database record format
function transformFilesAssetsToRecord(filesAssets: Partial<FilesAssets>) {
  const record: Record<string, unknown> = {
    name: filesAssets.name,
    type: filesAssets.type,
    category: filesAssets.category,
    project: filesAssets.project,
    size: filesAssets.size,
    format: filesAssets.format,
    uploaded: filesAssets.uploaded,
    status: filesAssets.status,
    file_url: filesAssets.file_url || null,
    google_drive_file_id: filesAssets.google_drive_file_id || null,
    google_drive_web_view_link: filesAssets.google_drive_web_view_link || null,
    imported_from_google_drive: filesAssets.imported_from_google_drive || false,
  };
  
  // Only include image_category if it's explicitly set (not undefined)
  if (filesAssets.image_category !== undefined) {
    record.image_category = filesAssets.image_category;
  }
  
  // Only include product_id if it's explicitly set (not undefined)
  if (filesAssets.product_id !== undefined) {
    record.product_id = filesAssets.product_id || null;
  }
  
  return record;
}

export async function getAllFilesAssets(): Promise<FilesAssets[]> {
  try {
    const { data: filesAssets, error } = await supabase
      .from('files_assets')
      .select('*')
      .order('uploaded', { ascending: false });

    if (error) {
      console.error('Error fetching files assets:', error);
      throw error;
    }

    if (!filesAssets || filesAssets.length === 0) {
      return [];
    }

    return filesAssets.map(transformFilesAssetsRecord);
  } catch (error) {
    console.error('Error in getAllFilesAssets:', error);
    return [];
  }
}

export async function getFilesAssetsById(id: number): Promise<FilesAssets | null> {
  try {
    const { data: filesAssets, error } = await supabase
      .from('files_assets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching files assets by id:', error);
      throw error;
    }

    if (!filesAssets) {
      return null;
    }

    return transformFilesAssetsRecord(filesAssets);
  } catch (error) {
    console.error('Error in getFilesAssetsById:', error);
    return null;
  }
}

export async function createFilesAssets(filesAssets: Omit<FilesAssets, 'id' | 'created_at' | 'updated_at'>): Promise<FilesAssets | null> {
  try {
    const record = transformFilesAssetsToRecord(filesAssets);
    
    // Validate that all required fields are present
    if (!record.name || !record.type || !record.category || !record.project || !record.size || !record.format || !record.uploaded || !record.status) {
      console.error('Error creating files assets: Missing required fields', {
        name: record.name,
        type: record.type,
        category: record.category,
        project: record.project,
        size: record.size,
        format: record.format,
        uploaded: record.uploaded,
        status: record.status,
      });
      throw new Error('Missing required fields for files_assets insert');
    }

    // Try to insert with image_category and product_id first
    let { data: newFilesAssets, error } = await supabase
      .from('files_assets')
      .insert([record])
      .select()
      .single();

    // If error and it's related to image_category or product_id column not existing, retry without them
    if (error && (error.message?.includes('image_category') || error.message?.includes('product_id') || error.code === '42703')) {
      console.warn('image_category or product_id column may not exist, retrying without them:', error.message);
      // Remove image_category and product_id from record and retry
      const recordWithoutOptional = { ...record };
      delete recordWithoutOptional.image_category;
      delete recordWithoutOptional.product_id;
      
      const retryResult = await supabase
        .from('files_assets')
        .insert([recordWithoutOptional])
        .select()
        .single();
      
      newFilesAssets = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('Error creating files assets:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        record: record,
      });
      throw error;
    }

    if (!newFilesAssets) {
      console.error('Error creating files assets: No data returned from insert');
      return null;
    }

    return transformFilesAssetsRecord(newFilesAssets);
  } catch (error) {
    console.error('Error in createFilesAssets:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function updateFilesAssets(id: number, updates: Partial<FilesAssets>): Promise<FilesAssets | null> {
  try {
    const { data: updatedFilesAssets, error } = await supabase
      .from('files_assets')
      .update(transformFilesAssetsToRecord(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating files assets:', error);
      throw error;
    }

    if (!updatedFilesAssets) {
      return null;
    }

    return transformFilesAssetsRecord(updatedFilesAssets);
  } catch (error) {
    console.error('Error in updateFilesAssets:', error);
    return null;
  }
}

export async function deleteFilesAssets(id: number): Promise<boolean> {
  try {
    // First get the file URL to delete from storage
    const fileAsset = await getFilesAssetsById(id);
    
    if (fileAsset?.file_url) {
      // Check if it's a gallery image (in gallery bucket)
      if (fileAsset.file_url.includes('/gallery/') || fileAsset.project === 'Gallery') {
        // Import deleteGalleryImage dynamically to avoid circular dependency
        const { deleteGalleryImage } = await import('./gallery-images');
        await deleteGalleryImage(fileAsset.file_url);
      } else {
        // Delete from files-assets bucket
        await deleteFileFromStorage(fileAsset.file_url);
      }
    }

    // Then delete from database
    const { error } = await supabase
      .from('files_assets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting files assets:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteFilesAssets:', error);
    return false;
  }
}

export async function getFilesAssetsByCategory(category: 'Client Assets' | 'Project Assets'): Promise<FilesAssets[]> {
  try {
    const { data: filesAssets, error } = await supabase
      .from('files_assets')
      .select('*')
      .eq('category', category)
      .order('uploaded', { ascending: false });

    if (error) {
      console.error('Error fetching files assets by category:', error);
      throw error;
    }

    if (!filesAssets || filesAssets.length === 0) {
      return [];
    }

    return filesAssets.map(transformFilesAssetsRecord);
  } catch (error) {
    console.error('Error in getFilesAssetsByCategory:', error);
    return [];
  }
}

export async function getFilesAssetsByStatus(status: FilesAssets['status']): Promise<FilesAssets[]> {
  try {
    const { data: filesAssets, error } = await supabase
      .from('files_assets')
      .select('*')
      .eq('status', status)
      .order('uploaded', { ascending: false });

    if (error) {
      console.error('Error fetching files assets by status:', error);
      throw error;
    }

    if (!filesAssets || filesAssets.length === 0) {
      return [];
    }

    return filesAssets.map(transformFilesAssetsRecord);
  } catch (error) {
    console.error('Error in getFilesAssetsByStatus:', error);
    return [];
  }
}

export async function getFilesAssetsByType(type: FilesAssets['type']): Promise<FilesAssets[]> {
  try {
    const { data: filesAssets, error } = await supabase
      .from('files_assets')
      .select('*')
      .eq('type', type)
      .order('uploaded', { ascending: false });

    if (error) {
      console.error('Error fetching files assets by type:', error);
      throw error;
    }

    if (!filesAssets || filesAssets.length === 0) {
      return [];
    }

    return filesAssets.map(transformFilesAssetsRecord);
  } catch (error) {
    console.error('Error in getFilesAssetsByType:', error);
    return [];
  }
}

export async function getFilesAssetsByProject(project: string): Promise<FilesAssets[]> {
  try {
    const { data: filesAssets, error } = await supabase
      .from('files_assets')
      .select('*')
      .eq('project', project)
      .order('uploaded', { ascending: false });

    if (error) {
      console.error('Error fetching files assets by project:', error);
      throw error;
    }

    if (!filesAssets || filesAssets.length === 0) {
      return [];
    }

    return filesAssets.map(transformFilesAssetsRecord);
  } catch (error) {
    console.error('Error in getFilesAssetsByProject:', error);
    return [];
  }
}

/**
 * Get gallery images for a business
 * Filters by type="Images" and project="Gallery", and optionally by business slug in file path
 * @param businessSlug Optional business slug to filter images
 * @param supabaseClient Optional Supabase client (for server-side use with authentication)
 */
export async function getGalleryImagesForBusiness(
  businessSlug?: string,
  supabaseClient?: SupabaseClient
): Promise<FilesAssets[]> {
  try {
    const client = supabaseClient || supabase;
    const query = client
      .from('files_assets')
      .select('*')
      .eq('type', 'Images')
      .eq('project', 'Gallery')
      .order('uploaded', { ascending: false });

    const { data: filesAssets, error } = await query;

    if (error) {
      console.error('Error fetching gallery images:', error);
      throw error;
    }

    if (!filesAssets || filesAssets.length === 0) {
      return [];
    }

    let galleryImages = filesAssets.map(transformFilesAssetsRecord);

    // Filter by business slug if provided
    if (businessSlug) {
      const sanitizedSlug = businessSlug.replace(/[^a-zA-Z0-9-_]/g, '-');
      galleryImages = galleryImages.filter((file: FilesAssets) => 
        file.file_url?.includes(`${sanitizedSlug}/gallery/`)
      );
    }

    return galleryImages;
  } catch (error) {
    console.error('Error in getGalleryImagesForBusiness:', error);
    return [];
  }
}

/**
 * Get gallery images for a specific product
 * Filters by type="Images" and product_id (project can be product name or "Gallery")
 */
export async function getGalleryImagesByProduct(
  productId: string,
  businessSlug?: string
): Promise<FilesAssets[]> {
  try {
    const query = supabase
      .from('files_assets')
      .select('*')
      .eq('type', 'Images')
      .eq('product_id', productId)
      .order('uploaded', { ascending: false });

    const { data: filesAssets, error } = await query;

    if (error) {
      console.error('Error fetching gallery images by product:', error);
      throw error;
    }

    if (!filesAssets || filesAssets.length === 0) {
      return [];
    }

    let galleryImages = filesAssets.map(transformFilesAssetsRecord);

    // Filter by business slug if provided
    if (businessSlug) {
      const sanitizedSlug = businessSlug.replace(/[^a-zA-Z0-9-_]/g, '-');
      galleryImages = galleryImages.filter((file: FilesAssets) => 
        file.file_url?.includes(`${sanitizedSlug}/gallery/`)
      );
    }

    return galleryImages;
  } catch (error) {
    console.error('Error in getGalleryImagesByProduct:', error);
    return [];
  }
}

// Storage functions for file uploads

/**
 * Upload a file to Supabase storage
 * @param file The file to upload
 * @param projectName The project name for organizing files
 * @returns The storage path of the uploaded file
 */
export async function uploadFileToStorage(
  file: File,
  projectName: string
): Promise<string | null> {
  try {
    // Sanitize project name for folder structure
    const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    
    // Create unique filename to avoid collisions
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
    const fileName = `${timestamp}-${sanitizedFileName}`;
    
    // Storage path: /project-name/filename
    const filePath = `${sanitizedProjectName}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('files-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file to storage:', error);
      throw error;
    }

    return data.path;
  } catch (error) {
    console.error('Error in uploadFileToStorage:', error);
    return null;
  }
}

/**
 * Get public URL for a file in storage
 * @param filePath The storage path of the file
 * @param supabaseClient Optional Supabase client (for server-side use)
 * @returns The public URL of the file
 */
export function getFilePublicUrl(filePath: string, supabaseClient?: SupabaseClient): string {
  const client = supabaseClient || supabase;
  const { data } = client.storage
    .from('files-assets')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * Delete a file from Supabase storage
 * @param filePath The storage path of the file to delete
 * @returns True if deletion was successful
 */
export async function deleteFileFromStorage(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('files-assets')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file from storage:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteFileFromStorage:', error);
    return false;
  }
}

/**
 * Get file size in human-readable format
 * @param bytes The file size in bytes
 * @returns Formatted file size string (e.g., "2.4 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get file extension from filename
 * @param filename The name of the file
 * @returns The file extension in uppercase
 */
export function getFileFormat(filename: string): string {
  const extension = filename.split('.').pop() || '';
  return extension.toUpperCase();
}

/**
 * Get statistics about files and storage
 * @returns Statistics object with counts, storage usage, etc.
 */
export async function getFilesAssetsStats() {
  try {
    const { data: filesAssets, error } = await supabase
      .from('files_assets')
      .select('*');

    if (error) {
      console.error('Error fetching files assets stats:', error);
      throw error;
    }

    if (!filesAssets || filesAssets.length === 0) {
      return {
        totalFiles: 0,
        filesThisWeek: 0,
        uploadsToday: 0,
        totalProjects: 0,
        storageUsedBytes: 0,
        storageUsedGB: 0,
        storagePercentage: 0,
        storageLimit: 5, // 5GB limit
      };
    }

    const fileRecords = filesAssets as Array<{ uploaded: string; project?: string | null; size: string }>;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate various statistics
    const totalFiles = fileRecords.length;
    
    const filesThisWeek = fileRecords.filter(file => {
      const uploadDate = new Date(file.uploaded);
      return uploadDate >= weekAgo;
    }).length;

    const uploadsToday = fileRecords.filter(file => {
      const uploadDate = new Date(file.uploaded);
      return uploadDate >= today;
    }).length;

    // Get unique projects
    const uniqueProjects = new Set(fileRecords.map(file => file.project));
    const totalProjects = uniqueProjects.size;

    // Calculate storage used (parse size strings like "2.4 MB")
    const storageUsedBytes = fileRecords.reduce((total, file) => {
      const sizeStr = file.size;
      const match = sizeStr.match(/^([\d.]+)\s*([A-Z]+)$/i);
      
      if (!match) return total;
      
      const value = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      
      // Convert to bytes
      const multipliers: Record<string, number> = {
        'BYTES': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024,
      };
      
      const multiplier = multipliers[unit] || 0;
      return total + (value * multiplier);
    }, 0);

    const storageUsedGB = storageUsedBytes / (1024 * 1024 * 1024);
    const storageLimit = 5; // 5GB limit
    const storagePercentage = Math.min((storageUsedGB / storageLimit) * 100, 100);

    return {
      totalFiles,
      filesThisWeek,
      uploadsToday,
      totalProjects,
      storageUsedBytes,
      storageUsedGB,
      storagePercentage,
      storageLimit,
    };
  } catch (error) {
    console.error('Error in getFilesAssetsStats:', error);
    return {
      totalFiles: 0,
      filesThisWeek: 0,
      uploadsToday: 0,
      totalProjects: 0,
      storageUsedBytes: 0,
      storageUsedGB: 0,
      storagePercentage: 0,
      storageLimit: 5,
    };
  }
}
