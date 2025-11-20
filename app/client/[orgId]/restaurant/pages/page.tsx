import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getOrganizationById } from '@/lib/businesses';
import { getPagesForOrg } from '@/lib/pages';
import { getSectionsForPage } from '@/lib/page-sections-v2';
import { PagesListTable } from '@/components/pages-list-table';

interface PagesPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function PagesPage({ params }: PagesPageProps) {
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

  const { data: { user } } = await supabase.auth.getUser();
  const organization = await getOrganizationById(orgId, supabase);
  
  // Get pages for this organization
  const pages = await getPagesForOrg(orgId, supabase);
  
  // For each page, check if any sections are dirty to determine status
  // Status is "Published" if all sections are published, otherwise "Has Unpublished Changes"
  const pagesWithStatus = await Promise.all(
    pages.map(async (page) => {
      const sections = await getSectionsForPage(page.id, supabase);
      const hasDirtySections = sections.some(s => s.status === 'dirty');
      const allPublished = sections.length > 0 && sections.every(s => s.status === 'published');
      return {
        ...page,
        hasUnpublishedChanges: hasDirtySections || !allPublished,
      };
    })
  );

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
            <p className="text-muted-foreground mt-2">
              Manage your restaurant site pages
            </p>
          </div>
          <PagesListTable orgId={orgId} pages={pagesWithStatus} organization={organization} />
        </div>
      </div>
    </div>
  );
}

