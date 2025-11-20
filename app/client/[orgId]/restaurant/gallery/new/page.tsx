"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { IconUpload, IconX, IconArrowLeft, IconLoader, IconPhoto } from "@tabler/icons-react"
import { toast } from "sonner"
import Image from "next/image"

export default function NewGalleryImagePage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  
  const [isSaving, setIsSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("")
  const [showMenuImagesDialog, setShowMenuImagesDialog] = useState(false)
  const [menuImages, setMenuImages] = useState<Array<{ imageUrl: string; menuItemName: string; menuItemId: number }>>([])
  const [isLoadingMenuImages, setIsLoadingMenuImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
  })

  const fetchMenuImages = async () => {
    try {
      setIsLoadingMenuImages(true)
      const response = await fetch(`/api/businesses/${orgId}/menu-item-images`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch menu images')
      }

      const data = await response.json()
      setMenuImages(data.images || [])
    } catch (error) {
      console.error('Error fetching menu images:', error)
      toast.error('Failed to load menu images')
    } finally {
      setIsLoadingMenuImages(false)
    }
  }

  const handleOpenMenuImagesDialog = () => {
    setShowMenuImagesDialog(true)
    if (menuImages.length === 0) {
      fetchMenuImages()
    }
  }

  const handleSelectMenuImage = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl)
    setImagePreview(imageUrl)
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setShowMenuImagesDialog(false)
    toast.success('Image selected from menu items')
  }

  const handleImageSelect = async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.')
      return
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size exceeds 10MB limit')
      return
    }

    setImageFile(file)
    setSelectedImageUrl("")
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadImage = async () => {
    if (!imageFile) return null

    try {
      const formData = new FormData()
      formData.append('file', imageFile)

      const response = await fetch(`/api/businesses/${orgId}/gallery-images/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      return data.imageUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!imagePreview) {
      toast.error('Please select or upload an image')
      return
    }

    setIsSaving(true)

    try {
      let imageUrl = selectedImageUrl

      // Upload new image if one was selected
      if (imageFile) {
        const uploadedUrl = await handleUploadImage()
        if (!uploadedUrl) {
          setIsSaving(false)
          return
        }
        imageUrl = uploadedUrl
      }

      if (!imageUrl) {
        toast.error('Please select or upload an image')
        setIsSaving(false)
        return
      }

      const response = await fetch(`/api/businesses/${orgId}/gallery-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          title: formData.title || null,
          description: formData.description || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create image')
      }

      toast.success('Image added successfully')
      router.push(`/client/${orgId}/restaurant/gallery`)
      router.refresh()
    } catch (error) {
      console.error('Error creating image:', error)
      toast.error('Failed to add image')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/client/${orgId}/restaurant/gallery`)}
            className="mb-4"
          >
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Gallery
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Add Gallery Image</CardTitle>
              <CardDescription>
                Add a new image to your gallery. You can upload a new image or reuse one from your menu items.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Image</Label>
                  <div className="flex items-start gap-4">
                    {imagePreview && (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview("")
                            setImageFile(null)
                            setSelectedImageUrl("")
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ""
                            }
                          }}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                        >
                          <IconX className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleImageSelect(file)
                            }
                          }}
                          className="hidden"
                          id="image-upload"
                        />
                        <Label
                          htmlFor="image-upload"
                          className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-accent flex-1"
                        >
                          <IconUpload className="h-4 w-4" />
                          Upload New Image
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleOpenMenuImagesDialog}
                        >
                          <IconPhoto className="mr-2 h-4 w-4" />
                          Reuse from Menu
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Upload a new image or reuse an existing image from your menu items to avoid duplicates
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">
                    Caption / Alt Text
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter image caption or alt text"
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be used as the alt text for accessibility and as the image caption
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter image description (optional)"
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/client/${orgId}/restaurant/gallery`)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving || !imagePreview}>
                    {isSaving ? (
                      <>
                        <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Add Image'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showMenuImagesDialog} onOpenChange={setShowMenuImagesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reuse Image from Menu Items</DialogTitle>
            <DialogDescription>
              Select an image from your menu items to reuse in the gallery. This helps avoid duplicate images.
            </DialogDescription>
          </DialogHeader>
          {isLoadingMenuImages ? (
            <div className="flex items-center justify-center py-8">
              <IconLoader className="h-8 w-8 animate-spin" />
            </div>
          ) : menuImages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No menu item images available. Upload images to your menu items first.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {menuImages.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectMenuImage(item.imageUrl)}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 hover:border-primary transition-colors group"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.menuItemName}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                    {item.menuItemName}
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

