"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

interface FileWithPreview {
  file: File
  preview: string
  status?: 'pending' | 'uploading' | 'success' | 'error'
  uploadProgress?: number
  error?: string
  uploadedUrl?: string
}

interface ImageUploadStepProps {
  productImages: string[]
  productName: string
  productId?: string
  onProductImagesChange: (images: string[]) => void
  onMainImageChange: (url: string) => void
  errors?: Record<string, string>
  orgId: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

export function ImageUploadStep({
  productImages,
  productName,
  productId,
  onProductImagesChange,
  onMainImageChange,
  errors,
  orgId,
}: ImageUploadStepProps) {
  const [files, setFiles] = React.useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [mainImageIndex, setMainImageIndex] = React.useState<number | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Load existing product images when editing
  React.useEffect(() => {
    if (productImages.length > 0 && files.length === 0) {
      // Convert existing product images to FileWithPreview format for display
      // These are already uploaded, so mark them as success
      const existingFiles: FileWithPreview[] = productImages.map((url, index) => ({
        file: new File([], `image-${index}.jpg`), // Dummy file for existing images
        preview: url,
        status: 'success' as const,
        uploadProgress: 100,
        uploadedUrl: url,
      }))
      setFiles(existingFiles)
      // Set first image as main if not already set
      if (mainImageIndex === null && existingFiles.length > 0) {
        setMainImageIndex(0)
        onMainImageChange(existingFiles[0].uploadedUrl || existingFiles[0].preview)
      }
    }
  }, [productImages, files.length, mainImageIndex, onMainImageChange])

  const handleFilesSelect = (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles)
    const validFiles: FileWithPreview[] = []
    const invalidFiles: string[] = []

    fileArray.forEach((file) => {
      // Validate file type
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        invalidFiles.push(`${file.name}: Invalid file type`)
        return
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name}: File too large (max 10MB)`)
        return
      }

      // Check if file already exists
      const fileExists = files.some(
        (f) => f.file.name === file.name && f.file.size === file.size
      )
      if (fileExists) {
        invalidFiles.push(`${file.name}: Already added`)
        return
      }

      // Create preview URL
      const preview = URL.createObjectURL(file)
      validFiles.push({
        file,
        preview,
        status: 'pending',
        uploadProgress: 0,
      })
    })

    if (invalidFiles.length > 0) {
      toast.error(`Some files were skipped:\n${invalidFiles.slice(0, 3).join('\n')}`)
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles])
      // Set first new file as main if no main is set
      if (mainImageIndex === null && files.length === 0 && validFiles.length > 0) {
        setMainImageIndex(0)
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
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFilesSelect(droppedFiles)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      handleFilesSelect(selectedFiles)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveFile = (index: number) => {
    const fileToRemove = files[index]
    
    // Revoke preview URL to free memory
    if (fileToRemove.status === 'pending' && fileToRemove.preview.startsWith('blob:')) {
      URL.revokeObjectURL(fileToRemove.preview)
    }

    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)

    // Update main image index if needed
    if (mainImageIndex === index) {
      // Set first remaining image as main, or null if none
      if (newFiles.length > 0) {
        setMainImageIndex(0)
        const firstFile = newFiles[0]
        onMainImageChange(firstFile.uploadedUrl || firstFile.preview)
      } else {
        setMainImageIndex(null)
        onMainImageChange("")
      }
    } else if (mainImageIndex !== null && mainImageIndex > index) {
      // Adjust main image index if file before it was removed
      setMainImageIndex(mainImageIndex - 1)
    }

    // Update product images if this was an uploaded image
    if (fileToRemove.uploadedUrl) {
      const newProductImages = productImages.filter((url) => url !== fileToRemove.uploadedUrl)
      onProductImagesChange(newProductImages)
    }
  }

  const handleSetMainImage = (index: number) => {
    setMainImageIndex(index)
    const file = files[index]
    onMainImageChange(file.uploadedUrl || file.preview)
  }

  const handleUploadAll = async () => {
    if (files.length === 0) {
      toast.error("Please add at least one image")
      return
    }

    if (!productName.trim()) {
      toast.error("Please enter a product name first")
      return
    }

    const pendingFiles = files.filter((f) => f.status === 'pending')
    if (pendingFiles.length === 0) {
      toast.success("All images are already uploaded")
      return
    }

    setIsUploading(true)
    const uploadedUrls: string[] = []
    let successCount = 0
    let errorCount = 0

    try {
      for (let i = 0; i < files.length; i++) {
        const fileWithPreview = files[i]

        // Skip if already uploaded
        if (fileWithPreview.status === 'success' && fileWithPreview.uploadedUrl) {
          uploadedUrls.push(fileWithPreview.uploadedUrl)
          continue
        }

        // Skip if not pending
        if (fileWithPreview.status !== 'pending') {
          continue
        }

        // Update status to uploading
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'uploading', uploadProgress: 0 } : f
          )
        )

        try {
          const formData = new FormData()
          formData.append("file", fileWithPreview.file)
          formData.append("productName", productName.trim())
          if (productId) {
            formData.append("productId", productId)
          }

          const response = await fetch(
            `/api/businesses/${orgId}/gallery-images/upload-product`,
            {
              method: "POST",
              body: formData,
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

          uploadedUrls.push(data.imageUrl)

          // Update file status to success
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    status: 'success',
                    uploadProgress: 100,
                    uploadedUrl: data.imageUrl,
                  }
                : f
            )
          )

          successCount++
        } catch (error) {
          console.error(`Error uploading ${fileWithPreview.file.name}:`, error)
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    status: 'error',
                    error: error instanceof Error ? error.message : "Failed to upload",
                  }
                : f
            )
          )
          errorCount++
        }
      }

      // Update product images with all uploaded URLs
      onProductImagesChange(uploadedUrls)

      // Show summary
      if (successCount > 0 && errorCount === 0) {
        toast.success(`Successfully uploaded ${successCount} image${successCount > 1 ? 's' : ''}!`)
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(`Uploaded ${successCount} image${successCount > 1 ? 's' : ''}, ${errorCount} failed`)
      } else if (errorCount > 0) {
        toast.error(`Failed to upload ${errorCount} image${errorCount > 1 ? 's' : ''}`)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const allUploaded = files.length > 0 && files.every((f) => f.status === 'success')
  const hasPendingFiles = files.some((f) => f.status === 'pending')

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Product Images</h2>
        <p className="text-muted-foreground">
          Upload multiple images for your product. They will be organized in a folder with the product name.
        </p>
      </div>

      {/* Upload Area */}
      <div className="space-y-4">
        <Label>Add Images</Label>
        <div
          className={cn(
            "border-2 border-dashed rounded-lg transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-2">
              Drag and drop images here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Supported formats: JPEG, PNG, GIF, WebP (max 10MB each)
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Select Images"}
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>

      {/* Images Grid */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>
              Images ({files.length}) {hasPendingFiles && <span className="text-muted-foreground">- Click "Upload All" to save</span>}
            </Label>
            {hasPendingFiles && (
              <Button
                type="button"
                onClick={handleUploadAll}
                disabled={isUploading || !productName.trim()}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload All
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((fileWithPreview, index) => (
              <div
                key={index}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden border-2 transition-all group",
                  mainImageIndex === index
                    ? "border-primary ring-2 ring-primary"
                    : "border-muted hover:border-muted-foreground"
                )}
              >
                {/* Image Preview */}
                <Image
                  src={fileWithPreview.preview}
                  alt={fileWithPreview.file.name}
                  fill
                  className="object-cover"
                  unoptimized
                />

                {/* Main Image Badge */}
                {mainImageIndex === index && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded font-medium">
                    Main
                  </div>
                )}

                {/* Status Overlay */}
                {fileWithPreview.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white mb-2" />
                    {fileWithPreview.uploadProgress !== undefined && (
                      <div className="w-3/4">
                        <Progress value={fileWithPreview.uploadProgress} className="h-1" />
                      </div>
                    )}
                  </div>
                )}

                {fileWithPreview.status === 'error' && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                      Error
                    </div>
                  </div>
                )}

                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSetMainImage(index)}
                    className={cn(
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      mainImageIndex === index && "opacity-100"
                    )}
                  >
                    {mainImageIndex === index ? "Main" : "Set Main"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* File Name */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                  {fileWithPreview.file.name}
                </div>
              </div>
            ))}
          </div>

          {errors?.productImages && (
            <p className="text-sm text-red-500">{errors.productImages}</p>
          )}
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            No images added yet. Upload images to get started.
          </p>
        </div>
      )}
    </div>
  )
}

