"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Music, Radio } from "lucide-react"
import { cn } from "@/lib/utils"

interface EventTypeStepProps {
  eventType: string
  onSelect: (eventType: string) => void
  errors?: Record<string, string>
}

export function EventTypeStep({
  eventType,
  onSelect,
  errors,
}: EventTypeStepProps) {
  // Default to Jazz if not set
  React.useEffect(() => {
    if (!eventType) {
      onSelect("Jazz")
    }
  }, [eventType, onSelect])

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">What kind of event?</h2>
        <p className="text-muted-foreground">
          Select the type of event (optional - you can skip this step)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            eventType === "Jazz" && "border-primary ring-2 ring-primary"
          )}
          onClick={() => onSelect("Jazz")}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Music className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Jazz</h3>
            <p className="text-sm text-muted-foreground">Jazz music event</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            eventType === "Live Music" && "border-primary ring-2 ring-primary"
          )}
          onClick={() => onSelect("Live Music")}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Radio className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Live Music</h3>
            <p className="text-sm text-muted-foreground">Live music performance</p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={() => onSelect("")}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          Skip this step
        </button>
      </div>

      {errors?.event_type && (
        <p className="text-sm text-red-500 mt-2 text-center">
          {errors.event_type}
        </p>
      )}
    </div>
  )
}

