import { supabase } from './supabase';

type SupabaseQueryClient = {
  from: typeof supabase.from;
};

export interface Report {
  id: number;
  business_id: string;
  title: string;
  type: 'Analytics' | 'Performance' | 'Summary' | 'Custom';
  status: 'Generated' | 'Pending' | 'Failed';
  file_url?: string | null;
  file_format?: 'PDF' | 'HTML' | 'JSON' | null;
  generated_at?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ReportSettings {
  id: number;
  business_id: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Never';
  email_enabled: boolean;
  email_recipients: string[];
  include_analytics: boolean;
  include_reservations: boolean;
  include_menu_stats: boolean;
  include_gallery_stats: boolean;
  include_performance: boolean;
  include_events: boolean;
  include_custom_sections: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateReportData {
  title: string;
  type: 'Analytics' | 'Performance' | 'Summary' | 'Custom';
  period_start?: string;
  period_end?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get all reports for an organization
 */
export async function getReportsByOrgId(
  orgId: string,
  supabaseClient?: SupabaseQueryClient
): Promise<Report[]> {
  try {
    const client = (supabaseClient || supabase) as typeof supabase;
    
    const { data, error } = await client
      .from('reports')
      .select('*')
      .eq('business_id', orgId)
      .order('generated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }

    return (data || []) as Report[];
  } catch (error) {
    console.error('Error in getReportsByOrgId:', error);
    return [];
  }
}

/**
 * Get a single report by ID
 */
export async function getReportById(
  reportId: number,
  supabaseClient?: SupabaseQueryClient
): Promise<Report | null> {
  try {
    const client = (supabaseClient || supabase) as typeof supabase;
    
    const { data, error } = await client
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) {
      console.error('Error fetching report:', error);
      return null;
    }

    return data as Report;
  } catch (error) {
    console.error('Error in getReportById:', error);
    return null;
  }
}

/**
 * Get report settings for an organization
 */
export async function getReportSettings(
  orgId: string,
  supabaseClient?: SupabaseQueryClient
): Promise<ReportSettings | null> {
  try {
    const client = (supabaseClient || supabase) as typeof supabase;
    
    const { data, error } = await client
      .from('report_settings')
      .select('*')
      .eq('business_id', orgId)
      .single();

    if (error) {
      // If no settings exist, return default settings
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching report settings:', error);
      return null;
    }

    return data as ReportSettings;
  } catch (error) {
    console.error('Error in getReportSettings:', error);
    return null;
  }
}

/**
 * Update or create report settings for an organization
 */
export async function updateReportSettings(
  orgId: string,
  settings: Partial<Omit<ReportSettings, 'id' | 'business_id' | 'created_at' | 'updated_at'>>,
  supabaseClient?: SupabaseQueryClient
): Promise<ReportSettings | null> {
  try {
    const client = (supabaseClient || supabase) as typeof supabase;
    
    // Check if settings exist
    const existing = await getReportSettings(orgId, client);
    
    if (existing) {
      // Update existing settings
      const { data, error } = await client
        .from('report_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', orgId)
        .select()
        .single();

      if (error) {
        console.error('Error updating report settings:', error);
        throw error;
      }

      return data as ReportSettings;
    } else {
      // Create new settings
      const { data, error } = await client
        .from('report_settings')
        .insert({
          business_id: orgId,
          ...settings,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating report settings:', error);
        throw error;
      }

      return data as ReportSettings;
    }
  } catch (error) {
    console.error('Error in updateReportSettings:', error);
    return null;
  }
}

/**
 * Create a new report
 */
export async function createReport(
  orgId: string,
  reportData: CreateReportData,
  supabaseClient?: SupabaseQueryClient
): Promise<Report | null> {
  try {
    const client = (supabaseClient || supabase) as typeof supabase;
    
    const { data, error } = await client
      .from('reports')
      .insert({
        business_id: orgId,
        ...reportData,
        status: 'Pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);
      throw error;
    }

    return data as Report;
  } catch (error) {
    console.error('Error in createReport:', error);
    return null;
  }
}

/**
 * Update a report
 */
export async function updateReport(
  reportId: number,
  updates: Partial<Omit<Report, 'id' | 'created_at' | 'updated_at'>>,
  supabaseClient?: SupabaseQueryClient
): Promise<Report | null> {
  try {
    const client = (supabaseClient || supabase) as typeof supabase;
    
    const { data, error } = await client
      .from('reports')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      console.error('Error updating report:', error);
      throw error;
    }

    return data as Report;
  } catch (error) {
    console.error('Error in updateReport:', error);
    return null;
  }
}

/**
 * Delete a report
 */
export async function deleteReport(
  reportId: number,
  supabaseClient?: SupabaseQueryClient
): Promise<boolean> {
  try {
    const client = (supabaseClient || supabase) as typeof supabase;
    
    const { error } = await client
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      console.error('Error deleting report:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteReport:', error);
    return false;
  }
}

