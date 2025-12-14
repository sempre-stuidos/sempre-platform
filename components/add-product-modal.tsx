"use client"

import { IconX, IconUpload, IconChevronLeft, IconChevronRight, IconPhoto, IconLink, IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect, useRef } from "react"
import { Product } from "@/lib/products"
import { toast } from "sonner"
import Image from "next/image"

interface AddProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSave: (product: Partial<Product>) => void
  orgId?: string
}

export function AddProductModal({ open, onOpenChange, product, onSave, orgId }: AddProductModalProps) {
  const [step, setStep] = useState(1)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [galleryImages, setGalleryImages] = useState<Array<{ id: number; url: string; name: string }>>([])
  const [isLoadingGallery, setIsLoadingGallery] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [imageUrlInput, setImageUrlInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [benefits, setBenefits] = useState<string[]>([''])

  const [formData, setFormData] = useState<Partial<Product>>(() => {
    if (product) {
      return {
        name: product.name || "",
        price: product.price,
        sku: product.sku || "",
        status: product.status || "active",
        category: product.category || "",
        stock: product.stock,
        rating: product.rating || 1,
        image_url: product.image_url || "",
        description: product.description || "",
        benefits: product.benefits || [],
      }
    }
    return {
      name: "",
      price: undefined,
      sku: "",
      status: "active",
      category: "",
      stock: undefined,
      rating: 1,
      image_url: "",
      description: "",
      benefits: [],
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        price: product.price,
        sku: product.sku || "",
        status: product.status || "active",
        category: product.category || "",
        stock: product.stock,
        rating: product.rating || 1,
        image_url: product.image_url || "",
        description: product.description || "",
        benefits: product.benefits || [],
      })
      if (product.image_url) {
        setImagePreview(product.image_url)
      }
      // Initialize benefits array - if empty, start with one empty field
      if (product.benefits && product.benefits.length > 0) {
        setBenefits(product.benefits)
      } else {
        setBenefits([''])
      }
      setStep(1) // Reset to step 1 when editing
    } else {
      setFormData({
        name: "",
        price: undefined,
        sku: "",
        status: "active",
        category: "",
        stock: undefined,
        rating: 1,
        image_url: "",
        description: "",
        benefits: [],
      })
      setImagePreview("")
      setImageFile(null)
      setBenefits([''])
      setStep(1) // Reset to step 1 for new products
    }
    setErrors({})
  }, [product, open])

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10MB")
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadImage = async () => {
    if (!imageFile || !orgId) return null

    setIsUploading(true)
    try {
      const formDataData = new FormData()
      formDataData.append("file", imageFile)

      const response = await fetch(`/api/businesses/${orgId}/gallery-images/upload`, {
        method: "POST",
        body: formDataData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Failed to upload image")
      }

      const data = await response.json()
      if (!data?.imageUrl) {
        throw new Error("Upload did not return an image URL")
      }

      setFormData((prev) => ({ ...prev, image_url: data.imageUrl }))
      toast.success("Image uploaded successfully")
      return data.imageUrl
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload image")
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = "Product name is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.price !== undefined && formData.price < 0) {
      newErrors.price = "Price must be a positive number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (step === 1) {
      if (!validateStep1()) {
        return
      }

      // Upload image if a new file was selected
      if (imageFile && orgId && !formData.image_url) {
        const uploadedUrl = await handleUploadImage()
        if (!uploadedUrl) {
          return
        }
      }

      setStep(2)
    } else if (step === 2) {
      if (!validateStep2()) {
        return
      }
      setStep(3)
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
    } else if (step === 3) {
      setStep(2)
    }
  }

  const handleAddBenefit = () => {
    setBenefits([...benefits, ''])
  }

  const handleRemoveBenefit = (index: number) => {
    if (benefits.length > 1) {
      setBenefits(benefits.filter((_, i) => i !== index))
    } else {
      // Keep at least one empty field
      setBenefits([''])
    }
  }

  const handleBenefitChange = (index: number, value: string) => {
    const newBenefits = [...benefits]
    newBenefits[index] = value
    setBenefits(newBenefits)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent submission if we're still on step 1
    if (step === 1) {
      handleNext()
      return
    }
    
    // If on step 2, move to step 3
    if (step === 2) {
      handleNext()
      return
    }
    
    // Step 3: Validate and submit
    if (step === 3) {
      // Filter out empty benefits and update formData
      const filteredBenefits = benefits.filter(b => b.trim() !== '')
      const finalFormData = {
        ...formData,
        benefits: filteredBenefits.length > 0 ? filteredBenefits : undefined,
      }

      // Upload image if not already uploaded
      if (imageFile && orgId && !formData.image_url) {
        const uploadedUrl = await handleUploadImage()
        if (!uploadedUrl) {
          return
        }
      }

      onSave(finalFormData)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview("")
    setImageFile(null)
    setFormData((prev) => ({ ...prev, image_url: "" }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const loadGalleryImages = async () => {
    if (!orgId) {
      toast.error('Organization ID is required')
      return
    }

    setIsLoadingGallery(true)
    try {
      const response = await fetch(`/api/businesses/${orgId}/gallery-images`)
      if (response.ok) {
        const data = await response.json()
        setGalleryImages((data.images || []).map((img: Record<string, unknown>) => ({
          id: img.id as number,
          url: (img.url || img.image_url) as string,
          name: (img.name || img.filename || img.title || 'Untitled') as string
        })))
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch gallery images' }))
        console.error('Error fetching gallery images:', errorData)
        toast.error(errorData.error || 'Failed to load gallery images')
      }
    } catch (error) {
      console.error('Error loading gallery:', error)
      toast.error('Failed to load gallery images')
    } finally {
      setIsLoadingGallery(false)
    }
  }

  const handleGallerySelect = (imageUrl: string) => {
    setImagePreview(imageUrl)
    setImageFile(null)
    setFormData((prev) => ({ ...prev, image_url: imageUrl }))
    setIsGalleryOpen(false)
    toast.success('Image selected from gallery')
  }

  const handleUrlSubmit = () => {
    if (!imageUrlInput.trim()) {
      toast.error('Please enter an image URL')
      return
    }

    // Basic URL validation
    try {
      new URL(imageUrlInput)
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    setImagePreview(imageUrlInput)
    setImageFile(null)
    setFormData((prev) => ({ ...prev, image_url: imageUrlInput }))
    setImageUrlInput("")
    setShowUrlInput(false)
    toast.success('Image URL set')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Step 1: Upload image and enter basic information"
              : step === 2
              ? "Step 2: Enter product details and pricing"
              : "Step 3: Add product benefits and features"}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              1
            </div>
            <span className="text-sm font-medium">Basic Info</span>
          </div>
          <div className="w-12 h-0.5 bg-border" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              2
            </div>
            <span className="text-sm font-medium">Details</span>
          </div>
          <div className="w-12 h-0.5 bg-border" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              3
            </div>
            <span className="text-sm font-medium">Benefits</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            <div className="grid gap-4 py-4">
              {/* Image Upload */}
              <div className="grid gap-2">
                <Label>Product Image</Label>
                <div className="flex items-start gap-4">
                  {imagePreview ? (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                      >
                        <IconX className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-lg border border-dashed flex items-center justify-center bg-muted/50">
                      <IconUpload className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleImageSelect(file)
                        }
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label
                      htmlFor="image-upload"
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-accent"
                    >
                      <IconUpload className="h-4 w-4" />
                      {imagePreview ? 'Change Image' : 'Upload Image'}
                    </Label>
                    {isUploading && (
                      <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                    )}
                    <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsGalleryOpen(true)
                            loadGalleryImages()
                          }}
                          className="w-full"
                        >
                          <IconPhoto className="h-4 w-4 mr-2" />
                          Import from Gallery
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Choose Image from Gallery</DialogTitle>
                          <DialogDescription>
                            Select an image from your gallery to use for this product
                          </DialogDescription>
                        </DialogHeader>
                        {isLoadingGallery ? (
                          <div className="flex items-center justify-center py-8">
                            <p className="text-muted-foreground">Loading gallery...</p>
                          </div>
                        ) : galleryImages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8">
                            <p className="text-muted-foreground mb-4">No images in gallery</p>
                            <Button
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <IconUpload className="h-4 w-4 mr-2" />
                              Upload Image
                            </Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-4 mt-4">
                            {galleryImages.map((image) => (
                              <div
                                key={image.id}
                                className="relative group cursor-pointer border rounded-lg overflow-hidden hover:border-primary transition-colors"
                                onClick={() => handleGallerySelect(image.url)}
                              >
                                <div className="relative aspect-square">
                                  <Image
                                    src={image.url}
                                    alt={image.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-xs truncate">
                                  {image.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    {!showUrlInput ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowUrlInput(true)}
                        className="w-full"
                      >
                        <IconLink className="h-4 w-4 mr-2" />
                        Paste Image URL
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleUrlSubmit()
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleUrlSubmit}
                        >
                          Set
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowUrlInput(false)
                            setImageUrlInput("")
                          }}
                        >
                          <IconX className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={4}
                />
              </div>
            </div>
          ) : step === 2 ? (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price !== undefined ? formData.price : ""}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0.00"
                    className={errors.price ? "border-red-500" : ""}
                  />
                  {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku || ""}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Enter SKU"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || "active"}
                    onValueChange={(value) => setFormData({ ...formData, status: value as Product["status"] })}
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

                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category || ""}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Electronics, Beauty"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock !== undefined ? formData.stock : ""}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="rating">Rating: {formData.rating || 1}</Label>
                  <input
                    type="range"
                    id="rating"
                    min="1"
                    max="5"
                    step="0.1"
                    value={formData.rating || 1}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>5</span>
                  </div>
                </div>
              </div>
            </div>
          ) : step === 3 ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Product Benefits/Features</Label>
                <p className="text-sm text-muted-foreground">
                  Enter key benefits or features that will be displayed on your product page
                </p>
                
                <div className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={benefit}
                        onChange={(e) => handleBenefitChange(index, e.target.value)}
                        placeholder={`Benefit ${index + 1} (e.g., Stimulates scalp for healthier growth)`}
                        className="flex-1"
                      />
                      {benefits.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveBenefit(index)}
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
                    onClick={handleAddBenefit}
                    className="w-full"
                  >
                    <IconPlus className="h-4 w-4 mr-2" />
                    Add Benefit
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex justify-between gap-2">
            <div>
              {(step === 2 || step === 3) && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  <IconChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {step === 1 || step === 2 ? (
                <Button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleNext()
                  }}
                >
                  Next
                  <IconChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit">
                  {product ? "Update Product" : "Add Product"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
