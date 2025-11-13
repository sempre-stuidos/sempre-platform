import { AppSidebar } from "@/components/app-sidebar"
import { OrganizationsDataTable } from "@/components/organizations-data-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserOrganizations } from '@/lib/organizations';

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
  
  // Get user's organizations (pass the server client with session)
  const organizations = await getUserOrganizations(user.id, supabase);
  
  console.log('Organizations page - User ID:', user.id);
  console.log('Organizations page - Found organizations:', organizations.length);

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
              <OrganizationsDataTable data={organizations} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

