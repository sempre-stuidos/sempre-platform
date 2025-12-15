import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';
import { getEventInstances, generateEventInstances } from '@/lib/event-instances';

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

    // Verify event belongs to org
    const { data: event } = await supabase
      .from('events')
      .select('org_id')
      .eq('id', eventId)
      .single();

    if (!event || event.org_id !== orgId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const instances = await getEventInstances(eventId, supabase);

    return NextResponse.json({ instances });
  } catch (error) {
    console.error('Error in GET /api/businesses/[orgId]/events/[eventId]/instances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event instances' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Verify event belongs to org and is weekly
    const { data: event } = await supabase
      .from('events')
      .select('org_id, is_weekly, day_of_week')
      .eq('id', eventId)
      .single();

    if (!event || event.org_id !== orgId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!event.is_weekly || event.day_of_week === null || event.day_of_week === undefined) {
      return NextResponse.json(
        { error: 'Event must be a weekly event with a day_of_week set' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'Dates must be in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (end < start) {
      return NextResponse.json(
        { error: 'endDate must be after startDate' },
        { status: 400 }
      );
    }

    // Generate instances (will skip duplicates due to unique constraint)
    const instances = await generateEventInstances(
      eventId,
      event.day_of_week,
      startDate,
      endDate,
      supabase
    );

    return NextResponse.json({ 
      instancesCount: instances.length,
      instances 
    });
  } catch (error) {
    console.error('Error in POST /api/businesses/[orgId]/events/[eventId]/instances:', error);
    return NextResponse.json(
      { error: 'Failed to generate event instances' },
      { status: 500 }
    );
  }
}
