"use client"

import { useState, useEffect } from "react"
import * as React from "react"
import { Band } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconEdit, IconTrash, IconPlus, IconCalendar } from "@tabler/icons-react"
import Image from "next/image"
import { toast } from "sonner"
import { BandFormModal } from "./band-form-modal"
import { cn } from "@/lib/utils"
import { EventStatusBadge } from "@/components/event-status-badge"
import { Event as FullEvent, EventBand, EventInstanceBand } from "@/lib/types"
import { formatEventDateTime, formatWeeklyEventDateTime, formatVisibilityWindow } from "@/lib/events"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  DialogFooter,
} from "@/components/ui/dialog"

interface BandsManagerProps {
  orgId: string
  showFormModal?: boolean
  onFormModalChange?: (open: boolean) => void
}

interface Event {
  id: string
  title: string
  starts_at: string | null
  ends_at: string | null
  is_weekly: boolean
  day_of_week: number | null
  status: string
  image_url: string | null
}

export function BandsManager({ orgId, showFormModal: externalShowFormModal, onFormModalChange }: BandsManagerProps) {
  const [bands, setBands] = useState<Band[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [editingBand, setEditingBand] = useState<Band | null>(null)
  const [internalShowFormModal, setInternalShowFormModal] = useState(false)
  const [selectedBand, setSelectedBand] = useState<Band | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({})
  const [bandEvents, setBandEvents] = useState<Record<string, Event[]>>({})
  const [showEventsModal, setShowEventsModal] = useState(false)
  const [selectedBandForEvents, setSelectedBandForEvents] = useState<Band | null>(null)
  const [loadingEvents, setLoadingEvents] = useState<string | null>(null)
  const [eventDetailsModalOpen, setEventDetailsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<FullEvent | null>(null)
  const [eventBands, setEventBands] = useState<Record<string, EventBand[]>>({})
  const [bandInstanceDates, setBandInstanceDates] = useState<Record<string, string[]>>({})
  const prevExternalModalState = React.useRef(false)

  // Use external modal state if provided, otherwise use internal state
  const showFormModal = externalShowFormModal !== undefined ? externalShowFormModal : internalShowFormModal
  const setShowFormModal = onFormModalChange || setInternalShowFormModal

  const DESCRIPTION_LIMIT = 50

  const fetchBands = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/businesses/${orgId}/bands`)
      if (response.ok) {
        const data = await response.json()
        const fetchedBands = data.bands || []
        setBands(fetchedBands)
        
        // Fetch event counts for each band
        const counts: Record<string, number> = {}
        for (const band of fetchedBands) {
          try {
            const eventsResponse = await fetch(`/api/businesses/${orgId}/bands/${band.id}/events`)
            if (eventsResponse.ok) {
              const eventsData = await eventsResponse.json()
              counts[band.id] = eventsData.events?.length || 0
            } else {
              counts[band.id] = 0
            }
          } catch (error) {
            console.error(`Error fetching events for band ${band.id}:`, error)
            counts[band.id] = 0
          }
        }
        setEventCounts(counts)
      } else {
        throw new Error('Failed to fetch bands')
      }
    } catch (error) {
      console.error('Error fetching bands:', error)
      toast.error('Failed to load bands')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBandEvents = async (bandId: string) => {
    if (bandEvents[bandId]) {
      // Already fetched, just show modal
      setSelectedBandForEvents(bands.find(b => b.id === bandId) || null)
      setShowEventsModal(true)
      return
    }

    setLoadingEvents(bandId)
    try {
      const response = await fetch(`/api/businesses/${orgId}/bands/${bandId}/events`)
      if (response.ok) {
        const data = await response.json()
        const events = data.events || []
        setBandEvents(prev => ({ ...prev, [bandId]: events }))
        setSelectedBandForEvents(bands.find(b => b.id === bandId) || null)
        setShowEventsModal(true)
      } else {
        throw new Error('Failed to fetch events')
      }
    } catch (error) {
      console.error('Error fetching band events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoadingEvents(null)
    }
  }

  const handleEventsClick = (e: React.MouseEvent, band: Band) => {
    e.stopPropagation()
    fetchBandEvents(band.id)
  }

  useEffect(() => {
    if (orgId) {
      fetchBands()
    }
  }, [orgId])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this band?')) {
      return
    }

    setIsDeleting(id)
    try {
      const response = await fetch(`/api/businesses/${orgId}/bands/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete band')
      }

      setBands(bands.filter(band => band.id !== id))
      toast.success('Band deleted successfully')
    } catch (error) {
      console.error('Error deleting band:', error)
      toast.error('Failed to delete band')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleEdit = (band: Band) => {
    setEditingBand(band)
    setShowFormModal(true)
  }

  const handleCreate = () => {
    setEditingBand(null)
    setShowFormModal(true)
  }

  // When modal opens externally (from page button), ensure editingBand is null for create mode
  useEffect(() => {
    if (externalShowFormModal !== undefined && onFormModalChange) {
      const justOpened = externalShowFormModal && !prevExternalModalState.current
      if (justOpened && editingBand) {
        // Modal just opened from page button, clear editingBand to ensure create mode
        setEditingBand(null)
      }
      prevExternalModalState.current = externalShowFormModal
    }
  }, [externalShowFormModal, onFormModalChange, editingBand])

  const handleFormSuccess = () => {
    setShowFormModal(false)
    setEditingBand(null)
    fetchBands()
  }

  const handleRowClick = (band: Band) => {
    setSelectedBand(band)
    setShowDetailsModal(true)
  }

  const truncateDescription = (description: string | undefined | null): string => {
    if (!description) return ""
    if (description.length <= DESCRIPTION_LIMIT) return description
    return description.substring(0, DESCRIPTION_LIMIT) + "..."
  }

  if (isLoading) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">Loading bands...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {bands.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No bands yet</CardTitle>
          </CardHeader>
          <div className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Get started by adding your first band.
            </p>
            <Button onClick={handleCreate}>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Your First Band
            </Button>
          </div>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Events</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bands.map((band) => (
                <TableRow 
                  key={band.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(band)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {band.image_url ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-md">
                        <Image
                          src={band.image_url}
                          alt={band.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">No image</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{band.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {band.description ? (
                      truncateDescription(band.description)
                    ) : (
                      <span className="italic">No description</span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleEventsClick(e, band)}
                      disabled={loadingEvents === band.id}
                      className={cn(
                        "inline-flex items-center gap-1.5 text-sm font-medium transition-colors",
                        "hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed",
                        eventCounts[band.id] > 0 ? "text-primary cursor-pointer" : "text-muted-foreground"
                      )}
                    >
                      <IconCalendar className="h-4 w-4" />
                      {loadingEvents === band.id ? (
                        "Loading..."
                      ) : (
                        `${eventCounts[band.id] || 0} event${eventCounts[band.id] !== 1 ? 's' : ''}`
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(band)}
                      >
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(band.id)}
                        disabled={isDeleting === band.id}
                      >
                        <IconTrash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showFormModal && (
        <BandFormModal
          orgId={orgId}
          band={editingBand}
          open={showFormModal}
          onOpenChange={setShowFormModal}
          onSuccess={handleFormSuccess}
        />
      )}

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBand?.name}</DialogTitle>
            <DialogDescription>Band Details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBand?.image_url && (
              <div className="relative h-64 w-full overflow-hidden rounded-md">
                <Image
                  src={selectedBand.image_url}
                  alt={selectedBand.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">
                {selectedBand?.description || (
                  <span className="italic">No description provided</span>
                )}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false)
                  if (selectedBand) {
                    handleEdit(selectedBand)
                  }
                }}
              >
                <IconEdit className="mr-2 h-4 w-4" />
                Edit Band
              </Button>
              <Button onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEventsModal} onOpenChange={setShowEventsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Events with {selectedBandForEvents?.name}
            </DialogTitle>
            <DialogDescription>
              {bandEvents[selectedBandForEvents?.id || '']?.length || 0} event(s) featuring this band
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {loadingEvents === selectedBandForEvents?.id ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading events...</p>
              </div>
            ) : bandEvents[selectedBandForEvents?.id || '']?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">This band is not attached to any events yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bandEvents[selectedBandForEvents?.id || '']?.map((event) => {
                  const formatDate = (dateStr: string | null) => {
                    if (!dateStr) return 'Date TBD'
                    const date = new Date(dateStr)
                    return date.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })
                  }

                  const formatWeeklyDate = (dayOfWeek: number | null) => {
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                    return dayOfWeek !== null ? days[dayOfWeek] : 'TBD'
                  }

                  const handleEventClick = async () => {
                    try {
                      // Fetch full event data
                      const response = await fetch(`/api/businesses/${orgId}/events/${event.id}`)
                      if (response.ok) {
                        const data = await response.json()
                        setSelectedEvent(data.event as FullEvent)
                        
                        // Fetch bands if Jazz/Live Music event
                        if (data.event.event_type === "Jazz" || data.event.event_type === "Live Music") {
                          const bandsResponse = await fetch(`/api/businesses/${orgId}/events/${event.id}/bands`)
                          if (bandsResponse.ok) {
                            const bandsData = await bandsResponse.json()
                            setEventBands({ [event.id]: bandsData.eventBands || [] })
                          }
                        }
                        
                        // Fetch instances to find which ones have this band
                        if (selectedBandForEvents && data.event.is_weekly) {
                          const instancesResponse = await fetch(`/api/businesses/${orgId}/events/${event.id}/instances`)
                          if (instancesResponse.ok) {
                            const instancesData = await instancesResponse.json()
                            const instances = instancesData.instances || []
                            
                            // Check if band is attached to event directly (applies to all instances)
                            const eventBandsResponse = await fetch(`/api/businesses/${orgId}/events/${event.id}/bands`)
                            let bandAttachedToEvent = false
                            if (eventBandsResponse.ok) {
                              const eventBandsData = await eventBandsResponse.json()
                              bandAttachedToEvent = (eventBandsData.eventBands || []).some(
                                (eb: EventBand) => eb.band_id === selectedBandForEvents.id
                              )
                            }
                            
                            // Find instances where this band is attached
                            const bandInstanceDatesList: string[] = []
                            
                            for (const instance of instances) {
                              // If band is attached to event, include all instances
                              if (bandAttachedToEvent) {
                                bandInstanceDatesList.push(instance.instance_date)
                              } else {
                                // Check if band is attached to this specific instance
                                const instanceBandsResponse = await fetch(
                                  `/api/businesses/${orgId}/events/${event.id}/instances/${instance.id}/bands`
                                )
                                if (instanceBandsResponse.ok) {
                                  const instanceBandsData = await instanceBandsResponse.json()
                                  const hasBand = (instanceBandsData.instanceBands || []).some(
                                    (ib: EventInstanceBand) => ib.band_id === selectedBandForEvents.id
                                  )
                                  if (hasBand) {
                                    bandInstanceDatesList.push(instance.instance_date)
                                  }
                                }
                              }
                            }
                            
                            setBandInstanceDates({ [event.id]: bandInstanceDatesList })
                          }
                        }
                        
                        setEventDetailsModalOpen(true)
                      }
                    } catch (error) {
                      console.error('Error fetching event:', error)
                      toast.error('Failed to load event details')
                    }
                  }

                  return (
                    <div
                      key={event.id}
                      onClick={handleEventClick}
                      className="block cursor-pointer"
                    >
                      <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        {event.image_url && (
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={event.image_url}
                              alt={event.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {event.is_weekly
                              ? `Weekly on ${formatWeeklyDate(event.day_of_week)}`
                              : formatDate(event.starts_at)}
                          </p>
                          <span className={cn(
                            "inline-block mt-1 text-xs px-2 py-0.5 rounded",
                            event.status === 'live' ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                            event.status === 'scheduled' ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                            event.status === 'past' ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" :
                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          )}>
                            {event.status}
                          </span>
                        </div>
                        <IconCalendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
            <Button onClick={() => setShowEventsModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={eventDetailsModalOpen} onOpenChange={setEventDetailsModalOpen}>
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
                        {(() => {
                          // If viewing from bands page and we have instance dates for this band, show those
                          if (selectedBandForEvents && selectedEvent.is_weekly && bandInstanceDates[selectedEvent.id] && bandInstanceDates[selectedEvent.id].length > 0) {
                            const dates = bandInstanceDates[selectedEvent.id]
                              .sort()
                              .map(dateStr => {
                                const [year, month, day] = dateStr.split('-').map(Number)
                                const date = new Date(year, month - 1, day)
                                
                                // Extract time from starts_at and ends_at
                                let timeStr = ''
                                if (selectedEvent.starts_at && selectedEvent.ends_at) {
                                  try {
                                    const startTime = new Date(selectedEvent.starts_at)
                                    const endTime = new Date(selectedEvent.ends_at)
                                    timeStr = format(startTime, 'h:mm a') + ' - ' + format(endTime, 'h:mm a')
                                  } catch {
                                    // Fallback if time parsing fails
                                    const startMatch = selectedEvent.starts_at.match(/T(\d{2}):(\d{2})/)
                                    const endMatch = selectedEvent.ends_at.match(/T(\d{2}):(\d{2})/)
                                    if (startMatch && endMatch) {
                                      const startHour = parseInt(startMatch[1], 10)
                                      const startMin = parseInt(startMatch[2], 10)
                                      const endHour = parseInt(endMatch[1], 10)
                                      const endMin = parseInt(endMatch[2], 10)
                                      const startPeriod = startHour >= 12 ? 'PM' : 'AM'
                                      const endPeriod = endHour >= 12 ? 'PM' : 'AM'
                                      const startHour12 = startHour > 12 ? startHour - 12 : startHour === 0 ? 12 : startHour
                                      const endHour12 = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour
                                      timeStr = `${startHour12}:${startMin.toString().padStart(2, '0')} ${startPeriod} - ${endHour12}:${endMin.toString().padStart(2, '0')} ${endPeriod}`
                                    }
                                  }
                                }
                                
                                return format(date, 'EEEE, MMMM d, yyyy') + (timeStr ? ` · ${timeStr}` : '')
                              })
                            
                            if (dates.length <= 3) {
                              return dates.join(', ')
                            } else {
                              return `${dates.slice(0, 3).join(', ')} and ${dates.length - 3} more`
                            }
                          }
                          
                          // Otherwise show the standard format
                          return selectedEvent.is_weekly && selectedEvent.day_of_week !== undefined
                            ? formatWeeklyEventDateTime(selectedEvent.day_of_week, selectedEvent.starts_at, selectedEvent.ends_at)
                            : selectedEvent.starts_at && selectedEvent.ends_at
                            ? formatEventDateTime(selectedEvent.starts_at, selectedEvent.ends_at)
                            : 'No date/time set'
                        })()}
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
                  onClick={() => setEventDetailsModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setEventDetailsModalOpen(false)
                    window.location.href = `/client/${orgId}/events/${selectedEvent.id}`
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
