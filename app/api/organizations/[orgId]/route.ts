import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getUserRoleInOrg,
} from '@/lib/organizations';

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

    // Verify user has access to this organization
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const organization = await getOrganizationById(orgId, supabase);

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ organization, role });
  } catch (error) {
    console.error('Error in GET /api/organizations/[orgId]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Verify user is owner or admin
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!role || (role !== 'owner' && role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    const result = await updateOrganization(orgId, { name, description });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update organization' },
        { status: 500 }
      );
    }

    return NextResponse.json({ organization: result.organization });
  } catch (error) {
    console.error('Error in PATCH /api/organizations/[orgId]:', error);
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Verify user is owner
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await deleteOrganization(orgId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete organization' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/organizations/[orgId]:', error);
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}

