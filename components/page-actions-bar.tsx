"use client"

import * as React from "react"
import { IconEye, IconCheck } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Organization } from "@/lib/types"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface PageActionsBarProps {
  orgId: string
  pageId: string
  pageSlug: string
  hasDirtySections: boolean
  organization: Organization | null
}

export function PageActionsBar({ orgId, pageId, pageSlug, hasDirtySections, organization }: PageActionsBarProps) {
  const router = useRouter()
  const [isPublishing, setIsPublishing] = React.useState(false)
  const [isPreviewing, setIsPreviewing] = React.useState(false)

  const handlePublishAll = async () => {
    try {
      setIsPublishing(true)
      
      const response = await fetch(`/api/pages/${pageId}/publish-all`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to publish all changes')
        return
      }

      toast.success('All changes published successfully')
      router.refresh()
    } catch (error) {
      console.error('Error publishing all sections:', error)
      toast.error('Failed to publish all changes')
    } finally {
      setIsPublishing(false)
    }
  }

  const handlePreview = async () => {
    try {
      setIsPreviewing(true)
      
      // Create preview token using API route
      const response = await fetch('/api/preview/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId,
          pageId,
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
      
      // Build preview URL using page slug
      const previewUrl = `${publicSiteUrl}/?page=${pageSlug}&token=${data.token}`
      
      // Open in new tab
      window.open(previewUrl, '_blank')
      
      toast.success('Opening preview in new tab')
    } catch (error) {
      console.error('Error creating preview:', error)
      toast.error('Failed to create preview')
    } finally {
      setIsPreviewing(false)
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      <div className="flex items-center gap-4">
        {hasDirtySections ? (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Has Unpublished Changes
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Published
          </Badge>
        )}
      </div>
      
      <div className="flex gap-2">
        {hasDirtySections && (
          <Button
            onClick={handlePublishAll}
            disabled={isPublishing}
            className="bg-primary text-primary-foreground"
          >
            <IconCheck className="h-4 w-4 mr-2" />
            {isPublishing ? 'Publishing...' : 'Publish All Changes'}
          </Button>
        )}
        <Button
          variant="outline"
          onClick={handlePreview}
          disabled={isPreviewing}
        >
          <IconEye className="h-4 w-4 mr-2" />
          {isPreviewing ? 'Opening...' : 'Preview Page'}
        </Button>
      </div>
    </div>
  )
}

