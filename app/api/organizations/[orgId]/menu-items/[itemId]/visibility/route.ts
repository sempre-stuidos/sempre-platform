import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/organizations';
import { toggleMenuItemVisibility } from '@/lib/menu';

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
    const { isVisible } = body;

    if (typeof isVisible !== 'boolean') {
      return NextResponse.json({ error: 'isVisible must be a boolean' }, { status: 400 });
    }

    console.log('Toggling visibility for item:', itemId, 'to:', isVisible);
    const success = await toggleMenuItemVisibility(parseInt(itemId), isVisible, supabase);

    if (!success) {
      console.error('toggleMenuItemVisibility returned false');
      return NextResponse.json(
        { error: 'Failed to toggle menu item visibility' },
        { status: 500 }
      );
    }

    console.log('Visibility toggled successfully');
    return NextResponse.json({ success: true, isVisible });
  } catch (error) {
    console.error('Error in POST /api/organizations/[orgId]/menu-items/[itemId]/visibility:', error);
    return NextResponse.json(
      { error: 'Failed to toggle menu item visibility' },
      { status: 500 }
    );
  }
}

