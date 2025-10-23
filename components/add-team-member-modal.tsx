"use client"

import { useState, useEffect } from "react"
import { IconX } from "@tabler/icons-react"
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
import { createTeamMember, updateTeamMember } from "@/lib/team"
import { toast } from "sonner"

interface NewTeamMember {
  name: string
  role: string
  status: 'Active' | 'Contractor' | 'Past Collaborator'
  email: string
  timezone: string
  avatar?: string
  currentProjects?: number
  activeTasks?: number
  workload?: number
}

interface AddTeamMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onAddTeamMember: (teamMemberData: NewTeamMember) => void
  initialData?: TeamMember | null
  isEdit?: boolean
}

export function AddTeamMemberModal({
  isOpen,
  onClose,
  onAddTeamMember,
  initialData,
  isEdit = false,
}: AddTeamMemberModalProps) {
  const [formData, setFormData] = useState<NewTeamMember>({
    name: "",
    role: "",
    status: "Active",
    email: "",
    timezone: "",
    avatar: "",
    currentProjects: 0,
    activeTasks: 0,
    workload: 0,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Populate form data when editing
  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        name: initialData.name || "",
        role: initialData.role || "",
        status: initialData.status || "Active",
        email: initialData.email || "",
        timezone: initialData.timezone || "",
        avatar: initialData.avatar || "",
        currentProjects: initialData.currentProjects || 0,
        activeTasks: initialData.activeTasks || 0,
        workload: initialData.workload || 0,
      })
    } else {
      // Reset form for new team member
      setFormData({
        name: "",
        role: "",
        status: "Active",
        email: "",
        timezone: "",
        avatar: "",
        currentProjects: 0,
        activeTasks: 0,
        workload: 0,
      })
    }
    setErrors({})
  }, [initialData, isEdit])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }
    if (!formData.role.trim()) {
      newErrors.role = "Role is required"
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    if (!formData.timezone.trim()) {
      newErrors.timezone = "Timezone is required"
    }

    // Validate workload (0-100)
    if (formData.workload !== undefined && (formData.workload < 0 || formData.workload > 100)) {
      newErrors.workload = "Workload must be between 0 and 100"
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
        await updateTeamMember(initialData.id, formData)
        toast.success("Team member updated successfully")
      } else {
        await createTeamMember(formData)
        toast.success("Team member added successfully")
      }
      
      onAddTeamMember(formData)
      onClose()
    } catch (error: unknown) {
      console.error('Error saving team member:', error)
      toast.error(error instanceof Error ? error.message : "Failed to save team member")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof NewTeamMember, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Team Member" : "Add Team Member"}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Update the team member information below." 
              : "Add a new team member to your organization."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={errors.name ? "border-red-500" : ""}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                className={errors.role ? "border-red-500" : ""}
                placeholder="e.g., Developer, Designer"
              />
              {errors.role && (
                <p className="text-sm text-red-500">{errors.role}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "border-red-500" : ""}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'Active' | 'Contractor' | 'Past Collaborator') => handleInputChange("status", value)}
              >
                <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Contractor">Contractor</SelectItem>
                  <SelectItem value="Past Collaborator">Past Collaborator</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone *</Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) => handleInputChange("timezone", e.target.value)}
                className={errors.timezone ? "border-red-500" : ""}
                placeholder="e.g., UTC-5, PST"
              />
              {errors.timezone && (
                <p className="text-sm text-red-500">{errors.timezone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input
                id="avatar"
                value={formData.avatar}
                onChange={(e) => handleInputChange("avatar", e.target.value)}
                placeholder="Enter avatar URL"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentProjects">Current Projects</Label>
              <Input
                id="currentProjects"
                type="number"
                min="0"
                value={formData.currentProjects}
                onChange={(e) => handleInputChange("currentProjects", parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activeTasks">Active Tasks</Label>
              <Input
                id="activeTasks"
                type="number"
                min="0"
                value={formData.activeTasks}
                onChange={(e) => handleInputChange("activeTasks", parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workload">Workload (%)</Label>
              <Input
                id="workload"
                type="number"
                min="0"
                max="100"
                value={formData.workload}
                onChange={(e) => handleInputChange("workload", parseInt(e.target.value) || 0)}
                className={errors.workload ? "border-red-500" : ""}
                placeholder="0"
              />
              {errors.workload && (
                <p className="text-sm text-red-500">{errors.workload}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update Team Member" : "Add Team Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
