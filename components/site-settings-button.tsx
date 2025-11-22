"use client"

import * as React from "react"
import { IconSettings } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { SiteSettingsModal } from "@/components/site-settings-modal"
import type { Business } from "@/lib/businesses"
import { useRouter } from "next/navigation"

interface SiteSettingsButtonProps {
  business: Business | null
}

export function SiteSettingsButton({ business }: SiteSettingsButtonProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  if (!business) {
    return null
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsModalOpen(true)}
      >
        <IconSettings className="h-4 w-4 mr-2" />
        Site Settings
      </Button>
      
      <SiteSettingsModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        business={business}
        onSuccess={() => {
          router.refresh()
        }}
      />
    </>
  )
}

