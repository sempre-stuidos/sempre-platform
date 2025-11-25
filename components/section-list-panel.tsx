"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { PageSectionV2 } from "@/lib/types"
import { IconLock, IconChevronLeft, IconChevronRight, IconChevronDown } from "@tabler/icons-react"
import { getComponentFieldKeys, getComponentSchema } from "@/lib/component-schemas"

interface SectionListPanelProps {
  sections: PageSectionV2[]
  selectedSectionId: string | null
  selectedComponentKey?: string | null
  onSelectSection: (sectionId: string) => void
  onSelectComponent?: (sectionId: string, componentKey: string) => void
  onScrollToSection: (sectionId: string) => void
}

export function SectionListPanel({
  sections,
  selectedSectionId,
  selectedComponentKey,
  onSelectSection,
  onSelectComponent,
  onScrollToSection,
}: SectionListPanelProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set())

  // Extract component keys from section content, using schema when available
  const getComponentKeys = (section: PageSectionV2): string[] => {
    // Get schema for this component type if available
    const schemaKeys = getComponentFieldKeys(section.component)
    
    if (schemaKeys.length > 0) {
      // For components with a schema, ALWAYS return all schema keys
      // This ensures users can see and edit all available components even if content is
      // incomplete, malformed, or empty. This matches how other sections work.
      return schemaKeys
    }
    
    // For components without a schema, return top-level keys from content
    const content = section.draft_content || section.published_content || {}
    return Object.keys(content).filter(key => {
      const value = content[key]
      // Only include top-level keys that are objects or have meaningful content
      // Exclude nested keys (e.g., don't show 'icon' and 'text' from inside badge)
      return value !== null && value !== undefined
    })
  }

  const toggleSectionExpand = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  // Auto-expand selected section
  React.useEffect(() => {
    if (selectedSectionId && !expandedSections.has(selectedSectionId)) {
      setExpandedSections(prev => new Set(prev).add(selectedSectionId))
    }
  }, [selectedSectionId, expandedSections])

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
          {sections.map((section) => {
            const isSelected = selectedSectionId === section.id
            const isExpanded = expandedSections.has(section.id)
            const componentKeys = getComponentKeys(section)
            const hasComponents = componentKeys.length > 0

            return (
              <div key={section.id} className="space-y-0.5">
                <div className="flex items-center gap-1">
                  {hasComponents && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSectionExpand(section.id)
                      }}
                    >
                      {isExpanded ? (
                        <IconChevronDown className="h-3 w-3" />
                      ) : (
                        <IconChevronRight className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant={isSelected && !selectedComponentKey ? 'secondary' : 'ghost'}
                    className="flex-1 justify-start h-auto py-1.5 px-2.5 text-left hover:bg-accent/50"
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
                </div>
                {isExpanded && hasComponents && (
                  <div className="pl-7 space-y-0.5">
                    {componentKeys.map((componentKey) => {
                      const isComponentSelected = isSelected && selectedComponentKey === componentKey
                      return (
                        <Button
                          key={componentKey}
                          variant={isComponentSelected ? 'secondary' : 'ghost'}
                          className="w-full justify-start h-auto py-1 px-2 text-left hover:bg-accent/50 text-[10px]"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onSelectComponent) {
                              onSelectComponent(section.id, componentKey)
                            }
                          }}
                        >
                          <span className="truncate">
                            {componentKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                          </span>
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
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

