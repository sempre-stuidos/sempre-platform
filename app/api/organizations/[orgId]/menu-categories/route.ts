import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/organizations';
import { getMenuCategories, createMenuCategory } from '@/lib/menu-categories';
import { getOrCreateDefaultMenu } from '@/lib/menus';

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

    // Get or create menu for this organization
    const menu = await getOrCreateDefaultMenu(orgId, supabase);
    if (!menu) {
      return NextResponse.json(
        { error: 'Failed to get or create menu' },
        { status: 500 }
      );
    }

    // Get optional query parameters
    const { searchParams } = new URL(request.url);
    const menuIdParam = searchParams.get('menuId');
    const menuId = menuIdParam ? parseInt(menuIdParam) : menu.id; // Use provided menuId or default to the menu

    const categories = await getMenuCategories(menuId, undefined, supabase);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error in GET /api/organizations/[orgId]/menu-categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu categories' },
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

    // Verify user has access to this organization
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get or create menu for this organization
    const menu = await getOrCreateDefaultMenu(orgId, supabase);
    if (!menu) {
      return NextResponse.json(
        { error: 'Failed to get or create menu' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { name, menuId, slug, sortOrder } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!menuId) {
      return NextResponse.json({ error: 'Menu is required' }, { status: 400 });
    }

    console.log('Creating category with menuId:', menuId);
    console.log('Category data:', { name, menuId, slug, sortOrder });

    const category = await createMenuCategory(
      menuId,
      {
        name,
        slug: slug || undefined,
        sortOrder: sortOrder || 0,
        isActive: true,
      },
      supabase
    );

    if (!category) {
      console.error('createMenuCategory returned null - check server logs for details');
      return NextResponse.json(
        { error: 'Failed to create menu category. Check server logs for details.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error in POST /api/organizations/[orgId]/menu-categories:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create menu category: ${errorMessage}` },
      { status: 500 }
    );
  }
}

