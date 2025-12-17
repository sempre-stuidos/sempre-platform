"use client"

import * as React from "react"
import { IconEdit, IconCopy, IconArchive, IconTrash } from "@tabler/icons-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EventStatusBadge } from "@/components/event-status-badge"
import { Event, EventBand } from "@/lib/types"
import { formatEventDateTime, formatWeeklyEventDateTime, formatVisibilityWindow } from "@/lib/events"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface EventsTableProps {
  orgId: string
  events: Event[]
  onEventDeleted?: (eventId: string) => void
}

export function EventsTable({ orgId, events, onEventDeleted }: EventsTableProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [eventToDelete, setEventToDelete] = React.useState<Event | null>(null)
  const [eventBands, setEventBands] = React.useState<Record<string, EventBand[]>>({})
  const [detailsModalOpen, setDetailsModalOpen] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null)
  const [instanceCounts, setInstanceCounts] = React.useState<Record<string, number>>({})
  const [loadingCounts, setLoadingCounts] = React.useState<Record<string, boolean>>({})

  // Fetch bands for all events
  React.useEffect(() => {
    const fetchBands = async () => {
      const bandsMap: Record<string, EventBand[]> = {}
      
      for (const event of events) {
        if (event.event_type === "Jazz" || event.event_type === "Live Music") {
          try {
            const response = await fetch(`/api/businesses/${orgId}/events/${event.id}/bands`)
            if (response.ok) {
              const data = await response.json()
              bandsMap[event.id] = data.eventBands || []
            }
          } catch (error) {
            console.error(`Error fetching bands for event ${event.id}:`, error)
          }
        }
      }
      
      setEventBands(bandsMap)
    }

    if (events.length > 0) {
      fetchBands()
    }
  }, [events, orgId])

  // Fetch instance counts for weekly events
  React.useEffect(() => {
    const fetchInstanceCounts = async () => {
      const counts: Record<string, number> = {}
      const loading: Record<string, boolean> = {}
      
      for (const event of events) {
        if (event.is_weekly) {
          loading[event.id] = true
          try {
            const response = await fetch(`/api/businesses/${orgId}/events/${event.id}/instances`)
            if (response.ok) {
              const data = await response.json()
              counts[event.id] = data.instances?.length || 0
            } else {
              counts[event.id] = 0
            }
          } catch (error) {
            console.error(`Error fetching instances for event ${event.id}:`, error)
            counts[event.id] = 0
          } finally {
            loading[event.id] = false
          }
        }
      }
      
      setInstanceCounts(counts)
      setLoadingCounts(loading)
    }

    if (events.length > 0) {
      fetchInstanceCounts()
    }
  }, [events, orgId])

  const handleEdit = (eventId: string) => {
    router.push(`/client/${orgId}/events/${eventId}`)
  }

  const handleRowClick = (event: Event) => {
    setSelectedEvent(event)
    setDetailsModalOpen(true)
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
            <TableHead>Event Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow
              key={event.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleRowClick(event)}
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
                    {(event.event_type === "Jazz" || event.event_type === "Live Music") && eventBands[event.id] && eventBands[event.id].length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {eventBands[event.id].map((eb) => (
                          <Badge key={eb.id} variant="secondary" className="text-xs">
                            {eb.band?.name || 'Unknown Band'}
                          </Badge>
                        ))}
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
                {event.is_weekly ? (
                  <Link
                    href={`/client/${orgId}/events/${event.id}/calendar`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    {loadingCounts[event.id] ? (
                      'Loading...'
                    ) : (
                      `${instanceCounts[event.id] || 0} date${(instanceCounts[event.id] || 0) !== 1 ? 's' : ''}`
                    )}
                  </Link>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {formatVisibilityWindow(event.publish_start_at, event.publish_end_at)}
                  </div>
                )}
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
                      SEE ALL
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
              Are you sure you want to delete &quot;{eventToDelete?.title}&quot;? This action is irreversible and cannot be undone.
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

      {/* Event Details Dialog */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="sm:max-w-5xl max-w-[95vw]">
          {selectedEvent && (
            <>
              <DialogHeader className="pb-4">
                <DialogTitle className="text-2xl">{selectedEvent.title}</DialogTitle>
                <DialogDescription>
                  View event details and information
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Event Details */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Descriptions Section */}
                  {(selectedEvent.short_description || selectedEvent.description) && (
                    <div className="space-y-3">
                      {selectedEvent.short_description && (
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Short Description</div>
                          <div className="text-sm leading-relaxed">{selectedEvent.short_description}</div>
                        </div>
                      )}
                      {selectedEvent.description && (
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</div>
                          <div className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{selectedEvent.description}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Event Info Grid */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    {selectedEvent.event_type && (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Event Type</div>
                        <div className="text-sm font-medium">{selectedEvent.event_type}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Status</div>
                      <EventStatusBadge status={selectedEvent.status} />
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Date & Time</div>
                      <div className="text-sm font-medium">
                        {selectedEvent.is_weekly && selectedEvent.day_of_week !== undefined
                          ? formatWeeklyEventDateTime(selectedEvent.day_of_week, selectedEvent.starts_at, selectedEvent.ends_at)
                          : selectedEvent.starts_at && selectedEvent.ends_at
                          ? formatEventDateTime(selectedEvent.starts_at, selectedEvent.ends_at)
                          : 'No date/time set'}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Visibility Window</div>
                      <div className="text-sm text-muted-foreground">
                        {formatVisibilityWindow(selectedEvent.publish_start_at, selectedEvent.publish_end_at)}
                      </div>
                    </div>
                    {selectedEvent.is_weekly && (
                      <div className="col-span-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Weekly Event</div>
                        <div className="text-sm">
                          {selectedEvent.day_of_week !== undefined && (
                            <span className="font-medium">
                              Repeats every {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedEvent.day_of_week]}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Featured</div>
                      <div className="text-sm font-medium">{selectedEvent.is_featured ? 'Yes' : 'No'}</div>
                    </div>
                  </div>

                  {/* Bands Section */}
                  {(selectedEvent.event_type === "Jazz" || selectedEvent.event_type === "Live Music") && 
                   eventBands[selectedEvent.id] && 
                   eventBands[selectedEvent.id].length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Bands</div>
                      <div className="flex flex-wrap gap-2">
                        {eventBands[selectedEvent.id].map((eb) => (
                          <Badge key={eb.id} variant="secondary" className="text-xs py-1 px-2">
                            {eb.band?.name || 'Unknown Band'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata Section */}
                  <div className="pt-3 border-t">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="font-semibold text-muted-foreground uppercase tracking-wide mb-1">Created</div>
                        <div className="text-muted-foreground">
                          {new Date(selectedEvent.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-muted-foreground uppercase tracking-wide mb-1">Last Updated</div>
                        <div className="text-muted-foreground">
                          {new Date(selectedEvent.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Event Image */}
                <div className="lg:col-span-1">
                  {selectedEvent.image_url ? (
                    <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden border shadow-sm">
                      <Image
                        src={selectedEvent.image_url}
                        alt={selectedEvent.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/5] rounded-lg bg-muted flex items-center justify-center border">
                      <span className="text-sm text-muted-foreground">No image</span>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDetailsModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setDetailsModalOpen(false)
                    handleEdit(selectedEvent.id)
                  }}
                >
                  <IconEdit className="h-4 w-4 mr-2" />
                  Edit Event
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

