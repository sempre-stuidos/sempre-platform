"use client"

import * as React from "react"
import { useParams, useSearchParams } from "next/navigation"
import { EventEditorForm } from "@/components/event-editor-form"
import { Event } from "@/lib/types"

export default function NewEventPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orgId = params.orgId as string
  const duplicateId = searchParams.get('duplicate')
  
  const [eventToDuplicate, setEventToDuplicate] = React.useState<Event | null>(null)
  const [loading, setLoading] = React.useState(!!duplicateId)

  React.useEffect(() => {
    if (duplicateId && orgId) {
      const fetchEvent = async () => {
        try {
          setLoading(true)
          const response = await fetch(`/api/organizations/${orgId}/events/${duplicateId}`)
          
          if (response.ok) {
            const data = await response.json()
            setEventToDuplicate(data.event)
          }
        } catch (error) {
          console.error('Error fetching event to duplicate:', error)
        } finally {
          setLoading(false)
        }
      }
      
      fetchEvent()
    }
  }, [duplicateId, orgId])

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

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <EventEditorForm orgId={orgId} event={eventToDuplicate} />
        </div>
      </div>
    </div>
  )
}

