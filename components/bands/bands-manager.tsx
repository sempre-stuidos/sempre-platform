"use client"

import { useState, useEffect } from "react"
import { Band } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconEdit, IconTrash, IconPlus, IconArrowLeft } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { BandFormModal } from "./band-form-modal"

interface BandsManagerProps {
  orgId: string
}

export function BandsManager({ orgId }: BandsManagerProps) {
  const [bands, setBands] = useState<Band[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [editingBand, setEditingBand] = useState<Band | null>(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedBand, setSelectedBand] = useState<Band | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const DESCRIPTION_LIMIT = 100

  const fetchBands = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/businesses/${orgId}/bands`)
      if (response.ok) {
        const data = await response.json()
        setBands(data.bands || [])
      } else {
        throw new Error('Failed to fetch bands')
      }
    } catch (error) {
      console.error('Error fetching bands:', error)
      toast.error('Failed to load bands')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (orgId) {
      fetchBands()
    }
  }, [orgId])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this band?')) {
      return
    }

    setIsDeleting(id)
    try {
      const response = await fetch(`/api/businesses/${orgId}/bands/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete band')
      }

      setBands(bands.filter(band => band.id !== id))
      toast.success('Band deleted successfully')
    } catch (error) {
      console.error('Error deleting band:', error)
      toast.error('Failed to delete band')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleEdit = (band: Band) => {
    setEditingBand(band)
    setShowFormModal(true)
  }

  const handleCreate = () => {
    setEditingBand(null)
    setShowFormModal(true)
  }

  const handleFormSuccess = () => {
    setShowFormModal(false)
    setEditingBand(null)
    fetchBands()
  }

  const handleRowClick = (band: Band) => {
    setSelectedBand(band)
    setShowDetailsModal(true)
  }

  const truncateDescription = (description: string | undefined | null): string => {
    if (!description) return ""
    if (description.length <= DESCRIPTION_LIMIT) return description
    return description.substring(0, DESCRIPTION_LIMIT) + "..."
  }

  if (isLoading) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">Loading bands...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/client/${orgId}/events`}>
            <Button variant="ghost" size="sm">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">Bands</h2>
            <p className="text-muted-foreground mt-1">
              Manage bands that perform at your events
            </p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <IconPlus className="mr-2 h-4 w-4" />
          Add Band
        </Button>
      </div>

      {bands.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No bands yet</CardTitle>
          </CardHeader>
          <div className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Get started by adding your first band.
            </p>
            <Button onClick={handleCreate}>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Your First Band
            </Button>
          </div>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bands.map((band) => (
                <TableRow 
                  key={band.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(band)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {band.image_url ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-md">
                        <Image
                          src={band.image_url}
                          alt={band.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">No image</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{band.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {band.description ? (
                      truncateDescription(band.description)
                    ) : (
                      <span className="italic">No description</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(band)}
                      >
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(band.id)}
                        disabled={isDeleting === band.id}
                      >
                        <IconTrash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showFormModal && (
        <BandFormModal
          orgId={orgId}
          band={editingBand}
          open={showFormModal}
          onOpenChange={setShowFormModal}
          onSuccess={handleFormSuccess}
        />
      )}

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedBand?.name}</DialogTitle>
            <DialogDescription>Band Details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBand?.image_url && (
              <div className="relative h-64 w-full overflow-hidden rounded-md">
                <Image
                  src={selectedBand.image_url}
                  alt={selectedBand.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">
                {selectedBand?.description || (
                  <span className="italic">No description provided</span>
                )}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false)
                  if (selectedBand) {
                    handleEdit(selectedBand)
                  }
                }}
              >
                <IconEdit className="mr-2 h-4 w-4" />
                Edit Band
              </Button>
              <Button onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
