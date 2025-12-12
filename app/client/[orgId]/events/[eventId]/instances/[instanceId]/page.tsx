"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Event, EventInstance } from "@/lib/types"
import { EventInstanceEditor } from "@/components/event-instances/event-instance-editor"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"

export default function EventInstanceEditPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const eventId = params.eventId as string
  const instanceId = params.instanceId as string
  
  const [event, setEvent] = useState<Event | null>(null)
  const [instance, setInstance] = useState<EventInstance | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventResponse, instanceResponse] = await Promise.all([
          fetch(`/api/businesses/${orgId}/events/${eventId}`),
          fetch(`/api/businesses/${orgId}/events/${eventId}/instances/${instanceId}`)
        ])

        if (eventResponse.ok) {
          const eventData = await eventResponse.json()
          setEvent(eventData.event)
        }

        if (instanceResponse.ok) {
          const instanceData = await instanceResponse.json()
          setInstance(instanceData.instance)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (orgId && eventId && instanceId) {
      fetchData()
    }
  }, [orgId, eventId, instanceId])

  if (isLoading) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!event || !instance) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">Event or instance not found</p>
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
            <Link href={`/client/${orgId}/events/${eventId}/instances`}>
              <Button variant="ghost" className="mb-4">
                <IconArrowLeft className="mr-2 h-4 w-4" />
                Back to Instances
              </Button>
            </Link>
          </div>

          <EventInstanceEditor
            orgId={orgId}
            eventId={eventId}
            instanceId={instanceId}
            event={event}
            instance={instance}
          />
        </div>
      </div>
    </div>
  )
}
