import { supabase, supabaseAdmin } from './supabase';

export interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  default_role?: 'owner' | 'admin' | 'staff' | 'client';
  created_at: string;
  updated_at: string;
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

/**
 * Create or get user profile
 */
export async function getOrCreateUserProfile(userId: string): Promise<Profile | null> {
  try {
    // Try to get existing profile
    const existingProfile = await getUserProfile(userId);

    if (existingProfile) {
      return existingProfile;
    }

    // Create new profile if it doesn't exist
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name: null,
        avatar_url: null,
        default_role: null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getOrCreateUserProfile:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'avatar_url' | 'default_role'>>
): Promise<{ success: boolean; profile?: Profile; error?: string }> {
  try {
    // Ensure profile exists first
    await ensureProfileExists(userId);

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to update profile' };
    }

    return { success: true, profile: data };
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Ensure profile exists (auto-create if missing)
 */
export async function ensureProfileExists(userId: string): Promise<Profile | null> {
  try {
    const profile = await getUserProfile(userId);

    if (profile) {
      return profile;
    }

    // Create profile if it doesn't exist
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name: null,
        avatar_url: null,
        default_role: null,
      })
      .select()
      .single();

    if (error) {
      // If profile already exists (duplicate key), try to fetch it
      if (error.code === '23505') {
        console.log('Profile already exists, fetching it:', userId);
        return await getUserProfile(userId);
      }
      console.error('Error creating profile:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in ensureProfileExists:', error);
    return null;
  }
}

/**
 * Sync profile with auth user metadata
 * Call this after user signs in to keep profile in sync
 */
export async function syncProfileWithAuthUser(userId: string): Promise<Profile | null> {
  try {
    // Get auth user data
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError || !user) {
      console.error('Error getting auth user:', authError);
      return null;
    }

    // Get or create profile
    const profile = await ensureProfileExists(userId);
    if (!profile) {
      return null;
    }

    // Update profile with auth user metadata if needed
    const updates: Partial<Profile> = {};

    if (user.user_metadata?.full_name && !profile.full_name) {
      updates.full_name = user.user_metadata.full_name;
    } else if (user.user_metadata?.first_name && user.user_metadata?.last_name && !profile.full_name) {
      updates.full_name = `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }

    if (user.user_metadata?.avatar_url && !profile.avatar_url) {
      updates.avatar_url = user.user_metadata.avatar_url;
    }

    // Only update if there are changes
    if (Object.keys(updates).length > 0) {
      const result = await updateUserProfile(userId, updates);
      return result.profile || profile;
    }

    return profile;
  } catch (error) {
    console.error('Error in syncProfileWithAuthUser:', error);
    return null;
  }
}

