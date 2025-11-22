"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import type { Page } from "@/lib/types"

interface EditPageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  page: Page | null
  orgId: string
  onSuccess?: () => void
}

export function EditPageModal({ 
  open, 
  onOpenChange, 
  page,
  orgId,
  onSuccess
}: EditPageModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: page?.name || '',
    slug: page?.slug || '',
    base_url: page?.base_url || '',
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (page) {
      setFormData({
        name: page.name || '',
        slug: page.slug || '',
        base_url: page.base_url || '',
      })
    }
  }, [page])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Page name is required'
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Page slug is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
    }

    if (formData.base_url && formData.base_url.trim()) {
      try {
        new URL(formData.base_url)
      } catch {
        newErrors.base_url = 'Please enter a valid URL (e.g., https://example.com)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !page) {
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/pages/${page.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          base_url: formData.base_url.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to update page')
        return
      }

      toast.success('Page updated successfully')
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error updating page:', error)
      toast.error('Failed to update page')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors({})
      onOpenChange(false)
    }
  }

  if (!page) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Page Details</DialogTitle>
          <DialogDescription>
            Update the page name, slug, and base URL for previews and links.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Page Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Home Page"
              className={errors.name ? "border-destructive" : ""}
              required
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Page Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
              placeholder="e.g., home"
              className={errors.slug ? "border-destructive" : ""}
              required
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug}</p>
            )}
            <p className="text-xs text-muted-foreground">
              URL-friendly identifier (lowercase letters, numbers, and hyphens only)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_url">Base URL (Optional)</Label>
            <Input
              id="base_url"
              type="url"
              value={formData.base_url}
              onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              placeholder="https://example.com"
              className={errors.base_url ? "border-destructive" : ""}
            />
            {errors.base_url && (
              <p className="text-sm text-destructive">{errors.base_url}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Custom base URL for this page. Used for previews and public links. If not set, will use the default site URL.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

