"use client"

import { useState, useEffect } from "react"
import { IconChecklist, IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { getProjectById } from "@/lib/projects"
import { Project } from "@/lib/types"

interface DeliverablesSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: number
  onCreateTasks: (deliverableIds: number[]) => void
}

export function DeliverablesSelectorModal({ isOpen, onClose, projectId, onCreateTasks }: DeliverablesSelectorModalProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [selectedDeliverables, setSelectedDeliverables] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && projectId) {
      loadProject()
    }
  }, [isOpen, projectId])

  const loadProject = async () => {
    setLoading(true)
    try {
      const projectData = await getProjectById(projectId)
      setProject(projectData)
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeliverableToggle = (deliverableIndex: number) => {
    setSelectedDeliverables(prev => 
      prev.includes(deliverableIndex) 
        ? prev.filter(id => id !== deliverableIndex)
        : [...prev, deliverableIndex]
    )
  }

  const handleSelectAll = () => {
    if (project?.deliverables) {
      setSelectedDeliverables(project.deliverables.map((_, index) => index))
    }
  }

  const handleSelectNone = () => {
    setSelectedDeliverables([])
  }

  const handleCreateTasks = () => {
    onCreateTasks(selectedDeliverables)
    setSelectedDeliverables([])
    onClose()
  }

  const getStatusColor = (status: string) => {
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

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Loading Project...</DialogTitle>
            <DialogDescription>Please wait while we fetch the project details.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  if (!project) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Project Not Found</DialogTitle>
            <DialogDescription>The project you are trying to access could not be loaded.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Tasks for {project.name}</DialogTitle>
          <DialogDescription>
            Select which deliverables you want to create tasks for.
          </DialogDescription>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
            <span className="text-sm text-gray-600">Client: {project.clientName}</span>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleSelectNone}>
              Select None
            </Button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {project.deliverables && project.deliverables.length > 0 ? (
              project.deliverables.map((deliverable, index) => (
                <div 
                  key={index} 
                  className="group flex items-center space-x-3 p-3 border rounded-lg transition-colors hover:bg-primary hover:border-primary cursor-pointer"
                  onClick={() => handleDeliverableToggle(index)}
                >
                  <Checkbox
                    checked={selectedDeliverables.includes(index)}
                    onCheckedChange={() => handleDeliverableToggle(index)}
                    className="pointer-events-none"
                  />
                  <div className="p-2 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-primary-foreground/10 group-hover:text-primary-foreground transition-colors">
                    <IconChecklist className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium cursor-pointer group-hover:text-primary-foreground transition-colors">
                      {deliverable}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 group-hover:text-primary-foreground/90 transition-colors">
                      Deliverable #{index + 1}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No deliverables defined for this project.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTasks}
              disabled={selectedDeliverables.length === 0}
            >
              <IconPlus className="h-4 w-4 mr-2" />
              Create Tasks ({selectedDeliverables.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
