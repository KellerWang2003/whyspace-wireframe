import { useState } from "react"
import { toast } from "sonner"
import { ArrowUpRight, CalendarDays, Check, X, Inbox as InboxIcon, Mail, MailOpen, RotateCcw } from "lucide-react"
import { ProjectLabel } from "@/components/app/project-mark"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppShell } from "@/components/app/app-shell"
import { PersonAvatar } from "@/components/app/person"
import { StatusIcon } from "@/components/app/status-badge"
import { ARTIFACTS, DECISIONS, INBOX, PEOPLE, SESSIONS, type InboxItem, type InboxKind } from "@/data"
import { useStore } from "@/lib/store"
import { KIND_ICON } from "@/playground/artifact"
import { cn } from "@/lib/utils"

type InboxCategory = "all" | "priority" | "review" | "updates" | "done"

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "priority", label: "Priority" },
  { id: "review", label: "To review" },
  { id: "updates", label: "Updates" },
  { id: "done", label: "Done" },
] as const

const KIND_LABEL: Record<InboxKind, string> = {
  review: "Decision review", change: "Project update", alert: "Possible misalignment", invite: "Session invitation", mention: "Mention",
}

function categoryOf(item: InboxItem) {
  return item.kind === "alert" ? "priority" : item.kind === "review" ? "review" : "updates"
}

export function Inbox() {
  const { current, inboxState, setInboxRead, setInboxDone, setInviteResponse } = useStore()
  const items = current?.example ? INBOX : []
  const [category, setCategory] = useState<InboxCategory>("all")
  const [selectedId, setSelectedId] = useState<string>()
  const isUnread = (item: InboxItem) => !(inboxState[item.id]?.read ?? !item.unread)
  const isDone = (item: InboxItem) => !!inboxState[item.id]?.done
  const matches = (item: InboxItem, tab: InboxCategory) => tab === "done" ? isDone(item) : !isDone(item) && (tab === "all" || categoryOf(item) === tab)
  const list = items.filter((item) => matches(item, category))
  const selected = list.find((item) => item.id === selectedId)
  const decision = DECISIONS.find((item) => item.id === selected?.decision)
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
                  <EmptyTitle>{category === "done" ? "No completed notifications" : "You're all caught up"}</EmptyTitle>
                  <EmptyDescription>{category === "done" ? "Notifications you mark done will appear here." : "New notifications will appear here."}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : list.map((item) => (
              <button key={item.id} aria-pressed={selected?.id === item.id} onClick={() => selectItem(item)} className={cn("flex w-full items-start gap-3 border-b px-5 py-5 text-left transition-colors hover:bg-muted/60", selected?.id === item.id && "bg-muted/70")}>
                <div className="relative mt-0.5 shrink-0">
                  {item.author.kind === "person" ? <PersonAvatar id={item.from} className="size-7" /> : <span aria-label={isUnread(item) ? "Unread" : "Read"} className={cn("mt-1.5 block size-1.5 rounded-full", isUnread(item) ? "bg-foreground" : "bg-transparent")} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground"><span>{item.author.kind === "person" ? item.author.name : KIND_LABEL[item.kind]}</span><span className="shrink-0">{item.time}</span></div>
                  <p className={cn("text-sm leading-5", isUnread(item) ? "font-semibold" : "font-medium")}>{item.summary}</p>
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
                    <Button variant="ghost" size="sm" onClick={() => setInboxRead(selected.id, isUnread(selected))}>
                      {isUnread(selected) ? <MailOpen /> : <Mail />}{isUnread(selected) ? "Mark read" : "Mark unread"}
                    </Button>
                    <Button variant="outline" size="sm" title={isDone(selected) ? "Return this notification to your inbox" : "Clear this notification without changing the related work"} onClick={() => toggleDone(selected)}>
                      {isDone(selected) ? <RotateCcw /> : <Check />}{isDone(selected) ? "Move to inbox" : "Done"}
                    </Button>
                  </div>
                </div>
                <div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8 xl:px-10">
                  <header>
                    <h2 className="text-xl font-semibold leading-snug tracking-tight">{selected.meeting ? session?.title ?? selected.summary : selected.summary}</h2>
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
                        {decision && <a href={`#/p/${decision.project}/decisions/${decision.id}`} aria-label={`Decision: ${decision.title}`} title={`Decision · ${decision.title}`} className="inline-flex max-w-full shrink-0 items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"><StatusIcon status={decision.status} className="size-3.5 shrink-0 text-muted-foreground" /><span className="max-w-56 truncate">{decision.title}</span></a>}
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
                <Empty className="border-0"><EmptyHeader><EmptyMedia variant="icon"><InboxIcon /></EmptyMedia><EmptyTitle>Select a notification</EmptyTitle><EmptyDescription>Read the update and its source, then explore any related work.</EmptyDescription></EmptyHeader></Empty>
              </div>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  )
}
