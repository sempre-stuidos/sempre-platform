import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';

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

    const { data: eventBands, error } = await supabase
      .from('event_bands')
      .select(`
        *,
        band:bands(*)
      `)
      .eq('event_id', eventId)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching event bands:', error);
      return NextResponse.json(
        { error: 'Failed to fetch event bands' },
        { status: 500 }
      );
    }

    return NextResponse.json({ eventBands: eventBands || [] });
  } catch (error) {
    console.error('Error in GET /api/businesses/[orgId]/events/[eventId]/bands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event bands' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();
    const { bandIds } = body;

    if (!Array.isArray(bandIds)) {
      return NextResponse.json(
        { error: 'bandIds must be an array' },
        { status: 400 }
      );
    }

    // Delete existing event bands
    const { error: deleteError } = await supabase
      .from('event_bands')
      .delete()
      .eq('event_id', eventId);

    if (deleteError) {
      console.error('Error deleting existing event bands:', deleteError);
      return NextResponse.json(
        { error: 'Failed to update event bands' },
        { status: 500 }
      );
    }

    // Insert new event bands
    if (bandIds.length > 0) {
      const eventBandsToInsert = bandIds.map((bandId: string, index: number) => ({
        event_id: eventId,
        band_id: bandId,
        order: index,
      }));

      const { error: insertError } = await supabase
        .from('event_bands')
        .insert(eventBandsToInsert);

      if (insertError) {
        console.error('Error inserting event bands:', insertError);
        return NextResponse.json(
          { error: 'Failed to update event bands' },
          { status: 500 }
        );
      }
    }

    // Fetch updated event bands
    const { data: eventBands, error: fetchError } = await supabase
      .from('event_bands')
      .select(`
        *,
        band:bands(*)
      `)
      .eq('event_id', eventId)
      .order('order', { ascending: true });

    if (fetchError) {
      console.error('Error fetching updated event bands:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch updated event bands' },
        { status: 500 }
      );
    }

    return NextResponse.json({ eventBands: eventBands || [] });
  } catch (error) {
    console.error('Error in PUT /api/businesses/[orgId]/events/[eventId]/bands:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update event bands';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
