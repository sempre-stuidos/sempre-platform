"use client"

import * as React from "react"
import { IconEye } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import type { Business } from "@/lib/businesses"
import type { Page } from "@/lib/types"
import { toast } from "sonner"

interface PreviewPageButtonProps {
  orgId: string
  pageId: string
  pageSlug: string
  business: Business | null
  page: Page | null
}

export function PreviewPageButton({ orgId, pageId, pageSlug, business, page }: PreviewPageButtonProps) {
  const [isPreviewing, setIsPreviewing] = React.useState(false)

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

      // Use page's base_url if available, then business site_base_url, then env var
      const publicSiteUrl = page?.base_url || business?.site_base_url || process.env.NEXT_PUBLIC_RESTAURANT_SITE_URL || 'http://localhost:3001'
      
      // Build preview URL with business slug parameter (for luxivie landing page)
      const params = new URLSearchParams()
      params.set('page', pageSlug)
      params.set('token', data.token)
      if (business?.slug) {
        params.set('business', business.slug)
      }
      const previewUrl = `${publicSiteUrl}/?${params.toString()}`
      
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
    <Button
      variant="outline"
      onClick={handlePreview}
      disabled={isPreviewing}
    >
      <IconEye className="h-4 w-4 mr-2" />
      {isPreviewing ? 'Opening...' : 'Preview Page'}
    </Button>
  )
}

