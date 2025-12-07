import { AppSidebar } from "@/components/app-sidebar"
import { PresentationDataTable } from "@/components/presentation-data-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { supabaseAdmin } from "@/lib/supabase"

// Helper function to get user name from user_roles.id
async function getUserNameFromRoleId(roleId: number | null): Promise<string | null> {
  if (!roleId) return null;
  
  try {
    const { data: userRole, error } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, invited_email')
      .eq('id', roleId)
      .single();
    
    if (error || !userRole || !userRole.user_id) {
      return userRole?.invited_email || null;
    }
    
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userRole.user_id);
    if (userData?.user) {
      const metadata = userData.user.user_metadata || {};
      return metadata.full_name || metadata.name || userData.user.email?.split('@')[0] || null;
    }
    
    return userRole.invited_email || null;
  } catch (error) {
    console.error('Error fetching user name:', error);
    return null;
  }
}

async function getAllPresentations() {
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

  const { data, error } = await supabase
    .from('presentations')
    .select(`
      *,
      clients!inner(name)
    `)
    .order('created_date', { ascending: false });

  if (error) {
    console.error('Error fetching presentations:', error);
    return [];
  }

  if (!data || !Array.isArray(data)) {
    return [];
  }

  // Type assertion to work around Supabase type inference issue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const presentationsData = data as any as Array<{
    owner_id: number | null
    id: number
    title: string
    client_id: number
    type: string
    created_date: string
    status: string
    link: string
    description?: string | null
    last_modified: string
    clients: { name: string }
    created_at?: string
    updated_at?: string
  }>

  // Fetch owner names for all presentations in parallel
  const ownerNames = await Promise.all(
    presentationsData.map((p) => getUserNameFromRoleId(p.owner_id))
  )

  return presentationsData.map((presentation, index) => ({
    id: presentation.id,
    title: presentation.title,
    clientId: presentation.client_id,
    clientName: presentation.clients.name,
    type: presentation.type as 'Proposal' | 'Onboarding' | 'Progress Update' | 'Report' | 'Case Study',
    createdDate: presentation.created_date,
    ownerId: presentation.owner_id,
    ownerName: ownerNames[index],
    status: presentation.status as 'Draft' | 'Sent' | 'Approved' | 'Archived',
    link: presentation.link,
    description: presentation.description ?? undefined,
    lastModified: presentation.last_modified,
    created_at: presentation.created_at,
    updated_at: presentation.updated_at
  }));
}

export default async function PresentationPage() {
  // Fetch presentation data from database using server-side authenticated client
  const data = await getAllPresentations()
  
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
              {/* Data Table */}
              <PresentationDataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
