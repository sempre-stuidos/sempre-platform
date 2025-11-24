"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { getSectionById } from "@/lib/page-sections-v2"
import { SectionForm } from "@/components/section-form"
import { SectionPreview } from "@/components/section-preview"
import type { PageSectionV2 } from "@/lib/types"

interface SectionEditorDrawerProps {
  sectionId: string
  orgId: string
  pageId: string
  pageSlug: string
  pageBaseUrl?: string | null
  isOpen: boolean
  onClose: () => void
}

export function SectionEditorDrawer({ sectionId, orgId, pageId, pageSlug, pageBaseUrl, isOpen, onClose }: SectionEditorDrawerProps) {
  const [section, setSection] = React.useState<PageSectionV2 | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [draftContent, setDraftContent] = React.useState<Record<string, unknown>>({})

  React.useEffect(() => {
    if (isOpen && sectionId) {
      loadSection()
    } else {
      setSection(null)
      setDraftContent({})
    }
  }, [isOpen, sectionId])

  const loadSection = async () => {
    try {
      setIsLoading(true)
      const loadedSection = await getSectionById(sectionId)
      if (loadedSection) {
        setSection(loadedSection)
        const initialContent = loadedSection.draft_content || {}
        setDraftContent(initialContent)
        // Trigger a custom event to reset the saved content ref in SectionForm
        window.dispatchEvent(new CustomEvent('section-loaded', { detail: initialContent }))
      }
    } catch (error) {
      console.error('Error loading section:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleContentChange = (newContent: Record<string, unknown> | string | number | boolean) => {
    // Only update if it's an object, otherwise ignore primitive values
    if (typeof newContent === 'object' && newContent !== null && !Array.isArray(newContent)) {
      setDraftContent(newContent as Record<string, unknown>)
    }
  }

  const handleClose = () => {
    setSection(null)
    setDraftContent({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>
                {section ? `Edit Section – ${section.label}` : 'Edit Section'}
              </SheetTitle>
              <SheetDescription>
                {section?.component || 'Loading...'}
              </SheetDescription>
            </div>
            {section && (
              <Badge 
                variant="outline" 
                className={
                  section.status === 'dirty' 
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : section.status === 'published'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                }
              >
                {section.status === 'dirty' ? 'Dirty' : section.status === 'published' ? 'Published' : 'Draft'}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading section...</p>
          </div>
        ) : section ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Left: Form */}
            <div className="space-y-4">
              <SectionForm
                component={section.component}
                draftContent={draftContent}
                onContentChange={handleContentChange}
                sectionId={section.id}
                orgId={orgId}
                pageId={pageId}
                pageSlug={pageSlug}
                sectionKey={section.key}
                pageBaseUrl={pageBaseUrl}
                onSave={() => {
                  loadSection()
                  // Trigger refresh in parent
                  window.dispatchEvent(new Event('section-updated'))
                }}
              />
            </div>

            {/* Right: Preview */}
            <div className="space-y-4">
              <div className="sticky top-4">
                <h3 className="text-lg font-semibold mb-4">Preview</h3>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <SectionPreview
                    component={section.component}
                    content={draftContent}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Section not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

