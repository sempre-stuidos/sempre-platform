"use client"

import * as React from "react"
import {
  IconDotsVertical,
  IconEdit,
  IconStar,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"

import { useIsMobile } from "@/hooks/use-mobile"
import { Product } from "@/lib/products"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AddProductModal } from "@/components/add-product-modal"

const createColumns = (
  onEditProduct?: (product: Product) => void,
  onDeleteProduct?: (product: Product) => void
): ColumnDef<Product>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Product Name",
    cell: ({ row }) => {
      const product = row.original
      return (
        <div className="flex items-center gap-4">
          {product.image_url ? (
            <figure className="rounded-lg border overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                width={48}
                height={48}
                className="rounded-lg object-cover w-12 h-12"
                loading="lazy"
              />
            </figure>
          ) : (
            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted">
              <span className="text-xs text-muted-foreground">No Image</span>
            </div>
          )}
          <div className="capitalize">{product.name}</div>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.original.price
      return (
        <div className="text-sm font-medium">
          ${price.toFixed(2)}
        </div>
      )
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.original.category
      return (
        <div className="capitalize text-sm">
          {category || "-"}
        </div>
      )
    },
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.original.stock
      return (
        <div className="text-sm">
          {stock !== undefined ? stock : "-"}
        </div>
      )
    },
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => {
      const sku = row.original.sku
      return (
        <div className="text-sm font-mono">
          {sku || "-"}
        </div>
      )
    },
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => {
      const rating = row.original.rating
      if (rating === undefined || rating === null) {
        return <div className="text-sm text-muted-foreground">-</div>
      }
      return (
        <div className="flex items-center gap-1">
          <IconStar className="size-4 fill-orange-400 text-orange-400" />
          <span className="text-sm">{rating.toFixed(2)}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const statusConfig = {
        "active": {
          className: "border-green-400 bg-green-50 text-green-800 dark:bg-green-900/70 dark:text-white/80",
          label: "active"
        },
        "out of stock": {
          className: "border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-900/70 dark:text-white/80",
          label: "out of stock"
        },
        "closed for sale": {
          className: "border-red-400 bg-red-50 text-red-800 dark:bg-red-900/70 dark:text-white/80",
          label: "closed for sale"
        }
      }
      const config = statusConfig[status] || statusConfig["active"]
      return (
        <div>
          <Badge
            variant="outline"
            className={`${config.className} capitalize`}
          >
            {config.label}
          </Badge>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem onClick={() => onEditProduct?.(row.original)}>
            <IconEdit className="size-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => onDeleteProduct?.(row.original)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function ProductsDataTable({
  data: initialData,
  orgId,
}: {
  data: Product[]
  orgId: string
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 100, // Show all products by default, no pagination
  })
  const [isAddProductModalOpen, setIsAddProductModalOpen] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false)

  const handleAddProduct = async (productData: Partial<Product>) => {
    try {
      const response = await fetch(`/api/products/${orgId}`, {
        method: 'POST',
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
        throw new Error(error.error || 'Failed to create product')
      }

      const { product: newProduct } = await response.json()
      setData(prev => [...prev, newProduct])
      toast.success('Product created successfully')
      setIsAddProductModalOpen(false)
    } catch (error) {
      console.error('Error creating product:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create product'
      toast.error(`Failed to create product: ${errorMessage}`)
    }
  }

  const handleUpdateProduct = async (productData: Partial<Product>) => {
    if (!editingProduct) return
    
    try {
      const response = await fetch(`/api/products/${orgId}/${editingProduct.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update product')
      }

      const { product: updatedProduct } = await response.json()
      setData(prev => prev.map(p => p.id === editingProduct.id ? updatedProduct : p))
      toast.success('Product updated successfully')
      setEditingProduct(null)
      setIsAddProductModalOpen(false)
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Failed to update product')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${orgId}/${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete product')
      }

      setData(data.filter(product => product.id !== productId))
      toast.success('Product deleted successfully')
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }

  const openDeleteDialog = (product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setIsAddProductModalOpen(true)
  }

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedProducts = selectedRows.map(row => row.original)
    
    try {
      const deletePromises = selectedProducts.map(product => 
        fetch(`/api/products/${orgId}/${product.id}`, {
          method: 'DELETE',
        })
      )
      const results = await Promise.all(deletePromises)
      
      const successCount = results.filter(r => r.ok).length
      if (successCount > 0) {
        const deletedIds = selectedProducts.slice(0, successCount).map(p => p.id)
        setData(data.filter(product => !deletedIds.includes(product.id)))
        toast.success(`${successCount} product(s) deleted successfully`)
        table.resetRowSelection()
      }
      
      if (successCount < selectedProducts.length) {
        toast.error(`Failed to delete ${selectedProducts.length - successCount} product(s)`)
      }
    } catch (error) {
      console.error("Error deleting products:", error)
      toast.error("Failed to delete products")
    } finally {
      setBulkDeleteDialogOpen(false)
    }
  }

  const columns = React.useMemo(() => createColumns(handleEditProduct, openDeleteDialog), [])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // getPaginationRowModel: getPaginationRowModel(), // Disable pagination to match pages table
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const isMobile = useIsMobile()

  if (data.length === 0) {
    return (
      <>
        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground">No products found. Products will appear here once created.</p>
        </div>
        <AddProductModal
          open={isAddProductModalOpen}
          onOpenChange={setIsAddProductModalOpen}
          product={editingProduct}
          onSave={editingProduct ? handleUpdateProduct : handleAddProduct}
          orgId={orgId}
        />
      </>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No products found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

      <AddProductModal
        open={isAddProductModalOpen}
        onOpenChange={setIsAddProductModalOpen}
        product={editingProduct}
        onSave={editingProduct ? handleUpdateProduct : handleAddProduct}
        orgId={orgId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product "{productToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                productToDelete && handleDeleteProduct(productToDelete.id)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              {table.getFilteredSelectedRowModel().rows.length} selected
              product(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

