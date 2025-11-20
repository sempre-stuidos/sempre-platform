import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserRoleInOrg } from '@/lib/businesses';
import { getMenuItems } from '@/lib/menu';
import { getMenus } from '@/lib/menus';

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

    // Get all menus for this business
    const menus = await getMenus(orgId, supabase);

    // Get all menu items with images from all menus
    const allMenuItems = [];
    for (const menu of menus) {
      const items = await getMenuItems(menu.id, {}, supabase);
      allMenuItems.push(...items);
    }

    // Filter to only items with images and extract unique images
    const imageMap = new Map<string, { imageUrl: string; menuItemName: string; menuItemId: number }>();
    
    for (const item of allMenuItems) {
      if (item.imageUrl && !imageMap.has(item.imageUrl)) {
        imageMap.set(item.imageUrl, {
          imageUrl: item.imageUrl,
          menuItemName: item.name,
          menuItemId: item.id,
        });
      }
    }

    const images = Array.from(imageMap.values());

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error in GET /api/businesses/[orgId]/menu-item-images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu item images' },
      { status: 500 }
    );
  }
}

