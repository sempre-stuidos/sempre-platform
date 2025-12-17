"use client"

import * as React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { EventInstance, Event } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconEdit, IconWorld, IconPlus, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { GenerateInstancesDialog } from "./generate-instances-dialog"
import { cn } from "@/lib/utils"

interface EventInstancesCalendarPageProps {
  orgId: string
  eventId: string
  event: Event
}

type StatusFilter = 'all' | 'live' | 'scheduled' | 'draft' | 'past' | 'cancelled'

// Status color mapping
function getInstanceStatusColor(status: EventInstance['status']): string {
  switch (status) {
    case 'live':
      return 'bg-green-500'
    case 'scheduled':
      return 'bg-blue-500'
    case 'past':
      return 'bg-gray-400'
    case 'draft':
      return 'bg-yellow-500'
    case 'cancelled':
      return 'bg-red-500'
    default:
      return 'bg-gray-400'
  }
}

function getInstanceStatusVariant(status: EventInstance['status']): "default" | "secondary" | "outline" {
  switch (status) {
    case 'live':
      return 'default'
    case 'scheduled':
      return 'default'
    case 'past':
      return 'secondary'
    case 'draft':
      return 'outline'
    case 'cancelled':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function EventInstancesCalendarPage({ orgId, eventId, event }: EventInstancesCalendarPageProps) {
  const router = useRouter()
  const [instances, setInstances] = useState<EventInstance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [hoveredInstanceId, setHoveredInstanceId] = useState<string | null>(null)

  const fetchInstances = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/businesses/${orgId}/events/${eventId}/instances`)
      if (response.ok) {
        const data = await response.json()
        setInstances(data.instances || [])
      }
    } catch (error) {
      console.error('Error fetching instances:', error)
      toast.error('Failed to load event dates')
    } finally {
      setIsLoading(false)
    }
  }, [orgId, eventId])

  useEffect(() => {
    fetchInstances()
  }, [fetchInstances])

  const handleGenerateInstances = async (startDate: string, endDate: string) => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/businesses/${orgId}/events/${eventId}/instances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDate, endDate }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate instances' }))
        throw new Error(errorData.error || 'Failed to generate instances')
      }

      const data = await response.json()
      toast.success(`Generated ${data.instancesCount} new date${data.instancesCount !== 1 ? 's' : ''}`)
      fetchInstances()
      setShowGenerateDialog(false)
    } catch (error) {
      console.error('Error generating instances:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate instances')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePublishInstance = async (instanceId: string) => {
    try {
      const response = await fetch(`/api/businesses/${orgId}/events/${eventId}/instances/${instanceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'live' }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to publish instance' }))
        throw new Error(errorData.error || 'Failed to publish instance')
      }

      toast.success('Date published successfully')
      fetchInstances()
    } catch (error) {
      console.error('Error publishing instance:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to publish date')
    }
  }

  // Filter instances by status
  const filteredInstances = useMemo(() => {
    if (statusFilter === 'all') return instances
    return instances.filter(i => i.status === statusFilter)
  }, [instances, statusFilter])

  // Group instances by date
  const instancesByDate = useMemo(() => {
    const grouped: Record<string, EventInstance> = {}
    filteredInstances.forEach(instance => {
      grouped[instance.instance_date] = instance
    })
    return grouped
  }, [filteredInstances])

  // Get instance for a specific date
  const getInstanceForDate = (date: Date): EventInstance | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return instancesByDate[dateStr]
  }

  // Handle date click
  const handleDateClick = (date: Date) => {
    const instance = getInstanceForDate(date)
    if (instance) {
      router.push(`/client/${orgId}/events/${eventId}/instances/${instance.id}`)
    }
  }

  // Month navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  // Get all dates in the current month
  const getMonthDates = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - startDate.getDay()) // Start from Sunday
    
    const dates: Date[] = []
    const currentDate = new Date(startDate)
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return dates
  }

  const monthDates = useMemo(() => getMonthDates(), [currentMonth])
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Format month/year for display
  const monthYear = format(currentMonth, 'MMMM yyyy')

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Check if date is in current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth()
  }

  if (isLoading) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">Loading event dates...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <IconChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-4 text-lg font-semibold">
            {monthYear}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="past">Past</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => setShowGenerateDialog(true)}
            variant="outline"
            size="sm"
          >
            <IconPlus className="h-4 w-4 mr-2" />
            Generate Dates
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-lg border bg-card">
        <div className="grid grid-cols-7 border-b">
          {dayNames.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {monthDates.map((date, index) => {
            const instance = getInstanceForDate(date)
            const dateIsToday = isToday(date)
            const dateInCurrentMonth = isCurrentMonth(date)
            const dayNumber = date.getDate()

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[100px] border-r border-b last:border-r-0 p-2",
                  !dateInCurrentMonth && "bg-muted/30"
                )}
              >
                <div className={cn(
                  "flex items-center justify-between mb-1",
                  dateIsToday && "bg-primary/10 rounded px-1"
                )}>
                  <span className={cn(
                    "text-sm font-medium",
                    dateIsToday && "text-primary",
                    !dateInCurrentMonth && "text-muted-foreground"
                  )}>
                    {dayNumber}
                  </span>
                  {instance && (
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        getInstanceStatusColor(instance.status)
                      )}
                      title={instance.status}
                    />
                  )}
                </div>
                {instance ? (
                  <Popover open={hoveredInstanceId === instance.id} onOpenChange={(open) => {
                    if (!open) setHoveredInstanceId(null)
                  }}>
                    <PopoverTrigger asChild>
                      <div
                        className={cn(
                          "text-xs p-2 rounded cursor-pointer hover:bg-muted/80 border border-border",
                          "transition-colors"
                        )}
                        onMouseEnter={() => setHoveredInstanceId(instance.id)}
                        onMouseLeave={() => setHoveredInstanceId(null)}
                        onClick={() => handleDateClick(date)}
                      >
                        <Badge variant={getInstanceStatusVariant(instance.status)} className="text-[16px] mb-1">
                          {instance.status}
                        </Badge>
                        {instance.custom_description && (
                          <div className="text-muted-foreground line-clamp-2 mt-1">
                            {instance.custom_description}
                          </div>
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-64" 
                      align="start"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                      onMouseEnter={() => setHoveredInstanceId(instance.id)}
                      onMouseLeave={() => setHoveredInstanceId(null)}
                    >
                      <div className="space-y-3">
                        <div>
                          <div className="font-semibold text-sm mb-1">
                            {format(date, "EEEE, MMMM d, yyyy")}
                          </div>
                          <Badge variant={getInstanceStatusVariant(instance.status)} className="text-xs">
                            {instance.status}
                          </Badge>
                        </div>
                        
                        {instance.custom_description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {instance.custom_description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => router.push(`/client/${orgId}/events/${eventId}/instances/${instance.id}`)}
                          >
                            <IconEdit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          {instance.status !== 'live' && instance.status !== 'past' && (
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1"
                              onClick={() => handlePublishInstance(instance.id)}
                            >
                              <IconWorld className="h-3 w-3 mr-1" />
                              Publish
                            </Button>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    No date
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span>Live</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-gray-400" />
          <span>Past</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-yellow-500" />
          <span>Draft</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span>Cancelled</span>
        </div>
      </div>

      {/* Generate Instances Dialog */}
      <GenerateInstancesDialog
        isOpen={showGenerateDialog}
        onClose={() => setShowGenerateDialog(false)}
        onGenerate={handleGenerateInstances}
        eventDayOfWeek={event.day_of_week}
      />
    </div>
  )
}

