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
import { getUserRole } from '@/lib/invitations';
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

  // Check if user is Admin (use supabaseAdmin for server-side)
  const { supabaseAdmin } = await import('@/lib/supabase');
  const userRole = await getUserRole(user.id, supabaseAdmin);
  const isAdmin = userRole === 'Admin';
  
  console.log('Organization page - User role from user_roles:', userRole);
  console.log('Organization page - Is Admin:', isAdmin);

  // Verify user has access to this organization (or is Admin)
  const role = await getUserRoleInOrg(user.id, orgId, supabase);
  console.log('Organization page - User role in org:', role);
  console.log('Organization page - Is Admin:', isAdmin);
  
  // Allow access if user is a member OR is Admin
  if (!role && !isAdmin) {
    console.log('Organization page - No role found and not Admin, redirecting to /organizations');
    redirect('/organizations');
  }
  
  // Use 'admin' role for Admins if they're not already a member
  const effectiveRole = role || (isAdmin ? 'admin' : null);

  // Get organization details
  // Use supabaseAdmin for Admins to bypass RLS, regular supabase for members
  const organization = await getOrganizationById(orgId, isAdmin ? supabaseAdmin : supabase);
  console.log('Organization page - Organization:', organization ? organization.name : 'not found');
  
  if (!organization) {
    console.log('Organization page - Organization not found, redirecting to /organizations');
    redirect('/organizations');
  }

  // Get organization stats
  // Use supabaseAdmin for Admins to bypass RLS when fetching members
  const membersResult = await (isAdmin ? supabaseAdmin : supabase)
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
                userRole={effectiveRole || 'staff'}
                isAdmin={isAdmin}
                stats={stats}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

