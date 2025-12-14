"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProgressIndicator } from "../event-wizard/progress-indicator"
import { GenerationTypeStep } from "./steps/generation-type-step"
import { ProductSelectionStep } from "./steps/product-selection-step"
import { ImageSelectionStep } from "./steps/image-selection-step"
import { GeneratePreviewStep } from "./steps/generate-preview-step"
import { toast } from "sonner"
import { FilesAssets } from "@/lib/types"

interface ImageGenerationWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  businessType?: 'agency' | 'restaurant' | 'hotel' | 'retail' | 'service' | 'other'
  galleryImages: FilesAssets[]
  onImageGenerated?: () => void
}

interface WizardFormData {
  // Step 1
  generationType: 'product' | 'image' | null
  // Step 2a (product)
  selectedProductId: string | null
  // Step 2b (image)
  selectedImageId: string | null
  selectedImageUrl: string | null
  editPrompt: string
  // Step 3
  generatedImageUrl: string | null
  isGenerating: boolean
  generationProgress: number
  // Step 4
  isSaving: boolean
}

const STEP_LABELS = [
  "Type",
  "Configure",
  "Generate",
  "Save",
]

export function ImageGenerationWizard({
  open,
  onOpenChange,
  orgId,
  businessType,
  galleryImages,
  onImageGenerated,
}: ImageGenerationWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(1)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const initializeFormData = (): WizardFormData => {
    return {
      generationType: null,
      selectedProductId: null,
      selectedImageId: null,
      selectedImageUrl: null,
      editPrompt: "",
      generatedImageUrl: null,
      isGenerating: false,
      generationProgress: 0,
      isSaving: false,
    }
  }

  const [formData, setFormData] = React.useState<WizardFormData>(initializeFormData)

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setFormData(initializeFormData())
      setCurrentStep(1)
      setErrors({})
    }
  }, [open])

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.generationType) {
        newErrors.generationType = "Please select a generation type"
      }
    } else if (step === 2) {
      if (formData.generationType === 'product') {
        if (!formData.selectedProductId) {
          newErrors.selectedProductId = "Please select a product"
        }
      } else if (formData.generationType === 'image') {
        if (!formData.selectedImageId || !formData.selectedImageUrl) {
          newErrors.selectedImageId = "Please select an image"
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return
    }

    if (currentStep === 1) {
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setCurrentStep(3)
      // Trigger generation when moving to step 3
      setTimeout(() => {
        handleGenerate()
      }, 100)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleGenerate = async () => {
    if (!validateStep(2)) {
      return
    }

    setFormData((prev) => ({ ...prev, isGenerating: true, generationProgress: 0 }))

    try {
      const requestBody: {
        type: 'product' | 'image'
        orgId: string
        productId?: string
        sourceImageUrl?: string
        prompt?: string
      } = {
        type: formData.generationType!,
        orgId,
      }

      if (formData.generationType === 'product') {
        requestBody.productId = formData.selectedProductId!
      } else {
        requestBody.sourceImageUrl = formData.selectedImageUrl!
        if (formData.editPrompt.trim()) {
          requestBody.prompt = formData.editPrompt
        }
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setFormData((prev) => ({
          ...prev,
          generationProgress: Math.min(prev.generationProgress + 10, 90),
        }))
      }, 500)

      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate image' }))
        throw new Error(errorData.error || 'Failed to generate image')
      }

      const data = await response.json()
      
      if (!data.imageUrl) {
        throw new Error('No image URL returned from API')
      }
      
      setFormData((prev) => ({
        ...prev,
        generatedImageUrl: data.imageUrl,
        isGenerating: false,
        generationProgress: 100,
      }))

      toast.success('Image generated and saved successfully')
      
      // Auto-advance to save step after generation completes
      // The save happens automatically in the API, so we just show success
      setTimeout(() => {
        setCurrentStep(4)
        setFormData((prev) => ({ ...prev, isSaving: false }))
        // Refresh gallery and close
        onImageGenerated?.()
        setTimeout(() => {
          onOpenChange(false)
        }, 2000)
      }, 2000)
    } catch (error) {
      console.error('Error generating image:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate image')
      setFormData((prev) => ({
        ...prev,
        isGenerating: false,
        generationProgress: 0,
      }))
    }
  }

  const handleSave = async () => {
    // The API endpoint already saves the image automatically
    // This function is called after generation completes
    setFormData((prev) => ({ ...prev, isSaving: true }))
    
    // Image is already saved by the API, just refresh
    onImageGenerated?.()
    toast.success('Image saved to gallery')
    
    // Close wizard after a short delay
    setTimeout(() => {
      onOpenChange(false)
    }, 1000)
  }

  const renderStep = () => {
    if (currentStep === 1) {
      return (
        <GenerationTypeStep
          generationType={formData.generationType}
          onSelect={(type) => setFormData({ ...formData, generationType: type })}
          errors={errors}
        />
      )
    } else if (currentStep === 2) {
      if (formData.generationType === 'product') {
        return (
          <ProductSelectionStep
            orgId={orgId}
            selectedProductId={formData.selectedProductId}
            onProductSelect={(productId) =>
              setFormData({ ...formData, selectedProductId: productId })
            }
            errors={errors}
          />
        )
      } else {
        return (
          <ImageSelectionStep
            galleryImages={galleryImages}
            selectedImageId={formData.selectedImageId}
            selectedImageUrl={formData.selectedImageUrl}
            editPrompt={formData.editPrompt}
            onImageSelect={(imageId, imageUrl) =>
              setFormData({ ...formData, selectedImageId: imageId, selectedImageUrl: imageUrl })
            }
            onPromptChange={(prompt) => setFormData({ ...formData, editPrompt: prompt })}
            errors={errors}
          />
        )
      }
    } else if (currentStep === 3) {
      return (
        <GeneratePreviewStep
          generatedImageUrl={formData.generatedImageUrl}
          isGenerating={formData.isGenerating}
          generationProgress={formData.generationProgress}
        />
      )
    } else if (currentStep === 4) {
      return (
        <div className="space-y-4 text-center py-8">
          {formData.isSaving ? (
            <>
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
              <h2 className="text-2xl font-bold">Saving to Gallery</h2>
              <p className="text-muted-foreground">Your generated image is being saved...</p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold">Image Saved!</h2>
              <p className="text-muted-foreground">Your generated image has been added to the gallery.</p>
            </>
          )}
        </div>
      )
    }
    return null
  }

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.generationType !== null
    } else if (currentStep === 2) {
      if (formData.generationType === 'product') {
        return formData.selectedProductId !== null
      } else {
        return formData.selectedImageId !== null && formData.selectedImageUrl !== null
      }
    } else if (currentStep === 3) {
      return formData.generatedImageUrl !== null && !formData.isGenerating
    }
    return false
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Image with AI</DialogTitle>
          <DialogDescription>
            Create or edit images using AI image generation
          </DialogDescription>
        </DialogHeader>

        <ProgressIndicator
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          stepLabels={STEP_LABELS}
        />

        <div className="min-h-[400px] py-4">
          {renderStep()}
        </div>

        <div className="flex justify-between gap-2 pt-4 border-t">
          <div>
            {currentStep > 1 && currentStep < 4 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {currentStep < 4 && (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed() || formData.isGenerating || formData.isSaving}
              >
                {currentStep === 2 ? "Generate" : "Next"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
