"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressIndicator } from "./progress-indicator"
import { BasicInfoStep } from "./steps/basic-info-step"
import { ImageUploadStep } from "./steps/image-upload-step"
import { PricingInventoryStep } from "./steps/pricing-inventory-step"
import { ProductDetailsStep } from "./steps/product-details-step"
import { AdditionalInfoStep } from "./steps/additional-info-step"
import { Product } from "@/lib/products"
import { toast } from "sonner"

interface ProductWizardProps {
  orgId: string
  product?: Product | null
  onSave?: (product: Partial<Product>) => Promise<void>
}

interface WizardFormData {
  // Step 1: Basic Info
  name: string
  image_url: string
  description: string
  productImages: string[] // Multiple images for the product
  // Step 2: Pricing & Inventory
  price?: number
  original_price?: number
  sku: string
  status: 'active' | 'out of stock' | 'closed for sale'
  category: string
  stock?: number
  rating?: number
  is_bestseller?: boolean
  // Step 3: Product Details
  benefits: string[]
  ingredients: string[]
  how_to_use: string
  // Step 4: Additional Info
  sizes: string[]
  badges: string[]
  review_count?: number
}

const STEP_LABELS = [
  "Basic Info",
  "Images",
  "Pricing & Inventory",
  "Product Details",
  "Additional Info",
]

