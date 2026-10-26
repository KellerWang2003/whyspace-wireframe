import { useState } from "react"
import { AudioLines, Check, ChevronDown, Mic, Pause, Play, Square, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ProjectMark } from "@/components/app/project-mark"
import { StatusIcon } from "@/components/app/status-badge"
import { PROJECTS } from "@/data"
import { cn } from "@/lib/utils"

type Decision = {
  id: string
  title: string
  inferred?: boolean
  why?: string
  question?: string
  options?: string[]
  project: string
  part: string
  session?: number
}

type Session = { id: number; project: string; part: string; state: "active" | "paused" | "ended" }

const PARTS: Record<string, string[]> = {
  platiful: ["Research", "Design", "Engineering", "Marketing"],
  studio: ["Interviews", "Concept", "Prototype", "Final crit"],
}

// Static examples. New decisions only appear after an explicit action.
const INITIAL_DECISIONS: Decision[] = [
  { id: "o1", title: "Show three dinners first", inferred: true, project: "platiful", part: "Design" },
  { id: "o2", title: "Keep meal swaps inline", question: "Why inline?", options: ["Keep the plan in view", "Reduce extra steps"], project: "platiful", part: "Design" },
  { id: "o3", title: "Use a weekly tray", inferred: true, project: "platiful", part: "Design" },
  ...[
    "Start the week on Monday",
    "Keep recipes editable",
    "Show prep time",
    "Save meals with one click",
    "Group the grocery list",
    "Allow skipped days",
    "Keep portions adjustable",
    "Use a simple week view",
    "Label suggested meals",
    "Show dietary tags",
    "Put search at the top",
    "Keep recent meals nearby",
    "Let people reorder dinners",
    "Confirm before clearing a plan",
    "Remember the last plan",
  ].map((title, index) => ({ id: `c${index + 1}`, title, project: "platiful", part: "Design" })),
]

