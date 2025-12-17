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
import Link from "next/link"
import { cn } from "@/lib/utils"

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

                  return (
                    <Link
                      key={event.id}
                      href={`/client/${orgId}/events/${event.id}`}
                      className="block"
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
                    </Link>
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
    </div>
  )
}
