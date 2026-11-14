import type { ComponentType, ReactNode } from "react"
import { AudioLines, ChevronRight } from "lucide-react"
import { ProjectMark } from "@/components/app/project-mark"
import { WhyspaceMark } from "@/components/brand/logo"
import { MarkIcon } from "@/components/app/status-badge"
import { ThreadChip } from "@/app/hifi-kit"
import { useHifi } from "@/lib/hifi"
import { cn } from "@/lib/utils"

// The pieces both desktop overlays share (the Desk's pill and the scenario pill), so they follow the design system.
// High-fi: the overlay is the rail's gray layer with paper rows on it (index.css "High-fi overlay"), the logo
// mark from the rail, project mark › thread chip, Suggested chips, and the painted count badge.
// The wireframe keeps its plain look.

// The Whyspace mark, same as the rail's: the bare forest mark.
export function OverlayLogo({ onClick }: { onClick?: () => void }) {
  const hifi = useHifi()
  const mark = <WhyspaceMark title={null} className={hifi ? "w-[22px]" : "w-5"} />
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

// The folded pill (Keller, Nov 13): upright on a side edge, sideways on the top or bottom. Its parts, in order:
// the project's mark (where your decisions save); how many decisions it captured this session, as a plain
// number; while a clash waits, the alert symbol in place of that number until the clash is cleared; and while
// a live session records, a third part, the voice wave.
// Working in more than one project at once (Claude in Whiskr, Figma in Recall), the marks stack, the project
// of the app in front on top, each with a ring in the pill's color so the overlap reads; past two, "+1".
// The number counts every project's decisions.
export function OverlayFold({ project, projects, captured, alert, live }: { project: string; projects?: string[]; captured: number; alert?: string; live?: boolean }) {
  const all = [project, ...(projects ?? []).filter((p) => p !== project)]
  const shown = all.slice(0, 2)
  const extra = all.length - shown.length
  const label = alert ? `Clash: ${alert}` : `${captured} decision${captured === 1 ? "" : "s"} captured this session${all.length > 1 ? `, in ${all.length} projects` : ""}`
  return (
    <>
      {all.length > 1 ? (
        <span className="flex flex-col items-center [[data-edge=h]_&]:flex-row" aria-label={`${all.length} projects`}>
          {shown.map((p, i) => (
            <span key={p} style={{ zIndex: shown.length - i }} className={cn("relative grid size-8 place-items-center rounded-[10px] bg-background shadow-[0_0_0_2px_var(--badge-cut,var(--background))]", i > 0 && "-mt-1.5 [[data-edge=h]_&]:mt-0 [[data-edge=h]_&]:-ml-1.5")}>
              <ProjectMark project={p} className="size-[22px] rounded-md" />
            </span>
          ))}
          {extra > 0 && (
            <span className="relative -mt-1.5 grid size-8 place-items-center rounded-[10px] bg-muted text-[11px] font-semibold text-muted-foreground tabular-nums shadow-[0_0_0_2px_var(--badge-cut,var(--background))] [[data-edge=h]_&]:mt-0 [[data-edge=h]_&]:-ml-1.5">+{extra}</span>
          )}
        </span>
      ) : (
        <ProjectMark project={project} className="size-7 shrink-0 rounded-md" />
      )}
      <span role="status" title={label} className="grid size-6 shrink-0 place-items-center">
        {alert
          ? <MarkIcon mark="triangle" className="size-4" />
          : <span className="text-sm leading-none font-semibold tabular-nums">{captured}</span>}
        <span className="sr-only">{label}</span>
      </span>
      {live && (
        <span role="status" className="grid size-6 shrink-0 place-items-center">
          <AudioLines className="size-4" />
          <span className="sr-only">Live session on</span>
        </span>
      )}
    </>
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
