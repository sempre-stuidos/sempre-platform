"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
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

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-96 bg-background border rounded-lg shadow-2xl transition-all duration-300 ${
      isMinimized ? 'h-16' : 'h-[500px]'
    } flex flex-col`}>
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between bg-muted/50">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">{section.label}</h3>
          {!isMinimized && (
            <p className="text-xs text-muted-foreground truncate">
              {section.component}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onExpand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExpand}
              className="h-7 w-7 p-0"
              title="Expand to full panel"
            >
              <IconChevronUp className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-7 w-7 p-0"
            title={isMinimized ? "Expand" : "Minimize"}
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
        <>
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
                onSave={() => {
                  onSave?.()
                }}
              />
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  )
}

