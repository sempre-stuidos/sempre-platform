"use client"

import { useState, useEffect } from "react"
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
import { IconEdit } from "@tabler/icons-react"
import Link from "next/link"
import { format } from "date-fns"

interface EventInstancesListProps {
  orgId: string
  eventId: string
  event: Event
}

export function EventInstancesList({ orgId, eventId, event }: EventInstancesListProps) {
  const [instances, setInstances] = useState<EventInstance[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInstances = async () => {
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
    }

    fetchInstances()
  }, [orgId, eventId])

  if (isLoading) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">Loading instances...</p>
      </div>
    )
  }

  if (instances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Instances</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No instances have been generated for this weekly event yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Event Instances</CardTitle>
          <p className="text-sm text-muted-foreground">
            Individual occurrences of "{event.title}"
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Custom Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell className="font-medium">
                      {format(new Date(instance.instance_date), "EEEE, MMMM d, yyyy")}
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
                      <Link href={`/client/${orgId}/events/${eventId}/instances/${instance.id}`}>
                        <Button variant="ghost" size="icon">
                          <IconEdit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
