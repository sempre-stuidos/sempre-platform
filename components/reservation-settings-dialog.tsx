"use client"

import * as React from "react"
import { IconMail, IconSettings } from "@tabler/icons-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { getReservationSettings, updateReservationSettings, type ReservationSettings } from "@/lib/reservation-settings"

interface ReservationSettingsDialogProps {
  orgId: string
  children: React.ReactNode
}

export function ReservationSettingsDialog({ orgId, children }: ReservationSettingsDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    email_recipients: [] as string[],
  })
  const [emailInput, setEmailInput] = React.useState("")

  // Load settings when dialog opens
  React.useEffect(() => {
    if (open) {
      loadSettings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orgId])

  const loadSettings = async () => {
    try {
      const currentSettings = await getReservationSettings(orgId)
      if (currentSettings) {
        setFormData({
          email_recipients: currentSettings.email_recipients || [],
        })
      } else {
        setFormData({
          email_recipients: [],
        })
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const result = await updateReservationSettings(orgId, formData)
      if (result) {
        toast.success("Reservation settings saved successfully")
        setOpen(false)
      } else {
        toast.error("Failed to save reservation settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save reservation settings")
    } finally {
      setLoading(false)
    }
  }

  const addEmail = () => {
    const email = emailInput.trim()
    if (!email) {
      toast.error("Please enter an email address")
      return
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address")
      return
    }
    
    if (formData.email_recipients.includes(email)) {
      toast.error("This email address is already added")
      return
    }
    
    setFormData({
      ...formData,
      email_recipients: [...formData.email_recipients, email],
    })
    setEmailInput("")
  }

  const removeEmail = (email: string) => {
    setFormData({
      ...formData,
      email_recipients: formData.email_recipients.filter((e) => e !== email),
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addEmail()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconSettings className="h-5 w-5" />
            Reservation Settings
          </DialogTitle>
          <DialogDescription>
            Configure email recipients who will receive reservation request notifications
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Email Recipients */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <IconMail className="h-4 w-4" />
              <Label>Email Recipients</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Add email addresses that should receive notifications when new reservation requests are submitted
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button type="button" onClick={addEmail} variant="outline" size="sm">
                Add
              </Button>
            </div>
            {formData.email_recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.email_recipients.map((email) => (
                  <div
                    key={email}
                    className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="text-muted-foreground hover:text-foreground ml-1"
                      aria-label={`Remove ${email}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {formData.email_recipients.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                No recipients added yet. Add email addresses above to receive reservation notifications.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

