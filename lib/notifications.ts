import type { SupabaseClient } from '@supabase/supabase-js';
import { Notification, Event, EventInstance } from './types';

/**
 * Check for upcoming weekly event instances that need customization
 * and create notifications if needed
 */
export async function checkAndCreateEventNotifications(
  orgId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<Notification[]> {
  const notifications: Notification[] = [];
  const now = new Date();
  const oneWeekFromNow = new Date(now);
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

  // Get all weekly events for Jazz and Live Music
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_weekly', true)
    .in('event_type', ['Jazz', 'Live Music'])
    .eq('status', 'live');

  if (eventsError || !events) {
    console.error('Error fetching events for notifications:', eventsError);
    return [];
  }

  // For each event, check instances in the next week
  for (const event of events) {
    if (!event.day_of_week) continue;

    // Get instances for the next week
    const { data: instances, error: instancesError } = await supabase
      .from('event_instances')
      .select('*')
      .eq('event_id', event.id)
      .gte('instance_date', now.toISOString().split('T')[0])
      .lte('instance_date', oneWeekFromNow.toISOString().split('T')[0])
      .order('instance_date', { ascending: true });

    if (instancesError || !instances) {
      console.error('Error fetching instances for notifications:', instancesError);
      continue;
    }

    // Check each instance
    for (const instance of instances) {
      const instanceDate = new Date(instance.instance_date);
      const daysUntil = Math.ceil((instanceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Only create notification if exactly 7 days away (1 week)
      if (daysUntil !== 7) continue;

      // Check if instance needs customization
      const hasCustomDescription = !!instance.custom_description || !!event.description;
      const hasBands = await checkInstanceHasBands(instance.id, event.id, supabase);

      if (!hasCustomDescription || !hasBands) {
        // Check if notification already exists
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('org_id', orgId)
          .eq('user_id', userId)
          .eq('related_instance_id', instance.id)
          .eq('type', 'event_reminder')
          .is('read_at', null)
          .single();

        if (existingNotification) {
          // Notification already exists, skip
          continue;
        }

        // Create notification
        const missingItems: string[] = [];
        if (!hasCustomDescription) {
          missingItems.push('custom description');
        }
        if (!hasBands) {
          missingItems.push('bands');
        }

        const { data: newNotification, error: notificationError } = await supabase
          .from('notifications')
          .insert({
            org_id: orgId,
            user_id: userId,
            type: 'event_reminder',
            title: `Upcoming ${event.event_type} Event Needs Customization`,
            message: `Upcoming "${event.title}" on ${instanceDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} needs ${missingItems.join(' and ')}.`,
            related_event_id: event.id,
            related_instance_id: instance.id,
          })
          .select()
          .single();

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
          continue;
        }

        if (newNotification) {
          notifications.push({
            id: newNotification.id,
            org_id: newNotification.org_id,
            user_id: newNotification.user_id,
            type: newNotification.type,
            title: newNotification.title,
            message: newNotification.message,
            related_event_id: newNotification.related_event_id || undefined,
            related_instance_id: newNotification.related_instance_id || undefined,
            read_at: newNotification.read_at || undefined,
            created_at: newNotification.created_at,
          });
        }
      }
    }
  }

  return notifications;
}

/**
 * Check if an instance or its parent event has bands assigned
 */
async function checkInstanceHasBands(
  instanceId: string,
  eventId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  // Check instance bands first
  const { data: instanceBands } = await supabase
    .from('event_instance_bands')
    .select('id')
    .eq('instance_id', instanceId)
    .limit(1);

  if (instanceBands && instanceBands.length > 0) {
    return true;
  }

  // Check parent event bands
  const { data: eventBands } = await supabase
    .from('event_bands')
    .select('id')
    .eq('event_id', eventId)
    .limit(1);

  return !!(eventBands && eventBands.length > 0);
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(
  orgId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .is('read_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return (data || []).map((record) => ({
    id: record.id,
    org_id: record.org_id,
    user_id: record.user_id,
    type: record.type,
    title: record.title,
    message: record.message,
    related_event_id: record.related_event_id || undefined,
    related_instance_id: record.related_instance_id || undefined,
    read_at: record.read_at || undefined,
    created_at: record.created_at,
  }));
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }

  return true;
}
