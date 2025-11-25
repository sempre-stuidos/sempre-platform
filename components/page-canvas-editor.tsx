"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { IconArrowLeft, IconEye } from "@tabler/icons-react"
import { PageCanvasView } from "@/components/page-canvas-view"
import { SectionInspectorPanel } from "@/components/section-inspector-panel"
import { SectionWidget } from "@/components/section-widget"
import { SectionListPanel } from "@/components/section-list-panel"
import { ViewportToggle, type ViewportSize } from "@/components/viewport-toggle"
import { CanvasGlobalActions } from "@/components/canvas-global-actions"
import type { PageSectionV2 } from "@/lib/types"
import type { Business } from "@/lib/businesses"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "sonner"

interface PageCanvasEditorProps {
  orgId: string
  pageId: string
  pageSlug: string
  pageName: string
  sections: PageSectionV2[]
  organization: Business | null
  pageBaseUrl?: string | null
}

export function PageCanvasEditor({
  orgId,
  pageId,
  pageSlug,
  pageName,
  sections,
  organization,
  pageBaseUrl,
}: PageCanvasEditorProps) {
  const [selectedSectionId, setSelectedSectionId] = React.useState<string | null>(null)
  const [selectedComponentKey, setSelectedComponentKey] = React.useState<string | null>(null)
  const [hoveredSectionId, setHoveredSectionId] = React.useState<string | null>(null)
  const [viewMode, setViewMode] = React.useState<'draft' | 'published'>('draft')
  const [viewportSize, setViewportSize] = React.useState<ViewportSize>('desktop')
  const [showSectionList, setShowSectionList] = React.useState(true)
  const [isWidgetMode, setIsWidgetMode] = React.useState(true)
  const [previewToken, setPreviewToken] = React.useState<string | null>(null)
  const [isLoadingToken, setIsLoadingToken] = React.useState(true)
  const [iframeKey, setIframeKey] = React.useState(0)
  const [draftContents, setDraftContents] = React.useState<Record<string, Record<string, unknown>>>(
    sections.reduce((acc, section) => {
      acc[section.id] = section.draft_content || {}
      return acc
    }, {} as Record<string, Record<string, unknown>>)
  )
  const sectionRefs = React.useRef<Record<string, HTMLDivElement | null>>({})
  const router = useRouter()

  // Create preview token on mount and when view mode changes
  const createPreviewToken = React.useCallback(async () => {
    try {
      setIsLoadingToken(true)
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

      setPreviewToken(data.token)
      setIframeKey(prev => prev + 1) // Force iframe reload
    } catch (error) {
      console.error('Error creating preview token:', error)
      toast.error('Failed to create preview token')
    } finally {
      setIsLoadingToken(false)
    }
  }, [orgId, pageId])

  // Create token on mount
  React.useEffect(() => {
    createPreviewToken()
  }, [createPreviewToken])

  // Regenerate iframe when view mode changes (token only needed for draft view)
  React.useEffect(() => {
    if (viewMode === 'draft' && !previewToken) {
      createPreviewToken()
    } else {
      // Force iframe reload when switching between draft/published
      setIframeKey(prev => prev + 1)
    }
  }, [viewMode]) // Only depend on viewMode, not createPreviewToken to avoid loops


  // Update draft contents when sections prop changes (e.g., after save/refresh)
  React.useEffect(() => {
    const newDraftContents = sections.reduce((acc, section) => {
      acc[section.id] = section.draft_content || {}
      return acc
    }, {} as Record<string, Record<string, unknown>>)
    setDraftContents(newDraftContents)
  }, [sections])

  const selectedSection = React.useMemo(() => {
    if (!selectedSectionId) return null
    const section = sections.find(s => s.id === selectedSectionId)
    if (!section) {
      console.warn('[PageCanvasEditor] Selected section not found:', selectedSectionId, 'Available sections:', sections.map(s => s.id))
    }
    return section || null
  }, [selectedSectionId, sections])
  const selectedDraftContent = React.useMemo(() => {
    const content = selectedSectionId ? draftContents[selectedSectionId] || {} : {}
    if (selectedSectionId && selectedComponentKey) {
      console.log('[PageCanvasEditor] Selected draft content for component:', {
        selectedSectionId,
        selectedComponentKey,
        content,
        contentKeys: Object.keys(content),
        componentValue: content[selectedComponentKey],
      })
    }
    return content
  }, [selectedSectionId, selectedComponentKey, draftContents])

  // Debug: Log when selectedSectionId changes
  React.useEffect(() => {
    console.log('[PageCanvasEditor] selectedSectionId changed:', selectedSectionId)
    console.log('[PageCanvasEditor] selectedSection:', selectedSection)
    console.log('[PageCanvasEditor] isWidgetMode:', isWidgetMode)
  }, [selectedSectionId, selectedSection, isWidgetMode])

  const hasDirtySections = sections.some(s => s.status === 'dirty')

  const handleSectionClick = React.useCallback((sectionId: string, sectionKey?: string) => {
    console.log('[PageCanvasEditor] handleSectionClick called with:', sectionId, 'sectionKey:', sectionKey)
    console.log('[PageCanvasEditor] Available sections:', sections.map(s => ({ id: s.id, key: s.key })))
    
    // Try to find section by ID first
    let section = sections.find(s => s.id === sectionId)
    
    // If not found by ID, try to find by key (in case IDs don't match between iframe and editor)
    if (!section && sectionKey) {
      section = sections.find(s => s.key === sectionKey)
      if (section) {
        console.log('[PageCanvasEditor] Found section by key instead of ID:', section.id, section.key)
      }
    }
    
    if (section) {
      console.log('[PageCanvasEditor] Setting selected section:', section.id, section.key)
      setSelectedSectionId(section.id)
      setSelectedComponentKey(null) // Reset component selection when section is clicked
      // Default to widget mode when section is selected
      if (!isWidgetMode) {
        setIsWidgetMode(true)
      }
    } else {
      console.warn('[PageCanvasEditor] Section not found by ID or key:', sectionId, sectionKey)
      console.warn('[PageCanvasEditor] Available section keys:', sections.map(s => s.key))
      console.warn('[PageCanvasEditor] Available section IDs:', sections.map(s => s.id))
    }
  }, [isWidgetMode, sections])

  const handleComponentClick = React.useCallback((sectionId: string, sectionKey: string, componentKey: string) => {
    console.log('[PageCanvasEditor] handleComponentClick called with:', sectionId, 'componentKey:', componentKey)
    
    // Try to find section by ID first
    let section = sections.find(s => s.id === sectionId)
    
    // If not found by ID, try to find by key
    if (!section) {
      section = sections.find(s => s.key === sectionKey)
    }
    
    if (section) {
      console.log('[PageCanvasEditor] Setting selected section and component:', section.id, componentKey)
      setSelectedSectionId(section.id)
      setSelectedComponentKey(componentKey)
      // Default to widget mode when component is selected
      if (!isWidgetMode) {
        setIsWidgetMode(true)
      }
    } else {
      console.warn('[PageCanvasEditor] Section not found for component click:', sectionId, sectionKey)
    }
  }, [isWidgetMode, sections])

  const handleSectionHover = (sectionId: string | null) => {
    setHoveredSectionId(sectionId)
  }

  const handleContentChange = (content: Record<string, unknown> | string | number | boolean) => {
    if (selectedSectionId) {
      // Check if content is a full section object (has multiple keys, not just a component value)
      const isFullSectionUpdate = typeof content === 'object' && 
                                  content !== null && 
                                  !Array.isArray(content) &&
                                  Object.keys(content).length > 1
      
      if (selectedComponentKey && !isFullSectionUpdate) {
        // If a component is selected and content is a primitive or single-component object,
        // merge only that component's content into the section content
        setDraftContents(prev => {
          const currentSectionContent = prev[selectedSectionId] || {}
          const updatedContent = {
            ...currentSectionContent,
            [selectedComponentKey]: content,
          }
          console.log('[PageCanvasEditor] handleContentChange - Component update:', {
            selectedComponentKey,
            content,
            currentSectionContent,
            updatedContent,
          })
          return {
            ...prev,
            [selectedSectionId]: updatedContent,
          }
        })
      } else {
        // If no component is selected OR content is a full section object, update the entire section content
        // Ensure content is an object
        const contentObj = typeof content === 'object' && content !== null && !Array.isArray(content)
          ? content as Record<string, unknown>
          : {}
        console.log('[PageCanvasEditor] handleContentChange - Full section update:', {
          selectedSectionId,
          selectedComponentKey,
          isFullSectionUpdate,
          contentObj,
        })
        setDraftContents(prev => ({
          ...prev,
          [selectedSectionId]: contentObj,
        }))
      }
    }
  }

  const handleScrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleSave = async () => {
    // Regenerate preview token to ensure draft content is shown
    await createPreviewToken()
    // Force iframe reload with new token
    setIframeKey(prev => prev + 1)
    // Refresh the page to get updated sections from server
    router.refresh()
  }

  const handlePreview = async () => {
    try {
      // Create preview token
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

      const publicSiteUrl = pageBaseUrl || organization?.site_base_url || process.env.NEXT_PUBLIC_RESTAURANT_SITE_URL || 'http://localhost:3001'
      const previewUrl = `${publicSiteUrl}/?page=${pageSlug}&token=${data.token}`
      
      window.open(previewUrl, '_blank')
      toast.success('Opening preview in new tab')
    } catch (error) {
      console.error('Error creating preview:', error)
      toast.error('Failed to create preview')
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background z-50">
      {/* Header */}
      <div className="border-b bg-background z-10">
        <div className="px-4 py-3 flex items-center">
          {/* Left Section */}
          <div className="flex items-center gap-4 flex-1">
            <Link href={`/client/${orgId}/restaurant/pages`}>
              <Button variant="ghost" size="sm">
                <IconArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold">{pageName}</h1>
              <p className="text-xs text-muted-foreground">Canvas Editor</p>
            </div>
            
            {/* Draft/Published Toggle */}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => {
                if (value === 'draft' || value === 'published') {
                  setViewMode(value)
                }
              }}
              className="min-w-[140px]"
            >
              <ToggleGroupItem value="draft" aria-label="View draft" className="flex-1">
                Draft
              </ToggleGroupItem>
              <ToggleGroupItem value="published" aria-label="View published" className="flex-1">
                Published
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Center Section - Viewport Toggle */}
          <div className="flex-1 flex justify-center">
            <ViewportToggle value={viewportSize} onChange={setViewportSize} />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            {/* Global Actions - Dropdown */}
            <CanvasGlobalActions
              pageId={pageId}
              hasDirtySections={hasDirtySections}
              onPublishAll={handleSave}
              onDiscardAll={handleSave}
            />

            {/* Preview Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
            >
              <IconEye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Section List Panel */}
        {showSectionList && (
          <SectionListPanel
            sections={sections}
            selectedSectionId={selectedSectionId}
            selectedComponentKey={selectedComponentKey}
            onSelectSection={(sectionId) => {
              handleSectionClick(sectionId)
              setSelectedComponentKey(null)
            }}
            onSelectComponent={(sectionId, componentKey) => {
              handleComponentClick(sectionId, sections.find(s => s.id === sectionId)?.key || '', componentKey)
            }}
            onScrollToSection={handleScrollToSection}
          />
        )}

        {/* Canvas View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <PageCanvasView
            sections={sections}
            selectedSectionId={selectedSectionId}
            hoveredSectionId={hoveredSectionId}
            viewMode={viewMode}
            viewportSize={viewportSize}
            previewToken={previewToken}
            pageBaseUrl={(() => {
              // Resolve base URL with fallback: pageBaseUrl > organization.site_base_url > null
              // This ensures we use the live URL instead of localhost
              const resolved = pageBaseUrl || organization?.site_base_url || null
              if (typeof window !== 'undefined' && resolved) {
                console.log('[PageCanvasEditor] Resolved pageBaseUrl:', {
                  pageBaseUrl,
                  organizationSiteBaseUrl: organization?.site_base_url,
                  resolved,
                })
              }
              return resolved
            })()}
            pageSlug={pageSlug}
            iframeKey={iframeKey}
            isWidgetMode={isWidgetMode}
            businessSlug={organization?.slug ?? null}
            onSectionClick={handleSectionClick}
            onComponentClick={handleComponentClick}
            onSectionHover={handleSectionHover}
            sectionRefs={sectionRefs}
          />
        </div>

        {/* Inspector Panel or Widget */}
        {selectedSection && !isWidgetMode && (
          <SectionInspectorPanel
            section={selectedSection}
            orgId={orgId}
            pageId={pageId}
            pageSlug={pageSlug}
            sectionKey={selectedSection.key}
            pageBaseUrl={pageBaseUrl ?? null}
            businessSlug={organization?.slug ?? null}
            draftContent={selectedDraftContent}
            onContentChange={handleContentChange}
            onClose={() => setSelectedSectionId(null)}
            onSave={handleSave}
            onConvertToWidget={() => setIsWidgetMode(true)}
          />
        )}

        {/* Widget Mode */}
        {selectedSection && isWidgetMode && (
          <SectionWidget
            section={selectedSection}
            orgId={orgId}
            pageId={pageId}
            pageSlug={pageSlug}
            sectionKey={selectedSection.key}
            pageBaseUrl={pageBaseUrl ?? null}
            businessSlug={organization?.slug ?? null}
            draftContent={selectedDraftContent}
            selectedComponentKey={selectedComponentKey}
            onContentChange={handleContentChange}
            onClose={() => {
              setIsWidgetMode(false)
              setSelectedSectionId(null)
              setSelectedComponentKey(null)
            }}
            onSave={handleSave}
            onExpand={() => setIsWidgetMode(false)}
            getLatestContent={() => draftContents[selectedSection.id] || {}}
          />
        )}
      </div>
    </div>
  )
}

