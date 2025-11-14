"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { IconUpload, IconPhoto, IconX } from "@tabler/icons-react"
import Image from "next/image"
import { toast } from "sonner"

interface ImagePickerProps {
  value: string
  onChange: (url: string) => void
  label?: string
  placeholder?: string
}

export function ImagePicker({ value, onChange, label = "Image", placeholder = "/image.jpg" }: ImagePickerProps) {
  const [isGalleryOpen, setIsGalleryOpen] = React.useState(false)
  const [galleryImages, setGalleryImages] = React.useState<Array<{ id: number; url: string; name: string }>>([])
  const [isLoadingGallery, setIsLoadingGallery] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Extract image name from URL
  const getImageName = (url: string) => {
    if (!url) return "No image selected"
    try {
      const urlObj = new URL(url, window.location.origin)
      const pathname = urlObj.pathname
      const filename = pathname.split('/').pop() || pathname
      return filename.length > 30 ? filename.substring(0, 30) + '...' : filename
    } catch {
      // If it's a relative path
      const filename = url.split('/').pop() || url
      return filename.length > 30 ? filename.substring(0, 30) + '...' : filename
    }
  }

  const loadGalleryImages = async () => {
    setIsLoadingGallery(true)
    try {
      // Extract orgId from current path or use a default
      const pathParts = window.location.pathname.split('/')
      const orgIdIndex = pathParts.indexOf('client')
      const orgId = orgIdIndex !== -1 ? pathParts[orgIdIndex + 1] : null

      if (!orgId) {
        toast.error('Unable to determine organization')
        return
      }

      const response = await fetch(`/api/organizations/${orgId}/gallery-images`)
      if (response.ok) {
        const data = await response.json()
        setGalleryImages((data.images || []).map((img: any) => ({
          id: img.id,
          url: img.url || img.image_url,
          name: img.name || img.filename || 'Untitled'
        })))
      }
    } catch (error) {
      console.error('Error loading gallery:', error)
      toast.error('Failed to load gallery images')
    } finally {
      setIsLoadingGallery(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB')
      return
    }

    // For now, we'll create a local object URL
    // In production, you'd upload to a server/storage
    const objectUrl = URL.createObjectURL(file)
    onChange(objectUrl)
    toast.success('Image selected (upload to server not implemented yet)')
  }

  const handleGallerySelect = (imageUrl: string) => {
    onChange(imageUrl)
    setIsGalleryOpen(false)
    toast.success('Image selected from gallery')
  }

  const handleRemove = () => {
    onChange('')
    toast.success('Image removed')
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {/* Current Image Preview */}
      {value && (
        <div className="relative border rounded-lg p-4 bg-muted/50">
          <div className="flex items-start gap-4">
            <div className="relative w-24 h-24 rounded-md overflow-hidden border bg-background">
              <Image
                src={value || '/placeholder.svg'}
                alt="Selected image"
                fill
                className="object-cover"
                unoptimized
                onError={(e) => {
                  // Fallback if image fails to load
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder.svg'
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{getImageName(value)}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{value}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="mt-2"
              >
                <IconX className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
        >
          <IconUpload className="h-4 w-4 mr-2" />
          Upload New
        </Button>
        
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
              Choose from Gallery
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Choose Image from Gallery</DialogTitle>
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
                  <IconUpload className="h-4 w-4 mr-2" />
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
      </div>

      {/* Hidden file input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Fallback URL input for advanced users */}
      <div className="pt-2 border-t">
        <Label htmlFor="image-url-input" className="text-xs text-muted-foreground">
          Or enter image URL manually
        </Label>
        <Input
          id="image-url-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1"
        />
      </div>
    </div>
  )
}

