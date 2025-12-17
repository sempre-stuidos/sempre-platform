"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"
import { BandsManager } from "@/components/bands/bands-manager"
import { NotificationBanner } from "@/components/notifications/notification-banner"

export default function BandsPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const [showFormModal, setShowFormModal] = React.useState(false)

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Bands</h1>
              <p className="text-muted-foreground mt-2">
                Manage bands that perform at your events
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowFormModal(true)}>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Band
              </Button>
            </div>
          </div>

          {/* Notification Banner */}
          <NotificationBanner orgId={orgId} />

          {/* Bands Manager */}
          <BandsManager orgId={orgId} showFormModal={showFormModal} onFormModalChange={setShowFormModal} />
        </div>
      </div>
    </div>
  )
}
