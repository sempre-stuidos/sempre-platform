"use client"

import { useState, useCallback, useEffect } from "react"
import { Product } from "@/lib/products"
import { ProductsDataTable } from "@/components/products-data-table"
import { AddProductButton } from "@/components/add-product-button"

interface ProductsPageClientProps {
  initialData: Product[]
  orgId: string
}

export function ProductsPageClient({ initialData, orgId }: ProductsPageClientProps) {
  const [products, setProducts] = useState<Product[]>(initialData)

  // Sync with initialData when it changes (e.g., from server refresh)
  useEffect(() => {
    setProducts(initialData)
  }, [initialData])

  const handleProductSaved = useCallback((product: Product) => {
    // Check if it's an update or new product
    setProducts(prev => {
      const existingIndex = prev.findIndex(p => p.id === product.id)
      if (existingIndex >= 0) {
        // Update existing product
        return prev.map(p => p.id === product.id ? product : p)
      } else {
        // Add new product at the beginning
        return [product, ...prev]
      }
    })
  }, [])

  const handleProductUpdated = useCallback((product: Product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p))
  }, [])

  const handleProductDeleted = useCallback((productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId))
  }, [])

  return (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-muted-foreground">
            Manage your retail products
          </p>
        </div>
        <AddProductButton orgId={orgId} onProductSaved={handleProductSaved} />
      </div>
      <ProductsDataTable 
        data={products} 
        orgId={orgId}
        onProductUpdated={handleProductUpdated}
        onProductDeleted={handleProductDeleted}
      />
    </>
  )
}

