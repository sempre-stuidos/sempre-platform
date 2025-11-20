"use client"

import { useState } from "react"
import * as React from "react"
import { useRouter } from "next/navigation"
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
import { IconPlus, IconBuilding, IconEdit, IconTrash } from "@tabler/icons-react"
import { AddOrganizationModal } from "@/components/add-organization-modal"
import { EditOrganizationModal } from "@/components/edit-organization-modal"
import { toast } from "sonner"
import { OrganizationWithMembership, type Organization } from "@/lib/organizations"

interface OrganizationsDataTableProps {
  data: OrganizationWithMembership[]
  isAdmin?: boolean
}

export function OrganizationsDataTable({ data: initialData, isAdmin = false }: OrganizationsDataTableProps) {
  const router = useRouter()
  const [organizations, setOrganizations] = useState(initialData)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationWithMembership | null>(null)

  // Update state when initialData changes (e.g., after page refresh)
  React.useEffect(() => {
    setOrganizations(initialData)
  }, [initialData])

  const handleCreateSuccess = () => {
    // Refresh the page to get updated data
    window.location.reload()
  }

  const handleEditSuccess = (organization: Organization) => {
    // Update the organization in the list
    setOrganizations((current) =>
      current.map((org) =>
        org.id === organization.id ? { ...org, ...organization } : org
      )
    )
    setShowEditModal(false)
    setSelectedOrganization(null)
  }

  const handleEditClick = (org: OrganizationWithMembership, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedOrganization(org)
    setShowEditModal(true)
  }

  const handleDelete = async (orgId: string) => {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete organization')
      }

      setOrganizations(organizations.filter(org => org.id !== orgId))
      toast.success('Organization deleted successfully')
    } catch (error) {
      console.error('Error deleting organization:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete organization')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground mt-2">
            Manage organizations and their members
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreateModal(true)}>
            <IconPlus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        )}
      </div>

      <div className="px-4 lg:px-6">
        {organizations.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Organizations</CardTitle>
              <CardDescription>
                Create your first organization to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAdmin && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Create Organization
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow 
                    key={org.id} 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => router.push(`/organizations/${org.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <IconBuilding className="h-4 w-4 text-muted-foreground" />
                        {org.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{org.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={org.status === 'active' ? 'default' : org.status === 'inactive' ? 'secondary' : 'destructive'}>
                        {org.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {org.email || '-'}
                    </TableCell>
                    <TableCell>
                      {org.phone || '-'}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {org.description || '-'}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleEditClick(org, e)}
                            >
                              <IconEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(org.id);
                              }}
                            >
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        {!isAdmin && org.role && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleEditClick(org, e)}
                          >
                            <IconEdit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AddOrganizationModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleCreateSuccess}
      />
      <EditOrganizationModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        organization={selectedOrganization}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}

