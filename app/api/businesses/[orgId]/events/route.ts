import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';
import { getEventsForOrg, createEvent, computeEventStatus } from '@/lib/events';
import { generateEventInstances } from '@/lib/event-instances';
import { Event } from '@/lib/types';

interface RouteParams {
  params: Promise<{
    orgId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId } = await params;
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

    const events = await getEventsForOrg(orgId, supabase);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error in GET /api/businesses/[orgId]/events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId } = await params;
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
    const { 
      title, 
      short_description, 
      description, 
      image_url, 
      event_type, 
      starts_at, 
      ends_at, 
      publish_start_at, 
      publish_end_at, 
      status, 
      is_featured, 
      is_weekly, 
      day_of_week,
      instance_range_type,
      instance_start_date,
      instance_end_date
    } = body;

    // Validate required fields based on event type
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (is_weekly) {
      // For weekly events, require day_of_week
      if (day_of_week === undefined || day_of_week === null) {
        return NextResponse.json(
          { error: 'day_of_week is required for weekly events' },
          { status: 400 }
        );
      }
      if (day_of_week < 0 || day_of_week > 6) {
        return NextResponse.json(
          { error: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)' },
          { status: 400 }
        );
      }
      // starts_at and ends_at are optional for weekly events (time is stored in them)
    } else {
      // For one-time events, require starts_at and ends_at
      if (!starts_at || !ends_at) {
        return NextResponse.json(
          { error: 'starts_at and ends_at are required for one-time events' },
          { status: 400 }
        );
      }
    }

    // Compute status if not provided
    const computedStatus = status || computeEventStatus({
      status: 'draft',
      publish_start_at,
      publish_end_at,
    } as Partial<Event>);

    // Clean up empty strings to null for optional fields
    // Handle null explicitly for publish_end_at (for indefinite weekly events)
    const cleanEventData: Record<string, unknown> = {
      title,
      short_description: short_description || undefined,
      description: description || undefined,
      image_url: image_url || undefined,
      event_type: event_type || undefined,
      starts_at: starts_at || undefined,
      ends_at: ends_at || undefined,
      publish_start_at: publish_start_at || undefined,
      status: computedStatus,
      is_featured: is_featured || false,
      is_weekly: is_weekly || false,
      day_of_week: is_weekly ? day_of_week : undefined,
    };
    
    // Handle publish_end_at separately to preserve null values
    if (publish_end_at === null) {
      cleanEventData.publish_end_at = null;
    } else if (publish_end_at) {
      cleanEventData.publish_end_at = publish_end_at;
    }

    const event = await createEvent(
      orgId,
      cleanEventData,
      supabase
    );

    if (!event) {
      return NextResponse.json(
        { error: 'Failed to create event. Check server logs for details.' },
        { status: 500 }
      );
    }

    // Generate instances for weekly events
    let instancesCount = 0;
    if (is_weekly && day_of_week !== undefined && day_of_week !== null) {
      try {
        // Determine date range for instance generation
        let startDate: string;
        let endDate: string;
        
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        if (instance_range_type === 'custom' && instance_start_date && instance_end_date) {
          startDate = instance_start_date;
          endDate = instance_end_date;
        } else if (instance_range_type === 'next_4_weeks' && instance_end_date) {
          startDate = todayStr;
          endDate = instance_end_date;
        } else if (instance_range_type === 'next_8_weeks' && instance_end_date) {
          startDate = todayStr;
          endDate = instance_end_date;
        } else {
          // Default to rest of month
          startDate = todayStr;
          const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          endDate = lastDayOfMonth.toISOString().split('T')[0];
        }
        
        const instances = await generateEventInstances(
          event.id,
          day_of_week,
          startDate,
          endDate,
          supabase
        );
        
        instancesCount = instances.length;
      } catch (error) {
        console.error('Error generating event instances:', error);
        // Don't fail the whole request if instance generation fails
      }
    }

    return NextResponse.json({ 
      event, 
      instancesCount 
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/businesses/[orgId]/events:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create event';
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}

