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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface AddMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  onSuccess?: () => void
}

interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

export function AddMemberModal({ open, onOpenChange, orgId, onSuccess }: AddMemberModalProps) {
  const [userId, setUserId] = useState("")
  const [role, setRole] = useState<"owner" | "admin" | "staff">("staff")
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Fetch available users when modal opens
  useEffect(() => {
    if (open) {
      fetchAvailableUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orgId])

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await fetch(`/api/users/available?orgId=${orgId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const { users: usersData } = await response.json()
      setUsers(usersData || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId.trim()) {
      toast.error("Please select a user")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/organizations/${orgId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId.trim(),
          role,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        const errorMessage = error.error || "Failed to add member"
        throw new Error(errorMessage)
      }

      toast.success("Member added successfully")
      setUserId("")
      setRole("staff")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error adding member:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add member")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>
            Add a user to this organization. They will be able to access the organization dashboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user">User *</Label>
              <Select 
                value={userId} 
                onValueChange={setUserId}
                disabled={loadingUsers}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select a user"} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        {user.name} ({user.email})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a user from the system to add to this organization.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={role} onValueChange={(value) => setRole(value as typeof role)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              {isLoading ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

