import { useState } from "react"
import { toast } from "sonner"
import { Inbox as InboxIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ProjectLabel } from "@/components/app/project-mark"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AppShell } from "@/components/app/app-shell"
import { PersonAvatar } from "@/components/app/person"
import { StatusBadge } from "@/components/app/status-badge"
import { DECISIONS, INBOX, INBOX_KIND_LABEL, PEOPLE, type InboxKind } from "@/data"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const ACTIONS: Record<InboxKind, [string, string]> = {
  review: ["Confirm", "Edit first"],
  change: ["Got it", "Ask why"],
  alert: ["Ask why", "Flag it"],
  invite: ["Join session", "Decline"],
  mention: ["Reply", "Open"],
}

export function Inbox() {
  const { current } = useStore()
  const items = current?.example ? INBOX : []
  const [filter, setFilter] = useState<"all" | InboxKind>("all")
  const [selectedId, setSelectedId] = useState(items[0]?.id)
  const list = items.filter((i) => filter === "all" || i.kind === filter)
  const selected = items.find((i) => i.id === selectedId)
  const decision = DECISIONS.find((d) => d.id === selected?.decision)

  return (
    <AppShell crumbs={[{ label: "Inbox" }]}>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-h-0 flex-col border-r">
          <div className="flex flex-col gap-4 p-6 pb-4">
            <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
            <ToggleGroup type="single" variant="outline" size="sm" value={filter} onValueChange={(v) => v && setFilter(v as typeof filter)} spacing={2} className="flex-wrap">
              <ToggleGroupItem value="all" className="px-3">All · {items.length}</ToggleGroupItem>
              {(Object.keys(INBOX_KIND_LABEL) as InboxKind[]).map((k) => (
                <ToggleGroupItem key={k} value={k} className="px-3">
                  {INBOX_KIND_LABEL[k]} · {items.filter((i) => i.kind === k).length}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <Separator />
          <ScrollArea className="min-h-0 flex-1">
            {list.length === 0 && (
              <Empty className="py-24">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><InboxIcon /></EmptyMedia>
                  <EmptyTitle>You're all caught up</EmptyTitle>
                  <EmptyDescription>Decisions to review, changes and mentions show up here.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
            {list.map((i) => (
              <button
                key={i.id}
                onClick={() => setSelectedId(i.id)}
                className={cn("flex w-full items-start gap-3 border-b px-6 py-4 text-left hover:bg-accent/50", selectedId === i.id && "bg-accent")}
              >
                <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", i.unread ? "bg-foreground" : "bg-transparent")} />
                <PersonAvatar id={i.from} className="size-8" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ProjectLabel project={i.project} className="text-foreground" />·<span>{INBOX_KIND_LABEL[i.kind]}</span>
                    <span className="ml-auto">{i.time}</span>
                  </div>
                  <div className={cn("truncate text-sm", i.unread && "font-medium")}>{i.summary}</div>
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>

        {/* Preview pane: act on the item without leaving the inbox */}
        <aside className="flex min-h-0 flex-col">
          {selected ? (
            <div className="flex flex-col gap-5 p-6">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{INBOX_KIND_LABEL[selected.kind]}</Badge>
                <span className="text-xs text-muted-foreground">{selected.time} ago</span>
              </div>
              <h2 className="text-lg font-semibold leading-snug">{selected.summary}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PersonAvatar id={selected.from} />
                {PEOPLE[selected.from].name} · <ProjectLabel project={selected.project} />
              </div>
              <p className="text-sm">{selected.body}</p>
              {decision && (
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{decision.title}</span>
                    <StatusBadge status={decision.status} />
                  </div>
                  {decision.snippet && <blockquote className="border-l-2 pl-3 text-sm text-muted-foreground">“{decision.snippet}”</blockquote>}
                  {decision.why && <p className="text-sm text-muted-foreground">{decision.why}</p>}
                  <Button variant="link" className="h-auto p-0" onClick={() => navigate(`/decisions/${decision.id}`)}>Open decision</Button>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={() => toast(ACTIONS[selected.kind][0])}>{ACTIONS[selected.kind][0]}</Button>
                <Button variant="outline" onClick={() => toast(ACTIONS[selected.kind][1])}>{ACTIONS[selected.kind][1]}</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Nothing selected</div>
          )}
        </aside>
      </div>
    </AppShell>
  )
}
