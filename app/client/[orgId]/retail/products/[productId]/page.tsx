"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { ProductWizard } from "@/components/product-wizard/product-wizard"
import { Product } from "@/lib/products"

export default function EditProductPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const productId = params.productId as string
  
  const [product, setProduct] = React.useState<Product | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/products/${orgId}/${productId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setProduct(null)
            return
          }
          throw new Error('Failed to fetch product')
        }

        const data = await response.json()
        setProduct(data.product)
      } catch (error) {
        console.error('Error fetching product:', error)
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }

    if (orgId && productId) {
      fetchProduct()
    }
  }, [orgId, productId])

  if (loading) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="rounded-lg border bg-card p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
              <p className="text-muted-foreground">
                The product you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <ProductWizard orgId={orgId} product={product} />
        </div>
      </div>
    </div>
  )
}

