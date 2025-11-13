import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getOrganizationById } from '@/lib/organizations';
import { getPageSections } from '@/lib/page-sections';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { PageSectionsTable } from '@/components/page-sections-table';

interface SectionsPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function SectionsPage({ params }: SectionsPageProps) {
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

  const organization = await getOrganizationById(orgId, supabase);
  
  // Get client linked to this organization
  let clientId: number | null = null;
  if (organization) {
    const { data: clients } = await supabase
      .from('clients')
      .select('id')
      .eq('organization_id', orgId)
      .limit(1)
      .single();
    
    if (clients) {
      clientId = clients.id;
    }
  }

  const pageSections = clientId ? await getPageSections(clientId) : [];

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Page Sections</h1>
            <p className="text-muted-foreground mt-2">
              Manage your restaurant page sections
            </p>
          </div>
          {clientId && (
            <Link href={`/client/${orgId}/restaurant/sections/new`}>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </Link>
          )}
        </div>

        <div className="px-4 lg:px-6">
          {clientId ? (
            <PageSectionsTable orgId={orgId} clientId={clientId} initialSections={pageSections} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Client Linked</CardTitle>
                <CardDescription>
                  This organization is not linked to a client yet. Please contact an administrator.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

