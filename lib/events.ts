import { Event } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Compute event status based on current time and publish dates
 * Note: If status is explicitly set to 'draft', it will be preserved
 */
export function computeEventStatus(event: Event | Partial<Event>): Event['status'] {
  // If archived, always return archived
  if (event.status === 'archived') {
    return 'archived';
  }

  // If explicitly set to draft, preserve it (user saved as draft)
  if (event.status === 'draft') {
    return 'draft';
  }

  const now = new Date();
  
  // If no publish_start_at, it's a draft
  if (!event.publish_start_at) {
    return 'draft';
  }

  const publishStart = new Date(event.publish_start_at);
  const publishEnd = event.publish_end_at ? new Date(event.publish_end_at) : null;

  // If now < publish_start, it's scheduled
  if (now < publishStart) {
    return 'scheduled';
  }

  // If publish_end exists and now > publish_end, it's past
  if (publishEnd && now > publishEnd) {
    return 'past';
  }

  // If publish_start <= now <= publish_end (or no publish_end), it's live
  if (now >= publishStart && (!publishEnd || now <= publishEnd)) {
    return 'live';
  }

  // Default to draft
  return 'draft';
}

/**
 * Transform database record to Event interface
 */
function transformEventRecord(record: Record<string, unknown>): Event {
  return {
    id: record.id as string,
    org_id: record.org_id as string,
    title: record.title as string,
    short_description: record.short_description as string | undefined,
    description: record.description as string | undefined,
    image_url: record.image_url as string | undefined,
    event_type: record.event_type as string | undefined,
    starts_at: record.starts_at as string,
    ends_at: record.ends_at as string,
    publish_start_at: record.publish_start_at as string | undefined,
    publish_end_at: record.publish_end_at as string | undefined,
    status: record.status as Event['status'],
    is_featured: record.is_featured as boolean,
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}

/**
 * Transform Event interface to database record
 */
function transformEventToRecord(event: Partial<Event>): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  
  if (event.org_id !== undefined) record.org_id = event.org_id;
  if (event.title !== undefined) record.title = event.title;
  if (event.short_description !== undefined) record.short_description = event.short_description;
  if (event.description !== undefined) record.description = event.description;
  if (event.image_url !== undefined) record.image_url = event.image_url;
  if (event.event_type !== undefined) record.event_type = event.event_type;
  if (event.starts_at !== undefined) record.starts_at = event.starts_at;
  if (event.ends_at !== undefined) record.ends_at = event.ends_at;
  if (event.publish_start_at !== undefined) record.publish_start_at = event.publish_start_at;
  if (event.publish_end_at !== undefined) record.publish_end_at = event.publish_end_at;
  if (event.status !== undefined) record.status = event.status;
  if (event.is_featured !== undefined) record.is_featured = event.is_featured;
  
  return record;
}

/**
 * Generate mock events for a given organization
 */
