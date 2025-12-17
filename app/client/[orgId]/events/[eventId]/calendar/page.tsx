"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Event } from "@/lib/types"
import { EventInstancesCalendarPage } from "@/components/event-instances/event-instances-calendar-page"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"

export default function EventCalendarPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const eventId = params.eventId as string
  
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/businesses/${orgId}/events/${eventId}`)
        if (response.ok) {
          const data = await response.json()
          setEvent(data.event)
        }
      } catch (error) {
        console.error('Error fetching event:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (orgId && eventId) {
      fetchEvent()
    }
  }, [orgId, eventId])

  if (isLoading) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">Event not found</p>
        <Link href={`/client/${orgId}/events`}>
          <Button variant="outline" className="mt-4">
            Back to Events
          </Button>
        </Link>
      </div>
    )
  }

  if (!event.is_weekly) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">This event is not a weekly event.</p>
        <Link href={`/client/${orgId}/events`}>
          <Button variant="outline" className="mt-4">
            Back to Events
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="mb-6">
            <Link href={`/client/${orgId}/events`}>
              <Button variant="ghost" className="mb-4">
                <IconArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Event Dates</h1>
            <p className="text-muted-foreground mt-2">
              Manage dates for &quot;{event.title}&quot;
            </p>
          </div>

          <EventInstancesCalendarPage orgId={orgId} eventId={eventId} event={event} />
        </div>
      </div>
    </div>
  )
}

