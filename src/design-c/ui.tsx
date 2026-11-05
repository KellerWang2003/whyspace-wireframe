import type { ReactNode } from "react"
import { FileText, GitPullRequest, Hash, Notebook, PenTool, Table2, Video, type LucideIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { PEOPLE_C, PROJECTS_C, THREADS_C, WHERE_LABEL, type Where } from "./data"
import { MARK, type EffState, type Mark } from "./model"

// The four marks. Same size everywhere so a row of them reads as one word.
export function Dot({ state, mark, className }: { state?: EffState; mark?: Mark; className?: string }) {
  const m = mark ?? MARK[state ?? "guess"]
  if (m === "triangle") {
    return (
      <svg aria-hidden viewBox="0 0 10 10" className={cn("size-2.5 shrink-0 fill-foreground", className)}>
        <path d="M5 0.6 L9.6 9.2 H0.4 Z" />
      </svg>
    )
  }
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-2.5 shrink-0 items-center justify-center rounded-full",
        m === "filled" && "bg-foreground",
        m === "ringed" && "border border-foreground",
        m === "empty" && "border border-muted-foreground/70",
        className,
      )}
    >
      {m === "ringed" && <span className="size-1 rounded-full bg-foreground" />}
    </span>
  )
}

// A handoff's calls as one row of marks.
export function Dots({ states, className }: { states: EffState[]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {states.map((s, i) => <Dot key={i} state={s} />)}
    </span>
  )
}

export function Count({ backed, total, className }: { backed: number; total: number; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{backed} of {total} backed</span>
}

// People are a face with one letter. A person's agent is the same face, dashed.
export function Face({ id, className, ring, agent }: { id: string; className?: string; ring?: boolean; agent?: boolean }) {
  const p = PEOPLE_C[id]
  return (
    <Avatar className={cn("size-6", ring && "ring-2 ring-background", className)}>
      <AvatarFallback className={cn("text-[11px] font-medium text-foreground", agent ? "border border-dashed border-foreground/60 bg-background" : "bg-muted")}>{(p?.name ?? id)[0]}</AvatarFallback>
    </Avatar>
  )
}

// Who read or built on something: people and agents, as one row of faces.
export function Readers({ readers, className, size = "size-5" }: { readers: { who: string; agent?: boolean }[]; className?: string; size?: string }) {
  return (
    <span className={cn("inline-flex -space-x-1.5", className)}>
      {readers.map((r, i) => <Face key={`${r.who}-${r.agent ? "a" : "p"}-${i}`} id={r.who} agent={r.agent} ring className={size} />)}
    </span>
  )
}

export function Faces({ ids, max = 5, className, size = "size-6" }: { ids: string[]; max?: number; className?: string; size?: string }) {
  const extra = ids.length - max
  return (
    <span className={cn("inline-flex -space-x-1.5", className)}>
      {ids.slice(0, max).map((id) => <Face key={id} id={id} ring className={size} />)}
      {extra > 0 && (
        <Avatar className={cn(size, "ring-2 ring-background")}>
          <AvatarFallback className="bg-muted text-[10px]">+{extra}</AvatarFallback>
        </Avatar>
      )}
    </span>
  )
}

// A person's own AI, named after their face where it did the work.
export function Agent({ id, className }: { id: string; className?: string }) {
  const p = PEOPLE_C[id]
  return <span className={cn("text-muted-foreground", className)}>{p?.name}’s {p?.ai.split(",")[0]}</span>
}

const WHERE_ICON: Record<Where, LucideIcon> = { docs: FileText, sheets: Table2, figma: PenTool, slack: Hash, github: GitPullRequest, notion: Notebook, meet: Video }

export function WhereLabel({ where, detail, className }: { where: Where; detail?: string; className?: string }) {
  const Icon = WHERE_ICON[where]
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5 text-muted-foreground", className)}>
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{detail ?? WHERE_LABEL[where]}</span>
    </span>
  )
}

export function ThreadDotC({ thread, className }: { thread: string; className?: string }) {
  const t = THREADS_C.find((x) => x.id === thread)
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", className)} style={{ backgroundColor: t?.color ?? "#999" }} />
}

export function ThreadTagC({ thread, className }: { thread: string; className?: string }) {
  const t = THREADS_C.find((x) => x.id === thread)
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <ThreadDotC thread={thread} />
      <span className="truncate">{t?.name ?? thread}</span>
    </span>
  )
}

// A project's mark in the rail: its first letter.
export function MarkC({ project, className }: { project: string; className?: string }) {
  const p = PROJECTS_C.find((x) => x.id === project)
  const first = PROJECTS_C[0]?.id === project
  return (
    <span className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-[5px] text-[11px] font-semibold", first ? "bg-foreground text-background" : "border border-foreground/40 bg-background text-foreground", className)}>
      {(p?.name ?? project)[0]}
    </span>
  )
}

// A why, in the person's words: quiet, after the call.
export function Why({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("text-muted-foreground", className)}>{children}</span>
}

// A lane title on Today and the project page.
export function Lane({ title, count, children, className }: { title: string; count?: number; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <h2 className="flex items-baseline gap-2 type-section text-muted-foreground">
        {title}
        {count !== undefined && count > 0 && <span className="text-xs font-normal tabular-nums">{count}</span>}
      </h2>
      {children}
    </section>
  )
}
