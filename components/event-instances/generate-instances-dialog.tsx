"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface GenerateInstancesDialogProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (startDate: string, endDate: string) => Promise<void>
  eventDayOfWeek?: number
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function GenerateInstancesDialog({
  isOpen,
  onClose,
  onGenerate,
  eventDayOfWeek,
}: GenerateInstancesDialogProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Set default dates when dialog opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      const lastDayStr = lastDayOfMonth.toISOString().split('T')[0]
      
      setStartDate(todayStr)
      setEndDate(lastDayStr)
      setErrors({})
    }
  }, [isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!startDate) {
      newErrors.startDate = 'Start date is required'
    }

    if (!endDate) {
      newErrors.endDate = 'End date is required'
    }

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)

      if (isNaN(start.getTime())) {
        newErrors.startDate = 'Invalid start date'
      }

      if (isNaN(end.getTime())) {
        newErrors.endDate = 'Invalid end date'
      }

      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
        newErrors.endDate = 'End date must be after start date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsGenerating(true)
    try {
      await onGenerate(startDate, endDate)
      toast.success('Instances generated successfully')
      handleClose()
    } catch (error) {
      console.error('Error generating instances:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate instances')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = () => {
    if (!isGenerating) {
      setStartDate("")
      setEndDate("")
      setErrors({})
      onClose()
    }
  }

  const dayName = eventDayOfWeek !== undefined ? DAY_NAMES[eventDayOfWeek] : 'the selected day'

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Event Instances</DialogTitle>
          <DialogDescription>
            Generate instances for {dayName} within the selected date range. 
            Existing instances for these dates will be skipped.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={errors.startDate ? "border-red-500" : ""}
                disabled={isGenerating}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500">{errors.startDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={errors.endDate ? "border-red-500" : ""}
                disabled={isGenerating}
              />
              {errors.endDate && (
                <p className="text-sm text-red-500">{errors.endDate}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate Instances'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

