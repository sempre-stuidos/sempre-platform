import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DashboardDataTable } from "@/components/dashboard-data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { 
  getDashboardStats, 
  getDashboardChartData, 
  getRecentTasks,
  getHighPriorityTasks,
  getTasksDueThisWeek,
  getCompletedTasks,
  getTaskCounts,
  getProjectsList
} from "@/lib/dashboard"

export default async function Page() {
  // Fetch dashboard data from database
  const [stats, chartData, recentTasks, highPriorityTasks, tasksDueThisWeek, completedTasks, taskCounts, projectsList] = await Promise.all([
    getDashboardStats(),
    getDashboardChartData(),
    getRecentTasks(50),
    getHighPriorityTasks(50),
    getTasksDueThisWeek(50),
    getCompletedTasks(50),
    getTaskCounts(),
    getProjectsList()
  ])
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
              <SectionCards stats={stats} />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive data={chartData} />
              </div>
              <DashboardDataTable 
                allTasks={recentTasks}
                highPriorityTasks={highPriorityTasks}
                tasksDueThisWeek={tasksDueThisWeek}
                completedTasks={completedTasks}
                taskCounts={taskCounts}
                projectsList={projectsList}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
