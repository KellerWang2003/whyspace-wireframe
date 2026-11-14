import { useState } from "react"
import { toast } from "sonner"
import { Bell, BellOff, CalendarDays, Check, Copy, X, Inbox as InboxIcon, Mail, MailOpen, RotateCcw } from "lucide-react"
import { ProjectLabel } from "@/components/app/project-mark"
import { DESIGN } from "@/lib/design"
import { InboxWhere } from "@/app/where"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppShell } from "@/components/app/app-shell"
import { PersonAvatar } from "@/components/app/person"
import { StatusBadge, StatusIcon } from "@/components/app/status-badge"
import { ARTIFACTS, DECISIONS, INBOX, ME, PEOPLE, SESSIONS, type InboxItem, type InboxKind } from "@/data"
import { useStore } from "@/lib/store"
import { useStatusOf, useTasks } from "@/lib/work"
import { KIND_ICON } from "@/playground/artifact"
import { cn } from "@/lib/utils"
import { ResizeHandle } from "@/components/app/resize-handle"
import { usePanelWidth } from "@/lib/use-panel-width"
import { TODAY } from "@/playground/model"
import { Calendar } from "@/components/app/calendar/calendar"
import { dateOfDay, fmtDay, fmtTime, useEvents } from "@/components/app/calendar/events"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// The Inbox only gets items that touch your work: you own the affected artifact, lead the part,
// or follow the decision. Everything else waits on each project's Home. Items needing you are Decide
// (confirm, review, sign off) or Do (a task, with its ready prompt). The rest is FYI.
type InboxCategory = "needs" | "fyi" | "done"

const CATEGORIES = [
  { id: "needs", label: "Needs you" },
  { id: "fyi", label: "FYI" },
  { id: "done", label: "Done" },
] as const

const KIND_LABEL: Record<InboxKind, string> = {
  review: "Decision review", change: "Project update", alert: "Possible misalignment", invite: "Meeting invitation", mention: "Mention",
}
const labelOf = (item: InboxItem) => (item.need === "do" ? "Do" : item.need === "decide" ? "Decide" : KIND_LABEL[item.kind])

