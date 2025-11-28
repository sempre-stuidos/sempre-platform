import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { publishSection, getSectionById } from '@/lib/page-sections-v2';
import { getUserRoleInOrg } from '@/lib/businesses';
import { validateSectionContent } from '@/lib/section-schemas';

interface RouteParams {
  params: Promise<{
    sectionId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sectionId } = await params;
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

    // Get the section to verify org access
    const section = await getSectionById(sectionId, supabase);
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Verify user has access to this organization
    const role = await getUserRoleInOrg(user.id, section.org_id, supabase);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate draft_content before publishing
    const validation = validateSectionContent(section.component, section.draft_content);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: `Cannot publish: ${validation.error}`,
          details: validation.details 
        },
        { status: 400 }
      );
    }

    // Publish the section
    const result = await publishSection(sectionId, supabase);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to publish section' },
        { status: 500 }
      );
    }

    return NextResponse.json({ section: result.section });
  } catch (error) {
    console.error('Error in POST /api/sections/[sectionId]/publish:', error);
    return NextResponse.json(
      { error: 'Failed to publish section' },
      { status: 500 }
    );
  }
}

