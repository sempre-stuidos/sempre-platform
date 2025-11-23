"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SectionForm } from "@/components/section-form"
import { IconX, IconChevronUp, IconChevronDown } from "@tabler/icons-react"
import type { PageSectionV2 } from "@/lib/types"

interface SectionWidgetProps {
  section: PageSectionV2
  orgId: string
  pageId: string
  pageSlug: string
  sectionKey: string
  pageBaseUrl?: string | null
  draftContent: Record<string, unknown>
  onContentChange: (content: Record<string, unknown>) => void
  onClose: () => void
  onSave?: () => void
  onExpand?: () => void
}

export function SectionWidget({
  section,
  orgId,
  pageId,
  pageSlug,
  sectionKey,
  pageBaseUrl,
  draftContent,
  onContentChange,
  onClose,
  onSave,
  onExpand,
}: SectionWidgetProps) {
  const [isMinimized, setIsMinimized] = React.useState(false)

  const getStatusBadge = () => {
    if (section.status === 'dirty') {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px] h-4 px-1.5 py-0">
          Draft
        </Badge>
      )
    }
    if (section.status === 'published') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] h-4 px-1.5 py-0">
          Pub
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-[10px] h-4 px-1.5 py-0">
        Draft
      </Badge>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-96 bg-background border rounded-lg shadow-2xl transition-all duration-300 ${
      isMinimized ? 'h-16' : 'h-[500px]'
    } flex flex-col`}>
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between bg-muted/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate">{section.label}</h3>
            {getStatusBadge()}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-7 w-7 p-0"
            title="Minimize"
          >
            {isMinimized ? (
              <IconChevronUp className="h-4 w-4" />
            ) : (
              <IconChevronDown className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0"
            title="Close widget"
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-4">
              <SectionForm
                component={section.component}
                draftContent={draftContent}
                onContentChange={onContentChange}
                sectionId={section.id}
                orgId={orgId}
                pageId={pageId}
                pageSlug={pageSlug}
                sectionKey={sectionKey}
                pageBaseUrl={pageBaseUrl}
                isWidgetMode={true}
                onSave={() => {
                  onSave?.()
                }}
              />
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

