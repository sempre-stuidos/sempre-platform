"use client"

import * as React from "react"
import { useBreadcrumb } from "@/components/breadcrumb-context"

export function PagesListClient({ children }: { children: React.ReactNode }) {
  const { setBreadcrumb } = useBreadcrumb()

  React.useEffect(() => {
    setBreadcrumb("Pages")
    return () => {
      setBreadcrumb(null)
    }
  }, [setBreadcrumb])

  return <>{children}</>
}

