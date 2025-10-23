"use client"

import * as React from "react"
import {
  IconDashboard,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconInnerShadowTop,
  IconListDetails,
  IconMoon,
  IconPresentation,
  IconSearch,
  IconSun,
  IconUsers,
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
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"

const defaultUser = {
  name: "User",
  email: "user@example.com",
  avatar: "",
}

const staticData = {
  navMain: [
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
      title: "Agency Toolkit",
      url: "/agency-toolkit",
      icon: IconInnerShadowTop,
    },
  ],
  navSubTools: [
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
        }
      } catch (error) {
        console.log('No authenticated user or Supabase not configured')
      }
    }

    getInitialUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null)
          setUser(defaultUser)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])
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
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Sempre Studios</span>
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
