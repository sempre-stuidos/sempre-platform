"use client"

import * as React from "react"
import { IconDownload, IconPrinter } from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Report } from "@/lib/reports"
import { Badge } from "@/components/ui/badge"

interface ReportPreviewDialogProps {
  report: Report
  children: React.ReactNode
}

export function ReportPreviewDialog({ report, children }: ReportPreviewDialogProps) {
  const [open, setOpen] = React.useState(false)

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateShort = (dateString: string | null | undefined) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleDownloadPDF = () => {
    // Use browser's print functionality to save as PDF
    window.print()
  }

  const handlePrint = () => {
    window.print()
  }

  // Extract report content from metadata
  const reportContent: Record<string, unknown> = (report.metadata || {}) as Record<string, unknown>
  const hasAnalytics = reportContent.analytics !== undefined
  const hasReservations = reportContent.reservations !== undefined
  const hasMenuStats = reportContent.menu_stats !== undefined
  const hasGalleryStats = reportContent.gallery_stats !== undefined
  const hasPerformance = reportContent.performance !== undefined
  const hasEvents = reportContent.events !== undefined

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-none">
        <DialogHeader>
          <DialogTitle>{report.title}</DialogTitle>
          <DialogDescription>
            Report generated on {formatDate(report.generated_at)}
          </DialogDescription>
        </DialogHeader>

        {/* Action buttons - hidden when printing */}
        <div className="flex gap-2 print:hidden">
          <Button onClick={handleDownloadPDF} variant="outline" size="sm">
            <IconDownload className="mr-2 h-4 w-4" />
            Download as PDF
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm">
            <IconPrinter className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>

        {/* Report Content - Print-friendly */}
        <div className="space-y-6 print:space-y-4" id="report-content">
          {/* Report Header */}
          <div className="space-y-2 print:mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{report.type}</Badge>
              <Badge variant={report.status === "Generated" ? "default" : "secondary"}>
                {report.status}
              </Badge>
            </div>
            {report.period_start && report.period_end && (
              <p className="text-sm text-muted-foreground">
                Period: {formatDateShort(report.period_start)} - {formatDateShort(report.period_end)}
              </p>
            )}
          </div>

          <div className="my-4 h-px bg-border" />

          {/* Analytics Section */}
          {hasAnalytics && reportContent.analytics !== undefined ? (
            <div className="space-y-3 print:break-inside-avoid">
              <h2 className="text-xl font-semibold">Analytics</h2>
              {typeof reportContent.analytics === "object" && reportContent.analytics !== null ? (
                <div className="space-y-2 text-sm">
                  {Object.entries(reportContent.analytics as Record<string, unknown>).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}:
                      </span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>{String(reportContent.analytics)}</p>
              )}
            </div>
          ) : null}

          {/* Reservations Section */}
          {hasReservations && reportContent.reservations !== undefined ? (
            <div className="space-y-3 print:break-inside-avoid">
              <h2 className="text-xl font-semibold">Reservations</h2>
              {typeof reportContent.reservations === "object" && reportContent.reservations !== null ? (
                <div className="space-y-2 text-sm">
                  {Object.entries(reportContent.reservations as Record<string, unknown>).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}:
                      </span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>{String(reportContent.reservations)}</p>
              )}
            </div>
          ) : null}

          {/* Menu Stats Section */}
          {hasMenuStats && reportContent.menu_stats !== undefined ? (
            <div className="space-y-3 print:break-inside-avoid">
              <h2 className="text-xl font-semibold">Menu Statistics</h2>
              {typeof reportContent.menu_stats === "object" && reportContent.menu_stats !== null ? (
                <div className="space-y-2 text-sm">
                  {Object.entries(reportContent.menu_stats as Record<string, unknown>).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}:
                      </span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>{String(reportContent.menu_stats)}</p>
              )}
            </div>
          ) : null}

          {/* Gallery Stats Section */}
          {hasGalleryStats && reportContent.gallery_stats !== undefined ? (
            <div className="space-y-3 print:break-inside-avoid">
              <h2 className="text-xl font-semibold">Gallery Statistics</h2>
              {typeof reportContent.gallery_stats === "object" && reportContent.gallery_stats !== null ? (
                <div className="space-y-2 text-sm">
                  {Object.entries(reportContent.gallery_stats as Record<string, unknown>).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}:
                      </span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>{String(reportContent.gallery_stats)}</p>
              )}
            </div>
          ) : null}

          {/* Performance Section */}
          {hasPerformance && reportContent.performance !== undefined ? (
            <div className="space-y-3 print:break-inside-avoid">
              <h2 className="text-xl font-semibold">Performance Metrics</h2>
              {typeof reportContent.performance === "object" && reportContent.performance !== null ? (
                <div className="space-y-2 text-sm">
                  {Object.entries(reportContent.performance as Record<string, unknown>).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}:
                      </span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>{String(reportContent.performance)}</p>
              )}
            </div>
          ) : null}

          {/* Events Section */}
          {hasEvents && reportContent.events !== undefined ? (
            <div className="space-y-3 print:break-inside-avoid">
              <h2 className="text-xl font-semibold">Events</h2>
              {typeof reportContent.events === "object" && reportContent.events !== null ? (
                <div className="space-y-2 text-sm">
                  {Object.entries(reportContent.events as Record<string, unknown>).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}:
                      </span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>{String(reportContent.events)}</p>
              )}
            </div>
          ) : null}

          {/* Empty state if no content */}
          {!hasAnalytics && !hasReservations && !hasMenuStats && !hasGalleryStats && !hasPerformance && !hasEvents ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No report content available.</p>
            </div>
          ) : null}
        </div>
      </DialogContent>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report-content,
          #report-content * {
            visibility: visible;
          }
          #report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </Dialog>
  )
}

