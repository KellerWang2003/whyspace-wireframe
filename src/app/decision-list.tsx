import { useEffect, useState } from "react"
import { LayoutList, Network, Sparkles, Split, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu"
import { FilterMenu, ViewActions, ViewSegments } from "@/components/app/view-tabs"
import { ThreadToolbar } from "./thread-toolbar"
import { SortableHead } from "@/components/app/sortable-table"
import { MarkIcon, StatusIcon, StatusLegend } from "@/components/app/status-badge"
import { PEOPLE, reachOf, type Decision } from "@/data"
import { onFilterDecisions } from "@/lib/ask"
import { navigate } from "@/lib/router"
import { MARKS, MARK_LABEL, markOf, stateLabel, type Mark } from "@/lib/marks"
import { useSavedViews, type SavedView } from "@/lib/saved-views"
import { useStore } from "@/lib/store"
import { useSort, type Sort } from "@/lib/use-sort"
import { useStatusOf, useTasks, useWithdrawn } from "@/lib/work"
import { cn } from "@/lib/utils"
import { dayOf } from "@/playground/model"
import { DecisionMap } from "./decision-map"
import { ThreadTag } from "./thread-ui"
import { useAllThreads, type Thread } from "./threads"
import { EmptyStart } from "./empty-start"
import { Illo } from "@/components/brand/illo/pieces"

// Decisions. On Home: every thread, newest first, with saved views and a Thread column.
// On a thread page: that thread only, filters but no views. Both switch between List and Map.

type Filters = { thread: string; state: "all" | Mark; update: boolean; week: boolean; layout: "list" | "map" }
type SortKey = "thread" | "title" | "state" | "by" | "date" | "reach"
const BLANK: Filters = { thread: "all", state: "all", update: false, week: false, layout: "list" }
const SEED: SavedView<Filters>[] = [
  { id: "all", name: "All", filters: BLANK, sort: null, locked: true },
  { id: "confirm", name: "To confirm", filters: { ...BLANK, state: "empty" }, sort: null },
  { id: "update", name: "Needs update", filters: { ...BLANK, update: true }, sort: null },
]
const dateOf = (d: Decision) => dayOf(d.when) ?? dayOf(d.due)

// What the marks mean: a full-width footer along the bottom of the page, under Decisions (list and map).
export function DecisionsFooter() {
  return (
    <footer className="shrink-0 border-t bg-background px-4 py-2">
      <StatusLegend className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground" />
    </footer>
  )
}

export function DecisionList({ projectId, decisions, thread, search = "" }: { projectId: string; decisions: Decision[]; thread?: Thread; search?: string }) {
  const views = useSavedViews<Filters>(`b-decisions-marks:${projectId}`, SEED, BLANK)
  const [local, setLocal] = useState<Filters>(BLANK)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [localSort, setLocalSort] = useState<Sort<SortKey>>(null)
  const filters = thread ? local : views.active.filters
  const setFilters = (f: Partial<Filters>) => (thread ? setLocal((x) => ({ ...x, ...f })) : views.setFilters(f))
  // Archived threads still own their work here; they sort last and show in the filter while they have some.
  const threads = useAllThreads(projectId).filter((t) => !t.archived || decisions.some((x) => x.part === t.part))
  const tasks = useTasks()
  const statusOf = useStatusOf()
  const withdrawn = useWithdrawn()
  const { openDecision } = useStore()
  const [asked, setAsked] = useState<{ ids: string[]; question: string } | null>(null)
  useEffect(() => (thread ? undefined : onFilterDecisions((ids, question) => setAsked({ ids, question }))), [thread])

  const order = (part: string) => threads.findIndex((t) => t.part === part)
  const query = search.trim().toLowerCase()
  const shown = decisions.filter((d) =>
    !withdrawn(d) &&
    (thread || filters.thread === "all" || d.part === filters.thread) &&
    (filters.state === "all" || markOf(statusOf(d)) === filters.state) &&
    (!filters.update || reachOf(d.id, tasks).some((r) => r.needsUpdate)) &&
    (!filters.week || (dateOf(d) ?? 0) >= 19) &&
    (!asked || asked.ids.includes(d.id)) &&
    decisionMatches(d, query))
  // Default order: newest first. Open questions (no date yet) sit at the top.
  const base = [...shown].sort((a, b) => (dateOf(b) ?? 99) - (dateOf(a) ?? 99) || order(a.part) - order(b.part))
  const { sorted: rows, sort, toggle } = useSort<Decision, SortKey>(base, {
    thread: (d) => order(d.part),
    title: (d) => d.title,
    state: (d) => stateLabel(statusOf(d)),
    by: (d) => d.by ?? PEOPLE[d.owner]?.name,
    date: (d) => dateOf(d),
    reach: (d) => reachOf(d.id, tasks).length,
  }, null, thread ? { sort: localSort, setSort: setLocalSort } : { sort: views.active.sort as Sort<SortKey>, setSort: views.setSort })

  const open = (d: Decision) => (thread ? openDecision(d.id) : navigate(`/p/${projectId}/decisions/${d.id}`))
  const filtering = (!thread && filters.thread !== "all") || filters.state !== "all" || filters.update || filters.week
  const seed = SEED.find((x) => x.id === views.active.id)?.filters ?? BLANK
  const changed = thread ? filtering : JSON.stringify({ ...filters, layout: seed.layout }) !== JSON.stringify(seed)
  const cols = thread ? 5 : 6

  // Decisions are caught from the work, so there is nothing to create here.
  if (!decisions.length && !query) return <EmptyStart icon={Split} title="No decisions yet" art={<Illo name="no-projects" className="mb-3 h-20" />} />

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <ThreadToolbar>
        {!thread && <ViewSegments v={views} renaming={renaming} onRename={setRenaming} />}
        <div className="ml-auto flex items-center gap-2">
          <FilterMenu active={filtering}>
            <DropdownMenuRadioGroup value={filters.layout} onValueChange={(x) => setFilters({ layout: x as Filters["layout"] })}>
              <DropdownMenuRadioItem value="list"><LayoutList />List</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="map"><Network />Map</DropdownMenuRadioItem>
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
              <DropdownMenuSubTrigger>State</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={filters.state} onValueChange={(x) => setFilters({ state: x as Filters["state"] })}>
                  <DropdownMenuRadioItem value="all">Any state</DropdownMenuRadioItem>
                  {MARKS.map((x) => <DropdownMenuRadioItem key={x} value={x}><MarkIcon mark={x} className="size-3.5 text-muted-foreground" />{MARK_LABEL[x]}</DropdownMenuRadioItem>)}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuCheckboxItem checked={filters.update} onCheckedChange={(c) => setFilters({ update: !!c })} onSelect={(e) => e.preventDefault()}>Needs update</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={filters.week} onCheckedChange={(c) => setFilters({ week: !!c })} onSelect={(e) => e.preventDefault()}>This week</DropdownMenuCheckboxItem>
            {changed && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => (thread ? setLocal({ ...BLANK, layout: filters.layout }) : views.resetFilters())}>Clear filters</DropdownMenuItem></>}
            {!thread && <><DropdownMenuSeparator /><ViewActions v={views} onRename={setRenaming} /></>}
          </FilterMenu>
        </div>
      </ThreadToolbar>

      {asked && (
        <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm">
          <Sparkles className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">Filtered by Ask · “{asked.question}”</span>
          <Button variant="ghost" size="sm" onClick={() => setAsked(null)}><X />Clear</Button>
        </div>
      )}

      {filters.layout === "map" ? (
        <DecisionMap projectId={projectId} decisions={rows} thread={thread} onOpen={open} />
      ) : (
        <Table>
          <TableHeader className="[&_tr]:border-0 [&_tr]:bg-muted [&_tr]:hover:bg-muted [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg">
            <TableRow>
              {!thread && <SortableHead id="thread" sort={sort} onSort={toggle} className="w-28 pl-4 @4xl:w-36">Thread</SortableHead>}
              <SortableHead id="title" sort={sort} onSort={toggle} className={cn("w-[40%]", thread && "pl-4")}>Decision</SortableHead>
              <SortableHead id="state" sort={sort} onSort={toggle}>State</SortableHead>
              <SortableHead id="by" sort={sort} onSort={toggle} className="hidden @4xl:table-cell">Decided by</SortableHead>
              <SortableHead id="date" sort={sort} onSort={toggle}>Date</SortableHead>
              <SortableHead id="reach" sort={sort} onSort={toggle} className="pr-4">Artifacts affected</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((d) => {
              const reach = reachOf(d.id, tasks)
              const pending = reach.filter((r) => r.needsUpdate).length
              const status = statusOf(d)
              return (
                <TableRow key={d.id} tabIndex={0} className="cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none" onClick={() => open(d)} onKeyDown={(e) => { if (e.target === e.currentTarget && e.key === "Enter") open(d) }}>
                  {!thread && <TableCell className="pl-4 text-xs text-muted-foreground"><ThreadTag projectId={projectId} part={d.part} /></TableCell>}
                  <TableCell className={cn("min-w-64 py-3 font-medium whitespace-normal", thread && "pl-4")}>{d.title}</TableCell>
                  <TableCell><span className="flex items-center gap-1.5 text-xs"><StatusIcon status={status} className="size-3.5 text-muted-foreground" />{stateLabel(status)}</span></TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground @4xl:table-cell">{d.by ?? PEOPLE[d.owner]?.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{d.when ?? (d.due ? `Due ${d.due}` : "—")}</TableCell>
                  <TableCell className="pr-4 text-xs">
                    {reach.length ? (
                      <span className="flex items-center gap-1.5">
                        <span className="tabular-nums">{reach.length}</span>
                        {pending > 0 && <Badge variant="outline" className="font-normal">{pending} {pending === 1 ? "needs" : "need"} update</Badge>}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              )
            })}
            {!rows.length && (
              <TableRow><TableCell colSpan={cols} className="py-12 text-center text-sm text-muted-foreground">{decisions.length ? "No matches." : "No decisions yet."}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export const decisionMatches = (d: Decision, query: string) => !query || `${d.title} ${d.why ?? ""} ${d.part} ${d.by ?? ""}`.toLowerCase().includes(query)
