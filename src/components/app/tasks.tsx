import { useState } from "react"
import { toast } from "sonner"
import {
  CircleCheckBig,
  CircleDotDashed,
  CircleEllipsis,
  Circle,
  Kanban,
  LayoutList,
  Minus,
  OctagonAlert,
  Plus,
  SignalHigh,
  SignalLow,
  SignalMedium,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectLabel } from "@/components/app/project-mark"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { PersonAvatar } from "@/components/app/person"
import { StatusIcon } from "@/components/app/status-badge"
import {
  DECISIONS,
  PEOPLE,
  MY_PROJECTS,
  PRIORITY_LABEL,
  PROJECTS,
  TASK_STATUS_LABEL,
  type Priority,
  type Task,
  type TaskStatus,
} from "@/data"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"

// The project-management core: tasks with status, assignee, priority, due date,
// subtasks, comments and an optional link to the decision behind them.

const STATUS_ORDER: TaskStatus[] = ["prog", "review", "todo", "done"]
const PRIORITY_ORDER: Priority[] = ["urgent", "high", "med", "low", "none"]

const STATUS_ICON = { todo: Circle, prog: CircleDotDashed, review: CircleEllipsis, done: CircleCheckBig }
const PRIORITY_ICON = { urgent: OctagonAlert, high: SignalHigh, med: SignalMedium, low: SignalLow, none: Minus }

export function TaskStatusIcon({ status }: { status: TaskStatus }) {
  const Icon = STATUS_ICON[status]
  return <Icon className="size-4 shrink-0 text-muted-foreground" />
}

export function PriorityIcon({ priority }: { priority: Priority }) {
  const Icon = PRIORITY_ICON[priority]
  return <Icon className={cn("size-4 shrink-0", priority === "urgent" ? "text-foreground" : "text-muted-foreground")} />
}

type Props = { tasks: Task[]; showProject?: boolean; defaultProject?: string }

