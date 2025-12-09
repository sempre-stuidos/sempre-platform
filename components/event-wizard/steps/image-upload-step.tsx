"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Upload, X } from "lucide-react"
import { toast } from "sonner"

interface ImageUploadStepProps {
  imageUrl: string
  onImageChange: (url: string) => void
  orgId: string
  errors?: Record<string, string>
}

export function ImageUploadStep({
  imageUrl,
  onImageChange,
  orgId,
  errors,
}: ImageUploadStepProps) {
  const [imagePreview, setImagePreview] = React.useState(imageUrl || "")
  const [isUploading, setIsUploading] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    setImagePreview(imageUrl)
  }, [imageUrl])

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
      const formDataData = new FormData()
      formDataData.append("file", file)

      const response = await fetch(
        `/api/businesses/${orgId}/gallery-images/upload`,
        {
          method: "POST",
          body: formDataData,
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Failed to upload image")
      }

      const data = await response.json()
      if (!data?.imageUrl) {
        throw new Error("Upload did not return an image URL")
      }

      onImageChange(data.imageUrl)
      setImagePreview(data.imageUrl)
      toast.success("Image uploaded successfully")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      )
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleImageFileSelect(file)
    }
  }

  const handleRemove = () => {
    onImageChange("")
    setImagePreview("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Event Image</h2>
        <p className="text-muted-foreground">
          Upload an image for your event (optional - you can skip this step)
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <div className="space-y-2">
          <Label htmlFor="image_url">Image URL</Label>
          <Input
            id="image_url"
            value={imageUrl}
            onChange={(e) => {
              onImageChange(e.target.value)
              setImagePreview(e.target.value)
            }}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {imagePreview ? (
            <div className="relative aspect-video w-full max-w-md mx-auto rounded-lg overflow-hidden border">
              <Image
                src={imagePreview}
                alt="Event preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium mb-1">
                  Drag and drop an image here
                </p>
                <p className="text-xs text-muted-foreground mb-4">or</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Choose File"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            handleImageFileSelect(e.target.files?.[0] || null)
          }
        />

        <div className="text-center">
          <button
            type="button"
            onClick={() => onImageChange("")}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Skip this step
          </button>
        </div>

        {errors?.image_url && (
          <p className="text-sm text-red-500 text-center">{errors.image_url}</p>
        )}
      </div>
    </div>
  )
}

