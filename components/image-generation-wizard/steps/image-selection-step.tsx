"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FilesAssets } from "@/lib/types"
import { getFilePublicUrl } from "@/lib/files-assets"
import { getGalleryImagePublicUrl } from "@/lib/gallery-images"
import { Check } from "lucide-react"
import Image from "next/image"

interface ImageSelectionStepProps {
  galleryImages: FilesAssets[]
  selectedImageId: string | null
  selectedImageUrl: string | null
  editPrompt: string
  onImageSelect: (imageId: string, imageUrl: string) => void
  onPromptChange: (prompt: string) => void
  errors?: Record<string, string>
}

export function ImageSelectionStep({
  galleryImages,
  selectedImageId,
  selectedImageUrl,
  editPrompt,
  onImageSelect,
  onPromptChange,
  errors,
}: ImageSelectionStepProps) {
  const getImageUrl = (file: FilesAssets): string | null => {
    if (!file.file_url) {
      return null
    }
    // Use gallery URL getter for gallery images, otherwise use file assets URL getter
    if (file.file_url.includes('/gallery/') || file.project === 'Gallery') {
      return getGalleryImagePublicUrl(file.file_url)
    }
    return getFilePublicUrl(file.file_url)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Select an Image</h2>
        <p className="text-muted-foreground">
          Choose an image from your gallery to edit or transform
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Image Grid */}
        {galleryImages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No images in gallery. Please upload an image first.</p>
          </div>
        ) : (
          <div>
            <Label className="mb-3 block">Select Image *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-2">
              {galleryImages.map((file) => {
                const imageUrl = getImageUrl(file)
                const isSelected = selectedImageId === file.id

                return (
                  <div
                    key={file.id}
                    className={`
                      relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all
                      ${isSelected ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-primary/50'}
                    `}
                    onClick={() => {
                      if (imageUrl) {
                        onImageSelect(file.id, imageUrl)
                      }
                    }}
                  >
                    {imageUrl ? (
                      <>
                        <Image
                          src={imageUrl}
                          alt={file.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="bg-primary text-primary-foreground rounded-full p-2">
                              <Check className="h-5 w-5" />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <p className="text-xs text-muted-foreground text-center px-2 truncate">
                          {file.name}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {errors?.selectedImageId && (
              <p className="text-sm text-red-500 mt-2">{errors.selectedImageId}</p>
            )}
          </div>
        )}

        {/* Selected Image Preview */}
        {selectedImageUrl && (
          <div className="border rounded-lg p-4 space-y-4">
            <Label>Selected Image Preview</Label>
            <div className="relative w-full h-48 rounded-lg overflow-hidden border">
              <Image
                src={selectedImageUrl}
                alt="Selected image"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* Edit Prompt */}
        <div className="grid gap-2">
          <Label htmlFor="editPrompt">Edit Instructions (Optional)</Label>
          <Textarea
            id="editPrompt"
            value={editPrompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Describe how you want to edit this image (optional)"
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            E.g., "Make it more vibrant", "Add a sunset background", "Change the color scheme", etc.
          </p>
        </div>
      </div>
    </div>
  )
}
