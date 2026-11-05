import { useState, type ReactNode } from 'react'
import { ChevronRight, Columns3, LayoutGrid, List, Network, PanelLeft, type LucideIcon } from 'lucide-react'
import { DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { AppShell } from '@/components/app/app-shell'
import { FilterMenu, TablePageHeader, ViewTabs } from '@/components/app/view-tabs'
import { StatusIcon } from '@/components/app/status-badge'
import { SectionWorkspace } from '@/components/decisions/section-workspace'
import { projectSections } from '@/components/decisions/section-data'
import { descendants, type WorkSection } from '@/components/decisions/section-model'
import { PEOPLE, PROJECTS, STATUS_LABEL, reachOf, type Decision, type Status } from '@/data'
import { useSavedViews, type SavedView } from '@/lib/saved-views'
import { navigate } from '@/lib/router'
import { useStore } from '@/lib/store'
import { useStatusOf, useTasks } from '@/lib/work'
import { cn } from '@/lib/utils'
import { dayOf } from '@/playground/model'

// Playground: five ways to lay out a project's Decisions page, all split by thread.
// Views (tabs) stay filters, so custom views work in every layout. Rows open the decision sheet.
// The real page (screens/project-decisions.tsx) is untouched.

type Layout = 'sections' | 'rail' | 'board' | 'cards' | 'map'
const LAYOUTS: [Layout, string, LucideIcon][] = [
  ['sections', 'Sections', List],
  ['rail', 'Rail', PanelLeft],
  ['board', 'Board', Columns3],
  ['cards', 'Cards', LayoutGrid],
  ['map', 'Map', Network],
]

type Filters = { state: 'all' | Status; update: boolean }
const BLANK: Filters = { state: 'all', update: false }
const SEED: SavedView<Filters>[] = [
  { id: 'all', name: 'All', filters: BLANK, sort: null, locked: true },
  { id: 'confirm', name: 'To confirm', filters: { state: 'inf', update: false }, sort: null },
  { id: 'update', name: 'Needs update', filters: { state: 'all', update: true }, sort: null },
]
const STATES: Status[] = ['conf', 'inf', 'open', 'chg']

type Row = { d: Decision; thread: WorkSection; sub?: WorkSection; pending: number; status: Status }
type Group = { thread: WorkSection; rows: Row[] }
type Open = (id: string) => void

const when = (d: Decision) => dayOf(d.when) ?? dayOf(d.due) ?? 0
const byName = (d: Decision) => (d.by ?? PEOPLE[d.owner]?.name ?? '').split(' ')[0]

export function DecisionLayouts({ layout = 'sections' }: { layout?: string }) {
  const current = (LAYOUTS.find(([id]) => id === layout) ?? LAYOUTS[0])[0]
  return <AppShell
    crumbs={[{ label: 'Prototype' }, { label: 'Decisions layouts' }]}
    actions={<ToggleGroup type="single" variant="outline" size="sm" value={current} onValueChange={v => v && navigate(`/playground/layouts/${v}`)}>
      {LAYOUTS.map(([id, label, Icon], i) => <ToggleGroupItem key={id} value={id} className="gap-1.5 px-3" aria-label={label}>
        <span className="text-xs text-muted-foreground tabular-nums">{i + 1}</span><Icon /><span className="hidden lg:inline">{label}</span>
      </ToggleGroupItem>)}
    </ToggleGroup>}
  >
    <Page layout={current} />
  </AppShell>
}

function Page({ layout }: { layout: Layout }) {
  const project = PROJECTS[0]
  const tasks = useTasks()
  const statusOf = useStatusOf()
  const { openDecision } = useStore()
  const sections = projectSections(project.id)
  const threads = sections.filter(s => !s.parent)
  const v = useSavedViews<Filters>(`layouts:${project.id}`, SEED, BLANK)
  const f = v.active.filters
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()

  const keep = (d: Decision, pending: number) => (f.state === 'all' || statusOf(d) === f.state)
    && (!f.update || pending > 0)
    && `${d.title} ${d.why ?? ''} ${d.by ?? ''}`.toLowerCase().includes(q)
  const groups: Group[] = threads.map(t => {
    const own = [t, ...sections.filter(s => descendants(sections, t.id).includes(s.id))]
    const rows = own.flatMap(s => s.decisions.flatMap(x => {
      if (!x.source) return []
      const pending = reachOf(x.id, tasks).filter(r => r.needsUpdate).length
      return keep(x.source, pending) ? [{ d: x.source, thread: t, sub: s === t ? undefined : s, pending, status: statusOf(x.source) }] : []
    }))
    // Thread-level decisions first, then each subthread; newest first inside each.
    rows.sort((a, b) => (a.sub ? own.indexOf(a.sub) : 0) - (b.sub ? own.indexOf(b.sub) : 0) || when(b.d) - when(a.d))
    return { thread: t, rows }
  })
  const filtering = f.state !== 'all' || f.update || !!q
  const shown = filtering ? groups.filter(g => g.rows.length) : groups
  const seed = SEED.find(s => s.id === v.active.id)?.filters ?? BLANK

  const body: Record<Layout, ReactNode> = {
    sections: <SectionsLayout groups={shown} open={openDecision} />,
    rail: <RailLayout groups={groups} sections={sections} open={openDecision} />,
    board: <BoardLayout groups={shown} open={openDecision} />,
    cards: <CardsLayout groups={shown} open={openDecision} />,
    map: <div className="relative flex h-[calc(100svh-15rem)] min-h-[480px] overflow-hidden rounded-xl border">
      <SectionWorkspace project={project} initialSections={sections} onDecisionChange={id => id && openDecision(id)} />
    </div>,
  }

  return <div className="space-y-6 p-6 sm:p-8">
    <TablePageHeader title="Decisions" search={search} onSearch={setSearch} placeholder="Search decisions…" />
    <ViewTabs v={v}>
      <FilterMenu active={JSON.stringify(f) !== JSON.stringify(seed)}>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>State</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={f.state} onValueChange={state => v.setFilters({ state: state as Filters['state'] })}>
              <DropdownMenuRadioItem value="all">Any state</DropdownMenuRadioItem>
              {STATES.map(s => <DropdownMenuRadioItem key={s} value={s}>{STATUS_LABEL[s]}</DropdownMenuRadioItem>)}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuCheckboxItem checked={f.update} onCheckedChange={c => v.setFilters({ update: !!c })} onSelect={e => e.preventDefault()}>Needs update</DropdownMenuCheckboxItem>
        {JSON.stringify(f) !== JSON.stringify(seed) && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={v.resetFilters}>Clear filters</DropdownMenuItem></>}
      </FilterMenu>
    </ViewTabs>
    {body[layout]}
    {layout !== 'map' && !shown.length && <p className="py-12 text-center text-sm text-muted-foreground">No matches.</p>}
  </div>
}

// ── Shared bits ──

function Pending({ n }: { n: number }) {
  return n ? <span className="shrink-0 rounded-full border px-1.5 text-[11px] text-muted-foreground">{n} to update</span> : null
}

function Line({ row, open, thread }: { row: Row; open: Open; thread?: boolean }) {
  const { d } = row
  return <button onClick={() => open(d.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted/60">
    <StatusIcon status={row.status} className="size-4 shrink-0 text-muted-foreground" />
    <span className="min-w-0 flex-1 truncate">{d.title}</span>
    {thread && <span className="hidden shrink-0 text-xs text-muted-foreground md:inline">{row.thread.name}</span>}
    <Pending n={row.pending} />
    <span className="hidden w-16 shrink-0 truncate text-xs text-muted-foreground sm:inline">{byName(d)}</span>
    <span className="w-14 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{d.when ?? d.due ?? '—'}</span>
  </button>
}

// Rows with a small label wherever a subthread starts.
function Lines({ rows, open, thread }: { rows: Row[]; open: Open; thread?: boolean }) {
  return <div className="overflow-hidden rounded-xl border">
    {rows.map((r, i) => <div key={r.d.id} className={cn(i > 0 && 'border-t')}>
      {r.sub && r.sub !== rows[i - 1]?.sub && <div className="bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">{r.sub.name}</div>}
      <Line row={r} open={open} thread={thread} />
    </div>)}
    {!rows.length && <p className="px-3 py-2.5 text-sm text-muted-foreground">None yet</p>}
  </div>
}

function Count({ n }: { n: number }) {
  return <span className="text-xs font-normal text-muted-foreground tabular-nums">{n}</span>
}

// ── 1 · Sections: every thread in one scroll, each collapsible ──

function SectionsLayout({ groups, open }: { groups: Group[]; open: Open }) {
  const [closed, setClosed] = useState<string[]>([])
  return <div className="space-y-6">
    {groups.map(({ thread, rows }) => {
      const isOpen = !closed.includes(thread.id)
      return <section key={thread.id} className="space-y-2">
        <button onClick={() => setClosed(c => isOpen ? [...c, thread.id] : c.filter(x => x !== thread.id))} className="flex w-full items-center gap-2 text-sm font-medium">
          <ChevronRight className={cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-90')} />
          {thread.name}<Count n={rows.length} />
          <span className="ml-auto text-xs font-normal text-muted-foreground">{thread.owner}</span>
        </button>
        {isOpen && <Lines rows={rows} open={open} />}
      </section>
    })}
  </div>
}

// ── 2 · Rail: threads on the left, one list on the right ──

function RailLayout({ groups, sections, open }: { groups: Group[]; sections: WorkSection[]; open: Open }) {
  const [sel, setSel] = useState('all')
  const all = groups.flatMap(g => g.rows)
  const rows = sel === 'all' ? all : all.filter(r => r.thread.id === sel || r.sub?.id === sel || (r.sub && descendants(sections, sel).includes(r.sub.id)))
  const item = (id: string, label: string, n: number, depth = 0) => <button key={id} onClick={() => setSel(id)}
    className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm', sel === id ? 'bg-muted font-medium' : 'text-muted-foreground hover:bg-muted/60')}
    style={{ paddingLeft: 8 + depth * 14 }}>
    <span className="min-w-0 flex-1 truncate">{label}</span><Count n={n} />
  </button>
  return <div className="flex gap-6">
    <nav className="w-48 shrink-0 space-y-0.5" aria-label="Threads">
      {item('all', 'All threads', all.length)}
      {groups.map(g => <div key={g.thread.id} className="space-y-0.5">
        {item(g.thread.id, g.thread.name, g.rows.length)}
        {sections.filter(s => s.parent === g.thread.id).map(s => item(s.id, s.name, g.rows.filter(r => r.sub?.id === s.id).length, 1))}
      </div>)}
    </nav>
    <div className="min-w-0 flex-1"><Lines rows={rows} open={open} thread={sel === 'all'} /></div>
  </div>
}

// ── 3 · Board: one column per thread ──

function BoardLayout({ groups, open }: { groups: Group[]; open: Open }) {
  return <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-2 sm:-mx-8 sm:px-8">
    {groups.map(({ thread, rows }) => <div key={thread.id} className="min-w-60 flex-1 space-y-2">
      <div className="flex items-center gap-2 px-1 text-sm font-medium">{thread.name}<Count n={rows.length} /></div>
      {rows.map((r, i) => <div key={r.d.id} className="space-y-2">
        {r.sub && r.sub !== rows[i - 1]?.sub && <div className="px-1 pt-2 text-xs text-muted-foreground">{r.sub.name}</div>}
        <button onClick={() => open(r.d.id)} className="w-full space-y-2 rounded-lg bg-muted/60 p-3 text-left text-sm hover:bg-muted">
          <span className="flex gap-2"><StatusIcon status={r.status} className="mt-0.5 size-4 shrink-0 text-muted-foreground" />{r.d.title}</span>
          <span className="flex items-center gap-2 pl-6 text-xs text-muted-foreground">{byName(r.d)} · {r.d.when ?? r.d.due ?? '—'}<span className="ml-auto"><Pending n={r.pending} /></span></span>
        </button>
      </div>)}
      {!rows.length && <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">None yet</div>}
    </div>)}
  </div>
}

// ── 4 · Cards: one card per thread, latest three, expand for the rest ──

function CardsLayout({ groups, open }: { groups: Group[]; open: Open }) {
  const [expanded, setExpanded] = useState<string[]>([])
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    {groups.map(({ thread, rows }) => {
      const latest = [...rows].sort((a, b) => when(b.d) - when(a.d))
      const isOpen = expanded.includes(thread.id)
      const tally = STATES.map(s => [s, rows.filter(r => r.status === s).length] as const).filter(([, n]) => n)
      return <div key={thread.id} className="space-y-3 rounded-xl bg-muted/50 p-4">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-medium">{thread.name}</h3>
          <span className="ml-auto flex items-center gap-2.5 text-xs text-muted-foreground tabular-nums">
            {tally.map(([s, n]) => <span key={s} className="flex items-center gap-1" title={STATUS_LABEL[s]}><StatusIcon status={s} className="size-3.5" />{n}</span>)}
          </span>
        </div>
        <div className="space-y-0.5">
          {(isOpen ? latest : latest.slice(0, 3)).map(r => <button key={r.d.id} onClick={() => open(r.d.id)} className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm hover:bg-background">
            <StatusIcon status={r.status} className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{r.d.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{r.d.when ?? r.d.due ?? ''}</span>
          </button>)}
          {!rows.length && <p className="px-1.5 py-1 text-sm text-muted-foreground">None yet</p>}
        </div>
        {rows.length > 3 && <button onClick={() => setExpanded(e => isOpen ? e.filter(x => x !== thread.id) : [...e, thread.id])} className="px-1.5 text-xs text-muted-foreground hover:text-foreground">
          {isOpen ? 'Show less' : `All ${rows.length}`}
        </button>}
      </div>
    })}
  </div>
}