export function TasksView({ tasks: initial, showProject = false, defaultProject }: Props) {
  // Local copy so status changes and new tasks stick while you click around.
  const [tasks, setTasks] = useState(initial)
  const [view, setView] = useState<"list" | "board">("list")
  const [owner, setOwner] = useState("all")
  const [priority, setPriority] = useState("all")
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const shown = tasks.filter((t) => (owner === "all" || t.owner === owner) && (priority === "all" || t.priority === priority))
  const update = (id: string, patch: Partial<Task>) => setTasks((all) => all.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  const owners = [...new Set(tasks.map((t) => t.owner))]
  const open = tasks.find((t) => t.id === openId)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList>
            <TabsTrigger value="list"><LayoutList />List</TabsTrigger>
            <TabsTrigger value="board"><Kanban />Board</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto flex items-center gap-2">
          <Select value={owner} onValueChange={setOwner}>
            <SelectTrigger size="sm" className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Anyone</SelectItem>
              {owners.map((o) => <SelectItem key={o} value={o}>{PEOPLE[o].name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger size="sm" className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any priority</SelectItem>
              {PRIORITY_ORDER.map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setCreating(true)}><Plus />New task</Button>
        </div>
      </div>

      {view === "list" ? (
        <div className="rounded-lg border">
          {STATUS_ORDER.map((st) => {
            const group = shown.filter((t) => t.status === st)
            if (!group.length) return null
            return (
              <div key={st}>
                <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2 text-sm font-medium">
                  <TaskStatusIcon status={st} />
                  {TASK_STATUS_LABEL[st]}
                  <span className="text-muted-foreground tabular-nums">{group.length}</span>
                </div>
                {group.map((t) => (
                  <TaskRow key={t.id} task={t} showProject={showProject} onOpen={() => setOpenId(t.id)} onToggle={(done) => update(t.id, { status: done ? "done" : "todo" })} />
                ))}
              </div>
            )
          })}
          {!shown.length && <p className="p-6 text-center text-sm text-muted-foreground">No tasks match.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {(["todo", "prog", "review", "done"] as TaskStatus[]).map((st) => {
            const col = shown.filter((t) => t.status === st)
            return (
              <div key={st} className="flex min-h-40 flex-col gap-2 rounded-lg bg-muted/60 p-2">
                <div className="flex items-center gap-2 px-1 py-1 text-sm font-medium">
                  <TaskStatusIcon status={st} />
                  {TASK_STATUS_LABEL[st]}
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">{col.length}</span>
                </div>
                {col.map((t) => (
                  <button key={t.id} onClick={() => setOpenId(t.id)} className="flex flex-col gap-2 rounded-md border bg-background p-3 text-left text-sm shadow-xs hover:bg-accent/50">
                    <span className="font-medium leading-snug">{t.title}</span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <PriorityIcon priority={t.priority} />
                      {showProject ? <ProjectLabel project={t.project} /> : <span className="truncate">{t.part}</span>}
                      <span className="ml-auto">{t.due}</span>
                      <PersonAvatar id={t.owner} className="size-5" />
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
          setTasks((all) => [t, ...all])
          toast("Task created")
        }}
      />
    </div>
  )
}

function TaskRow({ task: t, showProject, onOpen, onToggle }: { task: Task; showProject: boolean; onOpen: () => void; onToggle: (done: boolean) => void }) {
  const done = t.status === "done"
  const subDone = t.subtasks?.filter((s) => s.done).length ?? 0
  return (
    <div className="flex items-center gap-3 border-b px-4 py-2.5 text-sm last:border-b-0 hover:bg-accent/40">
      <Checkbox checked={done} onCheckedChange={(v) => onToggle(!!v)} />
      <PriorityIcon priority={t.priority} />
      <button onClick={onOpen} className={cn("min-w-0 flex-1 truncate text-left", done ? "text-muted-foreground line-through" : "font-medium")}>
        {t.title}
      </button>
      {t.subtasks && <span className="text-xs text-muted-foreground tabular-nums">{subDone}/{t.subtasks.length}</span>}
      {t.decision && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground" title="Linked decision">
          <StatusIcon status={DECISIONS.find((d) => d.id === t.decision)?.status ?? "open"} className="size-3.5" />
          Decision
        </span>
      )}
      <span className="w-44 truncate text-xs text-muted-foreground">{showProject ? <ProjectLabel project={t.project} /> : t.part}</span>
      <span className="w-20 text-xs text-muted-foreground">{t.due}</span>
      <PersonAvatar id={t.owner} />
    </div>
  )
}

function TaskSheet({ task: t, onClose, onChange }: { task?: Task; onClose: () => void; onChange: (patch: Partial<Task>) => void }) {
  const [comment, setComment] = useState("")
  const decision = DECISIONS.find((d) => d.id === t?.decision)
  return (
    <Sheet open={!!t} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[520px] overflow-y-auto sm:max-w-[520px]">
        {t && (
          <>
            <SheetHeader>
              <SheetDescription>{t.project} · {t.part}</SheetDescription>
              <SheetTitle className="text-lg">{t.title}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-5 px-4 pb-6">
              <div className="grid grid-cols-[96px_1fr] items-center gap-x-4 gap-y-2 text-sm">
                <span className="text-muted-foreground">Status</span>
                <Select value={t.status} onValueChange={(v) => onChange({ status: v as TaskStatus })}>
                  <SelectTrigger size="sm" className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["todo", "prog", "review", "done"] as TaskStatus[]).map((s) => (
                      <SelectItem key={s} value={s}><TaskStatusIcon status={s} />{TASK_STATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">Assignee</span>
                <Select value={t.owner} onValueChange={(v) => onChange({ owner: v })}>
                  <SelectTrigger size="sm" className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(PEOPLE).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">Priority</span>
                <Select value={t.priority} onValueChange={(v) => onChange({ priority: v as Priority })}>
                  <SelectTrigger size="sm" className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_ORDER.map((p) => <SelectItem key={p} value={p}><PriorityIcon priority={p} />{PRIORITY_LABEL[p]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">Due</span>
                <Input className="h-8 w-44" defaultValue={t.due} />
              </div>

              {decision && (
                <button
                  onClick={() => navigate(`/decisions/${decision.id}`)}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left text-sm hover:bg-accent/50"
                >
                  <StatusIcon status={decision.status} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">Linked decision</div>
                    <div className="truncate font-medium">{decision.title}</div>
                  </div>
                </button>
              )}

              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Description</div>
                <Textarea defaultValue={t.description} placeholder="Add details…" rows={3} />
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Subtasks</div>
                {(t.subtasks ?? []).map((s, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={s.done}
                      onCheckedChange={(v) => onChange({ subtasks: t.subtasks!.map((x, j) => (j === i ? { ...x, done: !!v } : x)) })}
                    />
                    <span className={s.done ? "text-muted-foreground line-through" : ""}>{s.title}</span>
                  </label>
                ))}
                <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => onChange({ subtasks: [...(t.subtasks ?? []), { title: "New subtask", done: false }] })}>
                  <Plus />Add subtask
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">Activity</div>
                {(t.comments ?? []).map((c, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <PersonAvatar id={c.who} />
                    <div>
                      <div><span className="font-medium">{PEOPLE[c.who].name}</span> <span className="text-xs text-muted-foreground">{c.when}</span></div>
                      <p>{c.text}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input placeholder="Write a comment…" value={comment} onChange={(e) => setComment(e.target.value)} />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!comment.trim()) return
                      onChange({ comments: [...(t.comments ?? []), { who: "MC", text: comment, when: "Just now" }] })
                      setComment("")
                    }}
                  >
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function NewTaskDialog({ open, onOpenChange, defaultProject, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; defaultProject?: string; onCreate: (t: Task) => void }) {
  const [title, setTitle] = useState("")
  const [project, setProject] = useState(defaultProject ?? MY_PROJECTS[0].name)
  const [owner, setOwner] = useState("MC")
  const [priority, setPriority] = useState<Priority>("none")
  const [due, setDue] = useState("")
  const [decision, setDecision] = useState("none")
  const projectId = PROJECTS.find((p) => p.name === project)?.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>Link it to a decision so whoever picks it up knows why.</DialogDescription>
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
              <FieldLabel>Assignee</FieldLabel>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.values(PEOPLE).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Priority</FieldLabel>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITY_ORDER.map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABEL[p]}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="nt-due">Due</FieldLabel>
              <Input id="nt-due" value={due} onChange={(e) => setDue(e.target.value)} placeholder="Fri Oct 30" />
            </Field>
          </div>
          <Field>
            <FieldLabel>Decision behind it</FieldLabel>
            <Select value={decision} onValueChange={setDecision}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {DECISIONS.filter((d) => d.project === projectId).map((d) => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button
            onClick={() => {
              onCreate({
                id: `t-${Date.now()}`,
                title: title.trim() || "Untitled task",
                project,
                part: "General",
                owner,
                due: due || "No date",
                status: "todo",
                priority,
                decision: decision === "none" ? undefined : decision,
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
