import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getOrganizationById, getUserRoleInOrg } from '@/lib/organizations';
import { getReportsByOrgId } from '@/lib/reports';
import { ReportsDataTable } from '@/components/reports-data-table';
import { Button } from '@/components/ui/button';
import { IconSettings } from '@tabler/icons-react';
import { ReportsSettingsDialog } from '@/components/reports-settings-dialog';

interface ReportsPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { orgId } = await params;
  const cookieStore = await cookies();

  const supabaseServer = createServerClient(
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

  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    redirect('/client/login');
  }

  const role = await getUserRoleInOrg(user.id, orgId, supabaseServer);
  if (!role) {
    redirect('/client/select-org');
  }

  const organization = await getOrganizationById(orgId, supabaseServer);
  if (!organization) {
    redirect('/client/select-org');
  }

  // Fetch reports for this organization
  const reports = await getReportsByOrgId(orgId, supabaseServer);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Header */}
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div>
            <h1 className="text-2xl font-semibold">Reports</h1>
            <p className="text-muted-foreground text-sm mt-1">
              View and manage your generated reports
            </p>
          </div>
          <ReportsSettingsDialog orgId={orgId}>
            <Button>
              <IconSettings className="mr-2 h-4 w-4" />
              Reports Settings
            </Button>
          </ReportsSettingsDialog>
        </div>

        {/* Reports Table */}
        <div className="px-4 lg:px-6">
          <ReportsDataTable data={reports} orgId={orgId} />
        </div>
      </div>
    </div>
  );
}

