import { AppSidebar } from "@/components/app-sidebar"
import { BusinessesDataTable } from "@/components/businesses-data-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAllBusinesses, getUserBusinesses } from '@/lib/businesses';
import { getUserRole } from '@/lib/invitations';

export default async function BusinessesPage() {
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
  
  // Get all businesses in the system
  const allBusinesses = await getAllBusinesses();
  
  // Get user's businesses to determine their role in each
  const userBusinesses = await getUserBusinesses(user.id, supabase);
  
  // Combine: add user role to businesses they belong to
  const businesses = allBusinesses.map(business => {
    const userBusiness = userBusinesses.find(ub => ub.id === business.id);
    return {
      ...business,
      role: userBusiness?.role,
      membership: userBusiness?.membership,
    };
  });
  
  console.log('Businesses page - User ID:', user.id);
  console.log('Businesses page - User role:', userRole);
  console.log('Businesses page - Is Admin:', isAdmin);
  console.log('Businesses page - Total businesses:', businesses.length);
  console.log('Businesses page - User belongs to:', userBusinesses.length);

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
              <BusinessesDataTable data={businesses} isAdmin={isAdmin} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

