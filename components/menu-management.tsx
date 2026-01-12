"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconPlus, IconEdit, IconArchive, IconEye, IconEyeOff, IconSearch, IconX, IconDotsVertical, IconTrash, IconChevronLeft, IconChevronRight, IconChevronDown } from "@tabler/icons-react"
import { MenuItem, MenuCategory, MenuType, Menu } from "@/lib/types"
import { MenuItemForm } from "./menu-item-form"
import { ManageCategoriesModal } from "./manage-categories-modal"
import { ManageMenusModal } from "./manage-menus-modal"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface MenuManagementProps {
  orgId: string
  clientId: number
  initialItems: MenuItem[]
  initialCategories: MenuCategory[]
}


export function MenuManagement({
  orgId,
  clientId,
  initialItems,
  initialCategories,
}: MenuManagementProps) {
  const [items, setItems] = useState<MenuItem[]>(initialItems)
  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories)
  const [menus, setMenus] = useState<Menu[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false)
  const [isManageMenusOpen, setIsManageMenusOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [expandedItem, setExpandedItem] = useState<MenuItem | null>(null)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Filters
  const [menuFilter, setMenuFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [visibleOnly, setVisibleOnly] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Fetch menus, items and categories
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [menusRes, itemsRes, categoriesRes] = await Promise.all([
        fetch(`/api/businesses/${orgId}/menus`),
        fetch(`/api/businesses/${orgId}/menu-items?${new URLSearchParams({
          ...(menuFilter !== "all" && { menuId: menuFilter }),
          ...(categoryFilter !== "all" && { categoryId: categoryFilter }),
          ...(visibleOnly && { visibleOnly: "true" }),
          ...(showArchived && { includeArchived: "true" }),
          ...(searchQuery && { search: searchQuery }),
        })}`),
        fetch(`/api/businesses/${orgId}/menu-categories?${new URLSearchParams({
          ...(menuFilter !== "all" && { menuId: menuFilter }),
        })}`),
      ])

      if (menusRes.ok) {
        const { menus: fetchedMenus } = await menusRes.json()
        console.log('Fetched menus:', fetchedMenus)
        console.log('Number of menus:', fetchedMenus?.length || 0)
        setMenus(fetchedMenus || [])
      } else if (menusRes.status === 404) {
        setMenus([])
      } else {
        console.error('Error fetching menus:', menusRes.status, await menusRes.text())
        setMenus([])
      }

      if (itemsRes.ok) {
        const { items: fetchedItems } = await itemsRes.json()
        console.log('Fetched items:', fetchedItems)
        console.log('Number of items:', fetchedItems?.length || 0)
        setItems(fetchedItems || [])
      } else if (itemsRes.status === 404) {
        // No client linked - use empty array (dummy mode)
        setItems([])
      } else {
        console.error('Error fetching items:', itemsRes.status, await itemsRes.text())
        setItems([])
      }

      if (categoriesRes.ok) {
        const { categories: fetchedCategories } = await categoriesRes.json()
        console.log('Fetched categories:', fetchedCategories)
        console.log('Number of categories:', fetchedCategories?.length || 0)
        setCategories(fetchedCategories || [])
      } else {
        let errorData: { error?: string; details?: string } = {};
        try {
          errorData = await categoriesRes.json();
        } catch {
          const errorText = await categoriesRes.text();
          errorData = { error: errorText };
        }
        console.error('Error fetching categories:', categoriesRes.status, errorData)
        // Show error to user
        toast.error(`Failed to fetch categories: ${errorData.error || errorData.details || 'Unknown error'}`)
        // Don't set empty array on error - keep existing categories if any
        if (categoriesRes.status === 404) {
          setCategories([])
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      // Don't show error toast in dummy mode - just use empty arrays
      setItems([])
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [orgId, menuFilter, categoryFilter, visibleOnly, showArchived, searchQuery])

  // Filter items (no grouping - show as flat table with menu and category columns)
  const filteredItems = useMemo(() => {
    let filtered = [...items]

    // Apply filters (menu IDs are now UUIDs)
    if (menuFilter !== "all") {
      filtered = filtered.filter(item => String(item.menuId) === menuFilter);
    }

    if (categoryFilter !== "all") {
      const categoryFilterNum = Number(categoryFilter);
      filtered = filtered.filter(item => item.menuCategoryId === categoryFilterNum);
    }

    if (visibleOnly) {
      filtered = filtered.filter(item => item.isVisible)
    }

    if (!showArchived) {
      filtered = filtered.filter(item => !item.isArchived)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [items, menuFilter, categoryFilter, visibleOnly, showArchived, searchQuery])

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = filteredItems.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [menuFilter, categoryFilter, visibleOnly, showArchived, searchQuery])

  const handleSave = async (itemData: Partial<MenuItem>) => {
    try {
      const url = editingItem
        ? `/api/businesses/${orgId}/menu-items/${editingItem.id}`
        : `/api/businesses/${orgId}/menu-items`

      const method = editingItem ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      })

      if (!response.ok) {
        const error = await response.json()
        // In dummy mode (no client), show a friendly message
        if (response.status === 404 && error.error?.includes('Client not found')) {
          toast.info('This is a demo. Connect a client to save menu items.')
          setIsFormOpen(false)
          setEditingItem(null)
          return
        }
        throw new Error(error.error || 'Failed to save menu item')
      }

      await fetchData()
      setIsFormOpen(false)
      setEditingItem(null)
    } catch (error) {
      throw error
    }
  }

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  const handleCategoriesChange = (updatedCategories: MenuCategory[]) => {
    setCategories(updatedCategories)
    // Also refresh data to ensure everything is in sync
    fetchData()
  }

  const handleArchive = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to ${item.isArchived ? 'unarchive' : 'archive'} "${item.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/businesses/${orgId}/menu-items/${item.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: item.isArchived ? 'unarchive' : 'archive' }),
      })

      if (!response.ok) {
        if (response.status === 404) {
          toast.info('This is a demo. Connect a client to manage menu items.')
          return
        }
        throw new Error('Failed to archive menu item')
      }

      toast.success(`Menu item ${item.isArchived ? 'unarchived' : 'archived'} successfully`)
      await fetchData()
    } catch (error) {
      console.error('Error archiving menu item:', error)
      toast.error('Failed to archive menu item')
    }
  }

  const handleToggleVisibility = async (item: MenuItem) => {
    const newVisibility = !item.isVisible
    try {
      const response = await fetch(`/api/businesses/${orgId}/menu-items/${item.id}/visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: newVisibility }),
      })

      if (!response.ok) {
        if (response.status === 404) {
          toast.info('This is a demo. Connect a client to manage menu items.')
          return
        }
        throw new Error('Failed to toggle visibility')
      }

      toast.success(`Menu item ${newVisibility ? 'shown' : 'hidden'} successfully`)
      await fetchData()
    } catch (error) {
      console.error('Error toggling visibility:', error)
      toast.error('Failed to toggle visibility')
    }
  }

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/businesses/${orgId}/menu-items/${item.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        if (response.status === 404) {
          toast.info('This is a demo. Connect a client to delete menu items.')
          return
        }
        throw new Error(error.error || 'Failed to delete menu item')
      }

      toast.success('Menu item deleted successfully')
      await fetchData()
    } catch (error) {
      console.error('Error deleting menu item:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete menu item')
    }
  }

  const formatPrice = (item: MenuItem) => {
    if (item.priceCents !== undefined) {
      return `$${(item.priceCents / 100).toFixed(2)}`
    }
    if (item.price !== undefined) {
      return `$${item.price.toFixed(2)}`
    }
    return '-'
  }

  const handleMenusChange = (updatedMenus: Menu[]) => {
    setMenus(updatedMenus)
    // Also refresh data to ensure everything is in sync
    fetchData()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Menu Management</h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage your restaurant menu items and categories
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              setIsManageMenusOpen(true)
            }}
            className="flex-1 md:flex-initial"
          >
            <span className="hidden sm:inline">Manage Menus</span>
            <span className="sm:hidden">Menus</span>
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              setIsManageCategoriesOpen(true)
            }}
            className="flex-1 md:flex-initial"
          >
            <span className="hidden sm:inline">Manage Categories</span>
            <span className="sm:hidden">Categories</span>
          </Button>
          <Button 
            onClick={() => {
            setEditingItem(null)
            setIsFormOpen(true)
            }}
            size="sm"
            className="hidden md:flex"
          >
            <IconPlus className="mr-2 h-4 w-4" />
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="border rounded-lg bg-card">
        {/* Mobile: Collapsible Filters Dropdown */}
        <div className="md:hidden">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <span className="flex items-center gap-2">
              <IconSearch className="h-4 w-4" />
              Filters
            </span>
            <IconChevronDown className={`h-4 w-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
          </Button>
          {isFiltersOpen && (
            <div className="p-3 space-y-3 border-t">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <IconX className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Select value={menuFilter} onValueChange={setMenuFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Menu" />
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

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories
                    .filter(cat => {
                      if (menuFilter === "all") return true;
                      // Menu IDs are now UUIDs (strings)
                      return String(cat.menuId) === menuFilter;
                    })
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visibleOnly-mobile"
                  checked={visibleOnly}
                  onCheckedChange={(checked) => setVisibleOnly(checked as boolean)}
                />
                <Label htmlFor="visibleOnly-mobile" className="cursor-pointer text-sm">
                  Visible Only
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showArchived-mobile"
                  checked={showArchived}
                  onCheckedChange={(checked) => setShowArchived(checked as boolean)}
                />
                <Label htmlFor="showArchived-mobile" className="cursor-pointer text-sm">
                  Show Archived
                </Label>
              </div>
            </div>
          )}
        </div>

        {/* Desktop: Always Visible Filters */}
        <div className="hidden md:flex md:flex-wrap md:items-center md:gap-4 md:p-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <IconX className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <Select value={menuFilter} onValueChange={setMenuFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Menu" />
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

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories
              .filter(cat => {
                if (menuFilter === "all") return true;
                // Menu IDs are now UUIDs (strings)
                return String(cat.menuId) === menuFilter;
              })
              .map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="visibleOnly"
            checked={visibleOnly}
            onCheckedChange={(checked) => setVisibleOnly(checked as boolean)}
          />
          <Label htmlFor="visibleOnly" className="cursor-pointer text-sm">
            Visible Only
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="showArchived"
            checked={showArchived}
            onCheckedChange={(checked) => setShowArchived(checked as boolean)}
          />
          <Label htmlFor="showArchived" className="cursor-pointer text-sm">
            Show Archived
          </Label>
          </div>
        </div>
      </div>

      {/* Menu Items Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">
            {searchQuery || menuFilter !== "all" || categoryFilter !== "all"
              ? 'No items match your filters'
              : 'No menu items yet. Add your first item to get started.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View - Simplified */}
          <div className="md:hidden space-y-3">
            {paginatedItems.map((item) => {
              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base mb-2 truncate">{item.name}</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={item.isVisible ? "default" : "secondary"} className="text-xs">
                            {item.isVisible ? (
                              <>
                                <IconEye className="mr-1 h-3 w-3" />
                                Visible
                              </>
                            ) : (
                              <>
                                <IconEyeOff className="mr-1 h-3 w-3" />
                                Hidden
                              </>
                            )}
                          </Badge>
                          {item.isArchived && (
                            <Badge variant="outline" className="text-xs">
                              Archived
                            </Badge>
                          )}
                          {item.isFeatured && (
                            <Badge variant="outline" className="text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedItem(item)}
                        className="flex-shrink-0"
                      >
                        <span className="hidden xs:inline">View</span>
                        <span className="xs:hidden">Expand</span>
                        <IconChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {/* Mobile Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t pt-4">
                <div className="text-sm text-muted-foreground text-center">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredItems.length)} of {filteredItems.length} items
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <IconChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="min-w-[2.5rem]"
                          >
                            {page}
                          </Button>
                        )
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="px-2">...</span>
                      }
                      return null
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <IconChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Mobile Expanded Item Dialog */}
          {expandedItem && (() => {
            const menu = menus.find(m => String(m.id) === String(expandedItem.menuId))
            const category = categories.find(c => c.id === expandedItem.menuCategoryId)
            return (
              <Dialog open={!!expandedItem} onOpenChange={(open) => !open && setExpandedItem(null)}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{expandedItem.name}</DialogTitle>
                    <DialogDescription>
                      Menu item details
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Image */}
                    <div className="flex justify-center">
                      {expandedItem.imageUrl ? (
                        <img
                          src={expandedItem.imageUrl}
                          alt={expandedItem.name}
                          className="w-32 h-32 object-cover rounded"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>
                    
                    {/* Description */}
                    {expandedItem.description && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Description</div>
                        <div className="text-sm">{expandedItem.description}</div>
                      </div>
                    )}
                    
                    {/* Menu and Category */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Menu</div>
                        <div>{menu ? menu.name : 'No Menu'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Category</div>
                        <div>{category ? category.name : 'No Category'}</div>
                      </div>
                    </div>
                    
                    {/* Price */}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Price</div>
                      <div className="font-semibold text-lg">{formatPrice(expandedItem)}</div>
                    </div>
                    
                    {/* Status Badges */}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">Status</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={expandedItem.isVisible ? "default" : "secondary"} className="text-xs">
                          {expandedItem.isVisible ? (
                            <>
                              <IconEye className="mr-1 h-3 w-3" />
                              Visible
                            </>
                          ) : (
                            <>
                              <IconEyeOff className="mr-1 h-3 w-3" />
                              Hidden
                            </>
                          )}
                        </Badge>
                        {expandedItem.isArchived && (
                          <Badge variant="outline" className="text-xs">
                            Archived
                          </Badge>
                        )}
                        {expandedItem.isFeatured && (
                          <Badge variant="outline" className="text-xs">
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-4 border-t">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setExpandedItem(null)
                          handleEdit(expandedItem)
                        }}
                        className="w-full"
                      >
                        <IconEdit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleToggleVisibility(expandedItem)
                            setExpandedItem(null)
                          }}
                        >
                          {expandedItem.isVisible ? (
                            <>
                              <IconEyeOff className="mr-2 h-4 w-4" />
                              Hide
                            </>
                          ) : (
                            <>
                              <IconEye className="mr-2 h-4 w-4" />
                              Show
                            </>
                          )}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full">
                              <IconDotsVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              handleArchive(expandedItem)
                              setExpandedItem(null)
                            }}>
                              <IconArchive className="mr-2 h-4 w-4" />
                              {expandedItem.isArchived ? 'Unarchive' : 'Archive'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                handleDelete(expandedItem)
                                setExpandedItem(null)
                              }}
                              variant="destructive"
                            >
                              <IconTrash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )
          })()}

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-md border">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Menu</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => {
                const menu = menus.find(m => String(m.id) === String(item.menuId))
                const category = categories.find(c => c.id === item.menuCategoryId)
                const truncatedDescription = item.description 
                  ? (item.description.length > 30 ? item.description.substring(0, 30) + '...' : item.description)
                  : '-'
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{truncatedDescription}</span>
                    </TableCell>
                    <TableCell>
                      {menu ? (
                        <span className="text-sm">{menu.name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No Menu</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {category ? (
                        <span className="text-sm">{category.name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No Category</span>
                      )}
                    </TableCell>
                    <TableCell>{formatPrice(item)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={item.isVisible ? "default" : "secondary"}>
                          {item.isVisible ? (
                            <>
                              <IconEye className="mr-1 h-3 w-3" />
                              Visible
                            </>
                          ) : (
                            <>
                              <IconEyeOff className="mr-1 h-3 w-3" />
                              Hidden
                            </>
                          )}
                        </Badge>
                        {item.isArchived && (
                          <Badge variant="outline" className="text-xs">
                            Archived
                          </Badge>
                        )}
                        {item.isFeatured && (
                          <Badge variant="outline" className="text-xs">
                            Featured
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleVisibility(item)}>
                            {item.isVisible ? (
                              <>
                                <IconEyeOff className="mr-2 h-4 w-4" />
                                Make Hidden
                              </>
                            ) : (
                              <>
                                <IconEye className="mr-2 h-4 w-4" />
                                Make Visible
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchive(item)}>
                            <IconArchive className="mr-2 h-4 w-4" />
                            {item.isArchived ? 'Unarchive' : 'Archive'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(item)}
                            variant="destructive"
                          >
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
              </div>
            </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t px-4 py-3">
                <div className="text-sm text-muted-foreground text-center md:text-left">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredItems.length)} of {filteredItems.length} items
              </div>
                <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <IconChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="min-w-[2.5rem]"
                        >
                          {page}
                        </Button>
                      )
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="px-2">...</span>
                    }
                    return null
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                    <span className="hidden sm:inline">Next</span>
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        </>
      )}

      {/* Menu Item Form Dialog */}
      <MenuItemForm
        key={`${isFormOpen}-${categories.length}`}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingItem(null)
        }}
        onSave={handleSave}
        orgId={orgId}
        clientId={clientId}
        initialItem={editingItem}
        categories={categories}
        menus={menus}
      />

      {/* Manage Categories Modal */}
      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => {
          setIsManageCategoriesOpen(false)
        }}
        orgId={orgId}
        clientId={clientId}
        initialCategories={categories}
        onCategoriesChange={handleCategoriesChange}
        menus={menus}
      />

      {/* Manage Menus Modal */}
      <ManageMenusModal
        isOpen={isManageMenusOpen}
        onClose={() => {
          setIsManageMenusOpen(false)
        }}
        orgId={orgId}
        onMenusChange={handleMenusChange}
      />

      {/* Floating Action Button - Mobile Only */}
      <Button
        onClick={() => {
          setEditingItem(null)
          setIsFormOpen(true)
        }}
        size="icon"
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg md:hidden z-50"
        aria-label="Add Menu Item"
      >
        <IconPlus className="h-6 w-6" />
      </Button>
    </div>
  )
}

