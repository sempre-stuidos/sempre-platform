"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconClipboardText,
  IconPlus,
  IconCalendar,
  IconUser,
  IconBuilding,
  IconCheck,
  IconTarget,
  IconFileText,
  IconBulb,
  IconSettings,
  IconEdit,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { NotesKnowledge, Project, Task } from "@/lib/types"
import { createProject } from "@/lib/projects"
import { createTask } from "@/lib/tasks"
import { AddProjectModal } from "@/components/add-project-modal"
import { AddTaskModal } from "@/components/add-task-modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProposalDetailProps {
  proposal: NotesKnowledge
}

export function ProposalDetail({ proposal }: ProposalDetailProps) {
  const router = useRouter()
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = React.useState(false)
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("overview")

  const handleCreateProject = async (projectData: Partial<Project>) => {
    try {
      const newProject = await createProject({
        ...projectData,
        clientId: 1, // Default client ID - in real app, this would be dynamic
        clientName: proposal.client || "Unknown Client",
        status: "Planned",
        startDate: new Date().toISOString().split('T')[0],
        budget: projectData.budget || 0,
        priority: projectData.priority || "Medium",
        teamMembers: [],
        tasks: [],
        deliverables: [],
        timeline: []
      })
      
      if (newProject) {
        toast.success('Project created successfully')
        setIsAddProjectModalOpen(false)
        // Optionally redirect to the new project
        // router.push(`/projects/${newProject.id}`)
      } else {
        toast.error('Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Failed to create project')
    }
  }

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      const newTask = await createTask({
        title: taskData.title || "New Task",
        projectId: 1, // Default project ID - in real app, this would be dynamic
        assigneeId: null,
        status: "To Do",
        priority: taskData.priority || "Medium",
        dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
        progress: 0
      })
      
      if (newTask) {
        toast.success('Task created successfully')
        setIsAddTaskModalOpen(false)
        // Optionally redirect to the new task
        // router.push(`/tasks/${newTask.id}`)
      } else {
        toast.error('Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Published":
        return "bg-green-100 text-green-800 border-green-200"
      case "Under Review":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Archived":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <IconArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <IconClipboardText className="h-8 w-8 text-sky-600" />
            <div>
              <h1 className="text-2xl font-bold">{proposal.title}</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <IconEdit className="h-4 w-4 mr-2" />
            Edit Proposal
          </Button>
        </div>
      </div>

      <Separator />

      {/* Main Content */}
      <div className="px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Proposal Info */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconFileText className="h-5 w-5" />
                    Proposal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Client</label>
                      <p className="flex items-center gap-2 mt-1">
                        <IconBuilding className="h-4 w-4" />
                        {proposal.client || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Author</label>
                      <p className="flex items-center gap-2 mt-1">
                        <IconUser className="h-4 w-4" />
                        {proposal.author}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date</label>
                      <p className="flex items-center gap-2 mt-1">
                        <IconCalendar className="h-4 w-4" />
                        {proposal.date}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <p className="flex items-center gap-2 mt-1">
                        <IconClipboardText className="h-4 w-4" />
                        {proposal.type}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Full Proposal Content</CardTitle>
                  <CardDescription>
                    Detailed content and specifications from the proposal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {proposal.content ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{proposal.content}</p>
                    </div>
                  ) : (
                    <Alert>
                      <IconFileText className="h-4 w-4" />
                      <AlertDescription>
                        No detailed content available for this proposal.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconBulb className="h-5 w-5" />
                    Create from Proposal
                  </CardTitle>
                  <CardDescription>
                    Convert this proposal into actionable projects and tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-dashed">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <IconTarget className="h-5 w-5" />
                          Create Project
                        </CardTitle>
                        <CardDescription>
                          Start a new project based on this proposal
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={() => setIsAddProjectModalOpen(true)}
                          className="w-full"
                        >
                          <IconPlus className="h-4 w-4 mr-2" />
                          Create Project
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-dashed">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <IconCheck className="h-5 w-5" />
                          Create Task
                        </CardTitle>
                        <CardDescription>
                          Add specific tasks from this proposal
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={() => setIsAddTaskModalOpen(true)}
                          variant="outline"
                          className="w-full"
                        >
                          <IconPlus className="h-4 w-4 mr-2" />
                          Create Task
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <Alert>
                    <IconSettings className="h-4 w-4" />
                    <AlertDescription>
                      Use the buttons above to create projects or tasks based on this proposal. 
                      The content will be pre-populated with relevant information from the proposal.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => setIsAddProjectModalOpen(true)}
                className="w-full justify-start"
                variant="outline"
              >
                <IconTarget className="h-4 w-4 mr-2" />
                Create Project
              </Button>
              <Button 
                onClick={() => setIsAddTaskModalOpen(true)}
                className="w-full justify-start"
                variant="outline"
              >
                <IconCheck className="h-4 w-4 mr-2" />
                Create Task
              </Button>
              <Button 
                onClick={() => router.push(`/notes-knowledge`)}
                className="w-full justify-start"
                variant="outline"
              >
                <IconFileText className="h-4 w-4 mr-2" />
                Back to Notes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Proposal Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(proposal.status)}
                  >
                    {proposal.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">{proposal.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Author</span>
                  <span className="text-sm">{proposal.author}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>

      {/* Modals */}
      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        onAddProject={handleCreateProject}
        initialData={{
          name: proposal.title,
          description: proposal.content || "",
          clientName: proposal.client || "",
          priority: "Medium"
        }}
      />

      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onAddTask={handleCreateTask}
        initialData={{
          id: 0, // Temporary ID
          title: `Task from: ${proposal.title}`,
          projectId: 1,
          assigneeId: null,
          status: "To Do",
          priority: "Medium",
          dueDate: new Date().toISOString().split('T')[0],
          progress: 0
        }}
      />
    </div>
  )
}
