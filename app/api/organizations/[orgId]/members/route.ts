import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  getOrganizationMembers,
  addUserToOrganization,
  getUserRoleInOrg,
} from '@/lib/organizations';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserRole } from '@/lib/invitations';

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

    // Check if user is Admin (use supabaseAdmin for server-side)
    const userRole = await getUserRole(user.id, supabaseAdmin);
    const isAdmin = userRole === 'Admin';
    
    // Verify user has access to this organization (or is Admin)
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!role && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use supabaseAdmin for Admins to bypass RLS and see all members including owner
    const members = await getOrganizationMembers(orgId, isAdmin ? supabaseAdmin : supabase);

    // Enrich with email addresses from auth
    const membersWithEmails = await Promise.all(
      members.map(async (member) => {
        try {
          const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(member.user_id);
          return {
            ...member,
            email: user?.email || undefined,
          };
        } catch (error) {
          console.error('Error fetching user email:', error);
          return member;
        }
      })
    );

    return NextResponse.json({ members: membersWithEmails });
  } catch (error) {
    console.error('Error in GET /api/organizations/[orgId]/members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
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

    // Check if user is Admin (use supabaseAdmin for server-side)
    const userRole = await getUserRole(user.id, supabaseAdmin);
    const isAdmin = userRole === 'Admin';
    
    // Verify user is owner, admin, or system Admin
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!isAdmin && (!role || (role !== 'owner' && role !== 'admin'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role: memberRole } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!memberRole || !['owner', 'admin', 'staff'].includes(memberRole)) {
      return NextResponse.json(
        { error: 'Valid role is required (owner, admin, or staff)' },
        { status: 400 }
      );
    }

    // Verify the user exists
    const { data: targetUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const result = await addUserToOrganization(orgId, userId, memberRole);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to add member' },
        { status: 500 }
      );
    }

    return NextResponse.json({ membership: result.membership }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/organizations/[orgId]/members:', error);
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    );
  }
}

