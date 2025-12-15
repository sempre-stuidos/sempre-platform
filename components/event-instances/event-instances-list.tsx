"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { EventInstance, Event } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { IconEdit, IconWorld, IconPlus, IconTrash } from "@tabler/icons-react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"
import { GenerateInstancesDialog } from "./generate-instances-dialog"

interface EventInstancesListProps {
  orgId: string
  eventId: string
  event: Event
}

export function EventInstancesList({ orgId, eventId, event }: EventInstancesListProps) {
  const [instances, setInstances] = useState<EventInstance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInstances, setSelectedInstances] = useState<Set<string>>(new Set())
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [instanceToDelete, setInstanceToDelete] = useState<EventInstance | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchInstances = useCallback(async () => {
      try {
        const response = await fetch(`/api/businesses/${orgId}/events/${eventId}/instances`)
        if (response.ok) {
          const data = await response.json()
          setInstances(data.instances || [])
        }
      } catch (error) {
        console.error('Error fetching instances:', error)
      } finally {
        setIsLoading(false)
      }
  }, [orgId, eventId])

  useEffect(() => {
    fetchInstances()
  }, [fetchInstances])

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

      toast.success('Instance published successfully')
      fetchInstances()
    } catch (error) {
      console.error('Error publishing instance:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to publish instance')
    }
  }

  const handleBulkPublish = async () => {
    if (selectedInstances.size === 0) return

    setIsPublishing(true)
    try {
      const publishPromises = Array.from(selectedInstances).map(instanceId =>
        fetch(`/api/businesses/${orgId}/events/${eventId}/instances/${instanceId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'live' }),
        })
      )

      const results = await Promise.allSettled(publishPromises)
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length
      const failed = results.length - successful

      if (successful > 0) {
        toast.success(`Successfully published ${successful} instance${successful > 1 ? 's' : ''}`)
      }
      if (failed > 0) {
        toast.error(`Failed to publish ${failed} instance${failed > 1 ? 's' : ''}`)
      }

      setSelectedInstances(new Set())
      fetchInstances()
    } catch (error) {
      console.error('Error bulk publishing instances:', error)
      toast.error('Failed to publish instances')
    } finally {
      setIsPublishing(false)
    }
  }

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
      toast.success(`Generated ${data.instancesCount} new instance${data.instancesCount !== 1 ? 's' : ''}`)
      fetchInstances()
    } catch (error) {
      console.error('Error generating instances:', error)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectInstance = (instanceId: string, checked: boolean) => {
    setSelectedInstances(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(instanceId)
      } else {
        newSet.delete(instanceId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const publishableInstances = instances
        .filter(i => i.status !== 'live' && i.status !== 'past')
        .map(i => i.id)
      setSelectedInstances(new Set(publishableInstances))
    } else {
      setSelectedInstances(new Set())
    }
  }

  const handleDeleteClick = (instance: EventInstance) => {
    setInstanceToDelete(instance)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!instanceToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/businesses/${orgId}/events/${eventId}/instances/${instanceToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete instance' }))
        throw new Error(errorData.error || 'Failed to delete instance')
      }

      toast.success('Instance deleted successfully')
      setDeleteDialogOpen(false)
      setInstanceToDelete(null)
      fetchInstances()
    } catch (error) {
      console.error('Error deleting instance:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete instance')
    } finally {
      setIsDeleting(false)
    }
  }

  const canPublish = (instance: EventInstance) => {
    return instance.status !== 'live' && instance.status !== 'past'
  }

  const allPublishableSelected = instances
    .filter(canPublish)
    .every(i => selectedInstances.has(i.id)) && 
    instances.filter(canPublish).length > 0

  // Calculate the current/next instance date (same logic as public events page)
  // This matches the logic in formatWeeklyEventDate from the public events page
  const getCurrentInstanceDate = useCallback((): string | null => {
    if (event.day_of_week === undefined || event.day_of_week === null) return null

    // Get current day of week in local timezone (0 = Sunday, 6 = Saturday)
    const now = new Date()
    const currentDay = now.getDay()

    // Calculate days until next occurrence
    let daysUntilNext = (event.day_of_week - currentDay + 7) % 7

    // If it's today, check if the event time has passed
    if (daysUntilNext === 0 && event.starts_at) {
      // Parse the time from starts_at (format: "2000-01-01T20:00:00.000Z" or similar)
      const startParts = event.starts_at.match(/T(\d{2}):(\d{2})/)
      if (startParts) {
        const startHours = parseInt(startParts[1], 10)
        const startMinutes = parseInt(startParts[2], 10)
        const currentHours = now.getHours()
        const currentMinutes = now.getMinutes()

        // If the event time has already passed today, show next week's occurrence
        if (currentHours > startHours || (currentHours === startHours && currentMinutes >= startMinutes)) {
          daysUntilNext = 7
        }
      }
    }

    // Calculate next date
    const nextDate = new Date(now)
    nextDate.setDate(now.getDate() + daysUntilNext)
    
    // Format as YYYY-MM-DD (using local date components to match instance_date format)
    const year = nextDate.getFullYear()
    const month = String(nextDate.getMonth() + 1).padStart(2, '0')
    const day = String(nextDate.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [event.day_of_week, event.starts_at])

  const currentInstanceDate = getCurrentInstanceDate()

  // Sort instances: current instance first, then by date
  const sortedInstances = [...instances].sort((a, b) => {
    const aIsCurrent = a.instance_date === currentInstanceDate
    const bIsCurrent = b.instance_date === currentInstanceDate
    
    if (aIsCurrent && !bIsCurrent) return -1
    if (!aIsCurrent && bIsCurrent) return 1
    
    // Both are current or both are not - sort by date
    return a.instance_date.localeCompare(b.instance_date)
  })

  if (isLoading) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">Loading instances...</p>
      </div>
    )
  }

  if (instances.length === 0) {
    return (
      <div className="space-y-4">
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
              <div>
          <CardTitle>Event Instances</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Individual occurrences of "{event.title}"
                </p>
              </div>
              <Button
                onClick={() => setShowGenerateDialog(true)}
                variant="outline"
                size="sm"
              >
                <IconPlus className="h-4 w-4 mr-2" />
                Generate Instances
              </Button>
            </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No instances have been generated for this weekly event yet.
          </p>
        </CardContent>
      </Card>

        <GenerateInstancesDialog
          isOpen={showGenerateDialog}
          onClose={() => setShowGenerateDialog(false)}
          onGenerate={handleGenerateInstances}
          eventDayOfWeek={event.day_of_week}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
          <CardTitle>Event Instances</CardTitle>
          <p className="text-sm text-muted-foreground">
            Individual occurrences of "{event.title}"
          </p>
            </div>
            <Button
              onClick={() => setShowGenerateDialog(true)}
              variant="outline"
              size="sm"
            >
              <IconPlus className="h-4 w-4 mr-2" />
              Generate Instances
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedInstances.size > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-md flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedInstances.size} instance{selectedInstances.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkPublish}
                  disabled={isPublishing}
                  size="sm"
                  variant="default"
                >
                  <IconWorld className="h-4 w-4 mr-2" />
                  {isPublishing ? 'Publishing...' : 'Publish Selected'}
                </Button>
                <Button
                  onClick={() => setSelectedInstances(new Set())}
                  disabled={isPublishing}
                  size="sm"
                  variant="outline"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allPublishableSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Custom Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInstances.map((instance) => {
                  // Parse date as local time to avoid timezone issues
                  // instance_date is in format YYYY-MM-DD, parse it as local midnight
                  const [year, month, day] = instance.instance_date.split('-').map(Number);
                  const instanceDate = new Date(year, month - 1, day);
                  const isPublishable = canPublish(instance)
                  const isSelected = selectedInstances.has(instance.id)
                  const isCurrentInstance = currentInstanceDate === instance.instance_date
                  return (
                  <TableRow 
                    key={instance.id}
                    className={isCurrentInstance ? "bg-blue-50 dark:bg-blue-950/20" : ""}
                  >
                    <TableCell>
                      {isPublishable && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectInstance(instance.id, checked as boolean)}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {format(instanceDate, "EEEE, MMMM d, yyyy")}
                        {isCurrentInstance && (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-medium">
                            Current
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {instance.custom_description ? (
                        <span className="text-sm">{instance.custom_description}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">
                          Using event description
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded ${
                        instance.status === 'live' ? 'bg-green-100 text-green-800' :
                        instance.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        instance.status === 'past' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {instance.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
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
                        <Button variant="ghost" size="icon">
                          <IconEdit className="h-4 w-4" />
                        </Button>
                      </Link>
                        <Button
                          onClick={() => handleDeleteClick(instance)}
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <GenerateInstancesDialog
        isOpen={showGenerateDialog}
        onClose={() => setShowGenerateDialog(false)}
        onGenerate={handleGenerateInstances}
        eventDayOfWeek={event.day_of_week}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Instance</AlertDialogTitle>
            <AlertDialogDescription>
              {instanceToDelete ? (
                <>
                  Are you sure you want to delete the instance for{" "}
                  {(() => {
                    const [year, month, day] = instanceToDelete.instance_date.split('-').map(Number);
                    const instanceDate = new Date(year, month - 1, day);
                    return format(instanceDate, "EEEE, MMMM d, yyyy");
                  })()}? This action cannot be undone.
                </>
              ) : (
                "Are you sure you want to delete this instance? This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setInstanceToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
