"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import type { PageSectionV2 } from "@/lib/types"
import { IconLock } from "@tabler/icons-react"
import type { ViewportSize } from "./viewport-toggle"

interface PageCanvasViewProps {
  sections: PageSectionV2[]
  selectedSectionId: string | null
  hoveredSectionId: string | null
  viewMode: 'draft' | 'published'
  viewportSize: ViewportSize
  previewToken: string | null
  pageBaseUrl: string | null
  pageSlug: string
  iframeKey: number
  onSectionClick: (sectionId: string) => void
  onSectionHover: (sectionId: string | null) => void
  sectionRefs: React.RefObject<Record<string, HTMLDivElement | null>>
}

export function PageCanvasView({
  sections,
  selectedSectionId,
  hoveredSectionId,
  viewMode,
  viewportSize,
  previewToken,
  pageBaseUrl,
  pageSlug,
  iframeKey,
  onSectionClick,
  onSectionHover,
  sectionRefs,
}: PageCanvasViewProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [iframeError, setIframeError] = React.useState<string | null>(null)
  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const getStatusBadge = (section: PageSectionV2) => {
    if (section.status === 'dirty') {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
          Draft changes
        </Badge>
      )
    }
    if (section.status === 'published') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
          Published
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
        Draft
      </Badge>
    )
  }

  const getViewportWidth = () => {
    switch (viewportSize) {
      case 'desktop':
        return '100%'
      case 'tablet':
        return '768px'
      case 'mobile':
        return '375px'
    }
  }

  const getIframeSrc = () => {
    if (!pageSlug) return ''
    const baseUrl = pageBaseUrl || process.env.NEXT_PUBLIC_RESTAURANT_SITE_URL || 'http://localhost:3001'
    // For draft view, use preview token. For published view, don't use token (shows published content)
    if (viewMode === 'draft' && previewToken) {
      return `${baseUrl}/?page=${pageSlug}&token=${previewToken}`
    }
    return `${baseUrl}/?page=${pageSlug}`
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
    setIframeError(null)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setIframeError('Failed to load page preview')
  }

  // Scroll to section in iframe if possible
  React.useEffect(() => {
    if (selectedSectionId && iframeRef.current) {
      const section = sections.find(s => s.id === selectedSectionId)
      if (section) {
        try {
          const iframe = iframeRef.current
          if (iframe.contentWindow) {
            setTimeout(() => {
              try {
                const sectionElement = iframe.contentDocument?.querySelector(`[data-section-key="${section.key}"]`)
                if (sectionElement) {
                  sectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
              } catch {
                // Cross-origin restrictions may prevent this
              }
            }, 500)
          }
        } catch {
          // Cross-origin restrictions may prevent this
        }
      }
    }
  }, [selectedSectionId, sections])

  const selectedSection = sections.find(s => s.id === selectedSectionId)
  const hoveredSection = sections.find(s => s.id === hoveredSectionId)

  return (
    <div className="flex-1 overflow-auto bg-muted/20 relative">
      <div 
        ref={containerRef}
        className="mx-auto bg-background min-h-full transition-all duration-200 relative"
        style={{ width: getViewportWidth() }}
      >
        {/* Iframe Container */}
        <div className="relative w-full min-h-screen">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Loading page...</p>
              </div>
            </div>
          )}

          {iframeError && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
              <div className="text-center p-4">
                <p className="text-sm text-destructive font-medium">{iframeError}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Make sure the client-facing site is running and accessible
                </p>
              </div>
            </div>
          )}

          {pageSlug ? (
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={getIframeSrc()}
              className="w-full border-0"
              style={{
                minHeight: '100vh',
                display: 'block',
              }}
              sandbox="allow-same-origin allow-scripts"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          ) : (
            <div className="flex items-center justify-center min-h-screen p-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Preparing preview...</p>
              </div>
            </div>
          )}

          {/* Overlay for Section Labels and Badges */}
          {selectedSection && (
            <div className="absolute top-4 left-4 z-30 pointer-events-none">
              <div className="bg-background/95 backdrop-blur-sm border rounded-md px-3 py-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{selectedSection.label}</span>
                  {getStatusBadge(selectedSection)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedSection.component}
                </p>
              </div>
            </div>
          )}

          {hoveredSection && !selectedSection && (
            <div className="absolute top-4 left-4 z-30 pointer-events-none">
              <div className="bg-background/95 backdrop-blur-sm border border-primary/30 rounded-md px-3 py-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{hoveredSection.label}</span>
                  {getStatusBadge(hoveredSection)}
                </div>
              </div>
            </div>
          )}

          {/* Lock Indicator */}
          {(selectedSection || hoveredSection) && (
            <div className="absolute bottom-4 right-4 z-30 pointer-events-none">
              <div className="bg-background/95 backdrop-blur-sm border rounded-md px-2 py-1 shadow-lg flex items-center gap-1">
                <IconLock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Content only</span>
              </div>
            </div>
          )}

          {/* Dim overlay when section is selected */}
          {selectedSectionId && (
            <div className="absolute inset-0 bg-background/10 pointer-events-none z-10" />
          )}
        </div>
      </div>
    </div>
  )
}
