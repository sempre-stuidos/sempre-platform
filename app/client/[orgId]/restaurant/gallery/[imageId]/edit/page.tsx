"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconUpload, IconX, IconArrowLeft, IconLoader } from "@tabler/icons-react"
import { toast } from "sonner"
import Image from "next/image"

export default function EditGalleryImagePage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const imageId = params.imageId as string
  
  const [image, setImage] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
  })

  useEffect(() => {
    if (imageId) {
      fetchImage()
    }
  }, [imageId])

  const fetchImage = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/organizations/${orgId}/gallery-images/${imageId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }

      const data = await response.json()
      setImage(data.image)
      setFormData({
        title: data.image.title || "",
        description: data.image.description || "",
        imageUrl: data.image.imageUrl || "",
      })
      setImagePreview(data.image.imageUrl || "")
    } catch (error) {
      console.error('Error fetching image:', error)
      toast.error('Failed to load image')
      router.push(`/client/${orgId}/restaurant/gallery`)
    } finally {
      setIsLoading(false)
    }
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

      const response = await fetch(`/api/organizations/${orgId}/gallery-images/upload`, {
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
    setIsSaving(true)

    try {
      let imageUrl = formData.imageUrl

      // Upload new image if one was selected
      if (imageFile) {
        const uploadedUrl = await handleUploadImage()
        if (!uploadedUrl) {
          setIsSaving(false)
          return
        }
        imageUrl = uploadedUrl
      }

      const response = await fetch(`/api/organizations/${orgId}/gallery-images/${imageId}`, {
        method: 'PATCH',
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
        throw new Error('Failed to update image')
      }

      toast.success('Image updated successfully')
      router.push(`/client/${orgId}/restaurant/gallery`)
    } catch (error) {
      console.error('Error updating image:', error)
      toast.error('Failed to update image')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IconLoader className="h-8 w-8 animate-spin" />
      </div>
    )
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
              <CardTitle>Edit Gallery Image</CardTitle>
              <CardDescription>
                Update the image, caption (alt text), and description
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
                            setImagePreview(formData.imageUrl)
                            setImageFile(null)
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
                    <div className="flex-1">
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
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-accent"
                      >
                        <IconUpload className="h-4 w-4" />
                        {imagePreview ? 'Replace Image' : 'Upload Image'}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-2">
                        Replace the current image with a new one
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
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

