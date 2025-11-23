"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SectionForm } from "@/components/section-form"
import { IconX } from "@tabler/icons-react"
import type { PageSectionV2 } from "@/lib/types"

interface SectionInspectorPanelProps {
  section: PageSectionV2 | null
  orgId: string
  pageId: string
  pageSlug: string
  sectionKey: string
  pageBaseUrl?: string | null
  draftContent: Record<string, unknown>
  onContentChange: (content: Record<string, unknown>) => void
  onClose: () => void
  onSave?: () => void
}

export function SectionInspectorPanel({
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
}: SectionInspectorPanelProps) {
  if (!section) {
    return null
  }

  return (
    <div className="w-96 border-l bg-background flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold">{section.label}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {section.component}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <IconX className="h-4 w-4" />
        </Button>
      </div>
      
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
              // Don't close on save, let user continue editing
            }}
          />
        </div>
      </ScrollArea>
    </div>
  )
}

