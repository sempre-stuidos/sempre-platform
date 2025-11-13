"use client"

import { useState } from "react"
import { MenuItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconEdit, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

interface MenuItemsTableProps {
  orgId: string
  clientId: number
  initialItems: MenuItem[]
}

export function MenuItemsTable({ orgId, clientId, initialItems }: MenuItemsTableProps) {
  const [items, setItems] = useState(initialItems)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return
    }

    setIsDeleting(id)
    try {
      const response = await fetch(`/api/menu-items/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete menu item')
      }

      setItems(items.filter(item => item.id !== id))
      toast.success('Menu item deleted successfully')
    } catch (error) {
      console.error('Error deleting menu item:', error)
      toast.error('Failed to delete menu item')
    } finally {
      setIsDeleting(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No menu items yet. Add your first item to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.category || '-'}</TableCell>
              <TableCell className="max-w-md truncate">{item.description || '-'}</TableCell>
              <TableCell>{item.price ? `$${item.price.toFixed(2)}` : '-'}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.location.href = `/client/${orgId}/restaurant/menu/${item.id}/edit`}
                  >
                    <IconEdit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    disabled={isDeleting === item.id}
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
  )
}

