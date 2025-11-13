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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { IconBuilding } from "@tabler/icons-react"

interface LinkClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  onSuccess?: () => void
}

interface Client {
  id: number
  name: string
  business_type: string
  organization_id: string | null
}

export function LinkClientModal({ open, onOpenChange, orgId, onSuccess }: LinkClientModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  useEffect(() => {
    if (open) {
      fetchAvailableClients()
    }
  }, [open, orgId])

  const fetchAvailableClients = async () => {
    setIsFetching(true)
    try {
      const response = await fetch('/api/clients')
      if (!response.ok) {
        throw new Error('Failed to fetch clients')
      }
      const { clients: clientsData } = await response.json()
      // Filter out clients already linked to this org or another org
      const available = clientsData.filter((c: Client) => 
        !c.organization_id || c.organization_id === orgId
      )
      setClients(available)
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setIsFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClientId) {
      toast.error("Please select a client")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/clients/${selectedClientId}/organization`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orgId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to link client")
      }

      toast.success("Client linked successfully")
      setSelectedClientId("")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error linking client:", error)
      toast.error(error instanceof Error ? error.message : "Failed to link client")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Client to Organization</DialogTitle>
          <DialogDescription>
            Link an existing client to this organization. This will enable the client to access their dashboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client">Client *</Label>
              {isFetching ? (
                <div className="text-sm text-muted-foreground">Loading clients...</div>
              ) : clients.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No available clients. All clients are already linked to organizations.
                </div>
              ) : (
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        <div className="flex items-center gap-2">
                          <IconBuilding className="h-4 w-4" />
                          <span>{client.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({client.business_type})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedClientId || clients.length === 0}>
              {isLoading ? "Linking..." : "Link Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

