"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { EventInstance } from "@/lib/types"
import { format } from "date-fns"
import { IconEdit, IconWorld } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { DayPickerProps, DayButton } from "react-day-picker"

interface EventInstancesCalendarProps {
  instances: EventInstance[]
  orgId: string
  eventId: string
  onInstancePublish?: (instanceId: string) => Promise<void>
}

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

// Custom day button component with instance indicators
function InstanceDayButton({
  className,
  day,
  modifiers,
  instance,
  onClick,
  ...props
}: React.ComponentProps<typeof DayButton> & {
  instance?: EventInstance
}) {
  const hasInstance = !!instance
  const statusColor = instance ? getInstanceStatusColor(instance.status) : ''

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-12 w-12 p-0 font-normal text-base relative",
        modifiers.selected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        modifiers.today && !modifiers.selected && "bg-accent text-accent-foreground",
        modifiers.outside && "text-muted-foreground opacity-50",
        modifiers.disabled && "text-muted-foreground opacity-50",
        hasInstance && "hover:bg-muted",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {day.date.getDate()}
      {hasInstance && (
        <span
          className={cn(
            "absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full",
            statusColor
          )}
        />
      )}
    </Button>
  )
}

export function EventInstancesCalendar({
  instances,
  orgId,
  eventId,
  onInstancePublish,
}: EventInstancesCalendarProps) {
  const router = useRouter()
  
  // Default to first month with instances, or current month
  const initialMonth = React.useMemo(() => {
    if (instances.length > 0) {
      const firstInstance = instances
        .sort((a, b) => a.instance_date.localeCompare(b.instance_date))[0]
      const [year, month] = firstInstance.instance_date.split('-').map(Number)
      return new Date(year, month - 1, 1)
    }
    return new Date()
  }, [instances])
  
  const [month, setMonth] = React.useState<Date>(initialMonth)

  // Create a map of dates to instances
  const instancesMap = React.useMemo(() => {
    const map = new Map<string, EventInstance>()
    instances.forEach((instance) => {
      map.set(instance.instance_date, instance)
    })
    return map
  }, [instances])

  // Get instance for a specific date
  const getInstanceForDate = (date: Date): EventInstance | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return instancesMap.get(dateStr)
  }

  // Handle date click
  const handleDateClick = React.useCallback((date: Date | undefined) => {
    if (!date) return
    
    const instance = getInstanceForDate(date)
    if (instance) {
      router.push(`/client/${orgId}/events/${eventId}/instances/${instance.id}`)
    }
  }, [instancesMap, orgId, eventId, router])

  // Handle publish action
  const handlePublish = React.useCallback(async (instanceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onInstancePublish) {
      await onInstancePublish(instanceId)
    }
  }, [onInstancePublish])

  // Custom modifiers for react-day-picker
  const modifiers: DayPickerProps['modifiers'] = React.useMemo(() => ({
    hasInstance: (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      return instancesMap.has(dateStr)
    },
    live: (date: Date) => {
      const instance = getInstanceForDate(date)
      return instance?.status === 'live'
    },
    scheduled: (date: Date) => {
      const instance = getInstanceForDate(date)
      return instance?.status === 'scheduled'
    },
    past: (date: Date) => {
      const instance = getInstanceForDate(date)
      return instance?.status === 'past'
    },
    draft: (date: Date) => {
      const instance = getInstanceForDate(date)
      return instance?.status === 'draft'
    },
  }), [instancesMap])

  const modifiersClassNames: DayPickerProps['modifiersClassNames'] = {
    hasInstance: 'has-instance',
    live: 'instance-live',
    scheduled: 'instance-scheduled',
    past: 'instance-past',
    draft: 'instance-draft',
  }

  // Custom day component with popover
  const CustomDayButton = React.useCallback((props: React.ComponentProps<typeof DayButton>) => {
    const { day, modifiers: dayModifiers, ...buttonProps } = props
    const instance = getInstanceForDate(day.date)
    const dateStr = format(day.date, 'yyyy-MM-dd')

    if (!instance) {
      return (
        <InstanceDayButton
          {...props}
          instance={undefined}
          onClick={() => handleDateClick(day.date)}
        />
      )
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <InstanceDayButton
            {...props}
            instance={instance}
            onClick={() => handleDateClick(day.date)}
            aria-label={`${format(day.date, "EEEE, MMMM d, yyyy")} - ${instance.status}`}
          />
        </PopoverTrigger>
        <PopoverContent 
          className="w-64" 
          align="start" 
          onOpenAutoFocus={(e) => e.preventDefault()}
          side="top"
        >
          <div className="space-y-3">
            <div>
              <div className="font-semibold text-sm mb-1">
                {format(new Date(instance.instance_date), "EEEE, MMMM d, yyyy")}
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
                  onClick={(e) => handlePublish(instance.id, e)}
                >
                  <IconWorld className="h-3 w-3 mr-1" />
                  Publish
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }, [instancesMap, orgId, eventId, router, handleDateClick, handlePublish])

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4">
        <Calendar
          mode="single"
          month={month}
          onMonthChange={setMonth}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          components={{
            DayButton: CustomDayButton,
          }}
        />
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          <span>Live</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
          <span>Past</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
          <span>Draft</span>
        </div>
      </div>
    </div>
  )
}

