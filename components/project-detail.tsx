"use client"

import { IconClock, IconCheck, IconX } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Project {
  id: number
  name: string
  clientId: number
  clientName: string
  status: string
  dueDate: string
  progress: number
  description: string
  startDate: string
  budget: number
  priority: string
  teamMembers: Array<{
    id: number
    name: string
    role: string
    avatar: string
  }>
  tasks: Array<{
    id: number
    title: string
    status: string
    assignee: string
  }>
  deliverables: string[]
  timeline: Array<{
    milestone: string
    date: string
    status: string
  }>
}

interface ProjectDetailProps {
  project: Project
}

export function ProjectDetail({ project }: ProjectDetailProps) {
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
    <div className="px-4 lg:px-6 space-y-6">

      {/* Project Details */}
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

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Project team and their roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Avatar>
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
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
    </div>
  )
}
