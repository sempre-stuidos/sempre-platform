"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface BasicInfoStepProps {
  title: string
  description: string
  onTitleChange: (title: string) => void
  onDescriptionChange: (description: string) => void
  errors?: Record<string, string>
}

export function BasicInfoStep({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  errors,
}: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Event Details</h2>
        <p className="text-muted-foreground">
          Give your event a name and description
        </p>
      </div>

      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="space-y-2">
          <Label htmlFor="title">
            Event Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g., Jazz Night with The Blue Notes"
            className={errors?.title ? "border-red-500" : ""}
          />
          {errors?.title && (
            <p className="text-sm text-red-500">{errors.title}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Full event description..."
            rows={6}
          />
        </div>
      </div>
    </div>
  )
}

