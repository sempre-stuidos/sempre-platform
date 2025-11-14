import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getOrganizationById } from '@/lib/organizations';
import { getPageWithSections } from '@/lib/pages';
import { PageSectionsTable } from '@/components/page-sections-table';
import { PageActionsBar } from '@/components/page-actions-bar';
import { notFound } from 'next/navigation';

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

  const { data: { user } } = await supabase.auth.getUser();
  const organization = await getOrganizationById(orgId, supabase);
  
  // Get page with sections
  const pageWithSections = await getPageWithSections(pageId, supabase);
  
  if (!pageWithSections) {
    notFound();
  }

  // Check if page belongs to this org
  if (pageWithSections.org_id !== orgId) {
    notFound();
  }

  const hasDirtySections = pageWithSections.sections.some(s => s.status === 'dirty');

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">{pageWithSections.name}</h1>
            <p className="text-muted-foreground mt-2">
              Template: {pageWithSections.template ? pageWithSections.template.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Default'}
            </p>
          </div>
          
          <div className="mb-4">
            <PageActionsBar 
              orgId={orgId}
              pageId={pageId}
              hasDirtySections={hasDirtySections}
              organization={organization}
            />
          </div>

          <PageSectionsTable 
            orgId={orgId}
            pageId={pageId}
            sections={pageWithSections.sections}
            organization={organization}
          />
        </div>
      </div>
    </div>
  );
}

