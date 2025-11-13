import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getOrganizationById, getUserRoleInOrg } from '@/lib/organizations';
import { getOrganizationByClientId } from '@/lib/organizations';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconMenu2, IconPhoto, IconFileText } from '@tabler/icons-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface DashboardPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function ClientDashboardPage({ params }: DashboardPageProps) {
  const { orgId } = await params;
  const cookieStore = await cookies();
  
  const supabaseServer = createServerClient(
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

  const { data: { user } } = await supabaseServer.auth.getUser();
  const organization = await getOrganizationById(orgId, supabaseServer);
  
  // Get client linked to this organization
  let clientId: number | null = null;
  if (organization) {
    const { data: clients } = await supabaseServer
      .from('clients')
      .select('id')
      .eq('organization_id', orgId)
      .limit(1)
      .single();
    
    if (clients) {
      clientId = clients.id;
    }
  }

  // Get stats for restaurant section
  let menuItemsCount = 0;
  let galleryImagesCount = 0;
  let sectionsCount = 0;

  if (clientId) {
    const [menuResult, galleryResult, sectionsResult] = await Promise.all([
      supabaseServer.from('menu_items').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      supabaseServer.from('gallery_images').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      supabaseServer.from('page_sections').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
    ]);

    menuItemsCount = menuResult.count || 0;
    galleryImagesCount = galleryResult.count || 0;
    sectionsCount = sectionsResult.count || 0;
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {organization?.name || 'Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome to your organization dashboard
          </p>
        </div>

        <div className="px-4 lg:px-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
                <IconMenu2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{menuItemsCount}</div>
                <CardDescription>Total menu items</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gallery Images</CardTitle>
                <IconPhoto className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{galleryImagesCount}</div>
                <CardDescription>Total gallery images</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Page Sections</CardTitle>
                <IconFileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sectionsCount}</div>
                <CardDescription>Total page sections</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="px-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your restaurant content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Link href={`/client/${orgId}/restaurant/menu`}>
                  <Button variant="outline" className="w-full h-auto flex-col items-start p-4">
                    <IconMenu2 className="mb-2 h-6 w-6" />
                    <span className="font-semibold">Manage Menu</span>
                    <span className="text-xs text-muted-foreground">Add or edit menu items</span>
                  </Button>
                </Link>
                <Link href={`/client/${orgId}/restaurant/gallery`}>
                  <Button variant="outline" className="w-full h-auto flex-col items-start p-4">
                    <IconPhoto className="mb-2 h-6 w-6" />
                    <span className="font-semibold">Manage Gallery</span>
                    <span className="text-xs text-muted-foreground">Upload gallery images</span>
                  </Button>
                </Link>
                <Link href={`/client/${orgId}/restaurant/sections`}>
                  <Button variant="outline" className="w-full h-auto flex-col items-start p-4">
                    <IconFileText className="mb-2 h-6 w-6" />
                    <span className="font-semibold">Manage Sections</span>
                    <span className="text-xs text-muted-foreground">Edit page sections</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

