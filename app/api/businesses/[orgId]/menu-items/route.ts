import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';
import { getMenuItems, createMenuItem } from '@/lib/menu';
import { MenuItem } from '@/lib/types';

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const menuIdParam = searchParams.get('menuId');
    const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined;
    const visibleOnly = searchParams.get('visibleOnly') === 'true';
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const search = searchParams.get('search') || undefined;

    let items: MenuItem[] = [];

    // Query menu items (menu IDs are now UUIDs)
    let query = supabase
      .from('menu_items')
      .select('*');

    if (menuIdParam && menuIdParam !== "all") {
      // Fetch items for a specific menu
      query = query.eq('menu_id', menuIdParam);
    } else {
      // Fetch items from all menus for this business
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
        query = query.in('menu_id', menuIds);
      } else {
        // No menus found, return empty array
        return NextResponse.json({ items: [] });
      }
    }

    // Apply filters
    if (categoryId !== undefined) {
      query = query.eq('menu_category_id', categoryId);
    }

    if (visibleOnly) {
      query = query.eq('is_visible', true);
    }

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query
      .order('position', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching menu items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch menu items' },
        { status: 500 }
      );
    }

    // Transform to MenuItem format
    items = (data || []).map((item: any) => {
      const priceCents = item.price_cents;
      const price = item.price ? parseFloat(String(item.price)) : undefined;
      
      return {
        id: item.id,
        menuId: item.menu_id, // UUID
        menuCategoryId: item.menu_category_id || item.category_id,
        name: item.name,
        description: item.description,
        price: price,
        priceCents: priceCents || (price ? Math.round(price * 100) : undefined),
        isVisible: item.is_visible !== false,
        isFeatured: item.is_featured || false,
        position: item.position || 0,
        isArchived: item.is_archived || false,
        created_at: item.created_at,
        updated_at: item.updated_at,
      } as MenuItem;
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error in GET /api/businesses/[orgId]/menu-items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
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

    const body = await request.json();
    const { 
      name, 
      menuId,
      menuCategoryId, 
      description, 
      priceCents, 
      price, 
      imageUrl, 
      isVisible, 
      isFeatured, 
      position 
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!menuId) {
      return NextResponse.json({ error: 'Menu is required' }, { status: 400 });
    }

    // Convert price to priceCents if needed
    let finalPriceCents = priceCents;
    if (!finalPriceCents && price !== undefined) {
      finalPriceCents = Math.round(price * 100);
    }

    console.log('Creating menu item for menuId:', menuId);
    console.log('Menu item data:', { name, menuCategoryId, priceCents: finalPriceCents });

    const item = await createMenuItem(menuId, {
      name,
      menuCategoryId: menuCategoryId || undefined,
      description,
      priceCents: finalPriceCents,
      imageUrl,
      isVisible: isVisible !== undefined ? isVisible : true,
      isFeatured: isFeatured !== undefined ? isFeatured : false,
      position: position || 0,
      isArchived: false,
    }, supabase);

    if (!item) {
      // Log more details about why creation failed
      console.error('createMenuItem returned null - checking for errors');
      return NextResponse.json(
        { error: 'Failed to create menu item. Check server logs for details.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error('Error in POST /api/businesses/[orgId]/menu-items:', error);
    const errorMessage = error?.message || error?.error?.message || 'Unknown error';
    const errorCode = error?.code || error?.error?.code;
    const errorDetails = error?.details || error?.error?.details;
    const errorHint = error?.hint || error?.error?.hint;
    
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: `Failed to create menu item: ${errorMessage}`,
        ...(errorCode && { code: errorCode }),
        ...(errorDetails && { details: errorDetails }),
        ...(errorHint && { hint: errorHint }),
      },
      { status: 500 }
    );
  }
}