export function generateMockEvents(orgId: string): Event[] {
  const now = new Date();
  const events: Event[] = [];

  // Helper to create dates relative to now
  const daysFromNow = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  };

  // Helper to create datetime string with specific time
  const dateTime = (days: number, hours: number, minutes: number = 0) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  };

  // Upcoming events (scheduled/live)
  events.push({
    id: '1',
    org_id: orgId,
    title: 'Jazz Night with The Blue Notes',
    short_description: 'Live jazz performance every Friday night',
    description: 'Join us for an unforgettable evening of smooth jazz with The Blue Notes. Enjoy our signature cocktails and small plates while listening to classic jazz standards.',
    image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    event_type: 'Jazz',
    starts_at: dateTime(3, 20, 0),
    ends_at: dateTime(3, 23, 0),
    publish_start_at: dateTime(1, 10, 0),
    publish_end_at: dateTime(3, 23, 0),
    status: 'scheduled',
    is_featured: true,
    created_at: daysFromNow(-10),
    updated_at: daysFromNow(-2),
  });

  events.push({
    id: '2',
    org_id: orgId,
    title: 'Sunday Brunch Special',
    short_description: 'Bottomless mimosas and live acoustic music',
    description: 'Start your Sunday right with our special brunch menu featuring bottomless mimosas, fresh pastries, and live acoustic music from 11am to 3pm.',
    image_url: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=800',
    event_type: 'Brunch',
    starts_at: dateTime(5, 11, 0),
    ends_at: dateTime(5, 15, 0),
    publish_start_at: dateTime(-2, 10, 0),
    publish_end_at: dateTime(5, 15, 0),
    status: 'live',
    is_featured: false,
    created_at: daysFromNow(-15),
    updated_at: daysFromNow(-1),
  });

  events.push({
    id: '3',
    org_id: orgId,
    title: 'Wine Tasting Evening',
    short_description: 'Explore curated wines with expert sommelier',
    description: 'Join our sommelier for an exclusive wine tasting featuring wines from the Napa Valley. Includes cheese pairings and light appetizers.',
    image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800',
    event_type: 'Wine Tasting',
    starts_at: dateTime(7, 18, 0),
    ends_at: dateTime(7, 21, 0),
    publish_start_at: dateTime(2, 10, 0),
    publish_end_at: dateTime(7, 21, 0),
    status: 'scheduled',
    is_featured: true,
    created_at: daysFromNow(-8),
    updated_at: daysFromNow(-3),
  });

  // Live event (currently visible)
  events.push({
    id: '4',
    org_id: orgId,
    title: 'Comedy Night - Open Mic',
    short_description: 'Local comedians take the stage every Thursday',
    description: 'Laugh the night away with our weekly comedy open mic. Local comedians and special guests perform stand-up comedy. Two-drink minimum.',
    image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    event_type: 'Comedy Night',
    starts_at: dateTime(1, 19, 30),
    ends_at: dateTime(1, 22, 0),
    publish_start_at: dateTime(-5, 10, 0),
    publish_end_at: dateTime(1, 22, 0),
    status: 'live',
    is_featured: false,
    created_at: daysFromNow(-20),
    updated_at: daysFromNow(-5),
  });

  // Past events
  events.push({
    id: '5',
    org_id: orgId,
    title: 'New Year\'s Eve Gala',
    short_description: 'Ring in the new year with style',
    description: 'Celebrate New Year\'s Eve with a five-course dinner, live DJ, champagne toast at midnight, and dancing until 2am.',
    image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
    event_type: 'Gala',
    starts_at: new Date(now.getFullYear() - 1, 11, 31, 20, 0).toISOString(),
    ends_at: new Date(now.getFullYear(), 0, 1, 2, 0).toISOString(),
    publish_start_at: new Date(now.getFullYear() - 1, 11, 1).toISOString(),
    publish_end_at: new Date(now.getFullYear(), 0, 1, 2, 0).toISOString(),
    status: 'past',
    is_featured: true,
    created_at: new Date(now.getFullYear() - 1, 10, 15).toISOString(),
    updated_at: new Date(now.getFullYear() - 1, 11, 30).toISOString(),
  });

  events.push({
    id: '6',
    org_id: orgId,
    title: 'Holiday Brunch Buffet',
    short_description: 'Special holiday menu with all your favorites',
    description: 'Enjoy our extensive holiday brunch buffet featuring carved ham, made-to-order omelets, fresh pastries, and seasonal specialties.',
    image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800',
    event_type: 'Brunch',
    starts_at: dateTime(-10, 10, 0),
    ends_at: dateTime(-10, 14, 0),
    publish_start_at: dateTime(-20, 10, 0),
    publish_end_at: dateTime(-10, 14, 0),
    status: 'past',
    is_featured: false,
    created_at: daysFromNow(-30),
    updated_at: daysFromNow(-12),
  });

  // Draft events
  events.push({
    id: '7',
    org_id: orgId,
    title: 'Valentine\'s Day Special Dinner',
    short_description: 'Romantic prix fixe menu for two',
    description: 'Celebrate love with our special Valentine\'s Day prix fixe menu. Includes appetizer, entrée, dessert, and a complimentary glass of champagne per person.',
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    event_type: 'Special Dinner',
    starts_at: new Date(now.getFullYear(), 1, 14, 18, 0).toISOString(),
    ends_at: new Date(now.getFullYear(), 1, 14, 22, 0).toISOString(),
    publish_start_at: undefined,
    publish_end_at: undefined,
    status: 'draft',
    is_featured: false,
    created_at: daysFromNow(-5),
    updated_at: daysFromNow(-1),
  });

  events.push({
    id: '8',
    org_id: orgId,
    title: 'DJ Night - Electronic Vibes',
    short_description: 'Weekly electronic music night',
    description: 'Dance the night away with our resident DJ spinning the latest electronic and house music. Full bar and late-night menu available.',
    image_url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafb3?w=800',
    event_type: 'DJ Night',
    starts_at: dateTime(10, 21, 0),
    ends_at: dateTime(11, 2, 0), // Next day at 2am
    publish_start_at: undefined,
    publish_end_at: undefined,
    status: 'draft',
    is_featured: false,
    created_at: daysFromNow(-3),
    updated_at: daysFromNow(-1),
  });

  events.push({
    id: '9',
    org_id: orgId,
    title: 'Live Music: Acoustic Sessions',
    short_description: 'Intimate acoustic performances every Wednesday',
    description: 'Enjoy intimate acoustic performances by local artists. Perfect for a relaxed evening with great music, craft cocktails, and small plates.',
    image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    event_type: 'Live Music',
    starts_at: dateTime(14, 19, 0),
    ends_at: dateTime(14, 22, 0),
    publish_start_at: dateTime(7, 10, 0),
    publish_end_at: dateTime(14, 22, 0),
    status: 'scheduled',
    is_featured: false,
    created_at: daysFromNow(-7),
    updated_at: daysFromNow(-4),
  });

  events.push({
    id: '10',
    org_id: orgId,
    title: 'Chef\'s Table Experience',
    short_description: 'Exclusive multi-course tasting menu',
    description: 'Join our executive chef for an exclusive multi-course tasting menu featuring seasonal ingredients and wine pairings. Limited to 12 guests per evening.',
    image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    event_type: 'Dining Experience',
    starts_at: dateTime(21, 19, 0),
    ends_at: dateTime(21, 23, 0),
    publish_start_at: dateTime(14, 10, 0),
    publish_end_at: dateTime(21, 23, 0),
    status: 'scheduled',
    is_featured: true,
    created_at: daysFromNow(-12),
    updated_at: daysFromNow(-6),
  });

  // Compute actual status for each event
  return events.map(event => ({
    ...event,
    status: computeEventStatus(event),
  }));
}

