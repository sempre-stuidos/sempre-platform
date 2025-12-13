"use client"

import { IconUpload, IconX, IconLoader, IconPhoto } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useRef, DragEvent, useEffect } from "react"
import { 
  createFilesAssets, 
  formatFileSize, 
  getFileFormat 
} from "@/lib/files-assets"
import { uploadGalleryImage } from "@/lib/gallery-images"
import { getBusinessById } from "@/lib/businesses"
import { toast } from "sonner"
import Image from "next/image"

interface UploadImageModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: () => void
  orgId?: string
  businessType?: 'agency' | 'restaurant' | 'hotel' | 'retail' | 'service' | 'other'
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB in bytes
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

interface FileWithPreview {
  file: File
  preview: string
  uploadProgress?: number
  status?: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export function UploadImageModal({ isOpen, onClose, onUploadSuccess, orgId, businessType }: UploadImageModalProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [businessSlug, setBusinessSlug] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    category: null as 'Event' | 'Menu' | null,
  })

  // Fetch business slug when modal opens
  useEffect(() => {
    if (isOpen && orgId) {
      getBusinessById(orgId)
        .then((business) => {
          if (business?.slug) {
            setBusinessSlug(business.slug)
          } else {
            toast.error("Business slug not found. Please set a slug for this business.")
            setBusinessSlug(null)
          }
        })
        .catch((error) => {
          console.error("Error fetching business:", error)
          toast.error("Failed to load business information")
          setBusinessSlug(null)
        })
    }
  }, [isOpen, orgId])

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
        invalidFiles.push(`${file.name}: File too large (max ${formatFileSize(MAX_FILE_SIZE)})`)
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
      toast.error(`Some files were skipped:\n${invalidFiles.join('\n')}`)
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles])
      setErrors({})
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
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
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (files.length === 0) {
      newErrors.files = "Please select at least one image to upload"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || files.length === 0) {
      return
    }

    if (!businessSlug) {
      toast.error("Business slug is required. Please set a slug for this business.")
      return
    }

    setIsUploading(true)
    setOverallProgress(0)

    const totalFiles = files.length
    let successCount = 0
    let errorCount = 0

    try {
      // Upload files sequentially
      for (let i = 0; i < files.length; i++) {
        const fileWithPreview = files[i]
        
        // Update status to uploading
        setFiles((prev) => 
          prev.map((f, idx) => 
            idx === i ? { ...f, status: 'uploading', uploadProgress: 0 } : f
          )
        )

        try {
          // Upload file to Supabase gallery bucket
          const filePath = await uploadGalleryImage(fileWithPreview.file, businessSlug)
          
          if (!filePath) {
            throw new Error("Failed to upload image to storage")
          }

          // Update progress
          setFiles((prev) => 
            prev.map((f, idx) => 
              idx === i ? { ...f, uploadProgress: 50 } : f
            )
          )

          // Get file metadata
          const fileSize = formatFileSize(fileWithPreview.file.size)
          const fileFormat = getFileFormat(fileWithPreview.file.name)
          const uploadedDate = new Date().toISOString().split('T')[0]
          const nameWithoutExtension = fileWithPreview.file.name.replace(/\.[^/.]+$/, "")

          // Create database record
          const newFileAsset = await createFilesAssets({
            name: nameWithoutExtension,
            type: "Images",
            category: "Client Assets",
            project: "Gallery",
            size: fileSize,
            format: fileFormat,
            uploaded: uploadedDate,
            status: "Active",
            file_url: filePath,
            image_category: formData.category || null,
          })

          if (!newFileAsset) {
            throw new Error("Failed to create image record")
          }

          // Update status to success
          setFiles((prev) => 
            prev.map((f, idx) => 
              idx === i ? { ...f, status: 'success', uploadProgress: 100 } : f
            )
          )

          successCount++
        } catch (error) {
          console.error(`Error uploading ${fileWithPreview.file.name}:`, error)
          const errorMessage = error instanceof Error ? error.message : "Failed to upload image"
          
          // Update status to error
          setFiles((prev) => 
            prev.map((f, idx) => 
              idx === i ? { ...f, status: 'error', error: errorMessage } : f
            )
          )

          errorCount++
        }

        // Update overall progress
        const progress = ((i + 1) / totalFiles) * 100
        setOverallProgress(progress)
      }

      // Show summary toast
      if (successCount > 0 && errorCount === 0) {
        toast.success(`Successfully uploaded ${successCount} image${successCount > 1 ? 's' : ''}!`)
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(`Uploaded ${successCount} image${successCount > 1 ? 's' : ''}, ${errorCount} failed`)
      } else {
        toast.error(`Failed to upload ${errorCount} image${errorCount > 1 ? 's' : ''}`)
      }

      // Reset form after a short delay to show success states
      setTimeout(() => {
        setFiles([])
        setFormData({
          category: null,
        })
        setOverallProgress(0)
        
        // Notify parent and close
        if (successCount > 0) {
          onUploadSuccess()
          onClose()
        }
      }, 1500)
    } catch (error) {
      console.error("Error in upload process:", error)
      toast.error("An error occurred during upload. Please try again.")
      setOverallProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      // Clean up preview URLs
      files.forEach((f) => URL.revokeObjectURL(f.preview))
      setFiles([])
      setFormData({
        category: null,
      })
      setErrors({})
      setOverallProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      onClose()
    }
  }

  const removeFile = (index: number) => {
    const fileToRemove = files[index]
    URL.revokeObjectURL(fileToRemove.preview)
    setFiles((prev) => prev.filter((_, i) => i !== index))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.preview))
    }
  }, [files])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Images</DialogTitle>
          <DialogDescription>
            Upload one or more images to your gallery. Supported formats: JPEG, PNG, GIF, WebP, SVG
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Area */}
          <div className="space-y-2">
            <Label>Images {files.length > 0 && `(${files.length} selected)`}</Label>
            {files.length === 0 ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors min-h-[200px] flex items-center justify-center ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                } ${errors.files ? "border-red-500" : ""}`}
              >
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <IconPhoto className="size-12 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Drop your images here, or{" "}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary hover:underline"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum file size: {formatFileSize(MAX_FILE_SIZE)} per image
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supported: JPEG, PNG, GIF, WebP, SVG
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* File Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-2">
                  {files.map((fileWithPreview, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-muted group"
                    >
                      {/* Image Preview */}
                      <Image
                        src={fileWithPreview.preview}
                        alt={fileWithPreview.file.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      
                      {/* Status Overlay */}
                      {fileWithPreview.status === 'uploading' && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-center">
                            <IconLoader className="size-6 animate-spin text-white mx-auto mb-2" />
                            <p className="text-white text-xs">{fileWithPreview.uploadProgress}%</p>
                          </div>
                        </div>
                      )}
                      
                      {fileWithPreview.status === 'success' && (
                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                          <div className="bg-green-500 rounded-full p-2">
                            <IconUpload className="size-4 text-white" />
                          </div>
                        </div>
                      )}
                      
                      {fileWithPreview.status === 'error' && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                          <div className="bg-red-500 rounded-full p-2">
                            <IconX className="size-4 text-white" />
                          </div>
                        </div>
                      )}
                      
                      {/* Remove button */}
                      {!isUploading && fileWithPreview.status !== 'uploading' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-background/90 hover:bg-background shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity size-6"
                        >
                          <IconX className="size-3" />
                        </Button>
                      )}
                      
                      {/* File info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-medium truncate" title={fileWithPreview.file.name}>
                          {fileWithPreview.file.name}
                        </p>
                        <p className="text-white/80 text-xs">
                          {formatFileSize(fileWithPreview.file.size)}
                        </p>
                        {fileWithPreview.error && (
                          <p className="text-red-300 text-xs mt-1 truncate" title={fileWithPreview.error}>
                            {fileWithPreview.error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Add more files button */}
                {!isUploading && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <IconPhoto className="mr-2 size-4" />
                    Add More Images
                  </Button>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            )}
            {errors.files && <p className="text-sm text-red-500">{errors.files}</p>}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading images...</span>
                <span className="font-medium">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {files.filter(f => f.status === 'success').length} of {files.length} completed
              </p>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Category field - only show for restaurant businesses */}
            {businessType === 'restaurant' && (
              <div className="space-y-2">
                <Label htmlFor="category">Category (applies to all images)</Label>
                <Select
                  value={formData.category || "none"}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      category: value === "none" ? null : (value as 'Event' | 'Menu'),
                    })
                  }}
                  disabled={isUploading}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                    <SelectItem value="Menu">Menu</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select a category to organize all images into folders
                </p>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || files.length === 0}>
              {isUploading ? (
                <>
                  <IconLoader className="mr-2 size-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <IconUpload className="mr-2 size-4" />
                  Upload {files.length > 0 ? `${files.length} Image${files.length > 1 ? 's' : ''}` : 'Images'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

