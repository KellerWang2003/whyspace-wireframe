import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react"
import { FolderKanban } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { MarkIcon, StatusIcon } from "@/components/app/status-badge"
import { TaskSheet, TaskStatusIcon } from "@/components/app/tasks"
import { DECISIONS, MY_PROJECTS, TASK_STATUS_LABEL, type Status } from "@/data"
import { MARKS, MARK_LABEL, markOf, stateLabel, type Mark } from "@/lib/marks"
import { navigate, useRoute } from "@/lib/router"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useStatusOf, useWithdrawn } from "@/lib/work"
import { KIND_ICON } from "@/playground/artifact"
import { ThreadIcon, ThreadTag } from "./thread-ui"
import { threadsNow } from "./threads"
import { useAllTasks, useArtifactsOf } from "./work"

// ⌘K search: one big panel over every project. Tags under the field narrow it to one kind
// of work, and Decisions adds state tags. Each tag shows how many matches it holds.

type Kind = "decision" | "task" | "artifact" | "thread" | "project"
type Tag = Kind | "all"
type Hit = { key: string; kind: Kind; title: string; projectId: string; part?: string; status?: Status; icon: ReactNode; words: string; open: () => void }

const TAGS: { tag: Tag; label: string }[] = [
  { tag: "all", label: "All" },
  { tag: "decision", label: "Decisions" },
  { tag: "task", label: "Tasks" },
  { tag: "artifact", label: "Artifacts" },
  { tag: "thread", label: "Threads" },
]
const GROUP: Record<Kind, string> = { decision: "Decisions", task: "Tasks", artifact: "Artifacts", thread: "Threads", project: "Projects" }
const ORDER: Kind[] = ["decision", "task", "artifact", "thread", "project"]
// Unsettled marks first: those are the ones you go looking for.
const RANK: Mark[] = ["triangle", "empty", "ringed", "filled"]
const PER_GROUP = 5

const PROJECT_IDS = MY_PROJECTS.map((p) => p.id)
const projectOf = (id: string) => MY_PROJECTS.find((p) => p.id === id || p.name === id)
const short = (name: string) => name.replace(/\s*\(.*\)$/, "")
const icon = "size-4 shrink-0 text-muted-foreground"

