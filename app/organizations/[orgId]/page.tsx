import { AppSidebar } from "@/components/app-sidebar"
import { OrganizationDetails } from "@/components/organization-details"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getOrganizationById, getUserRoleInOrg } from '@/lib/organizations';
import { redirect } from 'next/navigation';

interface OrganizationPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
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

  if (!user) {
    console.log('Organization page - No user, redirecting to login');
    redirect('/login');
  }

  console.log('Organization page - User ID:', user.id);
  console.log('Organization page - Org ID:', orgId);

  // Verify user has access to this organization
  const role = await getUserRoleInOrg(user.id, orgId, supabase);
  console.log('Organization page - User role:', role);
  
  if (!role) {
    console.log('Organization page - No role found, redirecting to /organizations');
    redirect('/organizations');
  }

  // Get organization details
  const organization = await getOrganizationById(orgId, supabase);
  console.log('Organization page - Organization:', organization ? organization.name : 'not found');
  
  if (!organization) {
    console.log('Organization page - Organization not found, redirecting to /organizations');
    redirect('/organizations');
  }

  // Get organization stats
  const membersResult = await supabase
    .from('memberships')
    .select('id, created_at', { count: 'exact' })
    .eq('org_id', orgId);

  const totalMembers = membersResult.count || 0;

  // Calculate members added this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const membersThisMonth = membersResult.data?.filter(
    m => new Date(m.created_at) >= startOfMonth
  ).length || 0;

  // Active members (simplified - all members are considered active)
  const activeMembers = totalMembers;

  // Dummy site pages stats for now
  const totalSitePages = 6;
  const publishedPages = 4;

  const stats = {
    totalMembers,
    membersThisMonth,
    totalSitePages,
    publishedPages,
    activeMembers,
    organizationType: organization.type,
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader clientName={organization.name} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <OrganizationDetails 
                orgId={orgId} 
                organization={organization} 
                userRole={role}
                stats={stats}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

