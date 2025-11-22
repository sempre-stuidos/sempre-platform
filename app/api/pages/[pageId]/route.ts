import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPageById } from '@/lib/pages';
import { getUserRoleInOrg } from '@/lib/businesses';

interface RouteParams {
  params: Promise<{
    pageId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { pageId } = await params;
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

    // Get the page
    const page = await getPageById(pageId, supabase);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Verify user has access to this organization
    const role = await getUserRoleInOrg(user.id, page.org_id, supabase);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error in GET /api/pages/[pageId]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { pageId } = await params;
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

    // Get the page
    const page = await getPageById(pageId, supabase);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Verify user has access to this organization
    const role = await getUserRoleInOrg(user.id, page.org_id, supabase);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { name, slug, base_url } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug can only contain lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    // Validate base_url if provided
    if (base_url && base_url.trim()) {
      try {
        new URL(base_url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid base URL format' },
          { status: 400 }
        );
      }
    }

    // Check if slug is already taken by another page in the same org
    const { data: existingPage } = await supabase
      .from('pages')
      .select('id')
      .eq('org_id', page.org_id)
      .eq('slug', slug)
      .neq('id', pageId)
      .maybeSingle();

    if (existingPage) {
      return NextResponse.json(
        { error: 'A page with this slug already exists' },
        { status: 400 }
      );
    }

    // Update the page
    const { data: updatedPage, error: updateError } = await supabase
      .from('pages')
      .update({
        name: name.trim(),
        slug: slug.trim(),
        base_url: base_url?.trim() || null,
      })
      .eq('id', pageId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating page:', updateError);
      return NextResponse.json(
        { error: 'Failed to update page' },
        { status: 500 }
      );
    }

    return NextResponse.json({ page: updatedPage });
  } catch (error) {
    console.error('Error in PATCH /api/pages/[pageId]:', error);
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    );
  }
}

