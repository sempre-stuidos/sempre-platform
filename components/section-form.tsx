"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { IconCheck, IconX, IconEye } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

interface SectionFormProps {
  component: string
  draftContent: Record<string, any>
  onContentChange: (content: Record<string, any>) => void
  sectionId: string
  orgId: string
  pageId: string
  pageSlug: string
  sectionKey: string
  onSave?: () => void
}

export function SectionForm({ component, draftContent, onContentChange, sectionId, orgId, pageId, pageSlug, sectionKey, onSave }: SectionFormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = React.useState(false)
  const [isPublishing, setIsPublishing] = React.useState(false)
  const [isDiscarding, setIsDiscarding] = React.useState(false)
  const [isPreviewing, setIsPreviewing] = React.useState(false)

  const handleSaveDraft = async (silent = false) => {
    try {
      setIsSaving(true)
      
      const response = await fetch(`/api/sections/${sectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          draftContent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (!silent) {
          toast.error(data.error || 'Failed to save draft')
        }
        return
      }

      if (!silent) {
        toast.success('Draft saved')
      }
      onSave?.()
      router.refresh()
    } catch (error) {
      console.error('Error saving draft:', error)
      if (!silent) {
        toast.error('Failed to save draft')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    try {
      setIsPublishing(true)
      
      const response = await fetch(`/api/sections/${sectionId}/publish`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to publish section')
        return
      }

      toast.success('Section published successfully')
      onSave?.()
      router.refresh()
    } catch (error) {
      console.error('Error publishing section:', error)
      toast.error('Failed to publish section')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleDiscard = async () => {
    try {
      setIsDiscarding(true)
      
      const response = await fetch(`/api/sections/${sectionId}/discard`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to discard changes')
        return
      }

      if (data.section) {
        const discardedContent = data.section.draft_content || {}
        onContentChange(discardedContent)
      }
      toast.success('Changes discarded')
      onSave?.()
      router.refresh()
    } catch (error) {
      console.error('Error discarding changes:', error)
      toast.error('Failed to discard changes')
    } finally {
      setIsDiscarding(false)
    }
  }

  const handlePreviewOnSite = async () => {
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
          sectionId,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.token) {
        toast.error(data.error || 'Failed to create preview token')
        return
      }

      const publicSiteUrl = process.env.NEXT_PUBLIC_RESTAURANT_SITE_URL || 'http://localhost:3001'
      
      // Build preview URL with section key
      const previewUrl = `${publicSiteUrl}/?page=${pageSlug}&section=${sectionKey}&token=${data.token}`
      
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

  const handleFieldChange = (field: string, value: any) => {
    onContentChange({
      ...draftContent,
      [field]: value,
    })
  }

  const handleArrayItemChange = (field: string, index: number, value: any) => {
    const array = draftContent[field] || []
    const newArray = [...array]
    newArray[index] = value
    onContentChange({
      ...draftContent,
      [field]: newArray,
    })
  }

  const handleArrayItemAdd = (field: string, defaultValue: any) => {
    const array = draftContent[field] || []
    onContentChange({
      ...draftContent,
      [field]: [...array, defaultValue],
    })
  }

  const handleArrayItemRemove = (field: string, index: number) => {
    const array = draftContent[field] || []
    const newArray = array.filter((_: any, i: number) => i !== index)
    onContentChange({
      ...draftContent,
      [field]: newArray,
    })
  }

  // Render form based on component type
  const renderForm = () => {
    switch (component) {
      case 'InfoBar':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                value={draftContent.hours || ''}
                onChange={(e) => handleFieldChange('hours', e.target.value)}
                placeholder="5PM - 11PM Daily"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={draftContent.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={draftContent.tagline || ''}
                onChange={(e) => handleFieldChange('tagline', e.target.value)}
                placeholder="Fine Dining Experience"
              />
            </div>
          </div>
        )

      case 'HeroWelcome':
      case 'HeroSection':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={draftContent.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Culinary Excellence"
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={draftContent.subtitle || ''}
                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                placeholder="Experience an unforgettable evening..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="ctaLabel">CTA Button Label</Label>
              <Input
                id="ctaLabel"
                value={draftContent.ctaLabel || ''}
                onChange={(e) => handleFieldChange('ctaLabel', e.target.value)}
                placeholder="View Our Menu"
              />
            </div>
            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={draftContent.imageUrl || ''}
                onChange={(e) => handleFieldChange('imageUrl', e.target.value)}
                placeholder="/elegant-restaurant-interior.png"
              />
            </div>
          </div>
        )

      case 'PromoCard':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="eyebrow">Eyebrow</Label>
              <Input
                id="eyebrow"
                value={draftContent.eyebrow || ''}
                onChange={(e) => handleFieldChange('eyebrow', e.target.value)}
                placeholder="EXPLORE"
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={draftContent.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Delicious Breakfast Menu"
              />
            </div>
            <div>
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                value={draftContent.hours || ''}
                onChange={(e) => handleFieldChange('hours', e.target.value)}
                placeholder="7.00am – 4.00pm"
              />
            </div>
            <div>
              <Label htmlFor="ctaLabel">CTA Label</Label>
              <Input
                id="ctaLabel"
                value={draftContent.ctaLabel || ''}
                onChange={(e) => handleFieldChange('ctaLabel', e.target.value)}
                placeholder="ORDER NOW"
              />
            </div>
            <div>
              <Label htmlFor="ctaLink">CTA Link</Label>
              <Input
                id="ctaLink"
                value={draftContent.ctaLink || ''}
                onChange={(e) => handleFieldChange('ctaLink', e.target.value)}
                placeholder="/menu"
              />
            </div>
            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={draftContent.imageUrl || ''}
                onChange={(e) => handleFieldChange('imageUrl', e.target.value)}
                placeholder="/gourmet-breakfast.png"
              />
            </div>
          </div>
        )

      case 'WhyWeStand':
        return (
          <div className="space-y-4">
            <div>
              <Label>Reasons</Label>
              {(draftContent.reasons || []).map((reason: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 mb-4 space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Reason {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArrayItemRemove('reasons', index)}
                    >
                      Remove
                    </Button>
                  </div>
                  <Input
                    value={reason.title || ''}
                    onChange={(e) => handleArrayItemChange('reasons', index, { ...reason, title: e.target.value })}
                    placeholder="Title"
                  />
                  <Textarea
                    value={reason.description || ''}
                    onChange={(e) => handleArrayItemChange('reasons', index, { ...reason, description: e.target.value })}
                    placeholder="Description"
                    rows={3}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleArrayItemAdd('reasons', { title: '', description: '' })}
              >
                Add Reason
              </Button>
            </div>
          </div>
        )

      case 'Specialties':
        return (
          <div className="space-y-4">
            <div>
              <Label>Specialties</Label>
              {(draftContent.specialties || []).map((specialty: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 mb-4 space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Specialty {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArrayItemRemove('specialties', index)}
                    >
                      Remove
                    </Button>
                  </div>
                  <Input
                    value={specialty.title || ''}
                    onChange={(e) => handleArrayItemChange('specialties', index, { ...specialty, title: e.target.value })}
                    placeholder="Title"
                  />
                  <Textarea
                    value={specialty.description || ''}
                    onChange={(e) => handleArrayItemChange('specialties', index, { ...specialty, description: e.target.value })}
                    placeholder="Description"
                    rows={3}
                  />
                  <Input
                    value={specialty.image || ''}
                    onChange={(e) => handleArrayItemChange('specialties', index, { ...specialty, image: e.target.value })}
                    placeholder="Image URL"
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleArrayItemAdd('specialties', { title: '', description: '', image: '' })}
              >
                Add Specialty
              </Button>
            </div>
          </div>
        )

      case 'GalleryTeaser':
        return (
          <div className="space-y-4">
            <div>
              <Label>Images</Label>
              {(draftContent.images || []).map((image: string, index: number) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={image || ''}
                    onChange={(e) => {
                      const newImages = [...(draftContent.images || [])]
                      newImages[index] = e.target.value
                      handleFieldChange('images', newImages)
                    }}
                    placeholder="/image.jpg"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newImages = [...(draftContent.images || [])]
                      newImages.splice(index, 1)
                      handleFieldChange('images', newImages)
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const newImages = [...(draftContent.images || []), '']
                  handleFieldChange('images', newImages)
                }}
              >
                Add Image
              </Button>
            </div>
            <div>
              <Label htmlFor="ctaLabel">CTA Button Label</Label>
              <Input
                id="ctaLabel"
                value={draftContent.ctaLabel || ''}
                onChange={(e) => handleFieldChange('ctaLabel', e.target.value)}
                placeholder="View Full Gallery"
              />
            </div>
          </div>
        )

      case 'CTABanner':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={draftContent.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Ready to Dine with Us?"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={draftContent.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Reserve your table now..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="ctaLabel">CTA Button Label</Label>
              <Input
                id="ctaLabel"
                value={draftContent.ctaLabel || ''}
                onChange={(e) => handleFieldChange('ctaLabel', e.target.value)}
                placeholder="Book Your Reservation"
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">Form for {component} component not yet implemented.</p>
            <div>
              <Label>Raw Content (JSON)</Label>
              <Textarea
                value={JSON.stringify(draftContent, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    onContentChange(parsed)
                  } catch (err) {
                    // Invalid JSON, ignore
                  }
                }}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Edit Content</h3>
        {renderForm()}
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t">
        <Button
          onClick={handleSaveDraft}
          disabled={isSaving}
          variant="outline"
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </Button>
        <Button
          onClick={handleDiscard}
          disabled={isDiscarding}
          variant="outline"
        >
          <IconX className="h-4 w-4 mr-2" />
          Discard Changes
        </Button>
        <Button
          onClick={handlePublish}
          disabled={isPublishing}
          className="bg-primary text-primary-foreground"
        >
          <IconCheck className="h-4 w-4 mr-2" />
          {isPublishing ? 'Publishing...' : 'Publish Section'}
        </Button>
        <Button
          onClick={handlePreviewOnSite}
          disabled={isPreviewing}
          variant="outline"
        >
          <IconEye className="h-4 w-4 mr-2" />
          {isPreviewing ? 'Opening...' : 'Preview on Site'}
        </Button>
      </div>
    </div>
  )
}

