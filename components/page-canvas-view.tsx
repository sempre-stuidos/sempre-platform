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
  isWidgetMode?: boolean
  businessSlug?: string | null
  onSectionClick: (sectionId: string, sectionKey?: string) => void
  onComponentClick?: (sectionId: string, sectionKey: string, componentKey: string) => void
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
  isWidgetMode = false,
  businessSlug,
  onSectionClick,
  onComponentClick,
  onSectionHover,
  sectionRefs,
}: PageCanvasViewProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [iframeError, setIframeError] = React.useState<string | null>(null)
  const [sectionPositions, setSectionPositions] = React.useState<Record<string, DOMRect>>({})
  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const highlightOverlayRef = React.useRef<HTMLDivElement>(null)

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
    // Priority: pageBaseUrl (which may include organization.site_base_url fallback) > env var > localhost
    // pageBaseUrl is already resolved in PageCanvasEditor with organization fallback
    const baseUrl = pageBaseUrl || process.env.NEXT_PUBLIC_RESTAURANT_SITE_URL || 'http://localhost:3001'
    
    // Log the URL source for debugging
    if (typeof window !== 'undefined') {
      console.log('[PageCanvasView] Iframe base URL resolution:', {
        pageBaseUrl,
        envVar: process.env.NEXT_PUBLIC_RESTAURANT_SITE_URL,
        finalBaseUrl: baseUrl,
        isLocalhost: baseUrl.includes('localhost'),
        isProduction: !baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1'),
      })
    }
    
    // Build query parameters
    const params = new URLSearchParams()
    params.set('page', pageSlug)
    
    // Add business slug if available (for luxivie landing page)
    if (businessSlug) {
      params.set('business', businessSlug)
    }
    
    // For draft view, use preview token. For published view, don't use token (shows published content)
    if (viewMode === 'draft' && previewToken) {
      params.set('token', previewToken)
      console.log('[PageCanvasView] Iframe URL with preview token:', {
        viewMode,
        hasToken: !!previewToken,
        tokenPreview: previewToken.substring(0, 8) + '...',
        businessSlug,
        pageSlug,
        fullUrl: `${baseUrl}/?${params.toString()}`,
      })
    } else {
      console.log('[PageCanvasView] Iframe URL without preview token:', {
        viewMode,
        hasToken: !!previewToken,
        businessSlug,
        pageSlug,
        fullUrl: `${baseUrl}/?${params.toString()}`,
      })
    }
    
    return `${baseUrl}/?${params.toString()}`
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
    setIframeError(null)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setIframeError('Failed to load page preview')
  }

  // Listen for section and component click messages from iframe
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Process section-click and component-click messages
      if (event.data?.type !== 'section-click' && event.data?.type !== 'component-click') {
        return
      }

      // Accept messages from iframe - be permissive for cross-origin communication
      // The iframe is on a different domain (luxivie-five.vercel.app) than the parent (se-hub.vercel.app)
      // So we need to accept messages from the iframe's domain
      const publicSiteUrl = pageBaseUrl || process.env.NEXT_PUBLIC_RESTAURANT_SITE_URL || 'http://localhost:3001'
      
      // Normalize URLs for comparison (extract just the host)
      const normalizeUrl = (url: string) => {
        try {
          const urlObj = new URL(url)
          return urlObj.host.toLowerCase()
        } catch {
          // If URL parsing fails, try to extract host manually
          const match = url.match(/\/\/([^\/]+)/)
          return match ? match[1].toLowerCase() : url.toLowerCase().replace(/\/$/, '')
        }
      }
      
      const normalizedPublicUrl = normalizeUrl(publicSiteUrl)
      const normalizedOrigin = normalizeUrl(event.origin)
      
      // Accept messages from:
      // 1. Expected origin (iframe's domain matches expected URL)
      // 2. Localhost (for development)
      // 3. Any vercel.app domain (for production cross-origin iframes)
      // 4. If both are vercel.app domains, allow cross-origin communication
      const isVercelApp = (url: string) => url.includes('vercel.app')
      const isValidOrigin = normalizedOrigin === normalizedPublicUrl || 
                           event.origin.includes('localhost') || 
                           event.origin.includes('127.0.0.1') ||
                           (isVercelApp(event.origin) && isVercelApp(normalizedPublicUrl)) ||
                           isVercelApp(event.origin) // Allow any vercel.app origin in production
      
      if (!isValidOrigin) {
        console.warn('[PageCanvasView] Rejected message from origin:', {
          eventOrigin: event.origin,
          normalizedOrigin,
          expectedUrl: publicSiteUrl,
          normalizedExpected: normalizedPublicUrl,
          messageType: event.data?.type,
          messageData: event.data,
        })
        return
      }
      
      console.log('[PageCanvasView] Accepting message from origin:', {
        eventOrigin: event.origin,
        normalizedOrigin,
        expectedUrl: publicSiteUrl,
        normalizedExpected: normalizedPublicUrl,
        messageType: event.data?.type,
        sectionId: event.data?.sectionId,
        sectionKey: event.data?.sectionKey,
        componentKey: event.data?.componentKey,
      })

      // Handle component click (takes priority over section click)
      if (event.data?.type === 'component-click' && event.data?.sectionId && event.data?.componentKey) {
        console.log('[PageCanvasView] Component clicked:', {
          componentKey: event.data.componentKey,
          sectionId: event.data.sectionId,
          sectionKey: event.data.sectionKey,
          hasOnComponentClick: !!onComponentClick,
        })
        if (onComponentClick) {
          onComponentClick(event.data.sectionId, event.data.sectionKey, event.data.componentKey)
        } else {
          console.warn('[PageCanvasView] onComponentClick handler not provided')
        }
        return
      }

      // Handle section click
      if (event.data?.type === 'section-click' && event.data?.sectionId) {
        console.log('[PageCanvasView] Section clicked:', {
          sectionId: event.data.sectionId,
          sectionKey: event.data.sectionKey,
          hasOnSectionClick: !!onSectionClick,
        })
        if (onSectionClick) {
          onSectionClick(event.data.sectionId, event.data.sectionKey)
        } else {
          console.warn('[PageCanvasView] onSectionClick handler not provided')
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [pageBaseUrl, onSectionClick, onComponentClick])

  // Listen for section positions from iframe (for highlighting)
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'section-positions' && event.data?.positions) {
        const publicSiteUrl = pageBaseUrl || process.env.NEXT_PUBLIC_RESTAURANT_SITE_URL || 'http://localhost:3001'
        const isValidOrigin = event.origin === publicSiteUrl || 
                             event.origin.includes('localhost') || 
                             event.origin.includes('127.0.0.1')
        
        if (isValidOrigin) {
          setSectionPositions(event.data.positions)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [pageBaseUrl])

  // Request section positions from iframe after load
  React.useEffect(() => {
    if (!isLoading && iframeRef.current) {
      const iframe = iframeRef.current
      const updatePositions = () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
          if (iframeDoc) {
            const positions: Record<string, DOMRect> = {}
            sections.forEach(section => {
              const element = iframeDoc.querySelector(`[data-section-key="${section.key}"]`)
              if (element) {
                const rect = element.getBoundingClientRect()
                const iframeRect = iframe.getBoundingClientRect()
                // Calculate position relative to iframe container
                positions[section.id] = new DOMRect(
                  rect.left - iframeRect.left,
                  rect.top - iframeRect.top,
                  rect.width,
                  rect.height
                )
              }
            })
            if (Object.keys(positions).length > 0) {
              setSectionPositions(prev => ({ ...prev, ...positions }))
            }
          }
        } catch (error) {
          // Cross-origin restrictions - try postMessage approach
          try {
            iframe.contentWindow?.postMessage({ type: 'request-section-positions', sectionKeys: sections.map(s => s.key) }, '*')
          } catch (e) {
            // Ignore
          }
        }
      }

      // Update positions after load with multiple attempts
      const attemptUpdate = (delay: number) => {
        setTimeout(() => {
          updatePositions()
        }, delay)
      }
      
      attemptUpdate(500)
      attemptUpdate(1000)
      attemptUpdate(2000)
      
      // Update on scroll and resize
      const handleUpdate = () => {
        updatePositions()
      }
      const scrollContainer = containerRef.current?.parentElement
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleUpdate, { passive: true })
        window.addEventListener('resize', handleUpdate)
        return () => {
          scrollContainer.removeEventListener('scroll', handleUpdate)
          window.removeEventListener('resize', handleUpdate)
        }
      }
    }
  }, [isLoading, sections, iframeKey])

  // Scroll to section in iframe and update position
  React.useEffect(() => {
    if (selectedSectionId && iframeRef.current) {
      const section = sections.find(s => s.id === selectedSectionId)
      if (section) {
        try {
          const iframe = iframeRef.current
          if (iframe.contentWindow) {
            setTimeout(() => {
              try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
                if (iframeDoc) {
                  const sectionElement = iframeDoc.querySelector(`[data-section-key="${section.key}"]`)
                  if (sectionElement) {
                    sectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    // Recalculate position after scroll
                    setTimeout(() => {
                      const element = iframeDoc.querySelector(`[data-section-key="${section.key}"]`)
                      if (element) {
                        const rect = element.getBoundingClientRect()
                        const iframeRect = iframe.getBoundingClientRect()
                        setSectionPositions(prev => ({
                          ...prev,
                          [section.id]: new DOMRect(
                            rect.left - iframeRect.left,
                            rect.top - iframeRect.top,
                            rect.width,
                            rect.height
                          )
                        }))
                      }
                    }, 500)
                  }
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


          {/* Accurate section highlight overlay - only show if we have position data */}
          {selectedSection && isWidgetMode && sectionPositions[selectedSection.id] && (
            <div
              ref={highlightOverlayRef}
              className="absolute pointer-events-none z-20 border-4 border-primary rounded-lg transition-all duration-300"
              style={{
                left: `${sectionPositions[selectedSection.id].left}px`,
                top: `${sectionPositions[selectedSection.id].top}px`,
                width: `${sectionPositions[selectedSection.id].width}px`,
                height: `${sectionPositions[selectedSection.id].height}px`,
                boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.4), inset 0 0 0 3px rgba(59, 130, 246, 0.3)',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
              }}
            >
              {/* Pulse animation */}
              <div className="absolute inset-0 border-2 border-primary rounded-lg animate-pulse opacity-50" />
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

        </div>
      </div>
    </div>
  )
}
