"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Widget({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="widget"
      className={cn(
        "bg-muted/30 text-foreground flex flex-col gap-4 rounded-xl border border-dashed border-border/70 p-6 shadow-xs backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
}

function WidgetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="widget-header"
      className={cn(
        "@container/widget-header grid auto-rows-min gap-1.5 has-data-[slot=widget-action]:grid-cols-[1fr_auto]",
        className
      )}
      {...props}
    />
  )
}

function WidgetTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="widget-title"
      className={cn("text-lg font-semibold leading-tight", className)}
      {...props}
    />
  )
}

function WidgetDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="widget-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function WidgetAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="widget-action"
      className={cn("col-start-2 row-span-2 row-start-1 justify-self-end", className)}
      {...props}
    />
  )
}

function WidgetContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="widget-content"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  )
}

export {
  Widget,
  WidgetHeader,
  WidgetTitle,
  WidgetDescription,
  WidgetAction,
  WidgetContent,
}


