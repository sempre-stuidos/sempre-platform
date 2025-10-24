"use client"

import { useState, useEffect } from "react"
import { IconTarget, IconSearch } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { getAllProjects } from "@/lib/projects"
import { Project } from "@/lib/types"

interface TaskProjectSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectProject: (projectId: number) => void
}

export function TaskProjectSelectorModal({ isOpen, onClose, onSelectProject }: TaskProjectSelectorModalProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // Load projects when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProjects()
    }
  }, [isOpen])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const projectsData = await getAllProjects()
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (projectId: number) => {
    onSelectProject(projectId)
    setSearchTerm("")
    onClose()
  }

  const handleClose = () => {
    setSearchTerm("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select Project for Task</DialogTitle>
          <DialogDescription>
            Choose which project you want to add a new task to.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects by name or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Projects List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading projects...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No projects found matching your search.' : 'No projects available.'}
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div 
                  key={project.id} 
                  className="group flex items-center space-x-3 p-3 border rounded-lg transition-colors hover:bg-primary hover:border-primary cursor-pointer"
                  onClick={() => handleSelect(project.id)}
                >
                  <div className="p-2 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-primary-foreground/10 group-hover:text-primary-foreground transition-colors">
                    <IconTarget className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium cursor-pointer group-hover:text-primary-foreground transition-colors">
                      {project.name}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 group-hover:text-primary-foreground/90 transition-colors">
                      Client: {project.clientName}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
