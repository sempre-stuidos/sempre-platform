"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface FrequencyStepProps {
  isWeekly: boolean | null
  onSelect: (isWeekly: boolean) => void
  errors?: Record<string, string>
}

export function FrequencyStep({
  isWeekly,
  onSelect,
  errors,
}: FrequencyStepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">What type of event is this?</h2>
        <p className="text-muted-foreground">
          Choose whether this is a one-time event or a recurring weekly event
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            isWeekly === false && "border-primary ring-2 ring-primary"
          )}
          onClick={() => onSelect(false)}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Calendar className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">One-Time Event</h3>
            <p className="text-sm text-muted-foreground">
              A single event that happens on a specific date and time
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            isWeekly === true && "border-primary ring-2 ring-primary"
          )}
          onClick={() => onSelect(true)}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Clock className="h-12 w-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Weekly Recurring Event</h3>
            <p className="text-sm text-muted-foreground">
              An event that repeats every week on the same day
            </p>
          </CardContent>
        </Card>
      </div>

      {errors?.is_weekly && (
        <p className="text-sm text-red-500 mt-2">{errors.is_weekly}</p>
      )}
    </div>
  )
}

