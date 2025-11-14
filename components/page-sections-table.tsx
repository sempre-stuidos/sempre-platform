"use client"

import * as React from "react"
import { IconEdit, IconEye } from "@tabler/icons-react"
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
import type { PageSectionV2, Organization } from "@/lib/types"
import { toast } from "sonner"
import { SectionEditorDrawer } from "@/components/section-editor-drawer"

interface PageSectionsTableProps {
  orgId: string
  pageId: string
  pageSlug: string
  sections: PageSectionV2[]
  organization: Organization | null
}

export function PageSectionsTable({ orgId, pageId, pageSlug, sections, organization }: PageSectionsTableProps) {
  const [editingSectionId, setEditingSectionId] = React.useState<string | null>(null)
  const [previewingSectionId, setPreviewingSectionId] = React.useState<string | null>(null)

  const handlePreview = async (section: PageSectionV2) => {
    try {
      setPreviewingSectionId(section.id)
      
      // Create preview token using API route
      const response = await fetch('/api/preview/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId,
          pageId,
          sectionId: section.id,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.token) {
        toast.error(data.error || 'Failed to create preview token')
        return
      }

      // Get organization slug for public site URL
      const orgSlug = organization?.slug || orgId
      const publicSiteUrl = process.env.NEXT_PUBLIC_RESTAURANT_SITE_URL || 'http://localhost:3001'
      
      // Build preview URL with section key using page slug
      const previewUrl = `${publicSiteUrl}/?page=${pageSlug}&section=${section.key}&token=${data.token}`
      
      // Open in new tab
      window.open(previewUrl, '_blank')
      
      toast.success('Opening preview in new tab')
    } catch (error) {
      console.error('Error creating preview:', error)
      toast.error('Failed to create preview')
    } finally {
      setPreviewingSectionId(null)
    }
  }

  const getStatusBadge = (section: PageSectionV2) => {
    if (section.status === 'dirty') {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Dirty
        </Badge>
      )
    }
    if (section.status === 'published') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Published
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
        Draft
      </Badge>
    )
  }

  const getComponentLabel = (component: string) => {
    // Humanize component names
    return component
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  if (sections.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No sections found for this page.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Section</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.map((section) => (
              <TableRow key={section.id}>
                <TableCell className="font-medium">{section.label}</TableCell>
                <TableCell>{getComponentLabel(section.component)}</TableCell>
                <TableCell>{getStatusBadge(section)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingSectionId(section.id)}
                    >
                      <IconEdit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(section)}
                      disabled={previewingSectionId === section.id}
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

      {editingSectionId && (
        <SectionEditorDrawer
          sectionId={editingSectionId}
          orgId={orgId}
          isOpen={!!editingSectionId}
          onClose={() => setEditingSectionId(null)}
        />
      )}
    </>
  )
}
