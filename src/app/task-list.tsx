import { useState } from "react"
import { toast } from "sonner"
import { ChevronRight, Kanban, LayoutList, ListTodo, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu"
import { FilterMenu, ViewActions, ViewSegments } from "@/components/app/view-tabs"
import { ThreadToolbar } from "./thread-toolbar"
import { SortableHead } from "@/components/app/sortable-table"
import { MiniStack, TaskSheet, TaskStatusIcon, assigneesOf, namesOf } from "@/components/app/tasks"
import { ME, PEOPLE, TASK_STATUS_LABEL, type Task, type TaskStatus } from "@/data"
import { useSavedViews, type SavedView } from "@/lib/saved-views"
import { useStore } from "@/lib/store"
import { useSort, type Sort } from "@/lib/use-sort"
import { cn } from "@/lib/utils"
import { ThreadTag } from "./thread-ui"
import { threadOf, useAllThreads, type Thread } from "./threads"
import { AddTaskDialog } from "./new-task"
import { EmptyStart, StartThread } from "./empty-start"
import { dueDay } from "./work"

// Tasks. On Home: every thread, with saved views and a Thread column.
// On a thread page: that thread only, filters but no views. Both put open work first and tuck done away.

const STATUS_ORDER: TaskStatus[] = ["prog", "review", "todo", "done"]
const TODAY_DAY = 33 // Mon Nov 2, on the dueDay scale
type Filters = { thread: string; status: "all" | "open" | TaskStatus; owner: string; due: "any" | "week"; layout: "list" | "board" }
const BLANK: Filters = { thread: "all", status: "all", owner: "all", due: "any", layout: "list" }
const SEED: SavedView<Filters>[] = [
  { id: "all", name: "All", filters: BLANK, sort: null, locked: true },
  { id: "mine", name: "My open tasks", filters: { ...BLANK, owner: ME.id, status: "open" }, sort: null },
  { id: "week", name: "Due this week", filters: { ...BLANK, status: "open", due: "week" }, sort: null },
]
type SortKey = "thread" | "title" | "status" | "owner" | "due"

export function TaskList({ projectId, tasks, thread, search = "" }: { projectId: string; tasks: Task[]; thread?: Thread; search?: string }) {
  // Home keeps saved views; a thread keeps its filters for this visit only.
  const views = useSavedViews<Filters>(`b-tasks:${projectId}`, SEED, BLANK)
  const [local, setLocal] = useState<Filters>(BLANK)
  const [localSort, setLocalSort] = useState<Sort<SortKey>>(null)
  const filters = thread ? local : views.active.filters
  const setFilters = (f: Partial<Filters>) => (thread ? setLocal((x) => ({ ...x, ...f })) : views.setFilters(f))
  // Archived threads still own their work here; they sort last and show in the filter while they have some.
  const threads = useAllThreads(projectId).filter((t) => !t.archived || tasks.some((x) => x.part === t.part))
  const { patchTask } = useStore()
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)

  const owners = [...new Set(tasks.flatMap(assigneesOf))]
  const order = (part: string) => threads.findIndex((t) => t.part === part)
  const query = search.trim().toLowerCase()
  const shown = tasks.filter((t) =>
    (filters.status === "all" || (filters.status === "open" ? t.status !== "done" : t.status === filters.status)) &&
    (filters.owner === "all" || assigneesOf(t).includes(filters.owner)) &&
    (thread || filters.thread === "all" || t.part === filters.thread) &&
    (filters.due === "any" || dueDay(t) <= TODAY_DAY + 7) &&
    taskMatches(t, query))
  // Default order: by thread (in sidebar order), open work first, then by due date.
  const base = [...shown].sort((a, b) => (thread ? 0 : order(a.part) - order(b.part)) || STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || dueDay(a) - dueDay(b))
  const { sorted, sort, toggle } = useSort<Task, SortKey>(base, {
    thread: (t) => order(t.part),
    title: (t) => t.title,
    status: (t) => STATUS_ORDER.indexOf(t.status),
    owner: (t) => assigneesOf(t).map((id) => PEOPLE[id]?.name).join(", "),
    due: (t) => dueDay(t),
  }, null, thread ? { sort: localSort, setSort: setLocalSort } : { sort: views.active.sort as Sort<SortKey>, setSort: views.setSort })
  // Done tasks fold away under the open ones unless you filter for them, so the count on the tab matches.
  const fold = filters.status === "all" && filters.layout === "list"
  const rows = fold ? sorted.filter((t) => t.status !== "done") : sorted
  const done = fold ? sorted.filter((t) => t.status === "done") : []
  const open = tasks.find((t) => t.id === openId)
  const filtering = (!thread && filters.thread !== "all") || filters.status !== "all" || filters.owner !== "all" || filters.due !== "any"
  const seed = SEED.find((x) => x.id === views.active.id)?.filters ?? BLANK
  const changed = thread ? filtering : JSON.stringify({ ...filters, layout: seed.layout }) !== JSON.stringify(seed)
  const cols = thread ? 5 : 6
  // Nothing here yet: one empty state instead of an empty table.
  const noThreads = useAllThreads(projectId).length === 0
  const empty = !tasks.length && !query

  const row = (t: Task) => {
    const isDone = t.status === "done"
    return (
      <TableRow key={t.id} tabIndex={0} className="cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none" onClick={() => setOpenId(t.id)} onKeyDown={(e) => { if (e.target === e.currentTarget && e.key === "Enter") setOpenId(t.id) }}>
        <TableCell className="w-10 pl-4" onClick={(e) => e.stopPropagation()}>
          <Checkbox aria-label={`Mark ${t.title} done`} checked={isDone} onCheckedChange={(v) => patchTask(t.id, { status: v ? "done" : "todo" })} />
        </TableCell>
        {!thread && <TableCell className="text-xs text-muted-foreground"><ThreadTag projectId={projectId} part={t.part} /></TableCell>}
        <TableCell className={cn("max-w-0 truncate py-3", isDone ? "text-muted-foreground line-through" : "font-medium")}>{t.title}</TableCell>
        <TableCell><span className="flex items-center gap-1.5 text-xs"><TaskStatusIcon status={t.status} />{TASK_STATUS_LABEL[t.status]}</span></TableCell>
        <TableCell title={namesOf(assigneesOf(t))}><span className="flex items-center gap-2 text-xs"><MiniStack ids={assigneesOf(t)} /><span className="hidden truncate @4xl:inline">{namesOf(assigneesOf(t))}</span></span></TableCell>
        <TableCell className="pr-4 text-xs text-muted-foreground">{t.due}</TableCell>
      </TableRow>
    )
  }

  if (empty && noThreads) return <StartThread projectId={projectId} />

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {empty ? (
        <EmptyStart icon={ListTodo} title="Create your first task" action={<Button size="sm" onClick={() => setCreating(true)}><Plus />New task</Button>} />
      ) : <>
      <ThreadToolbar>
        {!thread && <ViewSegments v={views} renaming={renaming} onRename={setRenaming} />}
        <div className="ml-auto flex items-center gap-2">
          <FilterMenu active={filtering}>
            <DropdownMenuRadioGroup value={filters.layout} onValueChange={(x) => setFilters({ layout: x as Filters["layout"] })}>
              <DropdownMenuRadioItem value="list"><LayoutList />Table</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="board"><Kanban />Board</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            {!thread && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Thread</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={filters.thread} onValueChange={(x) => setFilters({ thread: x })}>
                    <DropdownMenuRadioItem value="all">All threads</DropdownMenuRadioItem>
                    {threads.map((x) => <DropdownMenuRadioItem key={x.id} value={x.part}><ThreadTag projectId={projectId} part={x.part} /></DropdownMenuRadioItem>)}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={filters.status} onValueChange={(x) => setFilters({ status: x as Filters["status"] })}>
                  <DropdownMenuRadioItem value="all">Any status</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="open">Not done</DropdownMenuRadioItem>
                  {STATUS_ORDER.map((x) => <DropdownMenuRadioItem key={x} value={x}>{TASK_STATUS_LABEL[x]}</DropdownMenuRadioItem>)}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Assignee</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={filters.owner} onValueChange={(x) => setFilters({ owner: x })}>
                  <DropdownMenuRadioItem value="all">Anyone</DropdownMenuRadioItem>
                  {owners.map((o) => <DropdownMenuRadioItem key={o} value={o}>{o === ME.id ? "Me" : PEOPLE[o]?.name}</DropdownMenuRadioItem>)}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuCheckboxItem checked={filters.due === "week"} onCheckedChange={(c) => setFilters({ due: c ? "week" : "any" })} onSelect={(e) => e.preventDefault()}>Due this week</DropdownMenuCheckboxItem>
            {changed && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => (thread ? setLocal({ ...BLANK, layout: filters.layout }) : views.resetFilters())}>Clear filters</DropdownMenuItem></>}
            {!thread && <><DropdownMenuSeparator /><ViewActions v={views} onRename={setRenaming} /></>}
          </FilterMenu>
          <Button size="sm" variant={thread ? "default" : "outline"} onClick={() => setCreating(true)}><Plus />New task</Button>
        </div>
      </ThreadToolbar>

      {filters.layout === "list" ? (
        <Table>
          <TableHeader className="[&_tr]:border-0 [&_tr]:bg-muted [&_tr]:hover:bg-muted [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg">
            <TableRow>
              <TableHead className="w-10 pl-4" />
              {!thread && <SortableHead id="thread" sort={sort} onSort={toggle} className="w-28 @4xl:w-36">Thread</SortableHead>}
              <SortableHead id="title" sort={sort} onSort={toggle}>Task</SortableHead>
              <SortableHead id="status" sort={sort} onSort={toggle} className="w-28 @4xl:w-32">Status</SortableHead>
              <SortableHead id="owner" sort={sort} onSort={toggle} className="w-24 @4xl:w-44">Assignees</SortableHead>
              <SortableHead id="due" sort={sort} onSort={toggle} className="w-24 pr-4 @4xl:w-28">Due</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row)}
            {!rows.length && !done.length && (
              <TableRow><TableCell colSpan={cols} className="py-12 text-center text-sm text-muted-foreground">{tasks.length ? "No matches." : "No tasks yet."}</TableCell></TableRow>
            )}
            {!rows.length && done.length > 0 && (
              <TableRow><TableCell colSpan={cols} className="py-6 text-center text-sm text-muted-foreground">Nothing open.</TableCell></TableRow>
            )}
            {done.length > 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={cols} className="pl-4">
                  <button onClick={() => setShowDone(!showDone)} aria-expanded={showDone} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                    <ChevronRight className={cn("size-3.5 transition-transform", showDone && "rotate-90")} />Done <span className="tabular-nums">{done.length}</span>
                  </button>
                </TableCell>
              </TableRow>
            )}
            {showDone && done.map(row)}
          </TableBody>
        </Table>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {(["todo", "prog", "review", "done"] as TaskStatus[]).map((st) => {
            const col = sorted.filter((t) => t.status === st)
            return (
              <div key={st} className="flex min-h-40 flex-col gap-2 rounded-xl bg-muted/60 p-2">
                <div className="flex items-center gap-2 px-1 py-1 text-sm font-medium">
                  <TaskStatusIcon status={st} />
                  {TASK_STATUS_LABEL[st]}
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">{col.length}</span>
                </div>
                {col.map((t) => (
                  <button key={t.id} onClick={() => setOpenId(t.id)} className="flex flex-col gap-1.5 rounded-lg bg-background p-3 text-left text-sm transition-colors hover:bg-background/70">
                    {!thread && <span className="text-xs text-muted-foreground"><ThreadTag projectId={projectId} part={t.part} /></span>}
                    <span className="font-medium leading-snug">{t.title}</span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
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
      </>}

      <TaskSheet task={open} onClose={() => setOpenId(null)} onChange={(patch) => open && patchTask(open.id, patch)} />
      <AddTaskDialog
        projectId={projectId}
        thread={thread?.part ?? (filters.thread !== "all" ? filters.thread : undefined)}
        open={creating}
        onOpenChange={setCreating}
        onCreated={(t) => toast(`Task added to ${threadOf(projectId, t.part).name}`)}
      />
    </div>
  )
}

export const taskMatches = (t: Task, query: string) => !query || `${t.title} ${t.description ?? ""} ${t.part}`.toLowerCase().includes(query)
