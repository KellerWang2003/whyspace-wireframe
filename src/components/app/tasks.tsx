import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { ArrowUpRight, RotateCcw } from "lucide-react"
import {
  AppWindow,
  Check,
  Maximize2,
  PanelRight,
  CircleCheckBig,
  Copy,
  CircleDotDashed,
  CircleEllipsis,
  Circle,
  FileText,
  Kanban,
  LayoutList,
  Plus,
  Shapes,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectLabel } from "@/components/app/project-mark"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SortableHead } from "@/components/app/sortable-table"
import { useSort, type Sort } from "@/lib/use-sort"
import { useSavedViews, type SavedView } from "@/lib/saved-views"
import { FilterMenu, TablePageHeader, ViewTabs } from "@/components/app/view-tabs"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { PersonAvatar } from "@/components/app/person"
import { AI_TOOLS, ToolLogo } from "@/components/app/tool-logo"
import { StatusIcon } from "@/components/app/status-badge"
import {
  ARTIFACTS,
  DECISIONS,
  PEOPLE,
  ME,
  MY_PROJECTS,
  PROJECTS,
  SESSIONS,
  TASK_STATUS_LABEL,
  WORKSHOPS,
  type Task,
  type TaskStatus,
} from "@/data"
import { navigate } from "@/lib/router"
import { deskApi } from "@/scenarios/frame"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { ResizeHandle } from "@/components/app/resize-handle"
import { usePanelWidth } from "@/lib/use-panel-width"
import { DESIGN } from "@/lib/design"
import { TaskWhereB } from "@/design-b/where"

// Tasks, grouped by the thread they belong to. Each task suggests a tool and a ready prompt
// that pulls its context from Whyspace over MCP; what it relates to stays folded away.

const STATUS_ORDER: TaskStatus[] = ["prog", "review", "todo", "done"]
// Views work like Notion: each keeps its filters, sort and layout, and edits save into it.
type TaskFilters = { thread: string; status: "all" | "open" | TaskStatus; owner: string; due: "any" | "week"; layout: "list" | "board" }
const BLANK: TaskFilters = { thread: "all", status: "all", owner: "all", due: "any", layout: "list" }
const SEED: SavedView<TaskFilters>[] = [
  { id: "all", name: "All", filters: BLANK, sort: null, locked: true },
  { id: "mine", name: "My open tasks", filters: { ...BLANK, owner: ME.id, status: "open" }, sort: null },
  { id: "week", name: "Due this week", filters: { ...BLANK, status: "open", due: "week" }, sort: null },
  { id: "done", name: "Done", filters: { ...BLANK, status: "done" }, sort: null },
]
const TODAY_DAY = 33 // Mon Nov 2, on the dueDay scale
// "Fri Oct 30" / "Mon Nov 2" as a day number, so due dates sort in order.
const dueDay = (t: Task) => { const n = Number(t.due.match(/\d+/)?.[0]); return Number.isNaN(n) ? 999 : n + (t.due.includes("Nov") ? 31 : 0) }
const STATUS_ICON = { todo: Circle, prog: CircleDotDashed, review: CircleEllipsis, done: CircleCheckBig }

export function TaskStatusIcon({ status }: { status: TaskStatus }) {
  const Icon = STATUS_ICON[status]
  return <Icon className="size-4 shrink-0 text-muted-foreground" />
}

const projectId = (name: string) => PROJECTS.find((p) => p.name === name)?.id ?? name

// A task without its own prompt still gets one, built from its thread and title.
export function promptFor(t: Task) {
  return t.prompt ?? `Use the Whyspace MCP to read ${t.project}'s ${t.part} thread and its latest decisions.\n\nThen help me ${t.title.charAt(0).toLowerCase()}${t.title.slice(1)}.`
}

// headless: no page title; the search sits in the views row (Today shows My tasks as a section).
type Props = { title: string; tasks: Task[]; showProject?: boolean; defaultProject?: string; headless?: boolean }

