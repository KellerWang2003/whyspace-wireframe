import { useEffect, useState, type ReactNode } from "react"
import { ArrowUpRight, Blend, CalendarDays, Check, Copy, FileText, Film, LayoutGrid, Plus, Search, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { WorkspaceMark } from "@/components/app/app-sidebar"
import { PersonAvatar } from "@/components/app/person"
import { ProjectMark } from "@/components/app/project-mark"
import { MarkIcon } from "@/components/app/status-badge"
import { ToolLogo } from "@/components/app/tool-logo"
import { cn } from "@/lib/utils"
import { PROMPT, TASK, THREAD_INTENT, TODAY_LABEL, TREVOR, confirmed, guesses, type Action, type State } from "./model"
import { Alert, CheckList } from "./pill"

// The Whyspace app for the demo: Today with only Keller's own work, the task that starts him in
// Claude, and the dialogs the rows open. Same look as the real Today; its own data.

export function DemoApp({ s, dispatch }: { s: State; dispatch: (a: Action) => void }) {
  // The clash dialog from Today: it can only be open while the clash is.
  const [clashAsked, setClashOpen] = useState(false)
  const clashOpen = clashAsked && s.clash === "open"
  const open = guesses(s)
  const review = s.shared && s.checkClosed && open.length > 0
  const rows = [
    ...(!s.taskDone ? [
      <NeedsRow key="do" face={<PersonAvatar id="MC" className="size-8" />} lead="Do" title={TASK.title}
        sub={<>Due today<Where thread /></>} onOpen={() => dispatch({ type: "task", open: true })}
        actions={<Button size="sm" variant="outline" onClick={() => dispatch({ type: "taskDone" })}><Check />Done</Button>} />,
    ] : []),
    ...(s.clash === "open" ? [
      <NeedsRow key="clash" face={<PersonAvatar id="MC" className="size-8" />} lead="Clash" mark={<MarkIcon mark="triangle" className="size-3.5 shrink-0" />} title={s.caught.find((c) => c.id === "red")?.title ?? ""}
        sub={<>Trevor confirmed “{TREVOR.title}”<Where thread /></>} onOpen={() => setClashOpen(true)}
        actions={<><Button size="sm" onClick={() => dispatch({ type: "take" })}>Take Trevor’s</Button><Button size="sm" variant="outline" onClick={() => setClashOpen(true)}>Ask why</Button></>} />,
    ] : []),
    ...(review ? [
      <NeedsRow key="review" face={<PersonAvatar id="MC" className="size-8" />} lead="Review" mark={<MarkIcon mark="empty" className="size-3.5 shrink-0" />} title="Promo video plan"
        sub={<>{open.length} {open.length === 1 ? "guess is" : "guesses are"} still in it<Where thread /></>} onOpen={() => dispatch({ type: "review", open: true })}
        actions={<Button size="sm" variant="outline" onClick={() => dispatch({ type: "review", open: true })}>Review</Button>} />,
    ] : []),
    ...(s.toldTrevor.by === "none" ? [
      <NeedsRow key="asked" face={<PersonAvatar id="TR" className="size-8" />} lead="Asked your Duet" title="Trevor asked how long the promo video will be"
        sub={<>Nothing of yours covers it yet<Where /></>} onOpen={() => dispatch({ type: "trevor", open: true })}
        actions={<Button size="sm" variant="outline" onClick={() => dispatch({ type: "trevor", open: true })}>Answer</Button>} />,
    ] : []),
  ]
  const n = confirmed(s).length
  const m = s.caught.length

  return (
    <div className="flex h-svh w-full overflow-hidden bg-background text-foreground">
      <Rail badge={rows.length} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col xl:flex-row">
        <div className="min-w-0 flex-1 xl:overflow-y-auto">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 p-6 sm:p-8">
            <header className="flex items-baseline gap-3">
              <h1 className="type-title">Today</h1>
              <span className="text-sm text-muted-foreground">{TODAY_LABEL}</span>
            </header>

            <Lane title="Needs you" count={rows.length}>
              {rows.length === 0 ? <p className="py-4 text-sm text-muted-foreground">Nothing waits on you.</p> : <ul className="flex flex-col gap-2">{rows}</ul>}
            </Lane>

            <Lane title="Across your projects">
              <ul className="flex flex-col gap-1">
                <Recap project="whiskr" name="Whiskr" summary={s.shared ? `You shared the promo video plan. ${n} of ${m} confirmed.` : "The first cat test is in. The promo video is next."} />
                <Recap project="studio" name="AI Studio · Recall" summary="Interview synthesis is tomorrow at 16:00." />
                <Recap project="holiday" name="Holiday campaign" summary="Nothing new this week." />
              </ul>
            </Lane>

            <Lane title="Handled">
              <ul className="flex flex-col">{handled(s).map((l) => (
                <li key={l.id} className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm">
                  <PersonAvatar id="MC" agent={l.agent} className="size-5" />
                  <span className="min-w-0 flex-1 truncate">{l.text}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{l.when}</span>
                </li>
              ))}</ul>
            </Lane>
          </div>
        </div>
        <ComingUp />
      </div>

      <TaskDialog s={s} dispatch={dispatch} />

      <Dialog open={s.reviewOpen} onOpenChange={(o) => dispatch({ type: "review", open: o })}>
        <DialogContent className="gap-0 p-0 sm:max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="flex items-center gap-2 text-sm"><span className="flex size-5 items-center justify-center rounded-full bg-foreground font-serif text-[11px] text-background">Y</span>Promo video plan</DialogTitle>
            <DialogDescription className="sr-only">The guesses still in the plan.</DialogDescription>
          </DialogHeader>
          <CheckList s={s} dispatch={dispatch} ids={s.checkIds} onDone={() => dispatch({ type: "checkDone" })} />
        </DialogContent>
      </Dialog>

      <Dialog open={clashOpen} onOpenChange={setClashOpen}>
        <DialogContent className="gap-0 p-0 sm:max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogTitle className="sr-only">Possible misalignment</DialogTitle>
          <DialogDescription className="sr-only">Your decision against Trevor’s.</DialogDescription>
          <Alert s={s} dispatch={dispatch} />
        </DialogContent>
      </Dialog>

      <Dialog open={s.trevorOpen} onOpenChange={(o) => dispatch({ type: "trevor", open: o })}>
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><PersonAvatar id="TR" className="size-6" />Trevor asked how long the promo video will be</DialogTitle>
            <DialogDescription>Nothing of yours covers it yet. Decide the length and your Duet answers him, or tell him now.</DialogDescription>
          </DialogHeader>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = String(new FormData(e.currentTarget).get("v") ?? "").trim(); if (v) dispatch({ type: "tellTrevor", text: v }) }}>
            <Input name="v" placeholder="Tell Trevor…" aria-label="Tell Trevor" />
            <Button type="submit">Send</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type HandledLine = { id: string; text: string; when: string; agent?: boolean }
function handled(s: State): HandledLine[] {
  const now: HandledLine[] = []
  if (s.toldTrevor.by === "duet") now.push({ id: "duet-tr", text: "Your Duet told Trevor the promo video is 15 seconds", when: "Just now", agent: true })
  if (s.toldTrevor.by === "you") now.push({ id: "you-tr", text: `You told Trevor: ${s.toldTrevor.text}`, when: "Just now" })
  if (s.taskDone) now.push({ id: "task", text: `You finished “${TASK.title}”`, when: "Just now" })
  if (s.clash === "taken") now.push({ id: "took", text: `You took Trevor’s decision: ${TREVOR.title.charAt(0).toLowerCase()}${TREVOR.title.slice(1)}`, when: "Just now" })
  for (const c of [...s.caught].reverse()) if (c.kind === "conf") now.push({ id: `c-${c.id}`, text: `You confirmed “${c.title}”`, when: "Just now" })
  return [
    ...now,
    { id: "y1", text: "You finished “Launch poster, first draft”", when: "Yesterday 17:10" },
    { id: "y2", text: "Your Duet told Christine the launch date stays Nov 14", when: "Yesterday 15:40", agent: true },
  ]
}

function Rail({ badge }: { badge: number }) {
  return (
    <nav aria-label="Rail" className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-sidebar-border bg-sidebar py-2 text-sidebar-foreground">
      <RailButton label="Search"><Search className="size-4" /></RailButton>
      <RailButton label="Today" active badge={badge}><Sun className="size-4" /></RailButton>
      <RailButton label="Duet"><Blend className="size-4" /></RailButton>
      <RailButton label="Projects"><LayoutGrid className="size-4" /></RailButton>
      <div className="my-1 h-px w-6 shrink-0 bg-sidebar-border" />
      <RailButton label="Whiskr"><ProjectMark project="whiskr" className="size-6" /></RailButton>
      <RailButton label="AI Studio · Recall"><ProjectMark project="studio" className="size-6" /></RailButton>
      <RailButton label="Holiday campaign"><ProjectMark project="holiday" className="size-6" /></RailButton>
      <RailButton label="New project"><Plus className="size-4 text-muted-foreground" /></RailButton>
      <div className="mt-auto flex size-9 items-center justify-center"><WorkspaceMark name="Litterbox Labs" className="size-7 text-sm" /></div>
    </nav>
  )
}

function RailButton({ label, active, badge, children }: { label: string; active?: boolean; badge?: number; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} aria-current={active ? "page" : undefined} className={cn("relative flex size-9 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring", active && "bg-sidebar-accent")}>
      {active && <span aria-hidden className="absolute top-2 -left-1.5 h-5 w-1 rounded-r-full bg-foreground" />}
      {children}
      {badge ? <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] text-background tabular-nums">{badge}</span> : null}
    </button>
  )
}

