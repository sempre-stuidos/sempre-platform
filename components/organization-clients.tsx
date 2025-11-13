"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconPlus, IconLink, IconUnlink, IconBuilding } from "@tabler/icons-react"
import { LinkClientModal } from "@/components/link-client-modal"
import { toast } from "sonner"
import Link from "next/link"

interface OrganizationClientsProps {
  orgId: string
  canManage: boolean
}

interface Client {
  id: number
  name: string
  business_type: string
  status: string
  contact_email: string
}

export function OrganizationClients({ orgId, canManage }: OrganizationClientsProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showLinkModal, setShowLinkModal] = useState(false)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        // Get all clients linked to this organization
        const response = await fetch(`/api/organizations/${orgId}/clients`)
        if (!response.ok) {
          throw new Error('Failed to fetch clients')
        }
        const { clients: clientsData } = await response.json()
        setClients(clientsData || [])
      } catch (error) {
        console.error('Error fetching clients:', error)
        toast.error('Failed to load clients')
      } finally {
        setIsLoading(false)
      }
    }

    fetchClients()
  }, [orgId])

  const handleUnlink = async (clientId: number) => {
    if (!confirm('Are you sure you want to unlink this client from the organization?')) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}/organization`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to unlink client')
      }

      setClients(clients.filter(c => c.id !== clientId))
      toast.success('Client unlinked successfully')
    } catch (error) {
      console.error('Error unlinking client:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to unlink client')
    }
  }

  const handleLinkSuccess = () => {
    setShowLinkModal(false)
    // Refresh the list
    const fetchClients = async () => {
      try {
        const response = await fetch(`/api/organizations/${orgId}/clients`)
        if (response.ok) {
          const { clients: clientsData } = await response.json()
          setClients(clientsData || [])
        }
      } catch (error) {
        console.error('Error refreshing clients:', error)
      }
    }
    fetchClients()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading clients...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => setShowLinkModal(true)}>
            <IconPlus className="mr-2 h-4 w-4" />
            Link Client
          </Button>
        </div>
      )}

      {clients.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Clients Linked</CardTitle>
            <CardDescription>
              {canManage 
                ? "Link clients to this organization to enable client dashboard access."
                : "No clients are linked to this organization."}
            </CardDescription>
          </CardHeader>
          {canManage && (
            <CardContent>
              <Button onClick={() => setShowLinkModal(true)}>
                <IconLink className="mr-2 h-4 w-4" />
                Link a Client
              </Button>
            </CardContent>
          )}
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Business Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <Link href={`/clients/${client.id}`} className="hover:underline">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>{client.business_type}</TableCell>
                  <TableCell>
                    <Badge variant={client.status === 'Active' ? 'default' : 'secondary'}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{client.contact_email}</TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUnlink(client.id)}
                      >
                        <IconUnlink className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <LinkClientModal
        open={showLinkModal}
        onOpenChange={setShowLinkModal}
        orgId={orgId}
        onSuccess={handleLinkSuccess}
      />
    </div>
  )
}

