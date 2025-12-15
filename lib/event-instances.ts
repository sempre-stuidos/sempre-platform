import type { SupabaseClient } from '@supabase/supabase-js';
import { EventInstance } from './types';

/**
 * Generate event instances for a weekly event within a date range
 */
export async function generateEventInstances(
  eventId: string,
  dayOfWeek: number, // 0-6, where 0=Sunday, 6=Saturday
  startDate: string, // ISO date string (YYYY-MM-DD)
  endDate: string, // ISO date string (YYYY-MM-DD)
  supabase: SupabaseClient
): Promise<EventInstance[]> {
  const instances: EventInstance[] = [];
  // Parse dates as local time to avoid timezone issues
  // startDate and endDate are in format YYYY-MM-DD, parse them as local midnight
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  
  // Find the first occurrence of the day of week on or after start date
  let currentDate = new Date(start);
  const currentDayOfWeek = currentDate.getDay();
  
  // Calculate days to add to reach the target day of week
  let daysToAdd = dayOfWeek - currentDayOfWeek;
  if (daysToAdd < 0) {
    daysToAdd += 7; // Next week
  }
  
  currentDate.setDate(currentDate.getDate() + daysToAdd);
  
  // Generate instances for each occurrence
  while (currentDate <= end) {
    const instanceDate = currentDate.toISOString().split('T')[0];
    
    // Insert instance into database
    const { data: instance, error } = await supabase
      .from('event_instances')
      .insert({
        event_id: eventId,
        instance_date: instanceDate,
        status: 'draft',
      })
      .select()
      .single();
    
    if (error) {
      console.error(`Error creating instance for ${instanceDate}:`, error);
      // Continue with next date even if this one fails
    } else if (instance) {
      instances.push({
        id: instance.id,
        event_id: instance.event_id,
        instance_date: instance.instance_date,
        custom_description: instance.custom_description || undefined,
        custom_image_url: instance.custom_image_url || undefined,
        status: instance.status as EventInstance['status'],
        created_at: instance.created_at,
        updated_at: instance.updated_at,
      });
    }
    
    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return instances;
}

/**
 * Get all instances for an event
 */
export async function getEventInstances(
  eventId: string,
  supabase: SupabaseClient
): Promise<EventInstance[]> {
  const { data, error } = await supabase
    .from('event_instances')
    .select('*')
    .eq('event_id', eventId)
    .order('instance_date', { ascending: true });
  
  if (error) {
    console.error('Error fetching event instances:', error);
    return [];
  }
  
  return (data || []).map((record) => ({
    id: record.id,
    event_id: record.event_id,
    instance_date: record.instance_date,
    custom_description: record.custom_description || undefined,
    custom_image_url: record.custom_image_url || undefined,
    status: record.status as EventInstance['status'],
    created_at: record.created_at,
    updated_at: record.updated_at,
  }));
}
