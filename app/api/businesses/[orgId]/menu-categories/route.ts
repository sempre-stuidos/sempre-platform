import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';
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

    // Verify user has access to this business
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get optional query parameters
    const { searchParams } = new URL(request.url);
    const menuIdParam = searchParams.get('menuId');

    // Query menu categories (menu IDs are now UUIDs)
    let query = supabase
      .from('menu_categories')
      .select('*')
      .eq('is_active', true);

    if (menuIdParam && menuIdParam !== "all") {
      // Fetch categories for a specific menu
      query = query.eq('menu_id', menuIdParam);
    } else {
      // Fetch categories from all menus for this business
      const { data: menus, error: menusError } = await supabase
        .from('menus')
        .select('id')
        .eq('business_id', orgId)
        .eq('is_active', true);

      if (menusError) {
        console.error('Error fetching menus:', menusError);
        return NextResponse.json(
          { error: 'Failed to fetch menus' },
          { status: 500 }
        );
      }

      if (menus && menus.length > 0) {
        const menuIds = menus.map(m => m.id);
        // Ensure all menu IDs are strings (UUIDs)
        const menuIdStrings = menuIds.map(id => String(id));
        query = query.in('menu_id', menuIdStrings);
      } else {
        // No menus found, return empty array
        return NextResponse.json({ categories: [] });
      }
    }

    query = query
      .order('sort_order', { ascending: true, nullsLast: true })
      .order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching menu categories:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { 
          error: 'Failed to fetch menu categories',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    // Transform to MenuCategory format using the library function for consistency
    const categories = (data || []).map((cat: any) => {
      // Use the same transformation as the library function
      return {
        id: cat.id,
        menuId: String(cat.menu_id), // Ensure UUID is a string
        menuType: cat.menu_type || undefined,
        name: cat.name,
        slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        sortOrder: cat.sort_order || 0,
        isActive: cat.is_active !== false,
        created_at: cat.created_at,
        updated_at: cat.updated_at,
        clientId: cat.client_id || undefined,
      };
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error in GET /api/businesses/[orgId]/menu-categories:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to fetch menu categories',
        details: errorMessage
      },
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

    // Verify user has access to this business
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get or create menu for this business
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
    console.error('Error in POST /api/businesses/[orgId]/menu-categories:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create menu category: ${errorMessage}` },
      { status: 500 }
    );
  }
}

