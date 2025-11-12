import { supabase } from './supabase';
import { MenuItem } from './types';

// Transform database record to match MenuItem interface
function transformMenuItemRecord(record: Record<string, unknown>): MenuItem {
  return {
    id: record.id as number,
    clientId: record.client_id as number,
    name: record.name as string,
    description: record.description as string | undefined,
    price: record.price ? parseFloat(record.price as string) : undefined,
    category: record.category as string | undefined,
    imageUrl: record.image_url as string | undefined,
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}

// Transform frontend interface to database record format
function transformMenuItemToRecord(menuItem: Partial<MenuItem>): Record<string, unknown> {
  const record: Record<string, unknown> = {
    name: menuItem.name,
    description: menuItem.description,
    price: menuItem.price,
    category: menuItem.category,
    image_url: menuItem.imageUrl,
  };

  if (menuItem.clientId) {
    record.client_id = menuItem.clientId;
  }

  return record;
}

/**
 * Get all menu items for a client
 */
export async function getMenuItems(clientId: number): Promise<MenuItem[]> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('client_id', clientId)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }

    return data?.map(transformMenuItemRecord) || [];
  } catch (error) {
    console.error('Error in getMenuItems:', error);
    return [];
  }
}

/**
 * Get menu item by ID
 */
export async function getMenuItemById(id: number): Promise<MenuItem | null> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching menu item:', error);
      throw error;
    }

    return data ? transformMenuItemRecord(data) : null;
  } catch (error) {
    console.error('Error in getMenuItemById:', error);
    return null;
  }
}

/**
 * Create a new menu item
 */
export async function createMenuItem(
  clientId: number,
  menuItem: Omit<MenuItem, 'id' | 'clientId' | 'created_at' | 'updated_at'>
): Promise<MenuItem | null> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([transformMenuItemToRecord({ ...menuItem, clientId })])
      .select()
      .single();

    if (error) {
      console.error('Error creating menu item:', error);
      throw error;
    }

    return data ? transformMenuItemRecord(data) : null;
  } catch (error) {
    console.error('Error in createMenuItem:', error);
    return null;
  }
}

/**
 * Update a menu item
 */
export async function updateMenuItem(
  id: number,
  updates: Partial<Omit<MenuItem, 'id' | 'clientId' | 'created_at' | 'updated_at'>>
): Promise<MenuItem | null> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .update(transformMenuItemToRecord(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }

    return data ? transformMenuItemRecord(data) : null;
  } catch (error) {
    console.error('Error in updateMenuItem:', error);
    return null;
  }
}

/**
 * Delete a menu item
 */
export async function deleteMenuItem(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteMenuItem:', error);
    return false;
  }
}

/**
 * Get menu items by category
 */
export async function getMenuItemsByCategory(
  clientId: number,
  category: string
): Promise<MenuItem[]> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('client_id', clientId)
      .eq('category', category)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching menu items by category:', error);
      throw error;
    }

    return data?.map(transformMenuItemRecord) || [];
  } catch (error) {
    console.error('Error in getMenuItemsByCategory:', error);
    return [];
  }
}

