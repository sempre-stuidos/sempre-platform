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

    // Verify instance belongs to event and event belongs to org
    const { data: instance, error } = await supabase
      .from('event_instances')
      .select(`
        *,
        event:events!inner(org_id)
      `)
      .eq('id', instanceId)
      .eq('event_id', eventId)
      .single();

    if (error || !instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    if ((instance.event as { org_id: string }).org_id !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { event, ...instanceData } = instance;

    return NextResponse.json({ instance: instanceData });
  } catch (error) {
    console.error('Error in GET /api/businesses/[orgId]/events/[eventId]/instances/[instanceId]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instance' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Verify instance belongs to event and event belongs to org
    const { data: instance } = await supabase
      .from('event_instances')
      .select(`
        *,
        event:events!inner(org_id)
      `)
      .eq('id', instanceId)
      .eq('event_id', eventId)
      .single();

    if (!instance || (instance.event as { org_id: string }).org_id !== orgId) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    const body = await request.json();
    const { custom_description, custom_image_url, status } = body;

    const updateData: Record<string, unknown> = {};
    if (custom_description !== undefined) {
      updateData.custom_description = custom_description?.trim() || null;
    }
    if (custom_image_url !== undefined) {
      updateData.custom_image_url = custom_image_url || null;
    }
    if (status !== undefined) {
      updateData.status = status;
    }

    const { data: updatedInstance, error: updateError } = await supabase
      .from('event_instances')
      .update(updateData)
      .eq('id', instanceId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating instance:', updateError);
      return NextResponse.json(
        { error: 'Failed to update instance' },
        { status: 500 }
      );
    }

    return NextResponse.json({ instance: updatedInstance });
  } catch (error) {
    console.error('Error in PATCH /api/businesses/[orgId]/events/[eventId]/instances/[instanceId]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update instance';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Verify instance belongs to event and event belongs to org
    const { data: instance } = await supabase
      .from('event_instances')
      .select(`
        *,
        event:events!inner(org_id)
      `)
      .eq('id', instanceId)
      .eq('event_id', eventId)
      .single();

    if (!instance || (instance.event as { org_id: string }).org_id !== orgId) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    // Delete the instance
    const { error: deleteError } = await supabase
      .from('event_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      console.error('Error deleting instance:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete instance' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/businesses/[orgId]/events/[eventId]/instances/[instanceId]:', error);
    return NextResponse.json(
      { error: 'Failed to delete instance' },
      { status: 500 }
    );
  }
}
