import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';
import { getEventInstances } from '@/lib/event-instances';

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
