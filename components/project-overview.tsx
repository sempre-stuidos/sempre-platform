"use client"

import { IconCheck } from "@tabler/icons-react"
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

interface ProjectOverviewProps {
  project: Project
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Planned":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
            <CardDescription>Key project information and timeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Timeline</h4>
              <p className="text-sm text-muted-foreground">
                Started: {project.startDate} | Due: {project.dueDate}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Priority</h4>
              <Badge 
                variant="outline" 
                className={`w-fit ${getProjectStatusColor(project.priority)}`}
              >
                {project.priority}
              </Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Budget</h4>
              <p className="text-sm text-muted-foreground">
                ${project.budget.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Status</h4>
              <Badge 
                variant="outline" 
                className={`w-fit ${getProjectStatusColor(project.status)}`}
              >
                {project.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Progress</h4>
              <p className="text-sm text-muted-foreground">
                {project.progress ?? 0}% complete
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Deliverables */}
        <Card>
          <CardHeader>
            <CardTitle>Deliverables</CardTitle>
            <CardDescription>Project deliverables and outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {project.deliverables.map((deliverable, index) => (
                <li key={index} className="flex items-center gap-2">
                  <IconCheck className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{deliverable}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
