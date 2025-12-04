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
import { 
  getComponentSchema, 
  getFieldSchema, 
  initializeContentWithDefaults,
  type ComponentSchema,
  type FieldSchema 
} from "@/lib/component-schemas"
import { safeParseSectionContent } from "@/lib/section-schemas"

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
      
      // Validate content structure before saving
      const validation = safeParseSectionContent(component, draftContent)
      if (!validation.success) {
        if (!silent) {
          toast.error(validation.error)
        }
        return
      }

      const response = await fetch(`/api/sections/${sectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          draftContent: validation.data,
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
      
      // Validate content structure before publishing
      const validation = safeParseSectionContent(component, draftContent)
      if (!validation.success) {
        toast.error(`Cannot publish: ${validation.error}`)
        return
      }

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

  // Extract component content if a component is selected, using schema defaults when needed
  const componentContent = React.useMemo(() => {
    if (selectedComponentKey) {
      // Get the field schema to understand what type of field this is
      const fieldSchema = getFieldSchema(component, selectedComponentKey)
      
      // Handle nested paths with dot notation (e.g., "day.description")
      if (selectedComponentKey.includes('.')) {
        const pathSegments = selectedComponentKey.split('.')
        const [parentKey, ...nestedKeys] = pathSegments
        const nestedFieldKey = nestedKeys[nestedKeys.length - 1] // Last segment is the field name
        
        // Get parent object from draftContent
        const parentObject = draftContent[parentKey]
        if (parentObject && typeof parentObject === 'object' && !Array.isArray(parentObject)) {
          const parentObj = parentObject as Record<string, unknown>
          
          // Navigate to nested value
          let nestedValue = parentObj
          for (const key of nestedKeys) {
            if (nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)) {
              nestedValue = (nestedValue as Record<string, unknown>)[key]
            } else {
              nestedValue = undefined
              break
            }
          }
          
          if (nestedValue !== undefined && nestedValue !== null) {
            // Wrap the nested value in an object with the nested field key
            return { [nestedFieldKey]: nestedValue }
          } else {
            // Nested value not found - initialize from schema
            if (fieldSchema) {
              return { [nestedFieldKey]: fieldSchema.default ?? '' }
            }
            return { [nestedFieldKey]: '' }
          }
        } else {
          // Parent object not found - initialize from schema
          if (fieldSchema) {
            return { [nestedFieldKey]: fieldSchema.default ?? '' }
          }
          return { [nestedFieldKey]: '' }
        }
      }
      
      // Handle top-level keys (backward compatibility)
      // Check if the component key exists directly in draftContent
      if (draftContent[selectedComponentKey] !== undefined) {
        const content = draftContent[selectedComponentKey]
        // If it's an object (not array, not null), initialize with schema defaults if needed
        if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
          const contentObj = content as Record<string, unknown>
          if (fieldSchema?.type === 'object' && fieldSchema.nestedSchema) {
            // Initialize nested object fields with schema defaults
            const initialized: Record<string, unknown> = { ...contentObj }
            for (const [nestedKey, nestedSchema] of Object.entries(fieldSchema.nestedSchema)) {
              if (!(nestedKey in initialized) || initialized[nestedKey] === null || initialized[nestedKey] === undefined) {
                initialized[nestedKey] = nestedSchema.default ?? ''
              }
            }
            return initialized
          }
          return contentObj
        }
        // If it's a primitive value (string, number, boolean), wrap it in an object
        // using the component key as the field name so the label shows correctly
        return { [selectedComponentKey]: content }
      } else {
        // Component key not found - initialize from schema
        if (fieldSchema?.type === 'object' && fieldSchema.nestedSchema) {
          // Initialize nested object from schema
          const nestedDefault: Record<string, unknown> = {}
          for (const [nestedKey, nestedSchema] of Object.entries(fieldSchema.nestedSchema)) {
            nestedDefault[nestedKey] = nestedSchema.default ?? ''
          }
          return nestedDefault
        } else if (fieldSchema) {
          // Primitive field - initialize with default value wrapped in object
          return { [selectedComponentKey]: fieldSchema.default ?? '' }
        }
        // Fallback: return empty object with the key
        return { [selectedComponentKey]: '' }
      }
    }
    // No component selected - initialize full section content with schema defaults
    const initialized = initializeContentWithDefaults(component, draftContent)
    return initialized
  }, [draftContent, selectedComponentKey, component])

  const handleFieldChange = (field: string, value: unknown) => {
    if (selectedComponentKey) {
      // Handle nested paths with dot notation (e.g., "day.description")
      if (selectedComponentKey.includes('.')) {
        const pathSegments = selectedComponentKey.split('.')
        const [parentKey, ...nestedKeys] = pathSegments
        const nestedFieldKey = nestedKeys[nestedKeys.length - 1]
        
        // For nested paths, the field parameter should match the nested field key
        // (e.g., field="description" when selectedComponentKey="day.description")
        const fieldToUpdate = field === nestedFieldKey ? nestedFieldKey : field
        
        // Get parent object from draftContent
        const parentObject = draftContent[parentKey]
        const parentObj = (parentObject && typeof parentObject === 'object' && !Array.isArray(parentObject))
          ? { ...(parentObject as Record<string, unknown>) }
          : {}
        
        // Update the nested field
        const updatedParentObj = {
          ...parentObj,
          [fieldToUpdate]: value,
        }
        
        // Return the updated parent object
        onContentChange(updatedParentObj)
        return
      }
      
      // Handle top-level keys (backward compatibility)
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
  // Render dynamic form using schema when available, fallback to content inference
  const renderDynamicForm = (content: Record<string, unknown>, onChange: (content: Record<string, unknown>) => void) => {
    // Get schema for current component or nested component
    const getSchemaForContext = (): ComponentSchema | null => {
      if (selectedComponentKey) {
        // Handle nested paths with dot notation (e.g., "day.description")
        if (selectedComponentKey.includes('.')) {
          const pathSegments = selectedComponentKey.split('.')
          const nestedFieldKey = pathSegments[pathSegments.length - 1]
          const fieldSchema = getFieldSchema(component, selectedComponentKey)
          
          if (fieldSchema) {
            // Create a schema with just this nested field
            // This allows us to render the field with proper type, label, and placeholder
            return {
              [nestedFieldKey]: fieldSchema
            }
          }
          return null
        }
        
        // Handle top-level keys (backward compatibility)
        // Check if this is a nested object component (like badge) or a primitive field (like title)
        const fieldSchema = getFieldSchema(component, selectedComponentKey)
        
        if (fieldSchema?.type === 'object' && fieldSchema.nestedSchema) {
          // Nested object component (e.g., badge with icon/text)
          return fieldSchema.nestedSchema
        } else if (fieldSchema) {
          // Primitive field (e.g., title, subtitle) - create a schema with just this field
          // This allows us to render the field with proper type, label, and placeholder
          return {
            [selectedComponentKey]: fieldSchema
          }
        }
        return null
      }
      return getComponentSchema(component)
    }

    const schema = getSchemaForContext()

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

    const handleArrayItemAdd = (key: string, defaultValue?: unknown) => {
      const array = Array.isArray(content[key]) ? [...(content[key] as unknown[])] : []
      const fieldSchema = schema?.[key]
      if (fieldSchema?.type === 'array' && fieldSchema.nestedSchema) {
        // Initialize new item from nested schema
        const newItem: Record<string, unknown> = {}
        for (const [nestedKey, nestedSchema] of Object.entries(fieldSchema.nestedSchema)) {
          if (nestedKey !== '_item') {
            newItem[nestedKey] = nestedSchema.default ?? ''
          } else {
            newItem[''] = nestedSchema.default ?? ''
          }
        }
        array.push(Object.keys(newItem).length > 0 ? newItem : defaultValue ?? '')
      } else {
        array.push(defaultValue ?? '')
      }
      handleFieldChange(key, array)
    }

    const handleNestedObjectChange = (key: string, nestedKey: string, value: unknown) => {
      const nested = typeof content[key] === 'object' && content[key] !== null && !Array.isArray(content[key])
        ? { ...(content[key] as Record<string, unknown>) }
        : {}
      nested[nestedKey] = value
      handleFieldChange(key, nested)
    }

    const renderField = (key: string, value: unknown, path: string = '', fieldSchemaOverride?: FieldSchema) => {
      const fieldKey = path ? `${path}.${key}` : key
      const fieldSchema = fieldSchemaOverride || schema?.[key]
      const displayKey = fieldSchema?.label || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
      const placeholder = fieldSchema?.placeholder || 'Enter value...'

      // Determine field type from schema or infer from value
      const fieldType = fieldSchema?.type || 
        (value === null || value === undefined ? 'string' :
        typeof value === 'string' ? 'string' :
        typeof value === 'number' ? 'number' :
        typeof value === 'boolean' ? 'boolean' :
        Array.isArray(value) ? 'array' :
        'object')

      // Handle null/undefined with schema default
      if (value === null || value === undefined) {
        const defaultValue = fieldSchema?.default ?? ''
        if (fieldType === 'image') {
          return (
            <div key={fieldKey} className="space-y-2">
              <Label htmlFor={fieldKey}>{displayKey}</Label>
              <ImagePicker
                value={String(defaultValue)}
                onChange={(url) => handleFieldChange(key, url)}
                label=""
                compact={isWidgetMode}
                orgId={orgId}
                businessSlug={businessSlug}
              />
            </div>
          )
        }
        if (fieldType === 'textarea') {
          return (
            <div key={fieldKey} className="space-y-2">
              <Label htmlFor={fieldKey}>{displayKey}</Label>
              <Textarea
                id={fieldKey}
                value={String(defaultValue)}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                rows={3}
                className="resize-none"
                placeholder={placeholder}
              />
            </div>
          )
        }
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{displayKey}</Label>
            <Input
              id={fieldKey}
              type={fieldType === 'number' ? 'number' : 'text'}
              value={String(defaultValue)}
              placeholder={placeholder}
              onChange={(e) => handleFieldChange(key, fieldType === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            />
          </div>
        )
      }

      // Render based on schema type or inferred type
      if (fieldType === 'image' || (typeof value === 'string' && (key.toLowerCase().includes('image') || key.toLowerCase().includes('photo') || key.toLowerCase().includes('picture') || value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')))) {
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{displayKey}</Label>
            <ImagePicker
              value={String(value)}
              onChange={(url) => handleFieldChange(key, url)}
              label=""
              compact={isWidgetMode}
              orgId={orgId}
              businessSlug={businessSlug}
            />
          </div>
        )
      }

      if (fieldType === 'textarea' || (typeof value === 'string' && (['subtitle', 'description', 'text', 'content', 'quote', 'message', 'body'].some(field => key.toLowerCase().includes(field)) || value.length > 100 || value.includes('\n')))) {
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{displayKey}</Label>
            <Textarea
              id={fieldKey}
              value={String(value)}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              rows={3}
              className="resize-none"
              placeholder={placeholder}
            />
          </div>
        )
      }

      if (typeof value === 'string' && fieldType === 'string') {
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{displayKey}</Label>
            <Input
              id={fieldKey}
              type="text"
              value={value}
              placeholder={placeholder}
              onChange={(e) => handleFieldChange(key, e.target.value)}
            />
          </div>
        )
      }

      if (fieldType === 'number' || typeof value === 'number') {
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{displayKey}</Label>
            <Input
              id={fieldKey}
              type="number"
              value={typeof value === 'number' ? value : ''}
              placeholder={placeholder}
              onChange={(e) => handleFieldChange(key, parseFloat(e.target.value) || 0)}
            />
          </div>
        )
      }

      if (fieldType === 'boolean' || typeof value === 'boolean') {
        return (
          <div key={fieldKey} className="flex items-center space-x-2">
            <input
              id={fieldKey}
              type="checkbox"
              checked={typeof value === 'boolean' ? value : false}
              onChange={(e) => handleFieldChange(key, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor={fieldKey} className="cursor-pointer">{displayKey}</Label>
          </div>
        )
      }

      if (fieldType === 'array' || Array.isArray(value)) {
        const arraySchema = fieldSchema?.nestedSchema
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
              {(Array.isArray(value) ? value : []).map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    {typeof item === 'object' && item !== null && !Array.isArray(item) && arraySchema ? (
                      <div className="space-y-2 border rounded p-2 bg-muted/50">
                        {Object.entries(arraySchema).map(([nestedKey, nestedSchema]) => {
                          if (nestedKey === '_item') {
                            // Handle simple array items (strings)
                            return (
                              <div key={`${fieldKey}[${index}]`} className="space-y-2">
                                <Label htmlFor={`${fieldKey}[${index}]`}>{nestedSchema.label || 'Item'}</Label>
                                {nestedSchema.type === 'image' ? (
                                  <ImagePicker
                                    value={String((item as Record<string, unknown>)[nestedKey] || item || '')}
                                    onChange={(url) => handleArrayItemChange(key, index, url)}
                                    label=""
                                    compact={isWidgetMode}
                                    orgId={orgId}
                                    businessSlug={businessSlug}
                                  />
                                ) : (
                                  <Textarea
                                    value={String(item)}
                                    onChange={(e) => handleArrayItemChange(key, index, e.target.value)}
                                    placeholder={nestedSchema.placeholder || `Item ${index + 1}`}
                                    rows={3}
                                    className="resize-none"
                                  />
                                )}
                              </div>
                            )
                          }
                          const nestedValue = (item as Record<string, unknown>)[nestedKey]
                          return renderField(nestedKey, nestedValue, `${fieldKey}[${index}]`, nestedSchema)
                        })}
                      </div>
                    ) : typeof item === 'object' && item !== null && !Array.isArray(item) ? (
                      <div className="space-y-2 border rounded p-2 bg-muted/50">
                        {Object.entries(item as Record<string, unknown>).map(([nestedKey, nestedValue]) => {
                          const nestedSchema = arraySchema?.[nestedKey]
                          return renderField(nestedKey, nestedValue, `${fieldKey}[${index}]`, nestedSchema)
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
              {(!Array.isArray(value) || value.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-2">No items. Click &quot;Add Item&quot; to add one.</p>
              )}
            </div>
          </div>
        )
      }

      if (fieldType === 'object' || (typeof value === 'object' && value !== null && !Array.isArray(value))) {
        const nestedSchema = fieldSchema?.nestedSchema
        const objValue = typeof value === 'object' && value !== null && !Array.isArray(value) 
          ? value as Record<string, unknown>
          : {}
        
        // If we have a nested schema, render all fields from schema (even if missing in value)
        const fieldsToRender = nestedSchema 
          ? Object.keys(nestedSchema)
          : Object.keys(objValue)
        
        return (
          <div key={fieldKey} className="space-y-2 border rounded-md p-3 bg-muted/30">
            <Label className="font-semibold">{displayKey}</Label>
            <div className="space-y-3 pl-2 border-l-2">
              {fieldsToRender.map((nestedKey) => {
                const nestedValue = objValue[nestedKey]
                const nestedFieldSchema = nestedSchema?.[nestedKey]
                return renderField(nestedKey, nestedValue, fieldKey, nestedFieldSchema)
              })}
            </div>
          </div>
        )
      }

      return null
    }

    // If we have a schema, render all fields from schema (even if missing in content)
    // This ensures empty components show all available fields
    if (schema) {
      const schemaKeys = Object.keys(schema)
      if (schemaKeys.length > 0) {
        return (
          <div className="space-y-4">
            {schemaKeys.map((key) => {
              const value = content[key]
              const fieldSchema = schema[key]
              return renderField(key, value, '', fieldSchema)
            })}
          </div>
        )
      }
    }

    // Fallback: render from content entries
    const contentEntries = Object.entries(content)
    
    if (contentEntries.length === 0) {
      // If we have a schema but no content, we should have rendered above
      // This only happens if schema is also empty
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
      return renderDynamicForm(componentContent, (content) => {
        // Handle nested paths with dot notation (e.g., "day.description")
        if (selectedComponentKey.includes('.')) {
          const pathSegments = selectedComponentKey.split('.')
          const [parentKey, ...nestedKeys] = pathSegments
          const nestedFieldKey = nestedKeys[nestedKeys.length - 1]
          
          // Get parent object from draftContent
          const parentObject = draftContent[parentKey]
          const parentObj = (parentObject && typeof parentObject === 'object' && !Array.isArray(parentObject))
            ? { ...(parentObject as Record<string, unknown>) }
            : {}
          
          // Extract the value from content (content will be { [nestedFieldKey]: value })
          const extractedValue = content[nestedFieldKey]
          
          // Update the nested field in parent object
          const updatedParentObj = {
            ...parentObj,
            [nestedFieldKey]: extractedValue,
          }
          
          // Return the updated parent object
          onContentChange(updatedParentObj)
          return
        }
        
        // Handle top-level keys (backward compatibility)
        // Get the original component value to check if it's a primitive
        const originalValue = draftContent[selectedComponentKey]
        const isPrimitive = originalValue !== null && originalValue !== undefined && 
                           (typeof originalValue !== 'object' || Array.isArray(originalValue))
        
        if (isPrimitive) {
          // If it's a primitive, extract the value from the wrapped object
          // The content will be { [selectedComponentKey]: value }
          const extractedValue = content[selectedComponentKey]
          if (typeof extractedValue === 'string' || typeof extractedValue === 'number' || typeof extractedValue === 'boolean' || 
              (typeof extractedValue === 'object' && extractedValue !== null && !Array.isArray(extractedValue))) {
            onContentChange(extractedValue as string | number | boolean | Record<string, unknown>)
          }
        } else {
          // If it's an object (like badge), pass the whole content object
          // This will update draftContent[selectedComponentKey] with the new object
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
              orgId={orgId}
              businessSlug={businessSlug}
            />

            {/* Accent Image */}
            <ImagePicker
              value={getStringValue(componentContent.accentImage)}
              onChange={(url) => handleFieldChange('accentImage', url)}
              label="Accent Image"
              placeholder="https://images.unsplash.com/..."
              compact={isWidgetMode}
              orgId={orgId}
              businessSlug={businessSlug}
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
              orgId={orgId}
              businessSlug={businessSlug}
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
                    orgId={orgId}
                    businessSlug={businessSlug}
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
                    orgId={orgId}
                    businessSlug={businessSlug}
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

