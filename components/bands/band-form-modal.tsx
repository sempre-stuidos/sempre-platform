"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Band } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import Image from "next/image"
import { Upload, X } from "lucide-react"
import { ProgressIndicator } from "@/components/event-wizard/progress-indicator"
import { cn } from "@/lib/utils"

interface BandFormModalProps {
  orgId: string
  band?: Band | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const STEP_LABELS = [
  "Basic Info",
  "Image",
]

export function BandFormModal({
  orgId,
  band,
  open,
  onOpenChange,
  onSuccess,
}: BandFormModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (band) {
      setName(band.name || "")
      setDescription(band.description || "")
      setImageUrl(band.image_url || "")
    } else {
      setName("")
      setDescription("")
      setImageUrl("")
    }
    // Reset to step 1 when modal opens
    if (open) {
      setCurrentStep(1)
      setErrors({})
    }
  }, [band, open])

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
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/businesses/${orgId}/gallery-images/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Failed to upload image")
      }

      const data = await response.json()
      if (!data?.imageUrl) {
        throw new Error("Upload did not return an image URL")
      }

      setImageUrl(data.imageUrl)
      toast.success("Image uploaded successfully")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload image")
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
    setImageUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (step === 1) {
      if (!name.trim()) {
        newErrors.name = "Band name is required"
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep(1)) {
        return
      }
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(1)) {
      return
    }

    setIsSubmitting(true)
    try {
      const url = band
        ? `/api/businesses/${orgId}/bands/${band.id}`
        : `/api/businesses/${orgId}/bands`

      const method = band ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          image_url: imageUrl || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Failed to save band",
        }))
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || "Failed to save band"
        throw new Error(errorMessage)
      }

      toast.success(band ? "Band updated successfully" : "Band created successfully")
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving band:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to save band"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Band Details</h2>
              <p className="text-muted-foreground">
                Give your band a name and description
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Band Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., The Blue Notes"
                  className={cn(
                    errors?.name ? "border-red-500" : ""
                  )}
                />
                {errors?.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Full band description..."
                  rows={6}
                />
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Band Image</h2>
              <p className="text-muted-foreground">
                Upload an image for your band (optional - you can skip this step)
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
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
                {imageUrl ? (
                  <div className="relative aspect-video w-full overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt="Band preview"
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

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Skip this step
                </button>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 mb-4">
            <DialogTitle className="text-xl font-bold tracking-tight">
              {band ? `Edit Band – ${band.name}` : "New Band"}
            </DialogTitle>
            <ProgressIndicator
              currentStep={currentStep}
              totalSteps={STEP_LABELS.length}
              stepLabels={STEP_LABELS}
            />
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {renderStep()}

          <div className="flex justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              )}

              {currentStep < STEP_LABELS.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting || isUploading}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isUploading}
                >
                  {isSubmitting
                    ? "Saving..."
                    : band
                    ? "Save Changes"
                    : "Create Band"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
