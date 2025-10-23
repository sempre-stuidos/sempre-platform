import { AppSidebar } from "@/components/app-sidebar"
import { PresentationDataTable } from "@/components/presentation-data-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAllPresentations, getPresentationStats } from "@/lib/presentations"

export default async function PresentationPage() {
  // Fetch presentation data from database
  const data = await getAllPresentations()
  const stats = getPresentationStats(data)
  
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Presentation Stats Widgets */}
              <div className="grid gap-4 md:grid-cols-2 px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Presentations & Status</CardTitle>
                    <CardDescription>
                      {stats.total} Total Presentations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Approved</span>
                        <span className="text-sm font-medium">{stats.byStatus.Approved || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">In Progress</span>
                        <span className="text-sm font-medium">{(stats.byStatus.Draft || 0) + (stats.byStatus.Sent || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Archived</span>
                        <span className="text-sm font-medium">{stats.byStatus.Archived || 0}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {stats.byStatus.Approved ? Math.round((stats.byStatus.Approved / stats.total) * 100) : 0}% approval rate • Active client presentations
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Activity & Types</CardTitle>
                    <CardDescription>
                      {data.filter(p => {
                        const createdDate = new Date(p.createdDate)
                        const now = new Date()
                        return createdDate.getMonth() === now.getMonth() && 
                               createdDate.getFullYear() === now.getFullYear()
                      }).length} Created This Month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(stats.byType).slice(0, 3).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{type}</span>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))}
                      <div className="text-xs text-muted-foreground mt-2">
                        Proposals and reports • Client collaboration active
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Data Table */}
              <PresentationDataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
