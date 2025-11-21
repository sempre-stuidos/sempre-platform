"use client"

import * as React from "react"
import {
  IconDashboard,
  IconPhoto,
  IconMenu2,
  IconFileText,
  IconBuilding,
  IconChartBar,
  IconCalendar,
  IconBook,
  IconTools,
  IconReport,
  IconShoppingCart,
  IconPackage,
} from "@tabler/icons-react"
import { useParams, usePathname } from "next/navigation"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabase"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { useBusinessContext } from "@/hooks/use-business-context"
import type { Business } from "@/lib/businesses"

const defaultUser = {
  name: "User",
  email: "user@example.com",
  avatar: "",
}

interface ClientSidebarProps extends React.ComponentProps<typeof Sidebar> {
  initialBusiness?: Business | null
}

const getClientNavItems = (orgId: string, businessType?: string) => {
  // Determine which business-specific items to show
  // Default to restaurant if type doesn't match
  const isRetail = businessType === 'retail'
  const isRestaurant = businessType === 'restaurant' || !isRetail

  return {
    main: [
      {
        title: "Dashboard",
        url: `/client/${orgId}/dashboard`,
        icon: IconDashboard,
      },
    ],
    restaurant: isRestaurant ? [
      {
        title: "Analytics",
        url: `/client/${orgId}/analytics`,
        icon: IconChartBar,
      },
      {
        title: "Reservations",
        url: `/client/${orgId}/reservations`,
        icon: IconCalendar,
      },
      {
        title: "Reports",
        url: `/client/${orgId}/reports`,
        icon: IconReport,
      },
      {
        title: "Menu",
        url: `/client/${orgId}/restaurant/menu`,
        icon: IconMenu2,
      },
      {
        title: "Events",
        url: `/client/${orgId}/events`,
        icon: IconCalendar,
      },
    ] : [],
    retail: isRetail ? [
      {
        title: "Orders",
        url: `/client/${orgId}/retail/orders`,
        icon: IconShoppingCart,
      },
      {
        title: "Products",
        url: `/client/${orgId}/retail/products`,
        icon: IconPackage,
      },
    ] : [],
    help: [
      {
        title: "How To",
        url: `/client/${orgId}/how-to`,
        icon: IconBook,
      },
      {
        title: "Maintenance",
        url: `/client/${orgId}/maintenance`,
        icon: IconTools,
      },
    ],
    site: [
      {
        title: "Pages",
        url: `/client/${orgId}/restaurant/pages`,
        icon: IconFileText,
      },
      {
        title: "Gallery",
        url: `/client/${orgId}/restaurant/gallery`,
        icon: IconPhoto,
      },
    ],
  }
}

export function ClientSidebar({ initialBusiness, ...props }: ClientSidebarProps) {
  const params = useParams()
  const pathname = usePathname()
  const orgId = params.orgId as string
  const { business: contextBusiness, isLoading: orgLoading } = useBusinessContext()
  // Use initialBusiness if provided (from server), otherwise use context business (from client fetch)
  const business = initialBusiness || contextBusiness
  const [user, setUser] = React.useState(defaultUser)

  React.useEffect(() => {
    const getInitialUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (authUser) {
          const fullName = authUser.user_metadata?.first_name && authUser.user_metadata?.last_name
            ? `${authUser.user_metadata.first_name} ${authUser.user_metadata.last_name}`
            : authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User'

          setUser({
            name: fullName,
            email: authUser.email || '',
            avatar: authUser.user_metadata?.avatar_url || '',
          })
        }
      } catch (error) {
        console.error('Error getting user:', error)
      }
    }

    getInitialUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      void event;
      if (session?.user) {
        const fullName = session.user.user_metadata?.first_name && session.user.user_metadata?.last_name
          ? `${session.user.user_metadata.first_name} ${session.user.user_metadata.last_name}`
          : session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'

        setUser({
          name: fullName,
          email: session.user.email || '',
          avatar: session.user.user_metadata?.avatar_url || '',
        })
      } else {
        setUser(defaultUser)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Get business type, default to 'restaurant' if not available
  const businessType = business?.type || 'restaurant'
  const navItems = orgId ? getClientNavItems(orgId, businessType) : { main: [], restaurant: [], retail: [], help: [], site: [] }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href={orgId ? `/client/${orgId}/dashboard` : '#'}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <IconBuilding className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {orgLoading ? 'Loading...' : business?.name || 'Business'}
                  </span>
                  <span className="truncate text-xs">Client Portal</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.main.map((item) => {
                const isActive = pathname === item.url || pathname?.startsWith(item.url + '/')
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      tooltip={item.title}
                      className="hover:bg-primary hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                      data-active={isActive}
                    >
                      <a href={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {navItems.restaurant.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Restaurant</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.restaurant.map((item) => {
                  const isActive = pathname === item.url || pathname?.startsWith(item.url + '/')
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        tooltip={item.title}
                        className="hover:bg-primary hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                        data-active={isActive}
                      >
                        <a href={item.url}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {navItems.retail.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Retail</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.retail.map((item) => {
                  const isActive = pathname === item.url || pathname?.startsWith(item.url + '/')
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        tooltip={item.title}
                        className="hover:bg-primary hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                        data-active={isActive}
                      >
                        <a href={item.url}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>Site</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.site.map((item) => {
                const isActive = pathname === item.url || pathname?.startsWith(item.url + '/')
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      tooltip={item.title}
                      className="hover:bg-primary hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                      data-active={isActive}
                    >
                      <a href={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Help & Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.help.map((item) => {
                const isActive = pathname === item.url || pathname?.startsWith(item.url + '/')
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      tooltip={item.title}
                      className="hover:bg-primary hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                      data-active={isActive}
                    >
                      <a href={item.url}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <NavUser user={user} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

