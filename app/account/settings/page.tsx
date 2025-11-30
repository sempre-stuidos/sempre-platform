"use client"

import { AccountSidebar } from "@/components/account-sidebar"
import { SettingsContent } from "@/components/settings-content"
import { SiteHeader } from "@/components/site-header"
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function SettingsPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <Sidebar variant="inset" className="border-r">
        <AccountSidebar />
      </Sidebar>
      <SidebarInset>
        <SiteHeader 
          breadcrumb="Settings" 
          hideSearch={true}
          showDashboardLink={true}
        />
        <div className="flex flex-1 flex-col">
          <SettingsContent />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
