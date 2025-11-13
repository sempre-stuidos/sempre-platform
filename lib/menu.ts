import { supabase } from './supabase';
import { MenuItem, MenuType } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Transform database record to match MenuItem interface
function transformMenuItemRecord(record: Record<string, unknown>): MenuItem {
  const priceCents = record.price_cents as number | undefined;
  const price = record.price ? parseFloat(record.price as string) : undefined;
  
  // Debug: log the menu_id value
  const menuId = record.menu_id as number | undefined;
  if (menuId === undefined || menuId === null) {
    console.warn('transformMenuItemRecord: menu_id is missing or null for item', {
      id: record.id,
      name: record.name,
      menu_id: record.menu_id,
      has_menu_id: 'menu_id' in record,
    });
  }
  
  return {
    id: record.id as number,
    menuId: menuId as number, // Type assertion - menu_id should always be present after migration
    menuCategoryId: record.menu_category_id as number | undefined,
    menuType: (record.menu_type as MenuType) || undefined,
    name: record.name as string,
    description: record.description as string | undefined,
    price: price, // Keep for backward compatibility
    priceCents: priceCents || (price ? Math.round(price * 100) : undefined),
    category: record.category as string | undefined, // Keep for backward compatibility
    imageUrl: record.image_url as string | undefined,
    isVisible: record.is_visible !== undefined ? (record.is_visible as boolean) : true,
    isFeatured: record.is_featured !== undefined ? (record.is_featured as boolean) : false,
    position: record.position !== undefined ? (record.position as number) : 0,
    isArchived: record.is_archived !== undefined ? (record.is_archived as boolean) : false,
    archivedAt: record.archived_at as string | undefined,
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
    // Keep for backward compatibility during transition
    clientId: record.client_id as number | undefined,
  };
}

// Transform frontend interface to database record format
function transformMenuItemToRecord(menuItem: Partial<MenuItem>): Record<string, unknown> {
  const record: Record<string, unknown> = {};

  // Only include fields that are actually provided (for updates)
  if (menuItem.name !== undefined) {
    record.name = menuItem.name;
  }
  if (menuItem.description !== undefined) {
    record.description = menuItem.description;
  }
  if (menuItem.imageUrl !== undefined) {
    record.image_url = menuItem.imageUrl;
  }
  if (menuItem.isVisible !== undefined) {
    record.is_visible = menuItem.isVisible;
  }
  if (menuItem.isFeatured !== undefined) {
    record.is_featured = menuItem.isFeatured;
  }
  if (menuItem.position !== undefined) {
    record.position = menuItem.position;
  }

  if (menuItem.menuId !== undefined && menuItem.menuId !== null) {
    record.menu_id = menuItem.menuId;
  }

  if (menuItem.menuCategoryId !== undefined) {
    record.menu_category_id = menuItem.menuCategoryId;
  }

  if (menuItem.menuType !== undefined) {
    record.menu_type = menuItem.menuType;
  }

  // Keep client_id for backward compatibility during transition
  if (menuItem.clientId !== undefined) {
    record.client_id = menuItem.clientId;
  }

  // Handle price: prefer priceCents, fallback to price
  if (menuItem.priceCents !== undefined) {
    record.price_cents = menuItem.priceCents;
    // Also set price for backward compatibility
    record.price = menuItem.priceCents / 100;
  } else if (menuItem.price !== undefined) {
    record.price = menuItem.price;
    record.price_cents = Math.round(menuItem.price * 100);
  }

  // Keep category for backward compatibility
  if (menuItem.category !== undefined) {
    record.category = menuItem.category;
  }

  return record;
}

/**
 * Get all menu items for a menu with optional filters
 */
export async function getMenuItems(
  menuId: number,
  options?: {
    categoryId?: number;
    visibleOnly?: boolean;
    includeArchived?: boolean;
    search?: string;
  },
  supabaseClient?: SupabaseClient
): Promise<MenuItem[]> {
  try {
    const client = supabaseClient || supabase;
    let query = client
      .from('menu_items')
      .select('*')
      .eq('menu_id', menuId);

    if (options?.categoryId !== undefined) {
      query = query.eq('menu_category_id', options.categoryId);
    }

    if (options?.visibleOnly) {
      query = query.eq('is_visible', true);
    }

    if (!options?.includeArchived) {
      query = query.eq('is_archived', false);
    }

    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }

    query = query
      .order('position', { ascending: true })
      .order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }

    if (data && data.length > 0) {
      console.log('Raw menu items from DB:', data.map((item: Record<string, unknown>) => ({ id: item.id, name: item.name, menu_id: item.menu_id })));
    }

    const transformed = data?.map(transformMenuItemRecord) || [];
    
    if (transformed.length > 0) {
      console.log('Transformed menu items:', transformed.map((item: MenuItem) => ({ id: item.id, name: item.name, menuId: item.menuId })));
    }

    return transformed;
  } catch (error) {
    console.error('Error in getMenuItems:', error);
    return [];
  }
}

