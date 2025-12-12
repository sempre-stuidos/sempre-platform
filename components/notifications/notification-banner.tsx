"use client"

import { useState, useEffect } from "react"
import { Notification } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { IconX, IconAlertCircle } from "@tabler/icons-react"
import Link from "next/link"
import { toast } from "sonner"

interface NotificationBannerProps {
  orgId: string
}

export function NotificationBanner({ orgId }: NotificationBannerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/businesses/${orgId}/notifications`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (orgId) {
      fetchNotifications()
    }
  }, [orgId])

  const handleDismiss = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/businesses/${orgId}/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error('Error dismissing notification:', error)
    }
  }

  const getActionUrl = (notification: Notification): string | null => {
    if (notification.related_instance_id && notification.related_event_id) {
      return `/client/${orgId}/events/${notification.related_event_id}/instances/${notification.related_instance_id}`
    }
    if (notification.related_event_id) {
      return `/client/${orgId}/events/${notification.related_event_id}`
    }
    return null
  }

  if (isLoading || notifications.length === 0) {
    return null
  }

  // Show only the first notification
  const notification = notifications[0]
  const actionUrl = getActionUrl(notification)

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <CardContent className="flex items-start gap-4 p-4">
        <IconAlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
            {notification.title}
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
            {notification.message}
          </p>
          {actionUrl && (
            <div className="flex gap-2">
              <Link href={actionUrl}>
                <Button size="sm" variant="default">
                  {notification.message.includes('description') && notification.message.includes('bands')
                    ? 'Add Description & Bands'
                    : notification.message.includes('description')
                    ? 'Add Description'
                    : 'Add Bands'}
                </Button>
              </Link>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => handleDismiss(notification.id)}
        >
          <IconX className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
