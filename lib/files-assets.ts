import { supabase } from './supabase';
import { FilesAssets } from './types';

// Transform database record to match frontend interface
function transformFilesAssetsRecord(record: any): FilesAssets {
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    category: record.category,
    project: record.project,
    size: record.size,
    format: record.format,
    uploaded: record.uploaded,
    status: record.status,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

// Transform frontend interface to database record format
function transformFilesAssetsToRecord(filesAssets: Partial<FilesAssets>) {
  return {
    name: filesAssets.name,
    type: filesAssets.type,
    category: filesAssets.category,
    project: filesAssets.project,
    size: filesAssets.size,
    format: filesAssets.format,
    uploaded: filesAssets.uploaded,
    status: filesAssets.status,
  };
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
    const { data: newFilesAssets, error } = await supabase
      .from('files_assets')
      .insert([transformFilesAssetsToRecord(filesAssets)])
      .select()
      .single();

    if (error) {
      console.error('Error creating files assets:', error);
      throw error;
    }

    if (!newFilesAssets) {
      return null;
    }

    return transformFilesAssetsRecord(newFilesAssets);
  } catch (error) {
    console.error('Error in createFilesAssets:', error);
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
