"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { IconPhoto, IconLink } from "@tabler/icons-react"

interface BasicInfoStepProps {
  name: string
  imageUrl: string
  description: string
  onNameChange: (name: string) => void
  onImageChange: (url: string) => void
  onDescriptionChange: (description: string) => void
  errors?: Record<string, string>
  orgId: string
}

export function BasicInfoStep({
  name,
  imageUrl,
  description,
  onNameChange,
  onImageChange,
  onDescriptionChange,
  errors,
  orgId,
}: BasicInfoStepProps) {
  const [imagePreview, setImagePreview] = React.useState(imageUrl || "")
  const [isUploading, setIsUploading] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isGalleryOpen, setIsGalleryOpen] = React.useState(false)
  const [galleryImages, setGalleryImages] = React.useState<Array<{ id: number; url: string; name: string }>>([])
  const [isLoadingGallery, setIsLoadingGallery] = React.useState(false)
  const [showUrlInput, setShowUrlInput] = React.useState(false)
  const [imageUrlInput, setImageUrlInput] = React.useState("")
  const [isGeneratingDescription, setIsGeneratingDescription] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const descriptionTextareaRef = React.useRef<HTMLTextAreaElement | null>(null)

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

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10MB")
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

  const loadGalleryImages = async () => {
    if (!orgId) {
      toast.error('Organization ID is required')
      return
    }

    setIsLoadingGallery(true)
    try {
      const response = await fetch(`/api/businesses/${orgId}/gallery-images`)
      if (response.ok) {
        const data = await response.json()
        setGalleryImages((data.images || []).map((img: Record<string, unknown>) => ({
          id: img.id as number,
          url: (img.url || img.image_url) as string,
          name: (img.name || img.filename || img.title || 'Untitled') as string
        })))
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch gallery images' }))
        console.error('Error fetching gallery images:', errorData)
        toast.error(errorData.error || 'Failed to load gallery images')
      }
    } catch (error) {
      console.error('Error loading gallery:', error)
      toast.error('Failed to load gallery images')
    } finally {
      setIsLoadingGallery(false)
    }
  }

  const handleGallerySelect = (imageUrl: string) => {
    setImagePreview(imageUrl)
    onImageChange(imageUrl)
    setIsGalleryOpen(false)
    toast.success('Image selected from gallery')
  }

  const handleUrlSubmit = () => {
    if (!imageUrlInput.trim()) {
      toast.error('Please enter an image URL')
      return
    }

    try {
      new URL(imageUrlInput)
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    setImagePreview(imageUrlInput)
    onImageChange(imageUrlInput)
    setImageUrlInput("")
    setShowUrlInput(false)
    toast.success('Image URL set')
  }

  const handleGenerateDescription = async () => {
    if (!name?.trim()) {
      toast.error('Please enter a product name first')
      return
    }
    
    setIsGeneratingDescription(true)
    try {
      const response = await fetch('/api/products/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'description',
          productName: name,
          currentDescription: description || undefined
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate description' }))
        throw new Error(errorData.error || 'Failed to generate description')
      }
      
      const data = await response.json()
      onDescriptionChange(data.description)
      toast.success('Description generated successfully')
    } catch (error) {
      console.error('Error generating description:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate description. Please try again.')
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
        <p className="text-muted-foreground">
          Enter your product name, image, and description
        </p>
      </div>

      <div className="space-y-6">
        {/* Product Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Product Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter product name"
            className={cn(errors?.name ? "border-red-500" : "")}
          />
          {errors?.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label>Product Image</Label>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg text-center transition-colors relative",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {imagePreview ? (
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="Product preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90 z-10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4 p-8">
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

          <div className="flex gap-2">
            <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsGalleryOpen(true)
                    loadGalleryImages()
                  }}
                  className="flex-1"
                >
                  <IconPhoto className="h-4 w-4 mr-2" />
                  Import from Gallery
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Choose Image from Gallery</DialogTitle>
                  <DialogDescription>
                    Select an image from your gallery to use for this product
                  </DialogDescription>
                </DialogHeader>
                {isLoadingGallery ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">Loading gallery...</p>
                  </div>
                ) : galleryImages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-muted-foreground mb-4">No images in gallery</p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {galleryImages.map((image) => (
                      <div
                        key={image.id}
                        className="relative group cursor-pointer border rounded-lg overflow-hidden hover:border-primary transition-colors"
                        onClick={() => handleGallerySelect(image.url)}
                      >
                        <div className="relative aspect-square">
                          <Image
                            src={image.url}
                            alt={image.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-xs truncate">
                          {image.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {!showUrlInput ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUrlInput(true)}
                className="flex-1"
              >
                <IconLink className="h-4 w-4 mr-2" />
                Paste Image URL
              </Button>
            ) : (
              <div className="flex gap-2 flex-1">
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleUrlSubmit()
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUrlSubmit}
                >
                  Set
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowUrlInput(false)
                    setImageUrlInput("")
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center justify-between">
            <span>Description</span>
            {name?.trim() && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={isGeneratingDescription}
                className="h-auto py-1"
              >
                {isGeneratingDescription ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate with AI"
                )}
              </Button>
            )}
          </Label>
          <Textarea
            ref={descriptionTextareaRef}
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Enter a product description"
            rows={6}
            disabled={isGeneratingDescription}
          />
        </div>
      </div>
    </div>
  )
}

