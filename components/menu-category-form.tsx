"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconLoader } from "@tabler/icons-react"
import { MenuCategory, MenuType } from "@/lib/types"
import { toast } from "sonner"

interface MenuCategoryFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (category: Partial<MenuCategory>) => Promise<void>
  orgId: string
  clientId: number
  initialCategory?: MenuCategory | null
}

const MENU_TYPES: { value: MenuType; label: string }[] = [
  { value: 'brunch', label: 'Brunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'dessert', label: 'Dessert' },
]

// Helper to convert MenuType to string for Select value
const menuTypeToString = (menuType: MenuType): string => {
  return menuType || ''
}

// Helper to convert string to MenuType
const stringToMenuType = (value: string): MenuType => {
  return value === '' ? null : (value as MenuType)
}

export function MenuCategoryForm({
  isOpen,
  onClose,
  onSave,
  orgId,
  clientId,
  initialCategory,
}: MenuCategoryFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    menuType: null as MenuType,
    sortOrder: 0,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens/closes or initialCategory changes
  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        setFormData({
          name: initialCategory.name || "",
          menuType: initialCategory.menuType || null,
          sortOrder: initialCategory.sortOrder || 0,
        })
      } else {
        setFormData({
          name: "",
          menuType: null,
          sortOrder: 0,
        })
      }
      setErrors({})
    }
  }, [isOpen, initialCategory])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.menuType) {
      newErrors.menuType = 'Menu type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        name: formData.name.trim(),
        menuType: formData.menuType,
        sortOrder: formData.sortOrder,
        isActive: true,
      })

      toast.success(initialCategory ? 'Category updated successfully' : 'Category created successfully')
      onClose()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save category')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      setFormData({
        name: "",
        menuType: null,
        sortOrder: 0,
      })
      setErrors({})
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          <DialogDescription>
            {initialCategory ? 'Update category details' : 'Create a new menu category'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Category Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Starters, Mains, Desserts"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="menuType">
              Menu Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={menuTypeToString(formData.menuType)}
              onValueChange={(value) => {
                setFormData({ ...formData, menuType: stringToMenuType(value) })
              }}
            >
              <SelectTrigger id="menuType" className={errors.menuType ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select menu type" />
              </SelectTrigger>
              <SelectContent>
                {MENU_TYPES.map((type) => (
                  <SelectItem key={menuTypeToString(type.value)} value={menuTypeToString(type.value)}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.menuType && <p className="text-sm text-destructive">{errors.menuType}</p>}
            <p className="text-xs text-muted-foreground">
              This category will be available for the selected menu type
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              type="number"
              min="0"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first in the menu
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                initialCategory ? 'Update Category' : 'Create Category'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

