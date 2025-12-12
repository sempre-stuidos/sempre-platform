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
import { IconEdit, IconTrash, IconPlus } from "@tabler/icons-react"
import Image from "next/image"
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
        <div>
          <h2 className="text-2xl font-bold">Bands</h2>
          <p className="text-muted-foreground mt-1">
            Manage bands that perform at your events
          </p>
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
                <TableRow key={band.id}>
                  <TableCell>
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
                    {band.description || <span className="italic">No description</span>}
                  </TableCell>
                  <TableCell className="text-right">
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
    </div>
  )
}
