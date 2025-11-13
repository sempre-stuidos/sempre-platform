"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { IconLayoutColumns, IconLayoutGrid } from "@tabler/icons-react"

export function GalleryViewToggle() {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards')

  useEffect(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('gallery-view-mode') as 'table' | 'cards' | null
    if (saved) {
      setViewMode(saved)
    }

    // Listen for changes from other components
    const handleChange = () => {
      const saved = localStorage.getItem('gallery-view-mode') as 'table' | 'cards' | null
      if (saved) {
        setViewMode(saved)
      }
    }

    window.addEventListener('gallery-view-mode-change', handleChange)
    window.addEventListener('storage', handleChange)

    return () => {
      window.removeEventListener('gallery-view-mode-change', handleChange)
      window.removeEventListener('storage', handleChange)
    }
  }, [])

  const handleViewModeChange = (mode: 'table' | 'cards') => {
    setViewMode(mode)
    localStorage.setItem('gallery-view-mode', mode)
    window.dispatchEvent(new Event('gallery-view-mode-change'))
  }

  return (
    <div className="flex items-center border rounded-md">
      <Button
        variant={viewMode === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleViewModeChange('table')}
        className="rounded-r-none"
      >
        <IconLayoutColumns className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'cards' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleViewModeChange('cards')}
        className="rounded-l-none border-l"
      >
        <IconLayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  )
}

