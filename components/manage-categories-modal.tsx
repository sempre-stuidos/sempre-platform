"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconPlus, IconEdit, IconTrash, IconArrowLeft, IconLoader } from "@tabler/icons-react"
import { MenuCategory, Menu } from "@/lib/types"
import { toast } from "sonner"

interface ManageCategoriesModalProps {
  isOpen: boolean
  onClose: () => void
  orgId: string
  clientId: number
  initialCategories: MenuCategory[]
  onCategoriesChange?: (categories: MenuCategory[]) => void
  menus: Menu[]
}

export function ManageCategoriesModal({
  isOpen,
  onClose,
  orgId,
  clientId,
  initialCategories,
  onCategoriesChange,
  menus = [],
}: ManageCategoriesModalProps) {
  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories)
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [menuFilter, setMenuFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    menuId: undefined as number | undefined,
    sortOrder: 0,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      setView('list')
      setEditingCategory(null)
    }
  }, [isOpen, orgId])

  // Reset form when switching to form view
  useEffect(() => {
    if (view === 'form') {
      if (editingCategory) {
        setFormData({
          name: editingCategory.name || "",
          menuId: editingCategory.menuId,
          sortOrder: editingCategory.sortOrder || 0,
        })
      } else {
        setFormData({
          name: "",
          menuId: undefined,
          sortOrder: 0,
        })
      }
      setErrors({})
    }
  }, [view, editingCategory])

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/businesses/${orgId}/menu-categories`)
      if (response.ok) {
        const { categories: fetchedCategories } = await response.json()
        setCategories(fetchedCategories || [])
        onCategoriesChange?.(fetchedCategories || [])
      } else if (response.status === 404) {
        // No client linked - use empty array (dummy mode)
        setCategories([])
        onCategoriesChange?.([])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filter categories by menu
  const filteredCategories = useMemo(() => {
    if (menuFilter === "all") {
      return categories
    }
    return categories.filter(cat => cat.menuId === parseInt(menuFilter))
  }, [categories, menuFilter])

  // Group categories by menu for display
  const groupedCategories = useMemo(() => {
    const grouped: Record<string, MenuCategory[]> = {}
    filteredCategories.forEach(cat => {
      const menu = menus.find(m => m.id === cat.menuId)
      const menuName = menu?.name || 'Uncategorized'
      if (!grouped[menuName]) {
        grouped[menuName] = []
      }
      grouped[menuName].push(cat)
    })
    return grouped
  }, [filteredCategories, menus])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.menuId) {
      newErrors.menuId = 'Menu is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    try {
      const url = editingCategory
        ? `/api/businesses/${orgId}/menu-categories/${editingCategory.id}`
        : `/api/businesses/${orgId}/menu-categories`

      const method = editingCategory ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          menuId: formData.menuId,
          sortOrder: formData.sortOrder,
          isActive: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        if (response.status === 404 && error.error?.includes('Client not found')) {
          toast.info('This is a demo. Connect a client to save categories.')
          setView('list')
          setEditingCategory(null)
          return
        }
        throw new Error(error.error || 'Failed to save category')
      }

      toast.success(editingCategory ? 'Category updated successfully' : 'Category created successfully')
      await fetchCategories()
      setView('list')
      setEditingCategory(null)
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save category')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (category: MenuCategory) => {
    setEditingCategory(category)
    setView('form')
  }

  const handleAddCategory = () => {
    setEditingCategory(null)
    setView('form')
  }

  const handleCancelForm = () => {
    setView('list')
    setEditingCategory(null)
    setFormData({
      name: "",
      menuId: undefined,
      sortOrder: 0,
    })
    setErrors({})
  }

  const handleDelete = async (category: MenuCategory) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This will remove it from all menu items using this category.`)) {
      return
    }

    try {
      const response = await fetch(`/api/businesses/${orgId}/menu-categories/${category.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        if (response.status === 404) {
          toast.info('This is a demo. Connect a client to manage categories.')
          return
        }
        throw new Error('Failed to delete category')
      }

      toast.success('Category deleted successfully')
      await fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {view === 'form' ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancelForm}
                  className="h-6 w-6"
                >
                  <IconArrowLeft className="h-4 w-4" />
                </Button>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </div>
            ) : (
              'Manage Categories'
            )}
          </DialogTitle>
          <DialogDescription>
            {view === 'form'
              ? editingCategory
                ? 'Update category details'
                : 'Create a new menu category'
              : 'Create and manage menu categories for your restaurant'}
          </DialogDescription>
        </DialogHeader>

        {view === 'form' ? (
          /* Category Form View */
          <form onSubmit={handleSave} className="space-y-4">
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
              <Label htmlFor="menu">
                Menu <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.menuId?.toString() || ""}
                onValueChange={(value) => {
                  setFormData({ ...formData, menuId: parseInt(value) })
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
              <p className="text-xs text-muted-foreground">
                This category will be available for the selected menu
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

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCancelForm} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingCategory ? 'Update Category' : 'Create Category'
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* Categories List View */
          <div className="space-y-4">
            {/* Header with Add button and filter */}
            <div className="flex items-center justify-between">
              <Select value={menuFilter} onValueChange={setMenuFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by menu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Menus</SelectItem>
                  {menus.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id.toString()}>
                      {menu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleAddCategory}>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>

            {/* Categories List */}
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading categories...</p>
              </div>
            ) : Object.keys(groupedCategories).length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <p className="text-muted-foreground">
                  {menuFilter !== "all"
                    ? 'No categories found for the selected menu'
                    : 'No categories yet. Add your first category to get started.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedCategories).map(([menuName, categoryGroup]) => (
                  <div key={menuName} className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {menuName}
                    </h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Menu</TableHead>
                            <TableHead>Sort Order</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryGroup.map((category) => {
                            const menu = menus.find(m => m.id === category.menuId)
                            return (
                              <TableRow key={category.id}>
                                <TableCell className="font-medium">{category.name}</TableCell>
                                <TableCell>{menu?.name || 'Uncategorized'}</TableCell>
                                <TableCell>{category.sortOrder}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(category)}
                                      title="Edit"
                                    >
                                      <IconEdit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete(category)}
                                      title="Delete"
                                    >
                                      <IconTrash className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

