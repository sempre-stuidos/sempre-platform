import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  getBusinessMembers,
  addUserToBusiness,
  getUserRoleInOrg,
  createBusinessMember,
} from '@/lib/businesses';
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
    
    // Verify user has access to this business (or is Admin)
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!role && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use supabaseAdmin for Admins to bypass RLS and see all members including owner
    const members = await getBusinessMembers(orgId, isAdmin ? supabaseAdmin : supabase);

    // Enrich with email addresses and password status from auth
    const membersWithEmails = await Promise.all(
      members.map(async (member) => {
        try {
          const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(member.user_id);
          
          // Check if user needs password
          // A user needs a password if they don't have email provider in their providers array
          // or if they're a client role (clients use login codes for first-time setup)
          // Note: providers is not in the TypeScript type but exists on the user object
          const userWithProviders = user as any;
          const hasEmailProvider = userWithProviders?.providers?.includes('email') || false;
          const needsPassword = !hasEmailProvider || 
            (member.role === 'client' && !hasEmailProvider);
          
          return {
            ...member,
            email: user?.email || undefined,
            needs_password: needsPassword,
          };
        } catch (error) {
          console.error('Error fetching user email:', error);
          return {
            ...member,
            needs_password: false,
          };
        }
      })
    );

    return NextResponse.json({ members: membersWithEmails });
  } catch (error) {
    console.error('Error in GET /api/businesses/[orgId]/members:', error);
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
    const { email, name, role: memberRole } = body;

    // Validate input
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    if (!memberRole || !['owner', 'admin', 'staff'].includes(memberRole)) {
      return NextResponse.json(
        { error: 'Valid role is required (owner, admin, or staff)' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Create business member (creates user account if needed, assigns Client role, creates membership)
    const result = await createBusinessMember(orgId, email.trim(), name.trim(), memberRole);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to add member' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      userId: result.userId,
      message: 'Member added successfully. They will receive login instructions via email.'
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/businesses/[orgId]/members:', error);
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    );
  }
}

