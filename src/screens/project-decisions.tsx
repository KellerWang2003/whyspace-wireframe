import { useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { SortableHead } from '@/components/app/sortable-table'
import { FilterMenu, TablePageHeader, ViewTabs } from '@/components/app/view-tabs'
import { useSort, type Sort } from '@/lib/use-sort'
import { useSavedViews, type SavedView } from '@/lib/saved-views'
import { StatusIcon, StatusLegend } from '@/components/app/status-badge'
import { projectSections } from '@/components/decisions/section-data'
import { descendants, sectionPath } from '@/components/decisions/section-model'
import { DECISIONS, PEOPLE, STATUS_LABEL, ledBy, reachOf, type Decision, type Project, type Status } from '@/data'
import { onFilterDecisions } from '@/lib/ask'
import { navigate } from '@/lib/router'
import { useStatusOf, useTasks } from '@/lib/work'
import { cn } from '@/lib/utils'
import { dayOf } from '@/playground/model'

// Decisions is a plain database. The default view splits it by thread, one sub-tab per thread,
// the way Artifacts keeps a shelf per thread. Other views are Notion-style: add one with +, then
// set its filters, sort and split from the ⋯ menu; every change saves into the open view.
// Ask Whyspace docks on the right and its answers filter the table. Rows open the decision sheet.

type Filters = { thread: string; state: 'all' | Status; mine: boolean; update: boolean; week: boolean; split: boolean }
type SortKey = 'part' | 'title' | 'state' | 'by' | 'date' | 'artifacts'
const BLANK: Filters = { thread: 'all', state: 'all', mine: false, update: false, week: false, split: false }
const SEED: SavedView<Filters>[] = [
  { id: 'threads', name: 'By thread', filters: { ...BLANK, split: true }, sort: null, locked: true },
  { id: 'all', name: 'All', filters: BLANK, sort: null },
]
const FLAGS = [['mine', 'My threads'], ['update', 'Needs update'], ['week', 'This week']] as const
const STATES: Status[] = ['conf', 'inf', 'open', 'chg']

export function ProjectDecisions({ project }: { project: Project; selectedId?: string }) {
  const tasks = useTasks()
  const statusOf = useStatusOf()
  const sections = projectSections(project.id)
  const threads = sections.filter(s => !s.parent)
  const all = DECISIONS.filter(d => d.project === project.id)
  const v = useSavedViews<Filters>(`decisions:${project.id}`, SEED, BLANK)
  const filters = v.active.filters
  const [tab, setTab] = useState(threads[0]?.id ?? '')
  const [search, setSearch] = useState('')
  const [asked, setAsked] = useState<{ ids: string[]; question: string } | null>(null)
  useEffect(() => onFilterDecisions((ids, question) => setAsked({ ids, question })), [])

  const mine = ledBy(project.id)
  const inThread = (d: Decision, id: string) => {
    if (id === 'all') return true
    const ids = [id, ...descendants(sections, id)]
    return sections.some(s => ids.includes(s.id) && s.decisions.some(x => x.id === d.id))
  }
  const query = search.trim().toLowerCase()
  const matches = (d: Decision) => (filters.split || inThread(d, filters.thread))
    && (filters.state === 'all' || statusOf(d) === filters.state)
    && (!filters.mine || mine.includes(d.part))
    && (!filters.update || reachOf(d.id, tasks).some(r => r.needsUpdate))
    && (!filters.week || (dayOf(d.when) ?? 0) >= 19)
    && (!asked || asked.ids.includes(d.id))
    && `${d.title} ${d.why ?? ''} ${d.part} ${d.by ?? ''}`.toLowerCase().includes(query)
  const filtered = all.filter(matches)
  const shown = filters.split ? filtered.filter(d => inThread(d, tab)) : filtered
  const { sorted: rows, sort, toggle } = useSort<Decision, SortKey>(shown, {
    part: d => d.part,
    title: d => d.title,
    state: d => STATUS_LABEL[statusOf(d)],
    by: d => d.by ?? PEOPLE[d.owner]?.name,
    date: d => dayOf(d.when) ?? dayOf(d.due),
    artifacts: d => reachOf(d.id, tasks).length,
  }, null, { sort: v.active.sort as Sort<SortKey>, setSort: v.setSort })

  const seed = SEED.find(s => s.id === v.active.id)?.filters ?? BLANK
  const changed = JSON.stringify({ ...filters, split: seed.split }) !== JSON.stringify(seed)
  const filtering = (filters.thread !== 'all' && !filters.split) || filters.state !== 'all' || FLAGS.some(([k]) => filters[k])
  const cols = filters.split ? 5 : 6

  return <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
    <div className="space-y-6 p-6 sm:p-8">
      <TablePageHeader title="Decisions" search={search} onSearch={setSearch} placeholder="Search decisions…" />
      <div className="space-y-3">
        <ViewTabs v={v}>
          <FilterMenu active={filtering}>
            {!filters.split && <DropdownMenuSub>
              <DropdownMenuSubTrigger>Thread</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={filters.thread} onValueChange={thread => v.setFilters({ thread })}>
                  <DropdownMenuRadioItem value="all">All threads</DropdownMenuRadioItem>
                  {sections.map(s => <DropdownMenuRadioItem key={s.id} value={s.id}>{sectionPath(sections, s.id).map(x => x.name).join(' / ')}</DropdownMenuRadioItem>)}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>State</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={filters.state} onValueChange={state => v.setFilters({ state: state as Filters['state'] })}>
                  <DropdownMenuRadioItem value="all">Any state</DropdownMenuRadioItem>
                  {STATES.map(s => <DropdownMenuRadioItem key={s} value={s}>{STATUS_LABEL[s]}</DropdownMenuRadioItem>)}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {FLAGS.map(([k, label]) => <DropdownMenuCheckboxItem key={k} checked={filters[k]} onCheckedChange={c => v.setFilters({ [k]: !!c } as Partial<Filters>)} onSelect={e => e.preventDefault()}>{label}</DropdownMenuCheckboxItem>)}
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={filters.split} onCheckedChange={c => v.setFilters({ split: !!c })} onSelect={e => e.preventDefault()}>Split by thread</DropdownMenuCheckboxItem>
            {changed && <DropdownMenuItem onSelect={v.resetFilters}>Clear filters</DropdownMenuItem>}
          </FilterMenu>
        </ViewTabs>
        {filters.split && <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Threads">
          {threads.map(t => {
            const n = filtered.filter(d => inThread(d, t.id)).length
            return <Button key={t.id} size="sm" role="tab" aria-selected={tab === t.id} variant={tab === t.id ? 'secondary' : 'ghost'} className={cn('rounded-full', tab !== t.id && 'text-muted-foreground')} onClick={() => setTab(t.id)}>
              {t.name}<span className="text-xs text-muted-foreground tabular-nums">{n}</span>
            </Button>
          })}
        </div>}
      </div>
      {asked && <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm"><Sparkles className="size-3.5 shrink-0" /><span className="min-w-0 flex-1 truncate">Filtered by Ask · “{asked.question}”</span><Button variant="ghost" size="sm" onClick={() => setAsked(null)}><X />Clear</Button></div>}
      <div><Table><TableHeader><TableRow>
        {!filters.split && <SortableHead id="part" sort={sort} onSort={toggle} className="pl-4">Thread</SortableHead>}
        <SortableHead id="title" sort={sort} onSort={toggle} className={cn('w-[38%]', filters.split && 'pl-4')}>Decision</SortableHead><SortableHead id="state" sort={sort} onSort={toggle}>State</SortableHead><SortableHead id="by" sort={sort} onSort={toggle}>Decided by</SortableHead><SortableHead id="date" sort={sort} onSort={toggle}>Date</SortableHead><SortableHead id="artifacts" sort={sort} onSort={toggle} className="pr-4">Artifacts affected</SortableHead>
      </TableRow></TableHeader><TableBody>
        {rows.map(d => {
          const reach = reachOf(d.id, tasks)
          const pending = reach.filter(r => r.needsUpdate).length
          const status = statusOf(d)
          return <TableRow key={d.id} className="cursor-pointer" onClick={() => navigate(`/p/${project.id}/decisions/${d.id}`)}>
            {!filters.split && <TableCell className="pl-4 text-xs text-muted-foreground">{d.part}</TableCell>}
            <TableCell className={cn('min-w-64 py-3 whitespace-normal', filters.split && 'pl-4')}><button className="text-left font-medium hover:underline" onClick={e => { e.stopPropagation(); navigate(`/p/${project.id}/decisions/${d.id}`) }}>{d.title}</button></TableCell>
            <TableCell><span className="flex items-center gap-1.5 text-xs"><StatusIcon status={status} className="size-3.5 text-muted-foreground" />{STATUS_LABEL[status]}</span></TableCell>
            <TableCell className="text-xs text-muted-foreground">{d.by ?? PEOPLE[d.owner]?.name}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{d.when ?? (d.due ? `Due ${d.due}` : '—')}</TableCell>
            <TableCell className="pr-4 text-xs">{reach.length ? <span className="flex items-center gap-1.5"><span className="tabular-nums">{reach.length}</span>{pending > 0 && <Badge variant="outline" className="font-normal">{pending} {pending === 1 ? 'needs' : 'need'} update</Badge>}</span> : <span className="text-muted-foreground">—</span>}</TableCell>
          </TableRow>
        })}
        {!rows.length && <TableRow><TableCell colSpan={cols} className="py-12 text-center text-sm text-muted-foreground">{all.length ? 'No matches.' : 'No decisions yet.'}</TableCell></TableRow>}
      </TableBody></Table></div>
    </div>
    <footer className="sticky bottom-0 mt-auto border-t bg-background px-6 py-2.5 sm:px-8"><StatusLegend /></footer>
  </div>
}
