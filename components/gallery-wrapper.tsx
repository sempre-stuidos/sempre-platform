"use client"

import { useState, useEffect } from "react"
import { GalleryImage } from "@/lib/types"
import { GalleryImagesTable } from "@/components/gallery-images-table"

interface GalleryWrapperProps {
  orgId: string
  clientId: number
  initialImages: GalleryImage[]
}

export function GalleryWrapper({ orgId, clientId, initialImages }: GalleryWrapperProps) {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards')

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('gallery-view-mode') as 'table' | 'cards' | null
    if (saved) {
      setViewMode(saved)
    }
  }, [])

  // Listen for storage changes to sync between toggle and table
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('gallery-view-mode') as 'table' | 'cards' | null
      if (saved) {
        setViewMode(saved)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    // Also listen for custom event for same-tab updates
    window.addEventListener('gallery-view-mode-change', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('gallery-view-mode-change', handleStorageChange)
    }
  }, [])

  return (
    <GalleryImagesTable 
      orgId={orgId} 
      clientId={clientId} 
      initialImages={initialImages}
      viewMode={viewMode}
      onViewModeChange={(mode) => {
        setViewMode(mode)
        localStorage.setItem('gallery-view-mode', mode)
        window.dispatchEvent(new Event('gallery-view-mode-change'))
      }}
    />
  )
}