export function Inbox() {
  const { current, inboxState, setInboxRead, setInboxDone, setInviteResponse, openDecision, patchTask, reminders, setReminder, confirmDecision } = useStore()
  const tasks = useTasks()
  const statusOf = useStatusOf()
  const items = current?.example ? INBOX : []
  const [category, setCategory] = useState<InboxCategory>("needs")
  const [selectedId, setSelectedId] = useState<string>()
  const [listWidth, setListWidth] = usePanelWidth("inbox-list", 340)
  const isUnread = (item: InboxItem) => !(inboxState[item.id]?.read ?? !item.unread)
  const taskOf = (item?: InboxItem) => tasks.find((t) => t.id === item?.task)
  // A Do item is done when its task is, wherever the task was finished.
  const isDone = (item: InboxItem) => !!inboxState[item.id]?.done || taskOf(item)?.status === "done"
  const matches = (item: InboxItem, tab: InboxCategory) => tab === "done" ? isDone(item) : !isDone(item) && (tab === "needs" ? !!item.need : !item.need)
  const list = items.filter((item) => matches(item, category))
  const count = (tab: InboxCategory) => items.filter((item) => matches(item, tab)).length
  const selected = list.find((item) => item.id === selectedId)
  const decision = DECISIONS.find((item) => item.id === selected?.decision)
  const task = taskOf(selected)
  const session = SESSIONS.find((item) => item.id === selected?.meeting?.sessionId)
  const response = selected ? inboxState[selected.id]?.response : undefined

  function selectItem(item: InboxItem) {
    setSelectedId(item.id)
    setInboxRead(item.id, true)
  }

  function toggleDone(item: InboxItem) {
    const nextDone = !isDone(item)
    setInboxDone(item.id, nextDone)
    const next = list[list.findIndex((entry) => entry.id === item.id) + 1] ?? list.find((entry) => entry.id !== item.id)
    if (next) selectItem(next)
    else setSelectedId(undefined)
    toast(nextDone ? "Notification marked done" : "Notification moved to inbox", {
      action: { label: "Undo", onClick: () => { setInboxDone(item.id, !nextDone); setSelectedId(item.id) } },
    })
  }

  return (
    <AppShell crumbs={[{ label: "Inbox" }]}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b px-6 pt-2">
          <h1 className="sr-only">Inbox</h1>
          <Tabs value={category} onValueChange={(value) => { setCategory(value as InboxCategory); setSelectedId(undefined) }}>
            <TabsList variant="line" aria-label="Inbox filters" className="h-auto max-w-full justify-start gap-5 overflow-x-auto p-0">
              {CATEGORIES.map(({ id, label }) => (
                <TabsTrigger key={id} value={id} className="h-10 flex-none gap-1.5 rounded-none px-0 after:bottom-0!">
                  {label}
                  {id !== "done" && <span className="text-xs tabular-nums text-muted-foreground">{count(id)}</span>}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div style={{ "--inbox-list": `${listWidth}px` } as React.CSSProperties} className="relative grid min-h-0 flex-1 grid-rows-[minmax(180px,0.7fr)_minmax(0,1fr)] md:grid-cols-[var(--inbox-list)_minmax(0,1fr)] md:grid-rows-1">
          <ResizeHandle edge="right" getWidth={() => listWidth} onWidth={setListWidth} min={240} max={640} reset={340} className="right-auto left-[calc(var(--inbox-list)-4px)] hidden md:block" />
          <ScrollArea className="min-h-0 border-b md:border-r md:border-b-0">
            {list.length === 0 ? (
              <Empty className="border-0 px-5 py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><InboxIcon /></EmptyMedia>
                  <EmptyTitle>{category === "done" ? "Nothing done yet" : category === "needs" ? "Nothing needs you" : "No updates"}</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : list.map((item) => (
              <button key={item.id} aria-pressed={selected?.id === item.id} onClick={() => selectItem(item)} className={cn("flex w-full items-start gap-3 border-b px-5 py-5 text-left transition-colors hover:bg-muted/60", selected?.id === item.id && "bg-muted/70")}>
                <div className="relative mt-0.5 shrink-0">
                  {item.author.kind === "person" ? <PersonAvatar id={item.from} className="size-7" /> : <span aria-label={isUnread(item) ? "Unread" : "Read"} className={cn("mt-1.5 block size-1.5 rounded-full", isUnread(item) ? "bg-foreground" : "bg-transparent")} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground"><span>{item.need ? <span className="font-medium text-foreground">{labelOf(item)}</span> : item.author.kind === "person" ? item.author.name : labelOf(item)}{item.need === "do" && taskOf(item) && ` · due ${taskOf(item)!.due}`}</span><span className="shrink-0">{item.time}</span></div>
                  <p className={cn("text-sm leading-5", isUnread(item) ? "font-semibold" : "font-medium")}>{item.summary}</p>
                  {item.touches && <p className="mt-1 truncate text-xs text-muted-foreground">Touches {item.touches.charAt(0).toLowerCase() + item.touches.slice(1)}</p>}
                  {DESIGN === "b" ? <InboxWhere item={item} className="mt-2.5 max-w-full text-[11px] text-muted-foreground" /> : <ProjectLabel project={item.project} className="mt-2.5 max-w-full text-[11px] text-muted-foreground" />}
                </div>
              </button>
            ))}
          </ScrollArea>
          <aside aria-label="Notification details" className="flex min-h-0 flex-col overflow-y-auto">
            {selected ? (
              <>
                <div className="sticky top-0 z-10 flex flex-wrap items-center justify-end gap-2 border-b bg-background px-5 py-3">
                  <div className="flex items-center gap-2">
                    {selected.relatedArtifacts.length > 0 && !selected.meeting && (
                      <Button variant="ghost" size="sm" aria-pressed={!!reminders[selected.id]} onClick={() => { setReminder(selected.id, !reminders[selected.id]); toast(reminders[selected.id] ? "Reminder off" : "Reminder set") }}>
                        {reminders[selected.id] ? <BellOff /> : <Bell />}{reminders[selected.id] ? "Reminder on" : "Remind me when I open it"}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setInboxRead(selected.id, isUnread(selected))}>
                      {isUnread(selected) ? <MailOpen /> : <Mail />}{isUnread(selected) ? "Mark read" : "Mark unread"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleDone(selected)}>
                      {isDone(selected) ? <RotateCcw /> : <Check />}{isDone(selected) ? "Move to inbox" : "Done"}
                    </Button>
                  </div>
                </div>
                <div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8 xl:px-10">
                  <header className="space-y-2">
                    {selected.need && <Badge variant="outline" className="font-normal">{labelOf(selected)}</Badge>}
                    <h2 className="type-heading">{selected.meeting ? session?.title ?? selected.summary : selected.summary}</h2>
                    {selected.touches && <p className="text-sm text-muted-foreground">Touches {selected.touches.charAt(0).toLowerCase() + selected.touches.slice(1)}</p>}
                  </header>
                  {selected.meeting ? (
                    <section aria-label="Meeting invitation" className="space-y-4">
                      <div className="space-y-1.5 text-sm text-muted-foreground">
                        <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0" />{new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone: selected.meeting.timezone }).format(new Date(selected.meeting.startsAt))} · {Math.round((Date.parse(selected.meeting.endsAt) - Date.parse(selected.meeting.startsAt)) / 60000)} min</p>
                        <p>Invited by {PEOPLE[selected.from].name}</p>
                      </div>
                      <p className="text-sm leading-6">{selected.meeting.agenda ?? selected.body}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" variant={response === "accepted" ? "secondary" : "default"} aria-pressed={response === "accepted"} onClick={() => setInviteResponse(selected.id, "accepted")}><Check />{response === "accepted" ? "Accepted" : "Accept"}</Button>
                        <Button size="sm" variant={response === "declined" ? "secondary" : "outline"} aria-pressed={response === "declined"} onClick={() => setInviteResponse(selected.id, "declined")}><X />{response === "declined" ? "Declined" : "Decline"}</Button>
                      </div>
                    </section>
                  ) : <p className="text-sm leading-7">{selected.body}</p>}
                  {selected.need === "do" && task && (
                    <section aria-label="Task" className="space-y-3 rounded-xl bg-muted p-4">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">Due {task.due}{task.tool ? ` · ${task.tool}` : ""}</p>
                        </div>
                        <Button size="sm" variant={task.status === "done" ? "secondary" : "default"} onClick={() => {
                          const done = task.status !== "done"
                          patchTask(task.id, { status: done ? "done" : "todo" })
                          if (done) toast("Task done", { action: { label: "Undo", onClick: () => patchTask(task.id, { status: task.status }) } })
                        }}><Check />{task.status === "done" ? "Done" : "Mark done"}</Button>
                      </div>
                      {task.prompt && (
                        <div className="space-y-2 rounded-md bg-muted/40 p-3">
                          <p className="text-sm leading-relaxed">{task.prompt}</p>
                          <Button size="sm" variant="outline" onClick={() => {
                            try { void navigator.clipboard?.writeText(task.prompt!) } catch { /* clipboard blocked: the toast still explains */ }
                            toast("Prompt copied")
                          }}><Copy />Copy prompt</Button>
                        </div>
                      )}
                    </section>
                  )}
                  {selected.need === "decide" && decision && (
                    <section aria-label="Decision" className="space-y-3 rounded-xl bg-muted p-4">
                      <div className="flex items-center gap-2"><StatusBadge status={statusOf(decision)} /><span className="text-xs text-muted-foreground">{decision.by ?? PEOPLE[decision.owner]?.name} · {decision.part}</span></div>
                      <p className="text-sm font-medium">{decision.title}</p>
                      {decision.why && <p className="text-sm text-muted-foreground">{decision.why}</p>}
                      <div className="flex flex-wrap gap-2">
                        {statusOf(decision) === "inf" && decision.owner === ME.id && (
                          <Button size="sm" onClick={() => { confirmDecision(decision.id); setInboxDone(selected.id, true); toast("Decision confirmed") }}><Check />Confirm</Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => openDecision(decision.id)}>Open decision</Button>
                      </div>
                    </section>
                  )}
                  {(selected.relatedArtifacts.length > 0 || decision) && (
                    <section aria-labelledby="related-context-title" className="space-y-2.5">
                      <h3 id="related-context-title" className="text-xs text-muted-foreground">Related</h3>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {selected.relatedArtifacts.map((reference) => {
                          const artifact = ARTIFACTS.find((item) => item.id === reference.id)
                          if (!artifact) return null
                          const Icon = KIND_ICON[artifact.kind]
                          return (
                            <a key={artifact.id} href={`#/p/${artifact.project}/artifacts/${artifact.id}`} className="inline-flex max-w-full shrink-0 items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
                              <Icon className="size-3.5 shrink-0 text-muted-foreground" /><span className="max-w-56 truncate">{artifact.name}</span>
                            </a>
                          )
                        })}
                        {decision && <button onClick={() => openDecision(decision.id)} aria-label={`Decision: ${decision.title}`} title={`Decision · ${decision.title}`} className="inline-flex max-w-full shrink-0 items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"><StatusIcon status={statusOf(decision)} className="size-3.5 shrink-0 text-muted-foreground" /><span className="max-w-56 truncate">{decision.title}</span></button>}
                      </div>
                    </section>
                  )}
                  <footer className="space-y-1 pt-2 text-[11px] leading-5 text-muted-foreground">
                    <p>{selected.author.kind === "ai" ? "Generated by Whyspace" : `Comment by ${selected.author.name}`}</p>
                    {!selected.relatedArtifacts.length && <p>Source: {selected.source}</p>}
                  </footer>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6">
                <Empty className="border-0"><EmptyHeader><EmptyMedia variant="icon"><InboxIcon /></EmptyMedia><EmptyTitle>Select an item</EmptyTitle></EmptyHeader></Empty>
              </div>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  )
}

// Meetings across all your projects, next first, as a vertical list grouped by day.
// Reads the same calendar the project Home edits. Calendar opens every project on one calendar.
// Lives on My tasks (Inbox is for what needs you now).
export function ComingUp({ className, limit = 8 }: { className?: string; limit?: number }) {
  const [open, setOpen] = useState(false)
  const from = dateOfDay(TODAY)
  const next = useEvents()
    .filter((e) => e.status === "Live" || (e.status === "Scheduled" && e.end >= from))
    .sort((a, b) => Number(b.status === "Live") - Number(a.status === "Live") || a.start - b.start)
    .slice(0, limit)
  const days: [string, typeof next][] = []
  for (const e of next) {
    const day = e.status === "Live" ? "Now" : fmtDay(e.start)
    const group = days.find(([d]) => d === day)
    if (group) group[1].push(e)
    else days.push([day, [e]])
  }
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex h-8 items-center justify-between">
        <h2 className="type-section">Coming up</h2>
        <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => setOpen(true)}><CalendarDays />Calendar</Button>
      </div>
      {days.length === 0 && <p className="text-sm text-muted-foreground">Nothing scheduled.</p>}
      {days.map(([day, events]) => (
        <div key={day} className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">{day}</p>
          {events.map((e) => (
            <div key={e.id} className="flex gap-3 px-2 py-1.5 text-sm">
              <span className="w-10 shrink-0 tabular-nums text-muted-foreground">{e.status === "Live" ? "Live" : fmtTime(e.start)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{e.title}</span>
                <ProjectLabel project={e.project} className="text-xs text-muted-foreground" />
              </span>
            </div>
          ))}
        </div>
      ))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader><DialogTitle>All projects</DialogTitle></DialogHeader>
          <Calendar today={TODAY} title={null} />
        </DialogContent>
      </Dialog>
    </section>
  )
}