export function TasksView({ title, tasks: initial, showProject = false, defaultProject, headless = false }: Props) {
  // Status changes go to the shared store, so finishing a task here clears it from Catch up and
  // the Inbox and marks the artifact updated on its decision. New tasks stay local to this view.
  const { taskPatches, patchTask } = useStore()
  const [created, setCreated] = useState<Task[]>([])
  const tasks = [...created, ...initial].map((t) => (taskPatches[t.id] ? { ...t, ...taskPatches[t.id] } : t))
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const v = useSavedViews<TaskFilters>(showProject ? "tasks:mine" : `tasks:${defaultProject}`, SEED, BLANK)
  const { thread, status, owner, due, layout } = v.active.filters
  const [search, setSearch] = useState("")
  const update = (id: string, patch: Partial<Task>) => patchTask(id, patch)
  const owners = [...new Set(tasks.flatMap(assigneesOf))]
  const threadOf = (t: Task) => (showProject ? `${t.project} · ${t.part}` : t.part)
  const threads = [...new Set(tasks.map(threadOf))]
  const open = tasks.find((t) => t.id === openId)
  const query = search.trim().toLowerCase()
  const shown = tasks.filter((t) =>
    (status === "all" || (status === "open" ? t.status !== "done" : t.status === status)) &&
    (owner === "all" || assigneesOf(t).includes(owner)) && (thread === "all" || threadOf(t) === thread) &&
    (due === "any" || dueDay(t) <= TODAY_DAY + 7) &&
    `${t.title} ${t.description ?? ""} ${t.part}`.toLowerCase().includes(query))
  // Default order: by thread, open work first, then by due date. Headers re-sort.
  const base = [...shown].sort((a, b) => threadOf(a).localeCompare(threadOf(b)) || STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || dueDay(a) - dueDay(b))
  const { sorted: rows, sort, toggle } = useSort(base, {
    thread: (t) => threadOf(t),
    title: (t) => t.title,
    status: (t) => STATUS_ORDER.indexOf(t.status),
    owner: (t) => assigneesOf(t).map((id) => PEOPLE[id]?.name).join(", "),
    due: (t) => dueDay(t),
  }, null, { sort: v.active.sort as Sort<"thread" | "title" | "status" | "owner" | "due">, setSort: v.setSort })
  const seed = SEED.find((x) => x.id === v.active.id)?.filters ?? BLANK
  const changed = JSON.stringify({ ...v.active.filters, layout: seed.layout }) !== JSON.stringify(seed)
  const filtering = thread !== "all" || status !== "all" || owner !== "all" || due !== "any"

  return (
    <div className="flex flex-col gap-4">
      {!headless && <TablePageHeader title={title} search={search} onSearch={setSearch} placeholder="Search tasks…" />}
      <ViewTabs v={v}>
        {headless && <Input aria-label="Search tasks" placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-44" />}
        <FilterMenu active={filtering}>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Thread</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={thread} onValueChange={(x) => v.setFilters({ thread: x })}>
                <DropdownMenuRadioItem value="all">All threads</DropdownMenuRadioItem>
                {threads.map((x) => <DropdownMenuRadioItem key={x} value={x}>{x}</DropdownMenuRadioItem>)}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={status} onValueChange={(x) => v.setFilters({ status: x as TaskFilters["status"] })}>
                <DropdownMenuRadioItem value="all">Any status</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="open">Not done</DropdownMenuRadioItem>
                {STATUS_ORDER.map((x) => <DropdownMenuRadioItem key={x} value={x}>{TASK_STATUS_LABEL[x]}</DropdownMenuRadioItem>)}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Assignee</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={owner} onValueChange={(x) => v.setFilters({ owner: x })}>
                <DropdownMenuRadioItem value="all">Anyone</DropdownMenuRadioItem>
                {owners.map((o) => <DropdownMenuRadioItem key={o} value={o}>{o === ME.id ? "Me" : PEOPLE[o]?.name}</DropdownMenuRadioItem>)}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuCheckboxItem checked={due === "week"} onCheckedChange={(c) => v.setFilters({ due: c ? "week" : "any" })} onSelect={(e) => e.preventDefault()}>Due this week</DropdownMenuCheckboxItem>
          {changed && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={v.resetFilters}>Clear filters</DropdownMenuItem></>}
        </FilterMenu>
        <Tabs value={layout} onValueChange={(x) => v.setFilters({ layout: x as TaskFilters["layout"] })}>
          <TabsList>
            <TabsTrigger value="list"><LayoutList />Table</TabsTrigger>
            <TabsTrigger value="board"><Kanban />Board</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" onClick={() => setCreating(true)}><Plus />New task</Button>
      </ViewTabs>

      {layout === "list" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pl-4" />
              <SortableHead id="thread" sort={sort} onSort={toggle} className="w-44">Thread</SortableHead>
              <SortableHead id="title" sort={sort} onSort={toggle}>Task</SortableHead>
              <SortableHead id="status" sort={sort} onSort={toggle} className="w-32">Status</SortableHead>
              <SortableHead id="owner" sort={sort} onSort={toggle} className="w-44">Assignees</SortableHead>
              <SortableHead id="due" sort={sort} onSort={toggle} className="w-28 pr-4">Due</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => (
              <TaskRow key={t.id} task={t} thread={threadOf(t)} onOpen={() => setOpenId(t.id)} onToggle={(done) => update(t.id, { status: done ? "done" : "todo" })} />
            ))}
            {!rows.length && <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No matches.</TableCell></TableRow>}
          </TableBody>
        </Table>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {(["todo", "prog", "review", "done"] as TaskStatus[]).map((st) => {
            const col = rows.filter((t) => t.status === st)
            return (
              <div key={st} className="flex min-h-40 flex-col gap-2 rounded-xl bg-muted/60 p-2">
                <div className="flex items-center gap-2 px-1 py-1 text-sm font-medium">
                  <TaskStatusIcon status={st} />
                  {TASK_STATUS_LABEL[st]}
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">{col.length}</span>
                </div>
                {col.map((t) => (
                  <button key={t.id} onClick={() => setOpenId(t.id)} className="flex flex-col gap-1.5 rounded-lg bg-background p-3 text-left text-sm transition-colors hover:bg-background/70">
                    <span className="truncate text-xs text-muted-foreground">{showProject ? <ProjectLabel project={t.project} /> : t.part}</span>
                    <span className="font-medium leading-snug">{t.title}</span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      {showProject && <span className="truncate">{t.part}</span>}
                      <span className="ml-auto">{t.due}</span>
                      <MiniStack ids={assigneesOf(t)} />
                    </span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}

      <TaskSheet task={open} onClose={() => setOpenId(null)} onChange={(patch) => open && update(open.id, patch)} />
      <NewTaskDialog
        open={creating}
        onOpenChange={setCreating}
        defaultProject={defaultProject}
        onCreate={(t) => {
          setCreated((all) => [t, ...all])
          toast("Task created")
        }}
      />
    </div>
  )
}

function TaskRow({ task: t, thread, onOpen, onToggle }: { task: Task; thread: string; onOpen: () => void; onToggle: (done: boolean) => void }) {
  const done = t.status === "done"
  return (
    <TableRow className="cursor-pointer" onClick={onOpen}>
      <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}><Checkbox checked={done} onCheckedChange={(v) => onToggle(!!v)} /></TableCell>
      <TableCell className="truncate text-xs text-muted-foreground">{DESIGN === "b" && thread !== t.part ? <TaskWhereB task={t} /> : thread}</TableCell>
      <TableCell className={cn("max-w-0 truncate py-3", done ? "text-muted-foreground line-through" : "font-medium")}>{t.title}</TableCell>
      <TableCell><span className="flex items-center gap-1.5 text-xs"><TaskStatusIcon status={t.status} />{TASK_STATUS_LABEL[t.status]}</span></TableCell>
      <TableCell><span className="flex items-center gap-2 text-xs"><MiniStack ids={assigneesOf(t)} /><span className="truncate">{namesOf(assigneesOf(t))}</span></span></TableCell>
      <TableCell className="pr-4 text-xs text-muted-foreground">{t.due}</TableCell>
    </TableRow>
  )
}

// What a task came from, resolved against what exists at this stage.
function relatedOf(t: Task) {
  const r = t.related ?? {}
  const decisions = [...new Set([t.decision, ...(r.decisions ?? [])])].flatMap((id) => DECISIONS.filter((d) => d.id === id))
  const workshops = (r.workshops ?? []).flatMap((id) => WORKSHOPS.filter((w) => w.id === id))
  const meetings = (r.meetings ?? []).flatMap((id) => SESSIONS.filter((s) => s.id === id))
  const artifacts = (r.artifacts ?? []).flatMap((id) => ARTIFACTS.filter((a) => a.id === id))
  return { decisions, workshops, meetings, artifacts, count: decisions.length + workshops.length + meetings.length + artifacts.length }
}

// A task can have several assignees: the first is the owner, the rest are in `assignees`.
export const assigneesOf = (t: Task) => [t.owner, ...(t.assignees ?? []).filter((id) => id !== t.owner)]
const firstName = (id: string) => PEOPLE[id]?.name.split(" ")[0] ?? id
export const namesOf = (ids: string[]) => (ids.length > 2 ? `${firstName(ids[0])} +${ids.length - 1}` : ids.map(firstName).join(", "))

export function MiniStack({ ids }: { ids: string[] }) {
  return (
    <span className="flex shrink-0 -space-x-1.5 *:ring-2 *:ring-background">
      {ids.slice(0, 3).map((id) => <PersonAvatar key={id} id={id} className="size-5" />)}
    </span>
  )
}

// Pick one or more people. At least one stays assigned.
function AssigneePicker({ ids, onChange }: { ids: string[]; onChange: (ids: string[]) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-accent/60">
          <MiniStack ids={ids} />
          <span className="min-w-0 flex-1 truncate">{namesOf(ids)}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {Object.values(PEOPLE).map((p) => {
          const on = ids.includes(p.id)
          return (
            <DropdownMenuCheckboxItem
              key={p.id}
              checked={on}
              disabled={on && ids.length === 1}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={(v) => onChange(v ? [...ids, p.id] : ids.filter((x) => x !== p.id))}
            >
              <PersonAvatar id={p.id} className="size-5" />{p.name}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// How a task opens, like Notion: centered pop-up (default), side panel or full page. Remembered per browser.
type OpenMode = "center" | "side" | "full"
const OPEN_MODES: [OpenMode, string, typeof PanelRight][] = [["center", "Center peek", AppWindow], ["side", "Side peek", PanelRight], ["full", "Full page", Maximize2]]
function useOpenMode() {
  const [mode, setMode] = useState<OpenMode>(() => {
    try { const m = localStorage.getItem("whyspace-task-open"); return m === "side" || m === "full" ? m : "center" } catch { return "center" }
  })
  return [mode, (m: OpenMode) => { setMode(m); try { localStorage.setItem("whyspace-task-open", m) } catch { /* storage blocked: still switches for now */ } }] as const
}

export function TaskSheet({ task: t, onClose, onChange }: { task?: Task; onClose: () => void; onChange: (patch: Partial<Task>) => void }) {
  const [comment, setComment] = useState("")
  const [sideWidth, setSideWidth] = usePanelWidth("task-details", 280)
  const [mode, setMode] = useOpenMode()
  const ModeIcon = OPEN_MODES.find(([m]) => m === mode)![2]
  const body = t && (
          <div className="relative grid h-full min-h-0" style={{ gridTemplateColumns: `minmax(0,1fr) ${sideWidth}px` }}>
            <ResizeHandle edge="left" getWidth={() => sideWidth} onWidth={setSideWidth} min={220} max={520} reset={280} className="left-auto" style={{ right: sideWidth - 4 }} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute top-2.5 right-11 size-7 text-muted-foreground" aria-label="Open as"><ModeIcon /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {OPEN_MODES.map(([m, label, Icon]) => (
                  <DropdownMenuItem key={m} onSelect={() => setMode(m)}><Icon />{label}{m === mode && <Check className="ml-auto" />}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Main: what the task is and how to start it */}
            <div className={cn("flex min-h-0 flex-col gap-6 overflow-y-auto p-8", mode === "full" && "px-[max(2rem,calc((100%-48rem)/2))]")}>
              <div className="flex items-start gap-4">
                <SheetHeader className="min-w-0 flex-1 gap-1.5 p-0">
                  <SheetDescription>{t.project} · {t.part}</SheetDescription>
                  <SheetTitle className="type-title">{t.title}</SheetTitle>
                </SheetHeader>
                {t.status === "done"
                  ? <Button size="sm" variant="ghost" className="shrink-0 text-muted-foreground" onClick={() => onChange({ status: "todo" })}><RotateCcw />Reopen</Button>
                  : <Button size="sm" variant="outline" className="shrink-0" onClick={() => { onChange({ status: "done" }); toast("Task done") }}><Check />Done</Button>}
              </div>
              <Textarea
                key={t.id}
                defaultValue={t.description}
                placeholder="Add a description…"
                rows={5}
                className="-mx-3 -mt-3 min-h-32 resize-none border-transparent text-base shadow-none hover:border-input focus-visible:border-input"
              />

              <Related task={t} onClose={onClose} />

              <div className="mt-auto">
                <StartWith task={t} onChange={onChange} />
              </div>
            </div>

            {/* Side: the task's details */}
            <aside className="flex min-h-0 flex-col gap-6 overflow-y-auto border-l px-5 pt-14 pb-8">
              <div className="flex flex-col gap-1">
                <Prop label="Status">
                  <Select value={t.status} onValueChange={(v) => onChange({ status: v as TaskStatus })}>
                    <SelectTrigger size="sm" className={PROP_TRIGGER}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["todo", "prog", "review", "done"] as TaskStatus[]).map((s) => (
                        <SelectItem key={s} value={s}><TaskStatusIcon status={s} />{TASK_STATUS_LABEL[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Prop>
                <Prop label="Assignees">
                  <AssigneePicker ids={assigneesOf(t)} onChange={(ids) => onChange({ owner: ids[0], assignees: ids.slice(1) })} />
                </Prop>
                <Prop label="Due">
                  <Input key={t.id} defaultValue={t.due} className={cn(PROP_TRIGGER, "h-8")} />
                </Prop>
              </div>
              <div className="space-y-3 border-t pt-4">
                <div className="text-sm font-medium">Activity</div>
                {(t.comments ?? []).map((c, i) => (
                  <div key={i} className="flex gap-2.5 text-sm">
                    <PersonAvatar id={c.who} className="size-6" />
                    <div className="min-w-0">
                      <div><span className="font-medium">{PEOPLE[c.who].name}</span> <span className="text-xs text-muted-foreground">{c.when}</span></div>
                      <p className="leading-snug">{c.text}</p>
                    </div>
                  </div>
                ))}
                {!t.comments?.length && <p className="text-xs text-muted-foreground">No comments yet.</p>}
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!comment.trim()) return
                    onChange({ comments: [...(t.comments ?? []), { who: "MC", text: comment, when: "Just now" }] })
                    setComment("")
                  }}
                >
                  <Input placeholder="Comment…" value={comment} onChange={(e) => setComment(e.target.value)} className="h-8" />
                  <Button type="submit" size="sm" variant="outline">Send</Button>
                </form>
              </div>
            </aside>
          </div>
  )
  if (mode === "side") {
    return (
      <Sheet open={!!t} onOpenChange={(o) => !o && onClose()}>
        <SheetContent resizeKey="task" onOpenAutoFocus={(e) => e.preventDefault()} className="w-[920px] gap-0 overflow-hidden sm:max-w-[920px]">{body}</SheetContent>
      </Sheet>
    )
  }
  return (
    <Dialog open={!!t} onOpenChange={(o) => !o && onClose()}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className={cn("gap-0 overflow-hidden p-0", mode === "full" ? "top-0 left-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 sm:max-w-none" : "h-[85vh] max-w-5xl sm:max-w-5xl")}>{body}</DialogContent>
    </Dialog>
  )
}

// Side-panel fields: quiet controls that only show a border on hover.
const PROP_TRIGGER = "w-full justify-between border-transparent bg-transparent px-2 shadow-none hover:bg-accent/60 dark:bg-transparent"
function Prop({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[72px_1fr] items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

// Suggestions for how to start: a tool and a prompt ready to paste into it.
function StartWith({ task: t, onChange }: { task: Task; onChange: (patch: Partial<Task>) => void }) {
  const tool = t.tool ?? "Claude"
  const prompt = promptFor(t)
  return (
    <section className="space-y-3 rounded-xl bg-muted/60 p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Start with</span>
        <Select value={tool} onValueChange={(v) => onChange({ tool: v })}>
          <SelectTrigger size="sm" className="h-8 w-auto gap-2 border-transparent bg-background shadow-none dark:bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[...new Set([tool, ...AI_TOOLS])].map((x) => (
              <SelectItem key={x} value={x}><ToolLogo tool={x} />{x}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="ml-auto" onClick={() => {
          try { void navigator.clipboard?.writeText(prompt) } catch { /* clipboard blocked: the toast still explains */ }
          toast(`Prompt copied. Paste it into ${tool}.`)
        }}><Copy />Copy prompt</Button>
        {/* In a test scenario the tool is a window beside Whyspace on the desktop: bring it forward. */}
        {deskApi()?.has(tool) && <Button size="sm" variant="outline" onClick={() => deskApi()?.focus(tool)}>Open {tool}<ArrowUpRight /></Button>}
      </div>
      <p className="max-h-64 overflow-y-auto rounded-lg bg-background p-3 text-sm leading-relaxed whitespace-pre-wrap">{prompt}</p>
    </section>
  )
}

// What the task came from, shown like email attachments: decisions, workshops, meetings, artifacts.
function Related({ task: t, onClose }: { task: Task; onClose: () => void }) {
  const { openDecision } = useStore()
  const [all, setAll] = useState(false)
  const r = relatedOf(t)
  if (!r.count) return null
  const pid = projectId(t.project)
  const go = (path: string) => { onClose(); navigate(path) }
  const icon = "size-4 shrink-0 text-muted-foreground"
  const items = [
    ...r.decisions.map((d) => ({ key: d.id, icon: <StatusIcon status={d.status} className={icon} />, label: d.title, kind: "Decision", onClick: () => { onClose(); openDecision(d.id) } })),
    ...r.workshops.map((w) => ({ key: w.id, icon: <Shapes className={icon} />, label: w.title, kind: "Workshop", onClick: () => go(`/p/${pid}/sessions/${w.id}`) })),
    ...r.meetings.map((m) => ({ key: m.id, icon: <Video className={icon} />, label: m.title, kind: "Meeting", onClick: () => go(`/p/${pid}/sessions/${m.id}`) })),
    ...r.artifacts.map((a) => ({ key: a.id, icon: <FileText className={icon} />, label: a.name, kind: "Artifact", onClick: () => go(`/p/${pid}/artifacts/${a.id}`) })),
  ]
  const shown = all ? items : items.slice(0, 4)
  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">Related · {items.length}</div>
      <div className="grid grid-cols-2 gap-2">
        {shown.map((x) => (
          <button key={x.key} onClick={x.onClick} title={x.label} className="flex min-w-0 items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-accent/50">
            {x.icon}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{x.label}</span>
              <span className="block text-xs text-muted-foreground">{x.kind}</span>
            </span>
          </button>
        ))}
      </div>
      {items.length > 4 && (
        <button onClick={() => setAll(!all)} className="text-xs text-muted-foreground hover:text-foreground">{all ? "Show less" : `Show ${items.length - 4} more`}</button>
      )}
    </div>
  )
}

// Threads a new task can go in: the ones the project already uses.
const threadsOf = (project: string) => {
  const id = projectId(project)
  return [...new Set(DECISIONS.filter((d) => d.project === id).map((d) => d.part))]
}

export function NewTaskDialog({ open, onOpenChange, defaultProject, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; defaultProject?: string; onCreate: (t: Task) => void }) {
  const [title, setTitle] = useState("")
  const [project, setProject] = useState(defaultProject ?? MY_PROJECTS[0].name)
  const [thread, setThread] = useState("")
  const [owner, setOwner] = useState("MC")
  const [due, setDue] = useState("")
  const threads = threadsOf(project)
  const part = threads.includes(thread) ? thread : threads[0] ?? "General"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription className="sr-only">Add a task to a thread.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="nt-title">Title</FieldLabel>
            <Input id="nt-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            {!defaultProject && (
              <Field>
                <FieldLabel>Project</FieldLabel>
                <Select value={project} onValueChange={setProject}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{MY_PROJECTS.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            )}
            <Field>
              <FieldLabel>Thread</FieldLabel>
              <Select value={part} onValueChange={setThread}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{(threads.length ? threads : ["General"]).map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Assignee</FieldLabel>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.values(PEOPLE).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="nt-due">Due</FieldLabel>
              <Input id="nt-due" value={due} onChange={(e) => setDue(e.target.value)} placeholder="Fri Oct 30" />
            </Field>
          </div>
        </FieldGroup>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button
            onClick={() => {
              onCreate({
                id: `t-${Date.now()}`,
                title: title.trim() || "Untitled task",
                project,
                part,
                owner,
                due: due || "No date",
                status: "todo",
                priority: "none",
              })
              setTitle("")
              setDue("")
              onOpenChange(false)
            }}
          >
            Create task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
