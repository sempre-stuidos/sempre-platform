"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { EventStatusBadge } from "@/components/event-status-badge"

interface VisibilityStepProps {
  isWeekly: boolean
  // Weekly event fields
  isLive: boolean
  isIndefinite: boolean
  publishEndDate: string
  publishEndTime: string
  // One-time event fields
  publishStartDate: string
  publishStartTime: string
  publishEndDateOneTime: string
  publishEndTimeOneTime: string
  visibilityAction: "publish" | "schedule" | "draft"
  // Handlers
  onIsLiveChange: (isLive: boolean) => void
  onIsIndefiniteChange: (isIndefinite: boolean) => void
  onPublishEndDateChange: (date: string) => void
  onPublishEndTimeChange: (time: string) => void
  onPublishStartDateChange: (date: string) => void
  onPublishStartTimeChange: (time: string) => void
  onPublishEndDateOneTimeChange: (date: string) => void
  onPublishEndTimeOneTimeChange: (time: string) => void
  onVisibilityActionChange: (action: "publish" | "schedule" | "draft") => void
  computedStatus: "draft" | "scheduled" | "live" | "past" | "archived"
  errors?: Record<string, string>
}

function getStatusMessage(
  publishStartDate: string,
  publishStartTime: string,
  computedStatus: string
): string {
  if (!publishStartDate || !publishStartTime) {
    return "Draft (Not visible on your site)"
  }

  const publishStart = new Date(`${publishStartDate}T${publishStartTime}`)
  const now = new Date()

  if (now < publishStart) {
    const dateStr = publishStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    const timeStr = publishStart.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    return `Scheduled (Goes live on ${dateStr} at ${timeStr})`
  }

  if (computedStatus === "live") {
    return "Live (Visible on site now)"
  }

  if (computedStatus === "past") {
    return "Past (No longer visible)"
  }

  return "Draft (Not visible on your site)"
}

export function VisibilityStep({
  isWeekly,
  isLive,
  isIndefinite,
  publishEndDate,
  publishEndTime,
  publishStartDate,
  publishStartTime,
  publishEndDateOneTime,
  publishEndTimeOneTime,
  visibilityAction,
  onIsLiveChange,
  onIsIndefiniteChange,
  onPublishEndDateChange,
  onPublishEndTimeChange,
  onPublishStartDateChange,
  onPublishStartTimeChange,
  onPublishEndDateOneTimeChange,
  onPublishEndTimeOneTimeChange,
  onVisibilityActionChange,
  computedStatus,
  errors,
}: VisibilityStepProps) {
  if (isWeekly) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Make this event visible?</h2>
          <p className="text-muted-foreground">
            Control when your weekly event appears on your site
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is_live" className="text-base">
                  Event Status
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isLive
                    ? "Event is live and visible"
                    : "Event is inactive and hidden"}
                </p>
              </div>
              <Switch
                id="is_live"
                checked={isLive}
                onCheckedChange={onIsLiveChange}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is_indefinite" className="text-base">
                  Show Indefinitely
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show this event indefinitely (no end date)
                </p>
              </div>
              <Switch
                id="is_indefinite"
                checked={isIndefinite}
                onCheckedChange={(checked) => {
                  onIsIndefiniteChange(checked)
                  if (checked) {
                    onPublishEndDateChange("")
                    onPublishEndTimeChange("")
                  }
                }}
              />
            </CardContent>
          </Card>

          {!isIndefinite && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="publish_end_date">Hide After Date</Label>
                <Input
                  id="publish_end_date"
                  type="date"
                  value={publishEndDate}
                  onChange={(e) => onPublishEndDateChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publish_end_time">Hide After Time</Label>
                <Input
                  id="publish_end_time"
                  type="time"
                  value={publishEndTime}
                  onChange={(e) => onPublishEndTimeChange(e.target.value)}
                />
              </div>
            </div>
          )}

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-sm text-muted-foreground">
                    {computedStatus === "live"
                      ? "Live (Visible on site now)"
                      : "Inactive (Hidden from site)"}
                  </p>
                </div>
                <EventStatusBadge status={computedStatus} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // One-time event
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          When should this event appear on your site?
        </h2>
        <p className="text-muted-foreground">
          Choose when to publish your event
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-4">
          <Label className="text-base">Visibility Option</Label>
          <div className="space-y-3">
            <div
              className="flex items-center space-x-2 p-4 border rounded-md cursor-pointer hover:bg-accent"
              onClick={() => onVisibilityActionChange("publish")}
            >
              <input
                type="radio"
                name="visibility"
                checked={visibilityAction === "publish"}
                onChange={() => onVisibilityActionChange("publish")}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <Label className="font-medium cursor-pointer">
                  Publish Now
                </Label>
                <p className="text-sm text-muted-foreground">
                  Make this event visible immediately
                </p>
              </div>
            </div>

            <div
              className="flex items-center space-x-2 p-4 border rounded-md cursor-pointer hover:bg-accent"
              onClick={() => onVisibilityActionChange("schedule")}
            >
              <input
                type="radio"
                name="visibility"
                checked={visibilityAction === "schedule"}
                onChange={() => onVisibilityActionChange("schedule")}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <Label className="font-medium cursor-pointer">
                  Schedule for Later
                </Label>
                <p className="text-sm text-muted-foreground">
                  Set a specific date and time to publish
                </p>
              </div>
            </div>

            <div
              className="flex items-center space-x-2 p-4 border rounded-md cursor-pointer hover:bg-accent"
              onClick={() => onVisibilityActionChange("draft")}
            >
              <input
                type="radio"
                name="visibility"
                checked={visibilityAction === "draft"}
                onChange={() => onVisibilityActionChange("draft")}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <Label className="font-medium cursor-pointer">
                  Save as Draft
                </Label>
                <p className="text-sm text-muted-foreground">
                  Keep this event hidden for now
                </p>
              </div>
            </div>
          </div>
        </div>

        {visibilityAction === "schedule" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="publish_start_date">Publish Start Date</Label>
              <Input
                id="publish_start_date"
                type="date"
                value={publishStartDate}
                onChange={(e) => onPublishStartDateChange(e.target.value)}
                className={errors?.publish_start_date ? "border-red-500" : ""}
              />
              {errors?.publish_start_date && (
                <p className="text-sm text-red-500">
                  {errors.publish_start_date}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish_start_time">Publish Start Time</Label>
              <Input
                id="publish_start_time"
                type="time"
                value={publishStartTime}
                onChange={(e) => onPublishStartTimeChange(e.target.value)}
                className={errors?.publish_start_time ? "border-red-500" : ""}
              />
              {errors?.publish_start_time && (
                <p className="text-sm text-red-500">
                  {errors.publish_start_time}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="publish_end_date_one_time">Publish End Date (Optional)</Label>
            <Input
              id="publish_end_date_one_time"
              type="date"
              value={publishEndDateOneTime}
              onChange={(e) => onPublishEndDateOneTimeChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publish_end_time_one_time">Publish End Time (Optional)</Label>
            <Input
              id="publish_end_time_one_time"
              type="time"
              value={publishEndTimeOneTime}
              onChange={(e) => onPublishEndTimeOneTimeChange(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground">
                  {getStatusMessage(
                    publishStartDate,
                    publishStartTime,
                    computedStatus
                  )}
                </p>
              </div>
              <EventStatusBadge status={computedStatus} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

