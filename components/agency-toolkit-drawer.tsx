"use client"

import * as React from "react"
import {
  IconCurrencyDollar,
  IconCreditCard,
  IconUsers,
  IconClock,
  IconCalendarEvent,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

interface AgencyToolkitDrawerProps {
  tool: {
    id: number
    name: string
    logo: string
    category: string
    planType: string
    seats: number
    renewalCycle: string
    price: number
    currency: string
    paymentMethod: string
    nextBillingDate: string
    status: string
    notes: string
    invoices: Array<{
      id: string
      date: string
      amount: number
      currency: string
      status: string
    }>
    costHistory: Array<{
      date: string
      amount: number
      currency: string
    }>
  } | null
  isOpen: boolean
  onClose: () => void
}

export function AgencyToolkitDrawer({ tool, isOpen, onClose }: AgencyToolkitDrawerProps) {
  if (!tool) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[420px] sm:w-[580px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 pb-4 border-b">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-white">{tool.name.charAt(0)}</span>
              </div>
              <div>
                <SheetTitle className="text-2xl font-semibold">{tool.name}</SheetTitle>
                <SheetDescription className="text-base mt-1">
                  {tool.planType} • {tool.seats} seats
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Subscription Details */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Subscription Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Plan Type</Label>
                    <p className="text-sm font-medium">{tool.planType}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Seats</Label>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <IconUsers className="size-4 text-muted-foreground" />
                      {tool.seats}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Renewal Cycle</Label>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <IconClock className="size-4 text-muted-foreground" />
                      {tool.renewalCycle}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Price</Label>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <IconCurrencyDollar className="size-4 text-muted-foreground" />
                      {tool.price.toFixed(2)} {tool.currency}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment Method</Label>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <IconCreditCard className="size-4 text-muted-foreground" />
                      {tool.paymentMethod}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Next Billing</Label>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <IconCalendarEvent className="size-4 text-muted-foreground" />
                      {tool.nextBillingDate}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Notes
                </CardTitle>
                <CardDescription className="text-sm">Who uses it and what for</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={tool.notes}
                  readOnly
                  className="min-h-[100px] resize-none border-0 bg-muted/50 focus-visible:ring-0"
                  placeholder="Add notes about this tool..."
                />
              </CardContent>
            </Card>
          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-4 border-t bg-muted/30">
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-10">
                <IconEdit className="size-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" className="flex-1 h-10">
                <IconTrash className="size-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
