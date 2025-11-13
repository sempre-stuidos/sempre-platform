"use client"

import { useState, useEffect } from "react"
import { GalleryImage } from "@/lib/types"
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
import { IconEdit, IconTrash } from "@tabler/icons-react"
import Image from "next/image"
import { toast } from "sonner"

interface GalleryImagesTableProps {
  orgId: string
  clientId: number
  initialImages: GalleryImage[]
  viewMode?: 'table' | 'cards'
  onViewModeChange?: (mode: 'table' | 'cards') => void
}

export function GalleryImagesTable({ orgId, clientId, initialImages, viewMode: externalViewMode, onViewModeChange }: GalleryImagesTableProps) {
  const [images, setImages] = useState(initialImages)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [internalViewMode, setInternalViewMode] = useState<'table' | 'cards'>('table')
  const viewMode = externalViewMode ?? internalViewMode
  const setViewMode = onViewModeChange ?? setInternalViewMode

  const fetchImages = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/organizations/${orgId}/gallery-images`)
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
      }
    } catch (error) {
      console.error('Error fetching images:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Refetch images when component mounts or when initialImages change
  useEffect(() => {
    setImages(initialImages)
  }, [initialImages])

  // Refetch images when component mounts (to ensure fresh data after navigation)
  useEffect(() => {
    fetchImages()
  }, [orgId])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return
    }

    setIsDeleting(id)
    try {
      const response = await fetch(`/api/organizations/${orgId}/gallery-images/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete image')
      }

      setImages(images.filter(img => img.id !== id))
      toast.success('Image deleted successfully')
      // Refetch to ensure we have the latest data
      fetchImages()
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Failed to delete image')
    } finally {
      setIsDeleting(null)
    }
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No gallery images yet. Add your first image to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table View */}
      {viewMode === 'table' && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Caption / Alt Text</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {images.map((image) => (
                <TableRow key={image.id}>
                  <TableCell>
                    {image.imageUrl && (
                      <Image
                        src={image.imageUrl}
                        alt={image.title || 'Gallery image'}
                        width={80}
                        height={80}
                        className="rounded object-cover"
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{image.title || '-'}</TableCell>
                  <TableCell className="max-w-md truncate">{image.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.location.href = `/client/${orgId}/restaurant/gallery/${image.id}/edit`}
                      >
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(image.id)}
                        disabled={isDeleting === image.id}
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

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden relative group">
              <div className="relative aspect-[4/3] w-full">
                {image.imageUrl && (
                  <Image
                    src={image.imageUrl}
                    alt={image.title || 'Gallery image'}
                    fill
                    className="object-cover"
                  />
                )}
                {/* Overlay gradient at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                {/* Content overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-white mb-1 line-clamp-1">
                        {image.title || 'Untitled Image'}
                      </CardTitle>
                      {image.description && (
                        <p className="text-sm text-white/90 line-clamp-2">
                          {image.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                        onClick={() => window.location.href = `/client/${orgId}/restaurant/gallery/${image.id}/edit`}
                      >
                        <IconEdit className="h-4 w-4 text-white" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                        onClick={() => handleDelete(image.id)}
                        disabled={isDeleting === image.id}
                      >
                        <IconTrash className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

