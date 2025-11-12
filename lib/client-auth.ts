import { supabase } from './supabase';
import { supabaseAdmin } from './supabase';
import { Client } from './types';
import { getUserRole } from './invitations';

/**
 * Get client record by matching user email to contact_email
 */
export async function getClientByUserEmail(email: string): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .ilike('contact_email', email)
      .single();

    if (error || !data) {
      return null;
    }

    // Transform database record to match Client interface
    return {
      id: data.id as number,
      name: data.name as string,
      businessType: data.business_type as string,
      status: data.status as 'Active' | 'Past',
      projectCount: data.project_count as number,
      priority: data.priority as 'High' | 'Medium' | 'Low',
      contactEmail: data.contact_email as string,
      lastContact: data.last_contact as string,
      totalValue: data.total_value as number,
      phone: data.phone as string | undefined,
      address: data.address as string | undefined,
      website: data.website as string | undefined,
      notes: data.notes as string | undefined,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string,
    };
  } catch (error) {
    console.error('Error in getClientByUserEmail:', error);
    return null;
  }
}

/**
 * Get current user's client record
 * Returns null if user is not a client or client record not found
 */
export async function getCurrentClient(): Promise<Client | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !user.email) {
      return null;
    }

    // Check if user has Client role
    const role = await getUserRole(user.id);
    if (role !== 'Client') {
      return null;
    }

    // Get client record by email
    return await getClientByUserEmail(user.email);
  } catch (error) {
    console.error('Error in getCurrentClient:', error);
    return null;
  }
}

/**
 * Check if user has "Client" role
 */
export async function isClientUser(userId: string): Promise<boolean> {
  try {
    const role = await getUserRole(userId);
    return role === 'Client';
  } catch (error) {
    console.error('Error in isClientUser:', error);
    return false;
  }
}

/**
 * Get client ID for current user
 * Returns null if user is not a client
 */
export async function getCurrentClientId(): Promise<number | null> {
  try {
    const client = await getCurrentClient();
    return client?.id ?? null;
  } catch (error) {
    console.error('Error in getCurrentClientId:', error);
    return null;
  }
}

