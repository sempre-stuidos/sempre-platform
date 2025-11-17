"use client"

import * as React from "react"
import { useParams, useSearchParams } from "next/navigation"
import { EventEditorForm } from "@/components/event-editor-form"
import { getEventById, getEventsForOrg } from "@/lib/events"

export default function NewEventPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orgId = params.orgId as string
  const duplicateId = searchParams.get('duplicate')
  
  const [eventToDuplicate, setEventToDuplicate] = React.useState<any>(null)

  React.useEffect(() => {
    if (duplicateId) {
      const event = getEventById(orgId, duplicateId)
      if (event) {
        setEventToDuplicate(event)
      }
    }
  }, [duplicateId, orgId])

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

