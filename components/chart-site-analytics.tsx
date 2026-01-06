"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export interface SiteAnalyticsData {
  date: string;
  visits: number;
  bookings?: number;
  sales?: number;
}

interface ChartSiteAnalyticsProps {
  data: SiteAnalyticsData[];
  title?: string;
  description?: string;
  descriptionShort?: string;
  businessType?: 'agency' | 'restaurant' | 'hotel' | 'retail' | 'service' | 'other';
}

const chartConfig = {
  visits: {
    label: "Visits",
    color: "var(--primary)",
  },
  bookings: {
    label: "Bookings",
    color: "#22c55e", // Green color for bookings
  },
  sales: {
    label: "Sales",
    color: "#22c55e", // Green color for sales
  },
} satisfies ChartConfig

export function ChartSiteAnalytics({
  data: chartData,
  title = "Site Analytics",
  description = "Website visits and bookings for the last 3 months",
  descriptionShort = "Last 3 months",
  businessType = 'restaurant',
}: ChartSiteAnalyticsProps) {
  const isRetail = businessType === 'retail';
  const metricKey = isRetail ? 'sales' : 'bookings';
  const defaultDescription = isRetail 
    ? "Website visits and sales for the last 3 months"
    : "Website visits and bookings for the last 3 months";
  
  const finalDescription = description === "Website visits and bookings for the last 3 months" 
    ? defaultDescription 
    : description;
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  // Calculate totals for conditional rendering
  const totalVisits = filteredData.reduce((sum, item) => sum + (item.visits || 0), 0)
  const totalBookings = filteredData.reduce((sum, item) => sum + (item.bookings || 0), 0)
  const totalSales = filteredData.reduce((sum, item) => sum + (item.sales || 0), 0)

  // Generate date range for the selected time period to fill gaps
  const chartDataWithDateRange = React.useMemo(() => {
    if (filteredData.length === 0) return []

    const referenceDate = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    startDate.setHours(0, 0, 0, 0)

    // Create a map of existing data by date
    const dataMap = new Map<string, SiteAnalyticsData>()
    filteredData.forEach(item => {
      dataMap.set(item.date, item)
    })

    // Generate all dates in the range
    const allDates: SiteAnalyticsData[] = []
    const currentDate = new Date(startDate)
    const endDate = new Date(referenceDate)
    endDate.setHours(23, 59, 59, 999)

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const existingData = dataMap.get(dateStr)
      
      if (existingData) {
        allDates.push(existingData)
      } else {
        // Fill gaps with zero values
        allDates.push({
          date: dateStr,
          visits: 0,
          bookings: 0,
          sales: 0,
        })
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return allDates
  }, [filteredData, timeRange])

  return (
    <Card className="@container/card">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            <CardDescription className="mt-1.5">
              <span className="hidden @[540px]/card:block">
                {finalDescription}
              </span>
              <span className="@[540px]/card:hidden">{descriptionShort}</span>
            </CardDescription>
          </div>
          <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
          </CardAction>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {/* Chart */}
        {filteredData.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">No data available</p>
              <p className="mt-1 text-xs text-muted-foreground">Visit data will appear here once visitors start coming to your site</p>
            </div>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[320px] w-full"
          >
            <AreaChart 
              data={chartDataWithDateRange}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
            <defs>
              <linearGradient id="fillVisits" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-visits)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-visits)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id={`fill${metricKey.charAt(0).toUpperCase() + metricKey.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={`var(--color-${metricKey})`}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={`var(--color-${metricKey})`}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/30" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                // Format based on time range
                if (timeRange === "7d") {
                  return date.toLocaleDateString("en-US", {
                    weekday: "short",
                    day: "numeric",
                  })
                } else if (timeRange === "30d") {
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                } else {
                  // 90 days - show month and day, but fewer ticks
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              }}
              interval={timeRange === "7d" ? 0 : timeRange === "30d" ? 2 : 7}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={50}
              domain={[0, 'auto']}
              allowDecimals={false}
              tickFormatter={(value) => {
                if (value === 0) return '0'
                if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
                return value.toString()
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="visits"
              type="natural"
              fill="url(#fillVisits)"
              stroke="var(--color-visits)"
              strokeWidth={2.5}
              dot={{ fill: "var(--color-visits)", r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "hsl(var(--background))" }}
            />
            {(!isRetail && totalBookings > 0) || (isRetail && totalSales > 0) ? (
              <Area
                dataKey={metricKey}
                type="natural"
                fill={`url(#fill${metricKey.charAt(0).toUpperCase() + metricKey.slice(1)})`}
                stroke={`var(--color-${metricKey})`}
                strokeWidth={2.5}
                dot={{ fill: `var(--color-${metricKey})`, r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: "hsl(var(--background))" }}
              />
            ) : null}
          </AreaChart>
        </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

