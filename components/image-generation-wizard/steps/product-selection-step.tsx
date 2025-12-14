"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Product } from "@/lib/products"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface ProductSelectionStepProps {
  orgId: string
  selectedProductId: string | null
  onProductSelect: (productId: string) => void
  errors?: Record<string, string>
}

export function ProductSelectionStep({
  orgId,
  selectedProductId,
  onProductSelect,
  errors,
}: ProductSelectionStepProps) {
  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)

  React.useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/products/${orgId}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        } else {
          toast.error('Failed to load products')
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        toast.error('Failed to load products')
      } finally {
        setIsLoading(false)
      }
    }

    if (orgId) {
      fetchProducts()
    }
  }, [orgId])

  React.useEffect(() => {
    if (selectedProductId) {
      const product = products.find(p => p.id === selectedProductId)
      setSelectedProduct(product || null)
    } else {
      setSelectedProduct(null)
    }
  }, [selectedProductId, products])

  const handleProductChange = (productId: string) => {
    onProductSelect(productId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="space-y-4 text-center py-8">
        <p className="text-muted-foreground">No products found. Please create a product first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Select a Product</h2>
        <p className="text-muted-foreground">
          Choose a product to generate an image for
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="product">Product *</Label>
          <Select
            value={selectedProductId || ""}
            onValueChange={handleProductChange}
          >
            <SelectTrigger id="product">
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.selectedProductId && (
            <p className="text-sm text-red-500">{errors.selectedProductId}</p>
          )}
        </div>

        {selectedProduct && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex gap-4">
              {selectedProduct.image_url && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border shrink-0">
                  <Image
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1">{selectedProduct.name}</h3>
                {selectedProduct.price !== undefined && (
                  <p className="text-muted-foreground mb-2">
                    ${selectedProduct.price.toFixed(2)}
                  </p>
                )}
                {selectedProduct.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {selectedProduct.description}
                  </p>
                )}
              </div>
            </div>
            
            {selectedProduct.benefits && selectedProduct.benefits.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Key Features:</p>
                <ul className="space-y-1">
                  {selectedProduct.benefits.slice(0, 3).map((benefit, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
