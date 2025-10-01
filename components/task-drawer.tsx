"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  IconCalendar,
  IconClock,
  IconFlag,
  IconFolder,
  IconCheck,
  IconLoader,
  IconCircleCheckFilled,
} from "@tabler/icons-react"

interface Task {
  id: number
  title: string
  projectId: number
  projectName: string
  assigneeId: number
  assigneeName: string
  assigneeRole: string
  assigneeAvatar: string
  status: string
  priority: string
  dueDate: string
  createdDate: string
  description: string
  tags: string[]
  estimatedHours: number
  actualHours: number
  progress: number
}

interface TaskDrawerProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
}

export function TaskDrawer({ task, isOpen, onClose }: TaskDrawerProps) {
  if (!task) return null

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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-left">{task.title}</SheetTitle>
              <SheetDescription className="text-left">Task #{task.id}</SheetDescription>
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
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{task.description}</p>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progress</CardTitle>
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

          {/* Assignee */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assignee</CardTitle>
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
              <CardTitle className="text-base">Project</CardTitle>
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
              <CardTitle className="text-base">Timeline</CardTitle>
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

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
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

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
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
      </SheetContent>
    </Sheet>
  )
}
