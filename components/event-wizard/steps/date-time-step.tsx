"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TimePickerModal } from "../time-picker-modal"
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
  const [timePickerOpen, setTimePickerOpen] = React.useState(false)
  const [selectedDateForTime, setSelectedDateForTime] = React.useState<Date | null>(null)

  const handleDayClick = (date: Date | undefined) => {
    if (!date) return
    onStartDateSelect(date)
    setSelectedDateForTime(date)
    setTimePickerOpen(true)
  }

  const handleTimeSave = () => {
    setTimePickerOpen(false)
  }

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
          Click a date on the calendar to select start and end times
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <Label>Start Date <span className="text-red-500">*</span></Label>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={startDate || undefined}
              onSelect={(date) => {
                if (date) {
                  handleDayClick(date)
                } else {
                  onStartDateSelect(null)
                }
              }}
              className="rounded-md border"
            />
          </div>
          {errors?.start_date && (
            <p className="text-sm text-red-500 text-center">{errors.start_date}</p>
          )}
        </div>

        {startDate && (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/50 p-4">
              <p className="text-sm font-medium mb-2">
                Selected Date:{" "}
                <span className="font-semibold text-primary">
                  {startDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </p>
              {startTime && endTime && (
                <p className="text-sm text-muted-foreground">
                  {startTime} - {endTime}
                </p>
              )}
            </div>

            {(!startTime || !endTime) && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Click the date above to set times
                </p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_time_display">Start Time</Label>
                <Input
                  id="start_time_display"
                  type="time"
                  value={startTime}
                  onChange={(e) => onStartTimeChange(e.target.value)}
                  className={errors?.start_time ? "border-red-500" : ""}
                />
                {errors?.start_time && (
                  <p className="text-sm text-red-500">{errors.start_time}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time_display">End Time</Label>
                <Input
                  id="end_time_display"
                  type="time"
                  value={endTime}
                  onChange={(e) => onEndTimeChange(e.target.value)}
                  className={errors?.end_time ? "border-red-500" : ""}
                />
                {errors?.end_time && (
                  <p className="text-sm text-red-500">{errors.end_time}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date (optional - defaults to start date)</Label>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={endDate || undefined}
                  onSelect={(date) => onEndDateSelect(date)}
                  className="rounded-md border"
                />
              </div>
              {errors?.end_date && (
                <p className="text-sm text-red-500 text-center">{errors.end_date}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <TimePickerModal
        isOpen={timePickerOpen}
        onClose={() => setTimePickerOpen(false)}
        selectedDate={selectedDateForTime}
        startTime={startTime}
        endTime={endTime}
        onStartTimeChange={onStartTimeChange}
        onEndTimeChange={onEndTimeChange}
        onSave={handleTimeSave}
        isWeekly={false}
      />
    </div>
  )
}

