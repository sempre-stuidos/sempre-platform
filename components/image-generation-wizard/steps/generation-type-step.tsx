"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Package, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface GenerationTypeStepProps {
  generationType: 'product' | 'image' | null
  onSelect: (type: 'product' | 'image') => void
  errors?: Record<string, string>
}

export function GenerationTypeStep({
  generationType,
  onSelect,
  errors,
}: GenerationTypeStepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">How would you like to generate the image?</h2>
        <p className="text-muted-foreground">
          Choose whether to generate from a product or edit an existing image
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            generationType === 'product' && "border-primary ring-2 ring-primary"
          )}
          onClick={() => onSelect('product')}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Package className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Generate from Product</h3>
            <p className="text-sm text-muted-foreground">
              Create an image based on product information
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            generationType === 'image' && "border-primary ring-2 ring-primary"
          )}
          onClick={() => onSelect('image')}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <ImageIcon className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Generate from Existing Image</h3>
            <p className="text-sm text-muted-foreground">
              Edit or transform an existing gallery image
            </p>
          </CardContent>
        </Card>
      </div>

      {errors?.generationType && (
        <p className="text-sm text-red-500 text-center mt-2">{errors.generationType}</p>
      )}
    </div>
  )
}
