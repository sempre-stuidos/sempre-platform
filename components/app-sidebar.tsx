"use client"

import * as React from "react"
import Image from "next/image"
import {
  IconDashboard,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconInnerShadowTop,
  IconListDetails,
  IconMoon,
  IconPresentation,
  IconRobot,
  IconSearch,
  IconSun,
  IconUsers,
  IconBuilding,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavSub } from "@/components/nav-sub"
import { NavSubTools } from "@/components/nav-sub-tools"
import { NavUser } from "@/components/nav-user"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabase"
import { User, type AuthChangeEvent, type Session } from "@supabase/supabase-js"
import { getUserRole } from "@/lib/invitations"
import { getUserOrganizations } from "@/lib/organizations"
import { usePathname } from "next/navigation"

const defaultUser = {
  name: "User",
  email: "user@example.com",
  avatar: "",
}

const staticData = {
  navMain: [
    {
      title: "Organizations",
      url: "/organizations",
      icon: IconBuilding,
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Clients",
      url: "/clients",
      icon: IconUsers,
    },
    {
      title: "Teams",
      url: "/team",
      icon: IconUsers,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: IconFolder,
    },
    {
      title: "Tasks & Todos",
      url: "/tasks",
      icon: IconListDetails,
    },
  ],
  navSub: [
    {
      title: "Files & Assets",
      url: "/files-assets",
      icon: IconFileWord,
    },
    {
      title: "Notes & Knowledge",
      url: "/notes-knowledge",
      icon: IconFileDescription,
    },
    {
      title: "Agency Toolkit",
      url: "/agency-toolkit",
      icon: IconInnerShadowTop,
    },
  ],
  navSubTools: [
    {
      title: "AI Project Manager",
      url: "/agent",
      icon: IconRobot,
    },
    {
      title: "Slides Library",
      url: "/presentation",
      icon: IconPresentation,
    },
  ],
  navSecondary: [
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState(defaultUser)
  const [currentUser, setCurrentUser] = React.useState<User | null>(null)
  const [orgName, setOrgName] = React.useState<string | null>(null)
  const pathname = usePathname()
  const initialPathnameRef = React.useRef(pathname)
  
  React.useEffect(() => {
    // Get initial user
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
            email: authUser.email || 'user@example.com',
            avatar: authUser.user_metadata?.avatar_url || '',
          })

          // Check if user is a Client and get organization name
          const userRole = await getUserRole(authUser.id)
          if (userRole === 'Client') {
            // Try to extract orgId from URL path if on client route
            const clientRouteMatch = initialPathnameRef.current?.match(/^\/client\/([^/]+)/)
            const orgIdFromPath = clientRouteMatch?.[1]

            const organizations = await getUserOrganizations(authUser.id)
            if (organizations && organizations.length > 0) {
              // Use orgId from path if available, otherwise use first organization
              const selectedOrg = orgIdFromPath 
                ? organizations.find(org => org.id === orgIdFromPath) || organizations[0]
                : organizations[0]
              setOrgName(selectedOrg.name)
            }
          } else {
            setOrgName(null)
          }
        } else {
          setOrgName(null)
        }
      } catch (error) {
        console.log('No authenticated user or Supabase not configured', error)
        setOrgName(null)
      }
    }

    getInitialUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setCurrentUser(session.user)
          const fullName = session.user.user_metadata?.first_name && session.user.user_metadata?.last_name 
            ? `${session.user.user_metadata.first_name} ${session.user.user_metadata.last_name}`
            : session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
          
          setUser({
            name: fullName,
            email: session.user.email || 'user@example.com',
            avatar: session.user.user_metadata?.avatar_url || '',
          })

          // Check if user is a Client and get organization name
          const userRole = await getUserRole(session.user.id)
          if (userRole === 'Client') {
            // Try to extract orgId from URL path if on client route
            const currentPath =
              typeof window !== 'undefined' ? window.location.pathname : initialPathnameRef.current
            const clientRouteMatch = currentPath?.match(/^\/client\/([^/]+)/)
            const orgIdFromPath = clientRouteMatch?.[1]

            const organizations = await getUserOrganizations(session.user.id)
            if (organizations && organizations.length > 0) {
              // Use orgId from path if available, otherwise use first organization
              const selectedOrg = orgIdFromPath 
                ? organizations.find(org => org.id === orgIdFromPath) || organizations[0]
                : organizations[0]
              setOrgName(selectedOrg.name)
            }
          } else {
            setOrgName(null)
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null)
          setUser(defaultUser)
          setOrgName(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Update org name when pathname changes (for client routes)
  React.useEffect(() => {
    const updateOrgNameFromPath = async () => {
      if (!currentUser) return

      try {
        const userRole = await getUserRole(currentUser.id)
        if (userRole === 'Client') {
          // Try to extract orgId from URL path if on client route
          const clientRouteMatch = pathname?.match(/^\/client\/([^/]+)/)
          const orgIdFromPath = clientRouteMatch?.[1]

          if (orgIdFromPath) {
            const organizations = await getUserOrganizations(currentUser.id)
            if (organizations && organizations.length > 0) {
              const selectedOrg = organizations.find(org => org.id === orgIdFromPath) || organizations[0]
              setOrgName(selectedOrg.name)
            }
          }
        }
      } catch (error) {
        console.error('Error updating org name from path:', error)
      }
    }

    updateOrgNameFromPath()
  }, [pathname, currentUser])

  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark')

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    
    // Save theme preference to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
    
    // Apply theme to document
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      if (newTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }

  // Initialize theme on mount
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      // Check if theme is already set in localStorage or document
      const savedTheme = localStorage.getItem('theme')
      const isDark = savedTheme ? savedTheme === 'dark' : true // Default to dark
      
      if (isDark) {
        root.classList.add('dark')
        setTheme('dark')
      } else {
        root.classList.remove('dark')
        setTheme('light')
      }
    }
  }, [])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full px-2 py-1.5">
              <div className="flex items-center gap-2">
                <Image 
                  src="/se-logo.png" 
                  alt="Sempre Studios Logo" 
                  width={20} 
                  height={20} 
                  className="!size-5"
                />
                <span className="text-base font-semibold">{orgName || 'Sempre Studios'}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8"
              >
                {theme === 'light' ? (
                  <IconMoon className="h-4 w-4" />
                ) : (
                  <IconSun className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={staticData.navMain} />
        <NavSub items={staticData.navSub} />
        <NavSubTools items={staticData.navSubTools} />
        <NavSecondary items={staticData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
