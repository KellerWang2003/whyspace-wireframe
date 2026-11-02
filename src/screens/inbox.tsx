import { useState } from "react"
import { toast } from "sonner"
import { ArrowUpRight, Bell, BellOff, CalendarDays, Check, Copy, X, Inbox as InboxIcon, Mail, MailOpen, RotateCcw } from "lucide-react"
import { ProjectLabel } from "@/components/app/project-mark"
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

// The Inbox only gets items that touch your work: you own the affected artifact, lead the part,
// or follow the decision. Everything else waits in Catch up. Items needing you are Decide
// (confirm, review, sign off) or Do (a task, with its ready prompt). The rest is FYI.
type InboxCategory = "needs" | "fyi" | "done"

const CATEGORIES = [
  { id: "needs", label: "Needs you" },
  { id: "fyi", label: "FYI" },
  { id: "done", label: "Done" },
] as const

const KIND_LABEL: Record<InboxKind, string> = {
  review: "Decision review", change: "Project update", alert: "Possible misalignment", invite: "Session invitation", mention: "Mention",
}
const labelOf = (item: InboxItem) => (item.need === "do" ? "Do" : item.need === "decide" ? "Decide" : KIND_LABEL[item.kind])

export function Inbox() {
  const { current, inboxState, setInboxRead, setInboxDone, setInviteResponse, openDecision, patchTask, reminders, setReminder, confirmDecision } = useStore()
  const tasks = useTasks()
  const statusOf = useStatusOf()
  const items = current?.example ? INBOX : []
  const [category, setCategory] = useState<InboxCategory>("needs")
  const [selectedId, setSelectedId] = useState<string>()
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
        <div className="grid min-h-0 flex-1 grid-rows-[minmax(180px,0.7fr)_minmax(0,1fr)] md:grid-cols-[240px_minmax(0,1fr)] md:grid-rows-1 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
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
                  <ProjectLabel project={item.project} className="mt-2.5 max-w-full text-[11px] text-muted-foreground" />
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
                      <Button variant="ghost" size="sm" aria-pressed={!!reminders[selected.id]} title="Show again in the overlay when you open the file" onClick={() => { setReminder(selected.id, !reminders[selected.id]); toast(reminders[selected.id] ? "Reminder off" : "Reminder set") }}>
                        {reminders[selected.id] ? <BellOff /> : <Bell />}{reminders[selected.id] ? "Reminder on" : "Remind me when I open it"}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setInboxRead(selected.id, isUnread(selected))}>
                      {isUnread(selected) ? <MailOpen /> : <Mail />}{isUnread(selected) ? "Mark read" : "Mark unread"}
                    </Button>
                    <Button variant="outline" size="sm" title={isDone(selected) ? "Move back to Inbox" : "Clear without changing the work"} onClick={() => toggleDone(selected)}>
                      {isDone(selected) ? <RotateCcw /> : <Check />}{isDone(selected) ? "Move to inbox" : "Done"}
                    </Button>
                  </div>
                </div>
                <div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8 xl:px-10">
                  <header className="space-y-2">
                    {selected.need && <Badge variant="outline" className="font-normal">{labelOf(selected)}</Badge>}
                    <h2 className="text-xl font-semibold leading-snug tracking-tight">{selected.meeting ? session?.title ?? selected.summary : selected.summary}</h2>
                    {selected.touches && <p className="text-sm text-muted-foreground">Touches {selected.touches.charAt(0).toLowerCase() + selected.touches.slice(1)}</p>}
                  </header>
                  {selected.meeting ? (
                    <section aria-label="Session invitation" className="space-y-4">
                      <div className="space-y-1.5 text-sm text-muted-foreground">
                        <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0" />{new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone: selected.meeting.timezone }).format(new Date(selected.meeting.startsAt))} · {Math.round((Date.parse(selected.meeting.endsAt) - Date.parse(selected.meeting.startsAt)) / 60000)} min</p>
                        <p>Invited by {PEOPLE[selected.from].name}</p>
                      </div>
                      <p className="text-sm leading-6">{selected.meeting.agenda ?? selected.body}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" variant={response === "accepted" ? "secondary" : "default"} aria-pressed={response === "accepted"} onClick={() => setInviteResponse(selected.id, "accepted")}><Check />{response === "accepted" ? "Accepted" : "Accept"}</Button>
                        <Button size="sm" variant={response === "declined" ? "secondary" : "outline"} aria-pressed={response === "declined"} onClick={() => setInviteResponse(selected.id, "declined")}><X />{response === "declined" ? "Declined" : "Decline"}</Button>
                        {session && <a href={`#/p/${session.project}/sessions/${session.id}`} className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">View session<ArrowUpRight className="size-3" /></a>}
                      </div>
                    </section>
                  ) : <p className="text-sm leading-7">{selected.body}</p>}
                  {selected.need === "do" && task && (
                    <section aria-label="Task" className="space-y-3 rounded-lg border p-4">
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
                    <section aria-label="Decision" className="space-y-3 rounded-lg border p-4">
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
                            <a key={artifact.id} href={`#/p/${artifact.project}/artifacts/${artifact.id}`} title={`${artifact.name} · ${PEOPLE[artifact.owner]?.name} — ${reference.context}`} className="inline-flex max-w-full shrink-0 items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
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
