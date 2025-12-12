"use client"

import { useState, useEffect } from "react"
import { Band } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import Image from "next/image"

interface BandFormModalProps {
  orgId: string
  band?: Band | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BandFormModal({
  orgId,
  band,
  open,
  onOpenChange,
  onSuccess,
}: BandFormModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useState<HTMLInputElement | null>(null)[0]

  useEffect(() => {
    if (band) {
      setName(band.name || "")
      setDescription(band.description || "")
      setImageUrl(band.image_url || "")
    } else {
      setName("")
      setDescription("")
      setImageUrl("")
    }
  }, [band, open])

  const handleImageFileSelect = async (file: File | null) => {
    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/businesses/${orgId}/gallery-images/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Failed to upload image")
      }

      const data = await response.json()
      if (!data?.imageUrl) {
        throw new Error("Upload did not return an image URL")
      }

      setImageUrl(data.imageUrl)
      toast.success("Image uploaded successfully")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Band name is required")
      return
    }

    setIsSubmitting(true)
    try {
      const url = band
        ? `/api/businesses/${orgId}/bands/${band.id}`
        : `/api/businesses/${orgId}/bands`

      const method = band ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          image_url: imageUrl || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Failed to save band",
        }))
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || "Failed to save band"
        throw new Error(errorMessage)
      }

      toast.success(band ? "Band updated successfully" : "Band created successfully")
      onSuccess()
    } catch (error) {
      console.error("Error saving band:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to save band"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{band ? "Edit Band" : "Add New Band"}</DialogTitle>
          <DialogDescription>
            {band
              ? "Update the band information below."
              : "Add a new band to your collection."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Band Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter band name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter band description"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Band Image</Label>
              <div className="space-y-2">
                {imageUrl && (
                  <div className="relative h-32 w-32 overflow-hidden rounded-md border">
                    <Image
                      src={imageUrl}
                      alt="Band image"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleImageFileSelect(file)
                      }
                    }}
                    disabled={isUploading}
                    className="cursor-pointer"
                  />
                  {imageUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setImageUrl("")}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload an image for this band (max 5MB)
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting
                ? band
                  ? "Updating..."
                  : "Creating..."
                : band
                ? "Update Band"
                : "Create Band"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