function Lane({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
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

function NeedsRow({ face, lead, title, mark, sub, actions, onOpen }: { face: ReactNode; lead: string; title: string; mark?: ReactNode; sub: ReactNode; actions: ReactNode; onOpen: () => void }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      {face}
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-2 text-sm">
          {mark}
          <span className="shrink-0 text-muted-foreground">{lead}</span>
          <span className="min-w-0 truncate font-medium hover:underline">{title}</span>
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">{sub}</span>
      </button>
      <span className="flex shrink-0 items-center gap-1.5">{actions}</span>
    </li>
  )
}

function Where({ thread }: { thread?: boolean }) {
  return (
    <>
      <span aria-hidden>·</span>
      <span className="truncate">Whiskr</span>
      {thread && <><span aria-hidden>·</span><span className="inline-flex shrink-0 items-center gap-1.5"><span className="size-1.5 rounded-full bg-foreground" aria-hidden />Marketing</span></>}
    </>
  )
}

function Recap({ project, name, summary }: { project: string; name: string; summary: string }) {
  return (
    <li>
      <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left">
        <ProjectMark project={project} className="size-7 rounded-md" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block truncate text-xs text-muted-foreground">{summary}</span>
        </span>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
      </div>
    </li>
  )
}

const UPCOMING: [string, [string, string, string][]][] = [
  ["Wed, Oct 28", [["18:00", "Recall prototype check-in", "studio"]]],
  ["Thu, Oct 29", [["14:00", "App store screenshots", "whiskr"]]],
  ["Fri, Oct 30", [["10:00", "Poster and video review", "whiskr"], ["13:00", "Final crit", "studio"]]],
]
const PROJECT_NAME: Record<string, string> = { whiskr: "Whiskr", studio: "AI Studio · Recall" }

function ComingUp() {
  return (
    <section className="flex shrink-0 flex-col gap-3 border-t p-6 sm:p-8 xl:w-80 xl:overflow-y-auto xl:border-t-0 xl:border-l xl:px-6">
      <div className="flex h-8 items-center justify-between">
        <h2 className="type-section">Coming up</h2>
        <span className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />Calendar</span>
      </div>
      {UPCOMING.map(([day, events]) => (
        <div key={day} className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">{day}</p>
          {events.map(([time, title, project]) => (
            <div key={title} className="flex gap-3 rounded-md px-2 py-1.5 text-sm">
              <span className="w-10 shrink-0 text-muted-foreground tabular-nums">{time}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{title}</span>
                <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"><ProjectMark project={project} /><span className="truncate">{PROJECT_NAME[project]}</span></span>
              </span>
            </div>
          ))}
        </div>
      ))}
    </section>
  )
}

// The task, as a centered peek: what it is, what it came from, and how to start it in Claude.
function TaskDialog({ s, dispatch }: { s: State; dispatch: (a: Action) => void }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])
  const copy = () => {
    void navigator.clipboard?.writeText(PROMPT).catch(() => { /* clipboard blocked: the button still says so */ })
    setCopied(true)
  }
  return (
    <Dialog open={s.taskOpen} onOpenChange={(o) => dispatch({ type: "task", open: o })}>
      <DialogContent className="h-[80vh] max-w-4xl gap-0 overflow-hidden p-0 sm:max-w-4xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="grid h-full min-h-0 grid-cols-[1fr_260px]">
          <div className="flex min-h-0 flex-col gap-6 overflow-y-auto p-8">
            <DialogHeader className="gap-2 text-left">
              <DialogTitle className="type-title">{TASK.title}</DialogTitle>
              <DialogDescription className="text-sm text-foreground">{TASK.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Related · 3</div>
              <div className="grid grid-cols-2 gap-2">
                <Tile icon={<FileText className="size-4 shrink-0 text-muted-foreground" />} label="Brand guidelines" kind="Artifact · Trevor" />
                <Tile icon={<Film className="size-4 shrink-0 text-muted-foreground" />} label="Cat test videos" kind="Artifact · Luna, Mochi, Biscuit" />
                <Tile icon={<span className="ml-1 size-2 shrink-0 rounded-full bg-foreground" aria-hidden />} label="Marketing" kind={THREAD_INTENT} />
              </div>
            </div>
            <section className="mt-auto space-y-3 rounded-xl bg-muted/60 p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Start with</span>
                <span className="flex h-8 items-center gap-2 rounded-md bg-background px-2.5 text-sm"><ToolLogo tool="Claude" />Claude</span>
                <Button size="sm" variant="outline" className="ml-auto" onClick={copy}><Copy />{copied ? "Copied" : "Copy prompt"}</Button>
                <Button size="sm" onClick={() => dispatch({ type: "surface", to: "desk" })}>Open Claude<ArrowUpRight /></Button>
              </div>
              <p className="rounded-lg bg-background p-3 text-sm leading-relaxed whitespace-pre-wrap">{PROMPT}</p>
            </section>
          </div>
          <aside className="flex min-h-0 flex-col gap-5 overflow-y-auto border-l bg-muted/30 p-6 text-sm">
            <Prop label="Status">To do</Prop>
            <Prop label="Assignee"><span className="flex items-center gap-2"><PersonAvatar id="MC" className="size-5" />Keller</span></Prop>
            <Prop label="Due">Today</Prop>
            <Prop label="Thread"><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-foreground" aria-hidden />Marketing</span></Prop>
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

function Tile({ icon, label, kind }: { icon: ReactNode; label: string; kind: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-lg border px-3 py-2 text-left">
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{kind}</span>
      </span>
    </div>
  )
}

function Prop({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[72px_1fr] items-center gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0">{children}</span>
    </div>
  )
}

