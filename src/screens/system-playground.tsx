import { useEffect, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { Archive, ArrowDown, ArrowUp, Check, Kanban, LayoutList, MoreHorizontal, PanelLeft, Pencil, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PersonAvatar } from "@/components/app/person"
import { MarkIcon, StatusIcon } from "@/components/app/status-badge"
import { MarksRow } from "@/app/card"
import { decisionsOf, tailOf } from "@/app/card-model"
import { Faces, Item } from "@/app/caught"
import { LEVELS } from "@/app/duet-state"
import { ThreadChip } from "@/app/hifi-kit"
import { pigmentOf } from "@/app/hifi-model"
import { Count } from "@/app/home"
import { ProjectSearch } from "@/app/project-search"
import { TaskList } from "@/app/task-list"
import { TasksView } from "@/components/app/tasks"
import { ThreadTag } from "@/app/thread-ui"
import { threadOf, useThreads } from "@/app/threads"
import { ViewPills } from "@/app/view-pills"
import { ARTIFACTS, DECISIONS, ME, PEOPLE, PROJECTS, TASKS, TASK_STATUS_LABEL, decisionById, type Decision, type TaskStatus } from "@/data"
import { navigate } from "@/lib/router"
import { useSavedViews, type SavedView } from "@/lib/saved-views"
import { useStore } from "@/lib/store"
import { useConfirmed, useStatusOf, useTasks, useWithdrawn } from "@/lib/work"
import { cn } from "@/lib/utils"
import { AuthOption, type AuthStep } from "@/screens/auth-options"
import "./system-playground.css"

// Playground (#/playground/system/<part>): high-fi options for every part of the design system that is still
// wireframe. Each option is the real component, restyled by a scoped rule in system-playground.css
// ([data-pg="<part>-<n>"]), so the one Keller picks moves into index.css as it is. The decision card's
// options change its layout, so they are drawn here.

const WHISKR = PROJECTS.find((p) => p.id === "whiskr")!
const first = (id: string) => PEOPLE[id]?.name.split(" ")[0] ?? id

type Demo = (p: { pg: string; n: number }) => ReactNode
type Part = { id: string; label: string; options: string[]; wide?: boolean; full?: boolean; Demo: Demo }

const PARTS: Part[] = [
  { id: "inputs", label: "Inputs", options: ["Filled", "Paper ring", "Underline"], Demo: InputsDemo },
  { id: "choices", label: "Choices", options: ["Soft", "Painted", "Ring"], Demo: ChoicesDemo },
  { id: "tabs", label: "Tabs", options: ["Sheet tab", "Marker", "Quiet fill"], Demo: TabsDemo },
  { id: "tabs-again", label: "Tabs, again", options: ["Marker", "Quiet fill", "Ink underline", "Serif"], Demo: ThreadTabsDemo },
  { id: "bars", label: "Bars", options: ["Bar on the table", "Bar on the controls", "One tray", "Same height"], wide: true, Demo: BarsDemo },
  { id: "menus", label: "Menus and dialogs", options: ["Paper", "Layer", "Ink"], Demo: MenusDemo },
  { id: "rows", label: "Rows", options: ["Tiles", "Tray", "Ruled"], wide: true, Demo: RowsDemo },
  { id: "card", label: "Decision card", options: ["Tile", "Pigment", "Ledger"], wide: true, Demo: CardDemo },
  { id: "table", label: "Table", options: ["Layer header", "Tiles", "Ruled"], wide: true, Demo: TableDemo },
  { id: "login", label: "Sign in", options: ["Bunting on a wash", "Circle on the tray", "Form on the tray"], full: true, Demo: LoginDemo },
]

export function SystemPlayground({ part = "inputs" }: { part?: string }) {
  const p = PARTS.find((x) => x.id === part) ?? PARTS[0]
  return (
    <div className="h-svh overflow-y-auto bg-background text-foreground">
      <header className="sticky top-0 z-40 flex flex-wrap items-baseline gap-x-8 gap-y-3 border-b bg-background px-10 pt-6 pb-4">
        <h1 className="type-title">High-fi playground</h1>
        <nav aria-label="Parts" className="flex flex-wrap items-baseline gap-x-5 gap-y-2 text-sm">
          {PARTS.map((x) => (
            <button key={x.id} type="button" aria-current={x.id === p.id ? "page" : undefined} onClick={() => navigate(`/playground/system/${x.id}`)}
              className={cn("transition-colors", x.id === p.id ? "font-medium text-foreground underline decoration-1 underline-offset-[6px]" : "text-muted-foreground hover:text-foreground")}>
              {x.label}
            </button>
          ))}
        </nav>
        <button type="button" onClick={() => navigate("/design-system")} className="ml-auto text-sm text-muted-foreground hover:text-foreground">Design system</button>
      </header>
      <main className={cn("grid gap-x-12 gap-y-16 px-10 py-10", p.full ? "max-w-[1240px] grid-cols-1" : p.wide ? "max-w-5xl grid-cols-1" : p.options.length === 4 ? "max-w-6xl lg:grid-cols-2" : "lg:grid-cols-3")}>
        {p.options.map((name, i) => (
          <section key={`${p.id}-${i}`} data-pg={`${p.id}-${i + 1}`} aria-labelledby={`pg-${p.id}-${i + 1}`} className="flex min-w-0 flex-col gap-6">
            <h2 id={`pg-${p.id}-${i + 1}`} className="type-heading flex items-baseline gap-2.5">
              <span className="text-muted-foreground tabular-nums">{i + 1}</span>{name}
            </h2>
            <p.Demo pg={`${p.id}-${i + 1}`} n={i + 1} />
          </section>
        ))}
      </main>
    </div>
  )
}

/* ---------- Sign in (src/screens/auth-options.tsx) ---------- */

const AUTH_STEPS: [AuthStep, string][] = [["signin", "Sign in"], ["signup", "Create account"], ["workspace", "Workspace"]]

function LoginDemo({ n }: { n: number }) {
  const [step, setStep] = useState<AuthStep>("signin")
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <ToggleGroup type="single" size="sm" value={step} onValueChange={(v) => v && setStep(v as AuthStep)} aria-label="Step">
          {AUTH_STEPS.map(([id, label]) => <ToggleGroupItem key={id} value={id} className="px-3">{label}</ToggleGroupItem>)}
        </ToggleGroup>
        <button type="button" onClick={() => navigate(`/playground/login/${n}`)} className="ml-auto text-sm text-muted-foreground hover:text-foreground">Full page</button>
      </div>
      <div className="h-[680px] overflow-hidden rounded-[20px] shadow-[0_0_0_1px_var(--hifi-hairline,oklch(0_0_0/0.08)),0_12px_40px_-16px_oklch(0_0_0/0.18)]">
        <AuthOption n={n} step={step} onStep={setStep} />
      </div>
    </div>
  )
}

