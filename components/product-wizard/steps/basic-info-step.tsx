"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface BasicInfoStepProps {
  name: string
  imageUrl: string
  description: string
  onNameChange: (name: string) => void
  onImageChange: (url: string) => void
  onDescriptionChange: (description: string) => void
  errors?: Record<string, string>
  orgId: string
}

export function BasicInfoStep({
  name,
  imageUrl,
  description,
  onNameChange,
  onImageChange,
  onDescriptionChange,
  errors,
  orgId,
}: BasicInfoStepProps) {
  const [isGeneratingDescription, setIsGeneratingDescription] = React.useState(false)
  const descriptionTextareaRef = React.useRef<HTMLTextAreaElement | null>(null)

  const handleGenerateDescription = async () => {
    if (!name?.trim()) {
      toast.error('Please enter a product name first')
      return
    }
    
    setIsGeneratingDescription(true)
    try {
      const response = await fetch('/api/products/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'description',
          productName: name,
          currentDescription: description || undefined
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate description' }))
        throw new Error(errorData.error || 'Failed to generate description')
      }
      
      const data = await response.json()
      onDescriptionChange(data.description)
      toast.success('Description generated successfully')
    } catch (error) {
      console.error('Error generating description:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate description. Please try again.')
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
        <p className="text-muted-foreground">
          Enter your product name and description. You'll add images in the next step.
        </p>
      </div>

      <div className="space-y-6">
        {/* Product Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Product Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter product name"
            className={cn(errors?.name ? "border-red-500" : "")}
          />
          {errors?.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center justify-between">
            <span>Description</span>
            {name?.trim() && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={isGeneratingDescription}
                className="h-auto py-1"
              >
                {isGeneratingDescription ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate with AI"
                )}
              </Button>
            )}
          </Label>
          <Textarea
            ref={descriptionTextareaRef}
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Enter a product description"
            rows={6}
            disabled={isGeneratingDescription}
          />
        </div>
      </div>
    </div>
  )
}
