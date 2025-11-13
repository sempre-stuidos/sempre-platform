import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  getUserRoleInOrg,
  updateUserRoleInOrg,
  removeUserFromOrganization,
} from '@/lib/organizations';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserRole } from '@/lib/invitations';

interface RouteParams {
  params: Promise<{
    orgId: string;
    userId: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId, userId } = await params;
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

    // Check if user is Admin (use supabaseAdmin for server-side)
    const userRole = await getUserRole(user.id, supabaseAdmin);
    const isAdmin = userRole === 'Admin';
    
    // Verify user is owner, admin, or system Admin
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!isAdmin && (!role || (role !== 'owner' && role !== 'admin'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { role: newRole } = body;

    if (!newRole || !['owner', 'admin', 'staff', 'client'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Valid role is required' },
        { status: 400 }
      );
    }

    const result = await updateUserRoleInOrg(orgId, userId, newRole);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update member role' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/organizations/[orgId]/members/[userId]:', error);
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId, userId } = await params;
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

    // Check if user is Admin (use supabaseAdmin for server-side)
    const userRole = await getUserRole(user.id, supabaseAdmin);
    const isAdmin = userRole === 'Admin';
    
    // Verify user is owner, admin, or system Admin
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!isAdmin && (!role || (role !== 'owner' && role !== 'admin'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent removing the last owner
    // (This check should be done in the removeUserFromOrganization function, but adding here for safety)
    if (userId === user.id && role === 'owner') {
      // Check if there are other owners
      // For now, we'll allow it - the business logic should handle this
    }

    const result = await removeUserFromOrganization(orgId, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/organizations/[orgId]/members/[userId]:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}