/**
 * Get events for an organization from Supabase
 */
export async function getEventsForOrg(
  orgId: string,
  supabaseClient?: SupabaseClient
): Promise<Event[]> {
  try {
    // For client-side, we'll use API routes
    // This function is kept for server-side usage
    if (!supabaseClient) {
      // Return empty array if no client provided (will be fetched via API)
      return [];
    }

    const { data, error } = await supabaseClient
      .from('events')
      .select('*')
      .eq('org_id', orgId)
      .order('starts_at', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      throw error;
    }

    const events = (data || []).map(transformEventRecord);
    
    // Compute status for each event, but preserve draft and archived status
    return events.map(event => {
      const finalStatus = (event.status === 'draft' || event.status === 'archived') 
        ? event.status 
        : computeEventStatus(event);
      return {
        ...event,
        status: finalStatus,
      };
    });
  } catch (error) {
    console.error('Error in getEventsForOrg:', error);
    return [];
  }
}

/**
 * Get event by ID from Supabase
 */
export async function getEventById(
  orgId: string,
  eventId: string,
  supabaseClient?: SupabaseClient
): Promise<Event | null> {
  try {
    if (!supabaseClient) {
      return null;
    }

    const { data, error } = await supabaseClient
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      throw error;
    }

    if (!data) {
      return null;
    }

    const event = transformEventRecord(data);
    // Preserve the status from the database if it was explicitly set
    // Only recompute if status is not explicitly 'draft' or 'archived'
    const finalStatus = (event.status === 'draft' || event.status === 'archived') 
      ? event.status 
      : computeEventStatus(event);
    return {
      ...event,
      status: finalStatus,
    };
  } catch (error) {
    console.error('Error in getEventById:', error);
    return null;
  }
}

