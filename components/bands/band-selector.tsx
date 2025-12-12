"use client"

import { useState, useEffect } from "react"
import { Band } from "@/lib/types"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { IconX, IconMusic } from "@tabler/icons-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"

interface BandSelectorProps {
  orgId: string
  selectedBandIds: string[]
  onSelectionChange: (bandIds: string[]) => void
}

export function BandSelector({
  orgId,
  selectedBandIds,
  onSelectionChange,
}: BandSelectorProps) {
  const [bands, setBands] = useState<Band[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchBands = async () => {
      try {
        const response = await fetch(`/api/businesses/${orgId}/bands`)
        if (response.ok) {
          const data = await response.json()
          setBands(data.bands || [])
        }
      } catch (error) {
        console.error("Error fetching bands:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (orgId && open) {
      fetchBands()
    }
  }, [orgId, open])

  const handleToggleBand = (bandId: string) => {
    if (selectedBandIds.includes(bandId)) {
      onSelectionChange(selectedBandIds.filter((id) => id !== bandId))
    } else {
      onSelectionChange([...selectedBandIds, bandId])
    }
  }

  const handleRemoveBand = (bandId: string) => {
    onSelectionChange(selectedBandIds.filter((id) => id !== bandId))
  }

  const selectedBands = bands.filter((band) =>
    selectedBandIds.includes(band.id)
  )

  return (
    <div className="space-y-2">
      <Label>Bands</Label>
      <div className="space-y-2">
        {selectedBands.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedBands.map((band) => (
              <Badge
                key={band.id}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {band.name}
                <button
                  type="button"
                  onClick={() => handleRemoveBand(band.id)}
                  className="ml-1 rounded-full hover:bg-muted"
                >
                  <IconX className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="w-full justify-start">
              <IconMusic className="mr-2 h-4 w-4" />
              {selectedBands.length > 0
                ? `${selectedBands.length} band${selectedBands.length > 1 ? "s" : ""} selected`
                : "Select bands"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <div className="p-4 border-b">
              <h4 className="font-medium">Select Bands</h4>
              <p className="text-sm text-muted-foreground">
                Choose bands performing at this event
              </p>
            </div>
            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading bands...
                </div>
              ) : bands.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No bands available.{" "}
                  <a
                    href={`/client/${orgId}/bands`}
                    className="text-primary hover:underline"
                  >
                    Add a band
                  </a>
                </div>
              ) : (
                <div className="p-2">
                  {bands.map((band) => (
                    <div
                      key={band.id}
                      className="flex items-center space-x-3 rounded-md p-2 hover:bg-muted cursor-pointer"
                      onClick={() => handleToggleBand(band.id)}
                    >
                      <Checkbox
                        checked={selectedBandIds.includes(band.id)}
                        onCheckedChange={() => handleToggleBand(band.id)}
                      />
                      {band.image_url && (
                        <div className="relative h-10 w-10 overflow-hidden rounded-md">
                          <Image
                            src={band.image_url}
                            alt={band.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{band.name}</div>
                        {band.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {band.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-xs text-muted-foreground">
        Select bands that will be performing at this event
      </p>
    </div>
  )
}
