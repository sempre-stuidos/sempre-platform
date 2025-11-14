"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import { SectionForm } from "@/components/section-form"
import { useBreadcrumb } from "@/components/breadcrumb-context"
import type { PageSectionV2 } from "@/lib/types"
import { toast } from "sonner"

interface SectionEditPageProps {
  params: Promise<{
    orgId: string
    pageId: string
    sectionId: string
  }>
}

export default function SectionEditPage({ params }: SectionEditPageProps) {
  const router = useRouter()
  const { setBreadcrumb } = useBreadcrumb()
  const [resolvedParams, setResolvedParams] = React.useState<{
    orgId: string
    pageId: string
    sectionId: string
  } | null>(null)
  const [section, setSection] = React.useState<PageSectionV2 | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [draftContent, setDraftContent] = React.useState<Record<string, unknown>>({})
  const [pageSlug, setPageSlug] = React.useState<string>('')
  const [pageName, setPageName] = React.useState<string>('')
  const [previewToken, setPreviewToken] = React.useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false)
  const [previewError, setPreviewError] = React.useState<string | null>(null)
  const [iframeKey, setIframeKey] = React.useState(0)
  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const isLoadingPreviewRef = React.useRef(false)

  React.useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  React.useEffect(() => {
    if (resolvedParams) {
      loadSection()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams])

  // Create preview token when section and pageSlug are loaded
  React.useEffect(() => {
    if (section && pageSlug && resolvedParams && !previewToken) {
      setIsLoadingPreview(true)
      isLoadingPreviewRef.current = true
      createPreviewToken()
      // Set initial timeout for first load
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        if (isLoadingPreviewRef.current) {
          setIsLoadingPreview(false)
          isLoadingPreviewRef.current = false
          setPreviewError('Connection to preview site unavailable')
        }
      }, 10000) // 10 second timeout
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, pageSlug, resolvedParams])

  // Update breadcrumb in header when page name and section are loaded
  React.useEffect(() => {
    if (pageName && section) {
      const breadcrumb = `Pages\\${pageName}\\${section.label}`
      setBreadcrumb(breadcrumb)
    }
    // Cleanup breadcrumb on unmount
    return () => {
      setBreadcrumb(null)
    }
  }, [pageName, section, setBreadcrumb])

  const loadSection = async () => {
    if (!resolvedParams) return

    try {
      setIsLoading(true)
      
      // Fetch section from API route
      const response = await fetch(`/api/sections/${resolvedParams.sectionId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Section not found')
        } else {
          toast.error('Failed to load section')
        }
        router.back()
        return
      }

      const data = await response.json()
      const loadedSection = data.section as PageSectionV2
      
      if (!loadedSection) {
        toast.error('Section not found')
        router.back()
        return
      }

      // Get page slug and name from the pageId
      const pageResponse = await fetch(`/api/pages/${resolvedParams.pageId}`)
      if (pageResponse.ok) {
        const pageData = await pageResponse.json()
        if (pageData.page) {
          setPageSlug(pageData.page.slug)
          setPageName(pageData.page.name)
        }
      }

      setSection(loadedSection)
      const initialContent = loadedSection.draft_content || {}
      setDraftContent(initialContent)
    } catch (error) {
      console.error('Error loading section:', error)
      toast.error('Failed to load section')
      router.back()
    } finally {
      setIsLoading(false)
    }
  }

  const createPreviewToken = async () => {
    if (!resolvedParams || !section) return

    try {
      const response = await fetch('/api/preview/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId: resolvedParams.orgId,
          pageId: resolvedParams.pageId,
          sectionId: resolvedParams.sectionId,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.token) {
        console.error('Failed to create preview token:', data.error)
        setPreviewError('Failed to create preview token')
        return
      }

      setPreviewToken(data.token)
      setPreviewError(null)
    } catch (error) {
      console.error('Error creating preview token:', error)
      setPreviewError('Failed to create preview token')
    }
  }

  const handleContentChange = (newContent: Record<string, unknown>) => {
    setDraftContent(newContent)
  }

  const handleSave = () => {
    loadSection()
    // Trigger refresh in parent
    window.dispatchEvent(new Event('section-updated'))
    // Refresh iframe to show updated content
    setIsLoadingPreview(true)
    isLoadingPreviewRef.current = true
    setPreviewError(null)
    // Set a timeout to detect if preview site is unreachable
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      if (isLoadingPreviewRef.current) {
        setIsLoadingPreview(false)
        isLoadingPreviewRef.current = false
        setPreviewError('Connection to preview site unavailable')
      }
    }, 10000) // 10 second timeout
    setIframeKey(prev => prev + 1)
  }

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleBack = () => {
    router.push(`/client/${resolvedParams?.orgId}/restaurant/pages/${resolvedParams?.pageId}`)
  }

  if (!resolvedParams) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading section...</p>
      </div>
    )
  }

  if (!section) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Section not found</p>
      </div>
    )
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
              >
                <IconArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
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
          </div>

          {/* Editor Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Form */}
            <div className="space-y-4">
              <div className="border rounded-lg p-6 bg-card" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="overflow-y-auto flex-1">
                  <SectionForm
                    component={section.component}
                    draftContent={draftContent}
                    onContentChange={handleContentChange}
                    sectionId={section.id}
                    orgId={resolvedParams.orgId}
                    pageId={resolvedParams.pageId}
                    pageSlug={pageSlug}
                    sectionKey={section.key}
                    onSave={handleSave}
                  />
                </div>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="space-y-4">
              <div className="sticky top-4">
                <div className="border rounded-lg p-6 bg-card">
                  <h2 className="text-lg font-semibold mb-4">Live Preview</h2>
                  {previewError ? (
                    <div className="border rounded-lg p-6 bg-muted/50 text-center">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-destructive">Connection to preview site unavailable</p>
                        <p className="text-xs text-muted-foreground">
                          The live preview is temporarily unavailable. Please contact technical support if this persists.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          We&apos;re already working on resolving this issue.
                        </p>
                      </div>
                    </div>
                  ) : previewToken && pageSlug ? (
                    <div className="border rounded-lg overflow-hidden bg-muted/50 relative">
                      {isLoadingPreview && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                          <p className="text-sm text-muted-foreground">Loading preview...</p>
                        </div>
                      )}
                      <iframe
                        key={iframeKey}
                        ref={iframeRef}
                        src={`${process.env.NEXT_PUBLIC_RESTAURANT_SITE_URL || 'http://localhost:3001'}/?page=${pageSlug}&section=${section.key}&token=${previewToken}`}
                        className="w-full border-0"
                        style={{
                          height: '80vh',
                          maxHeight: '80vh',
                          minHeight: '400px',
                        }}
                        sandbox="allow-same-origin allow-scripts"
                        onLoad={() => {
                          // Clear timeout if iframe loads successfully
                          if (timeoutRef.current) {
                            clearTimeout(timeoutRef.current)
                            timeoutRef.current = null
                          }
                          setIsLoadingPreview(false)
                          isLoadingPreviewRef.current = false
                          setPreviewError(null)
                          // Optional: Try to scroll to target section
                          try {
                            const iframe = iframeRef.current
                            if (iframe?.contentWindow) {
                              // Wait a bit for content to render
                              setTimeout(() => {
                                try {
                                  const sectionElement = iframe.contentDocument?.querySelector(`[data-section-key="${section.key}"]`)
                                  if (sectionElement) {
                                    sectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                  }
                                } catch {
                                  // Cross-origin restrictions may prevent this, that's okay
                                }
                              }, 500)
                            }
                          } catch {
                            // Cross-origin restrictions may prevent this, that's okay
                            console.log('Could not scroll to section (may be cross-origin restriction)')
                          }
                        }}
                        onError={() => {
                          if (timeoutRef.current) {
                            clearTimeout(timeoutRef.current)
                            timeoutRef.current = null
                          }
                          setIsLoadingPreview(false)
                          isLoadingPreviewRef.current = false
                          setPreviewError('Connection to preview site unavailable')
                        }}
                      />
                    </div>
                  ) : (
                    <div className="border rounded-lg p-6 bg-muted/50 text-center">
                      <p className="text-sm text-muted-foreground">Preparing preview...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

