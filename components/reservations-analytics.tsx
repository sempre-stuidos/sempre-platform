"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const bookingConversionData = [
  { stage: "Visits", conversion: 0.12 },
  { stage: "Availability Search", conversion: 0.34 },
  { stage: "Booking Started", conversion: 0.51 },
  { stage: "Confirmed", conversion: 0.72 },
];

const bookingChartConfig = {
  conversion: {
    label: "Conversion",
    color: "#d1ff75",
  },
} satisfies ChartConfig;

const topPagesTableData = [
  {
    page: "/reservations",
    visitors: 1860,
    bookings: 340,
    conversionRate: 0.183,
  },
  {
    page: "/private-events",
    visitors: 1024,
    bookings: 210,
    conversionRate: 0.205,
  },
  {
    page: "/chef-tasting",
    visitors: 865,
    bookings: 188,
    conversionRate: 0.217,
  },
  {
    page: "/seasonal-menu",
    visitors: 742,
    bookings: 146,
    conversionRate: 0.197,
  },
];

const deviceSourcesData = [
  { device: "Desktop", visitors: 2154 },
  { device: "Mobile", visitors: 1836 },
  { device: "Tablet", visitors: 624 },
  { device: "Kiosk", visitors: 212 },
];

const deviceChartConfig = {
  visitors: {
    label: "Visitors",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

interface ReservationsAnalyticsDashboardProps {
  organizationName?: string;
}

export function ReservationsAnalyticsDashboard({
  organizationName,
}: ReservationsAnalyticsDashboardProps) {
  const bookingDescription = organizationName
    ? `Funnel completion rates for ${organizationName} (sample data).`
    : "Funnel completion rates for the sample reservation flow.";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
        <Card className="@container/card">
          <CardHeader>
            <CardTitle>Booking conversion</CardTitle>
            <CardDescription>{bookingDescription}</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer
              config={bookingChartConfig}
              className="aspect-auto h-[320px] w-full"
            >
              <BarChart data={bookingConversionData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="stage"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                />
                <YAxis
                  tickFormatter={(value) => `${Math.round(value * 100)}%`}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <ChartTooltip
                  cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                  content={
                    <ChartTooltipContent
                      formatter={(value: number) => [
                        `${(value * 100).toFixed(0)}%`,
                        bookingChartConfig.conversion.label,
                      ]}
                    />
                  }
                />
                <Bar
                  dataKey="conversion"
                  radius={[6, 6, 0, 0]}
                  fill="rgba(209, 255, 117, 0.75)"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardTitle>Device sources</CardTitle>
            <CardDescription>
              Distribution of reservation traffic by device category.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer
              config={deviceChartConfig}
              className="aspect-auto h-[320px] w-full"
            >
              <BarChart
                data={deviceSourcesData}
                layout="vertical"
                barSize={18}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="device"
                  width={120}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                  content={
                    <ChartTooltipContent
                      formatter={(value: number) => [
                        value.toLocaleString(),
                        deviceChartConfig.visitors.label,
                      ]}
                    />
                  }
                />
                <Bar
                  dataKey="visitors"
                  radius={[0, 6, 6, 0]}
                  fill="var(--color-visitors)"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Top-performing pages</h2>
          <p className="text-muted-foreground text-sm">
            Sample snapshot of the most engaged reservation landing pages.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead className="text-right">Visitors</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
                <TableHead className="text-right">Conversion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {topPagesTableData.map((row) => (
                <TableRow key={row.page} className="hover:bg-muted/40">
                  <TableCell className="font-medium">{row.page}</TableCell>
                  <TableCell className="text-right">
                    {row.visitors.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.bookings.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {(row.conversionRate * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}



