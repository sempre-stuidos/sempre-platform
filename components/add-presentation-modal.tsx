"use client"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Presentation } from "@/lib/types"
import { toast } from "sonner"
import { createPresentation, updatePresentation } from "@/lib/presentations"

interface AddPresentationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  presentation?: Presentation | null
  clients: { id: number; name: string }[]
  teamMembers: { id: number; name: string; isCurrentUser?: boolean }[]
}

export function AddPresentationModal({
  isOpen,
  onClose,
  onSuccess,
  presentation,
  clients,
  teamMembers,
}: AddPresentationModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    clientId: "",
    type: "",
    status: "",
    link: "",
    description: "",
    ownerId: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const isEdit = !!presentation

  useEffect(() => {
    if (presentation) {
      setFormData({
        title: presentation.title,
        clientId: presentation.clientId.toString(),
        type: presentation.type,
        status: presentation.status,
        link: presentation.link,
        description: presentation.description || "",
        ownerId: presentation.ownerId.toString(),
      })
    } else {
      // Set current user as default owner for new presentations
      const currentUserOwner = teamMembers.find(member => member.isCurrentUser)
      setFormData({
        title: "",
        clientId: "",
        type: "",
        status: "",
        link: "",
        description: "",
        ownerId: currentUserOwner?.id.toString() || "",
      })
    }
  }, [presentation, isOpen, teamMembers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const presentationData = {
        title: formData.title,
        client_id: parseInt(formData.clientId),
        type: formData.type as Presentation['type'],
        status: formData.status as Presentation['status'],
        link: formData.link,
        description: formData.description || null,
        owner_id: parseInt(formData.ownerId),
        created_date: new Date().toISOString().split('T')[0],
        last_modified: new Date().toISOString().split('T')[0],
      }

      if (isEdit && presentation) {
        await updatePresentation(presentation.id, presentationData)
        toast.success("Presentation updated successfully")
      } else {
        await createPresentation(presentationData)
        toast.success("Presentation created successfully")
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving presentation:", error)
      toast.error("Failed to save presentation")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Presentation" : "Create New Presentation"}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Update the presentation details below."
              : "Fill in the details to create a new presentation."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Infinity Property Management – Landing Page Proposal"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId">Client *</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => handleInputChange("clientId", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange("type", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Proposal">Proposal</SelectItem>
                  <SelectItem value="Onboarding">Onboarding</SelectItem>
                  <SelectItem value="Progress Update">Progress Update</SelectItem>
                  <SelectItem value="Report">Report</SelectItem>
                  <SelectItem value="Case Study">Case Study</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Sent">Sent</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Link *</Label>
            <Input
              id="link"
              value={formData.link}
              onChange={(e) => handleInputChange("link", e.target.value)}
              placeholder="https://gamma.app/p/your-presentation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerId">Owner *</Label>
            <Select
              value={formData.ownerId}
              onValueChange={(value) => handleInputChange("ownerId", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem 
                    key={member.id} 
                    value={member.id.toString()}
                    className={member.isCurrentUser ? "font-semibold bg-muted" : ""}
                  >
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Add notes about this presentation (e.g., 'Client asked to update timeline section')"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
