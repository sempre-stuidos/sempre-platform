"use client"

import { useState, useEffect, useCallback } from "react"
import { IconEye, IconEyeOff, IconCheck, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Project } from "@/lib/types"
import { getProjectById } from "@/lib/projects"
import { updateProject } from "@/lib/projects"
import { toast } from "sonner"

interface UpdateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: number
  proposalData: {
    title: string
    content: string
    author: string
    date: string
  }
  onUpdate: (updatedProject: Project) => void
}

interface UpdateFields {
  name: boolean
  description: boolean
  deliverables: boolean
  timeline: boolean
  budget: boolean
  dates: boolean
}

interface FormData {
  name: string
  description: string
  deliverables: string[]
  timeline: Array<{ milestone: string; date: string; status: string }>
  budget: number
  startDate: string
  dueDate: string
}

export function UpdateProjectModal({ 
  isOpen, 
  onClose, 
  projectId, 
  proposalData, 
  onUpdate 
}: UpdateProjectModalProps) {
  const [selectedFields, setSelectedFields] = useState<UpdateFields>({
    name: false,
    description: false,
    deliverables: false,
    timeline: false,
    budget: false,
    dates: false
  })

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    deliverables: [],
    timeline: [],
    budget: 0,
    startDate: "",
    dueDate: ""
  })

  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [showCurrentData, setShowCurrentData] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const loadCurrentProject = useCallback(async () => {
    setLoading(true)
    try {
      const project = await getProjectById(projectId)
      if (project) {
        setCurrentProject(project)
        // Pre-fill form with current project data
        setFormData({
          name: project.name,
          description: project.description,
          deliverables: project.deliverables,
          timeline: project.timeline,
          budget: project.budget,
          startDate: project.startDate,
          dueDate: project.dueDate
        })
      }
    } catch (error) {
      console.error('Error loading project:', error)
      toast.error('Failed to load project data')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // Load current project data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCurrentProject()
    }
  }, [isOpen, projectId, loadCurrentProject])

  const handleFieldToggle = (field: keyof UpdateFields) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const addDeliverable = () => {
    setFormData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, ""]
    }))
  }

  const updateDeliverable = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((item, i) => i === index ? value : item)
    }))
  }

  const removeDeliverable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }))
  }

  const addTimelineItem = () => {
    setFormData(prev => ({
      ...prev,
      timeline: [...prev.timeline, { milestone: "", date: "", status: "pending" }]
    }))
  }

  const updateTimelineItem = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      timeline: prev.timeline.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeTimelineItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      timeline: prev.timeline.filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (selectedFields.name && !formData.name.trim()) {
      newErrors.name = "Project name is required"
    }
    if (selectedFields.dates && formData.startDate && formData.dueDate && 
        new Date(formData.startDate) > new Date(formData.dueDate)) {
      newErrors.dueDate = "Due date must be after start date"
    }
    if (selectedFields.budget && formData.budget < 0) {
      newErrors.budget = "Budget must be a positive number"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const hasSelectedFields = Object.values(selectedFields).some(Boolean)
    if (!hasSelectedFields) {
      toast.error('Please select at least one field to update')
      return
    }

    setLoading(true)
    try {
      const updateData: Partial<Project> = {}
      
      if (selectedFields.name) updateData.name = formData.name
      if (selectedFields.description) updateData.description = formData.description
      if (selectedFields.deliverables) updateData.deliverables = formData.deliverables.filter(d => d.trim())
      if (selectedFields.timeline) updateData.timeline = formData.timeline.filter(t => t.milestone.trim()).map(t => ({ ...t, status: t.status as "completed" | "in-progress" | "pending" }))
      if (selectedFields.budget) updateData.budget = formData.budget
      if (selectedFields.dates) {
        updateData.startDate = formData.startDate
        updateData.dueDate = formData.dueDate
      }

      const updatedProject = await updateProject(projectId, updateData)
      if (updatedProject) {
        onUpdate(updatedProject)
        toast.success('Project updated successfully')
        onClose()
      } else {
        toast.error('Failed to update project')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Failed to update project')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedFields({
      name: false,
      description: false,
      deliverables: false,
      timeline: false,
      budget: false,
      dates: false
    })
    setShowCurrentData(false)
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Project</DialogTitle>
          <DialogDescription>
            Select which fields you want to update from the proposal data. 
            Current project data is available for reference.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Update Options */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Fields to Update</CardTitle>
                <CardDescription>
                  Choose which project fields you want to update with proposal data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="name"
                      checked={selectedFields.name}
                      onCheckedChange={() => handleFieldToggle('name')}
                    />
                    <Label htmlFor="name" className="text-sm font-medium">
                      Project Name
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="description"
                      checked={selectedFields.description}
                      onCheckedChange={() => handleFieldToggle('description')}
                    />
                    <Label htmlFor="description" className="text-sm font-medium">
                      Description
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="deliverables"
                      checked={selectedFields.deliverables}
                      onCheckedChange={() => handleFieldToggle('deliverables')}
                    />
                    <Label htmlFor="deliverables" className="text-sm font-medium">
                      Deliverables
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="timeline"
                      checked={selectedFields.timeline}
                      onCheckedChange={() => handleFieldToggle('timeline')}
                    />
                    <Label htmlFor="timeline" className="text-sm font-medium">
                      Timeline
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="budget"
                      checked={selectedFields.budget}
                      onCheckedChange={() => handleFieldToggle('budget')}
                    />
                    <Label htmlFor="budget" className="text-sm font-medium">
                      Budget
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dates"
                      checked={selectedFields.dates}
                      onCheckedChange={() => handleFieldToggle('dates')}
                    />
                    <Label htmlFor="dates" className="text-sm font-medium">
                      Start & Due Dates
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {selectedFields.name && (
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter project name"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>
              )}

              {selectedFields.description && (
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter project description"
                    rows={3}
                  />
                </div>
              )}

              {selectedFields.deliverables && (
                <div className="space-y-2">
                  <Label>Deliverables</Label>
                  <div className="space-y-2">
                    {formData.deliverables.map((deliverable, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={deliverable}
                          onChange={(e) => updateDeliverable(index, e.target.value)}
                          placeholder="Enter deliverable"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDeliverable(index)}
                        >
                          <IconX className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDeliverable}
                    >
                      Add Deliverable
                    </Button>
                  </div>
                </div>
              )}

              {selectedFields.timeline && (
                <div className="space-y-2">
                  <Label>Timeline</Label>
                  <div className="space-y-2">
                    {formData.timeline.map((item, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2">
                        <Input
                          value={item.milestone}
                          onChange={(e) => updateTimelineItem(index, 'milestone', e.target.value)}
                          placeholder="Milestone"
                        />
                        <Input
                          type="date"
                          value={item.date}
                          onChange={(e) => updateTimelineItem(index, 'date', e.target.value)}
                        />
                        <div className="flex gap-1">
                          <Select
                            value={item.status}
                            onValueChange={(value) => updateTimelineItem(index, 'status', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeTimelineItem(index)}
                          >
                            <IconX className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTimelineItem}
                    >
                      Add Timeline Item
                    </Button>
                  </div>
                </div>
              )}

              {selectedFields.budget && (
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter budget amount"
                    className={errors.budget ? "border-red-500" : ""}
                  />
                  {errors.budget && <p className="text-sm text-red-500">{errors.budget}</p>}
                </div>
              )}

              {selectedFields.dates && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className={errors.dueDate ? "border-red-500" : ""}
                    />
                    {errors.dueDate && <p className="text-sm text-red-500">{errors.dueDate}</p>}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Project"}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column - Current Data & Show Button */}
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => setShowCurrentData(!showCurrentData)}
              className="w-full"
            >
              {showCurrentData ? (
                <>
                  <IconEyeOff className="h-4 w-4 mr-2" />
                  Hide Current Data
                </>
              ) : (
                <>
                  <IconEye className="h-4 w-4 mr-2" />
                  Show Current Data
                </>
              )}
            </Button>

            {showCurrentData && currentProject && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Project Data</CardTitle>
                  <CardDescription>
                    This is the current state of the project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Name</Label>
                    <p className="text-sm">{currentProject.name}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Description</Label>
                    <p className="text-sm">{currentProject.description || "No description"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge variant="outline" className="mt-1">
                      {currentProject.status}
                    </Badge>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Budget</Label>
                    <p className="text-sm">${currentProject.budget.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Timeline</Label>
                    <p className="text-sm">{currentProject.startDate} - {currentProject.dueDate}</p>
                  </div>
                  
                  {currentProject.deliverables.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Deliverables</Label>
                      <ul className="text-sm space-y-1 mt-1">
                        {currentProject.deliverables.map((deliverable, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <IconCheck className="h-3 w-3 text-green-600" />
                            {deliverable}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Proposal Data Reference */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Proposal Data</CardTitle>
                <CardDescription>
                  This data will be used to update the selected fields
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Title</Label>
                  <p className="text-sm">{proposalData.title}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Author</Label>
                  <p className="text-sm">{proposalData.author}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date</Label>
                  <p className="text-sm">{proposalData.date}</p>
                </div>
                
                {proposalData.content && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Content</Label>
                    <p className="text-sm line-clamp-3">{proposalData.content}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
