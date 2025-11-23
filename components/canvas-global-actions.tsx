"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconCheck, IconX, IconDots } from "@tabler/icons-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface CanvasGlobalActionsProps {
  pageId: string
  hasDirtySections: boolean
  onPublishAll?: () => void
  onDiscardAll?: () => void
}

export function CanvasGlobalActions({ 
  pageId, 
  hasDirtySections,
  onPublishAll,
  onDiscardAll 
}: CanvasGlobalActionsProps) {
  const router = useRouter()
  const [isPublishing, setIsPublishing] = React.useState(false)
  const [isDiscarding, setIsDiscarding] = React.useState(false)

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
      onPublishAll?.()
      router.refresh()
    } catch (error) {
      console.error('Error publishing all sections:', error)
      toast.error('Failed to publish all changes')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleDiscardAll = async () => {
    if (!confirm('Are you sure you want to discard all draft changes? This cannot be undone.')) {
      return
    }

    try {
      setIsDiscarding(true)
      
      const response = await fetch(`/api/pages/${pageId}/discard-all`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to discard all changes')
        return
      }

      toast.success('All draft changes discarded')
      onDiscardAll?.()
      router.refresh()
    } catch (error) {
      console.error('Error discarding all sections:', error)
      toast.error('Failed to discard all changes')
    } finally {
      setIsDiscarding(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <IconDots className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={handleDiscardAll}
          disabled={isDiscarding || !hasDirtySections}
        >
          <IconX className="h-4 w-4 mr-2" />
          {isDiscarding ? 'Discarding...' : 'Discard All Changes'}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handlePublishAll}
          disabled={isPublishing || !hasDirtySections}
        >
          <IconCheck className="h-4 w-4 mr-2" />
          {isPublishing ? 'Publishing...' : 'Publish All Changes'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

