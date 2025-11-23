import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getOrganizationById } from '@/lib/businesses';
import { getPageWithSections } from '@/lib/pages';
import { supabaseAdmin } from '@/lib/supabase';
import { PageSectionsTable } from '@/components/page-sections-table';
import { PageActionsBar } from '@/components/page-actions-bar';
import { Button } from '@/components/ui/button';
import { IconArrowLeft } from '@tabler/icons-react';
import { notFound } from 'next/navigation';
import { PageDetailsClient } from '@/components/page-details-client';

interface EditPageProps {
  params: Promise<{
    orgId: string;
    pageId: string;
  }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const { orgId, pageId } = await params;
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

  const organization = await getOrganizationById(orgId, supabaseAdmin);
  
  // Get page with sections
  let pageWithSections;
  try {
    pageWithSections = await getPageWithSections(pageId, supabase);
  } catch (error) {
    console.error('Error fetching page:', error);
    // Check if it's a table not found error
    if (error instanceof Error && (error.message.includes('relation') || error.message.includes('does not exist'))) {
      return (
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="rounded-lg border bg-card p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Database Tables Not Found</h2>
                <p className="text-muted-foreground mb-4">
                  The pages and page_sections_v2 tables don&apos;t exist yet. Please run the database migrations first.
                </p>
                <p className="text-sm text-muted-foreground">
                  Run: <code className="bg-muted px-2 py-1 rounded">supabase migration up</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    notFound();
  }
  
  if (!pageWithSections) {
    console.error('Page not found:', pageId);
    notFound();
  }

  // Check if page belongs to this org
  if (pageWithSections.org_id !== orgId) {
    console.error('Page org mismatch:', pageWithSections.org_id, 'expected:', orgId);
    notFound();
  }

  const hasDirtySections = pageWithSections.sections.some(s => s.status === 'dirty');

  return (
    <PageDetailsClient pageName={pageWithSections.name}>
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
                <Link href={`/client/${orgId}/restaurant/pages`}>
                  <Button variant="ghost" size="sm" className="mt-2">
                    <IconArrowLeft className="h-4 w-4 mr-2" />
                    Back to Pages
                  </Button>
                </Link>
              </div>
          </div>
          
          <div className="mb-4">
            <PageActionsBar 
              orgId={orgId}
              pageId={pageId}
              pageSlug={pageWithSections.slug}
              hasDirtySections={hasDirtySections}
              business={organization}
              page={pageWithSections}
            />
          </div>

          <PageSectionsTable 
            orgId={orgId}
            pageId={pageId}
            pageSlug={pageWithSections.slug}
            sections={pageWithSections.sections}
            organization={organization}
            pageBaseUrl={pageWithSections.base_url}
          />
        </div>
      </div>
    </div>
    </PageDetailsClient>
  );
}

