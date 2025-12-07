"use client"

import * as React from "react"
import { IconEdit, IconCopy, IconArchive, IconDotsVertical, IconTrash } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EventStatusBadge } from "@/components/event-status-badge"
import { Event } from "@/lib/types"
import { formatEventDateTime, formatWeeklyEventDateTime, formatVisibilityWindow } from "@/lib/events"
import Image from "next/image"

interface EventsTableProps {
  orgId: string
  events: Event[]
  onEventDeleted?: (eventId: string) => void
}

export function EventsTable({ orgId, events, onEventDeleted }: EventsTableProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [eventToDelete, setEventToDelete] = React.useState<Event | null>(null)

  const handleEdit = (eventId: string) => {
    router.push(`/client/${orgId}/events/${eventId}`)
  }

  const handleDuplicate = (event: Event) => {
    // For now, just navigate to new page with event data in query params
    // In a real app, this would create a copy via API
    router.push(`/client/${orgId}/events/new?duplicate=${event.id}`)
  }

  const handleArchive = async (eventId: string) => {
    try {
      const response = await fetch(`/api/businesses/${orgId}/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'archived' }),
      })

      if (!response.ok) {
        throw new Error('Failed to archive event')
      }

      toast.success('Event archived successfully')
      router.refresh()
    } catch (error) {
      console.error('Error archiving event:', error)
      toast.error('Failed to archive event')
    }
  }

  const handleDeleteClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation()
    setEventToDelete(event)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!eventToDelete) return

    const eventIdToDelete = eventToDelete.id

    try {
      const response = await fetch(`/api/businesses/${orgId}/events/${eventIdToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete event')
      }

      toast.success('Event deleted successfully')
      setDeleteDialogOpen(false)
      setEventToDelete(null)
      
      // Remove event from UI immediately
      onEventDeleted?.(eventIdToDelete)
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Failed to delete event')
    }
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
                  {event.is_weekly && event.day_of_week !== undefined
                    ? formatWeeklyEventDateTime(event.day_of_week, event.starts_at, event.ends_at)
                    : event.starts_at && event.ends_at
                    ? formatEventDateTime(event.starts_at, event.ends_at)
                    : 'No date/time set'}
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => handleDeleteClick(event, e)}
                      className="text-red-600"
                    >
                      <IconTrash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{eventToDelete?.title}"? This action is irreversible and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEventToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

