"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Presentation } from "@/lib/types"
import { 
  IconExternalLink, 
  IconCalendar, 
  IconUser, 
  IconFileText,
  IconEdit,
  IconCopy,
  IconTrash
} from "@tabler/icons-react"
import Link from "next/link"

interface PresentationDrawerProps {
  presentation: Presentation | null
  isOpen: boolean
  onClose: () => void
}

export function PresentationDrawer({
  presentation,
  isOpen,
  onClose,
}: PresentationDrawerProps) {
  if (!presentation) return null

  const statusColors = {
    "Draft": "bg-gray-100 text-gray-800 border-gray-200",
    "Sent": "bg-blue-100 text-blue-800 border-blue-200",
    "Approved": "bg-green-100 text-green-800 border-green-200",
    "Archived": "bg-red-100 text-red-800 border-red-200"
  }

  const typeColors = {
    "Proposal": "bg-blue-100 text-blue-800 border-blue-200",
    "Onboarding": "bg-green-100 text-green-800 border-green-200",
    "Progress Update": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Report": "bg-purple-100 text-purple-800 border-purple-200",
    "Case Study": "bg-orange-100 text-orange-800 border-orange-200"
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-left">{presentation.title}</SheetTitle>
              <SheetDescription className="text-left">
                <Link 
                  href={`/clients/${presentation.clientId}`}
                  className="text-primary hover:underline"
                >
                  {presentation.clientName}
                </Link>
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`px-2 ${typeColors[presentation.type as keyof typeof typeColors] || "bg-gray-100 text-gray-800"}`}
              >
                {presentation.type}
              </Badge>
              <Badge 
                variant="outline" 
                className={`px-2 ${statusColors[presentation.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}
              >
                {presentation.status}
              </Badge>
            </div>
          </div>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Preview/Embed Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Preview</Label>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8"
              >
                <a
                  href={presentation.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <IconExternalLink className="h-4 w-4" />
                  Open in Gamma
                </a>
              </Button>
            </div>
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="aspect-video bg-background border rounded flex items-center justify-center">
                <div className="text-center space-y-2">
                  <IconFileText className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Presentation Preview
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click "Open in Gamma" to view the full presentation
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              placeholder="Add notes about this presentation (e.g., 'Client asked to update timeline section')"
              className="min-h-[100px] resize-none"
              defaultValue={presentation.description || ""}
            />
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <IconCalendar className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(presentation.createdDate).toLocaleDateString()} by {presentation.ownerName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconUser className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Last Modified</p>
                <p className="text-sm text-muted-foreground">
                  {presentation.lastModified ? 
                    new Date(presentation.lastModified).toLocaleDateString() : 
                    'N/A'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconExternalLink className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Link</p>
                <a 
                  href={presentation.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View Presentation
                </a>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full" variant="outline">
              <IconEdit className="h-4 w-4 mr-2" />
              Edit Presentation
            </Button>
            <Button className="w-full" variant="outline">
              <IconCopy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button className="w-full" variant="outline" className="text-destructive hover:text-destructive">
              <IconTrash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
