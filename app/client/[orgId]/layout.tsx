import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ClientSidebar } from '@/components/client-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { getUserRoleInOrg, getOrganizationById } from '@/lib/organizations';
import { ensureProfileExists } from '@/lib/profiles';

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

  // Verify organization membership
  const role = await getUserRoleInOrg(user.id, orgId, supabase);
  if (!role) {
    redirect('/client/select-org');
  }

  // Get organization details
  const organization = await getOrganizationById(orgId, supabase);
  if (!organization) {
    redirect('/client/select-org');
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <ClientSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

