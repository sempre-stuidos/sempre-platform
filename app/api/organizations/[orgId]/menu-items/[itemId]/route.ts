import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/organizations';
import { getMenuItemById, updateMenuItem, archiveMenuItem } from '@/lib/menu';

interface RouteParams {
  params: Promise<{
    orgId: string;
    itemId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const item = await getMenuItemById(parseInt(itemId), supabase);

    if (!item) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error in GET /api/organizations/[orgId]/menu-items/[itemId]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu item' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Convert price to priceCents if needed
    let finalPriceCents = priceCents;
    if (!finalPriceCents && price !== undefined) {
      finalPriceCents = Math.round(price * 100);
    }

    console.log('Updating menu item:', itemId);
    console.log('Update data:', { name, menuId, menuCategoryId, priceCents: finalPriceCents });
    console.log('Full body:', body);

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (menuId !== undefined && menuId !== null) updates.menuId = menuId;
    if (menuCategoryId !== undefined) updates.menuCategoryId = menuCategoryId;
    if (description !== undefined) updates.description = description;
    if (finalPriceCents !== undefined) updates.priceCents = finalPriceCents;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (isVisible !== undefined) updates.isVisible = isVisible;
    if (isFeatured !== undefined) updates.isFeatured = isFeatured;
    if (position !== undefined) updates.position = position;

    console.log('Updates object:', updates);
    const item = await updateMenuItem(parseInt(itemId), updates, supabase);

    if (!item) {
      console.error('updateMenuItem returned null - check server logs for details');
      return NextResponse.json(
        { error: 'Failed to update menu item. Check server logs for details.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error in PATCH /api/organizations/[orgId]/menu-items/[itemId]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to update menu item: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const success = await archiveMenuItem(parseInt(itemId), supabase);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to archive menu item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/organizations/[orgId]/menu-items/[itemId]:', error);
    return NextResponse.json(
      { error: 'Failed to archive menu item' },
      { status: 500 }
    );
  }
}

