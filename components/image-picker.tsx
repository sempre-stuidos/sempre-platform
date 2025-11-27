"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { IconUpload, IconPhoto, IconX } from "@tabler/icons-react"
import Image from "next/image"
import { toast } from "sonner"

// Data URI for error fallback image (prevents infinite loop from 404s)
const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

interface ImagePickerProps {
  value: string
  onChange: (url: string) => void
  label?: string
  placeholder?: string
  compact?: boolean
  orgId?: string
  businessSlug?: string | null
}

export function ImagePicker({ value, onChange, label = "Image", placeholder = "/image.jpg", compact = false, orgId, businessSlug }: ImagePickerProps) {
  const [isGalleryOpen, setIsGalleryOpen] = React.useState(false)
  const [galleryImages, setGalleryImages] = React.useState<Array<{ id: number; url: string; name: string }>>([])
  const [isLoadingGallery, setIsLoadingGallery] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)
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

      const response = await fetch(`/api/businesses/${orgId}/gallery-images`)
      if (response.ok) {
        const data = await response.json()
        setGalleryImages((data.images || []).map((img: Record<string, unknown>) => ({
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    // If orgId is provided, upload to server
    if (orgId) {
      setIsUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`/api/businesses/${orgId}/page-images/upload`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(errorData?.error || 'Failed to upload image')
        }

        const data = await response.json()
        if (!data?.imageUrl) {
          throw new Error('Upload did not return an image URL')
        }

        // Immediately update with uploaded URL - this will show in widget
        onChange(data.imageUrl)
        toast.success('Image uploaded successfully')
      } catch (error) {
        console.error('Error uploading image:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to upload image')
      } finally {
        setIsUploading(false)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } else {
      // Fallback: create local object URL if no orgId provided
      const objectUrl = URL.createObjectURL(file)
      onChange(objectUrl)
      toast.success('Image selected')
    }
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

  // Compact mode for widget
  if (compact) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        
        {value ? (
          <div className="relative group rounded-lg overflow-hidden border bg-muted/30 aspect-video">
            {isUploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <Image
                src={imageError ? ERROR_IMG_SRC : value}
                alt="Selected image"
                fill
                className="object-cover"
                unoptimized
                onError={() => {
                  if (!imageError) {
                    setImageError(true)
                  }
                }}
                onLoad={() => {
                  setImageError(false)
                }}
              />
            )}
            {/* Overlay with Replace button */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setIsGalleryOpen(true)
                        loadGalleryImages()
                      }}
                      className="mr-2"
                    >
                      <IconPhoto className="h-4 w-4 mr-2" />
                      Replace
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Choose Image</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          fileInputRef.current?.click()
                          setIsGalleryOpen(false)
                        }}
                        className="w-full"
                      >
                        <IconUpload className="h-4 w-4 mr-2" />
                        Upload New Image
                      </Button>
                      {isLoadingGallery ? (
                        <div className="flex items-center justify-center py-8">
                          <p className="text-muted-foreground">Loading gallery...</p>
                        </div>
                      ) : galleryImages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <p className="text-muted-foreground">No images in gallery</p>
                        </div>
                      ) : (
                        <>
                          <div className="border-t pt-4">
                            <p className="text-sm font-medium mb-3">Choose from Gallery</p>
                            <div className="grid grid-cols-3 gap-4">
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
                          </div>
                          <div className="border-t pt-4">
                            <Label htmlFor="image-url-input-compact" className="text-xs text-muted-foreground mb-2 block">
                              Or enter image URL
                            </Label>
                            <Input
                              id="image-url-input-compact"
                              value={value}
                              onChange={(e) => {
                                onChange(e.target.value)
                                setIsGalleryOpen(false)
                              }}
                              placeholder={placeholder}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                >
                  <IconX className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25 bg-muted/20 aspect-video flex items-center justify-center">
            <div className="text-center space-y-3 p-6">
              <IconPhoto className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <div className="space-y-2">
                <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsGalleryOpen(true)
                        loadGalleryImages()
                      }}
                    >
                      <IconPhoto className="h-4 w-4 mr-2" />
                      Choose Image
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Choose Image</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          fileInputRef.current?.click()
                          setIsGalleryOpen(false)
                        }}
                        className="w-full"
                      >
                        <IconUpload className="h-4 w-4 mr-2" />
                        Upload New Image
                      </Button>
                      {isLoadingGallery ? (
                        <div className="flex items-center justify-center py-8">
                          <p className="text-muted-foreground">Loading gallery...</p>
                        </div>
                      ) : galleryImages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <p className="text-muted-foreground">No images in gallery</p>
                        </div>
                      ) : (
                        <>
                          <div className="border-t pt-4">
                            <p className="text-sm font-medium mb-3">Choose from Gallery</p>
                            <div className="grid grid-cols-3 gap-4">
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
                          </div>
                          <div className="border-t pt-4">
                            <Label htmlFor="image-url-input-compact-empty" className="text-xs text-muted-foreground mb-2 block">
                              Or enter image URL
                            </Label>
                            <Input
                              id="image-url-input-compact-empty"
                              value={value}
                              onChange={(e) => {
                                onChange(e.target.value)
                                setIsGalleryOpen(false)
                              }}
                              placeholder={placeholder}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    )
  }

  // Default mode (full form)
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {/* Current Image Preview */}
      {value && (
        <div className="relative border rounded-lg p-4 bg-muted/50">
          <div className="flex items-start gap-4">
            <div className="relative w-24 h-24 rounded-md overflow-hidden border bg-background">
              {isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                  <p className="text-xs text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <Image
                  src={imageError ? ERROR_IMG_SRC : value}
                  alt="Selected image"
                  fill
                  className="object-cover"
                  unoptimized
                  onError={() => {
                    if (!imageError) {
                      setImageError(true)
                    }
                  }}
                  onLoad={() => {
                    setImageError(false)
                  }}
                />
              )}
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

