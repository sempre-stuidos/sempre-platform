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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { EventStatusBadge } from "@/components/event-status-badge"
import { Event } from "@/lib/types"
import { computeEventStatus } from "@/lib/events"
import Image from "next/image"
import { toast } from "sonner"

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
  })

  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [imagePreview, setImagePreview] = React.useState(event?.image_url || "")
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [isUploadingPreview, setIsUploadingPreview] = React.useState(false)

  React.useEffect(() => {
    if (event?.image_url) {
      setImagePreview(event.image_url)
    }
  }, [event?.image_url])

  const handleManualImageChange = (value: string) => {
    setFormData({ ...formData, image_url: value })
    setImagePreview(value)
  }

  const handleImageFileSelect = (file: File | null) => {
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
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setFormData((prev) => ({ ...prev, image_url: result }))
      setImagePreview(result)
      setIsUploadingPreview(false)
    }
    reader.onerror = () => {
      toast.error("Failed to read image file")
      setIsUploadingPreview(false)
    }
    reader.readAsDataURL(file)
  }

  // Compute current status based on form data
  const computedStatus = React.useMemo(() => {
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
  }, [formData.publish_start_date, formData.publish_start_time, formData.publish_end_date, formData.publish_end_time])

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

    if (formData.start_date && formData.end_date) {
      const start = new Date(`${formData.start_date}T${formData.start_time || '00:00'}`)
      const end = new Date(`${formData.end_date}T${formData.end_time || '00:00'}`)
      
      if (end <= start) {
        newErrors.end_date = 'End date/time must be after start date/time'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const buildEventData = (action: 'draft' | 'schedule' | 'publish'): Partial<Event> => {
    const startsAt = formData.start_date && formData.start_time
      ? new Date(`${formData.start_date}T${formData.start_time}`).toISOString()
      : new Date().toISOString()
    
    const endDate = formData.end_date && formData.end_time
      ? new Date(`${formData.end_date}T${formData.end_time}`)
      : (() => {
          const start = new Date(startsAt)
          start.setHours(start.getHours() + 2)
          return start
        })()
    const endsAt = endDate.toISOString()

    let publishStartAt: string | undefined
    let publishEndAt: string | undefined
    let status: Event['status'] = 'draft'

    if (action === 'publish') {
      publishStartAt = new Date().toISOString()
      publishEndAt = formData.publish_end_date && formData.publish_end_time
        ? new Date(`${formData.publish_end_date}T${formData.publish_end_time}`).toISOString()
        : endsAt
      status = 'live'
    } else if (action === 'schedule') {
      if (formData.publish_start_date && formData.publish_start_time) {
        publishStartAt = new Date(`${formData.publish_start_date}T${formData.publish_start_time}`).toISOString()
        publishEndAt = formData.publish_end_date && formData.publish_end_time
          ? new Date(`${formData.publish_end_date}T${formData.publish_end_time}`).toISOString()
          : undefined
        
        const now = new Date()
        const publishStart = new Date(publishStartAt)
        status = now >= publishStart ? 'live' : 'scheduled'
      }
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
      
      if (onSave) {
        await onSave(eventData)
      } else {
        // In a real app, this would call an API
        console.log('Saving event:', eventData)
        toast.success(`Event ${action === 'draft' ? 'saved as draft' : action === 'schedule' ? 'scheduled' : 'published'}`)
      }
      
      router.push(`/client/${orgId}/events`)
    } catch (error) {
      console.error('Error saving event:', error)
      toast.error('Failed to save event')
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
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Basic information about your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Jazz Night with The Blue Notes"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Short Description</Label>
                <Input
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="1-2 line teaser shown in lists"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Full event description..."
                  rows={6}
                />
              </div>

              <div className="space-y-2">
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
            </CardContent>
          </Card>

          <Card>
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
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

                <div className="space-y-2">
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

                <div className="space-y-2">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visibility Scheduling</CardTitle>
              <CardDescription>Choose when this event should appear on your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
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

                <div className="space-y-2">
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
            </CardContent>
          </Card>
        </div>

        {/* Section D - Highlight Options */}
        <Card>
          <CardHeader>
            <CardTitle>Highlight Options</CardTitle>
            <CardDescription>Feature this event on your homepage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked === true })}
              />
              <Label htmlFor="is_featured" className="cursor-pointer">
                Feature this event
              </Label>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Footer Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/client/${orgId}/events`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
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
        </div>
      </form>
    </div>
  )
}

