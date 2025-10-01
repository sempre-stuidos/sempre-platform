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
  IconSearch,
  IconSun,
  IconUsers,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavSub } from "@/components/nav-sub"
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

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
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
    {
      title: "Team",
      url: "/team",
      icon: IconUsers,
    },
  ],
  navSub: [
    {
      title: "Notes & Knowledge Base",
      url: "#",
      icon: IconFileDescription,
    },
    {
      title: "Files & Assets",
      url: "#",
      icon: IconFileWord,
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
        <NavMain items={data.navMain} />
        <NavSub items={data.navSub} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
