import type * as React from "react"
import { cn } from "cn"

/**
 * Coss.com/ui-inspired recessed outer tray + inner elevated surface architecture.
 * Provides tactile two-layer physical separation without heavy drop shadows.
 */
function CardFrame({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-frame"
      className={cn(
        "relative flex flex-col rounded-2xl bg-muted/65 p-1 ring-1 ring-border/80 dark:bg-muted/35 dark:ring-white/[0.07]",
        className
      )}
      {...props}
    />
  )
}

function CardFrameHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-frame-header"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-3.5 py-2",
        className
      )}
      {...props}
    />
  )
}

function CardFrameTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-frame-title"
      className={cn(
        "text-xs font-medium text-foreground/85 flex items-center gap-2",
        className
      )}
      {...props}
    />
  )
}

function CardFrameDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-frame-description"
      className={cn("text-xs text-muted-foreground tabular-nums", className)}
      {...props}
    />
  )
}

function CardFramePanel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-frame-panel"
      className={cn(
        "relative flex-1 overflow-hidden rounded-[calc(var(--radius-2xl)-4px)] bg-card text-card-foreground ring-1 ring-foreground/[0.07] shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.8)] dark:ring-white/[0.08] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)]",
        className
      )}
      {...props}
    />
  )
}

function CardFrameFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-frame-footer"
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 text-xs text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  CardFrame,
  CardFrameHeader,
  CardFrameTitle,
  CardFrameDescription,
  CardFramePanel,
  CardFrameFooter,
}
