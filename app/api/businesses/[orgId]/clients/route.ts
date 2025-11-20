import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';
import { getUserRole } from '@/lib/invitations';
import { supabaseAdmin } from '@/lib/supabase';

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

    // Check if user is Admin
    const userRole = await getUserRole(user.id, supabaseAdmin);
    const isAdmin = userRole === 'Admin';
    
    // Verify user has access to this business (or is Admin)
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!role && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all clients linked to this business
    // Use supabaseAdmin for Admins to bypass RLS
    const client = isAdmin ? supabaseAdmin : supabase;
    const { data: clients, error } = await client
      .from('clients')
      .select('*')
      .eq('business_id', orgId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      );
    }

    return NextResponse.json({ clients: clients || [] });
  } catch (error) {
    console.error('Error in GET /api/businesses/[orgId]/clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

