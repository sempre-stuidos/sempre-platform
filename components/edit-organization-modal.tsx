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
import { toast } from "sonner"
import { Organization } from "@/lib/organizations"

interface EditOrganizationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization: Organization | null
  onSuccess?: (organization: Organization) => void
}

export function EditOrganizationModal({ 
  open, 
  onOpenChange, 
  organization,
  onSuccess 
}: EditOrganizationModalProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState<"agency" | "client">("client")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Update form when organization changes
  useEffect(() => {
    if (organization) {
      setName(organization.name || "")
      setType(organization.type || "client")
      setDescription(organization.description || "")
    }
  }, [organization])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!organization) return

    if (!name.trim()) {
      toast.error("Organization name is required")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update organization")
      }

      const { organization: updatedOrg } = await response.json()
      toast.success("Organization updated successfully")
      onOpenChange(false)
      onSuccess?.(updatedOrg)
    } catch (error) {
      console.error("Error updating organization:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update organization")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
          <DialogDescription>
            Update the organization details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Restaurant Name, Hotel Name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-type">Type *</Label>
              <Select 
                value={type} 
                onValueChange={(value) => setType(value as "agency" | "client")}
                disabled
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Organization type cannot be changed after creation.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Organization"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

