"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SectionForm } from "@/components/section-form"
import { IconX, IconLayoutDashboard } from "@tabler/icons-react"
import type { PageSectionV2 } from "@/lib/types"

interface SectionInspectorPanelProps {
  section: PageSectionV2 | null
  orgId: string
  pageId: string
  pageSlug: string
  sectionKey: string
  pageBaseUrl?: string | null
  draftContent: Record<string, unknown>
  onContentChange: (content: Record<string, unknown> | string | number | boolean) => void
  onClose: () => void
  onSave?: () => void
  onConvertToWidget?: () => void
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
  onConvertToWidget,
}: SectionInspectorPanelProps) {
  if (!section) {
    return null
  }

  return (
    <div className="w-96 border-l bg-background flex flex-col h-full relative">
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

      {/* Floating Convert to Widget Button */}
      <div className="absolute bottom-6 right-6 z-50">
        <Button
          onClick={() => onConvertToWidget?.()}
          className="shadow-lg rounded-full h-12 px-4 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105"
          size="lg"
        >
          <IconLayoutDashboard className="h-5 w-5" />
          <span className="font-medium">Convert to Widget</span>
        </Button>
      </div>
    </div>
  )
}

