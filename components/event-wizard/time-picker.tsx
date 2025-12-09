"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value: string // Format: "HH:MM"
  onChange: (time: string) => void
  label?: React.ReactNode
  error?: string
  className?: string
}

export function TimePicker({
  value,
  onChange,
  label,
  error,
  className,
}: TimePickerProps) {
  const [hour, minute] = React.useMemo(() => {
    if (!value) return [null, null]
    const [h, m] = value.split(":").map(Number)
    return [h, m]
  }, [value])

  const handleHourSelect = (selectedHour24: number) => {
    const newMinute = minute !== null ? minute : 0
    const timeString = `${String(selectedHour24).padStart(2, "0")}:${String(newMinute).padStart(2, "0")}`
    onChange(timeString)
  }

  const handleMinuteSelect = (selectedMinute: number) => {
    const newHour = hour !== null ? hour : (amPm === "PM" ? 12 : 0)
    const timeString = `${String(newHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`
    onChange(timeString)
  }

  // Generate hours (1-12 for 12-hour format)
  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = [0, 15, 30, 45]

  // Convert 24-hour to 12-hour for display
  const displayHour = hour !== null ? (hour === 0 ? 12 : hour > 12 ? hour - 12 : hour) : null
  const amPm = hour !== null ? (hour < 12 ? "AM" : "PM") : null

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="text-sm font-medium leading-none">
          {label}
        </label>
      )}

      <div className="rounded-md border bg-background p-4">
        {/* Display current selection */}
        <div className="mb-4 text-center">
          <div className="text-2xl font-semibold">
            {hour !== null && minute !== null ? (
              <>
                {String(displayHour).padStart(2, "0")}:
                {String(minute).padStart(2, "0")}{" "}
                <span className="text-lg text-muted-foreground">{amPm}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Select time</span>
            )}
          </div>
        </div>

        {/* Hour selection */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Hour
          </div>
          <div className="grid grid-cols-4 gap-2">
            {hours.map((h) => {
              const isSelected = displayHour === h
              return (
                <Button
                  key={h}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    // Convert to 24-hour format based on current AM/PM state
                    let hour24: number
                    const currentAmPm = amPm || "AM" // Default to AM if not set
                    if (currentAmPm === "PM") {
                      hour24 = h === 12 ? 12 : h + 12
                    } else {
                      hour24 = h === 12 ? 0 : h
                    }
                    handleHourSelect(hour24)
                  }}
                  className={cn(
                    "h-10",
                    isSelected && "bg-primary text-primary-foreground"
                  )}
                >
                  {h}
                </Button>
              )
            })}
          </div>
        </div>

        {/* AM/PM toggle */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Period
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={amPm === "AM" || (hour === null && amPm === null) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (hour === null) {
                  // If no hour selected, default to 12 AM
                  handleHourSelect(0)
                } else {
                  // Convert current hour to AM (keep same hour if already AM, or convert from PM)
                  const currentDisplayHour = displayHour || 12
                  const hour24 = currentDisplayHour === 12 ? 0 : currentDisplayHour
                  handleHourSelect(hour24)
                }
              }}
              className={cn(
                "h-10",
                (amPm === "AM" || (hour === null && amPm === null)) && "bg-primary text-primary-foreground"
              )}
            >
              AM
            </Button>
            <Button
              type="button"
              variant={amPm === "PM" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (hour === null) {
                  // If no hour selected, default to 12 PM
                  handleHourSelect(12)
                } else {
                  // Convert current hour to PM
                  const currentDisplayHour = displayHour || 12
                  const hour24 = currentDisplayHour === 12 ? 12 : currentDisplayHour + 12
                  handleHourSelect(hour24)
                }
              }}
              className={cn(
                "h-10",
                amPm === "PM" && "bg-primary text-primary-foreground"
              )}
            >
              PM
            </Button>
          </div>
        </div>

        {/* Minute selection */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Minute
          </div>
          <div className="grid grid-cols-4 gap-2">
            {minutes.map((m) => {
              const isSelected = minute === m
              return (
                <Button
                  key={m}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMinuteSelect(m)}
                  className={cn(
                    "h-10",
                    isSelected && "bg-primary text-primary-foreground"
                  )}
                >
                  {String(m).padStart(2, "0")}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

