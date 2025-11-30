"use client"

import { useState } from "react"
import {
  IconEdit,
  IconTrash,
  IconWallet,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useCurrentUser } from "@/hooks/use-current-user"

// Mock payment methods data - in real app, this would come from the database
const mockPaymentMethods = [
  {
    id: 1,
    type: 'Visa',
    last4: '7732',
    expiryMonth: 5,
    expiryYear: 22,
    isPrimary: true,
    brandColor: 'bg-orange-500',
  },
  {
    id: 2,
    type: 'Verve',
    last4: '7732',
    expiryMonth: 5,
    expiryYear: 22,
    isPrimary: false,
    brandColor: 'bg-teal-500',
  },
]

export function BillingContent() {
  const { currentUser, isLoading } = useCurrentUser()
  const [paymentMethods, setPaymentMethods] = useState(mockPaymentMethods)

  // Generate user code from user ID
  const getUserCode = (userId: string) => {
    const base = userId.replace(/-/g, '').substring(0, 8)
    return base.toUpperCase()
  }

  // Calculate expiry date (30 days from now as placeholder)
  const getExpiryDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleRemovePaymentMethod = (id: number) => {
    setPaymentMethods(paymentMethods.filter(method => method.id !== id))
  }

  if (isLoading || !currentUser) {
    return (
      <div className="flex-1 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  const userCode = getUserCode(currentUser.id)
  const expiryDate = getExpiryDate()

  return (
    <div className="flex-1 p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing Information</h1>
        <p className="text-muted-foreground">
          Set up your billing information for your payments and subscriptions.
        </p>
      </div>

      {/* Current Subscription Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/10 rounded-lg p-6 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Subscription Code
                </Label>
                <p className="font-semibold text-base">{userCode}</p>
              </div>
              <div className="text-right">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Expires on
                </Label>
                <p className="font-semibold text-base">{expiryDate}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-1">Plan</p>
              <p className="text-sm text-muted-foreground">Free Plan</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium mb-1">Status</p>
              <Badge variant="default">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment Method</CardTitle>
            <Button size="sm" className="gap-2">
              <IconWallet className="h-4 w-4" />
              + NEW CARD
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className={`${method.brandColor} text-white px-3 py-1 rounded text-xs font-semibold`}>
                  {method.type}
                </div>
                <div>
                  <p className="font-medium">
                    {method.type === 'Visa' ? '2345' : '4564'}*****{method.last4}
                    {method.isPrimary && (
                      <span className="ml-2 text-primary text-sm">Primary</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires on {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <IconEdit className="h-4 w-4" />
                  EDIT
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemovePaymentMethod(method.id)}
                >
                  <IconTrash className="h-4 w-4" />
                  REMOVE
                </Button>
              </div>
            </div>
          ))}
          {paymentMethods.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No payment methods added yet.</p>
              <Button variant="outline" className="mt-4 gap-2">
                <IconWallet className="h-4 w-4" />
                Add Payment Method
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
