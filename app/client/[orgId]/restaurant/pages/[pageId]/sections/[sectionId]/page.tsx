"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import { SectionForm } from "@/components/section-form"
import { SectionPreview } from "@/components/section-preview"
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
  const [resolvedParams, setResolvedParams] = React.useState<{
    orgId: string
    pageId: string
    sectionId: string
  } | null>(null)
  const [section, setSection] = React.useState<PageSectionV2 | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [draftContent, setDraftContent] = React.useState<Record<string, any>>({})
  const [pageSlug, setPageSlug] = React.useState<string>('')

  React.useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  React.useEffect(() => {
    if (resolvedParams) {
      loadSection()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams])

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

      // Get page slug from the pageId - we can get it from the section's page_id
      // Or we can fetch it separately if needed
      // For now, we'll use the pageId to construct the back URL, but we need the slug for preview
      // Let's fetch the page to get the slug
      const pageResponse = await fetch(`/api/pages/${resolvedParams.pageId}`)
      if (pageResponse.ok) {
        const pageData = await pageResponse.json()
        if (pageData.page) {
          setPageSlug(pageData.page.slug)
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

  const handleContentChange = (newContent: Record<string, any>) => {
    setDraftContent(newContent)
  }

  const handleSave = () => {
    loadSection()
    // Trigger refresh in parent
    window.dispatchEvent(new Event('section-updated'))
  }

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
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Edit Section – {section.label}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {section.component}
                </p>
              </div>
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
              <div className="border rounded-lg p-6 bg-card">
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

            {/* Right: Preview */}
            <div className="space-y-4">
              <div className="sticky top-4">
                <div className="border rounded-lg p-6 bg-card">
                  <h2 className="text-lg font-semibold mb-4">Live Preview</h2>
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <SectionPreview
                      component={section.component}
                      content={draftContent}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

