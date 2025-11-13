"use client"

import { useState } from "react"
import { PageSection } from "@/lib/types"
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

interface PageSectionsTableProps {
  orgId: string
  clientId: number
  initialSections: PageSection[]
}

export function PageSectionsTable({ orgId, clientId, initialSections }: PageSectionsTableProps) {
  const [sections, setSections] = useState(initialSections)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this section?')) {
      return
    }

    setIsDeleting(id)
    try {
      const response = await fetch(`/api/page-sections/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete section')
      }

      setSections(sections.filter(section => section.id !== id))
      toast.success('Section deleted successfully')
    } catch (error) {
      console.error('Error deleting section:', error)
      toast.error('Failed to delete section')
    } finally {
      setIsDeleting(null)
    }
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No page sections yet. Add your first section to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Section Name</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Content</TableHead>
            <TableHead>Order</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections.map((section) => (
            <TableRow key={section.id}>
              <TableCell className="font-medium">{section.sectionName}</TableCell>
              <TableCell>{section.title || '-'}</TableCell>
              <TableCell className="max-w-md truncate">{section.content || '-'}</TableCell>
              <TableCell>{section.order ?? 0}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.location.href = `/client/${orgId}/restaurant/sections/${section.id}/edit`}
                  >
                    <IconEdit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(section.id)}
                    disabled={isDeleting === section.id}
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

