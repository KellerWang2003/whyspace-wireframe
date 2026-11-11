import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { ArrowUpRight, Bell, BellOff, CalendarDays, Check, ChevronRight, Copy, Mail, MailOpen, RotateCcw, Sun, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { AppShell } from "@/components/app/app-shell"
import { PersonAvatar } from "@/components/app/person"
import { ProjectMark } from "@/components/app/project-mark"
import { StatusBadge, StatusIcon } from "@/components/app/status-badge"
import { TaskSheet, TasksView } from "@/components/app/tasks"
import { ARTIFACTS, DECISIONS, ME, PEOPLE, SESSIONS, type InboxItem, type InboxKind, type Task } from "@/data"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { useHifi } from "@/lib/hifi"
import { CountBadge } from "@/components/app/count-badge"
import { cn } from "@/lib/utils"
import { useStatusOf } from "@/lib/work"
import { KIND_ICON } from "@/playground/artifact"
import { dateOfDay, fmtDay } from "@/components/app/calendar/events"
import { ComingUp } from "@/screens/inbox"
import { openReply } from "./duet-state"
import { NeedsFocus } from "./needs-focus"
import { SureMark } from "./sure-mark"
import { useNeedsItems, useNeedsQueue, type NeedsItem } from "./needs-model"
import { conversationOf } from "./together"
import { InboxWhere } from "./where"
import { useAllTasks } from "./work"
import { onToday, todayDay, useHandledLines, useRecap, useTodayRows, type Line } from "./today-model"
import { Illo } from "@/components/brand/illo/pieces"

// Today: the one page that replaced Inbox and My tasks. It reads like a recap: what needs you,
// one line per project, your tasks, then what was handled (by you and by your Duet).
// Needs you shows one thing at a time, answered in place; its sentence opens the detail as a side peek.

const KIND_LABEL: Record<InboxKind, string> = { review: "Decision review", change: "Project update", alert: "Possible misalignment", invite: "Meeting invitation", mention: "Mention" }
const labelOf = (item: InboxItem) => (item.need === "do" ? "Do" : item.need === "decide" ? "Decide" : KIND_LABEL[item.kind])
const isMine = (t: Task) => t.owner === ME.id || !!t.assignees?.includes(ME.id)

export function Today() {
  const { current, inboxState, openDecision, patchTask, setInboxRead } = useStore()
  const rows = useTodayRows()
  const recap = useRecap()
  const lines = useHandledLines()
  const tasks = useAllTasks()
  const queue = useNeedsQueue(useNeedsItems(rows))
  const mine = current?.example ? tasks.filter((t) => isMine(t) && onToday(t.id, "task")) : []
  const [peekId, setPeekId] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const openTask = tasks.find((t) => t.id === taskId)
  const peek = (item: InboxItem) => { setInboxRead(item.id, true); setPeekId(item.id) }
  const peeked = [...rows.flatMap((r) => ("item" in r && r.item ? [r.item] : [])), ...recap.flatMap((r) => r.items), ...lines.flatMap((l) => (l.item ? [l.item] : []))].find((i) => i.id === peekId)
  const day = todayDay()
  // High-fi: more room between everything.
  const hifi = useHifi()

  // What an item's sentence opens: the update behind it, the decision, the conversation or the task.
  const openItem = ({ row: r }: NeedsItem) => {
    if (r.kind === "asked") return openReply(conversationOf(r.line))
    if (r.kind === "decide") return r.item ? peek(r.item) : openDecision(r.decision.id)
    if (r.kind === "invite") return peek(r.item)
    return r.item ? peek(r.item) : setTaskId(r.task.id)
  }

  const line = (l: Line) => (
    <li key={l.id}>
      <button type="button" onClick={() => (l.decision ? openDecision(l.decision) : l.item ? peek(l.item) : l.task && setTaskId(l.task.id))} className={cn("flex w-full items-center gap-3 rounded-md px-2 text-left text-sm hover:bg-muted/50", hifi ? "py-2.5" : "py-1.5")}>
        {l.who ? <PersonAvatar id={l.who} agent={l.agent} className="size-5" /> : <span className="size-5" />}
        <span className="min-w-0 flex-1 truncate">{l.text}</span>
        {l.sure && <SureMark sure={l.sure} />}
        <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{l.when}</span>
      </button>
    </li>
  )
  const open = lines.filter((l) => l.day !== "earlier")
  const earlier = lines.filter((l) => l.day === "earlier")

  return (
    <AppShell crumbs={[{ label: "Today" }]}>
      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <div className="min-w-0 flex-1 xl:overflow-y-auto">
          <div className={cn("relative mx-auto flex w-full max-w-4xl flex-col", hifi ? "gap-12 p-6 sm:px-12 sm:pt-12 sm:pb-16" : "gap-10 p-6 sm:p-8")}>
            {hifi ? (
              <header className="flex flex-col gap-1.5">
                <h1 className="type-title">Today</h1>
                <span className="text-sm text-muted-foreground">{fmtDay(dateOfDay(day), { weekday: "long", month: "long", day: "numeric" })}</span>
              </header>
            ) : (
              <header className="flex items-baseline gap-3">
                <h1 className="type-title">Today</h1>
                <span className="text-sm text-muted-foreground">{fmtDay(dateOfDay(day), { weekday: "long", month: "long", day: "numeric" })}</span>
              </header>
            )}

            <Lane title="Needs you" count={queue.current ? `${queue.pos} of ${queue.total}` : undefined}>
              <NeedsFocus queue={queue} onOpen={openItem} />
            </Lane>

            {recap.length > 0 && (
              <Lane title="Across your projects">
                <ul className={cn("flex flex-col", hifi ? "gap-2" : "gap-1")}>
                  {recap.map((r) => <RecapLine key={r.project.id} recap={r} unreadOf={(i) => !(inboxState[i.id]?.read ?? !i.unread)} onItem={peek} />)}
                </ul>
              </Lane>
            )}

            {mine.length > 0 && (
              <Collapsible defaultOpen className="flex flex-col gap-4">
                <CollapsibleTrigger className="group flex items-center gap-2 text-left">
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                  <h2 className="type-section">My tasks</h2>
                  <span className="text-sm text-muted-foreground tabular-nums">{mine.filter((t) => t.status !== "done").length} open</span>
                </CollapsibleTrigger>
                <CollapsibleContent><TasksView title="My tasks" tasks={mine} showProject headless /></CollapsibleContent>
              </Collapsible>
            )}

            <Lane title="Handled">
              {open.length === 0 && <p className="py-4 text-sm text-muted-foreground">Nothing today or yesterday.</p>}
              <ul className="flex flex-col">{open.map(line)}</ul>
              {earlier.length > 0 && (
                <Collapsible>
                  <CollapsibleTrigger className="group flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                    <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />Earlier<span className="tabular-nums">{earlier.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent><ul className="flex flex-col">{earlier.map(line)}</ul></CollapsibleContent>
                </Collapsible>
              )}
            </Lane>

            {!current?.example && (
              <Empty className="border border-dashed"><EmptyHeader>{hifi ? <Illo name="nothing-today" className="mb-3 h-36" /> : <EmptyMedia variant="icon"><Sun /></EmptyMedia>}<EmptyTitle>Nothing yet</EmptyTitle></EmptyHeader></Empty>
            )}
          </div>
        </div>
        {current?.example && <ComingUp className={cn("shrink-0 border-t p-6 xl:w-80 xl:overflow-y-auto xl:border-t-0 xl:border-l", hifi ? "sm:px-8 sm:py-12 xl:w-84" : "sm:p-8 xl:px-6")} />}
      </div>
      <ItemPeek item={peeked} onClose={() => setPeekId(null)} onTask={setTaskId} />
      <TaskSheet task={openTask} onClose={() => setTaskId(null)} onChange={(patch) => openTask && patchTask(openTask.id, patch)} />
    </AppShell>
  )
}

function Lane({ title, count, children }: { title: string; count?: string; children: ReactNode }) {
  const hifi = useHifi()
  return (
    <section aria-label={title} className={cn("flex flex-col", hifi ? "gap-5" : "gap-3")}>
      <div className="flex h-8 items-center gap-2">
        <h2 className="type-section">{title}</h2>
        {count && <span className="text-sm text-muted-foreground tabular-nums">{count}</span>}
      </div>
      {children}
    </section>
  )
}

function RecapLine({ recap: r, unreadOf, onItem }: { recap: { project: { id: string; name: string }; summary: string; items: InboxItem[]; unread: number }; unreadOf: (i: InboxItem) => boolean; onItem: (i: InboxItem) => void }) {
  const [open, setOpen] = useState(false)
  const hifi = useHifi()
  return (
    <li>
      <button type="button" onClick={() => (r.items.length ? setOpen((o) => !o) : navigate(`/p/${r.project.id}/home`))} aria-expanded={r.items.length ? open : undefined} className={cn("flex w-full items-center text-left transition-colors hover:bg-muted/50", hifi ? "gap-4 rounded-2xl px-3 py-3.5" : "gap-3 rounded-lg px-3 py-2.5")}>
        <ProjectMark project={r.project.id} className={hifi ? "size-9 rounded-xl" : "size-7 rounded-md"} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{r.project.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{r.summary}</span>
        </span>
        {r.unread > 0 && <CountBadge n={r.unread} suffix="new" size="md" />}
        {r.items.length > 0 ? <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} /> : <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <ul className="mb-2 ml-10 flex flex-col border-l pl-3">
          {r.items.map((item) => {
            const unread = unreadOf(item)
            return (
              <li key={item.id}>
                <button type="button" onClick={() => onItem(item)} className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left hover:bg-muted/50">
                  <span aria-label={unread ? "Unread" : "Read"} className={cn("mt-2 block size-1.5 shrink-0 rounded-full", unread ? "bg-foreground" : "bg-transparent")} />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm leading-5", unread ? "font-semibold" : "font-medium")}>{item.summary}</span>
                    <InboxWhere item={item} className="mt-1 text-[11px] text-muted-foreground" />
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}

// The detail behind a row, as a side peek: what the Inbox's right pane showed.
function ItemPeek({ item, onClose, onTask }: { item?: InboxItem; onClose: () => void; onTask: (id: string) => void }) {
  const { inboxState, setInboxRead, setInboxDone, setInviteResponse, openDecision, patchTask, reminders, setReminder, confirmDecision } = useStore()
  const tasks = useAllTasks()
  const statusOf = useStatusOf()
  const decision = useDecision(item?.decision)
  const task = tasks.find((t) => t.id === item?.task)
  const session = SESSIONS.find((s) => s.id === item?.meeting?.sessionId)
  const response = item ? inboxState[item.id]?.response : undefined
  const unread = item ? !(inboxState[item.id]?.read ?? !item.unread) : false
  const done = item ? !!inboxState[item.id]?.done || task?.status === "done" : false
  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent resizeKey="today-item" onOpenAutoFocus={(e) => e.preventDefault()} className="w-[560px] gap-0 overflow-y-auto sm:max-w-[560px]">
        {item && (
          <div className="flex flex-col gap-6 p-8">
            <header className="flex flex-col gap-2">
              <SheetDescription className="flex items-center gap-2 text-xs">
                {item.need && <Badge variant="outline" className="font-normal">{labelOf(item)}</Badge>}
                <InboxWhere item={item} />
              </SheetDescription>
              <SheetTitle className="type-title">{item.meeting ? session?.title ?? item.summary : item.summary}</SheetTitle>
              {item.touches && <p className="text-sm text-muted-foreground">Touches {item.touches.charAt(0).toLowerCase() + item.touches.slice(1)}</p>}
            </header>
            <div className="flex flex-wrap items-center gap-2">
              {item.relatedArtifacts.length > 0 && !item.meeting && (
                <Button variant="ghost" size="sm" aria-pressed={!!reminders[item.id]} onClick={() => { setReminder(item.id, !reminders[item.id]); toast(reminders[item.id] ? "Reminder off" : "Reminder set") }}>
                  {reminders[item.id] ? <BellOff /> : <Bell />}{reminders[item.id] ? "Reminder on" : "Remind me when I open it"}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setInboxRead(item.id, unread)}>{unread ? <MailOpen /> : <Mail />}{unread ? "Mark read" : "Mark unread"}</Button>
              <Button variant="outline" size="sm" onClick={() => { setInboxDone(item.id, !done); toast(done ? "Back on Today" : "Handled"); if (!done) onClose() }}>{done ? <RotateCcw /> : <Check />}{done ? "Put back" : "Done"}</Button>
            </div>
            {item.meeting ? (
              <section aria-label="Meeting invitation" className="space-y-4">
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0" />{new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone: item.meeting.timezone }).format(new Date(item.meeting.startsAt))} · {Math.round((Date.parse(item.meeting.endsAt) - Date.parse(item.meeting.startsAt)) / 60000)} min</p>
                  <p>Invited by {PEOPLE[item.from]?.name}</p>
                </div>
                <p className="text-sm leading-6">{item.meeting.agenda ?? item.body}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant={response === "accepted" ? "secondary" : "default"} aria-pressed={response === "accepted"} onClick={() => setInviteResponse(item.id, "accepted")}><Check />{response === "accepted" ? "Accepted" : "Accept"}</Button>
                  <Button size="sm" variant={response === "declined" ? "secondary" : "outline"} aria-pressed={response === "declined"} onClick={() => setInviteResponse(item.id, "declined")}><X />{response === "declined" ? "Declined" : "Decline"}</Button>
                </div>
              </section>
            ) : <p className="text-sm leading-7">{item.body}</p>}
            {item.need === "do" && task && (
              <section aria-label="Task" className="space-y-3 rounded-xl bg-muted p-4">
                <div className="flex items-start gap-3">
                  <button type="button" onClick={() => { onClose(); onTask(task.id) }} className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium hover:underline">{task.title}</p>
                    <p className="text-xs text-muted-foreground">Due {task.due}{task.tool ? ` · ${task.tool}` : ""}</p>
                  </button>
                  <Button size="sm" variant={task.status === "done" ? "secondary" : "default"} onClick={() => {
                    const finished = task.status !== "done"
                    patchTask(task.id, { status: finished ? "done" : "todo" })
                    if (finished) toast("Task done", { action: { label: "Undo", onClick: () => patchTask(task.id, { status: task.status }) } })
                  }}><Check />{task.status === "done" ? "Done" : "Mark done"}</Button>
                </div>
                {task.prompt && (
                  <div className="space-y-2 rounded-md bg-background/60 p-3">
                    <p className="text-sm leading-relaxed whitespace-pre-line">{task.prompt}</p>
                    <Button size="sm" variant="outline" onClick={() => { try { void navigator.clipboard?.writeText(task.prompt!) } catch { /* clipboard blocked: the toast still explains */ } toast("Prompt copied") }}><Copy />Copy prompt</Button>
                  </div>
                )}
              </section>
            )}
            {item.need === "decide" && decision && (
              <section aria-label="Decision" className="space-y-3 rounded-xl bg-muted p-4">
                <div className="flex items-center gap-2"><StatusBadge status={statusOf(decision)} /><span className="text-xs text-muted-foreground">{decision.by ?? PEOPLE[decision.owner]?.name} · {decision.part}</span></div>
                <p className="text-sm font-medium">{decision.title}</p>
                {decision.why && <p className="text-sm text-muted-foreground">{decision.why}</p>}
                <div className="flex flex-wrap gap-2">
                  {(statusOf(decision) === "inf" || statusOf(decision) === "prec") && decision.owner === ME.id && (
                    <Button size="sm" onClick={() => { confirmDecision(decision.id); setInboxDone(item.id, true); toast("Decision confirmed"); onClose() }}><Check />Confirm</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => { onClose(); openDecision(decision.id) }}>Open decision</Button>
                </div>
              </section>
            )}
            {(item.relatedArtifacts.length > 0 || decision) && (
              <section aria-label="Related" className="space-y-2.5">
                <h3 className="type-label text-muted-foreground">Related</h3>
                <div className="flex flex-wrap gap-2">
                  {item.relatedArtifacts.map((ref) => {
                    const artifact = ARTIFACTS.find((a) => a.id === ref.id)
                    if (!artifact) return null
                    const Icon = KIND_ICON[artifact.kind]
                    return (
                      <button key={artifact.id} type="button" onClick={() => { onClose(); navigate(`/p/${artifact.project}/artifacts/${artifact.id}`) }} className="inline-flex max-w-full items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors hover:bg-muted">
                        <Icon className="size-3.5 shrink-0 text-muted-foreground" /><span className="max-w-56 truncate">{artifact.name}</span>
                      </button>
                    )
                  })}
                  {decision && !item.need && <button type="button" onClick={() => { onClose(); openDecision(decision.id) }} className="inline-flex max-w-full items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors hover:bg-muted"><StatusIcon status={statusOf(decision)} className="size-3.5 shrink-0 text-muted-foreground" /><span className="max-w-56 truncate">{decision.title}</span></button>}
                </div>
              </section>
            )}
            <footer className="space-y-1 text-[11px] leading-5 text-muted-foreground">
              <p>{item.author.kind === "ai" ? "Written by Whyspace" : `Comment by ${item.author.name}`}</p>
              {!item.relatedArtifacts.length && <p>Source: {item.source}</p>}
            </footer>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

const useDecision = (id?: string) => DECISIONS.find((d) => d.id === id)
