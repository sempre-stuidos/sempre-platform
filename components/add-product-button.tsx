"use client"

import { IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { AddProductModal } from "@/components/add-product-modal"
import { useState } from "react"
import { Product } from "@/lib/products"
import { toast } from "sonner"

interface AddProductButtonProps {
  orgId: string
  onProductSaved?: (product: Product) => void
}

export function AddProductButton({ orgId, onProductSaved }: AddProductButtonProps) {
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const handleSave = async (productData: Partial<Product>) => {
    try {
      const url = editingProduct 
        ? `/api/products/${orgId}/${editingProduct.id}`
        : `/api/products/${orgId}`
      
      const response = await fetch(url, {
        method: editingProduct ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...productData,
          org_id: orgId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save product')
      }

      const { product } = await response.json()
      toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully')
      setIsAddProductModalOpen(false)
      setEditingProduct(null)
      
      // Call the callback to update the table immediately
      if (onProductSaved) {
        onProductSaved(product)
      }
    } catch (error) {
      console.error('Error saving product:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save product'
      toast.error(`Failed to save product: ${errorMessage}`)
    }
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
          setEditingProduct(null)
          setIsAddProductModalOpen(true)
        }}
      >
        <IconPlus className="h-4 w-4 mr-2" />
        Add Product
      </Button>
      <AddProductModal
        open={isAddProductModalOpen}
        onOpenChange={setIsAddProductModalOpen}
        product={editingProduct}
        onSave={handleSave}
        orgId={orgId}
      />
    </>
  )
}