export function ProductWizard({ orgId, product, onSave }: ProductWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = React.useState(1)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Initialize form data from product or defaults
  const initializeFormData = (): WizardFormData => {
    if (product) {
      return {
        name: product.name || "",
        image_url: product.image_url || "",
        description: product.description || "",
        productImages: [], // Will be loaded from API
        price: product.price,
        original_price: product.original_price,
        sku: product.sku || "",
        status: product.status || "active",
        category: product.category || "",
        stock: product.stock,
        rating: product.rating || 1,
        is_bestseller: product.is_bestseller || false,
        benefits: product.benefits || [],
        ingredients: product.ingredients || [],
        how_to_use: product.how_to_use || "",
        sizes: product.sizes || [],
        badges: product.badges || [],
        review_count: product.review_count || 0,
      }
    }

    // Defaults for new product
    return {
      name: "",
      image_url: "",
      description: "",
      productImages: [],
      price: undefined,
      original_price: undefined,
      sku: "",
      status: "active",
      category: "",
      stock: undefined,
      rating: 1,
      is_bestseller: false,
      benefits: [],
      ingredients: [],
      how_to_use: "",
      sizes: [],
      badges: [],
      review_count: 0,
    }
  }

  const [formData, setFormData] =
    React.useState<WizardFormData>(initializeFormData)

  // Load product images when editing
  React.useEffect(() => {
    const loadProductImages = async () => {
      if (product?.id) {
        try {
          const response = await fetch(`/api/products/${orgId}/${product.id}/images`)
          if (response.ok) {
            const data = await response.json()
            // API already returns public URLs in the url field
            const imageUrls = (data.images || [])
              .map((img: { file_url?: string; url?: string }) => img.url || img.file_url || '')
              .filter((url: string) => url)
            
            setFormData(prev => {
              const updated = { ...prev, productImages: imageUrls }
              // Set first image as main image_url if not set
              if (imageUrls.length > 0 && !prev.image_url) {
                updated.image_url = imageUrls[0]
              }
              return updated
            })
          }
        } catch (error) {
          console.error('Error loading product images:', error)
        }
      }
    }
    loadProductImages()
  }, [product?.id, orgId])

  // Load from localStorage on mount
  React.useEffect(() => {
    if (!product) {
      const draftKey = `product-wizard-draft-${orgId}`
      const draft = localStorage.getItem(draftKey)
      if (draft) {
        try {
          const parsed = JSON.parse(draft)
          setFormData(parsed)
        } catch (e) {
          console.error("Failed to load draft:", e)
        }
      }
    }
  }, [orgId, product])

  // Save to localStorage on form data change
  React.useEffect(() => {
    if (!product) {
      const draftKey = `product-wizard-draft-${orgId}`
      localStorage.setItem(draftKey, JSON.stringify(formData))
    }
  }, [formData, orgId, product])

  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = "Product name is required"
      }
    }

    if (step === 2) {
      // Images step - require at least one image
      if (formData.productImages.length === 0) {
        newErrors.productImages = "Please add at least one product image"
      }
    }

    if (step === 3) {
      if (formData.price !== undefined && formData.price < 0) {
        newErrors.price = "Price must be a positive number"
      }
      if (formData.original_price !== undefined && formData.original_price < 0) {
        newErrors.original_price = "Original price must be a positive number"
      }
      if (formData.original_price !== undefined && formData.price !== undefined && formData.original_price <= formData.price) {
        newErrors.original_price = "Original price must be greater than current price"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, STEP_LABELS.length))
    }
  }

  const handleBack = () => {
    setCurrentStep(Math.max(currentStep - 1, 1))
    setErrors({})
  }

  const handleCancel = () => {
    if (!product) {
      const draftKey = `product-wizard-draft-${orgId}`
      localStorage.removeItem(draftKey)
    }
    router.push(`/client/${orgId}/retail/products`)
  }

  const buildProductData = (): Partial<Product> => {
    return {
      name: formData.name,
      image_url: formData.image_url || undefined,
      description: formData.description || undefined,
      price: formData.price,
      original_price: formData.original_price,
      sku: formData.sku || undefined,
      status: formData.status,
      category: formData.category || undefined,
      stock: formData.stock,
      rating: formData.rating,
      benefits: formData.benefits.filter(b => b.trim() !== ''),
      ingredients: formData.ingredients.filter(i => i.trim() !== ''),
      how_to_use: formData.how_to_use || undefined,
      sizes: formData.sizes.filter(s => s.trim() !== ''),
      badges: formData.badges.filter(b => b.trim() !== ''),
      review_count: formData.review_count,
      is_bestseller: formData.is_bestseller,
    } as Partial<Product>
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error("Please fix the errors before continuing")
      return
    }

    setIsSubmitting(true)
    try {
      const productData = buildProductData()

      let savedProduct
      if (onSave) {
        await onSave(productData)
        // For onSave callback, we need to get the product ID from the response
        // This assumes onSave returns the product or we need to refetch
        savedProduct = product
      } else {
        const url = product
          ? `/api/products/${orgId}/${product.id}`
          : `/api/products/${orgId}`

        const method = product ? "PATCH" : "POST"

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...productData,
            org_id: orgId,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: "Failed to save product",
          }))
          throw new Error(errorData.error || "Failed to save product")
        }

        const responseData = await response.json()
        savedProduct = responseData.product

        // Clear localStorage draft
        if (!product) {
          const draftKey = `product-wizard-draft-${orgId}`
          localStorage.removeItem(draftKey)
        }

        toast.success(product ? "Product updated successfully" : "Product created successfully")
      }

      // Link uploaded images to the product
      if (savedProduct?.id && formData.productImages.length > 0) {
        try {
          await fetch(`/api/products/${orgId}/${savedProduct.id}/images`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageUrls: formData.productImages,
              productName: formData.name,
            }),
          })
        } catch (error) {
          console.error('Error linking images to product:', error)
          // Don't fail the whole save if image linking fails
        }
      }

      router.replace(`/client/${orgId}/retail/products`)
    } catch (error) {
      console.error("Error saving product:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to save product"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            name={formData.name}
            imageUrl={formData.image_url}
            description={formData.description}
            onNameChange={(name) => setFormData({ ...formData, name })}
            onImageChange={(imageUrl) => setFormData({ ...formData, image_url: imageUrl })}
            onDescriptionChange={(description) => setFormData({ ...formData, description })}
            errors={errors}
            orgId={orgId}
          />
        )
      case 2:
        return (
          <ImageUploadStep
            productImages={formData.productImages}
            productName={formData.name}
            productId={product?.id}
            onProductImagesChange={(images) => {
              setFormData({ ...formData, productImages: images })
              // Set first image as main if not set
              if (images.length > 0 && !formData.image_url) {
                setFormData({ ...formData, productImages: images, image_url: images[0] })
              }
            }}
            onMainImageChange={(url) => setFormData({ ...formData, image_url: url })}
            errors={errors}
            orgId={orgId}
          />
        )
      case 3:
        return (
          <PricingInventoryStep
            price={formData.price}
            originalPrice={formData.original_price}
            sku={formData.sku}
            status={formData.status}
            category={formData.category}
            stock={formData.stock}
            rating={formData.rating}
            isBestseller={formData.is_bestseller}
            onPriceChange={(price) => setFormData({ ...formData, price })}
            onOriginalPriceChange={(originalPrice) => setFormData({ ...formData, original_price: originalPrice })}
            onSkuChange={(sku) => setFormData({ ...formData, sku })}
            onStatusChange={(status) => setFormData({ ...formData, status })}
            onCategoryChange={(category) => setFormData({ ...formData, category })}
            onStockChange={(stock) => setFormData({ ...formData, stock })}
            onRatingChange={(rating) => setFormData({ ...formData, rating })}
            onBestsellerChange={(isBestseller) => setFormData({ ...formData, is_bestseller: isBestseller })}
            errors={errors}
          />
        )
      case 4:
        return (
          <ProductDetailsStep
            benefits={formData.benefits}
            ingredients={formData.ingredients}
            howToUse={formData.how_to_use}
            onBenefitsChange={(benefits) => setFormData({ ...formData, benefits })}
            onIngredientsChange={(ingredients) => setFormData({ ...formData, ingredients })}
            onHowToUseChange={(howToUse) => setFormData({ ...formData, how_to_use: howToUse })}
            productName={formData.name}
          />
        )
      case 5:
        return (
          <AdditionalInfoStep
            sizes={formData.sizes}
            badges={formData.badges}
            reviewCount={formData.review_count}
            onSizesChange={(sizes) => setFormData({ ...formData, sizes })}
            onBadgesChange={(badges) => setFormData({ ...formData, badges })}
            onReviewCountChange={(reviewCount) => setFormData({ ...formData, review_count: reviewCount })}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {product ? `Edit Product – ${product.name}` : "New Product"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Step {currentStep} of {STEP_LABELS.length}
          </p>
        </div>
      </div>

      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={STEP_LABELS.length}
        stepLabels={STEP_LABELS}
      />

      <Card>
        <CardContent className="p-6 md:p-8">{renderStep()}</CardContent>
      </Card>

      <div className="flex justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}

          {currentStep < STEP_LABELS.length ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : product
                ? "Save Changes"
                : "Create Product"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

