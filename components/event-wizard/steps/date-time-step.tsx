"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DaySelector } from "../day-selector"
import { TimePicker } from "../time-picker"

interface DateTimeStepProps {
  isWeekly: boolean
  // One-time event fields
  startDate: Date | null
  startTime: string
  endDate: Date | null
  endTime: string
  // Weekly event fields
  dayOfWeek: number | undefined
  // Handlers
  onStartDateSelect: (date: Date | null) => void
  onStartTimeChange: (time: string) => void
  onEndDateSelect: (date: Date | null) => void
  onEndTimeChange: (time: string) => void
  onDayOfWeekChange: (day: number) => void
  errors?: Record<string, string>
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

function formatTime(timeString: string): string {
  if (!timeString) return ""
  const [hours, minutes] = timeString.split(":").map(Number)
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  const amPm = hours < 12 ? "AM" : "PM"
  return `${hour12}:${String(minutes).padStart(2, "0")} ${amPm}`
}

export function DateTimeStep({
  isWeekly,
  startDate,
  startTime,
  endDate,
  endTime,
  dayOfWeek,
  onStartDateSelect,
  onStartTimeChange,
  onEndDateSelect,
  onEndTimeChange,
  onDayOfWeekChange,
  errors,
}: DateTimeStepProps) {
  const [month, setMonth] = React.useState<Date>(
    startDate || endDate || new Date()
  )

  const handlePreviousMonth = () => {
    setMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() - 1)
      return newDate
    })
  }

  const handleNextMonth = () => {
    setMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }

  // Update month when dates change
  React.useEffect(() => {
    if (startDate) {
      setMonth(startDate)
    } else if (endDate) {
      setMonth(endDate)
    }
  }, [startDate, endDate])

  if (isWeekly) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">When does this event occur?</h2>
          <p className="text-muted-foreground">
            Select the day of the week and times for your weekly event
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Three-column layout: Days | Start Time | End Time */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: Day selector */}
            <div>
              <DaySelector
                selectedDay={dayOfWeek}
                onSelect={onDayOfWeekChange}
                label={
                  <>
                    Day of Week <span className="text-red-500">*</span>
                  </>
                }
                error={errors?.day_of_week}
              />
            </div>

            {/* Middle: Start Time */}
            <div>
              <TimePicker
                value={startTime}
                onChange={onStartTimeChange}
                label={
                  <>
                    Start Time <span className="text-red-500">*</span>
                  </>
                }
                error={errors?.start_time}
              />
            </div>

            {/* Right: End Time */}
            <div>
              <TimePicker
                value={endTime}
                onChange={onEndTimeChange}
                label={
                  <>
                    End Time <span className="text-red-500">*</span>
                  </>
                }
                error={errors?.end_time}
              />
            </div>
          </div>

          {/* Visual indicator */}
          {dayOfWeek !== undefined && (
            <div className="mt-6 rounded-md border bg-muted/50 p-4 text-center">
              <p className="text-sm font-medium">
                This event repeats every{" "}
                <span className="font-semibold text-primary">
                  {DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label}
                </span>
                {startTime && endTime && (
                  <>
                    {" "}from{" "}
                    <span className="font-semibold text-primary">
                      {formatTime(startTime)} - {formatTime(endTime)}
                    </span>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // One-time event
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">When does this event occur?</h2>
        <p className="text-muted-foreground">
          Select the date range and times for your event
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Three-column layout: Start Date | Start Time | End Time */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Date Range Calendar */}
          <div>
            <div className="space-y-3">
              <Label>
                Date Range <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-col items-center gap-3">
                <Calendar
                  mode="range"
                  month={month}
                  onMonthChange={setMonth}
                  selected={{
                    from: startDate || undefined,
                    to: endDate || undefined,
                  }}
                  onSelect={(range) => {
                    if (range?.from) {
                      onStartDateSelect(range.from)
                    } else {
                      onStartDateSelect(null)
                    }
                    if (range?.to) {
                      onEndDateSelect(range.to)
                    } else if (range?.from) {
                      // If only from is selected, set end date to same as start (single day event)
                      onEndDateSelect(range.from)
                    } else {
                      onEndDateSelect(null)
                    }
                  }}
                  className="rounded-md border w-fit"
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousMonth}
                    className="h-8"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleNextMonth}
                    className="h-8"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
              {errors?.start_date && (
                <p className="text-sm text-red-500 text-center">{errors.start_date}</p>
              )}
            </div>
          </div>

          {/* Middle: Start Time */}
          <div>
            <TimePicker
              value={startTime}
              onChange={onStartTimeChange}
              label={
                <>
                  Start Time <span className="text-red-500">*</span>
                </>
              }
              error={errors?.start_time}
            />
          </div>

          {/* Right: End Time */}
          <div>
            <TimePicker
              value={endTime}
              onChange={onEndTimeChange}
              label={
                <>
                  End Time <span className="text-red-500">*</span>
                </>
              }
              error={errors?.end_time}
            />
          </div>
        </div>

        {/* Selected date and times summary */}
        {startDate && startTime && endTime && (
          <div className="mt-6 rounded-md border bg-muted/50 p-4 text-center">
            <p className="text-sm font-medium mb-2">
              {endDate && endDate.getTime() !== startDate.getTime() ? (
                <>
                  Selected Date Range:{" "}
                  <span className="font-semibold text-primary">
                    {startDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    - {endDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </>
              ) : (
                <>
                  Selected Date:{" "}
                  <span className="font-semibold text-primary">
                    {startDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </>
              )}
            </p>
            <p className="text-sm font-medium">
              <span className="font-semibold text-primary">
                {formatTime(startTime)} - {formatTime(endTime)}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

