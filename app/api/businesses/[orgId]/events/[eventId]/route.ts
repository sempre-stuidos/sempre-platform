import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';
import { getEventById, updateEvent, deleteEvent, computeEventStatus } from '@/lib/events';
import { Event } from '@/lib/types';

interface RouteParams {
  params: Promise<{
    orgId: string;
    eventId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId, eventId } = await params;
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this business
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const event = await getEventById(orgId, eventId, supabase);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error in GET /api/businesses/[orgId]/events/[eventId]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId, eventId } = await params;
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this business
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, short_description, description, image_url, event_type, starts_at, ends_at, publish_start_at, publish_end_at, status, is_featured, is_weekly, day_of_week } = body;

    // Get current event to compute status if needed
    const currentEvent = await getEventById(orgId, eventId, supabase);
    if (!currentEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Determine the effective is_weekly value (use provided value or current value)
    const effectiveIsWeekly = is_weekly !== undefined ? is_weekly : currentEvent.is_weekly;

    // Validate based on event type
    if (effectiveIsWeekly) {
      // For weekly events, require day_of_week
      const effectiveDayOfWeek = day_of_week !== undefined ? day_of_week : currentEvent.day_of_week;
      if (effectiveDayOfWeek === undefined || effectiveDayOfWeek === null) {
        return NextResponse.json(
          { error: 'day_of_week is required for weekly events' },
          { status: 400 }
        );
      }
      if (effectiveDayOfWeek < 0 || effectiveDayOfWeek > 6) {
        return NextResponse.json(
          { error: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)' },
          { status: 400 }
        );
      }
    } else {
      // For one-time events, require starts_at and ends_at if they're being updated
      if (starts_at === undefined && !currentEvent.starts_at) {
        return NextResponse.json(
          { error: 'starts_at is required for one-time events' },
          { status: 400 }
        );
      }
      if (ends_at === undefined && !currentEvent.ends_at) {
        return NextResponse.json(
          { error: 'ends_at is required for one-time events' },
          { status: 400 }
        );
      }
    }

    // Compute status if not explicitly provided
    const computedStatus = status !== undefined 
      ? status 
      : computeEventStatus({
          ...currentEvent,
          publish_start_at: publish_start_at !== undefined ? publish_start_at : currentEvent.publish_start_at,
          publish_end_at: publish_end_at !== undefined ? publish_end_at : currentEvent.publish_end_at,
        });

    const updates: Partial<Event> = {};
    if (title !== undefined) updates.title = title;
    if (short_description !== undefined) updates.short_description = short_description;
    if (description !== undefined) updates.description = description;
    if (image_url !== undefined) updates.image_url = image_url;
    if (event_type !== undefined) updates.event_type = event_type;
    if (starts_at !== undefined) updates.starts_at = starts_at;
    if (ends_at !== undefined) updates.ends_at = ends_at;
    if (publish_start_at !== undefined) updates.publish_start_at = publish_start_at;
    if (publish_end_at !== undefined) updates.publish_end_at = publish_end_at;
    if (is_featured !== undefined) updates.is_featured = is_featured;
    if (is_weekly !== undefined) updates.is_weekly = is_weekly;
    if (day_of_week !== undefined) updates.day_of_week = day_of_week;
    // Clear day_of_week if switching from weekly to one-time
    if (is_weekly === false && currentEvent.is_weekly) {
      updates.day_of_week = undefined;
    }
    // Clear starts_at/ends_at if switching from one-time to weekly (they'll be set with time only)
    // This is handled by the form sending the placeholder dates
    updates.status = computedStatus;

    const event = await updateEvent(eventId, orgId, updates, supabase);

    if (!event) {
      return NextResponse.json(
        { error: 'Failed to update event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error in PATCH /api/businesses/[orgId]/events/[eventId]:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId, eventId } = await params;
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this business
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const success = await deleteEvent(eventId, orgId, supabase);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/businesses/[orgId]/events/[eventId]:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}

