"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BusinessSelector } from "@/components/business-selector"
import { IconBuilding, IconLink, IconUnlink } from "@tabler/icons-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface ClientBusinessProps {
  clientId: number
}

interface Business {
  id: string
  name: string
  type: "agency" | "client"
  description?: string
}

export function ClientBusiness({ clientId }: ClientBusinessProps) {
  const [business, setBusiness] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrgId, setSelectedOrgId] = useState<string>("")

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const response = await fetch(`/api/clients/${clientId}/business`)
        if (!response.ok) {
          if (response.status === 404) {
            setBusiness(null)
            return
          }
          throw new Error("Failed to fetch business")
        }
        const { business: org } = await response.json()
        setBusiness(org)
        if (org) {
          setSelectedOrgId(org.id)
        }
      } catch (error) {
        console.error("Error fetching business:", error)
        toast.error("Failed to load business")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusiness()
  }, [clientId])

  const handleUnlink = async () => {
    if (!confirm("Are you sure you want to unlink this business from the client?")) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}/business`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to unlink business")
      }

      setBusiness(null)
      setSelectedOrgId("")
      toast.success("Business unlinked successfully")
    } catch (error) {
      console.error("Error unlinking business:", error)
      toast.error(error instanceof Error ? error.message : "Failed to unlink business")
    }
  }

  const handleLinkSuccess = async () => {
    // Refresh business data
    const response = await fetch(`/api/clients/${clientId}/business`)
    if (response.ok) {
      const { business: org } = await response.json()
      setBusiness(org)
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
          <CardTitle>Business</CardTitle>
          <CardDescription>
            Link this client to an business to enable client dashboard access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {business ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <IconBuilding className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-semibold">{business.name}</div>
                    {business.description && (
                      <div className="text-sm text-muted-foreground">{business.description}</div>
                    )}
                    <div className="mt-1">
                      <Badge variant="outline">{business.type}</Badge>
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
                This client is not linked to any business. Select or create an business to link it.
              </div>
              <BusinessSelector
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

