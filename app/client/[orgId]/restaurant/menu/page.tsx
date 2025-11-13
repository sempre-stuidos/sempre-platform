import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getOrganizationById, getUserRoleInOrg } from '@/lib/organizations';
import { getMenuItems } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { MenuItemsTable } from '@/components/menu-items-table';

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

  const menuItems = clientId ? await getMenuItems(clientId) : [];

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Menu Items</h1>
            <p className="text-muted-foreground mt-2">
              Manage your restaurant menu items
            </p>
          </div>
          {clientId && (
            <Link href={`/client/${orgId}/restaurant/menu/new`}>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Menu Item
              </Button>
            </Link>
          )}
        </div>

        <div className="px-4 lg:px-6">
          {clientId ? (
            <MenuItemsTable orgId={orgId} clientId={clientId} initialItems={menuItems} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Client Linked</CardTitle>
                <CardDescription>
                  This organization is not linked to a client yet. Please contact an administrator.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

