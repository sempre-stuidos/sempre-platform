"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { IconUpload, IconX, IconLoader } from "@tabler/icons-react"
import { MenuItem, MenuCategory, MenuType, Menu } from "@/lib/types"
import { toast } from "sonner"

interface MenuItemFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: Partial<MenuItem>) => Promise<void>
  orgId: string
  clientId: number
  initialItem?: MenuItem | null
  categories: MenuCategory[]
  menus: Menu[]
}

export function MenuItemForm({
  isOpen,
  onClose,
  onSave,
  orgId,
  clientId,
  initialItem,
  categories,
  menus,
}: MenuItemFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    menuId: undefined as number | undefined,
    menuCategoryId: undefined as number | undefined,
    description: "",
    price: "",
    imageUrl: "",
    isVisible: true,
    isFeatured: false,
    position: 0,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter categories by selected menu
  // Only show categories that belong to the selected menu
  // When editing, also include the current category even if it's from a different menu (for display purposes)
  const filteredCategories = formData.menuId
    ? categories.filter(cat => {
        // Show categories for the selected menu
        if (cat.menuId === formData.menuId) return true
        // When editing, also show the current category if it exists (so it doesn't disappear)
        if (initialItem && cat.id === initialItem.menuCategoryId) return true
        return false
      })
    : []

  // Reset form when modal opens/closes or initialItem changes
  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        console.log('Setting form data from initialItem:', initialItem)
        setFormData({
          name: initialItem.name || "",
          menuId: initialItem.menuId,
          menuCategoryId: initialItem.menuCategoryId,
          description: initialItem.description || "",
          price: initialItem.priceCents ? (initialItem.priceCents / 100).toFixed(2) : (initialItem.price?.toFixed(2) || ""),
          imageUrl: initialItem.imageUrl || "",
          isVisible: initialItem.isVisible !== undefined ? initialItem.isVisible : true,
          isFeatured: initialItem.isFeatured || false,
          position: initialItem.position || 0,
        })
        setImagePreview(initialItem.imageUrl || "")
        setImageFile(null)
      } else {
        setFormData({
          name: "",
          menuId: undefined,
          menuCategoryId: undefined,
          description: "",
          price: "",
          imageUrl: "",
          isVisible: true,
          isFeatured: false,
          position: 0,
        })
        setImagePreview("")
        setImageFile(null)
      }
      setErrors({})
    }
  }, [isOpen, initialItem])

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB')
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageUpload = async () => {
    if (!imageFile) return null

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', imageFile)

      const response = await fetch(`/api/businesses/${orgId}/menu-items/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload image')
      }

      const { imageUrl } = await response.json()
      return imageUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.menuId || isNaN(formData.menuId) || formData.menuId <= 0) {
      newErrors.menuId = 'Menu is required'
    }

    if (!formData.menuCategoryId || isNaN(formData.menuCategoryId) || formData.menuCategoryId <= 0) {
      newErrors.menuCategoryId = 'Category is required'
    }

    if (!formData.price) {
      newErrors.price = 'Price is required'
    } else {
      const priceNum = parseFloat(formData.price)
      if (isNaN(priceNum) || priceNum <= 0) {
        newErrors.price = 'Price must be a positive number'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('Form data before validation:', formData)
    const isValid = validateForm()
    if (!isValid) {
      console.log('Validation failed, errors:', errors)
      return
    }

    setIsSaving(true)
    try {
      console.log('Submitting menu item with data:', {
        name: formData.name.trim(),
        menuId: formData.menuId,
        menuCategoryId: formData.menuCategoryId,
        priceCents: Math.round(parseFloat(formData.price) * 100),
      })
      // Upload image if a new file was selected
      let finalImageUrl = formData.imageUrl
      if (imageFile) {
        const uploadedUrl = await handleImageUpload()
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl
        } else {
          setIsSaving(false)
          return
        }
      }

      const priceCents = Math.round(parseFloat(formData.price) * 100)

      await onSave({
        name: formData.name.trim(),
        menuId: formData.menuId,
        menuCategoryId: formData.menuCategoryId,
        description: formData.description.trim() || undefined,
        priceCents,
        imageUrl: finalImageUrl || undefined,
        isVisible: formData.isVisible,
        isFeatured: formData.isFeatured,
        position: formData.position,
      })

      toast.success(initialItem ? 'Menu item updated successfully' : 'Menu item created successfully')
      onClose()
    } catch (error) {
      console.error('Error saving menu item:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save menu item')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving && !isUploading) {
      setFormData({
        name: "",
        menuId: undefined,
        menuCategoryId: undefined,
        description: "",
        price: "",
        imageUrl: "",
        isVisible: true,
        isFeatured: false,
        position: 0,
      })
      setImageFile(null)
      setImagePreview("")
      setErrors({})
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
          <DialogDescription>
            {initialItem ? 'Update menu item details' : 'Create a new menu item for your restaurant'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Garlic Bread"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="menu">
                Menu <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.menuId?.toString() || ""}
                onValueChange={(value) => {
                  if (value && value !== "") {
                    const parsedMenuId = parseInt(value, 10)
                    if (!isNaN(parsedMenuId) && parsedMenuId > 0) {
                      // Only clear category if the menu actually changed
                      const newCategoryId = formData.menuId === parsedMenuId 
                        ? formData.menuCategoryId 
                        : undefined
                      setFormData({ ...formData, menuId: parsedMenuId, menuCategoryId: newCategoryId })
                      // Clear menuId error if it exists
                      if (errors.menuId) {
                        setErrors({ ...errors, menuId: '' })
                      }
                    }
                  } else {
                    setFormData({ ...formData, menuId: undefined, menuCategoryId: undefined })
                  }
                }}
              >
                <SelectTrigger id="menu" className={errors.menuId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select menu" />
                </SelectTrigger>
                <SelectContent>
                  {menus.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id.toString()}>
                      {menu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.menuId && <p className="text-sm text-destructive">{errors.menuId}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.menuCategoryId?.toString() || ""}
                onValueChange={(value) => {
                  const parsedCategoryId = value ? parseInt(value, 10) : undefined
                  setFormData({ ...formData, menuCategoryId: parsedCategoryId })
                  // Clear category error if it exists
                  if (errors.menuCategoryId) {
                    setErrors({ ...errors, menuCategoryId: '' })
                  }
                }}
                disabled={!formData.menuId}
              >
                <SelectTrigger id="category" className={errors.menuCategoryId ? 'border-destructive' : ''}>
                  <SelectValue placeholder={formData.menuId ? "Select category" : "Select menu first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.length === 0 && formData.menuId ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No categories available for this menu
                    </div>
                  ) : (
                    filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.menuCategoryId && <p className="text-sm text-destructive">{errors.menuCategoryId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">
                Price ($) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className={errors.price ? 'border-destructive' : ''}
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Item description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Image</Label>
            <div className="flex items-center gap-4">
              {imagePreview && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview("")
                      setImageFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                      }
                    }}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                  >
                    <IconX className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex-1">
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
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isVisible"
                checked={formData.isVisible}
                onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked as boolean })}
              />
              <Label htmlFor="isVisible" className="cursor-pointer">
                Visible on menu
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFeatured"
                checked={formData.isFeatured}
                onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked as boolean })}
              />
              <Label htmlFor="isFeatured" className="cursor-pointer">
                Featured item
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving || isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || isUploading}>
              {isSaving || isUploading ? (
                <>
                  <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                initialItem ? 'Update Item' : 'Create Item'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

