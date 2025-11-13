"use client"

import { useState } from "react"
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
import { IconEdit, IconTrash } from "@tabler/icons-react"
import Image from "next/image"
import { toast } from "sonner"

interface GalleryImagesTableProps {
  orgId: string
  clientId: number
  initialImages: GalleryImage[]
}

export function GalleryImagesTable({ orgId, clientId, initialImages }: GalleryImagesTableProps) {
  const [images, setImages] = useState(initialImages)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return
    }

    setIsDeleting(id)
    try {
      const response = await fetch(`/api/gallery-images/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete image')
      }

      setImages(images.filter(img => img.id !== id))
      toast.success('Image deleted successfully')
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Title</TableHead>
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
  )
}

