import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ClientSidebar } from '@/components/client-sidebar';
import { ClientSiteHeader } from '@/components/client-site-header';
import { BreadcrumbProvider } from '@/components/breadcrumb-context';
import { EventCreationTourProvider } from '@/components/event-creation-tour-provider';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { getUserRoleInOrg, getOrganizationById } from '@/lib/businesses';
import { ensureProfileExists } from '@/lib/profiles';
import { getUserRole } from '@/lib/invitations';
import { supabaseAdmin } from '@/lib/supabase';

interface ClientLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    orgId: string;
  }>;
}

export default async function ClientLayout({ children, params }: ClientLayoutProps) {
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

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/client/login');
  }

  // Ensure profile exists
  await ensureProfileExists(user.id);

  // Check if user is Admin (super admin can access any business)
  const userRole = await getUserRole(user.id, supabaseAdmin);
  const isAdmin = userRole === 'Admin';

  // Verify organization membership
  // Use supabaseAdmin for Client users to bypass RLS (avoids infinite recursion in RLS policies)
  const clientToUse = userRole === 'Client' ? supabaseAdmin : supabase;
  const role = await getUserRoleInOrg(user.id, orgId, clientToUse);
  
  // Allow access if user is a member OR is Admin
  if (!role && !isAdmin) {
    console.log('Client layout - No role found and not Admin, redirecting to select-org');
    redirect('/client/select-org');
  }

  // Get organization details
  // Always use supabaseAdmin to bypass RLS and avoid infinite recursion
  // We've already verified access above, so it's safe to bypass RLS here
  const organization = await getOrganizationById(orgId, supabaseAdmin);
  if (!organization) {
    console.log('Client layout - Organization not found, redirecting to select-org');
    redirect('/client/select-org');
  }

  return (
    <BreadcrumbProvider>
      <EventCreationTourProvider />
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <ClientSidebar variant="inset" initialBusiness={organization} />
        <SidebarInset>
          <ClientSiteHeader />
          <div className="flex flex-1 flex-col">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </BreadcrumbProvider>
  );
}

