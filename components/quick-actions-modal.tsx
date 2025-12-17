"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  IconLifebuoy,
  IconCheck,
  IconPaperclip,
  IconLoader2,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const requestCategories = [
  "Update photos",
  "Change menu",
  "Add event",
  "Update business hours",
  "Add or replace text",
  "Fix layout on desktop or mobile",
  "Something else",
]

export function QuickActionsModal() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    file: null as File | null,
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formData.category || !formData.description) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      toast.success("We received your request. Our team will follow up shortly.")
      setFormData({ category: "", description: "", file: null })
      setOpen(false)
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFormData((prev) => ({ ...prev, file: event.target.files![0] }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
        >
          <IconLifebuoy className="h-4 w-4" />
          Help
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <QuickActionsModalContent 
          formData={formData}
          setFormData={setFormData}
          isSubmitting={isSubmitting}
          handleSubmit={handleSubmit}
          handleFileChange={handleFileChange}
          setOpen={setOpen}
        />
      </DialogContent>
    </Dialog>
  )
}

export function QuickActionsModalContent({
  formData,
  setFormData,
  isSubmitting,
  handleSubmit,
  handleFileChange,
  setOpen,
}: {
  formData: { category: string; description: string; file: File | null }
  setFormData: React.Dispatch<React.SetStateAction<{ category: string; description: string; file: File | null }>>
  isSubmitting: boolean
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  setOpen: (open: boolean) => void
}) {
  return (
    <>
      <DialogHeader className="space-y-2">
        <DialogTitle className="flex items-center gap-2 text-xl">
          <IconLifebuoy className="h-5 w-5 text-primary" />
          Need help?
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          Request an update or ask for support without leaving your dashboard.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
            Share what you need updated—menus, photos, events, text, or anything
            else. We’ll take it from here.
          </div>

          <div className="space-y-2">
            <Label htmlFor="help-category">What would you like to update?</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger id="help-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {requestCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="help-description">Description</Label>
            <Textarea
              id="help-description"
              placeholder="Share the details we should know — links, pages, wording, timing, etc."
              rows={4}
              value={formData.description}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="help-file">Attach file (optional)</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                id="help-file"
                type="file"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {formData.file && (
                <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                  <IconPaperclip className="h-3.5 w-3.5" />
                  {formData.file.name}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Sending
                </>
              ) : (
                <>
                  <IconCheck className="h-4 w-4" />
                  Submit request
                </>
              )}
            </Button>
          </div>
        </form>
    </>
  )
}
