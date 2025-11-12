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
import { getAllProjects } from "@/lib/projects"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Client, Project } from "@/lib/types"

interface AddNoteModalProps {
  isOpen: boolean
  onClose: () => void
  onAddNote: (note: NewNote) => void
  initialData?: Partial<NewNote>
  isEdit?: boolean
}

interface NewNote {
  title: string
  type: "Proposal" | "Meeting Notes" | "Internal Playbook" | "Research Notes" | "Bug Report" | "Feature Request" | "Standup Notes" | "Documentation" | "notion"
  status: "Draft" | "Published" | "Archived" | "Template" | "Open" | "Under Review"
  clientId: number | null
  projectId: number | null
  date: string
  author: string
  content: string
  notion_url?: string
}

export function AddNoteModal({ isOpen, onClose, onAddNote, initialData, isEdit = false }: AddNoteModalProps) {
  const { currentUser } = useCurrentUser()
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [notionPreview, setNotionPreview] = useState<string>("")
  
  const [formData, setFormData] = useState<NewNote>(() => {
    if (initialData && isEdit) {
      return {
        title: initialData.title || "",
        type: initialData.type || "Proposal",
        status: initialData.status || "Draft",
        clientId: initialData.clientId || null,
        projectId: initialData.projectId || null,
        date: initialData.date || "",
        author: initialData.author || currentUser?.name || "",
        content: initialData.content || "",
        notion_url: initialData.notion_url || "",
      }
    }
    return {
      title: "",
      type: "Proposal",
      status: "Draft",
      clientId: null,
      projectId: null,
      date: new Date().toISOString().split('T')[0],
      author: currentUser?.name || "",
      content: "",
      notion_url: "",
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Extract title from Notion URL
  const extractTitleFromNotionUrl = (url: string): string => {
    try {
      // Notion URLs have format: https://www.notion.so/Title-Name-{id}
      // Example: https://www.notion.so/Client-Proposal-Jazz-Diner-Website-Johnny-G-s-Restaurant-295a9768255a80ff9795dcaf40887794
      // The ID is a 32-character hex string at the end
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/').filter(Boolean)
      if (pathParts.length > 0) {
        // Get the last part which contains the title and ID
        const lastPart = pathParts[pathParts.length - 1]
        // The ID is typically 32 characters of hex (0-9a-f) at the end
        // Match pattern: title-with-dashes-{32-char-hex-id}
        const idMatch = lastPart.match(/-([0-9a-f]{32})$/i)
        if (idMatch) {
          // Remove the ID part (dash + 32 hex chars)
          const titlePart = lastPart.slice(0, idMatch.index)
          // Replace dashes with spaces and clean up
          return titlePart.replace(/-/g, ' ').trim()
        }
        // If no ID pattern found, just replace dashes with spaces
        return lastPart.replace(/-/g, ' ').trim()
      }
    } catch {
      // Invalid URL - ignore error
    }
    return ""
  }

  // Handle Notion URL change
  const handleNotionUrlChange = (url: string) => {
    setFormData(prev => {
      const updated = { ...prev, notion_url: url }
      // Extract title if title is empty
      if (!prev.title.trim() && url) {
        const extractedTitle = extractTitleFromNotionUrl(url)
        if (extractedTitle) {
          updated.title = extractedTitle
        }
      }
      return updated
    })

    // Fetch preview (simplified - just show URL info for now)
    if (url && url.includes('notion.so')) {
      const extractedTitle = extractTitleFromNotionUrl(url)
      setNotionPreview(extractedTitle || "Notion page detected")
    } else {
      setNotionPreview("")
    }
  }

  // Fetch clients and projects when modal opens
  useEffect(() => {
    if (isOpen) {
      getAllClients().then(setClients)
      getAllProjects().then(setProjects)
    }
  }, [isOpen])

  // Update author when currentUser is loaded
  useEffect(() => {
    if (currentUser && !isEdit) {
      setFormData(prev => ({ ...prev, author: currentUser.name }))
    }
  }, [currentUser, isEdit])

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        title: initialData.title || "",
        type: initialData.type || "Proposal",
        status: initialData.status || "Draft",
        clientId: initialData.clientId || null,
        projectId: initialData.projectId || null,
        date: initialData.date || "",
        author: initialData.author || currentUser?.name || "",
        content: initialData.content || "",
        notion_url: initialData.notion_url || "",
      })
      if (initialData.notion_url) {
        const extractedTitle = extractTitleFromNotionUrl(initialData.notion_url)
        setNotionPreview(extractedTitle || "Notion page")
      }
    } else if (!isEdit) {
      // Reset form data for new note
      setFormData({
        title: "",
        type: "Proposal",
        status: "Draft",
        clientId: null,
        projectId: null,
        date: new Date().toISOString().split('T')[0],
        author: currentUser?.name || "",
        content: "",
        notion_url: "",
      })
      setNotionPreview("")
    }
  }, [initialData, isEdit, currentUser])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    const isNotionType = formData.type === "notion"
    
    // Required fields
    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }
    if (!formData.type) {
      newErrors.type = "Type is required"
    }
    if (!formData.status) {
      newErrors.status = "Status is required"
    }
    
    // For notion type, date, author, and content are not required
    if (!isNotionType) {
      if (!formData.date) {
        newErrors.date = "Date is required"
      }
      if (!formData.author.trim()) {
        newErrors.author = "Author is required"
      }
    }
    
    // For notion type, notion_url is required
    if (isNotionType && !formData.notion_url?.trim()) {
      newErrors.notion_url = "Notion URL is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      // For notion type, set default values for date and author if empty
      const submitData: Partial<NewNote> = { ...formData }
      if (formData.type === "notion") {
        if (!submitData.date) {
          submitData.date = new Date().toISOString().split('T')[0]
        }
        if (!submitData.author) {
          submitData.author = currentUser?.name || ""
        }
        // Ensure notion_url is included for notion type
        if (!submitData.notion_url) {
          submitData.notion_url = formData.notion_url || ""
        }
      } else {
        // Remove notion_url for non-notion types to avoid sending empty string
        delete submitData.notion_url
      }
      
      console.log('Submitting note data:', submitData)
      onAddNote(submitData)
      setFormData({
        title: "",
        type: "Proposal",
        status: "Draft",
        clientId: null,
        projectId: null,
        date: new Date().toISOString().split('T')[0],
        author: currentUser?.name || "",
        content: "",
        notion_url: "",
      })
      setNotionPreview("")
      setErrors({})
      onClose()
    }
  }

  const handleClose = () => {
    setFormData({
        title: "",
        type: "Proposal",
        status: "Draft",
        clientId: null,
        projectId: null,
        date: new Date().toISOString().split('T')[0],
        author: currentUser?.name || "",
        content: "",
        notion_url: "",
    })
    setNotionPreview("")
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Note" : "Add New Note"}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Update note details including type, status, and content."
              : "Create a new note with type, status, and content."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter note title"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: NewNote['type']) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className={errors.type ? "border-red-500" : ""}>
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
                  <SelectItem value="notion">Notion</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: NewNote['status']) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className={errors.status ? "border-red-500" : ""}>
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
              {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select
                value={formData.clientId ? formData.clientId.toString() : "unassigned"}
                onValueChange={(value) => setFormData({ ...formData, clientId: value === "unassigned" ? null : parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={`client-${client.id}`} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={formData.projectId ? formData.projectId.toString() : "unassigned"}
                onValueChange={(value) => setFormData({ ...formData, projectId: value === "unassigned" ? null : parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={`project-${project.id}`} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.type !== "notion" && (
              <>
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
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    readOnly
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Auto-populated from logged in user</p>
                </div>
              </>
            )}

            {formData.type === "notion" && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notion_url">Notion URL *</Label>
                <Input
                  id="notion_url"
                  type="url"
                  value={formData.notion_url || ""}
                  onChange={(e) => handleNotionUrlChange(e.target.value)}
                  placeholder="https://www.notion.so/..."
                  className={errors.notion_url ? "border-red-500" : ""}
                />
                {errors.notion_url && <p className="text-sm text-red-500">{errors.notion_url}</p>}
                {notionPreview && (
                  <div className="mt-2 p-3 bg-muted rounded-md border">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Preview:</p>
                    <p className="text-sm">{notionPreview}</p>
                    <a 
                      href={formData.notion_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                    >
                      Open in Notion →
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {formData.type !== "notion" && (
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter note content"
                rows={8}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEdit ? "Update Note" : "Add Note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

