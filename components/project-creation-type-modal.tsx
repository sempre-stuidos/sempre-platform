"use client"

import { useState } from "react"
import { IconTarget, IconTimeline, IconChecklist, IconListCheck, IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export type ProjectCreationOptions = {
  basic: boolean
  timeline: boolean
  deliverables: boolean
  tasks: boolean
}

interface ProjectCreationTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (options: ProjectCreationOptions) => void
  onAIGenerate?: (options: ProjectCreationOptions) => void
}

const creationOptions = [
  {
    id: "basic" as keyof ProjectCreationOptions,
    title: "Basic Project Information",
    description: "Project name, description, client, budget, and dates",
    icon: IconTarget,
    required: true
  },
  {
    id: "timeline" as keyof ProjectCreationOptions,
    title: "Timeline & Milestones",
    description: "Project milestones, timeline planning, and deadline tracking",
    icon: IconTimeline,
    required: false
  },
  {
    id: "deliverables" as keyof ProjectCreationOptions,
    title: "Deliverables & Outputs",
    description: "Define project deliverables and expected outcomes",
    icon: IconChecklist,
    required: false
  },
  {
    id: "tasks" as keyof ProjectCreationOptions,
    title: "Initial Tasks",
    description: "Set up initial project tasks and assignments",
    icon: IconListCheck,
    required: false
  }
]

export function ProjectCreationTypeModal({ isOpen, onClose, onCreateProject, onAIGenerate }: ProjectCreationTypeModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<ProjectCreationOptions>({
    basic: true, // Basic info is always required
    timeline: false,
    deliverables: false,
    tasks: false,
  })

  const handleOptionChange = (option: keyof ProjectCreationOptions, checked: boolean) => {
    setSelectedOptions(prev => ({ ...prev, [option]: checked }))
  }

  const handleCreate = () => {
    if (onAIGenerate) {
      onAIGenerate(selectedOptions)
    } else {
      onCreateProject(selectedOptions)
    }
    onClose()
  }

  const handleSelectAll = () => {
    setSelectedOptions({
      basic: true,
      timeline: true,
      deliverables: true,
      tasks: true,
    })
  }

  const handleSelectNone = () => {
    setSelectedOptions({
      basic: true, // Keep basic as it's required
      timeline: false,
      deliverables: false,
      tasks: false,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Choose Project Creation Type</DialogTitle>
          <DialogDescription>
            Select which project data should be generated from the proposal.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleSelectNone}>
              Basic Only
            </Button>
          </div>

          <div className="space-y-3">
            {creationOptions.map((option) => {
              const IconComponent = option.icon
              return (
                <div key={option.id} className="group flex items-center space-x-3 p-3 border rounded-lg transition-colors hover:bg-primary hover:border-primary cursor-pointer">
                  <Checkbox
                    id={option.id}
                    checked={selectedOptions[option.id]}
                    disabled={option.required}
                    onCheckedChange={(checked) => handleOptionChange(option.id, checked as boolean)}
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-primary-foreground/10 group-hover:text-primary-foreground transition-colors">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={option.id} className="font-medium cursor-pointer group-hover:text-primary-foreground transition-colors">
                        {option.title}
                        {option.required && <span className="text-gray-500 ml-1 group-hover:text-primary-foreground/70">(Required)</span>}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1 group-hover:text-primary-foreground/90 transition-colors">{option.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              <IconPlus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
