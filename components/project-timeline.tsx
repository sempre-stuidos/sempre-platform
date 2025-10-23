"use client"

import { IconCalendar, IconClock, IconCheck, IconX } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Project {
  id: number
  name: string
  clientId: number
  clientName: string
  status: string
  dueDate: string
  progress?: number
  description: string
  startDate: string
  budget: number
  priority: string
  teamMembers: Array<{
    id: number
    name: string
    role: string
    avatar?: string
  }>
  tasks: Array<{
    id: number
    title: string
    status: string
    assignee?: string
    deliverable?: string
  }>
  deliverables: string[]
  timeline: Array<{
    milestone: string
    date: string
    status: string
  }>
}

interface ProjectTimelineProps {
  project: Project
}

export function ProjectTimeline({ project }: ProjectTimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <IconCheck className="w-4 h-4 text-green-500" />
      case "in-progress":
        return <IconClock className="w-4 h-4 text-blue-500" />
      case "pending":
        return <IconX className="w-4 h-4 text-gray-400" />
      default:
        return <IconClock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>Key milestones and their progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {project.timeline.map((milestone, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {getStatusIcon(milestone.status)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{milestone.milestone}</p>
                  <p className="text-sm text-muted-foreground">{milestone.date}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(milestone.status)}`}
                >
                  {milestone.status.replace('-', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
