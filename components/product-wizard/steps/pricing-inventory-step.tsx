"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface PricingInventoryStepProps {
  price?: number
  originalPrice?: number
  sku: string
  status: 'active' | 'out of stock' | 'closed for sale'
  category: string
  stock?: number
  rating?: number
  onPriceChange: (price?: number) => void
  onOriginalPriceChange: (originalPrice?: number) => void
  onSkuChange: (sku: string) => void
  onStatusChange: (status: 'active' | 'out of stock' | 'closed for sale') => void
  onCategoryChange: (category: string) => void
  onStockChange: (stock?: number) => void
  onRatingChange: (rating?: number) => void
  errors?: Record<string, string>
}

export function PricingInventoryStep({
  price,
  originalPrice,
  sku,
  status,
  category,
  stock,
  rating,
  onPriceChange,
  onOriginalPriceChange,
  onSkuChange,
  onStatusChange,
  onCategoryChange,
  onStockChange,
  onRatingChange,
  errors,
}: PricingInventoryStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Pricing & Inventory</h2>
        <p className="text-muted-foreground">
          Set your product pricing and inventory information
        </p>
      </div>

      <div className="space-y-6">
        {/* Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price !== undefined ? price : ""}
              onChange={(e) => onPriceChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0.00"
              className={cn(errors?.price ? "border-red-500" : "")}
            />
            {errors?.price && (
              <p className="text-sm text-red-500">{errors.price}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="original_price">Original Price</Label>
            <Input
              id="original_price"
              type="number"
              step="0.01"
              min="0"
              value={originalPrice !== undefined ? originalPrice : ""}
              onChange={(e) => onOriginalPriceChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0.00"
              className={cn(errors?.original_price ? "border-red-500" : "")}
            />
            <p className="text-xs text-muted-foreground">
              Original price before discount (optional)
            </p>
            {errors?.original_price && (
              <p className="text-sm text-red-500">{errors.original_price}</p>
            )}
          </div>
        </div>

        {/* SKU and Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={sku}
              onChange={(e) => onSkuChange(e.target.value)}
              placeholder="Enter SKU"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => onStatusChange(value as 'active' | 'out of stock' | 'closed for sale')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="out of stock">Out of Stock</SelectItem>
                <SelectItem value="closed for sale">Closed for Sale</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category and Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              placeholder="e.g., Electronics, Beauty"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={stock !== undefined ? stock : ""}
              onChange={(e) => onStockChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              placeholder="0"
            />
          </div>
        </div>

        {/* Rating */}
        <div className="space-y-2">
          <Label htmlFor="rating">Rating: {rating || 1}</Label>
          <input
            type="range"
            id="rating"
            min="1"
            max="5"
            step="0.1"
            value={rating || 1}
            onChange={(e) => onRatingChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span>5</span>
          </div>
        </div>
      </div>
    </div>
  )
}

