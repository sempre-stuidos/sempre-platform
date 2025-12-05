import { supabase } from './supabase';
import { MenuCategory, MenuType } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Transform database record to match MenuCategory interface
function transformMenuCategoryRecord(record: Record<string, unknown>): MenuCategory {
  return {
    id: record.id as number,
    menuId: record.menu_id as string, // UUID
    menuType: (record.menu_type as MenuType) || undefined,
    name: record.name as string,
    slug: record.slug as string,
    sortOrder: record.sort_order as number,
    isActive: record.is_active as boolean,
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
    // Keep for backward compatibility
    clientId: record.client_id as number | undefined,
  };
}

// Transform frontend interface to database record format
function transformMenuCategoryToRecord(category: Partial<MenuCategory>): Record<string, unknown> {
  const record: Record<string, unknown> = {
    name: category.name,
    slug: category.slug,
    sort_order: category.sortOrder,
    is_active: category.isActive,
  };

  // menu_id is required - always set it if provided
  if (category.menuId !== undefined && category.menuId !== null) {
    record.menu_id = category.menuId;
  } else if (category.menuId === undefined) {
    // If menuId is not provided, this is an error - but we'll let the database constraint catch it
    console.warn('Warning: menuId is required but not provided in transformMenuCategoryToRecord');
  }

  if (category.menuType !== undefined) {
    record.menu_type = category.menuType;
  }

  // Keep client_id for backward compatibility during transition (now optional)
  if (category.clientId) {
    record.client_id = category.clientId;
  }

  return record;
}

/**
 * Generate a URL-friendly slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Get all menu categories for a menu, optionally filtered by menu type
 */
export async function getMenuCategories(
  menuId: string,
  menuType?: MenuType,
  supabaseClient?: SupabaseClient
): Promise<MenuCategory[]> {
  try {
    const client = supabaseClient || supabase;
    let query = client
      .from('menu_categories')
      .select('*')
      .eq('menu_id', menuId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (menuType !== undefined && menuType !== null) {
      query = query.eq('menu_type', menuType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching menu categories:', error);
      throw error;
    }

    return data?.map(transformMenuCategoryRecord) || [];
  } catch (error) {
    console.error('Error in getMenuCategories:', error);
    return [];
  }
}

/**
 * Get menu category by ID
 */
export async function getMenuCategoryById(id: number): Promise<MenuCategory | null> {
  try {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching menu category:', error);
      throw error;
    }

    return data ? transformMenuCategoryRecord(data) : null;
  } catch (error) {
    console.error('Error in getMenuCategoryById:', error);
    return null;
  }
}

/**
 * Create a new menu category
 */
export async function createMenuCategory(
  menuId: string,
  category: Omit<MenuCategory, 'id' | 'menuId' | 'created_at' | 'updated_at'>,
  supabaseClient?: SupabaseClient
): Promise<MenuCategory | null> {
  try {
    const client = supabaseClient || supabase;
    // Generate slug if not provided
    const slug = category.slug || generateSlug(category.name);

    const record = transformMenuCategoryToRecord({ ...category, menuId, slug });
    console.log('Creating menu category with record:', JSON.stringify(record, null, 2));
    console.log('Menu ID:', menuId);

    const { data, error } = await client
      .from('menu_categories')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('Error creating menu category:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Full error:', JSON.stringify(error, null, 2));
      throw error;
    }

    return data ? transformMenuCategoryRecord(data) : null;
  } catch (error) {
    console.error('Error in createMenuCategory:', error);
    return null;
  }
}

/**
 * Update a menu category
 */
export async function updateMenuCategory(
  id: number,
  updates: Partial<Omit<MenuCategory, 'id' | 'menuId' | 'created_at' | 'updated_at'>>
): Promise<MenuCategory | null> {
  try {
    // Generate slug if name is being updated
    const updateData = { ...updates };
    if (updates.name && !updates.slug) {
      updateData.slug = generateSlug(updates.name);
    }

    const { data, error } = await supabase
      .from('menu_categories')
      .update(transformMenuCategoryToRecord(updateData))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating menu category:', error);
      throw error;
    }

    return data ? transformMenuCategoryRecord(data) : null;
  } catch (error) {
    console.error('Error in updateMenuCategory:', error);
    return null;
  }
}

/**
 * Delete a menu category (soft delete by setting is_active=false)
 */
export async function deleteMenuCategory(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('menu_categories')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting menu category:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteMenuCategory:', error);
    return false;
  }
}

