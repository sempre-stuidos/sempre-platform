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
import { User } from "@supabase/supabase-js"
import { useOrganizationContext } from "@/hooks/use-organization-context"

const defaultUser = {
  name: "User",
  email: "user@example.com",
  avatar: "",
}

const getClientNavItems = (orgId: string) => ({
  main: [
    {
      title: "Dashboard",
      url: `/client/${orgId}/dashboard`,
      icon: IconDashboard,
    },
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
  ],
  restaurant: [
    {
      title: "Menu",
      url: `/client/${orgId}/restaurant/menu`,
      icon: IconMenu2,
    },
    {
      title: "Gallery",
      url: `/client/${orgId}/restaurant/gallery`,
      icon: IconPhoto,
    },
    {
      title: "Page Sections",
      url: `/client/${orgId}/restaurant/sections`,
      icon: IconFileText,
    },
  ],
})

export function ClientSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams()
  const pathname = usePathname()
  const orgId = params.orgId as string
  const { organization, isLoading: orgLoading } = useOrganizationContext()
  const [user, setUser] = React.useState(defaultUser)
  const [currentUser, setCurrentUser] = React.useState<User | null>(null)

  React.useEffect(() => {
    const getInitialUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        setCurrentUser(authUser)

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUser(session.user)
        const fullName = session.user.user_metadata?.first_name && session.user.user_metadata?.last_name
          ? `${session.user.user_metadata.first_name} ${session.user.user_metadata.last_name}`
          : session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'

        setUser({
          name: fullName,
          email: session.user.email || '',
          avatar: session.user.user_metadata?.avatar_url || '',
        })
      } else {
        setCurrentUser(null)
        setUser(defaultUser)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const navItems = orgId ? getClientNavItems(orgId) : { main: [], restaurant: [] }

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
                    {orgLoading ? 'Loading...' : organization?.name || 'Organization'}
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

