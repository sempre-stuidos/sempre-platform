"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconPlus, IconEdit, IconTrash, IconArrowLeft, IconLoader } from "@tabler/icons-react"
import { Menu } from "@/lib/types"
import { toast } from "sonner"

interface ManageMenusModalProps {
  isOpen: boolean
  onClose: () => void
  orgId: string
  onMenusChange?: (menus: Menu[]) => void
}

export function ManageMenusModal({
  isOpen,
  onClose,
  orgId,
  onMenusChange,
}: ManageMenusModalProps) {
  const [menus, setMenus] = useState<Menu[]>([])
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch menus when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMenus()
      setView('list')
      setEditingMenu(null)
    }
  }, [isOpen, orgId])

  // Reset form when switching to form view
  useEffect(() => {
    if (view === 'form') {
      if (editingMenu) {
        setFormData({
          name: editingMenu.name || "",
          description: editingMenu.description || "",
        })
      } else {
        setFormData({
          name: "",
          description: "",
        })
      }
      setErrors({})
    }
  }, [view, editingMenu])

  const fetchMenus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/businesses/${orgId}/menus`)
      if (response.ok) {
        const { menus: fetchedMenus } = await response.json()
        setMenus(fetchedMenus || [])
        onMenusChange?.(fetchedMenus || [])
      } else if (response.status === 404) {
        setMenus([])
        onMenusChange?.([])
      }
    } catch (error) {
      console.error('Error fetching menus:', error)
      setMenus([])
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
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
      const url = editingMenu
        ? `/api/businesses/${orgId}/menus/${editingMenu.id}`
        : `/api/businesses/${orgId}/menus`

      const method = editingMenu ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        if (response.status === 404) {
          toast.info('This is a demo. Connect a client to save menus.')
          setView('list')
          setEditingMenu(null)
          return
        }
        throw new Error(error.error || 'Failed to save menu')
      }

      toast.success(editingMenu ? 'Menu updated successfully' : 'Menu created successfully')
      await fetchMenus()
      setView('list')
      setEditingMenu(null)
    } catch (error) {
      console.error('Error saving menu:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save menu')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu)
    setView('form')
  }

  const handleAddMenu = () => {
    setEditingMenu(null)
    setView('form')
  }

  const handleCancelForm = () => {
    setView('list')
    setEditingMenu(null)
    setFormData({
      name: "",
      description: "",
    })
    setErrors({})
  }

  const handleDelete = async (menu: Menu) => {
    if (!confirm(`Are you sure you want to delete "${menu.name}"? This will also delete all categories and items in this menu.`)) {
      return
    }

    try {
      const response = await fetch(`/api/businesses/${orgId}/menus/${menu.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        if (response.status === 404) {
          toast.info('This is a demo. Connect a client to manage menus.')
          return
        }
        throw new Error('Failed to delete menu')
      }

      toast.success('Menu deleted successfully')
      await fetchMenus()
    } catch (error) {
      console.error('Error deleting menu:', error)
      toast.error('Failed to delete menu')
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
                {editingMenu ? 'Edit Menu' : 'Add Menu'}
              </div>
            ) : (
              'Manage Menus'
            )}
          </DialogTitle>
          <DialogDescription>
            {view === 'form'
              ? editingMenu
                ? 'Update menu details'
                : 'Create a new menu for your restaurant'
              : 'Create and manage menus for your restaurant'}
          </DialogDescription>
        </DialogHeader>

        {view === 'form' ? (
          /* Menu Form View */
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Menu Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Dinner Menu, Brunch Menu, Lunch Menu"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description for this menu"
                rows={3}
              />
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
                  editingMenu ? 'Update Menu' : 'Create Menu'
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* Menus List View */
          <div className="space-y-4">
            <div className="flex items-center justify-end">
              <Button onClick={handleAddMenu}>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Menu
              </Button>
            </div>

            {/* Menus List */}
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading menus...</p>
              </div>
            ) : menus.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <p className="text-muted-foreground">
                  No menus yet. Add your first menu to get started.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menus.map((menu) => (
                      <TableRow key={menu.id}>
                        <TableCell className="font-medium">{menu.name}</TableCell>
                        <TableCell>{menu.description || '-'}</TableCell>
                        <TableCell>
                          {menu.isActive ? (
                            <span className="text-sm text-green-600">Active</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Inactive</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(menu)}
                              title="Edit"
                            >
                              <IconEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(menu)}
                              title="Delete"
                            >
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

