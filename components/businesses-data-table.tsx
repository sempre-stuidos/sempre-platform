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
import { AddBusinessModal } from "@/components/add-business-modal"
import { EditBusinessModal } from "@/components/edit-business-modal"
import { toast } from "sonner"
import { BusinessWithMembership, type Business } from "@/lib/businesses"

interface BusinessesDataTableProps {
  data: BusinessWithMembership[]
  isAdmin?: boolean
}

export function BusinessesDataTable({ data: initialData, isAdmin = false }: BusinessesDataTableProps) {
  const router = useRouter()
  const [businesses, setBusinesses] = useState(initialData)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessWithMembership | null>(null)

  // Update state when initialData changes (e.g., after page refresh)
  React.useEffect(() => {
    setBusinesses(initialData)
  }, [initialData])

  const handleCreateSuccess = () => {
    // Refresh the page to get updated data
    window.location.reload()
  }

  const handleEditSuccess = (business: Business) => {
    // Update the business in the list
    setBusinesses((current) =>
      current.map((org) =>
        org.id === business.id ? { ...org, ...business } : org
      )
    )
    setShowEditModal(false)
    setSelectedBusiness(null)
  }

  const handleEditClick = (org: BusinessWithMembership, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedBusiness(org)
    setShowEditModal(true)
  }

  const handleDelete = async (orgId: string) => {
    if (!confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/businesses/${orgId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete business')
      }

      setBusinesses(businesses.filter(org => org.id !== orgId))
      toast.success('Business deleted successfully')
    } catch (error) {
      console.error('Error deleting business:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete business')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
          <p className="text-muted-foreground mt-2">
            Manage businesses and their members
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreateModal(true)}>
            <IconPlus className="mr-2 h-4 w-4" />
            Create Business
          </Button>
        )}
      </div>

      <div className="px-4 lg:px-6">
        {businesses.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Businesses</CardTitle>
              <CardDescription>
                Create your first business to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAdmin && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Create Business
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
                {businesses.map((org) => (
                  <TableRow 
                    key={org.id} 
                    className="cursor-pointer hover:bg-muted/50" 
                    onClick={() => router.push(`/businesses/${org.id}`)}
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

      <AddBusinessModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleCreateSuccess}
      />
      <EditBusinessModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        business={selectedBusiness}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}

