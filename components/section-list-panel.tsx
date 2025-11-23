"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { PageSectionV2 } from "@/lib/types"
import { IconLock, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"

interface SectionListPanelProps {
  sections: PageSectionV2[]
  selectedSectionId: string | null
  onSelectSection: (sectionId: string) => void
  onScrollToSection: (sectionId: string) => void
}

export function SectionListPanel({
  sections,
  selectedSectionId,
  onSelectSection,
  onScrollToSection,
}: SectionListPanelProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  const getStatusBadge = (section: PageSectionV2) => {
    if (section.status === 'dirty') {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px] px-1.5 py-0 h-4">
          Draft
        </Badge>
      )
    }
    if (section.status === 'published') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1.5 py-0 h-4">
          Pub
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-[10px] px-1.5 py-0 h-4">
        Draft
      </Badge>
    )
  }

  const handleSectionClick = (section: PageSectionV2) => {
    onScrollToSection(section.id)
    onSelectSection(section.id)
  }

  if (isCollapsed) {
    return (
      <div className="w-12 border-r bg-muted/30 flex flex-col items-center py-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setIsCollapsed(false)}
          title="Expand sections panel"
        >
          <IconChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col transition-all">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Sections</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sections.length} section{sections.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setIsCollapsed(true)}
          title="Collapse sections panel"
        >
          <IconChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-0.5">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={selectedSectionId === section.id ? 'secondary' : 'ghost'}
              className="w-full justify-start h-auto py-1.5 px-2.5 text-left hover:bg-accent/50"
              onClick={() => handleSectionClick(section)}
            >
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium truncate">{section.label}</span>
                    {getStatusBadge(section)}
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate block mt-0.5">
                    {section.component}
                  </span>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
      <div className="p-3 border-t bg-muted/50">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <IconLock className="h-3 w-3" />
          <span>Layout is locked</span>
        </div>
      </div>
    </div>
  )
}

