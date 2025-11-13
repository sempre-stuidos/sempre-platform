import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/organizations';
import { archiveMenuItem, unarchiveMenuItem } from '@/lib/menu';

interface RouteParams {
  params: Promise<{
    orgId: string;
    itemId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId, itemId } = await params;
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

    const body = await request.json();
    const { action } = body; // 'archive' or 'unarchive'

    let success: boolean;
    if (action === 'unarchive') {
      success = await unarchiveMenuItem(parseInt(itemId));
    } else {
      success = await archiveMenuItem(parseInt(itemId));
    }

    if (!success) {
      return NextResponse.json(
        { error: `Failed to ${action} menu item` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/organizations/[orgId]/menu-items/[itemId]/archive:', error);
    return NextResponse.json(
      { error: 'Failed to archive/unarchive menu item' },
      { status: 500 }
    );
  }
}

