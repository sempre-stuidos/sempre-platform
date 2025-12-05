import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getOrganizationById, getUserRoleInOrg } from '@/lib/businesses';
import { getOrganizationByClientId } from '@/lib/businesses';
import { supabaseAdmin } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction, CardFooter } from '@/components/ui/card';
import { IconMenu2, IconFileText, IconTrendingUp, IconShoppingCart, IconPackage, IconUsers, IconCalendar } from '@tabler/icons-react';
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
  let eventsCount = 0;
  let sectionsCount = 0;
  let ordersCount = 0;
  let productsCount = 0;
  let activeProductsCount = 0;
  let customersCount = 0;

  if (isRestaurant) {
    // Restaurant stats - query by business_id (orgId)
    try {
      // Get menu items count: Get all menus for this business, then count items in those menus
      const { data: menus } = await supabaseServer
        .from('menus')
        .select('id')
        .eq('business_id', orgId)
        .eq('is_active', true);
      
      if (menus && menus.length > 0) {
        const menuIds = menus.map(m => m.id);
        const { count: menuItemsCountResult } = await supabaseServer
          .from('menu_items')
          .select('id', { count: 'exact', head: true })
          .in('menu_id', menuIds)
          .eq('is_archived', false);
        menuItemsCount = menuItemsCountResult || 0;
      } else {
        menuItemsCount = 0;
      }

      // Get events count: Count all events for this organization
      const { count: eventsCountResult } = await supabaseServer
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId);
      eventsCount = eventsCountResult || 0;

      // Get page sections count: Get all pages for this org, then count sections in page_sections_v2
      const { data: pages } = await supabaseServer
        .from('pages')
        .select('id')
        .eq('org_id', orgId);
      
      if (pages && pages.length > 0) {
        const pageIds = pages.map(p => p.id);
        const { count: sectionsCountResult } = await supabaseServer
          .from('page_sections_v2')
          .select('id', { count: 'exact', head: true })
          .in('page_id', pageIds);
        sectionsCount = sectionsCountResult || 0;
      } else {
        sectionsCount = 0;
      }
    } catch (error) {
      console.error('Error fetching restaurant stats:', error);
      // Keep default values of 0
    }
  } else if (isRetail) {
    // Retail stats - query directly by business_id (orgId), no clientId needed
    try {
      // Query products from retail_products_table - use same pattern as products page
      const { data: productsData, error: productsError, count: productsCountResult } = await supabaseServer
        .from('retail_products_table')
        .select('id, status', { count: 'exact' })
        .eq('business_id', orgId);
      
      if (productsError) {
        console.error('Error fetching products in dashboard:', productsError);
        productsCount = 0;
        activeProductsCount = 0;
      } else {
        // Get total count from count result or data length
        productsCount = productsCountResult ?? productsData?.length ?? 0;
        // Count active products from the data array
        activeProductsCount = productsData?.filter((p: { status: string }) => p.status === 'active').length ?? 0;
      }

      // Query orders and customers (these tables may not exist)
      const ordersResponse = await supabaseServer
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId);
      ordersCount = ordersResponse.count || 0;

      const customersResponse = await supabaseServer
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId);
      customersCount = customersResponse.count || 0;
    } catch (error) {
      console.error('Error fetching retail stats:', error);
      // Tables might not exist yet, use default values
      ordersCount = 0;
      productsCount = 0;
      activeProductsCount = 0;
      customersCount = 0;
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
                  <CardDescription>Events</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {eventsCount}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <IconCalendar className="size-4" />
                      Total events
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    Event management <IconTrendingUp className="size-4" />
                  </div>
                  <div className="text-muted-foreground">
                    Manage your restaurant events and promotions
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
                      {activeProductsCount} Active
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

