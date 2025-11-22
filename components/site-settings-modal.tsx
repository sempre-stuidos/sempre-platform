"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import type { Business } from "@/lib/businesses"

interface SiteSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  business: Business | null
  onSuccess?: () => void
}

export function SiteSettingsModal({ 
  open, 
  onOpenChange, 
  business,
  onSuccess
}: SiteSettingsModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState({
    site_base_url: business?.site_base_url || '',
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (business) {
      setFormData({
        site_base_url: business.site_base_url || '',
      })
    }
  }, [business])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.site_base_url && formData.site_base_url.trim()) {
      try {
        new URL(formData.site_base_url)
      } catch {
        newErrors.site_base_url = 'Please enter a valid URL (e.g., https://example.com)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !business) {
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/businesses/${business.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_base_url: formData.site_base_url.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to update site settings')
        return
      }

      toast.success('Site settings updated successfully')
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error updating site settings:', error)
      toast.error('Failed to update site settings')
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

  if (!business) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Site Settings</DialogTitle>
          <DialogDescription>
            Configure the base URL for your site. This will be used for previews and public links if individual pages don&apos;t have their own base URL set.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site_base_url">Site Base URL (Optional)</Label>
            <Input
              id="site_base_url"
              type="url"
              value={formData.site_base_url}
              onChange={(e) => setFormData({ ...formData, site_base_url: e.target.value })}
              placeholder="https://example.com"
              className={errors.site_base_url ? "border-destructive" : ""}
            />
            {errors.site_base_url && (
              <p className="text-sm text-destructive">{errors.site_base_url}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Custom base URL for this business site. Used for previews and public links. If not set, will use the default site URL from environment variables. Individual pages can override this with their own base URL.
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

