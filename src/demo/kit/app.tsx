import type { ReactNode } from "react"
import { ArrowUpRight, Blend, CalendarDays, Check, Copy, LayoutGrid, Plus, Search, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WorkspaceMark } from "@/components/app/app-sidebar"
import { PersonAvatar } from "@/components/app/person"
import { ProjectMark } from "@/components/app/project-mark"
import { ToolLogo } from "@/components/app/tool-logo"
import { cn } from "@/lib/utils"
import { useCopy } from "./hooks"

// The Whyspace app pieces the scenarios share: the rail, Today's lanes and rows, the task peek and
// the tester's card. Same look as the real app; each scenario brings its own data.

export type Viewer = { id: string; name: string }
export type ProjectRef = { id: string; name: string }

export function YMark({ className }: { className?: string }) {
  return <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground font-serif text-[11px] text-background", className)} aria-label="Whyspace">Y</span>
}

export function Rail({ viewer, projects, active, badge, onNav }: { viewer: Viewer; projects: ProjectRef[]; active: string; badge?: number; onNav?: (key: string) => void }) {
  const go = (key: string) => () => onNav?.(key)
  return (
    <nav aria-label="Rail" className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-sidebar-border bg-sidebar py-2 text-sidebar-foreground">
      <RailButton label="Search" onClick={go("search")}><Search className="size-4" /></RailButton>
      <RailButton label="Today" active={active === "today"} badge={badge} onClick={go("today")}><Sun className="size-4" /></RailButton>
      <RailButton label="Duet" active={active === "duet"} onClick={go("duet")}><Blend className="size-4" /></RailButton>
      <RailButton label="Projects" active={active === "projects"} onClick={go("projects")}><LayoutGrid className="size-4" /></RailButton>
      <div className="my-1 h-px w-6 shrink-0 bg-sidebar-border" />
      {projects.map((p) => (
        <RailButton key={p.id} label={p.name} active={active === p.id} onClick={go(p.id)}><ProjectMark project={p.id} className="size-6" /></RailButton>
      ))}
      <RailButton label="New project"><Plus className="size-4 text-muted-foreground" /></RailButton>
      <div className="mt-auto flex size-9 items-center justify-center"><WorkspaceMark name={viewer.name} className="size-7 text-sm" /></div>
    </nav>
  )
}

function RailButton({ label, active, badge, onClick, children }: { label: string; active?: boolean; badge?: number; onClick?: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} aria-current={active ? "page" : undefined} onClick={onClick} className={cn("relative flex size-9 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring", active && "bg-sidebar-accent")}>
      {active && <span aria-hidden className="absolute top-2 -left-1.5 h-5 w-1 rounded-r-full bg-foreground" />}
      {children}
      {badge ? <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] text-background tabular-nums">{badge}</span> : null}
    </button>
  )
}

// A page: the scrolling column, with an optional column on the right at xl.
export function Page({ title, label, actions, aside, children }: { title: string; label?: string; actions?: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col xl:flex-row">
      <div className="min-w-0 flex-1 xl:overflow-y-auto">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 p-6 sm:p-8">
          <header className="flex items-baseline gap-3">
            <h1 className="type-title">{title}</h1>
            {label && <span className="text-sm text-muted-foreground">{label}</span>}
            {actions && <span className="ml-auto flex items-center gap-2">{actions}</span>}
          </header>
          {children}
        </div>
      </div>
      {aside}
    </div>
  )
}

export function Lane({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <div className="flex h-8 items-center gap-2">
        <h2 className="type-section">{title}</h2>
        {count !== undefined && count > 0 && <span className="text-sm text-muted-foreground tabular-nums">{count}</span>}
      </div>
      {children}
    </section>
  )
}

export function NeedsRow({ face, lead, title, mark, sub, actions, onOpen }: { face: ReactNode; lead: string; title: string; mark?: ReactNode; sub: ReactNode; actions?: ReactNode; onOpen?: () => void }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      {face}
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-2 text-sm">
          {mark}
          <span className="shrink-0 text-muted-foreground">{lead}</span>
          <span className={cn("min-w-0 truncate font-medium", onOpen && "hover:underline")}>{title}</span>
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">{sub}</span>
      </button>
      {actions && <span className="flex shrink-0 items-center gap-1.5">{actions}</span>}
    </li>
  )
}

export function Where({ thread }: { thread?: string }) {
  return (
    <>
      <span aria-hidden>·</span>
      <span className="truncate">Whiskr</span>
      {thread && <><span aria-hidden>·</span><span className="inline-flex shrink-0 items-center gap-1.5"><span className="size-1.5 rounded-full bg-foreground" aria-hidden />{thread}</span></>}
    </>
  )
}

export function Recap({ project, name, summary, onOpen }: { project: string; name: string; summary: string; onOpen?: () => void }) {
  const inner = (
    <>
      <ProjectMark project={project} className="size-7 rounded-md" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name}</span>
        <span className="block truncate text-xs text-muted-foreground">{summary}</span>
      </span>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
    </>
  )
  return (
    <li>
      {onOpen ? (
        <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted/60">{inner}</button>
      ) : (
        <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left">{inner}</div>
      )}
    </li>
  )
}

export type HandledLine = { id: string; text: string; when: string; who: string; agent?: boolean }

