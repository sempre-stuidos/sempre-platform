"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { ProductWizard } from "@/components/product-wizard/product-wizard"

export default function NewProductPage() {
  const params = useParams()
  const orgId = params.orgId as string

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <ProductWizard orgId={orgId} />
        </div>
      </div>
    </div>
  )
}

