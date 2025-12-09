"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProgressIndicator } from "./progress-indicator"
import { FrequencyStep } from "./steps/frequency-step"
import { EventTypeStep } from "./steps/event-type-step"
import { BasicInfoStep } from "./steps/basic-info-step"
import { ImageUploadStep } from "./steps/image-upload-step"
import { DateTimeStep } from "./steps/date-time-step"
import { VisibilityStep } from "./steps/visibility-step"
import { Event } from "@/lib/types"
import { computeEventStatus } from "@/lib/events"
import { toast } from "sonner"

interface EventWizardProps {
  orgId: string
  event?: Event | null
  onSave?: (event: Partial<Event>) => Promise<void>
}

interface WizardFormData {
  // Step 1
  isWeekly: boolean | null
  // Step 2
  eventType: string
  // Step 3
  title: string
  description: string
  // Step 4
  imageUrl: string
  // Step 5 - One-time
  startDate: Date | null
  startTime: string
  endDate: Date | null
  endTime: string
  // Step 5 - Weekly
  dayOfWeek: number | undefined
  // Step 6 - Weekly
  isLive: boolean
  isIndefinite: boolean
  publishEndDate: string
  publishEndTime: string
  // Step 6 - One-time
  publishStartDate: string
  publishStartTime: string
  publishEndDateOneTime: string
  publishEndTimeOneTime: string
  visibilityAction: "publish" | "schedule" | "draft"
  // Other
  isFeatured: boolean
}

const STEP_LABELS = [
  "Frequency",
  "Event Type",
  "Details",
  "Image",
  "Date & Time",
  "Visibility",
]

