"use client"

import { useState, useEffect } from "react"
import { IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Task } from "@/lib/types"
import { getAllProjects, getAllTeamMembers } from "@/lib/tasks"

interface NewTask {
  title: string
  projectId: number
  assigneeId: number | null
  status: 'To Do' | 'In Progress' | 'Review' | 'Done'
  priority: 'High' | 'Medium' | 'Low'
  dueDate: string
}

interface AddTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onAddTask: (taskData: NewTask) => void
  initialData?: Task | null
  isEdit?: boolean
}

export function AddTaskModal({
  isOpen,
  onClose,
  onAddTask,
  initialData,
  isEdit = false,
}: AddTaskModalProps) {
  const [formData, setFormData] = useState<NewTask>({
    title: "",
    projectId: 0,
    assigneeId: null,
    status: "To Do",
    priority: "Medium",
    dueDate: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [projects, setProjects] = useState<{id: number, name: string}[]>([])
  const [teamMembers, setTeamMembers] = useState<{id: number, name: string, role: string, avatar?: string}[]>([])
  const [loading, setLoading] = useState(false)

  // Load dropdown data
  useEffect(() => {
    const loadDropdownData = async () => {
      setLoading(true)
      try {
        const [projectsData, teamMembersData] = await Promise.all([
          getAllProjects(),
          getAllTeamMembers()
        ])
        setProjects(projectsData)
        setTeamMembers(teamMembersData)
      } catch (error) {
        console.error('Error loading dropdown data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      loadDropdownData()
    }
  }, [isOpen])

  // Populate form data when editing
  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        title: initialData.title || "",
        projectId: initialData.projectId || 0,
        assigneeId: initialData.assigneeId || null,
        status: initialData.status || "To Do",
        priority: initialData.priority || "Medium",
        dueDate: initialData.dueDate || "",
      })
    } else {
      // Reset form for new task
      setFormData({
        title: "",
        projectId: 0,
        assigneeId: null,
        status: "To Do",
        priority: "Medium",
        dueDate: "",
      })
    }
    setErrors({})
  }, [initialData, isEdit])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required fields: title, projectId
    if (!formData.title.trim()) {
      newErrors.title = "Task title is required"
    }
    if (!formData.projectId || formData.projectId === 0) {
      newErrors.projectId = "Project is required"
    }
    // assigneeId is optional (can be null)

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onAddTask(formData)
  }

  const handleInputChange = (field: keyof NewTask, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Task" : "Add New Task"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the task details below." : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter task title"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">Project *</Label>
              <Select
                value={formData.projectId ? formData.projectId.toString() : ""}
                onValueChange={(value) => handleInputChange("projectId", parseInt(value) || 0)}
              >
                <SelectTrigger className={errors.projectId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && (
                <p className="text-sm text-red-500">{errors.projectId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigneeId">Assignee</Label>
              <Select
                value={formData.assigneeId ? formData.assigneeId.toString() : ""}
                onValueChange={(value) => handleInputChange("assigneeId", value === "none" ? null : parseInt(value) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an assignee (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No assignee</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'To Do' | 'In Progress' | 'Review' | 'Done') => 
                  handleInputChange("status", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="To Do">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'High' | 'Medium' | 'Low') => 
                  handleInputChange("priority", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange("dueDate", e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEdit ? "Update Task" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