export function SearchPanel() {
  const { searchOpen, setSearchOpen, current, patchTask } = useStore()
  const [, here] = useRoute()
  const tasks = useAllTasks()
  const artifacts = useArtifactsOf(PROJECT_IDS)
  const statusOf = useStatusOf()
  const withdrawn = useWithdrawn()
  const [query, setQuery] = useState("")
  const [tag, setTag] = useState<Tag>("all")
  const [states, setStates] = useState<Mark[]>([])
  const [taskId, setTaskId] = useState<string | null>(null)
  const openTask = tasks.find((t) => t.id === taskId)

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen(!searchOpen)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [searchOpen, setSearchOpen])

  const close = () => {
    setSearchOpen(false)
    setQuery("")
  }
  const go = (path: string) => {
    close()
    navigate(path)
  }

  // Everything searchable, current project first.
  const all = useMemo<Hit[]>(() => {
    if (!current?.example) return []
    const thread = (pid: string, part: string) => threadsNow(pid).find((t) => t.part === part)?.name ?? part
    const words = (...xs: (string | undefined)[]) => xs.filter(Boolean).join(" ").toLowerCase()
    const hits: Hit[] = [
      ...DECISIONS.filter((d) => PROJECT_IDS.includes(d.project) && !withdrawn(d)).map((d) => ({
        key: `d-${d.id}`, kind: "decision" as const, title: d.title, projectId: d.project, part: d.part, status: statusOf(d),
        icon: <StatusIcon status={statusOf(d)} className={icon} />,
        words: words(d.title, thread(d.project, d.part), projectOf(d.project)?.name, stateLabel(statusOf(d)), d.why),
        open: () => go(`/p/${d.project}/decisions/${d.id}`),
      })),
      ...tasks.flatMap((t) => {
        const p = projectOf(t.project)
        if (!p) return []
        return [{
          key: `t-${t.id}`, kind: "task" as const, title: t.title, projectId: p.id, part: t.part,
          icon: <TaskStatusIcon status={t.status} />,
          words: words(t.title, thread(p.id, t.part), p.name, TASK_STATUS_LABEL[t.status]),
          open: () => { close(); setTaskId(t.id) },
        }]
      }),
      ...artifacts.map((a) => {
        const Icon = KIND_ICON[a.kind]
        return {
          key: `a-${a.id}`, kind: "artifact" as const, title: a.name, projectId: a.project, part: a.part,
          icon: <Icon className={icon} />,
          words: words(a.name, thread(a.project, a.part), projectOf(a.project)?.name, a.kind, a.source),
          open: () => go(`/p/${a.project}/artifacts/${a.id}`),
        }
      }),
      ...PROJECT_IDS.flatMap((pid) => threadsNow(pid).map((t) => ({
        key: `th-${pid}-${t.id}`, kind: "thread" as const, title: t.name, projectId: pid,
        icon: <ThreadIcon thread={t} className="size-4" />,
        words: words(t.name, projectOf(pid)?.name, "thread"),
        open: () => go(`/p/${pid}/t/${t.id}`),
      }))),
      ...MY_PROJECTS.map((p) => ({
        key: `p-${p.id}`, kind: "project" as const, title: p.name, projectId: p.id,
        icon: <FolderKanban className={icon} />,
        words: words(p.name, "project"),
        open: () => go(`/p/${p.id}/home`),
      })),
    ]
    const rank = (h: Hit) => (h.projectId === here ? 0 : 1) + (h.status ? RANK.indexOf(markOf(h.status)) / 10 : 0)
    return hits.sort((a, b) => rank(a) - rank(b))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.example, tasks, artifacts, here, searchOpen, statusOf])

  // Every word typed has to appear; titles that start with the query come first.
  const matched = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return all.filter((h) => h.kind !== "project")
    const terms = q.split(/\s+/)
    const score = (h: Hit) => (h.title.toLowerCase().startsWith(q) ? 0 : h.title.toLowerCase().includes(q) ? 1 : 2)
    return all.filter((h) => terms.every((t) => h.words.includes(t))).sort((a, b) => score(a) - score(b))
  }, [all, query])

  const inStates = (h: Hit) => h.kind !== "decision" || !states.length || (!!h.status && states.includes(markOf(h.status)))
  const count = (t: Tag) => matched.filter((h) => (t === "all" || h.kind === t) && inStates(h)).length
  const stateCount = (m: Mark) => matched.filter((h) => !!h.status && markOf(h.status) === m).length
  const shown = matched.filter((h) => (tag === "all" || h.kind === tag) && inStates(h))

  const pick = (t: Tag) => {
    setTag(t)
    if (t !== "decision") setStates([])
  }
  const toggleState = (m: Mark) => setStates((xs) => (xs.includes(m) ? xs.filter((x) => x !== m) : [...xs, m]))
  // Tab steps through the tags; Backspace on an empty field clears them.
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const i = TAGS.findIndex((t) => t.tag === tag)
      pick(TAGS[(i + (e.shiftKey ? -1 : 1) + TAGS.length) % TAGS.length].tag)
    } else if (e.key === "Backspace" && !query && (tag !== "all" || states.length)) {
      if (states.length) setStates(states.slice(0, -1))
      else pick("all")
    }
  }

  return (
    <>
      <Dialog open={searchOpen} onOpenChange={(open) => (open ? setSearchOpen(true) : close())}>
        <DialogContent showCloseButton={false} className="top-[12vh] translate-y-0 gap-0 overflow-hidden p-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 sm:max-w-3xl">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <DialogDescription className="sr-only">Search every project</DialogDescription>
          <Command shouldFilter={false} loop className="**:data-[slot=command-input-wrapper]:h-14 **:data-[slot=command-input-wrapper]:gap-3 **:data-[slot=command-input-wrapper]:border-b-0 **:data-[slot=command-input-wrapper]:px-5 [&_[data-slot=command-input-wrapper]_svg]:size-5">
            <CommandInput value={query} onValueChange={setQuery} onKeyDown={onKeyDown} placeholder="Search" className="h-14 text-base" />
            <div className="flex flex-col gap-2 border-b px-5 pb-3">
              <div role="radiogroup" aria-label="Type" className="flex flex-wrap items-center gap-1.5">
                {TAGS.map(({ tag: t, label }) => (
                  <Chip key={t} role="radio" on={tag === t} onClick={() => pick(t)} count={count(t)} solid>{label}</Chip>
                ))}
              </div>
              {tag === "decision" && (
                <div role="group" aria-label="Decision state" className="flex flex-wrap items-center gap-1.5">
                  {MARKS.map((m) => (
                    <Chip key={m} on={states.includes(m)} onClick={() => toggleState(m)} count={stateCount(m)}>
                      <MarkIcon mark={m} className="size-3.5 shrink-0" />
                      {MARK_LABEL[m]}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
            <CommandList key={`${tag}-${states.join()}`} className="h-[min(60vh,560px)] max-h-none p-2">
              <CommandEmpty className="type-body py-16 text-center text-muted-foreground">Nothing matches</CommandEmpty>
              {ORDER.map((k) => {
                const rows = shown.filter((h) => h.kind === k)
                if (!rows.length) return null
                return (
                  <CommandGroup key={k} heading={tag === "all" ? GROUP[k] : undefined} className="[&_[cmdk-group-heading]]:type-label [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-muted-foreground">
                    {(tag === "all" ? rows.slice(0, PER_GROUP) : rows).map((h) => <Row key={h.key} hit={h} />)}
                  </CommandGroup>
                )
              })}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
      <TaskSheet task={openTask} onClose={() => setTaskId(null)} onChange={(patch) => openTask && patchTask(openTask.id, patch)} />
    </>
  )
}

function Chip({ on, onClick, count, solid, role, children }: { on: boolean; onClick: () => void; count: number; solid?: boolean; role?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role ? on : undefined}
      aria-pressed={role ? undefined : on}
      onClick={onClick}
      // Keep focus in the field so typing carries on after a click.
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        "type-body inline-flex h-8 items-center gap-1.5 rounded-full border px-3 transition-colors",
        on ? (solid ? "border-foreground bg-foreground text-background" : "border-foreground bg-muted text-foreground") : "text-muted-foreground hover:bg-muted hover:text-foreground",
        !on && count === 0 && "opacity-50",
      )}
    >
      {children}
      <span className={cn("tabular-nums", on && solid ? "text-background/60" : "text-muted-foreground/70")}>{count}</span>
    </button>
  )
}

function Row({ hit: h }: { hit: Hit }) {
  return (
    <CommandItem value={h.key} onSelect={h.open} className="type-body gap-3 rounded-md px-3 py-2.5">
      {h.icon}
      <span className="min-w-0 flex-1 truncate">{h.title}</span>
      {h.part && <ThreadTag projectId={h.projectId} part={h.part} className="type-caption w-28 shrink-0 text-muted-foreground" />}
      {h.kind !== "project" && <span className="type-caption w-28 shrink-0 truncate text-right text-muted-foreground">{short(projectOf(h.projectId)?.name ?? "")}</span>}
    </CommandItem>
  )
}
