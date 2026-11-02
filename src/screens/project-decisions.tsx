import { useEffect, useState } from 'react'
import { Search, Sparkles, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusIcon } from '@/components/app/status-badge'
import { projectSections } from '@/components/decisions/section-data'
import { descendants, sectionPath } from '@/components/decisions/section-model'
import { DECISIONS, PEOPLE, STATUS_LABEL, ledBy, reachOf, type Decision, type Project, type Status } from '@/data'
import { onFilterDecisions } from '@/lib/ask'
import { navigate } from '@/lib/router'
import { useStatusOf, useTasks } from '@/lib/work'
import { cn } from '@/lib/utils'
import { dayOf } from '@/playground/model'

// Decisions is a plain database: a table with filters and saved views, for auditing
// ("every open decision in design") or when Ask isn't enough. Ask Whyspace docks on the
// right and its answers filter the table. Rows open the decision sheet (the route keeps it linkable).
// Sections are a filter here; the section map only opens from a decision's Show full path.

const VIEWS = [
  ['all', 'All'],
  ['mine', 'Open in my parts'],
  ['update', 'Needs update'],
  ['week', 'This week'],
  ['inferred', 'Inferred, not confirmed'],
] as const
type View = (typeof VIEWS)[number][0]

export function ProjectDecisions({ project }: { project: Project; selectedId?: string }) {
  const tasks = useTasks()
  const statusOf = useStatusOf()
  const sections = projectSections(project.id)
  const all = DECISIONS.filter(d => d.project === project.id)
  const [view, setView] = useState<View>('all')
  const [search, setSearch] = useState('')
  const [section, setSection] = useState('all')
  const [state, setState] = useState<'all' | Status>('all')
  const [asked, setAsked] = useState<{ ids: string[]; question: string } | null>(null)
  useEffect(() => onFilterDecisions((ids, question) => setAsked({ ids, question })), [])

  const mine = ledBy(project.id)
  const inSection = (d: Decision) => {
    if (section === 'all') return true
    const ids = [section, ...descendants(sections, section)]
    return sections.some(s => ids.includes(s.id) && s.decisions.some(x => x.id === d.id))
  }
  const inView = (d: Decision) => ({
    all: true,
    mine: mine.includes(d.part) && ['open', 'inf'].includes(statusOf(d)),
    update: reachOf(d.id, tasks).some(r => r.needsUpdate),
    week: (dayOf(d.when) ?? 0) >= 19,
    inferred: statusOf(d) === 'inf',
  })[view]
  const query = search.trim().toLowerCase()
  const rows = all.filter(d => inView(d) && inSection(d) && (state === 'all' || statusOf(d) === state) && (!asked || asked.ids.includes(d.id)) && `${d.title} ${d.why ?? ''} ${d.part} ${d.by ?? ''}`.toLowerCase().includes(query))

  return <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
    <div className="space-y-5 p-6 sm:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Decisions</h1>
      </header>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Saved views">
        {VIEWS.map(([id, label]) => <Button key={id} size="sm" variant={view === id ? 'secondary' : 'ghost'} className={cn('h-7 rounded-full text-xs', view !== id && 'text-muted-foreground')} aria-pressed={view === id} onClick={() => setView(id)}>{label}</Button>)}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative"><Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" /><Input aria-label="Find a decision" placeholder="Search decisions…" value={search} onChange={e => setSearch(e.target.value)} className="w-64 max-w-full pl-9" /></label>
        <select aria-label="Section" value={section} onChange={e => setSection(e.target.value)} className="h-9 max-w-56 rounded-md border bg-background px-3 text-sm"><option value="all">All sections</option>{sections.map(s => <option key={s.id} value={s.id}>{sectionPath(sections, s.id).map(x => x.name).join(' / ')}</option>)}</select>
        <select aria-label="State" value={state} onChange={e => setState(e.target.value as typeof state)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="all">Any state</option>{(['conf', 'inf', 'open', 'chg'] as Status[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
        <span className="ml-auto text-xs text-muted-foreground">{rows.length} of {all.length}</span>
      </div>
      {asked && <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm"><Sparkles className="size-3.5 shrink-0" /><span className="min-w-0 flex-1 truncate">Filtered by Ask · “{asked.question}”</span><Button variant="ghost" size="sm" className="h-7" onClick={() => setAsked(null)}><X />Clear</Button></div>}
      <div className="rounded-lg border"><Table><TableHeader><TableRow>
        <TableHead className="w-[38%] pl-4">Decision</TableHead><TableHead>State</TableHead><TableHead>Part</TableHead><TableHead>Decided by</TableHead><TableHead>Date</TableHead><TableHead className="pr-4">Artifacts affected</TableHead>
      </TableRow></TableHeader><TableBody>
        {rows.map(d => {
          const reach = reachOf(d.id, tasks)
          const pending = reach.filter(r => r.needsUpdate).length
          const status = statusOf(d)
          return <TableRow key={d.id} className="cursor-pointer" onClick={() => navigate(`/p/${project.id}/decisions/${d.id}`)}>
            <TableCell className="min-w-64 py-3 pl-4 whitespace-normal"><button className="text-left font-medium hover:underline" onClick={e => { e.stopPropagation(); navigate(`/p/${project.id}/decisions/${d.id}`) }}>{d.title}</button></TableCell>
            <TableCell><span className="flex items-center gap-1.5 text-xs"><StatusIcon status={status} className="size-3.5 text-muted-foreground" />{STATUS_LABEL[status]}</span></TableCell>
            <TableCell className="text-xs text-muted-foreground">{d.part}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{d.by ?? PEOPLE[d.owner]?.name}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{d.when ?? (d.due ? `Due ${d.due}` : '—')}</TableCell>
            <TableCell className="pr-4 text-xs">{reach.length ? <span className="flex items-center gap-1.5"><span className="tabular-nums">{reach.length}</span>{pending > 0 && <Badge variant="outline" className="font-normal">{pending} {pending === 1 ? 'needs' : 'need'} update</Badge>}</span> : <span className="text-muted-foreground">—</span>}</TableCell>
          </TableRow>
        })}
        {!rows.length && <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No matches.</TableCell></TableRow>}
      </TableBody></Table></div>
    </div>
  </div>
}
