import { supabase } from './supabase';
import { Menu } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Transform database record to match Menu interface
function transformMenuRecord(record: Record<string, unknown>): Menu {
  return {
    id: record.id as string, // UUID
    organizationId: record.business_id as string,
    name: record.name as string,
    description: record.description as string | undefined,
    isActive: record.is_active !== undefined ? (record.is_active as boolean) : true,
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}

// Transform frontend interface to database record format
function transformMenuToRecord(menu: Partial<Menu>): Record<string, unknown> {
  const record: Record<string, unknown> = {
    name: menu.name,
    description: menu.description,
    is_active: menu.isActive !== undefined ? menu.isActive : true,
  };

  if (menu.organizationId) {
    record.business_id = menu.organizationId;
  }

  return record;
}

/**
 * Get all menus for an organization
 */
export async function getMenus(
  organizationId: string,
  supabaseClient?: SupabaseClient
): Promise<Menu[]> {
  try {
    const client = supabaseClient || supabase;
    const { data, error } = await client
      .from('menus')
      .select('*')
      .eq('business_id', organizationId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching menus:', error);
      throw error;
    }

    return data?.map(transformMenuRecord) || [];
  } catch (error) {
    console.error('Error in getMenus:', error);
    return [];
  }
}

/**
 * Get menu by ID
 */
export async function getMenuById(id: string): Promise<Menu | null> {
  try {
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching menu:', error);
      throw error;
    }

    return data ? transformMenuRecord(data) : null;
  } catch (error) {
    console.error('Error in getMenuById:', error);
    return null;
  }
}

/**
 * Get or create default menu for an organization
 */
export async function getOrCreateDefaultMenu(
  organizationId: string,
  supabaseClient?: SupabaseClient
): Promise<Menu | null> {
  try {
    const client = supabaseClient || supabase;
    
    // Try to get existing menu
    const { data: existingMenus, error: fetchError } = await client
      .from('menus')
      .select('*')
      .eq('business_id', organizationId)
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching menus:', fetchError);
      throw fetchError;
    }

    if (existingMenus && existingMenus.length > 0) {
      return transformMenuRecord(existingMenus[0]);
    }

    // Create default menu if none exists
    const { data, error } = await client
      .from('menus')
      .insert([{
        business_id: organizationId,
        name: 'Main Menu',
        description: 'Default menu',
        is_active: true,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating default menu:', error);
      throw error;
    }

    return data ? transformMenuRecord(data) : null;
  } catch (error) {
    console.error('Error in getOrCreateDefaultMenu:', error);
    return null;
  }
}

/**
 * Create a new menu
 */
export async function createMenu(
  organizationId: string,
  menu: Omit<Menu, 'id' | 'organizationId' | 'created_at' | 'updated_at'>,
  supabaseClient?: SupabaseClient
): Promise<Menu | null> {
  try {
    const client = supabaseClient || supabase;
    const record = transformMenuToRecord({ ...menu, organizationId });
    console.log('Creating menu with record:', JSON.stringify(record, null, 2));
    console.log('Organization ID:', organizationId);

    const { data, error } = await client
      .from('menus')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('Error creating menu:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Full error:', JSON.stringify(error, null, 2));
      throw error;
    }

    return data ? transformMenuRecord(data) : null;
  } catch (error) {
    console.error('Error in createMenu:', error);
    return null;
  }
}

/**
 * Update a menu
 */
export async function updateMenu(
  id: string,
  updates: Partial<Omit<Menu, 'id' | 'organizationId' | 'created_at' | 'updated_at'>>,
  supabaseClient?: SupabaseClient
): Promise<Menu | null> {
  try {
    const client = supabaseClient || supabase;
    const { data, error } = await client
      .from('menus')
      .update(transformMenuToRecord(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating menu:', error);
      throw error;
    }

    return data ? transformMenuRecord(data) : null;
  } catch (error) {
    console.error('Error in updateMenu:', error);
    return null;
  }
}

/**
 * Delete a menu (soft delete by setting is_active=false)
 */
export async function deleteMenu(
  id: string,
  supabaseClient?: SupabaseClient
): Promise<boolean> {
  try {
    const client = supabaseClient || supabase;
    const { error } = await client
      .from('menus')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting menu:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteMenu:', error);
    return false;
  }
}

