import { AppSidebar } from "@/components/app-sidebar"
import { OrganizationsDataTable } from "@/components/organizations-data-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAllOrganizations, getUserOrganizations } from '@/lib/organizations';
import { getUserRole } from '@/lib/invitations';

export default async function OrganizationsPage() {
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
    // Redirect to login if not authenticated
    return null;
  }
  
  // Check if user has Admin role (use supabaseAdmin for server-side)
  const { supabaseAdmin } = await import('@/lib/supabase');
  const userRole = await getUserRole(user.id, supabaseAdmin);
  const isAdmin = userRole === 'Admin';
  
  // Get all organizations in the system
  const allOrganizations = await getAllOrganizations();
  
  // Get user's organizations to determine their role in each
  const userOrganizations = await getUserOrganizations(user.id, supabase);
  
  // Combine: add user role to organizations they belong to
  const organizations = allOrganizations.map(org => {
    const userOrg = userOrganizations.find(uo => uo.id === org.id);
    return {
      ...org,
      role: userOrg?.role,
      membership: userOrg?.membership,
    };
  });
  
  console.log('Organizations page - User ID:', user.id);
  console.log('Organizations page - User role:', userRole);
  console.log('Organizations page - Is Admin:', isAdmin);
  console.log('Organizations page - Total organizations:', organizations.length);
  console.log('Organizations page - User belongs to:', userOrganizations.length);

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
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <OrganizationsDataTable data={organizations} isAdmin={isAdmin} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

