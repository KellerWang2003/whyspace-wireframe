import { useRef, useState, type DragEvent } from "react"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Plus, Shapes } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { PEOPLE, type Task } from "@/data"
import { navigate } from "@/lib/router"
import { VIEWER } from "@/lib/viewer"
import { useTasks } from "@/lib/work"
import { cn } from "@/lib/utils"
import { dayOf } from "@/playground/model"
import { AddArtifactDialog, ArtifactSheet, Tile, sourceOf, stateOf } from "@/screens/project-artifacts"
import { EmptyStart, StartThread } from "./empty-start"
import { ThreadIcon } from "./thread-ui"
import { threadOf, useArchived, useThreads, type Thread } from "./threads"
import { addArtifact, moveArtifact, removeArtifact, restoreArtifact, useArtifacts, type Item } from "./work"
import { ThreadToolbar } from "./thread-toolbar"

// Artifacts. Home: a shelf per thread, in sidebar order. A thread page: its own
// artifacts in a wrapping grid. Both open the same artifact sheet, and both take drops.

type NewItem = Omit<Item, "id" | "project" | "owner" | "updated" | "decisions" | "meta"> & { meta?: string }

function useArtifactActions(projectId: string) {
  const add = (a: NewItem) => {
    addArtifact({ id: `new-${Date.now()}`, project: projectId, owner: VIEWER, updated: "Just now", decisions: 0, meta: a.meta ?? "", ...a })
    toast(`Added to ${threadOf(projectId, a.part).name}`)
  }
  const move = (id: string, part: string) => { moveArtifact(id, part); toast(`Moved to ${threadOf(projectId, part).name}`) }
  const remove = (a: Item, after: () => void) => {
    removeArtifact(a.id)
    after()
    toast("Removed from Whyspace", { action: { label: "Undo", onClick: () => restoreArtifact(a.id) } })
  }
  // Drop a tile to move it, or drop a file or link straight into a thread.
  const drop = (all: Item[], part: string, e: DragEvent) => {
    e.preventDefault()
    const id = e.dataTransfer.getData("whyspace/artifact")
    if (id) { if (all.find((a) => a.id === id)?.part !== part) move(id, part); return }
    const file = e.dataTransfer.files[0]
    if (file) { add({ name: file.name, kind: "Doc", part, source: "Whyspace", where: `Uploaded · ${file.name}` }); return }
    const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain")
    if (url) add({ name: url.replace(/^https?:\/\//, "").slice(0, 40), part, url, where: url.replace(/^https?:\/\//, "").split("/")[0], ...sourceOf(url) })
  }
  return { add, move, remove, drop }
}

export const artifactMatches = (a: Item, query: string) => !query || `${a.name} ${a.source} ${a.where} ${a.part} ${PEOPLE[a.owner]?.name}`.toLowerCase().includes(query)

function AddTile({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={cn("flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-xs text-muted-foreground hover:border-foreground/40 hover:text-foreground", className)} style={{ minHeight: 172 }}>
      <Plus className="size-4" />Add
    </button>
  )
}

export function HomeArtifacts({ projectId, selectedId, search = "" }: { projectId: string; selectedId?: string; search?: string }) {
  const tasks = useTasks()
  const threads = useThreads(projectId)
  const archived = useArchived(projectId)
  const all = useArtifacts(projectId)
  const { add, move, remove, drop } = useArtifactActions(projectId)
  const [adding, setAdding] = useState<{ thread?: string } | null>(null)
  const query = search.trim().toLowerCase()
  const selected = all.find((a) => a.id === selectedId)
  const close = () => navigate(`/p/${projectId}/artifacts`)
  const parts = threads.map((t) => t.part)
  // Archived threads keep their shelf, last, while they still hold artifacts.
  const shelves = [...threads, ...archived.filter((t) => all.some((a) => a.part === t.part))]
  const visible = shelves.filter((t) => !query || all.some((a) => a.part === t.part && artifactMatches(a, query)))
  // Nothing here yet: one empty state instead of empty shelves.
  const empty = !all.length && !query
  if (empty && !threads.length && !archived.length) return <StartThread projectId={projectId} />

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {empty ? (
        <EmptyStart icon={Shapes} title="Add your first artifact" action={<Button size="sm" onClick={() => setAdding({})}><Plus />Add artifact</Button>} />
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setAdding({})}><Plus />Add</Button>
        </div>
      )}
      {!empty && visible.map((t) => (
        <Shelf key={t.id} projectId={projectId} thread={t} items={all.filter((a) => a.part === t.part && artifactMatches(a, query))} tasks={tasks} canAdd={!query && !t.archived}
          onOpen={(a) => navigate(`/p/${projectId}/artifacts/${a.id}`)} onAdd={() => setAdding({ thread: t.part })} onDrop={(e) => drop(all, t.part, e)} />
      ))}
      {!empty && !visible.length && <p className="py-12 text-center text-sm text-muted-foreground">No matches.</p>}
      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) close() }}>
        <SheetContent resizeKey="artifact" className="w-full gap-0 overflow-y-auto sm:max-w-md">
          {selected && <ArtifactSheet artifact={selected} tasks={tasks} threads={parts} onMove={(p) => move(selected.id, p)} onRemove={() => remove(selected, close)} />}
        </SheetContent>
      </Sheet>
      <AddArtifactDialog open={!!adding} thread={adding?.thread} threads={parts} onClose={() => setAdding(null)} onAdd={add} />
    </div>
  )
}