/* ---------- Inputs ---------- */

export function InputsDemo({ pg }: { pg: string }) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<TaskStatus>("prog")
  return (
    <div className="flex max-w-sm flex-col gap-6">
      <Field>
        <FieldLabel htmlFor={`${pg}-name`}>Name</FieldLabel>
        <Input id={`${pg}-name`} placeholder="Untitled thread" />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${pg}-focus`}>Name</FieldLabel>
        <Input id={`${pg}-focus`} defaultValue="Launch" data-show-focus />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${pg}-intent`}>What is it for?</FieldLabel>
        <Textarea id={`${pg}-intent`} placeholder="What is this thread for?" />
      </Field>
      <div className="flex items-center gap-3">
        <ProjectSearch value={search} onChange={setSearch} label="Search Whiskr" />
        <Kbd>⌘K</Kbd>
      </div>
      <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
        <SelectTrigger className="w-44" aria-label="Status"><SelectValue /></SelectTrigger>
        <SelectContent>
          {(Object.entries(TASK_STATUS_LABEL) as [TaskStatus, string][]).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

/* ---------- Choices ---------- */

export function ChoicesDemo({ pg }: { pg: string }) {
  const tasks = TASKS.filter((t) => t.project === WHISKR.name).slice(0, 3)
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        {tasks.map((t, i) => <label key={t.id} className="flex items-center gap-2.5 text-sm"><Checkbox defaultChecked={i === 1} />{t.title}</label>)}
      </div>
      <RadioGroup defaultValue={LEVELS[0].value} aria-label="When teammates ask your Duet" className="gap-3">
        {LEVELS.map((l) => <label key={l.value} className="flex items-center gap-2.5 text-sm"><RadioGroupItem value={l.value} id={`${pg}-${l.value}`} />{l.label}</label>)}
      </RadioGroup>
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3 text-sm"><Switch defaultChecked />Answer in Slack</label>
        <label className="flex items-center gap-3 text-sm"><Switch />Draft replies for me</label>
      </div>
      <ToggleGroup type="single" variant="outline" size="sm" defaultValue="week" aria-label="Calendar view">
        <ToggleGroupItem value="day" className="px-3">Day</ToggleGroupItem>
        <ToggleGroupItem value="week" className="px-3">Week</ToggleGroupItem>
        <ToggleGroupItem value="month" className="px-3">Month</ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

/* ---------- Tabs ---------- */

type NoFilters = Record<string, never>
const VIEW_SEED: SavedView<NoFilters>[] = [
  { id: "all", name: "All", filters: {}, sort: null, locked: true },
  { id: "mine", name: "My open tasks", filters: {}, sort: null },
  { id: "week", name: "Due this week", filters: {}, sort: null },
]

export function TabsDemo({ pg }: { pg: string }) {
  const views = useSavedViews<NoFilters>(`playground-${pg}`, VIEW_SEED, {})
  const marketing = threadOf(WHISKR.id, "Marketing")
  const tasks = TASKS.filter((t) => t.project === WHISKR.name && t.part === marketing.part && t.status !== "done")
  const n = {
    tasks: tasks.length,
    decisions: DECISIONS.filter((d) => d.project === WHISKR.id && d.part === marketing.part).length,
    artifacts: ARTIFACTS.filter((a) => a.project === WHISKR.id && a.part === marketing.part).length,
  }
  return (
    <div className="flex flex-col gap-8">
      <Tabs defaultValue="list">
        <TabsList className="h-8 [&_button]:text-xs">
          <TabsTrigger value="list"><LayoutList />Table</TabsTrigger>
          <TabsTrigger value="board"><Kanban />Board</TabsTrigger>
        </TabsList>
      </Tabs>
      <Tabs defaultValue="tasks" data-pg-line>
        <TabsList variant="line">
          <TabsTrigger value="tasks">Tasks<Count n={n.tasks} /></TabsTrigger>
          <TabsTrigger value="decisions">Decisions<Count n={n.decisions} /></TabsTrigger>
          <TabsTrigger value="artifacts">Artifacts<Count n={n.artifacts} /></TabsTrigger>
        </TabsList>
        <ul data-pg-sheet className="flex flex-col gap-2 py-4 text-sm">
          {tasks.map((t) => <li key={t.id} className="truncate">{t.title}</li>)}
        </ul>
      </Tabs>
      <ViewPills v={views} />
    </div>
  )
}

// The thread page's own tab bar (app/thread-page.tsx): line tabs over a rule, the table's controls under it.
export function ThreadTabsDemo() {
  const marketing = threadOf(WHISKR.id, "Marketing")
  const tasks = TASKS.filter((t) => t.project === WHISKR.name && t.part === marketing.part && t.status !== "done")
  const n = {
    decisions: DECISIONS.filter((d) => d.project === WHISKR.id && d.part === marketing.part).length,
    artifacts: ARTIFACTS.filter((a) => a.project === WHISKR.id && a.part === marketing.part).length,
  }
  return (
    <div className="flex flex-col gap-6">
      <div data-pg-bar className="flex items-center gap-4 border-b pb-1.5">
        <Tabs defaultValue="tasks">
          <TabsList variant="line" className="-ml-2 [&>button]:after:!bottom-[-11px]">
            <TabsTrigger value="tasks">Tasks<Count n={tasks.length} /></TabsTrigger>
            <TabsTrigger value="decisions">Decisions<Count n={n.decisions} /></TabsTrigger>
            <TabsTrigger value="artifacts">Artifacts<Count n={n.artifacts} /></TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <Tabs defaultValue="list">
        <TabsList className="h-8 [&_button]:text-xs">
          <TabsTrigger value="list"><LayoutList />Table</TabsTrigger>
          <TabsTrigger value="board"><Kanban />Board</TabsTrigger>
        </TabsList>
      </Tabs>
      <ul className="flex flex-col gap-2 text-sm">{tasks.map((t) => <li key={t.id} className="truncate">{t.title}</li>)}</ul>
    </div>
  )
}

/* ---------- Bars ---------- */

// Where the gray layer goes when controls and a table stack up. Two real screens per option: My tasks on Today
// (saved views over the table) and a thread page (line tabs, the Table and Board switch, then the table).
function LineTabs({ counts }: { counts: [number, number, number] }) {
  return (
    <div data-pg-bar className="flex items-center gap-4 border-b pb-1.5">
      <Tabs defaultValue="tasks">
        <TabsList variant="line" className="-ml-2 [&>button]:after:!bottom-[-11px]">
          <TabsTrigger value="tasks">Tasks<Count n={counts[0]} /></TabsTrigger>
          <TabsTrigger value="decisions">Decisions<Count n={counts[1]} /></TabsTrigger>
          <TabsTrigger value="artifacts">Artifacts<Count n={counts[2]} /></TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}

export function BarsDemo() {
  const all = useTasks()
  const mine = all.filter((t) => (t.owner === ME.id || !!t.assignees?.includes(ME.id)) && t.status !== "done").slice(0, 4)
  const marketing = threadOf(WHISKR.id, "Marketing")
  const tasks = all.filter((t) => t.project === WHISKR.name && t.part === marketing.part)
  const decisions = DECISIONS.filter((d) => d.project === WHISKR.id && d.part === marketing.part).length
  const artifacts = ARTIFACTS.filter((a) => a.project === WHISKR.id && a.part === marketing.part).length
  return (
    <div className="@container flex flex-col gap-14">
      <div className="flex flex-col gap-3">
        <h3 className="flex items-baseline gap-2"><span className="type-section">My tasks</span><span className="text-sm text-muted-foreground tabular-nums">{mine.length} open</span></h3>
        <TasksView title="My tasks" tasks={mine} showProject headless />
      </div>
      <div className="flex flex-col gap-6">
        <LineTabs counts={[tasks.filter((t) => t.status !== "done").length, decisions, artifacts]} />
        <TaskList projectId={WHISKR.id} tasks={tasks} thread={marketing} />
      </div>
    </div>
  )
}

/* ---------- Menus and dialogs ---------- */

// Every menu stays open so the three options sit side by side; the dialog opens from its button.
// `corner` adds a piece of paint inside the popover and the dialog (the painted round).
export function MenusDemo({ pg, corner }: { pg: string; corner?: ReactNode }) {
  const threads = useThreads(WHISKR.id)
  const [dialog, setDialog] = useState(false)
  useEffect(() => {
    const root = document.documentElement
    if (dialog) root.dataset.pgDialog = pg
    return () => { if (root.dataset.pgDialog === pg) delete root.dataset.pgDialog }
  }, [dialog, pg])
  const still = { onOpenAutoFocus: (e: Event) => e.preventDefault(), onCloseAutoFocus: (e: Event) => e.preventDefault() }
  return (
    <div className="flex h-[340px] flex-col justify-between">
      <div className="flex items-start gap-40">
        <DropdownMenu open modal={false}>
          <DropdownMenuTrigger asChild><Button variant="outline" size="icon-sm" aria-label="Marketing options"><MoreHorizontal /></Button></DropdownMenuTrigger>
          <DropdownMenuContent data-pg={pg} align="start" className="w-44" {...still}>
            <DropdownMenuItem><Pencil />Rename</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem><ArrowUp />Move up</DropdownMenuItem>
            <DropdownMenuItem><ArrowDown />Move down</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem><Archive />Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Popover open modal={false}>
          <PopoverTrigger asChild><Button variant="outline" size="sm">Threads</Button></PopoverTrigger>
          <PopoverContent data-pg={pg} align="start" className="flex w-52 flex-col gap-2.5 text-sm" {...still}>
            {corner}
            {threads.slice(0, 4).map((t) => <ThreadTag key={t.id} projectId={WHISKR.id} part={t.part} />)}
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center gap-4">
        <Tooltip open>
          <TooltipTrigger asChild><Button variant="outline" size="icon-sm" aria-label="Collapse sidebar"><PanelLeft /></Button></TooltipTrigger>
          <TooltipContent data-pg={pg} side="right">Collapse sidebar</TooltipContent>
        </Tooltip>
        <span className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => toast("Decision confirmed")}>Toast</Button>
        <Button size="sm" onClick={() => setDialog(true)}><Plus />New thread</Button>
      </div>
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent data-pg={pg} className="sm:max-w-md">
          {corner}
          <DialogHeader><DialogTitle>New thread</DialogTitle></DialogHeader>
          <Field>
            <FieldLabel htmlFor={`${pg}-dialog-name`}>Name</FieldLabel>
            <Input id={`${pg}-dialog-name`} placeholder="Untitled thread" autoFocus />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={() => setDialog(false)}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ---------- Rows ---------- */

export function RowsDemo() {
  const { openDecision } = useStore()
  const clash = decisionById("redcard")
  const theirs = decisionById(clash?.clashes)
  const done = decisionById("purr")
  return (
    <ul data-pg-rows className="flex max-w-2xl flex-col">
      {clash && theirs && (
        <Item face={<span className="flex size-6 items-center justify-center"><MarkIcon mark="triangle" className="size-3.5" /></span>}
          text={<>Your “{clash.title}” clashes with {first(theirs.owner)}’s decision</>}
          sub={[`${first(theirs.owner)} confirmed “${theirs.title}”`]}
          onOpen={() => openDecision(clash.id)}
          action={<Button size="xs" variant="outline" onClick={() => openDecision(clash.id)}>Talk it over</Button>} />
      )}
      <Item face={<Faces ids={["CH"]} />}
        text={<><span className="font-medium">Christine</span> asked whether the launch date moves</>}
        sub={["Nothing of yours covers it yet"]}
        action={<Button size="xs" variant="outline">Reply</Button>} />
      {done && (
        <Item face={<PersonAvatar id={done.owner} className="size-6" />}
          text={done.title} mark={<StatusIcon status={done.status} className="size-3 shrink-0 text-muted-foreground" />}
          sub={[done.by ?? first(done.owner), ...(done.tool ? [done.tool] : []), ...(done.when ? [done.when] : [])]}
          onOpen={() => openDecision(done.id)} />
      )}
    </ul>
  )
}

/* ---------- Decision card ---------- */

// The real card's content (app/card.tsx), in three layouts.
function CardDemo({ n }: { n: number }) {
  const { openDecision, confirmDecision } = useStore()
  const statusOf = useStatusOf()
  const withdrawn = useWithdrawn()
  const promo = ARTIFACTS.find((a) => a.id === "w7")!
  const decisions = decisionsOf(promo, TASKS).filter((d) => !withdrawn(d))
  const { n: confirmed, m } = useConfirmed(decisions)
  const t = threadOf(WHISKR.id, promo.part)
  const pigment = pigmentOf(t)

  const line = (d: Decision, stacked: boolean) => {
    const status = statusOf(d)
    const guess = status === "inf" || status === "open"
    return (
      <li key={d.id} className={cn("flex items-start gap-3 leading-5", stacked && "py-3.5")}>
        <StatusIcon status={status} className="mt-[3px] size-3.5 shrink-0" />
        <span className={cn("min-w-0 flex-1", stacked && "flex flex-col gap-0.5")}>
          <button type="button" onClick={() => openDecision(d.id)} className={cn("text-left hover:underline", stacked && "font-medium")}>{d.title}</button>
          {stacked ? <span className="text-muted-foreground">{tailOf(d, status)}</span> : <>{" "}<span className="text-muted-foreground">{tailOf(d, status)}</span></>}
        </span>
        {status !== "open" && <PersonAvatar id={d.owner} agent={guess && !!d.tool} className="mt-0.5 size-5" />}
        {status === "inf" && d.owner === ME.id && (
          <Button size="xs" onClick={() => { confirmDecision(d.id); toast("Decision confirmed") }}><Check />Confirm</Button>
        )}
      </li>
    )
  }
  const copy = <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => toast("Copied")}>Copy as text</Button>

  if (n === 1) return (
    <section className="flex flex-col gap-5 rounded-[24px] bg-foreground/[0.035] px-6 pt-5 pb-6">
      <header className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ThreadChip projectId={WHISKR.id} part={promo.part} className="text-xs text-muted-foreground" />
          <h3 className="type-heading">{promo.name}</h3>
        </div>
        <MarksRow decisions={decisions} className="mt-1 text-xs" />
        {copy}
      </header>
      <ul className="flex flex-col gap-3 text-sm">{decisions.map((d) => line(d, false))}</ul>
    </section>
  )
  if (n === 2) return (
    <section className="overflow-hidden rounded-[24px] shadow-[0_0_0_1px_oklch(0_0_0/0.05)]">
      <header className="flex items-center gap-3 px-6 pt-5 pb-4" style={{ background: `color-mix(in oklab, ${pigment} 14%, var(--background))` }}>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ThreadChip projectId={WHISKR.id} part={promo.part} className="text-xs" />
          <h3 className="type-heading">{promo.name}</h3>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{confirmed} of {m} confirmed</span>
        {copy}
      </header>
      <ul className="flex flex-col gap-3 px-6 pt-4 pb-6 text-sm">{decisions.map((d) => line(d, false))}</ul>
    </section>
  )
  return (
    <section className="flex flex-col border-t border-foreground/80 pt-4">
      <header className="flex items-baseline gap-3 pb-2">
        <h3 className="type-heading min-w-0 flex-1">{promo.name}</h3>
        <MarksRow decisions={decisions} className="text-xs" />
        {copy}
      </header>
      <ul className="flex flex-col divide-y text-sm">{decisions.map((d) => line(d, true))}</ul>
    </section>
  )
}

/* ---------- Table ---------- */

export function TableDemo() {
  const marketing = threadOf(WHISKR.id, "Marketing")
  const tasks = useTasks().filter((t) => t.project === WHISKR.name && t.part === marketing.part)
  return (
    <div className="@container">
      <TaskList projectId={WHISKR.id} tasks={tasks} thread={marketing} />
    </div>
  )
}
