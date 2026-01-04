"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconPlus, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

interface AdditionalInfoStepProps {
  sizes: string[]
  badges: string[]
  reviewCount?: number
  onSizesChange: (sizes: string[]) => void
  onBadgesChange: (badges: string[]) => void
  onReviewCountChange: (reviewCount?: number) => void
}

export function AdditionalInfoStep({
  sizes,
  badges,
  reviewCount,
  onSizesChange,
  onBadgesChange,
  onReviewCountChange,
}: AdditionalInfoStepProps) {
  // Initialize arrays if empty
  React.useEffect(() => {
    if (sizes.length === 0) {
      onSizesChange([''])
    }
    if (badges.length === 0) {
      onBadgesChange([''])
    }
  }, [])

  const handleAddSize = () => {
    onSizesChange([...sizes, ''])
  }

  const handleRemoveSize = (index: number) => {
    if (sizes.length > 1) {
      onSizesChange(sizes.filter((_, i) => i !== index))
    } else {
      onSizesChange([''])
    }
  }

  const handleSizeChange = (index: number, value: string) => {
    const newSizes = [...sizes]
    newSizes[index] = value
    onSizesChange(newSizes)
  }

  const handleAddBadge = () => {
    onBadgesChange([...badges, ''])
  }

  const handleRemoveBadge = (index: number) => {
    if (badges.length > 1) {
      onBadgesChange(badges.filter((_, i) => i !== index))
    } else {
      onBadgesChange([''])
    }
  }

  const handleBadgeChange = (index: number, value: string) => {
    const newBadges = [...badges]
    newBadges[index] = value
    onBadgesChange(newBadges)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Additional Information</h2>
        <p className="text-muted-foreground">
          Add sizes, badges, and review information
        </p>
      </div>

      <div className="space-y-8">
        {/* Sizes */}
        <div className="space-y-2">
          <Label>Sizes</Label>
          <p className="text-sm text-muted-foreground">
            List available product sizes (e.g., 30ml, 60ml, 100ml)
          </p>
          
          <div className="space-y-3">
            {sizes.map((size, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={size}
                  onChange={(e) => handleSizeChange(index, e.target.value)}
                  placeholder={`Size ${index + 1} (e.g., 30ml)`}
                  className="flex-1"
                />
                {sizes.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSize(index)}
                    className="shrink-0"
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddSize}
              className="w-full"
            >
              <IconPlus className="h-4 w-4 mr-2" />
              Add Size
            </Button>
          </div>
        </div>

        {/* Badges */}
        <div className="space-y-2">
          <Label>Badges</Label>
          <p className="text-sm text-muted-foreground">
            Add product badges or attributes (e.g., Vegan, Cruelty-Free, Made in Canada)
          </p>
          
          <div className="space-y-3">
            {badges.map((badge, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={badge}
                  onChange={(e) => handleBadgeChange(index, e.target.value)}
                  placeholder={`Badge ${index + 1} (e.g., Vegan)`}
                  className="flex-1"
                />
                {badges.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveBadge(index)}
                    className="shrink-0"
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddBadge}
              className="w-full"
            >
              <IconPlus className="h-4 w-4 mr-2" />
              Add Badge
            </Button>
          </div>
        </div>

        {/* Review Count */}
        <div className="space-y-2">
          <Label htmlFor="review_count">Review Count</Label>
          <p className="text-sm text-muted-foreground">
            Number of reviews for this product
          </p>
          <Input
            id="review_count"
            type="number"
            min="0"
            value={reviewCount !== undefined ? reviewCount : ""}
            onChange={(e) => onReviewCountChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  )
}

