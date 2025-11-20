import { AppSidebar } from "@/components/app-sidebar"
import { BusinessDetails } from "@/components/business-details"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getBusinessById, getUserRoleInOrg } from '@/lib/businesses';
import { getUserRole } from '@/lib/invitations';
import { redirect } from 'next/navigation';

interface BusinessPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function BusinessPage({ params }: BusinessPageProps) {
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
    console.log('Business page - No user, redirecting to login');
    redirect('/login');
  }

  console.log('Business page - User ID:', user.id);
  console.log('Business page - Org ID:', orgId);

  // Check if user is Admin (use supabaseAdmin for server-side)
  const { supabaseAdmin } = await import('@/lib/supabase');
  const userRole = await getUserRole(user.id, supabaseAdmin);
  const isAdmin = userRole === 'Admin';
  
  console.log('Business page - User role from user_roles:', userRole);
  console.log('Business page - Is Admin:', isAdmin);

  // Verify user has access to this business (or is Admin)
  const role = await getUserRoleInOrg(user.id, orgId, supabase);
  console.log('Business page - User role in org:', role);
  console.log('Business page - Is Admin:', isAdmin);
  
  // Allow access if user is a member OR is Admin (super admin)
  if (!role && !isAdmin) {
    console.log('Business page - No role found and not Admin, redirecting to /businesses');
    redirect('/businesses');
  }
  
  // Use 'admin' role for Admins if they're not already a member
  // Super admins can access any business even without membership
  const effectiveRole = role || (isAdmin ? 'admin' : null);

  // Get business details
  // Use supabaseAdmin for Admins to bypass RLS, regular supabase for members
  const business = await getBusinessById(orgId, isAdmin ? supabaseAdmin : supabase);
  console.log('Business page - Business:', business ? business.name : 'not found');
  
  if (!business) {
    console.log('Business page - Business not found, redirecting to /businesses');
    redirect('/businesses');
  }

  // Get business stats
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
    businessType: business.type,
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
        <SiteHeader clientName={business.name} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <BusinessDetails 
                orgId={orgId} 
                business={business} 
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