export function HandledList({ lines }: { lines: HandledLine[] }) {
  return (
    <ul className="flex flex-col">{lines.map((l) => (
      <li key={l.id} className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm">
        <PersonAvatar id={l.who} agent={l.agent} className="size-5" />
        <span className="min-w-0 flex-1 truncate">{l.text}</span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{l.when}</span>
      </li>
    ))}</ul>
  )
}

export type Upcoming = [string, [string, string, string][]][]
const PROJECT_NAME: Record<string, string> = { whiskr: "Whiskr", studio: "AI Studio · Recall", holiday: "Holiday campaign", panel: "Cat owner panel", android: "Android app" }

export function ComingUp({ days }: { days: Upcoming }) {
  return (
    <section className="flex shrink-0 flex-col gap-3 border-t p-6 sm:p-8 xl:w-80 xl:overflow-y-auto xl:border-t-0 xl:border-l xl:px-6">
      <div className="flex h-8 items-center justify-between">
        <h2 className="type-section">Coming up</h2>
        <span className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />Calendar</span>
      </div>
      {days.map(([day, events]) => (
        <div key={day} className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">{day}</p>
          {events.map(([time, title, project]) => (
            <div key={title} className="flex gap-3 rounded-md px-2 py-1.5 text-sm">
              <span className="w-10 shrink-0 text-muted-foreground tabular-nums">{time}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{title}</span>
                <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"><ProjectMark project={project} /><span className="truncate">{PROJECT_NAME[project] ?? project}</span></span>
              </span>
            </div>
          ))}
        </div>
      ))}
    </section>
  )
}

// The task, as a centered peek: what it is, what it came from, and how to start it in a tool.
export function TaskDialog({ open, onOpenChange, title, description, before, tiles, tool, prompt, onOpenTool, props }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description: string
  // Blocks above the related tiles, for a task Whyspace made from a decision.
  before?: ReactNode
  tiles: ReactNode
  tool: string
  prompt: string
  onOpenTool: () => void
  props: ReactNode
}) {
  const [copied, copy] = useCopy(prompt)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[80vh] max-w-4xl gap-0 overflow-hidden p-0 sm:max-w-4xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="grid h-full min-h-0 grid-cols-[1fr_260px]">
          <div className="flex min-h-0 flex-col gap-6 overflow-y-auto p-8">
            <DialogHeader className="gap-2 text-left">
              <DialogTitle className="type-title">{title}</DialogTitle>
              <DialogDescription className="text-sm text-foreground">{description}</DialogDescription>
            </DialogHeader>
            {before}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Related</div>
              <div className="grid grid-cols-2 gap-2">{tiles}</div>
            </div>
            <section className="mt-auto space-y-3 rounded-xl bg-muted/60 p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Start with</span>
                <span className="flex h-8 items-center gap-2 rounded-md bg-background px-2.5 text-sm"><ToolLogo tool={tool} />{tool}</span>
                <Button size="sm" variant="outline" className="ml-auto" onClick={copy}><Copy />{copied ? "Copied" : "Copy prompt"}</Button>
                <Button size="sm" onClick={onOpenTool}>Open {tool}<ArrowUpRight /></Button>
              </div>
              <p className="rounded-lg bg-background p-3 text-sm leading-relaxed whitespace-pre-wrap">{prompt}</p>
            </section>
          </div>
          <aside className="flex min-h-0 flex-col gap-5 overflow-y-auto border-l bg-muted/30 p-6 text-sm">
            {props}
            <div className="space-y-2 border-t pt-4">
              <div className="text-sm font-medium">Activity</div>
              <p className="text-xs text-muted-foreground">No comments yet.</p>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function Tile({ icon, label, kind, onClick, marks }: { icon: ReactNode; label: string; kind: string; onClick?: () => void; marks?: ReactNode }) {
  const inner = (
    <>
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{kind}</span>
      </span>
      {marks}
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} className="flex min-w-0 items-center gap-2.5 rounded-lg border px-3 py-2 text-left hover:bg-muted/60">{inner}</button>
  ) : (
    <div className="flex min-w-0 items-center gap-2.5 rounded-lg border px-3 py-2 text-left">{inner}</div>
  )
}

export function Prop({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[72px_1fr] items-center gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0">{children}</span>
    </div>
  )
}

export function Thread({ name }: { name: string }) {
  return <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-foreground" aria-hidden />{name}</span>
}

// The tester's card: the next line to paste, ready to copy. Part of the test harness, not of the
// product, so it is styled like the scenario bar.
export function TesterCard({ label, lines, n }: { label: string; lines: string[]; n: number }) {
  const line = lines[n] ?? ""
  const [copied, copy] = useCopy(line)
  if (!lines[n]) return null
  return (
    <div className="fixed bottom-3 left-3 z-40 flex max-w-[20rem] items-start gap-2 rounded-2xl bg-neutral-900/85 py-2 pr-2 pl-3 text-[12px] text-white shadow-lg backdrop-blur select-none">
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-white/60">{label} · {n + 1} of {lines.length}</div>
        <button type="button" onClick={copy} title="Copy" className="mt-0.5 line-clamp-3 w-full text-left leading-4 hover:text-white/80">“{line}”</button>
      </div>
      <button type="button" onClick={copy} aria-label={copied ? "Copied" : "Copy line"} title="Copy" className="flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-white/15">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  )
}
