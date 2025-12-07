"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import Link from "next/link"
import { EventsTable } from "@/components/events-table"
import { computeEventStatus } from "@/lib/events"
import { Event } from "@/lib/types"
import { toast } from "sonner"

export default function EventsPage() {
  const params = useParams()
  const orgId = params.orgId as string
  
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeTab, setActiveTab] = React.useState<"weekly" | "upcoming" | "past" | "drafts" | "all">("weekly")
  const [allEvents, setAllEvents] = React.useState<Event[]>([])
  const [loading, setLoading] = React.useState(true)

  // Fetch events from API
  const fetchEvents = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/businesses/${orgId}/events`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }

      const data = await response.json()
      console.log('Fetched events:', data.events?.length || 0)
      setAllEvents(data.events || [])
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to load events')
      setAllEvents([])
    } finally {
      setLoading(false)
    }
  }, [orgId])

  React.useEffect(() => {
    if (orgId) {
      fetchEvents()
    }
  }, [orgId, fetchEvents])

  // Refresh events when page becomes visible (e.g., after navigation back)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && orgId) {
        fetchEvents()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [orgId, fetchEvents])

  // Filter events based on tab and search
  const filteredEvents = React.useMemo(() => {
    let events = allEvents

    // Filter by tab
    switch (activeTab) {
      case "weekly":
        events = events.filter(event => event.is_weekly === true)
        break
      case "upcoming":
        events = events.filter(event => {
          const status = computeEventStatus(event)
          return status === 'scheduled' || status === 'live'
        })
        break
      case "past":
        events = events.filter(event => {
          const status = computeEventStatus(event)
          return status === 'past'
        })
        break
      case "drafts":
        events = events.filter(event => {
          const status = computeEventStatus(event)
          return status === 'draft'
        })
        break
      case "all":
        // Show all events
        break
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      events = events.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.short_description?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query)
      )
    }

    // Sort by starts_at (most recent first)
    // Handle weekly events where starts_at might be undefined
    return events.sort((a, b) => {
      // For weekly events without starts_at, use created_at as fallback
      const aDate = a.starts_at ? new Date(a.starts_at) : new Date(a.created_at)
      const bDate = b.starts_at ? new Date(b.starts_at) : new Date(b.created_at)
      return bDate.getTime() - aDate.getTime()
    })
  }, [allEvents, activeTab, searchQuery])

  return (
    <div className="@container/main flex flex-1 flex-col gap-2" data-tour="events-page">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Events</h1>
              <p className="text-muted-foreground mt-2">
                Manage jazz nights and monthly events.
              </p>
            </div>
            <Link 
              href={`/client/${orgId}/events/new`}
              onClick={() => {
                // If tour is active, mark to continue after navigation
                if (typeof window !== 'undefined' && sessionStorage.getItem('event-creation-tour-active') === 'true') {
                  sessionStorage.setItem('event-creation-tour-continue', '2')
                }
              }}
            >
              <Button data-tour="new-event-button">
                <IconPlus className="mr-2 h-4 w-4" />
                New Event
              </Button>
            </Link>
          </div>

          {/* Tabs and Search */}
          <div className="mb-6 space-y-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
                
                <div className="relative w-64">
                  <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <TabsContent value={activeTab} className="mt-6">
                {loading ? (
                  <div className="rounded-md border p-8 text-center">
                    <p className="text-muted-foreground">Loading events...</p>
                  </div>
                ) : (
                  <EventsTable 
                    orgId={orgId} 
                    events={filteredEvents}
                    onEventDeleted={(eventId) => {
                      setAllEvents(prev => prev.filter(event => event.id !== eventId))
                    }}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

