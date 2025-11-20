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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface EditMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  member: {
    user_id: string
    role: 'owner' | 'admin' | 'staff' | 'client'
    email?: string
    profile?: {
      full_name?: string
    }
  } | null
  onSuccess?: () => void
}

export function EditMemberModal({ open, onOpenChange, orgId, member, onSuccess }: EditMemberModalProps) {
  const [role, setRole] = useState<"owner" | "admin" | "staff" | "client">("staff")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (member) {
      setRole(member.role)
    }
  }, [member])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!member) {
      toast.error("Member information is missing")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/businesses/${orgId}/members/${member.user_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        const errorMessage = error.error || "Failed to update member"
        throw new Error(errorMessage)
      }

      toast.success("Member updated successfully")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error updating member:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update member")
    } finally {
      setIsLoading(false)
    }
  }

  if (!member) return null

  const memberName = member.profile?.full_name || member.email || 'Unknown User'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
          <DialogDescription>
            Update the role for {memberName} in this organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={role} onValueChange={(value) => setRole(value as typeof role)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