export function EventWizard({ orgId, event, onSave }: EventWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = React.useState(1)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Initialize form data from event or defaults
  const initializeFormData = (): WizardFormData => {
    if (event) {
      return {
        isWeekly: event.is_weekly || false,
        eventType: event.event_type || "Jazz",
        title: event.title || "",
        description: event.description || "",
        imageUrl: event.image_url || "",
        startDate: event.starts_at ? new Date(event.starts_at) : null,
        startTime: event.starts_at
          ? new Date(event.starts_at).toTimeString().slice(0, 5)
          : "",
        endDate: event.ends_at ? new Date(event.ends_at) : null,
        endTime: event.ends_at
          ? new Date(event.ends_at).toTimeString().slice(0, 5)
          : "",
        dayOfWeek: event.day_of_week,
        isLive: event.status === "live" || event.status === "scheduled",
        isIndefinite: !event.publish_end_at,
        publishEndDate: event.publish_end_at
          ? new Date(event.publish_end_at).toISOString().split("T")[0]
          : "",
        publishEndTime: event.publish_end_at
          ? new Date(event.publish_end_at).toTimeString().slice(0, 5)
          : "",
        publishStartDate: event.publish_start_at
          ? new Date(event.publish_start_at).toISOString().split("T")[0]
          : "",
        publishStartTime: event.publish_start_at
          ? new Date(event.publish_start_at).toTimeString().slice(0, 5)
          : "",
        publishEndDateOneTime: event.publish_end_at
          ? new Date(event.publish_end_at).toISOString().split("T")[0]
          : "",
        publishEndTimeOneTime: event.publish_end_at
          ? new Date(event.publish_end_at).toTimeString().slice(0, 5)
          : "",
        visibilityAction:
          event.status === "live"
            ? "publish"
            : event.status === "scheduled"
            ? "schedule"
            : "draft",
        isFeatured: event.is_featured || false,
      }
    }

    // Defaults for new event
    return {
      isWeekly: null,
      eventType: "Jazz",
      title: "",
      description: "",
      imageUrl: "",
      startDate: null,
      startTime: "",
      endDate: null,
      endTime: "",
      dayOfWeek: undefined,
      isLive: true,
      isIndefinite: true,
      publishEndDate: "",
      publishEndTime: "",
      publishStartDate: "",
      publishStartTime: "",
      publishEndDateOneTime: "",
      publishEndTimeOneTime: "",
      visibilityAction: "draft",
      isFeatured: false,
    }
  }

  const [formData, setFormData] =
    React.useState<WizardFormData>(initializeFormData)

  // Load from localStorage on mount
  React.useEffect(() => {
    if (!event) {
      const draftKey = `event-wizard-draft-${orgId}`
      const draft = localStorage.getItem(draftKey)
      if (draft) {
        try {
          const parsed = JSON.parse(draft)
          // Convert date strings back to Date objects
          if (parsed.startDate) {
            parsed.startDate = new Date(parsed.startDate)
          }
          if (parsed.endDate) {
            parsed.endDate = new Date(parsed.endDate)
          }
          setFormData(parsed)
        } catch (e) {
          console.error("Failed to load draft:", e)
        }
      }
    }
  }, [orgId, event])

  // Save to localStorage on form data change
  React.useEffect(() => {
    if (!event) {
      const draftKey = `event-wizard-draft-${orgId}`
      const dataToSave = {
        ...formData,
        startDate: formData.startDate?.toISOString() || null,
        endDate: formData.endDate?.toISOString() || null,
      }
      localStorage.setItem(draftKey, JSON.stringify(dataToSave))
    }
  }, [formData, orgId, event])

  // Compute status for preview
  const computedStatus = React.useMemo(() => {
    if (formData.isWeekly) {
      return formData.isLive ? "live" : "draft"
    }

    const tempEvent: Partial<Event> = {
      status: "draft",
      publish_start_at:
        formData.publishStartDate && formData.publishStartTime
          ? new Date(
              `${formData.publishStartDate}T${formData.publishStartTime}`
            ).toISOString()
          : undefined,
      publish_end_at:
        formData.publishEndDateOneTime && formData.publishEndTimeOneTime
          ? new Date(
              `${formData.publishEndDateOneTime}T${formData.publishEndTimeOneTime}`
            ).toISOString()
          : undefined,
    }

    if (formData.visibilityAction === "publish") {
      return "live"
    }

    return computeEventStatus(tempEvent)
  }, [
    formData.isWeekly,
    formData.isLive,
    formData.publishStartDate,
    formData.publishStartTime,
    formData.publishEndDateOneTime,
    formData.publishEndTimeOneTime,
    formData.visibilityAction,
  ])

  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (formData.isWeekly === null) {
        newErrors.is_weekly = "Please select an event frequency type"
      }
    }

    if (step === 3) {
      if (!formData.title.trim()) {
        newErrors.title = "Event name is required"
      }
    }

    if (step === 5) {
      if (formData.isWeekly) {
        if (formData.dayOfWeek === undefined || formData.dayOfWeek === null) {
          newErrors.day_of_week = "Day of week is required"
        }
        if (!formData.startTime) {
          newErrors.start_time = "Start time is required"
        }
        if (!formData.endTime) {
          newErrors.end_time = "End time is required"
        }
        if (formData.startTime && formData.endTime) {
          const [startHour, startMin] = formData.startTime
            .split(":")
            .map(Number)
          const [endHour, endMin] = formData.endTime.split(":").map(Number)
          const startMinutes = startHour * 60 + startMin
          const endMinutes = endHour * 60 + endMin
          if (endMinutes <= startMinutes) {
            newErrors.end_time = "End time must be after start time"
          }
        }
      } else {
        if (!formData.startDate) {
          newErrors.start_date = "Start date is required"
        }
        if (!formData.startTime) {
          newErrors.start_time = "Start time is required"
        }
        if (!formData.endTime) {
          newErrors.end_time = "End time is required"
        }
        if (formData.startDate && formData.endDate && formData.startTime && formData.endTime) {
          const start = new Date(
            `${formData.startDate.toISOString().split("T")[0]}T${formData.startTime}`
          )
          const end = new Date(
            `${formData.endDate.toISOString().split("T")[0]}T${formData.endTime}`
          )
          if (end <= start) {
            newErrors.end_date = "End date/time must be after start date/time"
          }
        } else if (formData.startDate && formData.startTime && formData.endTime) {
          const start = new Date(
            `${formData.startDate.toISOString().split("T")[0]}T${formData.startTime}`
          )
          const end = new Date(
            `${formData.startDate.toISOString().split("T")[0]}T${formData.endTime}`
          )
          if (end <= start) {
            newErrors.end_time = "End time must be after start time"
          }
        }
      }
    }

    if (step === 6 && !formData.isWeekly && formData.visibilityAction === "schedule") {
      if (!formData.publishStartDate) {
        newErrors.publish_start_date = "Publish start date is required"
      }
      if (!formData.publishStartTime) {
        newErrors.publish_start_time = "Publish start time is required"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 6))
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    setErrors({})
  }

  const handleCancel = () => {
    if (!event) {
      const draftKey = `event-wizard-draft-${orgId}`
      localStorage.removeItem(draftKey)
    }
    router.push(`/client/${orgId}/events`)
  }

  const buildEventData = (): Partial<Event> => {
    let startsAt: string | undefined
    let endsAt: string | undefined

    if (formData.isWeekly) {
      if (formData.startTime) {
        const [hours, minutes] = formData.startTime.split(":").map(Number)
        const placeholderDate = new Date("2000-01-01")
        placeholderDate.setHours(hours, minutes, 0, 0)
        startsAt = placeholderDate.toISOString()
      }
      if (formData.endTime) {
        const [hours, minutes] = formData.endTime.split(":").map(Number)
        const placeholderDate = new Date("2000-01-01")
        placeholderDate.setHours(hours, minutes, 0, 0)
        endsAt = placeholderDate.toISOString()
      }
    } else {
      if (formData.startDate && formData.startTime) {
        const dateStr = formData.startDate.toISOString().split("T")[0]
        startsAt = new Date(`${dateStr}T${formData.startTime}`).toISOString()
      }
      const endDateToUse = formData.endDate || formData.startDate
      if (endDateToUse && formData.endTime) {
        const dateStr = endDateToUse.toISOString().split("T")[0]
        endsAt = new Date(`${dateStr}T${formData.endTime}`).toISOString()
      } else if (startsAt) {
        const end = new Date(startsAt)
        end.setHours(end.getHours() + 2)
        endsAt = end.toISOString()
      }
    }

    let publishStartAt: string | undefined
    let publishEndAt: string | undefined
    let status: Event["status"] = "draft"

    if (formData.isWeekly) {
      if (formData.isLive) {
        publishStartAt = formData.publishStartDate && formData.publishStartTime
          ? new Date(
              `${formData.publishStartDate}T${formData.publishStartTime}`
            ).toISOString()
          : new Date().toISOString()
        status = "live"
      } else {
        status = "draft"
        if (formData.publishStartDate && formData.publishStartTime) {
          publishStartAt = new Date(
            `${formData.publishStartDate}T${formData.publishStartTime}`
          ).toISOString()
        }
      }

      if (formData.isIndefinite) {
        publishEndAt = null as unknown as string
      } else {
        if (formData.publishEndDate && formData.publishEndTime) {
          publishEndAt = new Date(
            `${formData.publishEndDate}T${formData.publishEndTime}`
          ).toISOString()
        }
      }
    } else {
      if (formData.visibilityAction === "publish") {
        publishStartAt = new Date().toISOString()
        status = "live"
        if (formData.publishEndDateOneTime && formData.publishEndTimeOneTime) {
          publishEndAt = new Date(
            `${formData.publishEndDateOneTime}T${formData.publishEndTimeOneTime}`
          ).toISOString()
        } else if (endsAt) {
          publishEndAt = endsAt
        }
      } else if (formData.visibilityAction === "schedule") {
        if (formData.publishStartDate && formData.publishStartTime) {
          publishStartAt = new Date(
            `${formData.publishStartDate}T${formData.publishStartTime}`
          ).toISOString()
        }
        if (formData.publishEndDateOneTime && formData.publishEndTimeOneTime) {
          publishEndAt = new Date(
            `${formData.publishEndDateOneTime}T${formData.publishEndTimeOneTime}`
          ).toISOString()
        }
        const now = new Date()
        const publishStart = publishStartAt ? new Date(publishStartAt) : now
        status = now >= publishStart ? "live" : "scheduled"
      } else {
        status = "draft"
        if (formData.publishStartDate && formData.publishStartTime) {
          publishStartAt = new Date(
            `${formData.publishStartDate}T${formData.publishStartTime}`
          ).toISOString()
        }
        if (formData.publishEndDateOneTime && formData.publishEndTimeOneTime) {
          publishEndAt = new Date(
            `${formData.publishEndDateOneTime}T${formData.publishEndTimeOneTime}`
          ).toISOString()
        }
      }
    }

    return {
      title: formData.title,
      description: formData.description || undefined,
      event_type: formData.eventType || undefined,
      image_url: formData.imageUrl || undefined,
      starts_at: startsAt,
      ends_at: endsAt,
      publish_start_at: publishStartAt,
      publish_end_at: publishEndAt,
      status,
      is_featured: formData.isFeatured,
      is_weekly: formData.isWeekly || false,
      day_of_week: formData.isWeekly ? formData.dayOfWeek : undefined,
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error("Please fix the errors before continuing")
      return
    }

    setIsSubmitting(true)
    try {
      const eventData = buildEventData()

      if (onSave) {
        await onSave(eventData)
      } else {
        const url = event
          ? `/api/businesses/${orgId}/events/${event.id}`
          : `/api/businesses/${orgId}/events`

        const method = event ? "PATCH" : "POST"

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: "Failed to save event",
          }))
          throw new Error(errorData.error || "Failed to save event")
        }

        // Clear localStorage draft
        if (!event) {
          const draftKey = `event-wizard-draft-${orgId}`
          localStorage.removeItem(draftKey)
        }

        toast.success(event ? "Event updated successfully" : "Event created successfully")
      }

      router.replace(`/client/${orgId}/events`)
    } catch (error) {
      console.error("Error saving event:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to save event"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <FrequencyStep
            isWeekly={formData.isWeekly}
            onSelect={(isWeekly) =>
              setFormData({ ...formData, isWeekly })
            }
            errors={errors}
          />
        )
      case 2:
        return (
          <EventTypeStep
            eventType={formData.eventType}
            onSelect={(eventType) =>
              setFormData({ ...formData, eventType })
            }
            errors={errors}
          />
        )
      case 3:
        return (
          <BasicInfoStep
            title={formData.title}
            description={formData.description}
            onTitleChange={(title) => setFormData({ ...formData, title })}
            onDescriptionChange={(description) =>
              setFormData({ ...formData, description })
            }
            errors={errors}
          />
        )
      case 4:
        return (
          <ImageUploadStep
            imageUrl={formData.imageUrl}
            onImageChange={(url) => setFormData({ ...formData, imageUrl: url })}
            orgId={orgId}
            errors={errors}
          />
        )
      case 5:
        return (
          <DateTimeStep
            isWeekly={formData.isWeekly || false}
            startDate={formData.startDate}
            startTime={formData.startTime}
            endDate={formData.endDate}
            endTime={formData.endTime}
            dayOfWeek={formData.dayOfWeek}
            onStartDateSelect={(date) =>
              setFormData({ ...formData, startDate: date })
            }
            onStartTimeChange={(time) =>
              setFormData({ ...formData, startTime: time })
            }
            onEndDateSelect={(date) =>
              setFormData({ ...formData, endDate: date })
            }
            onEndTimeChange={(time) =>
              setFormData({ ...formData, endTime: time })
            }
            onDayOfWeekChange={(day) =>
              setFormData({ ...formData, dayOfWeek: day })
            }
            errors={errors}
          />
        )
      case 6:
        return (
          <VisibilityStep
            isWeekly={formData.isWeekly || false}
            isLive={formData.isLive}
            isIndefinite={formData.isIndefinite}
            publishEndDate={formData.publishEndDate}
            publishEndTime={formData.publishEndTime}
            publishStartDate={formData.publishStartDate}
            publishStartTime={formData.publishStartTime}
            publishEndDateOneTime={formData.publishEndDateOneTime}
            publishEndTimeOneTime={formData.publishEndTimeOneTime}
            visibilityAction={formData.visibilityAction}
            onIsLiveChange={(isLive) =>
              setFormData((prev) => ({ ...prev, isLive }))
            }
            onIsIndefiniteChange={(isIndefinite) =>
              setFormData((prev) => ({ ...prev, isIndefinite }))
            }
            onPublishEndDateChange={(date) =>
              setFormData((prev) => ({ ...prev, publishEndDate: date }))
            }
            onPublishEndTimeChange={(time) =>
              setFormData((prev) => ({ ...prev, publishEndTime: time }))
            }
            onPublishStartDateChange={(date) =>
              setFormData({ ...formData, publishStartDate: date })
            }
            onPublishStartTimeChange={(time) =>
              setFormData({ ...formData, publishStartTime: time })
            }
            onPublishEndDateOneTimeChange={(date) =>
              setFormData({ ...formData, publishEndDateOneTime: date })
            }
            onPublishEndTimeOneTimeChange={(time) =>
              setFormData({ ...formData, publishEndTimeOneTime: time })
            }
            onVisibilityActionChange={(action) =>
              setFormData({ ...formData, visibilityAction: action })
            }
            computedStatus={computedStatus}
            errors={errors}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {event ? `Edit Event – ${event.title}` : "New Event"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Step {currentStep} of {STEP_LABELS.length}
          </p>
        </div>
      </div>

      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={STEP_LABELS.length}
        stepLabels={STEP_LABELS}
      />

      <Card>
        <CardContent className="p-6 md:p-8">{renderStep()}</CardContent>
      </Card>

      <div className="flex justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}

          {currentStep < 6 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : event
                ? "Save Changes"
                : "Create Event"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

