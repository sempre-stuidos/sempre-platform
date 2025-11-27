"use client"

import { IconUpload, IconX, IconLoader, IconPhoto } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useState, useRef, DragEvent } from "react"
import { 
  uploadFileToStorage, 
  createFilesAssets, 
  formatFileSize, 
  getFileFormat 
} from "@/lib/files-assets"
import { FilesAssets } from "@/lib/types"
import { toast } from "sonner"

interface UploadImageModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: () => void
  orgId?: string
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB in bytes
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

export function UploadImageModal({ isOpen, onClose, onUploadSuccess, orgId }: UploadImageModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: "",
  })

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    if (!ACCEPTED_IMAGE_TYPES.includes(selectedFile.type)) {
      setErrors({ file: "Please select a valid image file (JPEG, PNG, GIF, WebP, or SVG)" })
      toast.error("Invalid file type. Please select an image file.")
      return
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrors({ file: `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit` })
      toast.error(`File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`)
      return
    }

    setFile(selectedFile)
    setErrors({})
    
    // Auto-populate name if empty
    if (!formData.name) {
      const nameWithoutExtension = selectedFile.name.replace(/\.[^/.]+$/, "")
      setFormData(prev => ({ ...prev, name: nameWithoutExtension }))
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

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!file) {
      newErrors.file = "Please select an image to upload"
    }

    if (!formData.name.trim()) {
      newErrors.name = "Image name is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !file) {
      return
    }

    setIsUploading(true)
    setUploadProgress(10)

    try {
      // Use a default project name for gallery images
      const projectName = "Gallery"
      
      // Upload file to Supabase storage
      const filePath = await uploadFileToStorage(file, projectName)
      
      if (!filePath) {
        throw new Error("Failed to upload image to storage")
      }

      setUploadProgress(50)

      // Get file metadata
      const fileSize = formatFileSize(file.size)
      const fileFormat = getFileFormat(file.name)
      const uploadedDate = new Date().toISOString().split('T')[0]

      // Create database record
      const newFileAsset = await createFilesAssets({
        name: formData.name,
        type: "Images",
        category: "Client Assets",
        project: projectName,
        size: fileSize,
        format: fileFormat,
        uploaded: uploadedDate,
        status: "Active",
        file_url: filePath,
      })

      setUploadProgress(100)

      if (!newFileAsset) {
        throw new Error("Failed to create image record")
      }

      toast.success("Image uploaded successfully!")
      
      // Reset form
      setFile(null)
      setFormData({
        name: "",
      })
      setUploadProgress(0)
      
      // Notify parent and close
      onUploadSuccess()
      onClose()
    } catch (error) {
      console.error("Error uploading image:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image. Please try again."
      toast.error(errorMessage)
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      setFile(null)
      setFormData({
        name: "",
      })
      setErrors({})
      setUploadProgress(0)
      onClose()
    }
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
          <DialogDescription>
            Upload a new image to your gallery. Supported formats: JPEG, PNG, GIF, WebP, SVG
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Area */}
          <div className="space-y-2">
            <Label>Image</Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-2 text-center transition-colors min-h-[300px] flex items-center justify-center ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              } ${errors.file ? "border-red-500" : ""} ${file ? "p-0 border-0" : ""}`}
            >
              {!file ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <IconPhoto className="size-12 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Drop your image here, or{" "}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary hover:underline"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supported: JPEG, PNG, GIF, WebP, SVG
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>
              ) : (
                <div className="relative w-full h-full min-h-[300px] rounded-lg overflow-hidden group">
                  {/* Image Preview - fills container */}
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {/* Remove button overlay */}
                  {!isUploading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      className="absolute top-2 right-2 bg-background/90 hover:bg-background shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <IconX className="size-4" />
                    </Button>
                  )}
                  {/* File info overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium truncate">{file.name}</p>
                    <p className="text-white/80 text-xs">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {errors.file && <p className="text-sm text-red-500">{errors.file}</p>}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Image Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter image name"
                className={errors.name ? "border-red-500" : ""}
                disabled={isUploading}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !file}>
              {isUploading ? (
                <>
                  <IconLoader className="mr-2 size-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <IconUpload className="mr-2 size-4" />
                  Upload Image
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

