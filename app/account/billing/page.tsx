"use client"

import { AccountSidebar } from "@/components/account-sidebar"
import { BillingContent } from "@/components/billing-content"
import { SiteHeader } from "@/components/site-header"
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function BillingPage() {
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
          breadcrumb="Billing" 
          hideSearch={true}
          showDashboardLink={true}
        />
        <div className="flex flex-1 flex-col">
          <BillingContent />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