// A session can be any conversation, with Whyspace in the background.
// This wireframe previews the controls; it does not capture or transcribe audio.
export function DesktopMode() {
  const [decisions, setDecisions] = useState<Decision[]>(INITIAL_DECISIONS)
  const [where, setWhere] = useState({ project: "platiful", part: "Design" })
  const [session, setSession] = useState<Session | null>(null)
  const [capturedOpen, setCapturedOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const expanded = hovered || keyboardFocus || menuOpen
  const running = session?.state === "active" || session?.state === "paused"
  const projectName = PROJECTS.find((p) => p.id === where.project)?.name
  const visible = decisions.filter((d) => d.project === where.project && d.part === where.part)
  const needsAttention = visible.filter((d) => d.inferred || (d.question && !d.why))
  const confirmed = visible.filter((d) => !d.inferred && !(d.question && !d.why))

  function update(id: string, patch: Partial<Decision> | null) {
    setDecisions((all) => patch ? all.map((d) => d.id === id ? { ...d, ...patch } : d) : all.filter((d) => d.id !== id))
  }

  return (
    <div className="fixed inset-0 z-40 isolate bg-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: "repeating-linear-gradient(135deg, #fafafa 0, #fafafa 18vw, #d4d4d4 18vw, #d4d4d4 28vw, #202020 28vw, #202020 46vw, #a3a3a3 46vw, #a3a3a3 56vw)",
        }}
      />
      <section
        aria-label="Whyspace desktop overlay"
        tabIndex={0}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={(e) => { if (e.target.matches(":focus-visible")) setKeyboardFocus(true) }}
        onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setKeyboardFocus(false) }}
        onPointerDown={(e) => { if (e.pointerType === "touch") setHovered(true) }}
        onKeyDown={(e) => { if (e.key === "Escape") { setCapturedOpen(false); setHovered(false); setKeyboardFocus(false) } }}
        className={cn("fixed top-1/2 right-3 flex max-h-[calc(100svh-2rem)] max-w-[calc(100vw-1.5rem)] -translate-y-1/2 flex-col overflow-hidden border border-white/60 bg-background/85 shadow-xl ring-1 ring-black/5 backdrop-blur-xl outline-none focus-visible:ring-2 focus-visible:ring-ring", expanded ? "w-[288px] rounded-2xl" : "w-12 rounded-full")}
      >
        <div hidden={expanded} className={cn("items-center gap-3 px-2 py-4", expanded ? "hidden" : "flex flex-col")}>
          <span title={projectName} aria-label={projectName}>
            <ProjectMark project={where.project} className="size-7 rounded-md" />
          </span>
          <span role="status" title={`${visible.length} decisions`} className="text-sm font-medium leading-none tabular-nums">
            {visible.length}<span className="sr-only"> decisions</span>
          </span>
          {running && (
            <span role="status" title={session.state === "paused" ? "Live session paused" : "Live session on"} className="grid size-5 place-items-center">
              {session.state === "paused" ? <Pause className="size-3.5 text-muted-foreground" /> : <AudioLines className="size-4" />}
              <span className="sr-only">{session.state === "paused" ? "Live session paused" : "Live session on"}</span>
            </span>
          )}
        </div>
        <div hidden={!expanded} className={cn("min-h-0 flex-col", expanded ? "flex" : "hidden")}>
        <header className="flex h-12 shrink-0 items-center gap-2.5 border-b px-4">
          <span className="shrink-0 text-sm font-semibold tracking-tight" aria-label="Whyspace">Y</span>
          <DropdownMenu modal={false} open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger disabled={running} className="flex min-w-0 flex-1 items-center gap-1.5 rounded-sm py-1 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default" aria-label={`Save to ${projectName}, ${where.part}`}>
              <span className="truncate font-medium">{projectName}</span>
              <span className="text-muted-foreground">/</span><span className="truncate text-muted-foreground">{where.part}</span>
              {!running && <ChevronDown className="size-3 shrink-0 text-muted-foreground" />}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              {Object.entries(PARTS).map(([project, parts], i) => (
                <div key={project}>
                  {i > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ProjectMark project={project} className="size-4" />
                    {PROJECTS.find((p) => p.id === project)?.name}
                  </DropdownMenuLabel>
                  {parts.map((part) => (
                    <DropdownMenuItem key={part} onSelect={() => { setWhere({ project, part }); setCapturedOpen(false) }}>
                      {part}
                      {where.project === project && where.part === part && <Check className="ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <section aria-label="Open decisions" className="min-h-[240px] shrink-0 px-3 py-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-xs font-medium">Open</h2>
              <span className="text-xs tabular-nums text-muted-foreground">{needsAttention.length}</span>
            </div>
            {needsAttention.length ? (
              <ul className="space-y-1.5">
                {needsAttention.map((d) => <DecisionRow key={d.id} decision={d} onUpdate={(patch) => update(d.id, patch)} />)}
              </ul>
            ) : <p className="px-1 text-xs text-muted-foreground">All caught up</p>}
          </section>

          <section aria-label="Captured decisions" className="shrink-0 border-t">
            <button
              type="button"
              aria-expanded={capturedOpen}
              aria-controls="overlay-captured-decisions"
              onClick={() => setCapturedOpen((open) => !open)}
              className="flex w-full items-center gap-2 px-4 py-3 text-xs outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <span className="flex-1 text-left font-medium">Captured</span>
              <span className="tabular-nums text-muted-foreground">{confirmed.length}</span>
              <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", capturedOpen && "rotate-180")} />
            </button>
            <div id="overlay-captured-decisions" hidden={!capturedOpen} className="max-h-48 overflow-y-auto px-3 pb-3">
              {confirmed.length ? (
                <ul className="space-y-0.5">
                  {confirmed.map((d) => <DecisionRow key={d.id} decision={d} onUpdate={(patch) => update(d.id, patch)} />)}
                </ul>
              ) : <p className="px-1 text-xs text-muted-foreground">No decisions yet</p>}
            </div>
          </section>
        </div>

        <footer className="shrink-0 px-3 pb-3">
          {running ? (
            <div className="flex h-9 items-center gap-2 rounded-lg border bg-background/50 px-2">
              <Mic className="size-3.5 text-muted-foreground" />
              <p role="status" className="flex-1 text-xs font-medium">{session.state === "paused" ? "Paused" : "Live"}</p>
              <Button size="icon-sm" variant="ghost" className="size-7" aria-label={session.state === "paused" ? "Resume session" : "Pause session"} onClick={() => setSession({ ...session, state: session.state === "paused" ? "active" : "paused" })}>
                {session.state === "paused" ? <Play className="size-3" /> : <Pause className="size-3" />}
              </Button>
              <Button size="icon-sm" variant="ghost" className="size-7" aria-label="End session" onClick={() => setSession({ ...session, state: "ended" })}><Square className="size-3" /></Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="h-9 w-full gap-2 rounded-lg bg-background/50 text-xs" onClick={() => setSession({ id: Date.now(), ...where, state: "active" })}><Mic className="size-3.5" />Start live</Button>
          )}
        </footer>
        </div>
      </section>

    </div>
  )
}

function DecisionRow({ decision: d, onUpdate }: { decision: Decision; onUpdate: (patch: Partial<Decision> | null) => void }) {
  const [answering, setAnswering] = useState(false)
  const [why, setWhy] = useState("")
  const needsReason = Boolean(d.question && !d.why)
  const needsAttention = d.inferred || needsReason
  const status = d.inferred ? "Suggested decision · needs review" : needsReason ? "Decision needs a reason" : "Confirmed decision"
  return (
    <li className={cn("group flex items-start gap-2 rounded-md px-2 py-2", needsAttention ? "bg-muted/60" : "text-muted-foreground")}>
      <span title={status} className={cn("mt-0.5", needsAttention ? "text-foreground" : "text-muted-foreground")}><StatusIcon status={d.inferred ? "inf" : needsReason ? "open" : "conf"} className="size-3.5 shrink-0" /><span className="sr-only">{status}</span></span>
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-snug">{d.title}</p>
        {d.why && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d.why}</p>}
        {d.inferred && <button className="mt-1 rounded-sm text-xs text-muted-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onUpdate({ inferred: false })}>Confirm</button>}
        {needsReason && !answering && <div className="group/reason mt-1">
          <button className="rounded-sm text-left text-xs text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setAnswering(true)}>{d.question}</button>
          <div className="hidden flex-col items-start gap-1 pt-2 group-hover/reason:flex group-focus-within/reason:flex [@media(hover:none)]:flex">
            {d.options?.map((option) => <button key={option} className="rounded px-1.5 py-1 text-left text-xs text-foreground hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onUpdate({ why: option })}>{option}</button>)}
            <button className="rounded px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setAnswering(true)}>Something else…</button>
          </div>
        </div>}
        {answering && <form className="mt-2 flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); if (why.trim()) { onUpdate({ why: why.trim() }); setAnswering(false) } }}>
          <Input autoFocus aria-label={d.question} placeholder="Add a reason…" value={why} onChange={(e) => setWhy(e.target.value)} className="h-7 min-w-0 text-xs" />
          <Button size="icon-sm" variant="ghost" className="size-7 shrink-0" type="submit" aria-label="Save reason" disabled={!why.trim()}><Check className="size-3.5" /></Button>
          <Button size="icon-sm" variant="ghost" className="size-7 shrink-0" type="button" aria-label="Cancel reason" onClick={() => setAnswering(false)}><X className="size-3.5" /></Button>
        </form>}
      </div>
      <button aria-label={`Remove decision: ${d.title}`} className="mt-0.5 rounded-sm text-muted-foreground opacity-0 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 [@media(hover:none)]:opacity-100" onClick={() => onUpdate(null)}><X className="size-3" /></button>
    </li>
  )
}
