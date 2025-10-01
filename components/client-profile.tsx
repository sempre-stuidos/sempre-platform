"use client"

import { IconMail, IconPhone, IconBuilding, IconMapPin, IconCalendar, IconDollarSign } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

interface Client {
  id: number
  name: string
  businessType: string
  status: string
  projectCount: number
  priority: string
  contactEmail: string
  lastContact: string
  totalValue: number
}

interface ClientProfileProps {
  client: Client
}

export function ClientProfile({ client }: ClientProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: client.name,
    email: client.contactEmail,
    phone: "+1 (555) 123-4567", // Mock data
    businessName: client.name,
    industry: client.businessType,
    address: "123 Business St, City, State 12345", // Mock data
    website: "https://example.com", // Mock data
    notes: "This is a sample client profile with comprehensive business information and contact details."
  })

  const handleSave = () => {
    // Here you would typically save to your backend
    console.log("Saving client profile:", formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      name: client.name,
      email: client.contactEmail,
      phone: "+1 (555) 123-4567",
      businessName: client.name,
      industry: client.businessType,
      address: "123 Business St, City, State 12345",
      website: "https://example.com",
      notes: "This is a sample client profile with comprehensive business information and contact details."
    })
    setIsEditing(false)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Primary contact details and business information</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <IconBuilding className="h-4 w-4 text-muted-foreground" />
                  <span>{formData.name}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <IconMail className="h-4 w-4 text-muted-foreground" />
                  <span>{formData.email}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <IconPhone className="h-4 w-4 text-muted-foreground" />
                  <span>{formData.phone}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              {isEditing ? (
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <IconBuilding className="h-4 w-4 text-muted-foreground" />
                  <span>{formData.businessName}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              {isEditing ? (
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{formData.industry}</Badge>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              {isEditing ? (
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <IconMapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{formData.address}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              {isEditing ? (
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <a 
                    href={formData.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {formData.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Business Overview</CardTitle>
          <CardDescription>Key metrics and business information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge 
                variant={client.status === "Active" ? "default" : "secondary"}
                className={client.status === "Active" ? "bg-green-100 text-green-800" : ""}
              >
                {client.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Priority</span>
              <Badge 
                variant="outline"
                className={
                  client.priority === "High" 
                    ? "bg-red-100 text-red-800 border-red-200" 
                    : client.priority === "Medium"
                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                    : "bg-green-100 text-green-800 border-green-200"
                }
              >
                {client.priority}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Projects</span>
              <span className="text-sm">{client.projectCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Value</span>
              <span className="text-sm font-semibold">${client.totalValue.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Contact</span>
              <div className="flex items-center gap-2">
                <IconCalendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{new Date(client.lastContact).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Label htmlFor="notes">Notes</Label>
            {isEditing ? (
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-2"
                rows={4}
              />
            ) : (
              <p className="text-sm text-muted-foreground mt-2">{formData.notes}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
