"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import Image from "next/image"

interface GeneratePreviewStepProps {
  generatedImageUrl: string | null
  isGenerating: boolean
  generationProgress: number
}

export function GeneratePreviewStep({
  generatedImageUrl,
  isGenerating,
  generationProgress,
}: GeneratePreviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {isGenerating ? "Generating Image" : generatedImageUrl ? "Image Generated" : "Ready to Generate"}
        </h2>
        <p className="text-muted-foreground">
          {isGenerating
            ? "Please wait while we generate your image..."
            : generatedImageUrl
            ? "Preview your generated image below"
            : "Click Generate to create your image"}
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        {isGenerating ? (
          <div className="space-y-6 py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="w-full max-w-md">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {generationProgress}% complete
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                This may take a few moments...
              </p>
            </div>
          </div>
        ) : generatedImageUrl ? (
          <div className="space-y-4">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
              <Image
                src={generatedImageUrl}
                alt="Generated image"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Image generated successfully! Click "Save" to add it to your gallery.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Ready to generate. Click "Generate" to start.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
