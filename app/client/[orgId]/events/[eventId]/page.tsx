"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { EventEditorForm } from "@/components/event-editor-form"
import { getEventById } from "@/lib/events"

export default function EditEventPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const eventId = params.eventId as string
  
  const [event, setEvent] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const foundEvent = getEventById(orgId, eventId)
    if (!foundEvent) {
      // In a real app, we'd use notFound() from next/navigation
      // For now, just set loading to false
      setLoading(false)
      return
    }
    
    // Verify event belongs to this org
    if (foundEvent.org_id !== orgId) {
      setLoading(false)
      return
    }
    
    setEvent(foundEvent)
    setLoading(false)
  }, [orgId, eventId])

  if (loading) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <p className="text-muted-foreground">Loading event...</p>
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
              <p className="text-muted-foreground">
                The event you're looking for doesn't exist or you don't have access to it.
              </p>
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
          <EventEditorForm orgId={orgId} event={event} />
        </div>
      </div>
    </div>
  )
}

