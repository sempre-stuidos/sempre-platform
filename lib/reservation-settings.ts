import { supabase } from './supabase';

type SupabaseQueryClient = {
  from: typeof supabase.from;
};

export interface ReservationSettings {
  id: number;
  business_id: string;
  email_recipients: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Get reservation settings for a business
 */
export async function getReservationSettings(
  orgId: string,
  supabaseClient?: SupabaseQueryClient
): Promise<ReservationSettings | null> {
  try {
    const client = (supabaseClient || supabase) as typeof supabase;
    
    const { data, error } = await client
      .from('reservation_settings')
      .select('*')
      .eq('business_id', orgId)
      .single();

    if (error) {
      // If no settings exist, return null
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching reservation settings:', error);
      return null;
    }

    return data as ReservationSettings;
  } catch (error) {
    console.error('Error in getReservationSettings:', error);
    return null;
  }
}

/**
 * Update or create reservation settings for a business
 */
export async function updateReservationSettings(
  orgId: string,
  settings: Partial<Omit<ReservationSettings, 'id' | 'business_id' | 'created_at' | 'updated_at'>>,
  supabaseClient?: SupabaseQueryClient
): Promise<ReservationSettings | null> {
  try {
    const client = (supabaseClient || supabase) as typeof supabase;
    
    // Check if settings exist
    const existing = await getReservationSettings(orgId, client);
    
    if (existing) {
      // Update existing settings
      const { data, error } = await client
        .from('reservation_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', orgId)
        .select()
        .single();

      if (error) {
        console.error('Error updating reservation settings:', error);
        throw error;
      }

      return data as ReservationSettings;
    } else {
      // Create new settings
      const { data, error } = await client
        .from('reservation_settings')
        .insert({
          business_id: orgId,
          ...settings,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating reservation settings:', error);
        throw error;
      }

      return data as ReservationSettings;
    }
  } catch (error) {
    console.error('Error in updateReservationSettings:', error);
    return null;
  }
}

