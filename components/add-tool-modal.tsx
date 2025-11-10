"use client"

import { IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { AgencyToolkit } from "@/lib/types"

interface AddToolModalProps {
  isOpen: boolean
  onClose: () => void
  onAddTool: (tool: NewTool) => void
  initialData?: Partial<AgencyToolkit>
  isEdit?: boolean
}

interface NewTool {
  name: string
  category: "Design" | "Hosting" | "AI" | "Marketing" | "Productivity"
  planType?: string
  seats?: number
  renewalCycle?: "Monthly" | "Yearly"
  price: number
  currency?: string
  paymentMethod?: string
  nextBillingDate?: string
  status: "Active" | "Trial" | "Canceled"
  notes?: string
}

export function AddToolModal({ isOpen, onClose, onAddTool, initialData, isEdit = false }: AddToolModalProps) {
  const [formData, setFormData] = useState<NewTool>(() => {
    if (initialData && isEdit) {
      return {
        name: initialData.name || "",
        category: initialData.category || "Productivity",
        planType: initialData.planType || "",
        seats: initialData.seats || 1,
        renewalCycle: initialData.renewalCycle || "Monthly",
        price: initialData.price || 0,
        currency: initialData.currency || "USD",
        nextBillingDate: initialData.nextBillingDate || "",
        status: initialData.status || "Active",
        notes: initialData.notes || ""
      }
    }
    return {
      name: "",
      category: "Productivity",
      planType: "",
      seats: 1,
      renewalCycle: "Monthly",
      price: 0,
      currency: "USD",
      nextBillingDate: "",
      status: "Active",
      notes: ""
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        name: initialData.name || "",
        category: initialData.category || "Productivity",
        planType: initialData.planType || "",
        seats: initialData.seats || 1,
        renewalCycle: initialData.renewalCycle || "Monthly",
        price: initialData.price || 0,
        currency: initialData.currency || "USD",
        nextBillingDate: initialData.nextBillingDate || "",
        status: initialData.status || "Active",
        notes: initialData.notes || ""
      })
    } else if (!isEdit) {
      // Reset form data for new tool
      setFormData({
        name: "",
        category: "Productivity",
        planType: "",
        seats: 1,
        renewalCycle: "Monthly",
        price: 0,
        currency: "USD",
        nextBillingDate: "",
        status: "Active",
        notes: ""
      })
    }
  }, [initialData, isEdit])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    // Required fields: name, category, price, status
    if (!formData.name.trim()) {
      newErrors.name = "Tool name is required"
    }
    if (!formData.category) {
      newErrors.category = "Category is required"
    }
    if (formData.price === undefined || formData.price < 0) {
      newErrors.price = "Price must be a positive number"
    }
    if (!formData.status) {
      newErrors.status = "Status is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      // Ensure planType has a default value if empty
      const toolData = {
        ...formData,
        planType: formData.planType || "Standard",
        paymentMethod: "Credit Card", // Default payment method
      }
      onAddTool(toolData)
      setFormData({
        name: "",
        category: "Productivity",
        planType: "",
        seats: 1,
        renewalCycle: "Monthly",
        price: 0,
        currency: "USD",
        nextBillingDate: "",
        status: "Active",
        notes: ""
      })
      setErrors({})
      onClose()
    }
  }

  const handleClose = () => {
    setFormData({
      name: "",
      category: "Productivity",
      planType: "",
      seats: 1,
      renewalCycle: "Monthly",
      price: 0,
      currency: "USD",
      nextBillingDate: "",
      status: "Active",
      notes: ""
    })
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Tool" : "Add New Tool"}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Update tool subscription details and billing information."
              : "Add a new tool or service subscription to your agency toolkit."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tool Name - Required */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">
                Tool/Service Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Figma, Notion, Slack"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Category - Required */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value: "Design" | "Hosting" | "AI" | "Marketing" | "Productivity") =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="category" className={errors.category ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Hosting">Hosting</SelectItem>
                  <SelectItem value="AI">AI</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Productivity">Productivity</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category}</p>
              )}
            </div>

            {/* Status - Required */}
            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: "Active" | "Trial" | "Canceled") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status" className={errors.status ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Trial">Trial</SelectItem>
                  <SelectItem value="Canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status}</p>
              )}
            </div>

            {/* Plan Type - Optional */}
            <div className="space-y-2">
              <Label htmlFor="planType">Plan Type</Label>
              <Input
                id="planType"
                placeholder="e.g., Pro, Business, Enterprise"
                value={formData.planType}
                onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
              />
            </div>

            {/* Seats - Optional */}
            <div className="space-y-2">
              <Label htmlFor="seats">Number of Seats</Label>
              <Input
                id="seats"
                type="number"
                min="1"
                placeholder="1"
                value={formData.seats}
                onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) || 1 })}
              />
            </div>

            {/* Renewal Cycle - Optional */}
            <div className="space-y-2">
              <Label htmlFor="renewalCycle">Renewal Cycle</Label>
              <Select
                value={formData.renewalCycle}
                onValueChange={(value: "Monthly" | "Yearly") =>
                  setFormData({ ...formData, renewalCycle: value })
                }
              >
                <SelectTrigger id="renewalCycle">
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price - Required */}
            <div className="space-y-2">
              <Label htmlFor="price">
                Price <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                inputMode="decimal"
                value={formData.price || ""}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData({ ...formData, price: value === "" ? 0 : parseFloat(value) })
                }}
                onBlur={(e) => {
                  // Format on blur to ensure 2 decimal places
                  const value = parseFloat(e.target.value) || 0
                  setFormData({ ...formData, price: parseFloat(value.toFixed(2)) })
                }}
                className={errors.price ? "border-destructive" : ""}
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price}</p>
              )}
            </div>

            {/* Currency - Optional */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                placeholder="USD"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              />
            </div>

            {/* Next Billing Date - Optional */}
            <div className="space-y-2">
              <Label htmlFor="nextBillingDate">Next Billing Date</Label>
              <Input
                id="nextBillingDate"
                type="date"
                value={formData.nextBillingDate}
                onChange={(e) => setFormData({ ...formData, nextBillingDate: e.target.value })}
                className="[color-scheme:dark]"
              />
            </div>

            {/* Notes - Optional */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional information about this tool..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEdit ? "Update Tool" : "Add Tool"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

