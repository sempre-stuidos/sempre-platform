"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OrganizationSelector } from "@/components/organization-selector"
import { IconBuilding, IconLink, IconUnlink } from "@tabler/icons-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface ClientOrganizationProps {
  clientId: number
}

interface Organization {
  id: string
  name: string
  type: "agency" | "client"
  description?: string
}

export function ClientOrganization({ clientId }: ClientOrganizationProps) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrgId, setSelectedOrgId] = useState<string>("")

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch(`/api/clients/${clientId}/organization`)
        if (!response.ok) {
          if (response.status === 404) {
            setOrganization(null)
            return
          }
          throw new Error("Failed to fetch organization")
        }
        const { organization: org } = await response.json()
        setOrganization(org)
        if (org) {
          setSelectedOrgId(org.id)
        }
      } catch (error) {
        console.error("Error fetching organization:", error)
        toast.error("Failed to load organization")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganization()
  }, [clientId])

  const handleUnlink = async () => {
    if (!confirm("Are you sure you want to unlink this organization from the client?")) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}/organization`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to unlink organization")
      }

      setOrganization(null)
      setSelectedOrgId("")
      toast.success("Organization unlinked successfully")
    } catch (error) {
      console.error("Error unlinking organization:", error)
      toast.error(error instanceof Error ? error.message : "Failed to unlink organization")
    }
  }

  const handleLinkSuccess = async () => {
    // Refresh organization data
    const response = await fetch(`/api/clients/${clientId}/organization`)
    if (response.ok) {
      const { organization: org } = await response.json()
      setOrganization(org)
      if (org) {
        setSelectedOrgId(org.id)
      }
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>
            Link this client to an organization to enable client dashboard access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {organization ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <IconBuilding className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-semibold">{organization.name}</div>
                    {organization.description && (
                      <div className="text-sm text-muted-foreground">{organization.description}</div>
                    )}
                    <div className="mt-1">
                      <Badge variant="outline">{organization.type}</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="outline" onClick={handleUnlink}>
                  <IconUnlink className="mr-2 h-4 w-4" />
                  Unlink
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                This client is not linked to any organization. Select or create an organization to link it.
              </div>
              <OrganizationSelector
                value={selectedOrgId}
                onValueChange={setSelectedOrgId}
                clientId={clientId}
                onLinkSuccess={handleLinkSuccess}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

