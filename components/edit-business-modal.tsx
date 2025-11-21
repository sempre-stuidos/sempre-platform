"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Business } from "@/lib/businesses"

interface EditBusinessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  business: Business | null
  onSuccess?: (business: Business) => void
  isAdmin?: boolean
}

export function EditBusinessModal({ 
  open, 
  onOpenChange, 
  business,
  onSuccess,
  isAdmin = false
}: EditBusinessModalProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState<"agency" | "restaurant" | "hotel" | "retail" | "service" | "other">("restaurant")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [status, setStatus] = useState<"active" | "inactive" | "suspended">("active")
  const [isLoading, setIsLoading] = useState(false)

  // Update form when business changes
  useEffect(() => {
    if (business) {
      setName(business.name || "")
      setType(business.type || "restaurant")
      setDescription(business.description || "")
      setAddress(business.address || "")
      setPhone(business.phone || "")
      setEmail(business.email || "")
      setWebsite(business.website || "")
      setLogoUrl(business.logo_url || "")
      setStatus(business.status || "active")
    }
  }, [business])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!business) return

    if (!name.trim()) {
      toast.error("Business name is required")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/businesses/${business.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          type: isAdmin ? type : undefined, // Only allow type change for admins
          description: description.trim() || undefined,
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          website: website.trim() || undefined,
          logo_url: logoUrl.trim() || undefined,
          status,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update business")
      }

      const { business: updatedOrg } = await response.json()
      toast.success("Business updated successfully")
      onOpenChange(false)
      onSuccess?.(updatedOrg)
    } catch (error) {
      console.error("Error updating business:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update business")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Business</DialogTitle>
          <DialogDescription>
            Update the business details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact Info</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Restaurant Name, Hotel Name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Type *</Label>
                <Select 
                  value={type} 
                  onValueChange={(value) => setType(value as typeof type)}
                  disabled={!isAdmin}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {!isAdmin && (
                  <p className="text-xs text-muted-foreground">
                    Business type cannot be changed. Only super admins can modify this.
                  </p>
                )}
                {isAdmin && (
                  <p className="text-xs text-muted-foreground">
                    You can change the business type as a super admin.
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status *</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            <TabsContent value="contact" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-logo_url">Logo URL</Label>
                <Input
                  id="edit-logo_url"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Business"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

