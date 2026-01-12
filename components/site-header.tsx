"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { IconSearch, IconDashboard, IconSun, IconMoon } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface SiteHeaderProps {
  clientName?: string
  breadcrumb?: string
  hideSearch?: boolean
  showDashboardLink?: boolean
}

export function SiteHeader({ 
  clientName, 
  breadcrumb, 
  hideSearch = false,
  showDashboardLink = false 
}: SiteHeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 hidden md:flex" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 hidden md:flex"
        />
        {breadcrumb ? (
          <h1 className="text-base font-medium">{breadcrumb}</h1>
        ) : (
          <h1 className="text-base font-medium">{clientName || "Dashboard"}</h1>
        )}
        <div className="ml-auto flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          {!hideSearch && (
          <div className="relative hidden sm:flex">
            <IconSearch className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 w-64"
            />
          </div>
          )}
          {showDashboardLink ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 h-8 rounded-md px-3 has-[>svg]:px-2.5 hidden gap-1.5 sm:flex bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <IconDashboard className="h-4 w-4" />
              Go to Dashboard
            </Link>
          ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="hidden gap-1.5 sm:flex"
            aria-label="Toggle theme"
          >
            {mounted && theme === 'dark' ? (
              <>
                <IconSun className="h-4 w-4" />
                Light Mode
              </>
            ) : (
              <>
                <IconMoon className="h-4 w-4" />
                Dark Mode
              </>
            )}
          </Button>
          )}
        </div>
      </div>
    </header>
  )
}
