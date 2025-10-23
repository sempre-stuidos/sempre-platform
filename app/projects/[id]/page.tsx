import { AppSidebar } from "@/components/app-sidebar"
import { ProjectOverview } from "@/components/project-overview"
import { ProjectTeam } from "@/components/project-team"
import { ProjectTasksTable } from "@/components/project-tasks-table"
import { ProjectTimeline } from "@/components/project-timeline"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { IconArrowLeft, IconEdit, IconShare } from "@tabler/icons-react"
import Link from "next/link"

import { getProjectById } from "@/lib/projects"

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await getProjectById(parseInt(params.id))

  if (!project) {
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
                <div className="text-center py-12">
                  <h1 className="text-2xl font-semibold">Project not found</h1>
                  <p className="text-muted-foreground mt-2">The project you&apos;re looking for doesn&apos;t exist.</p>
                  <Link href="/projects">
                    <Button className="mt-4">
                      <IconArrowLeft className="mr-2 h-4 w-4" />
                      Back to Projects
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

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
        <SiteHeader clientName={project.name} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Header */}
              <div className="flex items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-4">
                  <Link href="/projects">
                    <Button variant="ghost" size="sm">
                      <IconArrowLeft className="mr-2 h-4 w-4" />
                      Back to Projects
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <IconShare className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button size="sm">
                    <IconEdit className="mr-2 h-4 w-4" />
                    Edit Project
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-4 lg:px-6">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="team">Team</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="mt-6">
                    <ProjectOverview project={project} />
                  </TabsContent>
                  
                  <TabsContent value="team" className="mt-6">
                    <ProjectTeam project={project} />
                  </TabsContent>
                  
                  <TabsContent value="tasks" className="mt-6">
                    <ProjectTasksTable data={project.tasks} />
                  </TabsContent>
                  
                  <TabsContent value="timeline" className="mt-6">
                    <ProjectTimeline project={project} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
