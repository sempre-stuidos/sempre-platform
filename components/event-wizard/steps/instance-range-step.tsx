"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, CalendarRange, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"

interface InstanceRangeStepProps {
  instanceRangeType: "rest_of_month" | "next_4_weeks" | "next_8_weeks" | "custom"
  instanceStartDate: string
  instanceEndDate: string
  onInstanceRangeTypeChange: (type: "rest_of_month" | "next_4_weeks" | "next_8_weeks" | "custom") => void
  onInstanceStartDateChange: (date: string) => void
  onInstanceEndDateChange: (date: string) => void
  errors?: Record<string, string>
}

export function InstanceRangeStep({
  instanceRangeType,
  instanceStartDate,
  instanceEndDate,
  onInstanceRangeTypeChange,
  onInstanceStartDateChange,
  onInstanceEndDateChange,
  errors,
}: InstanceRangeStepProps) {
  // Calculate rest of month end date
  const getRestOfMonthEndDate = () => {
    const now = new Date()
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return lastDay.toISOString().split('T')[0]
  }

  // Calculate next N weeks end date
  const getNextNWeeksEndDate = (weeks: number) => {
    const now = new Date()
    now.setDate(now.getDate() + (weeks * 7))
    return now.toISOString().split('T')[0]
  }

  // Initialize start date once on mount
  React.useEffect(() => {
    if (!instanceStartDate) {
      const today = new Date().toISOString().split('T')[0]
      onInstanceStartDateChange(today)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Auto-update end date when range type changes (but not for custom)
  React.useEffect(() => {
    if (instanceRangeType === "rest_of_month") {
      const newEndDate = getRestOfMonthEndDate()
      if (newEndDate !== instanceEndDate) {
        onInstanceEndDateChange(newEndDate)
      }
    } else if (instanceRangeType === "next_4_weeks") {
      const newEndDate = getNextNWeeksEndDate(4)
      if (newEndDate !== instanceEndDate) {
        onInstanceEndDateChange(newEndDate)
      }
    } else if (instanceRangeType === "next_8_weeks") {
      const newEndDate = getNextNWeeksEndDate(8)
      if (newEndDate !== instanceEndDate) {
        onInstanceEndDateChange(newEndDate)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceRangeType]) // Only depend on instanceRangeType

  const rangeOptions = [
    {
      value: "rest_of_month" as const,
      label: "Rest of Month",
      description: "Generate instances for the rest of the current month",
      icon: Calendar,
    },
    {
      value: "next_4_weeks" as const,
      label: "Next 4 Weeks",
      description: "Generate instances for the next 4 weeks",
      icon: CalendarDays,
    },
    {
      value: "next_8_weeks" as const,
      label: "Next 8 Weeks",
      description: "Generate instances for the next 8 weeks",
      icon: CalendarRange,
    },
    {
      value: "custom" as const,
      label: "Custom Range",
      description: "Choose your own start and end dates",
      icon: Clock,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Generate Event Instances</h2>
        <p className="text-muted-foreground">
          Choose how many instances to generate for this weekly event
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 max-w-4xl mx-auto">
        {rangeOptions.map((option) => {
          const Icon = option.icon
          return (
            <Card
              key={option.value}
              className={cn(
                "cursor-pointer transition-all hover:border-primary",
                instanceRangeType === option.value && "border-primary ring-2 ring-primary"
              )}
              onClick={() => {
                onInstanceRangeTypeChange(option.value)
              }}
            >
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Icon className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">{option.label}</h3>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {instanceRangeType === "custom" && (
        <Card className="mt-4 max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="instance_start_date">Start Date</Label>
                <Input
                  id="instance_start_date"
                  type="date"
                  value={instanceStartDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    onInstanceStartDateChange(e.target.value)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instance_end_date">End Date</Label>
                <Input
                  id="instance_end_date"
                  type="date"
                  value={instanceEndDate || ""}
                  onChange={(e) => {
                    onInstanceEndDateChange(e.target.value)
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {instanceRangeType !== "custom" && instanceEndDate && (
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Instances will be generated until {new Date(instanceEndDate).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  )
}
