"use client"

import { useState } from "react"
import {
  IconCheck,
  IconEdit,
  IconTrash,
  IconWallet,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useCurrentUser } from "@/hooks/use-current-user"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export function AccountContent() {
  const { currentUser, isLoading } = useCurrentUser()
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [autoRenewal, setAutoRenewal] = useState(true)

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

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (!currentUser) {
      toast.error("User not found")
      return
    }

    setIsUpdatingPassword(true)

    try {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: passwordForm.currentPassword,
      })

      if (signInError) {
        toast.error("Current password is incorrect")
        setIsUpdatingPassword(false)
        return
      }

      // Update password via API
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          password: passwordForm.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update password")
      }

      toast.success("Password updated successfully!")
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update password"
      )
    } finally {
      setIsUpdatingPassword(false)
    }
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
        <h1 className="text-3xl font-bold mb-2">Account Information</h1>
        <p className="text-muted-foreground">
          Manage your account settings, update your password, and view your subscription details.
        </p>
      </div>

      {/* Account Details Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Full Name
              </Label>
              <p className="font-medium">{currentUser.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Email Address
              </Label>
              <p className="font-medium">{currentUser.email}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                User ID
              </Label>
              <p className="font-medium text-xs font-mono">{currentUser.id}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Account Status
              </Label>
              <Badge variant="default" className="mt-1">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Subscription and Update Password in same row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Subscription Section */}
        <Card>
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
                <p className="text-sm font-medium mb-1">Enable Auto renewal</p>
                <p className="text-xs text-muted-foreground">
                  This option if checked, will renew your subscription once the current one expires.
                </p>
              </div>
              <Switch
                checked={autoRenewal}
                onCheckedChange={setAutoRenewal}
              />
            </div>
          </CardContent>
        </Card>

        {/* Password Update Section */}
        <Card>
          <CardHeader>
            <CardTitle>Update Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  required
                  disabled={isUpdatingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  required
                  disabled={isUpdatingPassword}
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  disabled={isUpdatingPassword}
                />
              </div>
              <Button type="submit" disabled={isUpdatingPassword}>
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
