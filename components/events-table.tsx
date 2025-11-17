"use client"

import * as React from "react"
import { IconEdit, IconCopy, IconArchive, IconDotsVertical } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EventStatusBadge } from "@/components/event-status-badge"
import { Event } from "@/lib/types"
import { formatEventDateTime, formatVisibilityWindow } from "@/lib/events"
import Image from "next/image"

interface EventsTableProps {
  orgId: string
  events: Event[]
}

export function EventsTable({ orgId, events }: EventsTableProps) {
  const router = useRouter()

  const handleEdit = (eventId: string) => {
    router.push(`/client/${orgId}/events/${eventId}`)
  }

  const handleDuplicate = (event: Event) => {
    // For now, just navigate to new page with event data in query params
    // In a real app, this would create a copy via API
    router.push(`/client/${orgId}/events/new?duplicate=${event.id}`)
  }

  const handleArchive = (eventId: string) => {
    // In a real app, this would call an API to archive the event
    console.log('Archive event:', eventId)
  }

  if (events.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">No events found. Create your first event to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Event</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Visibility Window</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow
              key={event.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleEdit(event.id)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  {event.image_url ? (
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 flex-shrink-0 rounded-md bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">No image</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{event.title}</div>
                    {event.short_description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {event.short_description}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {formatEventDateTime(event.starts_at, event.ends_at)}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {formatVisibilityWindow(event.publish_start_at, event.publish_end_at)}
                </div>
              </TableCell>
              <TableCell>
                <EventStatusBadge status={event.status} />
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu onOpenChange={(open) => open}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                    >
                      <IconDotsVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(event.id)
                      }}
                    >
                      <IconEdit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDuplicate(event)
                      }}
                    >
                      <IconCopy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleArchive(event.id)
                      }}
                      className="text-red-600"
                    >
                      <IconArchive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

