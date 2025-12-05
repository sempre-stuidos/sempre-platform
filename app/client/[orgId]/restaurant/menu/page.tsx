import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getOrganizationById } from '@/lib/businesses';
import { supabaseAdmin } from '@/lib/supabase';
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
  const organization = await getOrganizationById(orgId, supabaseAdmin);
  
  // Get client linked to this organization
  let clientId: number | null = null;
  if (organization) {
    const { data: clients } = await supabase
      .from('clients')
      .select('id')
      .eq('business_id', orgId)
      .limit(1)
      .single();
    
    if (clients) {
      clientId = clients.id;
    }
  }

  // The MenuManagement component fetches data via API on mount
  // Pass empty arrays - the component will fetch via API (menu IDs are now UUIDs)

  // Use a dummy clientId if none exists (for UI display purposes)
  const displayClientId = clientId || 0;

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <MenuManagement
            orgId={orgId}
            clientId={displayClientId}
            initialItems={[]}
            initialCategories={[]}
          />
        </div>
      </div>
    </div>
  );
}

