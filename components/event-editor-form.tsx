"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { EventStatusBadge } from "@/components/event-status-badge"
import { Event } from "@/lib/types"
import { computeEventStatus } from "@/lib/events"
import Image from "next/image"
import { toast } from "sonner"
import { BandSelector } from "@/components/bands/band-selector"

interface EventEditorFormProps {
  orgId: string
  event?: Event | null
  onSave?: (event: Partial<Event>) => Promise<void>
}

export function EventEditorForm({ orgId, event, onSave }: EventEditorFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const [formData, setFormData] = React.useState({
    title: event?.title || '',
    short_description: event?.short_description || '',
    description: event?.description || '',
    event_type: event?.event_type || '',
    image_url: event?.image_url || '',
    is_weekly: event?.is_weekly || false,
    day_of_week: event?.day_of_week !== undefined ? event.day_of_week : undefined,
    start_date: event?.starts_at ? new Date(event.starts_at).toISOString().split('T')[0] : '',
    start_time: event?.starts_at ? new Date(event.starts_at).toTimeString().slice(0, 5) : '',
    end_date: event?.ends_at ? new Date(event.ends_at).toISOString().split('T')[0] : '',
    end_time: event?.ends_at ? new Date(event.ends_at).toTimeString().slice(0, 5) : '',
    all_day: false,
    publish_start_date: event?.publish_start_at ? new Date(event.publish_start_at).toISOString().split('T')[0] : '',
    publish_start_time: event?.publish_start_at ? new Date(event.publish_start_at).toTimeString().slice(0, 5) : '',
    publish_end_date: event?.publish_end_at ? new Date(event.publish_end_at).toISOString().split('T')[0] : '',
    publish_end_time: event?.publish_end_at ? new Date(event.publish_end_at).toTimeString().slice(0, 5) : '',
    is_featured: event?.is_featured || false,
    is_indefinite: !event?.publish_end_at, // If no publish_end_at, it's indefinite
    is_live: event?.status === 'live' || event?.status === 'scheduled', // For weekly events, determine if live
  })

  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [imagePreview, setImagePreview] = React.useState(event?.image_url || "")
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [isUploadingPreview, setIsUploadingPreview] = React.useState(false)
  const [selectedBandIds, setSelectedBandIds] = React.useState<string[]>([])

  React.useEffect(() => {
    if (event?.image_url) {
      setImagePreview(event.image_url)
    }
  }, [event?.image_url])

  // Fetch event bands when editing
  React.useEffect(() => {
    const fetchEventBands = async () => {
      if (event?.id) {
        try {
          const response = await fetch(`/api/businesses/${orgId}/events/${event.id}/bands`)
          if (response.ok) {
            const data = await response.json()
            const bandIds = (data.eventBands || []).map((eb: { band_id: string }) => eb.band_id)
            setSelectedBandIds(bandIds)
          }
        } catch (error) {
          console.error('Error fetching event bands:', error)
        }
      } else {
        setSelectedBandIds([])
      }
    }

    fetchEventBands()
  }, [event?.id, orgId])

  const handleManualImageChange = (value: string) => {
    setFormData({ ...formData, image_url: value })
    setImagePreview(value)
  }

  const handleImageFileSelect = async (file: File | null) => {
    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB")
      return
    }

    setIsUploadingPreview(true)
    try {
      const formDataData = new FormData()
      formDataData.append("file", file)

      const response = await fetch(`/api/businesses/${orgId}/gallery-images/upload`, {
        method: "POST",
        body: formDataData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Failed to upload image")
      }

      const data = await response.json()
      if (!data?.imageUrl) {
        throw new Error("Upload did not return an image URL")
      }

      setFormData((prev) => ({ ...prev, image_url: data.imageUrl }))
      setImagePreview(data.imageUrl)
      toast.success("Image uploaded successfully")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload image")
    } finally {
      setIsUploadingPreview(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Compute current status - use event status from DB if available, otherwise compute from form data
  const computedStatus = React.useMemo(() => {
    // For weekly events, use is_live directly
    if (formData.is_weekly) {
      if (formData.is_live !== undefined) {
        return formData.is_live ? 'live' : 'draft'
      }
      // Fallback to event status if is_live is not set
      if (event?.status) {
        return event.status === 'live' || event.status === 'scheduled' ? 'live' : 'draft'
      }
      return 'draft'
    }

    // For existing events, use the status from the database (same as events table)
    if (event?.status) {
      return event.status
    }

    // For new events, compute status from form data
    if (!formData.publish_start_date || !formData.publish_start_time) {
      return 'draft'
    }

    const tempEvent: Partial<Event> = {
      status: 'draft',
      publish_start_at: formData.publish_start_date && formData.publish_start_time
        ? new Date(`${formData.publish_start_date}T${formData.publish_start_time}`).toISOString()
        : undefined,
      publish_end_at: formData.publish_end_date && formData.publish_end_time
        ? new Date(`${formData.publish_end_date}T${formData.publish_end_time}`).toISOString()
        : undefined,
    }

    return computeEventStatus(tempEvent)
  }, [event?.status, formData.is_weekly, formData.is_live, formData.publish_start_date, formData.publish_start_time, formData.publish_end_date, formData.publish_end_time])

  const getStatusMessage = () => {
    if (!formData.publish_start_date || !formData.publish_start_time) {
      return 'Draft (Not visible on your site)'
    }

    const publishStart = new Date(`${formData.publish_start_date}T${formData.publish_start_time}`)
    const now = new Date()

    if (now < publishStart) {
      const dateStr = publishStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      const timeStr = publishStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      return `Scheduled (Goes live on ${dateStr} at ${timeStr})`
    }

    if (computedStatus === 'live') {
      return 'Live (Visible on site now)'
    }

    if (computedStatus === 'past') {
      return 'Past (No longer visible)'
    }

    return 'Draft (Not visible on your site)'
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (formData.is_weekly) {
      // For weekly events, require day_of_week and times
      if (formData.day_of_week === undefined || formData.day_of_week === null) {
        newErrors.day_of_week = 'Day of week is required for weekly events'
      }
      if (!formData.start_time) {
        newErrors.start_time = 'Start time is required'
      }
      if (!formData.end_time) {
        newErrors.end_time = 'End time is required'
      }
      // Note: For weekly events, we don't validate that end time is after start time
      // because events can span midnight (e.g., 10 PM to 2 AM)
    } else {
      // For one-time events, require dates and times
      if (!formData.start_date) {
        newErrors.start_date = 'Start date is required'
      }
      if (!formData.start_time) {
        newErrors.start_time = 'Start time is required'
      }
      if (!formData.end_date) {
        newErrors.end_date = 'End date is required'
      }
      if (!formData.end_time) {
        newErrors.end_time = 'End time is required'
      }
      if (formData.start_date && formData.end_date && formData.start_time && formData.end_time) {
        const start = new Date(`${formData.start_date}T${formData.start_time}`)
        const end = new Date(`${formData.end_date}T${formData.end_time}`)
        
        if (end <= start) {
          newErrors.end_date = 'End date/time must be after start date/time'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const buildEventData = (action: 'draft' | 'schedule' | 'publish'): Partial<Event> => {
    let startsAt: string | undefined
    let endsAt: string | undefined

    if (formData.is_weekly) {
      // For weekly events, store time in a placeholder date (2000-01-01) for compatibility
      // The actual day is stored in day_of_week
      if (formData.start_time) {
        const [hours, minutes] = formData.start_time.split(':').map(Number)
        const placeholderDate = new Date('2000-01-01')
        placeholderDate.setHours(hours, minutes, 0, 0)
        startsAt = placeholderDate.toISOString()
      }
      if (formData.end_time) {
        const [hours, minutes] = formData.end_time.split(':').map(Number)
        const placeholderDate = new Date('2000-01-01')
        placeholderDate.setHours(hours, minutes, 0, 0)
        endsAt = placeholderDate.toISOString()
      }
    } else {
      // For one-time events, use actual dates
      startsAt = formData.start_date && formData.start_time
        ? new Date(`${formData.start_date}T${formData.start_time}`).toISOString()
        : new Date().toISOString()
      
      const endDate = formData.end_date && formData.end_time
        ? new Date(`${formData.end_date}T${formData.end_time}`)
        : (() => {
            const start = new Date(startsAt)
            start.setHours(start.getHours() + 2)
            return start
          })()
      endsAt = endDate.toISOString()
    }

    // Handle visibility scheduling
    let publishStartAt: string | undefined
    let publishEndAt: string | undefined
    let status: Event['status'] = 'draft'

    if (formData.is_weekly) {
      // For weekly events, use is_live toggle and is_indefinite option
      if (formData.is_live) {
        // Event is live - always set publish_start to now when making it live
        // Ignore any publish_start_date/publish_start_time values
        publishStartAt = new Date().toISOString()
        status = 'live'
      } else {
        // Event is inactive
        status = 'draft'
        // Still allow setting publish_start for future activation
        if (formData.publish_start_date && formData.publish_start_time) {
          publishStartAt = new Date(`${formData.publish_start_date}T${formData.publish_start_time}`).toISOString()
        }
      }

      // Handle indefinite option
      if (formData.is_indefinite) {
        // Indefinite - explicitly set publish_end_at to null to clear it in database
        publishEndAt = null as unknown as string
      } else {
        // Not indefinite - use publish_end if provided
        if (formData.publish_end_date && formData.publish_end_time) {
          publishEndAt = new Date(`${formData.publish_end_date}T${formData.publish_end_time}`).toISOString()
        }
      }
    } else {
      // For one-time events, use original logic
      if (formData.publish_start_date && formData.publish_start_time) {
        publishStartAt = new Date(`${formData.publish_start_date}T${formData.publish_start_time}`).toISOString()
      }
      
      if (formData.publish_end_date && formData.publish_end_time) {
        publishEndAt = new Date(`${formData.publish_end_date}T${formData.publish_end_time}`).toISOString()
      }

      if (action === 'publish') {
        // For "Publish now", always set publish_start to current date and time
        publishStartAt = new Date().toISOString()
        
        // Use publish_end from form if provided, otherwise default to event end time
        if (!publishEndAt && endsAt) {
          publishEndAt = endsAt
        }
        status = 'live'
      } else if (action === 'schedule') {
        // Schedule requires publish_start to be set
        if (!publishStartAt) {
          // This should be caught by validation, but fallback to current time
          publishStartAt = new Date().toISOString()
        }
        
        // Compute status based on publish_start time
        const now = new Date()
        const publishStart = new Date(publishStartAt)
        status = now >= publishStart ? 'live' : 'scheduled'
      }
      // For 'draft' action, status remains 'draft' but visibility scheduling is still saved
    }

    return {
      title: formData.title,
      short_description: formData.short_description || undefined,
      description: formData.description || undefined,
      event_type: formData.event_type || undefined,
      image_url: formData.image_url || undefined,
      starts_at: startsAt,
      ends_at: endsAt,
      publish_start_at: publishStartAt,
      publish_end_at: publishEndAt,
      status,
      is_featured: formData.is_featured,
      is_weekly: formData.is_weekly,
      day_of_week: formData.is_weekly ? formData.day_of_week : undefined,
    }
  }

  const handleSubmit = async (action: 'draft' | 'schedule' | 'publish') => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    if (action === 'schedule' && (!formData.publish_start_date || !formData.publish_start_time)) {
      toast.error('Publish start date and time are required to schedule an event')
      return
    }

    setIsSubmitting(true)
    try {
      const eventData = buildEventData(action)
      
      // Log the event data being sent for debugging
      console.log('Saving event data:', {
        is_weekly: eventData.is_weekly,
        day_of_week: eventData.day_of_week,
        status: eventData.status,
        publish_start_at: eventData.publish_start_at,
        publish_end_at: eventData.publish_end_at,
        is_indefinite: formData.is_indefinite,
        is_live: formData.is_live,
      })
      
      if (onSave) {
        await onSave(eventData)
      } else {
        // Call API to save event
        const url = event 
          ? `/api/businesses/${orgId}/events/${event.id}`
          : `/api/businesses/${orgId}/events`
        
        const method = event ? 'PATCH' : 'POST'
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to save event' }))
          throw new Error(errorData.error || 'Failed to save event')
        }

        const responseData = await response.json()
        const savedEvent = responseData.event

        // Save bands if event type is Jazz or Live Music
        if ((formData.event_type === "Jazz" || formData.event_type === "Live Music") && savedEvent?.id) {
          try {
            const bandsResponse = await fetch(`/api/businesses/${orgId}/events/${savedEvent.id}/bands`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ bandIds: selectedBandIds }),
            })

            if (!bandsResponse.ok) {
              console.error('Failed to save event bands')
              // Don't fail the whole save if bands fail
            }
          } catch (error) {
            console.error('Error saving event bands:', error)
            // Don't fail the whole save if bands fail
          }
        }

        // Determine success message based on event type and actual saved status
        let successMessage = 'Event saved'
        if (formData.is_weekly) {
          // For weekly events, message based on actual saved status
          if (savedEvent?.status === 'live') {
            successMessage = formData.is_indefinite 
              ? 'Weekly event saved and is now live indefinitely' 
              : 'Weekly event saved and is now live'
          } else {
            successMessage = 'Weekly event saved as inactive'
          }
        } else {
          // For one-time events, message based on action
          successMessage = action === 'draft' 
            ? 'Event saved as draft' 
            : action === 'schedule' 
            ? 'Event scheduled' 
            : 'Event published'
        }
        toast.success(successMessage)
      }
      
      // Use replace to avoid back button issues, and refresh will happen automatically
      router.replace(`/client/${orgId}/events`)
    } catch (error) {
      console.error('Error saving event:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save event')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Status Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {event ? `Edit Event – ${event.title}` : 'New Event'}
          </h1>
        </div>
        {event && <EventStatusBadge status={computedStatus} />}
      </div>

      <form className="space-y-6">
        {/* Section A - Event Details & Image */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Event Details</CardTitle>
                  <CardDescription>Basic information about your event</CardDescription>
                </div>
                {event && <EventStatusBadge status={computedStatus} />}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2" data-tour="title">
                <Label htmlFor="title">Event Name *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Jazz Night with The Blue Notes"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-2" data-tour="description">
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Full event description..."
                  rows={6}
                />
              </div>

              <div className="space-y-2" data-tour="event-type">
                <Label htmlFor="event_type">Event Type</Label>
                <Select
                  value={formData.event_type || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      event_type: value === "none" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="Jazz">Jazz</SelectItem>
                    <SelectItem value="Live Music">Live Music</SelectItem>
                    <SelectItem value="Comedy Night">Comedy Night</SelectItem>
                    <SelectItem value="DJ Night">DJ Night</SelectItem>
                    <SelectItem value="Brunch">Brunch</SelectItem>
                    <SelectItem value="Wine Tasting">Wine Tasting</SelectItem>
                    <SelectItem value="Dining Experience">Dining Experience</SelectItem>
                    <SelectItem value="Special Dinner">Special Dinner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.event_type === "Jazz" || formData.event_type === "Live Music") && (
                <BandSelector
                  orgId={orgId}
                  selectedBandIds={selectedBandIds}
                  onSelectionChange={setSelectedBandIds}
                />
              )}
            </CardContent>
          </Card>

          <Card data-tour="image-upload">
            <CardHeader>
              <CardTitle>Event Image</CardTitle>
              <CardDescription>Upload or link your poster/hero image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => handleManualImageChange(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPreview}
                >
                  {isUploadingPreview ? "Processing..." : "Upload Image"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleImageFileSelect(event.target.files?.[0] || null)}
                />
                {formData.image_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData({ ...formData, image_url: "" })
                      setImagePreview("")
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                      }
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a URL or upload an image to preview it instantly.
              </p>
              {imagePreview ? (
                <div className="relative mt-2 aspect-square w-full overflow-hidden rounded-md border bg-muted">
                  <Image
                    src={imagePreview}
                    alt={formData.title || "Event preview"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="mt-2 flex h-32 w-full items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                  No image selected
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sections B & C side-by-side */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Date & Time</CardTitle>
              <CardDescription>When does this event occur?</CardDescription>
              <CardAction>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Label htmlFor="is_weekly" className="text-sm font-medium">Weekly Event</Label>
                    <p className="text-xs text-muted-foreground">
                      Repeats weekly
                    </p>
                  </div>
                  <Switch
                    id="is_weekly"
                    checked={formData.is_weekly}
                    onCheckedChange={(checked) => {
                      setFormData({
                        ...formData,
                        is_weekly: checked,
                        // Clear day_of_week when toggling off
                        day_of_week: checked ? formData.day_of_week : undefined,
                        // Clear dates when toggling on
                        start_date: checked ? '' : formData.start_date,
                        end_date: checked ? '' : formData.end_date,
                      })
                    }}
                  />
                </div>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">

              {formData.is_weekly ? (
                // Weekly event fields
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2" data-tour="end-time">
                    <Label htmlFor="end_time">End Time *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className={errors.end_time ? "border-red-500" : ""}
                    />
                    {errors.end_time && <p className="text-sm text-red-500">{errors.end_time}</p>}
                  </div>

                  <div className="space-y-2" data-tour="start-time">
                    <Label htmlFor="start_time">Start Time *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className={errors.start_time ? "border-red-500" : ""}
                    />
                    {errors.start_time && <p className="text-sm text-red-500">{errors.start_time}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="day_of_week">Day of Week *</Label>
                    <Select
                      value={formData.day_of_week !== undefined ? formData.day_of_week.toString() : ""}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          day_of_week: parseInt(value, 10),
                        })
                      }
                    >
                      <SelectTrigger className={errors.day_of_week ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Sunday</SelectItem>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.day_of_week && <p className="text-sm text-red-500">{errors.day_of_week}</p>}
                  </div>
                </div>
              ) : (
                // One-time event fields
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2" data-tour="start-date">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className={errors.start_date ? "border-red-500" : ""}
                    />
                    {errors.start_date && <p className="text-sm text-red-500">{errors.start_date}</p>}
                  </div>

                  <div className="space-y-2" data-tour="start-time">
                    <Label htmlFor="start_time">Start Time *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className={errors.start_time ? "border-red-500" : ""}
                    />
                    {errors.start_time && <p className="text-sm text-red-500">{errors.start_time}</p>}
                  </div>

                  <div className="space-y-2" data-tour="end-date">
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className={errors.end_date ? "border-red-500" : ""}
                    />
                    {errors.end_date && <p className="text-sm text-red-500">{errors.end_date}</p>}
                  </div>

                  <div className="space-y-2" data-tour="end-time">
                    <Label htmlFor="end_time">End Time *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className={errors.end_time ? "border-red-500" : ""}
                    />
                    {errors.end_time && <p className="text-sm text-red-500">{errors.end_time}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visibility Scheduling</CardTitle>
              <CardDescription>Choose when this event should appear on your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.is_weekly ? (
                // Weekly event visibility options
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-md border p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="is_live" className="text-base">Event Status</Label>
                        <p className="text-sm text-muted-foreground">
                          {formData.is_live ? 'Event is live and visible' : 'Event is inactive and hidden'}
                        </p>
                      </div>
                      <Switch
                        id="is_live"
                        checked={formData.is_live !== undefined ? formData.is_live : computedStatus === 'live'}
                        onCheckedChange={(checked) => {
                          // When setting to live, clear publish_start_date and publish_start_time
                          // so they don't override the current time
                          setFormData({ 
                            ...formData, 
                            is_live: checked,
                            publish_start_date: checked ? '' : formData.publish_start_date,
                            publish_start_time: checked ? '' : formData.publish_start_time,
                          })
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-md border p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="is_indefinite" className="text-base">Indefinite</Label>
                        <p className="text-sm text-muted-foreground">
                          Show this event indefinitely (no end date)
                        </p>
                      </div>
                      <Switch
                        id="is_indefinite"
                        checked={formData.is_indefinite}
                        onCheckedChange={(checked) => {
                          setFormData({
                            ...formData,
                            is_indefinite: checked,
                            // Clear end date/time when indefinite is checked
                            publish_end_date: checked ? '' : formData.publish_end_date,
                            publish_end_time: checked ? '' : formData.publish_end_time,
                          })
                        }}
                      />
                    </div>

                    {!formData.is_indefinite && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2" data-tour="publish-end">
                          <Label htmlFor="publish_end_date">Publish End</Label>
                          <Input
                            id="publish_end_date"
                            type="date"
                            value={formData.publish_end_date}
                            onChange={(e) => setFormData({ ...formData, publish_end_date: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="publish_end_time">Publish End Time</Label>
                          <Input
                            id="publish_end_time"
                            type="time"
                            value={formData.publish_end_time}
                            onChange={(e) => setFormData({ ...formData, publish_end_time: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-md border bg-muted/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <p className="text-sm text-muted-foreground">
                          {computedStatus === 'live'
                            ? 'Live (Visible on site now)'
                            : 'Inactive (Hidden from site)'}
                        </p>
                      </div>
                      <EventStatusBadge status={computedStatus} />
                    </div>
                  </div>
                </>
              ) : (
                // One-time event visibility options (original)
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2" data-tour="publish-start">
                      <Label htmlFor="publish_start_date">Publish Start</Label>
                      <Input
                        id="publish_start_date"
                        type="date"
                        value={formData.publish_start_date}
                        onChange={(e) => setFormData({ ...formData, publish_start_date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="publish_start_time">Publish Start Time</Label>
                      <Input
                        id="publish_start_time"
                        type="time"
                        value={formData.publish_start_time}
                        onChange={(e) => setFormData({ ...formData, publish_start_time: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2" data-tour="publish-end">
                      <Label htmlFor="publish_end_date">Publish End</Label>
                      <Input
                        id="publish_end_date"
                        type="date"
                        value={formData.publish_end_date}
                        onChange={(e) => setFormData({ ...formData, publish_end_date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="publish_end_time">Publish End Time</Label>
                      <Input
                        id="publish_end_time"
                        type="time"
                        value={formData.publish_end_time}
                        onChange={(e) => setFormData({ ...formData, publish_end_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="rounded-md border bg-muted/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <p className="text-sm text-muted-foreground">{getStatusMessage()}</p>
                      </div>
                      <EventStatusBadge status={computedStatus} />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Footer Actions */}
        <div className="flex justify-end gap-3" data-tour="save-button">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/client/${orgId}/events`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          {formData.is_weekly ? (
            // Weekly events: Simple save button (status controlled by Live/Inactive toggle)
            <Button
              type="button"
              variant="default"
              onClick={() => handleSubmit('draft')}
              disabled={isSubmitting}
            >
              {event ? 'Save Changes' : 'Create Event'}
            </Button>
          ) : (
            // One-time events: Full set of action buttons
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit('draft')}
                disabled={isSubmitting}
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => handleSubmit('schedule')}
                disabled={isSubmitting}
              >
                Schedule
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => handleSubmit('publish')}
                disabled={isSubmitting}
              >
                Publish Now
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}

