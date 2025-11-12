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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type UserRole } from "@/lib/invitations"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AddExistingUserModalProps {
  isOpen: boolean
  onClose: () => void
  onAddUser: () => void
}

interface AvailableUser {
  id: string
  email: string
  name: string
  avatar: string
}

const AVAILABLE_ROLES: UserRole[] = ['Admin', 'Manager', 'Member', 'Developer', 'Designer', 'Client']

export function AddExistingUserModal({
  isOpen,
  onClose,
  onAddUser,
}: AddExistingUserModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [role, setRole] = useState<UserRole>("Member")
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingUsers, setFetchingUsers] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch available users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers()
    } else {
      // Reset form when modal closes
      setSelectedUserId("")
      setRole("Member")
      setErrors({})
    }
  }, [isOpen])

  const fetchAvailableUsers = async () => {
    setFetchingUsers(true)
    try {
      const response = await fetch('/api/users/available')
      const result = await response.json()

      if (result.success) {
        setAvailableUsers(result.users || [])
      } else {
        toast.error(result.error || "Failed to fetch available users")
      }
    } catch (error) {
      console.error('Error fetching available users:', error)
      toast.error("Failed to fetch available users")
    } finally {
      setFetchingUsers(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedUserId) {
      newErrors.user = "Please select a user"
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
      const response = await fetch('/api/users/add-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          role,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        const selectedUser = availableUsers.find(u => u.id === selectedUserId)
        toast.success(`${selectedUser?.name || 'User'} added to team with role ${role}`)
        onAddUser()
        onClose()
      } else {
        toast.error(result.error || "Failed to add user to team")
      }
    } catch (error: unknown) {
      console.error('Error adding user to team:', error)
      toast.error(error instanceof Error ? error.message : "Failed to add user to team")
    } finally {
      setLoading(false)
    }
  }

  const selectedUser = availableUsers.find(u => u.id === selectedUserId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Select an existing user from your authentication system and assign them a role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user">User *</Label>
            <Select
              value={selectedUserId}
              onValueChange={(value) => {
                setSelectedUserId(value)
                if (errors.user) {
                  setErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors.user
                    return newErrors
                  })
                }
              }}
              disabled={fetchingUsers}
            >
              <SelectTrigger className={`w-full ${errors.user ? "border-red-500" : ""}`}>
                <SelectValue placeholder={fetchingUsers ? "Loading users..." : "Select a user"}>
                  {selectedUser ? `${selectedUser.name} (${selectedUser.email})` : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableUsers.length === 0 && !fetchingUsers ? (
                  <SelectItem value="no-users" disabled>
                    No available users
                  </SelectItem>
                ) : (
                  availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.user && (
              <p className="text-sm text-red-500">{errors.user}</p>
            )}
            {selectedUser && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                  <AvatarFallback>
                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{selectedUser.name}</span>
                  <span className="text-xs text-muted-foreground">{selectedUser.email}</span>
                </div>
              </div>
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
              <SelectTrigger className={`w-full ${errors.role ? "border-red-500" : ""}`}>
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
            <Button type="submit" disabled={loading || fetchingUsers || availableUsers.length === 0}>
              {loading ? "Adding..." : "Add to Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

