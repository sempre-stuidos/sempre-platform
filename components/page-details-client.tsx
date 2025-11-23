"use client"

import * as React from "react"
import { useBreadcrumb } from "@/components/breadcrumb-context"

interface PageDetailsClientProps {
  children: React.ReactNode
  pageName: string
}

export function PageDetailsClient({ children, pageName }: PageDetailsClientProps) {
  const { setBreadcrumb } = useBreadcrumb()

  React.useEffect(() => {
    const breadcrumb = `Pages\\${pageName}`
    setBreadcrumb(breadcrumb)
    return () => {
      setBreadcrumb(null)
    }
  }, [pageName, setBreadcrumb])

  return <>{children}</>
}

