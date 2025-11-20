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
import { AddBusinessModal } from "@/components/add-business-modal"
import { IconPlus, IconBuilding } from "@tabler/icons-react"
import { toast } from "sonner"

interface Business {
  id: string
  name: string
  type: "agency" | "client"
  description?: string | null
}

interface BusinessSelectorProps {
  value?: string
  onValueChange: (orgId: string) => void
  clientId?: number
  onLinkSuccess?: () => void
}

export function BusinessSelector({
  value,
  onValueChange,
  clientId,
  onLinkSuccess,
}: BusinessSelectorProps) {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const response = await fetch("/api/businesses")
        if (!response.ok) {
          throw new Error("Failed to fetch businesses")
        }
        const { businesses: orgs } = await response.json()
        setBusinesses(orgs)
      } catch (error) {
        console.error("Error fetching businesses:", error)
        toast.error("Failed to load businesses")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, [])

  const handleLinkBusiness = async (orgId: string) => {
    if (!clientId) {
      toast.error("Client ID is required")
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}/business`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orgId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to link business")
      }

      toast.success("Business linked successfully")
      onValueChange(orgId)
      onLinkSuccess?.()
    } catch (error) {
      console.error("Error linking business:", error)
      toast.error(error instanceof Error ? error.message : "Failed to link business")
    }
  }

  const handleCreateSuccess = async (business: Business) => {
    setBusinesses([...businesses, business])
    if (clientId) {
      await handleLinkBusiness(business.id)
    } else {
      onValueChange(business.id)
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading businesses...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an business" />
          </SelectTrigger>
          <SelectContent>
            {businesses.map((org) => (
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
          onClick={() => handleLinkBusiness(value)}
          className="w-full"
        >
          Link to Client
        </Button>
      )}
      <AddBusinessModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}

