"use client"

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { IconTools, IconCheck } from '@tabler/icons-react'

const plans = [
  {
    name: 'Free',
    label: 'Everything free',
    priceMonthly: 0,
    priceAnnually: 0,
    cta: 'Your current plan',
    description: 'Start with the essentials and manage your site confidently.',
    isCurrent: true,
    features: [
      'Dashboard overview and stats',
      'How To tutorials and guides',
      'Pages management and customization',
      'Menu items and categories management',
      'Gallery with free storage tier',
      'Event creation (basic)',
      'Reservation viewing',
      'Maintenance plan access',
    ],
  },
  {
    name: 'Plus',
    label: 'Everything you needed',
    priceMonthly: 12,
    priceAnnually: 115,
    cta: 'Upgrade now',
    description: 'Unlock analytics, automated emails, and advanced features.',
    badge: 'Most Popular',
    features: [
      'Everything in free plan',
      'Site analytics and performance metrics',
      'Reservation auto-reply via email',
      'Reservation confirmation emails (approval/cancellation)',
      'Event scheduling',
      'Extended gallery storage',
    ],
  },
  {
    name: 'Premium',
    label: 'Power team with scale',
    priceMonthly: 16,
    priceAnnually: 154,
    cta: 'Upgrade now',
    description: 'Advanced features, priority support, and unlimited resources.',
    badge: 'Most Valuable',
    features: [
      'Everything in plus plan',
      'Priority support',
      'Unlimited gallery storage',
      'Advanced analytics and reporting',
      'Custom integrations',
      'Dedicated account manager',
    ],
  },
]

const addOns = [
  {
    title: 'Add AI to your plan',
    description: 'AI assistance when editing page content and creating or editing menu items.',
    priceMonthly: 4,
  },
  {
    title: 'Restaurant Reports',
    description: 'Get detailed performance reports from your site with insights and analytics.',
    priceMonthly: 5,
  },
]

export default function MaintenancePage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly')

  const getPrice = (plan: (typeof plans)[number]) => {
    if (billingCycle === 'annually') {
      return plan.priceAnnually
    }
    return plan.priceMonthly
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          {/* Header & Toggle Section */}
          <section className="mb-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <IconTools className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-semibold">
                    Maintenance plans built for peace of mind
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Switch plans any time as your website needs evolve.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ToggleGroup
                  type="single"
                  value={billingCycle}
                  onValueChange={(value) => {
                    if (value) setBillingCycle(value as 'monthly' | 'annually')
                  }}
                  variant="outline"
                  className="rounded-lg border"
                >
                  <ToggleGroupItem
                    value="monthly"
                    aria-label="Monthly billing"
                    className="min-w-[100px] px-6 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    Monthly
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="annually"
                    aria-label="Annually billing"
                    className="relative min-w-[140px] px-6 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    Annually
                    <Badge 
                      variant="outline" 
                      className="absolute -top-2 -right-2 z-10 text-[16px] border-primary/20 bg-background data-[state=on]:border-primary-foreground/30 data-[state=on]:text-primary-foreground data-[state=on]:bg-primary"
                    >
                      Save 20%
                    </Badge>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <Card className="border-dashed border-primary/30 bg-primary/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                    Complimentary onboarding
                  </p>
                  <p className="text-muted-foreground">
                    Switch to any annual plan and receive your first two months on us.
                  </p>
                </div>
                <Button variant="default" onClick={() => router.push(`/client/${orgId}/dashboard`)}>
                  Explore annual savings
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* Plan Cards */}
          <section className="mb-12">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {plans.map((plan) => {
                const price = getPrice(plan)
                const isAnnual = billingCycle === 'annually'
                return (
                  <Card
                    key={plan.name}
                    className={`h-full border border-border transition-all ${
                      plan.badge ? 'ring-1 ring-primary/60' : ''
                    }`}
                  >
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{plan.label}</p>
                          <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        </div>
                        {plan.badge && (
                          <Badge variant="outline" className="text-[16px] uppercase tracking-wide">
                            {plan.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="text-3xl font-semibold">
                        ${price}{' '}
                        <span className="text-base font-normal text-muted-foreground">
                          / {billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        className="w-full"
                        variant={plan.isCurrent ? 'outline' : 'default'}
                        disabled={plan.isCurrent}
                      >
                        {plan.cta}
                      </Button>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <IconCheck className="mt-0.5 h-4 w-4 text-primary" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      {isAnnual && plan.priceMonthly > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Billed as ${plan.priceAnnually} annually (2 months free)
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>

          {/* Add-ons */}
          <section className="mb-12 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold">Add-ons</p>
              <p className="text-sm text-muted-foreground">Enhance any plan with focused support.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {addOns.map((addon) => (
                <Card key={addon.title} className="flex flex-col gap-4 md:flex-row md:items-center">
                  <CardContent className="flex flex-1 flex-col gap-2 py-5">
                    <p className="font-medium">{addon.title}</p>
                    <p className="text-sm text-muted-foreground">{addon.description}</p>
                  </CardContent>
                  <CardFooter className="flex flex-wrap items-center gap-3 border-t md:flex-col md:border-l md:border-t-0 md:px-6">
                    <p className="text-sm font-semibold">
                      +${addon.priceMonthly}{' '}
                      <span className="font-normal text-muted-foreground">/ month</span>
                    </p>
                    <Button variant="outline" size="sm" className="w-full md:w-auto">
                      Add to plan
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

