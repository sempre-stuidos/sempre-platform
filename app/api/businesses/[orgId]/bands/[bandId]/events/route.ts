import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';

interface RouteParams {
  params: Promise<{
    orgId: string;
    bandId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId, bandId } = await params;
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

    // Verify band belongs to org
    const { data: band } = await supabase
      .from('bands')
      .select('org_id')
      .eq('id', bandId)
      .single();

    if (!band || band.org_id !== orgId) {
      return NextResponse.json({ error: 'Band not found' }, { status: 404 });
    }

    // Get all events that have this band directly (via event_bands)
    const { data: eventBands, error: eventBandsError } = await supabase
      .from('event_bands')
      .select('event_id')
      .eq('band_id', bandId);

    if (eventBandsError) {
      console.error('Error fetching event bands:', eventBandsError);
      return NextResponse.json(
        { error: 'Failed to fetch event bands' },
        { status: 500 }
      );
    }

    // Get all event instances that have this band (via event_instance_bands)
    const { data: instanceBands, error: instanceBandsError } = await supabase
      .from('event_instance_bands')
      .select('instance_id')
      .eq('band_id', bandId);

    if (instanceBandsError) {
      console.error('Error fetching instance bands:', instanceBandsError);
      return NextResponse.json(
        { error: 'Failed to fetch instance bands' },
        { status: 500 }
      );
    }

    // Collect unique event IDs from both sources
    const eventIdsSet = new Set<string>();
    
    // Add events from direct event_bands
    if (eventBands) {
      eventBands.forEach(eb => {
        if (eb.event_id) {
          eventIdsSet.add(eb.event_id);
        }
      });
    }

    // Add events from event_instance_bands by fetching the instances
    if (instanceBands && instanceBands.length > 0) {
      const instanceIds = instanceBands.map(ib => ib.instance_id);
      
      const { data: instances, error: instancesError } = await supabase
        .from('event_instances')
        .select('event_id')
        .in('id', instanceIds);

      if (!instancesError && instances) {
        instances.forEach(instance => {
          if (instance.event_id) {
            eventIdsSet.add(instance.event_id);
          }
        });
      }
    }

    const eventIds = Array.from(eventIdsSet);

    if (eventIds.length === 0) {
      return NextResponse.json({ events: [] });
    }

    // Fetch the actual events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, starts_at, ends_at, is_weekly, day_of_week, status, image_url')
      .in('id', eventIds)
      .eq('org_id', orgId)
      .order('starts_at', { ascending: false, nullsFirst: false });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    return NextResponse.json({ events: events || [] });
  } catch (error) {
    console.error('Error in GET /api/businesses/[orgId]/bands/[bandId]/events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

