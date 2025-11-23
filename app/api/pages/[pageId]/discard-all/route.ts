import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSectionsForPage, discardSectionChanges } from '@/lib/page-sections-v2';
import { getPageById } from '@/lib/pages';
import { getUserRoleInOrg } from '@/lib/businesses';

interface RouteParams {
  params: Promise<{
    pageId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Get the page to verify org access
    const page = await getPageById(pageId, supabase);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Verify user has access to this organization
    const role = await getUserRoleInOrg(user.id, page.org_id, supabase);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all sections for this page
    const sections = await getSectionsForPage(pageId, supabase);

    // Discard changes for all sections with draft/dirty status
    const sectionsToDiscard = sections.filter(s => s.status === 'dirty' || s.status === 'draft');
    
    for (const section of sectionsToDiscard) {
      const result = await discardSectionChanges(section.id, supabase);
      if (!result.success) {
        console.error(`Error discarding section ${section.id}:`, result.error);
        // Continue with other sections
      }
    }

    return NextResponse.json({ 
      success: true,
      discarded: sectionsToDiscard.length 
    });
  } catch (error) {
    console.error('Error in POST /api/pages/[pageId]/discard-all:', error);
    return NextResponse.json(
      { error: 'Failed to discard all changes' },
      { status: 500 }
    );
  }
}

