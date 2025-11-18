"use client"

import { useEffect } from "react"
import { useBreadcrumb } from "@/components/breadcrumb-context"

interface SetTutorialBreadcrumbProps {
  tutorialTitle: string
}

export function SetTutorialBreadcrumb({ tutorialTitle }: SetTutorialBreadcrumbProps) {
  const { setBreadcrumb } = useBreadcrumb()

  useEffect(() => {
    setBreadcrumb(tutorialTitle)
    return () => {
      setBreadcrumb(null)
    }
  }, [tutorialTitle, setBreadcrumb])

  return null
}

