import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  IconArrowLeft,
  IconCalendar,
  IconClock,
  IconFlag,
  IconUser,
  IconFolder,
  IconCheck,
  IconLoader,
  IconCircleCheckFilled,
} from "@tabler/icons-react"
import Link from "next/link"

import data from "../tasks-data.json"

interface TaskDetailPageProps {
  params: {
    id: string
  }
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const task = data.find((t) => t.id === parseInt(params.id))

  if (!task) {
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
                <div className="text-center py-8">
                  <h1 className="text-2xl font-semibold">Task not found</h1>
                  <p className="text-muted-foreground mt-2">The task you're looking for doesn't exist.</p>
                  <Link href="/tasks">
                    <Button className="mt-4">
                      <IconArrowLeft className="mr-2 size-4" />
                      Back to Tasks
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Done":
        return <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1" />
      case "In Progress":
        return <IconLoader className="mr-1" />
      case "Review":
        return <IconClock className="mr-1" />
      default:
        return <IconCalendar className="mr-1" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Done":
        return "bg-green-100 text-green-800 border-green-200"
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
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
        <SiteHeader clientName={task.title} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Link href="/tasks">
                    <Button variant="ghost" size="sm">
                      <IconArrowLeft className="mr-2 size-4" />
                      Back to Tasks
                    </Button>
                  </Link>
                  <div>
                    <p className="text-muted-foreground">Task #{task.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`px-2 ${getStatusColor(task.status)}`}
                  >
                    {getStatusIcon(task.status)}
                    {task.status}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`px-2 ${getPriorityColor(task.priority)}`}
                  >
                    <IconFlag className="mr-1 size-3" />
                    {task.priority}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Description */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{task.description}</p>
                    </CardContent>
                  </Card>

                  {/* Progress */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Task Progress</span>
                        <span className="text-sm text-muted-foreground">{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="w-full" />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Estimated Hours:</span>
                          <span className="ml-2 font-medium">{task.estimatedHours}h</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Actual Hours:</span>
                          <span className="ml-2 font-medium">{task.actualHours}h</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tags */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Assignee */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Assignee</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarImage src={task.assigneeAvatar} alt={task.assigneeName} />
                          <AvatarFallback>
                            {task.assigneeName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{task.assigneeName}</p>
                          <p className="text-sm text-muted-foreground">{task.assigneeRole}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Project */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Project</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <IconFolder className="size-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{task.projectName}</p>
                          <p className="text-sm text-muted-foreground">Project #{task.projectId}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <IconCalendar className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Due Date</p>
                          <p className="text-sm text-muted-foreground">{task.dueDate}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center gap-3">
                        <IconClock className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Created</p>
                          <p className="text-sm text-muted-foreground">{task.createdDate}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button className="w-full" variant="outline">
                        Edit Task
                      </Button>
                      <Button className="w-full" variant="outline">
                        Add Comment
                      </Button>
                      <Button className="w-full" variant="outline">
                        Attach File
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
