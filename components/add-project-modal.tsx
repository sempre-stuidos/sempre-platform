"use client"

import { IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { getAllClients } from "@/lib/clients"
import { Client } from "@/lib/types"

interface AddProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onAddProject: (project: NewProject) => void
  initialData?: any
  isEdit?: boolean
}

interface NewProject {
  name: string
  clientId: number
  clientName: string
  status: "Completed" | "In Progress" | "Review" | "Planned"
  priority: "High" | "Medium" | "Low"
  description: string
  startDate: string
  dueDate: string
  budget: number
  isOngoing: boolean
}

export function AddProjectModal({ isOpen, onClose, onAddProject, initialData, isEdit = false }: AddProjectModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [formData, setFormData] = useState<NewProject>(() => {
    if (initialData && isEdit) {
      return {
        name: initialData.name || "",
        clientId: initialData.clientId || 0,
        clientName: initialData.clientName || "",
        status: initialData.status || "Planned",
        priority: initialData.priority || "Medium",
        description: initialData.description || "",
        startDate: initialData.startDate || "",
        dueDate: initialData.dueDate || "",
        budget: initialData.budget || "",
        isOngoing: initialData.isOngoing || false
      }
    }
    return {
      name: "",
      clientId: 0,
      clientName: "",
      status: "Planned",
      priority: "Medium",
      description: "",
      startDate: "",
      dueDate: "",
      budget: "",
      isOngoing: false
    }
  })

  const [errors, setErrors] = useState<Partial<NewProject>>({})

  // Fetch clients when modal opens
  useEffect(() => {
    if (isOpen) {
      getAllClients().then(setClients)
    }
  }, [isOpen])

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        name: initialData.name || "",
        clientId: initialData.clientId || 0,
        clientName: initialData.clientName || "",
        status: initialData.status || "Planned",
        priority: initialData.priority || "Medium",
        description: initialData.description || "",
        startDate: initialData.startDate || "",
        dueDate: initialData.dueDate || "",
        budget: initialData.budget || "",
        isOngoing: initialData.isOngoing || false
      })
    } else if (!isEdit) {
      // Reset form data for new project
      setFormData({
        name: "",
        clientId: 0,
        clientName: "",
        status: "Planned",
        priority: "Medium",
        description: "",
        startDate: "",
        dueDate: "",
        budget: "",
        isOngoing: false
      })
    }
  }, [initialData, isEdit])

  const validateForm = () => {
    const newErrors: Partial<NewProject> = {}
    
    // Required fields: name and client_id
    if (!formData.name.trim()) {
      newErrors.name = "Project name is required"
    }
    if (!formData.clientId || formData.clientId === 0) {
      newErrors.clientId = "Client is required"
    }
    
    // Optional validation for date logic
    if (formData.startDate && formData.dueDate && !formData.isOngoing && new Date(formData.startDate) > new Date(formData.dueDate)) {
      newErrors.dueDate = "Due date must be after start date"
    }
    
    // Budget validation if provided
    if (formData.budget !== "" && (isNaN(Number(formData.budget)) || Number(formData.budget) < 0)) {
      newErrors.budget = "Budget must be a positive number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      const projectData = {
        ...formData,
        budget: formData.budget === "" ? 0 : Number(formData.budget)
      }
      onAddProject(projectData)
      setFormData({
        name: "",
        clientId: 0,
        clientName: "",
        status: "Planned",
        priority: "Medium",
        description: "",
        startDate: "",
        dueDate: "",
        budget: "",
        isOngoing: false
      })
      setErrors({})
      onClose()
    }
  }

  const handleClose = () => {
    setFormData({
      name: "",
      clientId: 0,
      clientName: "",
      status: "Planned",
      priority: "Medium",
      description: "",
      startDate: "",
      dueDate: "",
      budget: "",
      isOngoing: false
    })
    setErrors({})
    onClose()
  }

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === parseInt(clientId))
    setFormData({
      ...formData,
      clientId: parseInt(clientId),
      clientName: client?.name || ""
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Project" : "Add New Project"}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Update project details including timeline, budget, and client information."
              : "Create a new project with timeline, budget, and client information."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter project name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Client *</Label>
              <Select
                value={formData.clientId ? formData.clientId.toString() : ""}
                onValueChange={handleClientChange}
              >
                <SelectTrigger className={errors.clientId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && <p className="text-sm text-red-500">{errors.clientId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "Completed" | "In Progress" | "Review" | "Planned") => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planned">Planned</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "High" | "Medium" | "Low") => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={errors.startDate ? "border-red-500" : ""}
              />
              {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isOngoing"
                    checked={formData.isOngoing}
                    onChange={(e) => setFormData({ ...formData, isOngoing: e.target.checked, dueDate: e.target.checked ? "" : formData.dueDate })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isOngoing" className="text-sm font-normal">Ongoing project</Label>
                </div>
                {!formData.isOngoing && (
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className={errors.dueDate ? "border-red-500" : ""}
                  />
                )}
              </div>
              {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="text"
                value={formData.budget}
                onChange={(e) => {
                  const value = e.target.value
                  // Allow only numbers, decimal point, and empty string
                  if (value === "" || /^\d*\.?\d*$/.test(value)) {
                    setFormData({ ...formData, budget: value })
                  }
                }}
                placeholder="Enter budget amount"
                className={errors.budget ? "border-red-500" : ""}
              />
              {errors.budget && <p className="text-sm text-red-500">{errors.budget}</p>}
            </div>

          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter project description"
              rows={3}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEdit ? "Update Project" : "Add Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
