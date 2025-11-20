import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createPreviewToken } from '@/lib/preview';
import { getPageById } from '@/lib/pages';
import { getSectionById } from '@/lib/page-sections-v2';
import { getUserRoleInOrg } from '@/lib/businesses';

export async function POST(request: NextRequest) {
  try {
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

    // Parse request body
    const body = await request.json();
    const { orgId, pageId, sectionId, expiresInHours } = body;

    if (!orgId || !pageId) {
      return NextResponse.json(
        { error: 'orgId and pageId are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this organization
    const role = await getUserRoleInOrg(user.id, orgId, supabase);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify page exists and belongs to org
    const page = await getPageById(pageId, supabase);
    if (!page || page.org_id !== orgId) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // If sectionId is provided, verify it exists and belongs to the page
    if (sectionId) {
      const section = await getSectionById(sectionId, supabase);
      if (!section || section.page_id !== pageId || section.org_id !== orgId) {
        return NextResponse.json({ error: 'Section not found' }, { status: 404 });
      }
    }

    // Create preview token
    const result = await createPreviewToken(
      orgId,
      pageId,
      sectionId,
      user.id,
      expiresInHours || 24,
      supabase
    );

    if (!result.success || !result.token) {
      return NextResponse.json(
        { error: result.error || 'Failed to create preview token' },
        { status: 500 }
      );
    }

    return NextResponse.json({ token: result.token });
  } catch (error) {
    console.error('Error in POST /api/preview/create:', error);
    return NextResponse.json(
      { error: 'Failed to create preview token' },
      { status: 500 }
    );
  }
}

