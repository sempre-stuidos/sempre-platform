"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

interface ProjectTeamProps {
  project: Project
}

export function ProjectTeam({ project }: ProjectTeamProps) {
  return (
    <div className="space-y-6">
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
    </div>
  )
}
