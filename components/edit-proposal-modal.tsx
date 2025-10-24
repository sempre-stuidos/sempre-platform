"use client"

import { useState, useEffect } from "react"
import { IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NotesKnowledge } from "@/lib/types"
import { getAllClients } from "@/lib/clients"
import { getAllProjects } from "@/lib/projects"
import { updateNotesKnowledge } from "@/lib/notes-knowledge"
import { toast } from "sonner"

interface EditProposalModalProps {
  isOpen: boolean
  onClose: () => void
  proposal: NotesKnowledge
  onUpdate: (updatedProposal: NotesKnowledge) => void
}

interface FormData {
  title: string
  clientId: number | null
  projectId: number | null
  author: string
  date: string
  type: NotesKnowledge['type']
  status: NotesKnowledge['status']
  content: string
}

export function EditProposalModal({ isOpen, onClose, proposal, onUpdate }: EditProposalModalProps) {
  const [formData, setFormData] = useState<FormData>({
    title: proposal.title,
    clientId: proposal.clientId,
    projectId: proposal.projectId,
    author: proposal.author,
    date: proposal.date,
    type: proposal.type,
    status: proposal.status,
    content: proposal.content || ""
  })

  const [clients, setClients] = useState<{id: number, name: string}[]>([])
  const [projects, setProjects] = useState<{id: number, name: string}[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Load dropdown data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDropdownData()
    }
  }, [isOpen])

  const loadDropdownData = async () => {
    setLoading(true)
    try {
      const [clientsData, projectsData] = await Promise.all([
        getAllClients(),
        getAllProjects()
      ])
      setClients(clientsData)
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading dropdown data:', error)
      toast.error('Failed to load client and project data')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }
    if (!formData.author.trim()) {
      newErrors.author = "Author is required"
    }
    if (!formData.date) {
      newErrors.date = "Date is required"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const updatedProposal = await updateNotesKnowledge(proposal.id, {
        title: formData.title,
        clientId: formData.clientId,
        projectId: formData.projectId,
        author: formData.author,
        date: formData.date,
        type: formData.type,
        status: formData.status,
        content: formData.content
      })

      if (updatedProposal) {
        onUpdate(updatedProposal)
        toast.success('Proposal updated successfully')
        onClose()
      } else {
        toast.error('Failed to update proposal')
      }
    } catch (error) {
      console.error('Error updating proposal:', error)
      toast.error('Failed to update proposal')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: proposal.title,
      clientId: proposal.clientId,
      projectId: proposal.projectId,
      author: proposal.author,
      date: proposal.date,
      type: proposal.type,
      status: proposal.status,
      content: proposal.content || ""
    })
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Proposal</DialogTitle>
          <DialogDescription>
            Update the proposal details and link it to a client or project.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter proposal title"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Enter author name"
                className={errors.author ? "border-red-500" : ""}
              />
              {errors.author && <p className="text-sm text-red-500">{errors.author}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={errors.date ? "border-red-500" : ""}
              />
              {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: NotesKnowledge['type']) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Proposal">Proposal</SelectItem>
                  <SelectItem value="Meeting Notes">Meeting Notes</SelectItem>
                  <SelectItem value="Internal Playbook">Internal Playbook</SelectItem>
                  <SelectItem value="Research Notes">Research Notes</SelectItem>
                  <SelectItem value="Bug Report">Bug Report</SelectItem>
                  <SelectItem value="Feature Request">Feature Request</SelectItem>
                  <SelectItem value="Standup Notes">Standup Notes</SelectItem>
                  <SelectItem value="Documentation">Documentation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: NotesKnowledge['status']) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                  <SelectItem value="Template">Template</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Client</Label>
              <Select
                value={formData.clientId ? formData.clientId.toString() : ""}
                onValueChange={(value) => setFormData({ ...formData, clientId: value === "none" ? null : parseInt(value) || null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectId">Project</Label>
              <Select
                value={formData.projectId ? formData.projectId.toString() : ""}
                onValueChange={(value) => setFormData({ ...formData, projectId: value === "none" ? null : parseInt(value) || null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter proposal content"
              rows={6}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Proposal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
