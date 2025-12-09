"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

type Tone = "Classic" | "Playful" | "Elegant"

interface BasicInfoStepProps {
  title: string
  description: string
  onTitleChange: (title: string) => void
  onDescriptionChange: (description: string) => void
  errors?: Record<string, string>
  orgId?: string
}

interface EventContext {
  eventType?: string
  startDate?: string
  startTime?: string
  endDate?: string
  endTime?: string
  dayOfWeek?: number
  isWeekly?: boolean
}

export function BasicInfoStep({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  errors,
  orgId,
}: BasicInfoStepProps) {
  const [selectedTone, setSelectedTone] = React.useState<Tone>("Classic")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [appliedFeedback, setAppliedFeedback] = React.useState(false)

  // Get event context from localStorage
  const getEventContextFromStorage = React.useCallback((): EventContext | undefined => {
    if (!orgId) return undefined

    try {
      const draftKey = `event-wizard-draft-${orgId}`
      const draft = localStorage.getItem(draftKey)
      if (!draft) return undefined

      const parsed = JSON.parse(draft)
      return {
        eventType: parsed.eventType,
        startDate: parsed.startDate ? new Date(parsed.startDate).toISOString().split('T')[0] : undefined,
        startTime: parsed.startTime,
        endDate: parsed.endDate ? new Date(parsed.endDate).toISOString().split('T')[0] : undefined,
        endTime: parsed.endTime,
        dayOfWeek: parsed.dayOfWeek,
        isWeekly: parsed.isWeekly,
      }
    } catch (e) {
      console.error("Failed to load event context:", e)
      return undefined
    }
  }, [orgId])

  const handleGenerate = React.useCallback(async (refinement?: "regenerate" | "shorten" | "formalize") => {
    setIsGenerating(true)
    setError(null)

    try {
      const eventContext = getEventContextFromStorage()

      const response = await fetch("/api/events/generate-title-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tone: selectedTone,
          eventContext,
          refinement,
          currentTitle: title || undefined,
          currentDescription: description || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to generate text" }))
        throw new Error(errorData.error || "Failed to generate text")
      }

      const data = await response.json()
      
      // Auto-populate the left column fields directly
      // Always update both fields to ensure they're set
      const newTitle = data.title ? String(data.title).trim() : ""
      const newDescription = data.description ? String(data.description).trim() : ""
      
      // Update both fields - call both callbacks to ensure React updates
      onTitleChange(newTitle)
      onDescriptionChange(newDescription)

      // Show visual feedback
      setAppliedFeedback(true)
      setTimeout(() => {
        setAppliedFeedback(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate text")
      console.error("Error generating text:", err)
    } finally {
      setIsGenerating(false)
    }
  }, [selectedTone, getEventContextFromStorage, title, description, onTitleChange, onDescriptionChange])

  const handleRefinement = React.useCallback((type: "regenerate" | "shorten" | "formalize") => {
    handleGenerate(type)
  }, [handleGenerate])

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Event Details</h2>
        <p className="text-muted-foreground">
          Give your event a name and description
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-6 space-y-6 lg:space-y-0">
        {/* Left Column - Your Event Details */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Your Event Details</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You can type your own title and description, or let AI on the right suggest something and then apply it here.
            </p>
          </div>

        <div className="space-y-2">
          <Label htmlFor="title">
            Event Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g., Jazz Night with The Blue Notes"
              className={cn(
                errors?.title ? "border-red-500" : "",
                appliedFeedback ? "ring-2 ring-green-500 ring-offset-2" : ""
              )}
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
              className={cn(
                appliedFeedback ? "ring-2 ring-green-500 ring-offset-2" : ""
              )}
            />
          </div>
        </div>

        {/* Right Column - AI Writing Helper */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>AI Writing Helper</CardTitle>
              <CardDescription>
                Generate a title and description that will be added directly to your event.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1 - Choose a tone */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">1. Choose a tone</Label>
                <div className="flex flex-wrap gap-2">
                  {(["Classic", "Playful", "Elegant"] as Tone[]).map((tone) => (
                    <Badge
                      key={tone}
                      variant={selectedTone === tone ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer px-3 py-1.5 text-sm",
                        selectedTone === tone
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      )}
                      onClick={() => setSelectedTone(tone)}
                    >
                      {tone}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  This affects the style of your title and description.
                </p>
              </div>

              {/* Step 2 - Generate suggestion */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">2. Generate a suggestion</Label>
                <Button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate title & description"
                  )}
                </Button>
              </div>

              {/* Step 3 - Refinement controls */}
              {(title || description) && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Need a quick tweak?</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRefinement("regenerate")}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Regenerate"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRefinement("shorten")}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Shorter"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRefinement("formalize")}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "More formal"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
