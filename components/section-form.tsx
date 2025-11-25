"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { IconCheck, IconX, IconEye } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { ImagePicker } from "@/components/image-picker"

interface SectionFormProps {
  component: string
  draftContent: Record<string, unknown>
  selectedComponentKey?: string
  onContentChange: (content: Record<string, unknown> | string | number | boolean) => void
  sectionId: string
  orgId: string
  pageId: string
  pageSlug: string
  sectionKey: string
  pageBaseUrl?: string | null
  businessSlug?: string | null
  onSave?: () => void
  isWidgetMode?: boolean
  hideButtons?: boolean
  onDiscard?: () => void
  onPublish?: () => void
}

export function SectionForm({ component, draftContent, selectedComponentKey, onContentChange, sectionId, orgId, pageId, pageSlug, sectionKey, pageBaseUrl, businessSlug, onSave, isWidgetMode = false, hideButtons = false, onDiscard, onPublish }: SectionFormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = React.useState(false)
  const [isPublishing, setIsPublishing] = React.useState(false)
  const [isDiscarding, setIsDiscarding] = React.useState(false)
  const [isPreviewing, setIsPreviewing] = React.useState(false)
  const [hasSavedDraft, setHasSavedDraft] = React.useState(false)

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
      setHasSavedDraft(true)
      savedContentRef.current = JSON.stringify(draftContent)
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
      setHasSavedDraft(false) // Reset after publishing
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
      setHasSavedDraft(false) // Reset after discarding
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

      // Use page's base_url if available, otherwise fall back to env var
      const publicSiteUrl = pageBaseUrl || process.env.NEXT_PUBLIC_RESTAURANT_SITE_URL || 'http://localhost:3001'
      
      // Build preview URL with business slug parameter (for luxivie landing page)
      const params = new URLSearchParams()
      params.set('page', pageSlug)
      params.set('section', sectionKey)
      params.set('token', data.token)
      
      // Use provided businessSlug or fetch it from orgId
      let slugToUse = businessSlug
      if (!slugToUse) {
        try {
          const businessResponse = await fetch(`/api/businesses/${orgId}`)
          if (businessResponse.ok) {
            const businessData = await businessResponse.json()
            slugToUse = businessData.business?.slug || null
          }
        } catch (error) {
          console.error('Error fetching business slug:', error)
        }
      }
      
      if (slugToUse) {
        params.set('business', slugToUse)
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

  // Extract component content if a component is selected
  const componentContent = React.useMemo(() => {
    if (selectedComponentKey) {
      // Check if the component key exists directly in draftContent
      if (draftContent[selectedComponentKey] !== undefined) {
        const content = draftContent[selectedComponentKey]
        console.log('[SectionForm] Extracting component content:', {
          selectedComponentKey,
          content,
          contentType: typeof content,
          isArray: Array.isArray(content),
          draftContentKeys: Object.keys(draftContent),
        })
        // If it's an object (not array, not null), return it as-is
        if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
          console.log('[SectionForm] Component content is object, returning as-is:', content)
          return content as Record<string, unknown>
        }
        // If it's a primitive value (string, number, boolean), wrap it in an object
        // using the component key as the field name so the label shows correctly
        console.log('[SectionForm] Component content is primitive, wrapping:', { [selectedComponentKey]: content })
        return { [selectedComponentKey]: content }
      } else {
        // Component key not found in draftContent - this might mean the content structure is different
        // or the component is nested. Log a warning and use the full draftContent
        console.warn('[SectionForm] Component key not found in draftContent:', {
          selectedComponentKey,
          draftContentKeys: Object.keys(draftContent),
          draftContent,
        })
        // Return empty object or the full content depending on what makes sense
        // For now, return an empty object so the form can show fields to add the component
        return {}
      }
    }
    console.log('[SectionForm] No component selected, using full draftContent:', draftContent)
    return draftContent
  }, [draftContent, selectedComponentKey])

  const handleFieldChange = (field: string, value: unknown) => {
    if (selectedComponentKey) {
      // Get the original component value
      const originalValue = draftContent[selectedComponentKey]
      const isPrimitive = originalValue !== null && originalValue !== undefined && 
                         (typeof originalValue !== 'object' || Array.isArray(originalValue))
      
      if (isPrimitive && field === selectedComponentKey) {
        // If the component is a primitive and the field matches the component key,
        // the value is the new primitive value itself
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || 
            (typeof value === 'object' && value !== null && !Array.isArray(value))) {
          onContentChange(value as string | number | boolean | Record<string, unknown>)
        }
      } else if (isPrimitive) {
        // This shouldn't happen, but handle it just in case
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || 
            (typeof value === 'object' && value !== null && !Array.isArray(value))) {
          onContentChange(value as string | number | boolean | Record<string, unknown>)
        }
      } else {
        // If the component is an object, update the field within it
        const updatedComponentContent = {
          ...(originalValue as Record<string, unknown>),
          [field]: value,
        }
        onContentChange(updatedComponentContent)
      }
    } else {
      // Update section content directly
      onContentChange({
        ...draftContent,
        [field]: value,
      })
    }
  }

  const handleArrayItemChange = (field: string, index: number, value: unknown) => {
    const fieldValue = componentContent[field]
    const array = Array.isArray(fieldValue) ? fieldValue : []
    const newArray = [...array]
    newArray[index] = value
    if (selectedComponentKey) {
      const updatedComponentContent = {
        ...componentContent,
        [field]: newArray,
      }
      onContentChange(updatedComponentContent)
    } else {
      onContentChange({
        ...draftContent,
        [field]: newArray,
      })
    }
  }

  const handleArrayItemAdd = (field: string, defaultValue: unknown) => {
    const fieldValue = componentContent[field]
    const array = Array.isArray(fieldValue) ? fieldValue : []
    if (selectedComponentKey) {
      const updatedComponentContent = {
        ...componentContent,
        [field]: [...array, defaultValue],
      }
      onContentChange(updatedComponentContent)
    } else {
      onContentChange({
        ...draftContent,
        [field]: [...array, defaultValue],
      })
    }
  }

  const handleArrayItemRemove = (field: string, index: number) => {
    const fieldValue = componentContent[field]
    const array = Array.isArray(fieldValue) ? fieldValue : []
    const newArray = array.filter((_: unknown, i: number) => i !== index)
    if (selectedComponentKey) {
      const updatedComponentContent = {
        ...componentContent,
        [field]: newArray,
      }
      onContentChange(updatedComponentContent)
    } else {
      onContentChange({
        ...draftContent,
        [field]: newArray,
      })
    }
  }

  // Helper function to safely get string value from componentContent
  const getStringValue = (value: unknown): string => {
    return typeof value === 'string' ? value : ''
  }

  // Helper function to safely get array value from componentContent
  const getArrayValue = <T,>(value: unknown): T[] => {
    return Array.isArray(value) ? value as T[] : []
  }

  // Render form based on component type
  // Render dynamic form for unimplemented components
  const renderDynamicForm = (content: Record<string, unknown>, onChange: (content: Record<string, unknown>) => void) => {
    const handleFieldChange = (key: string, value: unknown) => {
      const newContent = { ...content, [key]: value }
      onChange(newContent)
    }

    const handleArrayItemChange = (key: string, index: number, value: unknown) => {
      const array = Array.isArray(content[key]) ? [...(content[key] as unknown[])] : []
      array[index] = value
      handleFieldChange(key, array)
    }

    const handleArrayItemRemove = (key: string, index: number) => {
      const array = Array.isArray(content[key]) ? [...(content[key] as unknown[])] : []
      array.splice(index, 1)
      handleFieldChange(key, array)
    }

    const handleArrayItemAdd = (key: string) => {
      const array = Array.isArray(content[key]) ? [...(content[key] as unknown[])] : []
      array.push('')
      handleFieldChange(key, array)
    }

    const handleNestedObjectChange = (key: string, nestedKey: string, value: unknown) => {
      const nested = typeof content[key] === 'object' && content[key] !== null && !Array.isArray(content[key])
        ? { ...(content[key] as Record<string, unknown>) }
        : {}
      nested[nestedKey] = value
      handleFieldChange(key, nested)
    }

    const renderField = (key: string, value: unknown, path: string = '') => {
      const fieldKey = path ? `${path}.${key}` : key
      const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()

      if (value === null || value === undefined) {
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{displayKey}</Label>
            <Input
              id={fieldKey}
              type="text"
              value=""
              placeholder="Enter value..."
              onChange={(e) => handleFieldChange(key, e.target.value)}
            />
          </div>
        )
      }

      if (typeof value === 'string') {
        // Check if it looks like a URL or image field name
        const isImageField = key.toLowerCase().includes('image') || key.toLowerCase().includes('photo') || key.toLowerCase().includes('picture')
        if (isImageField || value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
          return (
            <div key={fieldKey} className="space-y-2">
              <Label htmlFor={fieldKey}>{displayKey}</Label>
              <ImagePicker
                value={value}
                onChange={(url) => handleFieldChange(key, url)}
                label=""
                compact={isWidgetMode}
              />
            </div>
          )
        }
        // Fields that should always use textarea (for multi-line text)
        const textareaFields = ['subtitle', 'description', 'text', 'content', 'quote', 'message', 'body']
        const shouldUseTextarea = textareaFields.some(field => key.toLowerCase().includes(field))
        // Check if it's a long string (use textarea)
        if (shouldUseTextarea || value.length > 100 || value.includes('\n')) {
          return (
            <div key={fieldKey} className="space-y-2">
              <Label htmlFor={fieldKey}>{displayKey}</Label>
              <Textarea
                id={fieldKey}
                value={value}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          )
        }
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{displayKey}</Label>
            <Input
              id={fieldKey}
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(key, e.target.value)}
            />
          </div>
        )
      }

      if (typeof value === 'number') {
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{displayKey}</Label>
            <Input
              id={fieldKey}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(key, parseFloat(e.target.value) || 0)}
            />
          </div>
        )
      }

      if (typeof value === 'boolean') {
        return (
          <div key={fieldKey} className="flex items-center space-x-2">
            <input
              id={fieldKey}
              type="checkbox"
              checked={value}
              onChange={(e) => handleFieldChange(key, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor={fieldKey} className="cursor-pointer">{displayKey}</Label>
          </div>
        )
      }

      if (Array.isArray(value)) {
        return (
          <div key={fieldKey} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{displayKey}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleArrayItemAdd(key)}
              >
                Add Item
              </Button>
            </div>
            <div className="space-y-2 border rounded-md p-3">
              {value.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    {typeof item === 'object' && item !== null && !Array.isArray(item) ? (
                      <div className="space-y-2 border rounded p-2 bg-muted/50">
                        {Object.entries(item as Record<string, unknown>).map(([nestedKey, nestedValue]) => {
                          const nestedFieldKey = `${fieldKey}[${index}].${nestedKey}`
                          const nestedDisplayKey = nestedKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
                          
                          // Handle nested object fields
                          if (typeof nestedValue === 'string') {
                            const isNestedImageField = nestedKey.toLowerCase().includes('image') || nestedKey.toLowerCase().includes('photo') || nestedKey.toLowerCase().includes('picture')
                            if (isNestedImageField || nestedValue.startsWith('http://') || nestedValue.startsWith('https://') || nestedValue.startsWith('/')) {
                              return (
                                <div key={nestedFieldKey} className="space-y-2">
                                  <Label htmlFor={nestedFieldKey}>{nestedDisplayKey}</Label>
                                  <ImagePicker
                                    value={nestedValue}
                                    onChange={(url) => {
                                      const updatedItem = { ...(item as Record<string, unknown>), [nestedKey]: url }
                                      handleArrayItemChange(key, index, updatedItem)
                                    }}
                                    label=""
                                    compact={isWidgetMode}
                                  />
                                </div>
                              )
                            }
                            // Fields that should always use textarea (for multi-line text)
                            const textareaFields = ['subtitle', 'description', 'text', 'content', 'quote', 'message', 'body']
                            const shouldUseTextarea = textareaFields.some(field => nestedKey.toLowerCase().includes(field))
                            if (shouldUseTextarea || nestedValue.length > 100 || nestedValue.includes('\n')) {
                              return (
                                <div key={nestedFieldKey} className="space-y-2">
                                  <Label htmlFor={nestedFieldKey}>{nestedDisplayKey}</Label>
                                  <Textarea
                                    id={nestedFieldKey}
                                    value={nestedValue}
                                    onChange={(e) => {
                                      const updatedItem = { ...(item as Record<string, unknown>), [nestedKey]: e.target.value }
                                      handleArrayItemChange(key, index, updatedItem)
                                    }}
                                    rows={3}
                                    className="resize-none"
                                  />
                                </div>
                              )
                            }
                            return (
                              <div key={nestedFieldKey} className="space-y-2">
                                <Label htmlFor={nestedFieldKey}>{nestedDisplayKey}</Label>
                                <Input
                                  id={nestedFieldKey}
                                  type="text"
                                  value={nestedValue}
                                  onChange={(e) => {
                                    const updatedItem = { ...(item as Record<string, unknown>), [nestedKey]: e.target.value }
                                    handleArrayItemChange(key, index, updatedItem)
                                  }}
                                />
                              </div>
                            )
                          }
                          if (typeof nestedValue === 'number') {
                            return (
                              <div key={nestedFieldKey} className="space-y-2">
                                <Label htmlFor={nestedFieldKey}>{nestedDisplayKey}</Label>
                                <Input
                                  id={nestedFieldKey}
                                  type="number"
                                  value={nestedValue}
                                  onChange={(e) => {
                                    const updatedItem = { ...(item as Record<string, unknown>), [nestedKey]: parseFloat(e.target.value) || 0 }
                                    handleArrayItemChange(key, index, updatedItem)
                                  }}
                                />
                              </div>
                            )
                          }
                          if (typeof nestedValue === 'boolean') {
                            return (
                              <div key={nestedFieldKey} className="flex items-center space-x-2">
                                <input
                                  id={nestedFieldKey}
                                  type="checkbox"
                                  checked={nestedValue}
                                  onChange={(e) => {
                                    const updatedItem = { ...(item as Record<string, unknown>), [nestedKey]: e.target.checked }
                                    handleArrayItemChange(key, index, updatedItem)
                                  }}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor={nestedFieldKey} className="cursor-pointer">{nestedDisplayKey}</Label>
                              </div>
                            )
                          }
                          return null
                        })}
                      </div>
                    ) : (
                      <Textarea
                        value={String(item)}
                        onChange={(e) => handleArrayItemChange(key, index, e.target.value)}
                        placeholder={`Item ${index + 1}`}
                        rows={3}
                        className="resize-none"
                      />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArrayItemRemove(key, index)}
                    className="h-8 w-8 p-0"
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {value.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No items. Click &quot;Add Item&quot; to add one.</p>
              )}
            </div>
          </div>
        )
      }

      if (typeof value === 'object' && value !== null) {
        return (
          <div key={fieldKey} className="space-y-2 border rounded-md p-3 bg-muted/30">
            <Label className="font-semibold">{displayKey}</Label>
            <div className="space-y-3 pl-2 border-l-2">
              {Object.entries(value as Record<string, unknown>).map(([nestedKey, nestedValue]) =>
                renderField(nestedKey, nestedValue, fieldKey)
              )}
            </div>
          </div>
        )
      }

      return null
    }

    const contentEntries = Object.entries(content)
    
    if (contentEntries.length === 0) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">No content fields available. Add fields by editing the JSON directly or implement a custom form for this component.</p>
          <div>
            <Label>Raw Content (JSON)</Label>
            <Textarea
              value={JSON.stringify(content, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  onChange(parsed)
                } catch {
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

    return (
      <div className="space-y-4">
        {contentEntries.map(([key, value]) => renderField(key, value))}
      </div>
    )
  }

  const renderForm = () => {
    // If a component is selected, show only that component's fields using dynamic form
    if (selectedComponentKey) {
      console.log('[SectionForm] Rendering form for component:', {
        selectedComponentKey,
        componentContent,
        draftContent,
        componentContentKeys: Object.keys(componentContent),
      })
      return renderDynamicForm(componentContent, (content) => {
        console.log('[SectionForm] Dynamic form content changed:', {
          selectedComponentKey,
          content,
          contentKeys: Object.keys(content),
        })
        // Get the original component value to check if it's a primitive
        const originalValue = draftContent[selectedComponentKey]
        const isPrimitive = originalValue !== null && originalValue !== undefined && 
                           (typeof originalValue !== 'object' || Array.isArray(originalValue))
        
        if (isPrimitive) {
          // If it's a primitive, extract the value from the wrapped object
          // The content will be { [selectedComponentKey]: value }
          const extractedValue = content[selectedComponentKey]
          console.log('[SectionForm] Component is primitive, extracted value:', extractedValue)
          if (typeof extractedValue === 'string' || typeof extractedValue === 'number' || typeof extractedValue === 'boolean' || 
              (typeof extractedValue === 'object' && extractedValue !== null && !Array.isArray(extractedValue))) {
            onContentChange(extractedValue as string | number | boolean | Record<string, unknown>)
          }
        } else {
          // If it's an object, pass the whole content
          console.log('[SectionForm] Component is object, passing whole content:', content)
          onContentChange(content)
        }
      })
    }

    // Otherwise, show the full section form
    switch (component) {
      case 'InfoBar':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                value={getStringValue(componentContent.hours)}
                onChange={(e) => handleFieldChange('hours', e.target.value)}
                placeholder="5PM - 11PM Daily"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={getStringValue(componentContent.phone)}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={getStringValue(componentContent.tagline)}
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
            {/* Badge */}
            <div className="space-y-2 border rounded-md p-3 bg-muted/30">
              <Label className="font-semibold">Badge</Label>
              <div className="space-y-3 pl-2 border-l-2">
                <div>
                  <Label htmlFor="badgeIcon">Icon</Label>
                  <Input
                    id="badgeIcon"
                    value={getStringValue((componentContent.badge as Record<string, unknown>)?.icon)}
                    onChange={(e) => handleFieldChange('badge', {
                      ...(typeof componentContent.badge === 'object' && componentContent.badge !== null && !Array.isArray(componentContent.badge) 
                        ? componentContent.badge as Record<string, unknown>
                        : {}),
                      icon: e.target.value
                    })}
                    placeholder="Leaf"
                  />
                </div>
                <div>
                  <Label htmlFor="badgeText">Text</Label>
                  <Input
                    id="badgeText"
                    value={getStringValue((componentContent.badge as Record<string, unknown>)?.text)}
                    onChange={(e) => handleFieldChange('badge', {
                      ...(typeof componentContent.badge === 'object' && componentContent.badge !== null && !Array.isArray(componentContent.badge) 
                        ? componentContent.badge as Record<string, unknown>
                        : {}),
                      text: e.target.value
                    })}
                    placeholder="Made in Canada"
                  />
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={getStringValue(componentContent.title)}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Clean Beauty That Works—Made With Care in Canada"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={getStringValue(componentContent.subtitle)}
                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                placeholder="Luxurious hair care and skincare crafted with clean ingredients..."
                rows={3}
              />
            </div>

            {/* Primary CTA */}
            <div className="space-y-2 border rounded-md p-3 bg-muted/30">
              <Label className="font-semibold">Primary CTA</Label>
              <div className="space-y-3 pl-2 border-l-2">
                <div>
                  <Label htmlFor="primaryCtaLabel">Label</Label>
                  <Input
                    id="primaryCtaLabel"
                    value={getStringValue((componentContent.primaryCta as Record<string, unknown>)?.label)}
                    onChange={(e) => handleFieldChange('primaryCta', {
                      ...(typeof componentContent.primaryCta === 'object' && componentContent.primaryCta !== null && !Array.isArray(componentContent.primaryCta) 
                        ? componentContent.primaryCta as Record<string, unknown>
                        : {}),
                      label: e.target.value
                    })}
                    placeholder="Shop Bestsellers"
                  />
                </div>
                <div>
                  <Label htmlFor="primaryCtaHref">Link (href)</Label>
                  <Input
                    id="primaryCtaHref"
                    value={getStringValue((componentContent.primaryCta as Record<string, unknown>)?.href)}
                    onChange={(e) => handleFieldChange('primaryCta', {
                      ...(typeof componentContent.primaryCta === 'object' && componentContent.primaryCta !== null && !Array.isArray(componentContent.primaryCta) 
                        ? componentContent.primaryCta as Record<string, unknown>
                        : {}),
                      href: e.target.value
                    })}
                    placeholder="#products"
                  />
                </div>
              </div>
            </div>

            {/* Secondary CTA */}
            <div className="space-y-2 border rounded-md p-3 bg-muted/30">
              <Label className="font-semibold">Secondary CTA</Label>
              <div className="space-y-3 pl-2 border-l-2">
                <div>
                  <Label htmlFor="secondaryCtaLabel">Label</Label>
                  <Input
                    id="secondaryCtaLabel"
                    value={getStringValue((componentContent.secondaryCta as Record<string, unknown>)?.label)}
                    onChange={(e) => handleFieldChange('secondaryCta', {
                      ...(typeof componentContent.secondaryCta === 'object' && componentContent.secondaryCta !== null && !Array.isArray(componentContent.secondaryCta) 
                        ? componentContent.secondaryCta as Record<string, unknown>
                        : {}),
                      label: e.target.value
                    })}
                    placeholder="See Our Ingredients"
                  />
                </div>
                <div>
                  <Label htmlFor="secondaryCtaHref">Link (href)</Label>
                  <Input
                    id="secondaryCtaHref"
                    value={getStringValue((componentContent.secondaryCta as Record<string, unknown>)?.href)}
                    onChange={(e) => handleFieldChange('secondaryCta', {
                      ...(typeof componentContent.secondaryCta === 'object' && componentContent.secondaryCta !== null && !Array.isArray(componentContent.secondaryCta) 
                        ? componentContent.secondaryCta as Record<string, unknown>
                        : {}),
                      href: e.target.value
                    })}
                    placeholder="#ingredients"
                  />
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <ImagePicker
              value={getStringValue(componentContent.heroImage)}
              onChange={(url) => handleFieldChange('heroImage', url)}
              label="Hero Image"
              placeholder="https://images.unsplash.com/..."
              compact={isWidgetMode}
            />

            {/* Accent Image */}
            <ImagePicker
              value={getStringValue(componentContent.accentImage)}
              onChange={(url) => handleFieldChange('accentImage', url)}
              label="Accent Image"
              placeholder="https://images.unsplash.com/..."
              compact={isWidgetMode}
            />
          </div>
        )

      case 'PromoCard':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eyebrow">Eyebrow</Label>
              <Input
                id="eyebrow"
                value={getStringValue(componentContent.eyebrow)}
                onChange={(e) => handleFieldChange('eyebrow', e.target.value)}
                placeholder="EXPLORE"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={getStringValue(componentContent.title)}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Delicious Breakfast Menu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                value={getStringValue(componentContent.hours)}
                onChange={(e) => handleFieldChange('hours', e.target.value)}
                placeholder="7.00am – 4.00pm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaLabel">CTA Label</Label>
              <Input
                id="ctaLabel"
                value={getStringValue(componentContent.ctaLabel)}
                onChange={(e) => handleFieldChange('ctaLabel', e.target.value)}
                placeholder="ORDER NOW"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaLink">CTA Link</Label>
              <Input
                id="ctaLink"
                value={getStringValue(componentContent.ctaLink)}
                onChange={(e) => handleFieldChange('ctaLink', e.target.value)}
                placeholder="/menu"
              />
            </div>
            <ImagePicker
              value={getStringValue(componentContent.imageUrl)}
              onChange={(url) => handleFieldChange('imageUrl', url)}
              label="Promo Image"
              placeholder="/gourmet-breakfast.png"
              compact={isWidgetMode}
            />
          </div>
        )

      case 'WhyWeStand':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reasons</Label>
              {getArrayValue<Record<string, unknown>>(componentContent.reasons).map((reason: Record<string, unknown>, index: number) => (
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
                    value={getStringValue(reason.title)}
                    onChange={(e) => handleArrayItemChange('reasons', index, { ...reason, title: e.target.value })}
                    placeholder="Title"
                  />
                  <Textarea
                    value={getStringValue(reason.description)}
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
              {getArrayValue<Record<string, unknown>>(componentContent.specialties).map((specialty: Record<string, unknown>, index: number) => (
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
                    value={getStringValue(specialty.title)}
                    onChange={(e) => handleArrayItemChange('specialties', index, { ...specialty, title: e.target.value })}
                    placeholder="Title"
                  />
                  <Textarea
                    value={getStringValue(specialty.description)}
                    onChange={(e) => handleArrayItemChange('specialties', index, { ...specialty, description: e.target.value })}
                    placeholder="Description"
                    rows={3}
                  />
                  <ImagePicker
                    value={getStringValue(specialty.image)}
                    onChange={(url) => handleArrayItemChange('specialties', index, { ...specialty, image: url })}
                    label=""
                    placeholder="Image URL"
                    compact={isWidgetMode}
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
            <div className="space-y-2">
              <Label>Images</Label>
              {getArrayValue<string>(componentContent.images).map((image: string, index: number) => (
                <div key={index} className="space-y-2">
                  <ImagePicker
                    value={image || ''}
                    onChange={(url) => {
                      const newImages = [...getArrayValue<string>(componentContent.images)]
                      newImages[index] = url
                      handleFieldChange('images', newImages)
                    }}
                    label={`Image ${index + 1}`}
                    placeholder="/image.jpg"
                    compact={isWidgetMode}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newImages = [...getArrayValue<string>(componentContent.images)]
                      newImages.splice(index, 1)
                      handleFieldChange('images', newImages)
                    }}
                    className="w-full"
                  >
                    Remove Image
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const newImages = [...getArrayValue<string>(componentContent.images), '']
                  handleFieldChange('images', newImages)
                }}
              >
                Add Image
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaLabel">CTA Button Label</Label>
              <Input
                id="ctaLabel"
                value={getStringValue(componentContent.ctaLabel)}
                onChange={(e) => handleFieldChange('ctaLabel', e.target.value)}
                placeholder="View Full Gallery"
              />
            </div>
          </div>
        )

      case 'CTABanner':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={getStringValue(componentContent.title)}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Ready to Dine with Us?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={getStringValue(componentContent.description)}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Reserve your table now..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaLabel">CTA Button Label</Label>
              <Input
                id="ctaLabel"
                value={getStringValue(componentContent.ctaLabel)}
                onChange={(e) => handleFieldChange('ctaLabel', e.target.value)}
                placeholder="Book Your Reservation"
              />
            </div>
          </div>
        )

      default:
        return renderDynamicForm(componentContent, (content) => {
          if (selectedComponentKey) {
            onContentChange(content)
          } else {
            onContentChange(content)
          }
        })
    }
  }

  // Track content to detect changes after save
  const savedContentRef = React.useRef<string | null>(null)
  
  React.useEffect(() => {
    // If content changes after saving, reset hasSavedDraft
    if (hasSavedDraft && savedContentRef.current) {
      const currentContent = JSON.stringify(draftContent)
      if (currentContent !== savedContentRef.current) {
        setHasSavedDraft(false)
        savedContentRef.current = null
      }
    }
  }, [draftContent, hasSavedDraft])

  if (isWidgetMode && !hideButtons) {
        return (
      <div className="space-y-6 flex flex-col h-full">
        <div className="flex-1">
          {renderForm()}
        </div>

        {/* Sticky buttons at bottom */}
        <div className="sticky bottom-0 bg-background border-t pt-4 pb-2 -mx-4 px-4">
          <div className="flex gap-2">
            <Button
              onClick={() => {
                handleDiscard()
                onDiscard?.()
              }}
              disabled={isDiscarding}
              variant="outline"
              className="flex-1"
            >
              <IconX className="h-4 w-4 mr-2" />
              Discard Changes
            </Button>
            {hasSavedDraft ? (
              <Button
                onClick={() => {
                  handlePublish()
                  onPublish?.()
                }}
                disabled={isPublishing}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <IconCheck className="h-4 w-4 mr-2" />
                {isPublishing ? 'Publishing...' : 'Publish'}
              </Button>
            ) : (
              <Button
                onClick={() => handleSaveDraft()}
                disabled={isSaving}
                variant="outline"
                className="flex-1"
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>
            )}
          </div>
            </div>
          </div>
        )
  }

  if (isWidgetMode && hideButtons) {
    return (
      <div className="space-y-6 flex flex-col h-full">
        <div className="flex-1">
          {renderForm()}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        {renderForm()}
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t">
        <Button
          onClick={() => handleSaveDraft()}
          disabled={isSaving}
          variant="outline"
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </Button>
        <Button
          onClick={() => handleDiscard()}
          disabled={isDiscarding}
          variant="outline"
        >
          <IconX className="h-4 w-4 mr-2" />
          Discard Changes
        </Button>
        <Button
          onClick={() => handlePublish()}
          disabled={isPublishing}
          className="bg-primary text-primary-foreground"
        >
          <IconCheck className="h-4 w-4 mr-2" />
          {isPublishing ? 'Publishing...' : 'Publish Section'}
        </Button>
        <Button
          onClick={() => handlePreviewOnSite()}
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

