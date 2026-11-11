import type { ComponentType, ReactNode } from "react"
import { ChevronRight } from "lucide-react"
import { ProjectMark } from "@/components/app/project-mark"
import { CountBadge } from "@/components/app/count-badge"
import { MarkIcon } from "@/components/app/status-badge"
import { ThreadChip } from "@/app/hifi-kit"
import { useHifi } from "@/lib/hifi"
import type { Mark } from "@/lib/marks"
import { cn } from "@/lib/utils"

// The pieces both desktop overlays share (the Desk's pill and the scenario pill), so they follow the design system.
// High-fi: the overlay is the rail's gray layer with paper rows on it (index.css "High-fi overlay"), the logo
// placeholder from the rail, project mark › thread chip, Suggested chips, and the painted count badge.
// The wireframe keeps its plain look.

// The logo placeholder, same as the rail's (the mark is still to be decided). Wireframe: the "Y".
export function OverlayLogo({ onClick }: { onClick?: () => void }) {
  const hifi = useHifi()
  const mark = hifi
    ? <span aria-hidden className="block size-6 rounded-lg border-[1.5px] border-foreground" />
    : <span aria-hidden className="text-sm font-semibold tracking-tight">Y</span>
  if (!onClick) return <span className="shrink-0" aria-label="Whyspace">{mark}</span>
  return (
    <button type="button" onClick={onClick} title="Open Whyspace" aria-label="Open Whyspace" className="shrink-0 rounded-sm px-0.5 outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring">
      {mark}
    </button>
  )
}

// Where the overlay saves: the project's mark and name, then the thread (High-fi: its chip in its pigment).
export function OverlayWhere({ project, name, part }: { project: string; name?: string; part: string }) {
  const hifi = useHifi()
  return (
    <>
      <ProjectMark project={project} className="size-4" />
      <span className="truncate font-medium">{name}</span>
      {hifi
        ? <><ChevronRight className="size-3.5 shrink-0 text-muted-foreground opacity-60" aria-hidden /><ThreadChip projectId={project} part={part} className="text-muted-foreground" /></>
        : <><span className="text-muted-foreground">/</span><span className="truncate text-muted-foreground">{part}</span></>}
    </>
  )
}

// What waits in the folded pill: the most urgent mark and how many. High-fi: the mark beside the painted count.
// Wireframe: the big wire mark with the number inside.
export function OverlayCount({ top, n }: { top: Mark; n: number }) {
  const hifi = useHifi()
  const label = <span className="sr-only"> waiting, most urgent: {top === "triangle" ? "a clash" : "a guess"}</span>
  if (hifi) {
    return (
      <span role="status" className="flex flex-col items-center gap-1.5 [[data-edge=h]_&]:flex-row">
        <MarkIcon mark={top} className="size-4" />
        <CountBadge n={n} />
        {label}
      </span>
    )
  }
  return (
    <span role="status" className="relative grid size-8 place-items-center">
      <MarkIcon mark={top} look="wire" className={cn("absolute inset-0 size-8", top === "empty" && "[&>span]:size-full [&>span]:border-[1.25px]", top === "triangle" && "text-foreground/15")} />
      {top === "triangle" && <svg aria-hidden viewBox="0 0 16 16" className="absolute inset-0 size-8 fill-none stroke-foreground" strokeWidth={0.9}><path d="M8 3 L13.2 12.8 H2.8 Z" strokeLinejoin="round" /></svg>}
      <span className={cn("relative text-[11px] leading-none font-semibold tabular-nums", top === "triangle" && "translate-y-[3px]")}>{n}</span>
      {label}
    </span>
  )
}

// A small action in a row: one of your words as a chip, Take theirs, Keep mine, or "Why…".
// High-fi: the Suggested chips from Needs you (soft, an icon, the first one tinted Forest). Wireframe: the outlined pill.
export function OverlayAct({ primary, muted, icon: Icon, onClick, children }: {
  primary?: boolean
  muted?: boolean
  icon?: ComponentType<{ className?: string }>
  onClick: () => void
  children: ReactNode
}) {
  const hifi = useHifi()
  if (hifi) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex h-7 max-w-full items-center gap-1.5 rounded-[var(--hifi-button-radius,0.5rem)] border px-2.5 text-xs transition-colors",
          primary ? "border-primary/25 bg-primary/[0.07] text-primary hover:bg-primary/[0.12]" : muted ? "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground" : "border-border bg-card text-foreground hover:bg-muted",
        )}
      >
        {Icon && <Icon className="size-3.5 shrink-0" />}
        <span className="truncate">{children}</span>
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "max-w-full truncate rounded-full border px-2 py-0.5 text-[11px] leading-4 transition-colors",
        primary ? "border-foreground bg-foreground text-background hover:bg-foreground/90" : muted ? "border-dashed text-muted-foreground hover:border-foreground hover:text-foreground" : "hover:border-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}
