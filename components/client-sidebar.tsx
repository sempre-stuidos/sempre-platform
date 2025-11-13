"use client"

import * as React from "react"
import {
  IconDashboard,
  IconPhoto,
  IconMenu2,
  IconFileText,
  IconBuilding,
  IconLogout,
} from "@tabler/icons-react"
import { useParams, useRouter } from "next/navigation"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
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

const getClientNavItems = (orgId: string) => [
  {
    title: "Dashboard",
    url: `/client/${orgId}/dashboard`,
    icon: IconDashboard,
  },
  {
    title: "Restaurant",
    url: `/client/${orgId}/restaurant`,
    icon: IconMenu2,
    children: [
      {
        title: "Menu",
        url: `/client/${orgId}/restaurant/menu`,
      },
      {
        title: "Gallery",
        url: `/client/${orgId}/restaurant/gallery`,
      },
      {
        title: "Page Sections",
        url: `/client/${orgId}/restaurant/sections`,
      },
    ],
  },
]

export function ClientSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams()
  const router = useRouter()
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/client/login')
  }

  const navItems = orgId ? getClientNavItems(orgId) : []

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
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                  {item.children && (
                    <SidebarMenu>
                      {item.children.map((child) => (
                        <SidebarMenuItem key={child.title}>
                          <SidebarMenuButton asChild tooltip={child.title}>
                            <a href={child.url}>
                              <span>{child.title}</span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <NavUser user={user} />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleSignOut}
              >
                <IconLogout className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