// One thread's shelf on Home: its name links to the thread, tiles scroll sideways.
function Shelf({ projectId, thread, items, tasks, canAdd, onOpen, onAdd, onDrop }: { projectId: string; thread: Thread; items: Item[]; tasks: Task[]; canAdd: boolean; onOpen: (a: Item) => void; onAdd: () => void; onDrop: (e: DragEvent) => void }) {
  const row = useRef<HTMLDivElement>(null)
  const [over, setOver] = useState(false)
  const scroll = (dir: number) => row.current?.scrollBy({ left: dir * 440, behavior: "smooth" })
  return (
    <section
      className={cn("group/thread rounded-xl transition-colors", over && "bg-muted/60")}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { setOver(false); onDrop(e) }}
    >
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(`/p/${projectId}/t/${thread.id}/artifacts`)} className={cn("flex items-center gap-1.5 text-sm font-medium hover:underline", thread.archived && "text-muted-foreground")}>
          <ThreadIcon thread={thread} className={cn(thread.archived && "opacity-50")} />{thread.name}
        </button>
        <span className="text-xs tabular-nums text-muted-foreground">{items.length}</span>
        {thread.archived && <span className="text-xs text-muted-foreground">· Archived</span>}
      </div>
      <div className="relative">
        <div ref={row} className="flex gap-3 overflow-x-auto scroll-smooth pt-2 pb-2 [scrollbar-width:none]">
          {items.map((a) => <Tile key={a.id} artifact={a} needsUpdate={stateOf(a, tasks).pending.length > 0} onOpen={() => onOpen(a)} />)}
          {canAdd && <AddTile onClick={onAdd} className="w-52" />}
        </div>
        {items.length > 3 && (
          <>
            <Button size="icon-sm" variant="outline" aria-label="Scroll left" className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full opacity-0 shadow-sm transition group-hover/thread:opacity-100" onClick={() => scroll(-1)}><ChevronLeft /></Button>
            <Button size="icon-sm" variant="outline" aria-label="Scroll right" className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full opacity-0 shadow-sm transition group-hover/thread:opacity-100" onClick={() => scroll(1)}><ChevronRight /></Button>
          </>
        )}
      </div>
    </section>
  )
}

// A thread's own artifacts: a wrapping grid, needs-update first.
export function ThreadArtifacts({ projectId, thread, selectedId, search = "" }: { projectId: string; thread: Thread; selectedId?: string; search?: string }) {
  const tasks = useTasks()
  const threads = useThreads(projectId)
  const all = useArtifacts(projectId)
  const { add, move, remove, drop } = useArtifactActions(projectId)
  const [adding, setAdding] = useState(false)
  const [over, setOver] = useState(false)
  const query = search.trim().toLowerCase()
  const base = `/p/${projectId}/t/${thread.id}/artifacts`
  const mine = all.filter((a) => a.part === thread.part)
  const pending = (a: Item) => stateOf(a, tasks).pending.length > 0
  // Newest-changed first: "Just now", "2 h ago" and "Today" count as today.
  const when = (a: Item) => (/now|ago|Today/i.test(a.updated) ? 99 : a.updated === "Yesterday" ? 98 : dayOf(a.updated) ?? 0)
  const items = mine.filter((a) => artifactMatches(a, query)).sort((a, b) => Number(pending(b)) - Number(pending(a)) || when(b) - when(a))
  const selected = mine.find((a) => a.id === selectedId)
  const close = () => navigate(base)

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <ThreadToolbar>
        <div className="ml-auto flex items-center gap-2"><Button size="sm" onClick={() => setAdding(true)}><Plus />Add</Button></div>
      </ThreadToolbar>
      <div
        className={cn("grid grid-cols-[repeat(auto-fill,13rem)] gap-3 rounded-xl transition-colors", over && "bg-muted/60")}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { setOver(false); drop(all, thread.part, e) }}
      >
        {items.map((a) => <Tile key={a.id} artifact={a} needsUpdate={pending(a)} onOpen={() => navigate(`${base}/${a.id}`)} />)}
        {!query && <AddTile onClick={() => setAdding(true)} className="w-52" />}
      </div>
      {query && !items.length && <p className="py-12 text-center text-sm text-muted-foreground">No matches.</p>}
      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) close() }}>
        <SheetContent resizeKey="artifact" className="w-full gap-0 overflow-y-auto sm:max-w-md">
          {selected && <ArtifactSheet artifact={selected} tasks={tasks} threads={threads.map((t) => t.part)} onMove={(p) => move(selected.id, p)} onRemove={() => remove(selected, close)} />}
        </SheetContent>
      </Sheet>
      <AddArtifactDialog open={adding} thread={thread.part} threads={threads.map((t) => t.part)} onClose={() => setAdding(false)} onAdd={add} />
    </div>
  )
}
