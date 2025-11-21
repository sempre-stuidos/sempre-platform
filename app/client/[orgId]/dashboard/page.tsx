import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getOrganizationById, getUserRoleInOrg } from '@/lib/businesses';
import { getOrganizationByClientId } from '@/lib/businesses';
import { supabaseAdmin } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction, CardFooter } from '@/components/ui/card';
import { IconMenu2, IconPhoto, IconFileText, IconTrendingUp, IconShoppingCart, IconPackage, IconUsers } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { ChartSiteAnalytics, SiteAnalyticsData } from '@/components/chart-site-analytics';

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
  const organization = await getOrganizationById(orgId, supabaseAdmin);
  
  // Get business type, default to 'restaurant' if not available
  const businessType = organization?.type || 'restaurant';
  const isRetail = businessType === 'retail';
  const isRestaurant = businessType === 'restaurant' || !isRetail;
  
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

  // Get stats based on business type
  let menuItemsCount = 0;
  let galleryImagesCount = 0;
  let sectionsCount = 0;
  let ordersCount = 0;
  let productsCount = 0;
  let customersCount = 0;

  if (clientId) {
    if (isRestaurant) {
      // Restaurant stats
      const [menuResult, galleryResult, sectionsResult] = await Promise.all([
        supabaseServer.from('menu_items').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
        supabaseServer.from('gallery_images').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
        supabaseServer.from('page_sections').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      ]);

      menuItemsCount = menuResult.count || 0;
      galleryImagesCount = galleryResult.count || 0;
      sectionsCount = sectionsResult.count || 0;
    } else if (isRetail) {
      // Retail stats - placeholder queries (these tables may not exist yet)
      // For now, we'll use dummy data or check if tables exist
      try {
        const [ordersResult, productsResult, customersResult] = await Promise.all([
          supabaseServer.from('orders').select('id', { count: 'exact', head: true }).eq('org_id', orgId).catch(() => ({ count: 0 })),
          supabaseServer.from('products').select('id', { count: 'exact', head: true }).eq('org_id', orgId).catch(() => ({ count: 0 })),
          supabaseServer.from('customers').select('id', { count: 'exact', head: true }).eq('org_id', orgId).catch(() => ({ count: 0 })),
        ]);

        ordersCount = ordersResult?.count || 0;
        productsCount = productsResult?.count || 0;
        customersCount = customersResult?.count || 0;
      } catch (error) {
        // Tables might not exist yet, use default values
        ordersCount = 0;
        productsCount = 0;
        customersCount = 0;
      }
    }
  }

  // Generate dummy analytics data for site visits and bookings
  const generateAnalyticsData = (): SiteAnalyticsData[] => {
    const data: SiteAnalyticsData[] = [];
    const today = new Date();
    
    // Generate data for the last 90 days
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic-looking dummy data with some variation
      const baseVisits = 150;
      const baseBookings = 25;
      const dayOfWeek = date.getDay();
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1;
      const randomVariation = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
      
      const visits = Math.round(baseVisits * weekendMultiplier * randomVariation);
      const bookings = Math.round(baseBookings * weekendMultiplier * randomVariation * (0.15 + Math.random() * 0.1));
      
      data.push({
        date: date.toISOString(),
        visits,
        bookings,
      });
    }
    
    return data;
  };

  const analyticsData = generateAnalyticsData();

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
          {isRestaurant ? (
            <>
              <Card className="@container/card">
                <CardHeader>
                  <CardDescription>Menu Items</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {menuItemsCount}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <IconMenu2 className="size-4" />
                      Active items
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    Restaurant menu management <IconTrendingUp className="size-4" />
                  </div>
                  <div className="text-muted-foreground">
                    Manage your menu items and pricing
                  </div>
                </CardFooter>
              </Card>

              <Card className="@container/card">
                <CardHeader>
                  <CardDescription>Gallery Images</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {galleryImagesCount}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <IconPhoto className="size-4" />
                      Images
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    Visual content gallery <IconTrendingUp className="size-4" />
                  </div>
                  <div className="text-muted-foreground">
                    Showcase your restaurant photos
                  </div>
                </CardFooter>
              </Card>

              <Card className="@container/card">
                <CardHeader>
                  <CardDescription>Page Sections</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {sectionsCount}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <IconFileText className="size-4" />
                      Sections
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    Content sections <IconTrendingUp className="size-4" />
                  </div>
                  <div className="text-muted-foreground">
                    Customize your page content
                  </div>
                </CardFooter>
              </Card>
            </>
          ) : isRetail ? (
            <>
              <Card className="@container/card">
                <CardHeader>
                  <CardDescription>Orders</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {ordersCount}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <IconShoppingCart className="size-4" />
                      Total orders
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    Order management <IconTrendingUp className="size-4" />
                  </div>
                  <div className="text-muted-foreground">
                    View and manage customer orders
                  </div>
                </CardFooter>
              </Card>

              <Card className="@container/card">
                <CardHeader>
                  <CardDescription>Products</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {productsCount}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <IconPackage className="size-4" />
                      Active products
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    Product catalog <IconTrendingUp className="size-4" />
                  </div>
                  <div className="text-muted-foreground">
                    Manage your product inventory
                  </div>
                </CardFooter>
              </Card>

              <Card className="@container/card">
                <CardHeader>
                  <CardDescription>Customers</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {customersCount}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <IconUsers className="size-4" />
                      Total customers
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    Customer base <IconTrendingUp className="size-4" />
                  </div>
                  <div className="text-muted-foreground">
                    Track and manage your customers
                  </div>
                </CardFooter>
              </Card>
            </>
          ) : null}
        </div>

        <div className="px-4 lg:px-6">
          <ChartSiteAnalytics data={analyticsData} />
        </div>
      </div>
    </div>
  );
}

