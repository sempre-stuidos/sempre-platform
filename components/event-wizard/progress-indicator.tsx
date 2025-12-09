"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}

export function ProgressIndicator({
  currentStep,
  totalSteps,
  stepLabels,
}: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {stepLabels.map((label, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep

        return (
          <React.Fragment key={stepNumber}>
            <div
              className={cn(
                "flex items-center gap-2",
                isCompleted || isCurrent
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  isCompleted || isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {isCompleted ? "✓" : stepNumber}
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                {label}
              </span>
            </div>
            {stepNumber < totalSteps && (
              <div
                className={cn(
                  "w-12 h-0.5 transition-colors",
                  isCompleted ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

