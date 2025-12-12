"use client"

import { useState, useEffect } from "react"
import { EventInstance, Event } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Image from "next/image"
import { format } from "date-fns"
import { BandSelector } from "@/components/bands/band-selector"

interface EventInstanceEditorProps {
  orgId: string
  eventId: string
  instanceId: string
  event: Event
  instance: EventInstance
}

export function EventInstanceEditor({
  orgId,
  eventId,
  instanceId,
  event,
  instance: initialInstance,
}: EventInstanceEditorProps) {
  const [instance, setInstance] = useState(initialInstance)
  const [customDescription, setCustomDescription] = useState(instance.custom_description || "")
  const [customImageUrl, setCustomImageUrl] = useState(instance.custom_image_url || "")
  const [selectedBandIds, setSelectedBandIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Fetch instance bands
  useEffect(() => {
    const fetchInstanceBands = async () => {
      try {
        const response = await fetch(`/api/businesses/${orgId}/events/${eventId}/instances/${instanceId}/bands`)
        if (response.ok) {
          const data = await response.json()
          const bandIds = (data.instanceBands || []).map((ib: { band_id: string }) => ib.band_id)
          setSelectedBandIds(bandIds)
        }
      } catch (error) {
        console.error('Error fetching instance bands:', error)
      }
    }

    fetchInstanceBands()
  }, [orgId, eventId, instanceId])

  const handleImageFileSelect = async (file: File | null) => {
    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/businesses/${orgId}/gallery-images/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Failed to upload image")
      }

      const data = await response.json()
      if (!data?.imageUrl) {
        throw new Error("Upload did not return an image URL")
      }

      setCustomImageUrl(data.imageUrl)
      toast.success("Image uploaded successfully")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      // Update instance
      const response = await fetch(`/api/businesses/${orgId}/events/${eventId}/instances/${instanceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          custom_description: customDescription.trim() || null,
          custom_image_url: customImageUrl || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update instance' }))
        throw new Error(errorData.error || 'Failed to update instance')
      }

      const data = await response.json()
      setInstance(data.instance)

      // Save bands if event type is Jazz or Live Music
      if ((event.event_type === "Jazz" || event.event_type === "Live Music")) {
        try {
          const bandsResponse = await fetch(`/api/businesses/${orgId}/events/${eventId}/instances/${instanceId}/bands`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bandIds: selectedBandIds }),
          })

          if (!bandsResponse.ok) {
            console.error('Failed to save instance bands')
          }
        } catch (error) {
          console.error('Error saving instance bands:', error)
        }
      }

      toast.success('Instance updated successfully')
    } catch (error) {
      console.error('Error updating instance:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update instance')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Edit Instance - {format(new Date(instance.instance_date), "EEEE, MMMM d, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Custom Description (Optional)</Label>
            <Textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder={event.description || "Enter a custom description for this instance..."}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              If left empty, the parent event description will be used.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Custom Image (Optional)</Label>
            <div className="space-y-2">
              {customImageUrl && (
                <div className="relative h-48 w-full overflow-hidden rounded-md border">
                  <Image
                    src={customImageUrl}
                    alt="Instance image"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageFileSelect(file)
                    }
                  }}
                  disabled={isUploading}
                  className="cursor-pointer"
                />
                {customImageUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCustomImageUrl("")}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                If left empty, the parent event image will be used.
              </p>
            </div>
          </div>

          {(event.event_type === "Jazz" || event.event_type === "Live Music") && (
            <BandSelector
              orgId={orgId}
              selectedBandIds={selectedBandIds}
              onSelectionChange={setSelectedBandIds}
            />
          )}

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
