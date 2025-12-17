"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconArrowLeft, IconEdit, IconCalendar, IconWorld, IconLayoutColumns } from "@tabler/icons-react"
import Link from "next/link"
import { Event, EventInstance, EventBand } from "@/lib/types"
import { formatEventDateTime, formatWeeklyEventDateTime, formatVisibilityWindow } from "@/lib/events"
import { EventStatusBadge } from "@/components/event-status-badge"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { toast } from "sonner"
import { format } from "date-fns"
import { EventInstancesCalendar } from "@/components/event-instances/event-instances-calendar"

export default function EventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const eventId = params.eventId as string

  const [event, setEvent] = React.useState<Event | null>(null)
  const [eventBands, setEventBands] = React.useState<EventBand[]>([])
  const [instances, setInstances] = React.useState<EventInstance[]>([])
  const [loading, setLoading] = React.useState(true)
  const [instancesLoading, setInstancesLoading] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("details")
  const [viewMode, setViewMode] = React.useState<"calendar" | "list">("calendar")

  // Fetch event
  React.useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/businesses/${orgId}/events/${eventId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setEvent(null)
            return
          }
          throw new Error('Failed to fetch event')
        }

        const data = await response.json()
        setEvent(data.event)
      } catch (error) {
        console.error('Error fetching event:', error)
        toast.error('Failed to load event')
        setEvent(null)
      } finally {
        setLoading(false)
      }
    }

    if (orgId && eventId) {
      fetchEvent()
    }
  }, [orgId, eventId])

  // Fetch bands
  React.useEffect(() => {
    if (!event || (event.event_type !== "Jazz" && event.event_type !== "Live Music")) {
      return
    }

    const fetchBands = async () => {
      try {
        const response = await fetch(`/api/businesses/${orgId}/events/${event.id}/bands`)
        if (response.ok) {
          const data = await response.json()
          setEventBands(data.eventBands || [])
        }
      } catch (error) {
        console.error('Error fetching bands:', error)
      }
    }

    fetchBands()
  }, [event, orgId])

  // Fetch instances if weekly event
  React.useEffect(() => {
    if (!event || !event.is_weekly) {
      setInstances([])
      return
    }

    const fetchInstances = async () => {
      setInstancesLoading(true)
      try {
        const response = await fetch(`/api/businesses/${orgId}/events/${eventId}/instances`)
        if (response.ok) {
          const data = await response.json()
          setInstances(data.instances || [])
        }
      } catch (error) {
        console.error('Error fetching instances:', error)
        toast.error('Failed to load event dates')
      } finally {
        setInstancesLoading(false)
      }
    }

    fetchInstances()
  }, [event, orgId, eventId])

  const handlePublishInstance = async (instanceId: string) => {
    if (!event) return
    
    try {
      const response = await fetch(`/api/businesses/${orgId}/events/${event.id}/instances/${instanceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'live' }),
      })

      if (!response.ok) {
        throw new Error('Failed to publish instance')
      }

      toast.success('Event date published successfully')
      // Refresh instances
      const refreshResponse = await fetch(`/api/businesses/${orgId}/events/${eventId}/instances`)
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setInstances(data.instances || [])
      }
    } catch (error) {
      console.error('Error publishing instance:', error)
      toast.error('Failed to publish event date')
    }
  }

  if (loading) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="rounded-md border p-8 text-center">
              <p className="text-muted-foreground">Loading event...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="rounded-lg border bg-card p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The event you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
              </p>
              <Link href={`/client/${orgId}/events`}>
                <Button variant="outline">
                  <IconArrowLeft className="mr-2 h-4 w-4" />
                  Back to Events
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          {/* Header */}
          <div className="mb-6">
            <Link href={`/client/${orgId}/events`}>
              <Button variant="ghost" className="mb-4">
                <IconArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Button>
            </Link>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
                <p className="text-muted-foreground mt-2">
                  View event details and information
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/client/${orgId}/events/${eventId}`}>
                  <Button>
                    <IconEdit className="mr-2 h-4 w-4" />
                    Edit Event
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="instances">
                Event Dates
                {event.is_weekly && instances.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {instances.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Event Details */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Descriptions Section */}
                  {(event.short_description || event.description) && (
                    <div className="space-y-3">
                      {event.short_description && (
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Short Description</div>
                          <div className="text-sm leading-relaxed">{event.short_description}</div>
                        </div>
                      )}
                      {event.description && (
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</div>
                          <div className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{event.description}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Event Info Grid */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    {event.event_type && (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Event Type</div>
                        <div className="text-sm font-medium">{event.event_type}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Status</div>
                      <EventStatusBadge status={event.status} />
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Date & Time</div>
                      <div className="text-sm font-medium">
                        {event.is_weekly && event.day_of_week !== undefined
                          ? formatWeeklyEventDateTime(event.day_of_week, event.starts_at, event.ends_at)
                          : event.starts_at && event.ends_at
                          ? formatEventDateTime(event.starts_at, event.ends_at)
                          : 'No date/time set'}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Visibility Window</div>
                      <div className="text-sm text-muted-foreground">
                        {formatVisibilityWindow(event.publish_start_at, event.publish_end_at)}
                      </div>
                    </div>
                    {event.is_weekly && (
                      <div className="col-span-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Weekly Event</div>
                        <div className="text-sm">
                          {event.day_of_week !== undefined && (
                            <span className="font-medium">
                              Repeats every {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][event.day_of_week]}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Featured</div>
                      <div className="text-sm font-medium">{event.is_featured ? 'Yes' : 'No'}</div>
                    </div>
                  </div>

                  {/* Bands Section */}
                  {(event.event_type === "Jazz" || event.event_type === "Live Music") && 
                   eventBands.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Bands</div>
                      <div className="flex flex-wrap gap-2">
                        {eventBands.map((eb) => (
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
                          {new Date(event.created_at).toLocaleDateString('en-US', {
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
                          {new Date(event.updated_at).toLocaleDateString('en-US', {
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
                  {event.image_url ? (
                    <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden border shadow-sm">
                      <Image
                        src={event.image_url}
                        alt={event.title}
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
            </TabsContent>

            {/* Event Dates Tab */}
            <TabsContent value="instances" className="mt-6">
              {!event.is_weekly ? (
                <div className="rounded-md border p-12 text-center">
                  <IconCalendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-2">This event is not a weekly event.</p>
                  <p className="text-sm text-muted-foreground">Weekly events can have multiple dates.</p>
                </div>
              ) : instancesLoading ? (
                <div className="rounded-md border p-12 text-center">
                  <p className="text-muted-foreground">Loading event dates...</p>
                </div>
              ) : instances.length === 0 ? (
                <div className="rounded-md border p-12 text-center">
                  <IconCalendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">No event dates have been generated yet.</p>
                  <Link href={`/client/${orgId}/events/${eventId}/instances`}>
                    <Button variant="outline">
                      <IconCalendar className="h-4 w-4 mr-2" />
                      Manage Event Dates
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {instances.length} event date{instances.length !== 1 ? 's' : ''} found
                    </p>
                    <div className="flex items-center gap-2">
                      {/* View Toggle */}
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('calendar')}
                          className="rounded-r-none"
                        >
                          <IconCalendar className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                          className="rounded-l-none border-l"
                        >
                          <IconLayoutColumns className="h-4 w-4" />
                        </Button>
                      </div>
                      <Link href={`/client/${orgId}/events/${eventId}/instances`}>
                        <Button variant="outline" size="sm">
                          <IconCalendar className="h-4 w-4 mr-2" />
                          Manage All Dates
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Calendar View */}
                  {viewMode === 'calendar' ? (
                    <EventInstancesCalendar
                      instances={instances}
                      orgId={orgId}
                      eventId={eventId}
                      onInstancePublish={handlePublishInstance}
                    />
                  ) : (
                    /* List View */
                    <div className="rounded-md border">
                      <div className="divide-y">
                        {instances
                          .sort((a, b) => a.instance_date.localeCompare(b.instance_date))
                          .map((instance) => {
                            const [year, month, day] = instance.instance_date.split('-').map(Number)
                            const instanceDate = new Date(year, month - 1, day)
                            const isPublishable = instance.status !== 'live' && instance.status !== 'past'
                            
                            return (
                              <div
                                key={instance.id}
                                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <div className="font-medium">
                                      {format(instanceDate, "EEEE, MMMM d, yyyy")}
                                    </div>
                                    <Badge
                                      variant={
                                        instance.status === 'live'
                                          ? 'default'
                                          : instance.status === 'past'
                                          ? 'secondary'
                                          : 'outline'
                                      }
                                      className="text-xs"
                                    >
                                      {instance.status}
                                    </Badge>
                                  </div>
                                  {instance.custom_description && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                      {instance.custom_description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {isPublishable && (
                                    <Button
                                      onClick={() => handlePublishInstance(instance.id)}
                                      variant="outline"
                                      size="sm"
                                    >
                                      <IconWorld className="h-4 w-4 mr-1" />
                                      Publish
                                    </Button>
                                  )}
                                  <Link href={`/client/${orgId}/events/${eventId}/instances/${instance.id}`}>
                                    <Button variant="ghost" size="sm">
                                      <IconEdit className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

