"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface TimePickerModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
  startTime: string
  endTime: string
  onStartTimeChange: (time: string) => void
  onEndTimeChange: (time: string) => void
  onSave: () => void
  isWeekly?: boolean
}

export function TimePickerModal({
  isOpen,
  onClose,
  selectedDate,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  onSave,
  isWeekly = false,
}: TimePickerModalProps) {
  const handleSave = () => {
    if (startTime && endTime) {
      onSave()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isWeekly
              ? "Select Event Times"
              : selectedDate
              ? `Select Times for ${selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}`
              : "Select Event Times"}
          </DialogTitle>
          <DialogDescription>
            {isWeekly
              ? "Set the start and end times for this weekly event"
              : "Choose when your event starts and ends"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="start_time">Start Time *</Label>
            <Input
              id="start_time"
              type="time"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_time">End Time *</Label>
            <Input
              id="end_time"
              type="time"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!startTime || !endTime}
            >
              Save Times
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

