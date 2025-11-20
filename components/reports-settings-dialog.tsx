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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { getReportSettings, updateReportSettings, type ReportSettings } from "@/lib/reports"

interface ReportsSettingsDialogProps {
  orgId: string
  children: React.ReactNode
}

export function ReportsSettingsDialog({ orgId, children }: ReportsSettingsDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    frequency: "Monthly" as ReportSettings["frequency"],
    email_enabled: false,
    email_recipients: [] as string[],
    include_analytics: true,
    include_reservations: true,
    include_menu_stats: true,
    include_gallery_stats: true,
    include_performance: true,
    include_events: false,
    include_custom_sections: false,
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
      const currentSettings = await getReportSettings(orgId)
      if (currentSettings) {
        setFormData({
          frequency: currentSettings.frequency,
          email_enabled: currentSettings.email_enabled,
          email_recipients: currentSettings.email_recipients || [],
          include_analytics: currentSettings.include_analytics,
          include_reservations: currentSettings.include_reservations,
          include_menu_stats: currentSettings.include_menu_stats,
          include_gallery_stats: currentSettings.include_gallery_stats,
          include_performance: currentSettings.include_performance,
          include_events: currentSettings.include_events,
          include_custom_sections: currentSettings.include_custom_sections,
        })
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const handleSave = async () => {
    // Validate that at least one content option is selected
    const hasContent =
      formData.include_analytics ||
      formData.include_reservations ||
      formData.include_menu_stats ||
      formData.include_gallery_stats ||
      formData.include_performance ||
      formData.include_events ||
      formData.include_custom_sections

    if (!hasContent) {
      toast.error("Please select at least one content option to include in reports")
      return
    }

    // Validate email recipients if email is enabled
    if (formData.email_enabled && formData.email_recipients.length === 0) {
      toast.error("Please add at least one email recipient")
      return
    }

    setLoading(true)
    try {
      const result = await updateReportSettings(orgId, formData)
      if (result) {
        toast.success("Report settings saved successfully")
        setOpen(false)
      } else {
        toast.error("Failed to save report settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save report settings")
    } finally {
      setLoading(false)
    }
  }

  const addEmail = () => {
    const email = emailInput.trim()
    if (email && email.includes("@") && !formData.email_recipients.includes(email)) {
      setFormData({
        ...formData,
        email_recipients: [...formData.email_recipients, email],
      })
      setEmailInput("")
    }
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
            Reports Settings
          </DialogTitle>
          <DialogDescription>
            Configure how often you receive reports and what content to include
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Frequency Setting */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Report Frequency</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) =>
                setFormData({ ...formData, frequency: value as ReportSettings["frequency"] })
              }
            >
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Daily">Daily</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Quarterly">Quarterly</SelectItem>
                <SelectItem value="Never">Never</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How often you want to receive automated reports
            </p>
          </div>

          <Separator />

          {/* Email Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="email_enabled"
                checked={formData.email_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, email_enabled: checked === true })
                }
              />
              <Label htmlFor="email_enabled" className="flex items-center gap-2">
                <IconMail className="h-4 w-4" />
                Receive reports via email
              </Label>
            </div>

            {formData.email_enabled && (
              <div className="space-y-2 pl-6">
                <Label>Email Recipients</Label>
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
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Content Inclusion Settings */}
          <div className="space-y-4">
            <Label>Content to Include in Reports</Label>
            <p className="text-xs text-muted-foreground">
              Select which sections you want to include in your reports
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_analytics"
                  checked={formData.include_analytics}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, include_analytics: checked === true })
                  }
                />
                <Label htmlFor="include_analytics">
                  Include Analytics (site visits, bookings trends)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_reservations"
                  checked={formData.include_reservations}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, include_reservations: checked === true })
                  }
                />
                <Label htmlFor="include_reservations">
                  Include Reservations (reservation statistics, upcoming reservations)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_menu_stats"
                  checked={formData.include_menu_stats}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, include_menu_stats: checked === true })
                  }
                />
                <Label htmlFor="include_menu_stats">
                  Include Menu Stats (menu items count, popular items)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_gallery_stats"
                  checked={formData.include_gallery_stats}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, include_gallery_stats: checked === true })
                  }
                />
                <Label htmlFor="include_gallery_stats">
                  Include Gallery Stats (total images, recent uploads)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_performance"
                  checked={formData.include_performance}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, include_performance: checked === true })
                  }
                />
                <Label htmlFor="include_performance">
                  Include Performance Metrics (site performance, load times)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_events"
                  checked={formData.include_events}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, include_events: checked === true })
                  }
                />
                <Label htmlFor="include_events">
                  Include Events (upcoming events, event statistics)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_custom_sections"
                  checked={formData.include_custom_sections}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, include_custom_sections: checked === true })
                  }
                />
                <Label htmlFor="include_custom_sections">
                  Include Custom Sections (any custom page sections)
                </Label>
              </div>
            </div>
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

