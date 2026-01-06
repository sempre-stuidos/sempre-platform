import { supabase, supabaseAdmin } from './supabase';
import type { SiteAnalyticsData } from '@/components/chart-site-analytics';

type SupabaseQueryClient = {
  from: typeof supabase.from;
};

/**
 * Get site analytics data for a business
 * Aggregates daily visit counts from the analytics table
 * 
 * @param orgId - Business/organization ID
 * @param supabaseClient - Optional Supabase client (defaults to supabase)
 * @param daysBack - Number of days to look back (default: 90)
 * @returns Array of SiteAnalyticsData with date and visit counts
 */
export async function getSiteAnalyticsData(
  orgId: string,
  supabaseClient?: SupabaseQueryClient,
  daysBack: number = 90
): Promise<SiteAnalyticsData[]> {
  try {
    const client = supabaseClient || supabase;

    // Calculate the start date (daysBack days ago)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Query analytics table for this business
    const { data: analyticsRecords, error } = await client
      .from('analytics')
      .select('visit_date, visit_count')
      .eq('business_id', orgId)
      .gte('visit_date', startDateStr)
      .order('visit_date', { ascending: true });

    if (error) {
      console.error('[getSiteAnalyticsData] Error fetching analytics:', error);
      return [];
    }

    if (!analyticsRecords || analyticsRecords.length === 0) {
      return [];
    }

    // Transform to SiteAnalyticsData format
    // The data is already grouped by date from the database
    const analyticsData: SiteAnalyticsData[] = analyticsRecords.map((record) => ({
      date: record.visit_date, // Already in YYYY-MM-DD format
      visits: record.visit_count || 0,
      // bookings and sales can be added later from other tables
    }));

    return analyticsData;
  } catch (error) {
    console.error('[getSiteAnalyticsData] Unexpected error:', error);
    return [];
  }
}

