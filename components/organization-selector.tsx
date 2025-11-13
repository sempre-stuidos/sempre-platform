"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AddOrganizationModal } from "@/components/add-organization-modal"
import { IconPlus, IconBuilding } from "@tabler/icons-react"
import { toast } from "sonner"

interface Organization {
  id: string
  name: string
  type: "agency" | "client"
  description?: string
}

interface OrganizationSelectorProps {
  value?: string
  onValueChange: (orgId: string) => void
  clientId?: number
  onLinkSuccess?: () => void
}

export function OrganizationSelector({
  value,
  onValueChange,
  clientId,
  onLinkSuccess,
}: OrganizationSelectorProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch("/api/organizations")
        if (!response.ok) {
          throw new Error("Failed to fetch organizations")
        }
        const { organizations: orgs } = await response.json()
        setOrganizations(orgs)
      } catch (error) {
        console.error("Error fetching organizations:", error)
        toast.error("Failed to load organizations")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganizations()
  }, [])

  const handleLinkOrganization = async (orgId: string) => {
    if (!clientId) {
      toast.error("Client ID is required")
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}/organization`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orgId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to link organization")
      }

      toast.success("Organization linked successfully")
      onValueChange(orgId)
      onLinkSuccess?.()
    } catch (error) {
      console.error("Error linking organization:", error)
      toast.error(error instanceof Error ? error.message : "Failed to link organization")
    }
  }

  const handleCreateSuccess = async (organization: Organization) => {
    setOrganizations([...organizations, organization])
    if (clientId) {
      await handleLinkOrganization(organization.id)
    } else {
      onValueChange(organization.id)
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading organizations...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                <div className="flex items-center gap-2">
                  <IconBuilding className="h-4 w-4" />
                  <span>{org.name}</span>
                  <span className="text-xs text-muted-foreground">({org.type})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowCreateModal(true)}
        >
          <IconPlus className="h-4 w-4" />
        </Button>
      </div>
      {clientId && value && (
        <Button
          type="button"
          onClick={() => handleLinkOrganization(value)}
          className="w-full"
        >
          Link to Client
        </Button>
      )}
      <AddOrganizationModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}

