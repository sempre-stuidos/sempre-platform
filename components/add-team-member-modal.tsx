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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeamMember } from "@/lib/types"
import { updateTeamMember } from "@/lib/team"
import { type UserRole } from "@/lib/invitations"
import { toast } from "sonner"

interface AddTeamMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onAddTeamMember: () => void
  initialData?: TeamMember | null
  isEdit?: boolean
}

const AVAILABLE_ROLES: UserRole[] = ['Admin', 'Manager', 'Member', 'Developer', 'Designer']

export function AddTeamMemberModal({
  isOpen,
  onClose,
  onAddTeamMember,
  initialData,
  isEdit = false,
}: AddTeamMemberModalProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>("Member")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Populate form data when editing (for existing team members)
  useEffect(() => {
    if (initialData && isEdit) {
      setEmail(initialData.email || "")
      setRole((initialData.role as UserRole) || "Member")
    } else {
      // Reset form for new invitation
      setEmail("")
      setRole("Member")
    }
    setErrors({})
  }, [initialData, isEdit])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!role) {
      newErrors.role = "Role is required"
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
      if (isEdit && initialData) {
        // For editing existing team members, update their role
        await updateTeamMember(initialData.id, { role })
        toast.success("Team member updated successfully")
        onAddTeamMember()
        onClose()
      } else {
        // For new team members, send invitation via API route
        const response = await fetch('/api/invitations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            role,
          }),
        })

        const result = await response.json()
        
        if (result.success) {
          toast.success(`Invitation sent to ${email}`)
          onAddTeamMember()
          onClose()
        } else {
          toast.error(result.error || "Failed to send invitation")
        }
      }
    } catch (error: unknown) {
      console.error('Error sending invitation:', error)
      toast.error(error instanceof Error ? error.message : "Failed to send invitation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Team Member Role" : "Invite Team Member"}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Update the team member's role." 
              : "Send an invitation email to add a new team member. They will be able to sign in with Google OAuth."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) {
                  setErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors.email
                    return newErrors
                  })
                }
              }}
              className={errors.email ? "border-red-500" : ""}
              placeholder="Enter email address"
              disabled={isEdit}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={role}
              onValueChange={(value: UserRole) => {
                setRole(value)
                if (errors.role) {
                  setErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors.role
                    return newErrors
                  })
                }
              }}
            >
              <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading 
                ? (isEdit ? "Updating..." : "Sending...") 
                : (isEdit ? "Update Role" : "Send Invitation")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
