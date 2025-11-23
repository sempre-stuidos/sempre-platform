"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { IconDeviceDesktop, IconDeviceTablet, IconDeviceMobile } from "@tabler/icons-react"

export type ViewportSize = 'desktop' | 'tablet' | 'mobile'

interface ViewportToggleProps {
  value: ViewportSize
  onChange: (size: ViewportSize) => void
}

export function ViewportToggle({ value, onChange }: ViewportToggleProps) {
  return (
    <div className="flex items-center gap-1 border rounded-md p-1 bg-background">
      <Button
        variant={value === 'desktop' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('desktop')}
        className="h-8 px-3"
      >
        <IconDeviceDesktop className="h-4 w-4" />
      </Button>
      <Button
        variant={value === 'tablet' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('tablet')}
        className="h-8 px-3"
      >
        <IconDeviceTablet className="h-4 w-4" />
      </Button>
      <Button
        variant={value === 'mobile' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onChange('mobile')}
        className="h-8 px-3"
      >
        <IconDeviceMobile className="h-4 w-4" />
      </Button>
    </div>
  )
}

