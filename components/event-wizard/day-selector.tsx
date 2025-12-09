"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DaySelectorProps {
  selectedDay: number | undefined // 0-6, where 0=Sunday, 6=Saturday
  onSelect: (day: number) => void
  label?: React.ReactNode
  error?: string
  className?: string
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
]

export function DaySelector({
  selectedDay,
  onSelect,
  label,
  error,
  className,
}: DaySelectorProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="text-sm font-medium leading-none">
          {label}
        </label>
      )}

      <div className="space-y-2">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDay === day.value
          return (
            <Button
              key={day.value}
              type="button"
              variant={isSelected ? "default" : "outline"}
              onClick={() => onSelect(day.value)}
              className={cn(
                "w-full justify-start h-auto py-3 px-4",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
            >
              <span className="font-medium">{day.label}</span>
            </Button>
          )
        })}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