/**
 * Get menu item by ID
 */
export async function getMenuItemById(
  id: number,
  supabaseClient?: SupabaseClient
): Promise<MenuItem | null> {
  try {
    const client = supabaseClient || supabase;
    const { data, error } = await client
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
  menuId: number,
  menuItem: Omit<MenuItem, 'id' | 'menuId' | 'created_at' | 'updated_at'>,
  supabaseClient?: SupabaseClient
): Promise<MenuItem | null> {
  try {
    const client = supabaseClient || supabase;
    const record = transformMenuItemToRecord({ ...menuItem, menuId });
    console.log('Creating menu item with record:', JSON.stringify(record, null, 2));
    console.log('Menu ID:', menuId);

    const { data, error } = await client
      .from('menu_items')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('Error creating menu item:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Full error:', JSON.stringify(error, null, 2));
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
  updates: Partial<Omit<MenuItem, 'id' | 'menuId' | 'created_at' | 'updated_at'>>,
  supabaseClient?: SupabaseClient
): Promise<MenuItem | null> {
  try {
    const client = supabaseClient || supabase;
    const record = transformMenuItemToRecord(updates);
    console.log('Updating menu item with record:', JSON.stringify(record, null, 2));
    console.log('Item ID:', id);

    const { data, error } = await client
      .from('menu_items')
      .update(record)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating menu item:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Full error:', JSON.stringify(error, null, 2));
      throw error;
    }

    return data ? transformMenuItemRecord(data) : null;
  } catch (error) {
    console.error('Error in updateMenuItem:', error);
    return null;
  }
}

/**
 * Archive a menu item (soft delete)
 */
export async function archiveMenuItem(
  id: number,
  supabaseClient?: SupabaseClient
): Promise<boolean> {
  try {
    const client = supabaseClient || supabase;
    const { error } = await client
      .from('menu_items')
      .update({ 
        is_archived: true,
        archived_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error archiving menu item:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in archiveMenuItem:', error);
    return false;
  }
}

/**
 * Unarchive a menu item
 */
export async function unarchiveMenuItem(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('menu_items')
      .update({ 
        is_archived: false,
        archived_at: null
      })
      .eq('id', id);

    if (error) {
      console.error('Error unarchiving menu item:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in unarchiveMenuItem:', error);
    return false;
  }
}

/**
 * Toggle visibility of a menu item
 */
export async function toggleMenuItemVisibility(
  id: number, 
  isVisible: boolean,
  supabaseClient?: SupabaseClient
): Promise<boolean> {
  try {
    const client = supabaseClient || supabase;
    const { error } = await client
      .from('menu_items')
      .update({ is_visible: isVisible })
      .eq('id', id);

    if (error) {
      console.error('Error toggling menu item visibility:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in toggleMenuItemVisibility:', error);
    return false;
  }
}

/**
 * Delete a menu item (hard delete - use archiveMenuItem instead)
 * @deprecated Use archiveMenuItem instead
 */
export async function deleteMenuItem(id: number): Promise<boolean> {
  return archiveMenuItem(id);
}

/**
 * Get menu items by category (using old category field for backward compatibility)
 * @deprecated Use getMenuItems with categoryId option instead
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
      .eq('is_archived', false)
      .order('position', { ascending: true })
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

/**
 * Get menu items by menu type
 */
export async function getMenuItemsByMenuType(
  clientId: number,
  menuType: MenuType
): Promise<MenuItem[]> {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('client_id', clientId)
      .eq('menu_type', menuType)
      .eq('is_archived', false)
      .order('position', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching menu items by menu type:', error);
      throw error;
    }

    return data?.map(transformMenuItemRecord) || [];
  } catch (error) {
    console.error('Error in getMenuItemsByMenuType:', error);
    return [];
  }
}

