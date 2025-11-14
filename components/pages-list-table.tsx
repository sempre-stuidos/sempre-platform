"use client"

import * as React from "react"
import { IconEdit, IconEye } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Page } from "@/lib/types"
import type { Organization } from "@/lib/organizations"
import { toast } from "sonner"

interface PagesListTableProps {
  orgId: string
  pages: (Page & { hasUnpublishedChanges?: boolean })[]
  organization: Organization | null
}

export function PagesListTable({ orgId, pages, organization }: PagesListTableProps) {
  const router = useRouter()
  const [previewingPageId, setPreviewingPageId] = React.useState<string | null>(null)

  const handlePreview = async (page: Page) => {
    try {
      setPreviewingPageId(page.id)
      
      // Create preview token using API route
      const response = await fetch('/api/preview/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId,
          pageId: page.id,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.token) {
        toast.error(data.error || 'Failed to create preview token')
        return
      }

      // Get organization slug for public site URL
      // Use orgId for public site URL (Organization type doesn't have slug)
      const orgSlug = orgId
      const publicSiteUrl = process.env.NEXT_PUBLIC_RESTAURANT_SITE_URL || 'http://localhost:3001'
      
      // Build preview URL using page slug
      const previewUrl = `${publicSiteUrl}/?page=${page.slug}&token=${data.token}`
      
      // Open in new tab
      window.open(previewUrl, '_blank')
      
      toast.success('Opening preview in new tab')
    } catch (error) {
      console.error('Error creating preview:', error)
      toast.error('Failed to create preview')
    } finally {
      setPreviewingPageId(null)
    }
  }

  const getStatusBadge = (page: Page & { hasUnpublishedChanges?: boolean }) => {
    if (page.hasUnpublishedChanges) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Has Unpublished Changes
        </Badge>
      )
    }
    if (page.status === 'published') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Published
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
        {page.status === 'draft' ? 'Draft' : 'Dirty'}
      </Badge>
    )
  }

  const getTemplateLabel = (template?: string) => {
    if (!template) return '-'
    // Humanize template names
    return template
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (pages.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No pages found. Pages will appear here once created.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Page</TableHead>
            <TableHead>Template</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => (
            <TableRow key={page.id}>
              <TableCell className="font-medium">{page.name}</TableCell>
              <TableCell>{getTemplateLabel(page.template)}</TableCell>
              <TableCell>{getStatusBadge(page)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/client/${orgId}/restaurant/pages/${page.id}`)}
                  >
                    <IconEdit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreview(page)}
                    disabled={previewingPageId === page.id}
                  >
                    <IconEye className="h-4 w-4 mr-2" />
                    Preview
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

