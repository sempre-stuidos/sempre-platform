import { supabase } from './supabase';
import { Client } from './types';

// Transform database record to match frontend interface
function transformClientRecord(record: any): Client {
  return {
    id: record.id,
    name: record.name,
    businessType: record.business_type, // Transform snake_case to camelCase
    status: record.status,
    projectCount: record.project_count, // Transform snake_case to camelCase
    priority: record.priority,
    contactEmail: record.contact_email, // Transform snake_case to camelCase
    lastContact: record.last_contact, // Transform snake_case to camelCase
    totalValue: record.total_value, // Transform snake_case to camelCase
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

// Transform frontend interface to database record format
function transformClientToRecord(client: Partial<Client> & { businessType?: string, projectCount?: number, contactEmail?: string, lastContact?: string, totalValue?: number }) {
  return {
    name: client.name,
    business_type: client.businessType || client.business_type,
    status: client.status,
    project_count: client.projectCount || client.project_count,
    priority: client.priority,
    contact_email: client.contactEmail || client.contact_email,
    last_contact: client.lastContact || client.last_contact,
    total_value: client.totalValue || client.total_value,
  };
}

export async function getAllClients(): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }

    return data?.map(transformClientRecord) || [];
  } catch (error) {
    console.error('Error in getAllClients:', error);
    return [];
  }
}

export async function getClientById(id: number): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching client:', error);
      throw error;
    }

    return data ? transformClientRecord(data) : null;
  } catch (error) {
    console.error('Error in getClientById:', error);
    return null;
  }
}

export async function createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([transformClientToRecord(client)])
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      throw error;
    }

    return data ? transformClientRecord(data) : null;
  } catch (error) {
    console.error('Error in createClient:', error);
    return null;
  }
}

export async function updateClient(id: number, updates: Partial<Client>): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(transformClientToRecord(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      throw error;
    }

    return data ? transformClientRecord(data) : null;
  } catch (error) {
    console.error('Error in updateClient:', error);
    return null;
  }
}

export async function deleteClient(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting client:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteClient:', error);
    return false;
  }
}

export async function getClientsByStatus(status: 'Active' | 'Past'): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('status', status)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching clients by status:', error);
      throw error;
    }

    return data?.map(transformClientRecord) || [];
  } catch (error) {
    console.error('Error in getClientsByStatus:', error);
    return [];
  }
}

export async function getClientsByPriority(priority: 'High' | 'Medium' | 'Low'): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('priority', priority)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching clients by priority:', error);
      throw error;
    }

    return data?.map(transformClientRecord) || [];
  } catch (error) {
    console.error('Error in getClientsByPriority:', error);
    return [];
  }
}
