import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/organizations';
import { getMenuItems, createMenuItem } from '@/lib/menu';
import { getOrCreateDefaultMenu } from '@/lib/menus';
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

    // Verify user has access to this organization
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

    if (menuIdParam && menuIdParam !== "all") {
      // Fetch items for a specific menu
      const menuId = parseInt(menuIdParam);
      items = await getMenuItems(menuId, {
        categoryId,
        visibleOnly,
        includeArchived,
        search,
      }, supabase);
    } else {
      // Fetch items from all menus for this organization
      const { data: menus, error: menusError } = await supabase
        .from('menus')
        .select('id')
        .eq('organization_id', orgId)
        .eq('is_active', true);

      if (menusError) {
        console.error('Error fetching menus:', menusError);
        return NextResponse.json(
          { error: 'Failed to fetch menus' },
          { status: 500 }
        );
      }

      // Fetch items from all menus
      if (menus && menus.length > 0) {
        const menuIds = menus.map(m => m.id);
        const allItemsPromises = menuIds.map(menuId => 
          getMenuItems(menuId, {
            categoryId,
            visibleOnly,
            includeArchived,
            search,
          }, supabase)
        );
        const allItemsArrays = await Promise.all(allItemsPromises);
        items = allItemsArrays.flat();
      }
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error in GET /api/organizations/[orgId]/menu-items:', error);
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

    // Verify user has access to this organization
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get or create client linked to this organization
    let clientData: { id: number } | null = null;
    
    // First, try to find existing client
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('organization_id', orgId)
      .limit(1)
      .single();

    if (existingClient) {
      clientData = existingClient;
    } else {
      // No client found - create one automatically
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .single();

      const clientName = orgData?.name || 'Restaurant Client';
      const today = new Date().toISOString().split('T')[0];

      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert([{
          name: clientName,
          business_type: 'Restaurant',
          status: 'Active',
          priority: 'Medium',
          contact_email: user.email || 'client@example.com',
          last_contact: today,
          organization_id: orgId,
        }])
        .select('id')
        .single();

      if (createError || !newClient) {
        console.error('Error creating client:', createError);
        return NextResponse.json(
          { error: 'Failed to create client' },
          { status: 500 }
        );
      }

      clientData = newClient;
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
      return NextResponse.json(
        { error: 'Failed to create menu item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error in POST /api/organizations/[orgId]/menu-items:', error);
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    );
  }
}

