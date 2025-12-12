import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';

interface RouteParams {
  params: Promise<{
    orgId: string;
    eventId: string;
    instanceId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId, eventId, instanceId } = await params;
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

    const { data: instanceBands, error } = await supabase
      .from('event_instance_bands')
      .select(`
        *,
        band:bands(*)
      `)
      .eq('instance_id', instanceId)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching instance bands:', error);
      return NextResponse.json(
        { error: 'Failed to fetch instance bands' },
        { status: 500 }
      );
    }

    return NextResponse.json({ instanceBands: instanceBands || [] });
  } catch (error) {
    console.error('Error in GET /api/businesses/[orgId]/events/[eventId]/instances/[instanceId]/bands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instance bands' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId, eventId, instanceId } = await params;
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
    const { bandIds } = body;

    if (!Array.isArray(bandIds)) {
      return NextResponse.json(
        { error: 'bandIds must be an array' },
        { status: 400 }
      );
    }

    // Delete existing instance bands
    const { error: deleteError } = await supabase
      .from('event_instance_bands')
      .delete()
      .eq('instance_id', instanceId);

    if (deleteError) {
      console.error('Error deleting existing instance bands:', deleteError);
      return NextResponse.json(
        { error: 'Failed to update instance bands' },
        { status: 500 }
      );
    }

    // Insert new instance bands
    if (bandIds.length > 0) {
      const instanceBandsToInsert = bandIds.map((bandId: string, index: number) => ({
        instance_id: instanceId,
        band_id: bandId,
        order: index,
      }));

      const { error: insertError } = await supabase
        .from('event_instance_bands')
        .insert(instanceBandsToInsert);

      if (insertError) {
        console.error('Error inserting instance bands:', insertError);
        return NextResponse.json(
          { error: 'Failed to update instance bands' },
          { status: 500 }
        );
      }
    }

    // Fetch updated instance bands
    const { data: instanceBands, error: fetchError } = await supabase
      .from('event_instance_bands')
      .select(`
        *,
        band:bands(*)
      `)
      .eq('instance_id', instanceId)
      .order('order', { ascending: true });

    if (fetchError) {
      console.error('Error fetching updated instance bands:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch updated instance bands' },
        { status: 500 }
      );
    }

    return NextResponse.json({ instanceBands: instanceBands || [] });
  } catch (error) {
    console.error('Error in PUT /api/businesses/[orgId]/events/[eventId]/instances/[instanceId]/bands:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update instance bands';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
