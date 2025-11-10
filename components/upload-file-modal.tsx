"use client"

import { IconUpload, IconX, IconFileCheck, IconLoader } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useState, useRef, DragEvent, useEffect } from "react"
import { 
  uploadFileToStorage, 
  createFilesAssets, 
  formatFileSize, 
  getFileFormat 
} from "@/lib/files-assets"
import { getAllProjects } from "@/lib/projects"
import { FilesAssets, Project } from "@/lib/types"
import { toast } from "sonner"

interface UploadFileModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: () => void
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB in bytes

export function UploadFileModal({ isOpen, onClose, onUploadSuccess }: UploadFileModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    type: "Document" as FilesAssets['type'],
    category: "Project Assets" as FilesAssets['category'],
    project: "",
    status: "Draft" as FilesAssets['status'],
  })

  // Fetch projects when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoadingProjects(true)
      getAllProjects().then((projectList) => {
        setProjects(projectList)
        setIsLoadingProjects(false)
      })
    }
  }, [isOpen])

  const handleFileSelect = (selectedFile: File) => {
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
      newErrors.file = "Please select a file to upload"
    }

    if (!formData.name.trim()) {
      newErrors.name = "File name is required"
    }

    if (!formData.project.trim()) {
      newErrors.project = "Project name is required"
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
      // Upload file to Supabase storage
      const filePath = await uploadFileToStorage(file, formData.project)
      
      if (!filePath) {
        throw new Error("Failed to upload file to storage")
      }

      setUploadProgress(50)

      // Get file metadata
      const fileSize = formatFileSize(file.size)
      const fileFormat = getFileFormat(file.name)
      const uploadedDate = new Date().toISOString().split('T')[0]

      // Create database record
      const newFileAsset = await createFilesAssets({
        name: formData.name,
        type: formData.type,
        category: formData.category,
        project: formData.project,
        size: fileSize,
        format: fileFormat,
        uploaded: uploadedDate,
        status: formData.status,
        file_url: filePath,
      })

      setUploadProgress(100)

      if (!newFileAsset) {
        throw new Error("Failed to create file record")
      }

      toast.success("File uploaded successfully!")
      
      // Reset form
      setFile(null)
      setFormData({
        name: "",
        type: "Document",
        category: "Project Assets",
        project: "",
        status: "Draft",
      })
      setUploadProgress(0)
      
      // Notify parent and close
      onUploadSuccess()
      onClose()
    } catch (error) {
      console.error("Error uploading file:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to upload file. Please try again."
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
        type: "Document",
        category: "Project Assets",
        project: "",
        status: "Draft",
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
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload a new file to your project assets with metadata and organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-2">
            <Label>File</Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              } ${errors.file ? "border-red-500" : ""}`}
            >
              {!file ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <IconUpload className="size-12 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Drop your file here, or{" "}
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
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <IconFileCheck className="size-8 text-green-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  {!isUploading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                    >
                      <IconX className="size-4" />
                    </Button>
                  )}
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">File Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter file name"
                className={errors.name ? "border-red-500" : ""}
                disabled={isUploading}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select
                value={formData.project}
                onValueChange={(value) => setFormData({ ...formData, project: value })}
                disabled={isUploading || isLoadingProjects}
              >
                <SelectTrigger className={errors.project ? "border-red-500" : ""}>
                  <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : "Select a project"} />
                </SelectTrigger>
                <SelectContent>
                  {projects.length === 0 ? (
                    <SelectItem value="no-projects" disabled>
                      No projects available
                    </SelectItem>
                  ) : (
                    projects.map((project) => (
                      <SelectItem key={project.id} value={project.name}>
                        {project.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.project && <p className="text-sm text-red-500">{errors.project}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: FilesAssets['type']) => setFormData({ ...formData, type: value })}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Logo">Logo</SelectItem>
                  <SelectItem value="Document">Document</SelectItem>
                  <SelectItem value="Mockup">Mockup</SelectItem>
                  <SelectItem value="Content">Content</SelectItem>
                  <SelectItem value="Images">Images</SelectItem>
                  <SelectItem value="Wireframe">Wireframe</SelectItem>
                  <SelectItem value="Prototype">Prototype</SelectItem>
                  <SelectItem value="Template">Template</SelectItem>
                  <SelectItem value="Video">Video</SelectItem>
                  <SelectItem value="Design System">Design System</SelectItem>
                  <SelectItem value="Icons">Icons</SelectItem>
                  <SelectItem value="Presentation">Presentation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: FilesAssets['category']) => setFormData({ ...formData, category: value })}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Client Assets">Client Assets</SelectItem>
                  <SelectItem value="Project Assets">Project Assets</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: FilesAssets['status']) => setFormData({ ...formData, status: value })}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Archive">Archive</SelectItem>
                </SelectContent>
              </Select>
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
                  Upload File
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

