import type * as React from "react"
import { cn } from "cn"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { AgendaEventKind, Priority, Stage } from "@/types/application"

const stageStyles: Record<
  Stage,
  { badge: string; dot: string }
> = {
  Discovered: {
    badge:
      "border-zinc-200 bg-zinc-100/80 text-zinc-700 dark:border-zinc-700/70 dark:bg-zinc-800/60 dark:text-zinc-300",
    dot: "bg-zinc-400 dark:bg-zinc-400",
  },
  Saved: {
    badge:
      "border-zinc-200 bg-zinc-100/80 text-zinc-700 dark:border-zinc-700/70 dark:bg-zinc-800/60 dark:text-zinc-300",
    dot: "bg-zinc-500 dark:bg-zinc-400",
  },
  Applied: {
    badge:
      "border-blue-200/90 bg-blue-50/90 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300",
    dot: "bg-blue-500 dark:bg-blue-400",
  },
  "Recruiter Contacted": {
    badge:
      "border-violet-200/90 bg-violet-50/90 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300",
    dot: "bg-violet-500 dark:bg-violet-400",
  },
  Screening: {
    badge:
      "border-purple-200/90 bg-purple-50/90 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/15 dark:text-purple-300",
    dot: "bg-purple-500 dark:bg-purple-400",
  },
  "Technical Interview": {
    badge:
      "border-amber-200/90 bg-amber-50/90 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
    dot: "bg-amber-500 dark:bg-amber-400",
  },
  "Final Interview": {
    badge:
      "border-orange-200/90 bg-orange-50/90 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300",
    dot: "bg-orange-500 dark:bg-orange-400",
  },
  Offer: {
    badge:
      "border-emerald-200/90 bg-emerald-50/90 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
    dot: "bg-emerald-500 dark:bg-emerald-400",
  },
  Rejected: {
    badge:
      "border-rose-200/90 bg-rose-50/90 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300",
    dot: "bg-rose-500 dark:bg-rose-400",
  },
  Withdrawn: {
    badge:
      "border-zinc-200 bg-zinc-100/70 text-zinc-600 dark:border-zinc-700/60 dark:bg-zinc-800/50 dark:text-zinc-400",
    dot: "bg-zinc-400 dark:bg-zinc-500",
  },
  Ghosted: {
    badge:
      "border-dashed border-zinc-300 bg-zinc-100/50 text-zinc-600 dark:border-zinc-600/80 dark:bg-zinc-800/40 dark:text-zinc-400",
    dot: "bg-zinc-400 dark:bg-zinc-500",
  },
}

export function StageDot({
  stage,
  className,
}: {
  stage: Stage
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-1.5 shrink-0 rounded-full",
        stageStyles[stage].dot,
        className
      )}
    />
  )
}

export function StageBadge({
  stage,
  className,
}: {
  stage: Stage
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5.5 gap-1.5 rounded-md px-2 text-xs font-medium",
        stageStyles[stage].badge,
        className
      )}
    >
      <StageDot stage={stage} />
      {stage}
    </Badge>
  )
}

export function StageSelectTone({
  stage,
  children,
}: {
  stage: Stage
  children: React.ReactNode
}) {
  return (
    <div className={cn("inline-flex rounded-lg", stageStyles[stage].badge)}>
      {children}
    </div>
  )
}

const priorityStyles: Record<Priority, string> = {
  High: "border-rose-200/90 bg-rose-50/90 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300",
  Medium:
    "border-amber-200/90 bg-amber-50/90 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
  Low: "border-zinc-200 bg-zinc-100/80 text-zinc-600 dark:border-zinc-700/70 dark:bg-zinc-800/60 dark:text-zinc-400",
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority?: Priority
  className?: string
}) {
  if (!priority) return null
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 rounded-md px-1.5 text-xs font-medium",
        priorityStyles[priority],
        className
      )}
    >
      {priority}
    </Badge>
  )
}

const eventKindStyles: Record<
  AgendaEventKind,
  { label: string; badge: string; dot: string }
> = {
  "application-deadline": {
    label: "Application deadline",
    badge:
      "border-amber-200/90 bg-amber-50/90 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  "follow-up": {
    label: "Follow-up",
    badge:
      "border-blue-200/90 bg-blue-50/90 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  interview: {
    label: "Interview round",
    badge:
      "border-violet-200/90 bg-violet-50/90 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  assessment: {
    label: "Assessment due",
    badge:
      "border-orange-200/90 bg-orange-50/90 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  "referral-follow-up": {
    label: "Referral follow-up",
    badge:
      "border-zinc-200 bg-zinc-100/80 text-zinc-700 dark:border-zinc-700/70 dark:bg-zinc-800/60 dark:text-zinc-300",
    dot: "bg-zinc-500",
  },
  "offer-deadline": {
    label: "Offer decision",
    badge:
      "border-emerald-200/90 bg-emerald-50/90 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
}

export function AgendaKindBadge({ kind }: { kind: AgendaEventKind }) {
  const style = eventKindStyles[kind]
  return (
    <Badge
      variant="outline"
      className={cn("h-5.5 gap-1.5 rounded-md px-2 text-xs font-medium", style.badge)}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} />
      {style.label}
    </Badge>
  )
}

const avatarTones = [
  "bg-blue-500/12 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-amber-500/12 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-violet-500/12 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "bg-rose-500/12 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  "bg-cyan-500/12 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300",
]

export function CompanyAvatar({
  company,
  size = "default",
  className,
}: {
  company?: string
  size?: "sm" | "default" | "lg"
  className?: string
}) {
  const clean = (company || "?").trim()
  let hash = 0
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0
  }
  const tone = avatarTones[hash % avatarTones.length]
  const initials = clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2)

  return (
    <Avatar
      size={size}
      className={cn("rounded-lg after:rounded-lg", className)}
    >
      <AvatarFallback
        className={cn("rounded-lg font-semibold tracking-tight", tone)}
      >
        {initials || "?"}
      </AvatarFallback>
    </Avatar>
  )
}
