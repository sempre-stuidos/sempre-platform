import { supabase, supabaseAdmin } from './supabase';
import type { PreviewToken } from './types';

type SupabaseQueryClient = {
  from: typeof supabase.from;
};

/**
 * Create a preview token for a page or section
 */
export async function createPreviewToken(
  orgId: string,
  pageId: string,
  sectionId?: string,
  userId?: string,
  expiresInHours: number = 24,
  supabaseClient?: SupabaseQueryClient
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const client = supabaseClient || supabaseAdmin;
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const { data, error } = await client
      .from('preview_tokens')
      .insert({
        org_id: orgId,
        page_id: pageId,
        section_id: sectionId || null,
        user_id: userId || null,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to create preview token' };
    }

    return { success: true, token: data.id };
  } catch (error) {
    console.error('Error in createPreviewToken:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Resolve a preview token (get full token data)
 */
export async function resolvePreviewToken(
  token: string,
  supabaseClient?: SupabaseQueryClient
): Promise<PreviewToken | null> {
  try {
    const client = supabaseClient || supabase;
    
    const { data, error } = await client
      .from('preview_tokens')
      .select('*')
      .eq('id', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    return data as PreviewToken;
  } catch (error) {
    console.error('Error in resolvePreviewToken:', error);
    return null;
  }
}

/**
 * Validate a preview token
 */
export async function validatePreviewToken(
  token: string,
  orgId?: string,
  pageId?: string,
  sectionId?: string,
  supabaseClient?: SupabaseQueryClient
): Promise<{ valid: boolean; token?: PreviewToken; error?: string }> {
  try {
    const resolvedToken = await resolvePreviewToken(token, supabaseClient);
    
    if (!resolvedToken) {
      return { valid: false, error: 'Token not found or expired' };
    }

    // Check if token matches provided org/page/section
    if (orgId && resolvedToken.org_id !== orgId) {
      return { valid: false, error: 'Token does not match organization' };
    }

    if (pageId && resolvedToken.page_id !== pageId) {
      return { valid: false, error: 'Token does not match page' };
    }

    if (sectionId && resolvedToken.section_id !== sectionId) {
      return { valid: false, error: 'Token does not match section' };
    }

    return { valid: true, token: resolvedToken };
  } catch (error) {
    console.error('Error in validatePreviewToken:', error);
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Clean up expired preview tokens (utility function)
 */
export async function cleanupExpiredTokens(
  supabaseClient?: SupabaseQueryClient
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const client = supabaseClient || supabaseAdmin;
    
    const { data, error } = await client
      .from('preview_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, deletedCount: data?.length || 0 };
  } catch (error) {
    console.error('Error in cleanupExpiredTokens:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

