import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ReservationsAnalyticsDashboard } from '@/components/reservations-analytics';
import { getOrganizationById, getUserRoleInOrg } from '@/lib/businesses';
import { supabaseAdmin } from '@/lib/supabase';

interface AnalyticsPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
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

  const role = await getUserRoleInOrg(user.id, orgId, supabaseAdmin);
  if (!role) {
    redirect('/client/select-org');
  }

  const organization = await getOrganizationById(orgId, supabaseAdmin);
  if (!organization) {
    redirect('/client/select-org');
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <ReservationsAnalyticsDashboard organizationName={organization.name} />
      </div>
    </div>
  );
}


