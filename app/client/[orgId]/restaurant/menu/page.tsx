import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getOrganizationById, getUserRoleInOrg } from '@/lib/organizations';
import { getMenuItems } from '@/lib/menu';
import { getMenuCategories } from '@/lib/menu-categories';
import { MenuManagement } from '@/components/menu-management';

interface MenuPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function MenuPage({ params }: MenuPageProps) {
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
  const organization = await getOrganizationById(orgId, supabase);
  
  // Get client linked to this organization
  let clientId: number | null = null;
  if (organization) {
    const { data: clients } = await supabase
      .from('clients')
      .select('id')
      .eq('organization_id', orgId)
      .limit(1)
      .single();
    
    if (clients) {
      clientId = clients.id;
    }
  }

  const [menuItems, categories] = clientId
    ? await Promise.all([
        getMenuItems(clientId),
        getMenuCategories(clientId),
      ])
    : [[], []];

  // Use a dummy clientId if none exists (for UI display purposes)
  const displayClientId = clientId || 0;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <MenuManagement
            orgId={orgId}
            clientId={displayClientId}
            initialItems={menuItems}
            initialCategories={categories}
          />
        </div>
      </div>
    </div>
  );
}

