"use client"

import { useParams } from "next/navigation"
import { BandsManager } from "@/components/bands/bands-manager"

export default function BandsPage() {
  const params = useParams()
  const orgId = params.orgId as string

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <BandsManager orgId={orgId} />
        </div>
      </div>
    </div>
  )
}