/**
 * Create a new event in Supabase
 */
export async function createEvent(
  orgId: string,
  eventData: Partial<Event>,
  supabaseClient?: SupabaseClient
): Promise<Event | null> {
  try {
    if (!supabaseClient) {
      console.error('No Supabase client provided to createEvent');
      return null;
    }

    // Ensure org_id is included
    const record = transformEventToRecord({
      ...eventData,
      org_id: orgId,
    });

    console.log('Creating event with record:', JSON.stringify(record, null, 2));

    const { data, error } = await supabaseClient
      .from('events')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    if (!data) {
      console.error('No data returned from insert');
      return null;
    }

    const event = transformEventRecord(data);
    // Preserve the status from the database if it was explicitly set
    // Only recompute if status is not explicitly 'draft' or 'archived'
    const finalStatus = (event.status === 'draft' || event.status === 'archived') 
      ? event.status 
      : computeEventStatus(event);
    return {
      ...event,
      status: finalStatus,
    };
  } catch (error) {
    console.error('Error in createEvent:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return null;
  }
}

/**
 * Update an event in Supabase
 */
export async function updateEvent(
  eventId: string,
  orgId: string,
  updates: Partial<Event>,
  supabaseClient?: SupabaseClient
): Promise<Event | null> {
  try {
    if (!supabaseClient) {
      return null;
    }

    const record = transformEventToRecord(updates);

    const { data, error } = await supabaseClient
      .from('events')
      .update(record)
      .eq('id', eventId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      throw error;
    }

    if (!data) {
      return null;
    }

    const event = transformEventRecord(data);
    // Preserve the status from the database if it was explicitly set
    // Only recompute if status is not explicitly 'draft' or 'archived'
    const finalStatus = (event.status === 'draft' || event.status === 'archived') 
      ? event.status 
      : computeEventStatus(event);
    return {
      ...event,
      status: finalStatus,
    };
  } catch (error) {
    console.error('Error in updateEvent:', error);
    return null;
  }
}

/**
 * Archive an event (set status to archived)
 */
export async function archiveEvent(
  eventId: string,
  orgId: string,
  supabaseClient?: SupabaseClient
): Promise<Event | null> {
  return updateEvent(eventId, orgId, { status: 'archived' }, supabaseClient);
}

/**
 * Delete an event from Supabase
 */
export async function deleteEvent(
  eventId: string,
  orgId: string,
  supabaseClient?: SupabaseClient
): Promise<boolean> {
  try {
    if (!supabaseClient) {
      return false;
    }

    const { error } = await supabaseClient
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('org_id', orgId);

    if (error) {
      console.error('Error deleting event:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteEvent:', error);
    return false;
  }
}

/**
 * Format date and time for display
 */
export function formatEventDateTime(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  
  // Check for invalid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Invalid date';
  }
  
  const startDate = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const startTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const endTime = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  // If same day
  if (start.toDateString() === end.toDateString()) {
    return `${startDate} · ${startTime} - ${endTime}`;
  }
  
  // Different days
  const endDate = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startDate} · ${startTime} → ${endDate} · ${endTime}`;
}

/**
 * Format visibility window for display
 */
export function formatVisibilityWindow(publishStart?: string, publishEnd?: string): string {
  if (!publishStart) {
    return 'Not scheduled';
  }
  
  const start = new Date(publishStart);
  
  // Check for invalid date
  if (isNaN(start.getTime())) {
    return 'Invalid date';
  }
  
  const startDate = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const startTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  if (!publishEnd) {
    return `Visible: ${startDate} · ${startTime} → Ongoing`;
  }
  
  const end = new Date(publishEnd);
  
  // Check for invalid date
  if (isNaN(end.getTime())) {
    return `Visible: ${startDate} · ${startTime} → Invalid date`;
  }
  
  const endDate = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endTime = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  return `Visible: ${startDate} · ${startTime} → ${endDate} · ${endTime}`;
}

