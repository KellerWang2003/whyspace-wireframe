import { useState } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { toast } from 'sonner'
import { ArrowRight, Check, Copy, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PersonAvatar } from '@/components/app/person'
import { StatusIcon } from '@/components/app/status-badge'
import { ACTIVITY, ARTIFACTS, DECISIONS, PEOPLE, reachOf, type Artifact, type ArtifactKind, type Decision, type Project, type Task } from '@/data'
import { navigate } from '@/lib/router'
import { useStore } from '@/lib/store'
import { useStatusOf, useTasks } from '@/lib/work'
import { ArtifactPicture, KIND_ICON } from '@/playground/artifact'

// Artifacts show the state of the work: is it up to date with the decisions it follows,
// who's in it right now, and where to pick it up. Work and evidence (research, tests,
// recordings) are listed apart. The viewer is the one place an artifact opens.

// The tool each kind of artifact continues in.
const TOOL: Record<ArtifactKind, string> = { Figma: 'Figma', Prototype: 'Claude Code', Repo: 'Cursor', Doc: 'Claude', 'AI output': 'Claude', Sheet: 'Claude', Video: 'Runway' }

function stateOf(a: Artifact, tasks: Task[]) {
  const follows = DECISIONS.filter(d => reachOf(d.id, tasks).some(r => r.artifact.id === a.id))
  // One entry per update task, named after the decision the task belongs to.
  const tasksDue = [...new Set(DECISIONS.flatMap(d => reachOf(d.id, tasks).filter(r => r.artifact.id === a.id && r.needsUpdate).map(r => r.task!)))]
  const pending = tasksDue.map(task => ({ task, decision: DECISIONS.find(d => d.id === task.decision) ?? follows[0] }))
  const backs = DECISIONS.filter(d => d.evidence?.some(e => e.artifact === a.id))
  const working = ACTIVITY.find(x => x.artifact === a.id && x.state === 'active')
  return { follows, pending, backs, working }
}

function copy(text: string, tool: string) {
  try { void navigator.clipboard?.writeText(text) } catch { /* clipboard blocked: the toast still explains */ }
  toast(`Prompt copied. Paste it into ${tool}.`)
}

export function ProjectArtifacts({ project, selectedId }: { project: Project; selectedId?: string }) {
  const tasks = useTasks()
  const all = ARTIFACTS.filter(a => a.project === project.id)
  const [tab, setTab] = useState<'work' | 'evidence'>(all.find(a => a.id === selectedId)?.evidence ? 'evidence' : 'work')
  const [search, setSearch] = useState('')
  const [part, setPart] = useState('all')
  const query = search.trim().toLowerCase()
  const inTab = all.filter(a => !!a.evidence === (tab === 'evidence'))
  const matches = inTab.filter(a => (part === 'all' || a.part === part) && `${a.name} ${a.kind} ${a.part} ${PEOPLE[a.owner]?.name}`.toLowerCase().includes(query))
  const selected = all.find(a => a.id === selectedId)
  const close = () => navigate(`/p/${project.id}/artifacts`)
  const open = (a: Artifact) => navigate(`/p/${project.id}/artifacts/${a.id}`)

  return <div className="relative min-h-0 min-w-0 flex-1">
    <div className="h-full space-y-6 overflow-y-auto p-6 sm:p-8">
      <header><h1 className="text-2xl font-semibold tracking-tight">Artifacts</h1><p className="mt-2 text-sm text-muted-foreground">The work in {project.name}, whether it follows the latest decisions, and who's in it now.</p></header>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="work">Work <span className="text-xs tabular-nums text-muted-foreground">{all.filter(a => !a.evidence).length}</span></TabsTrigger>
            <TabsTrigger value="evidence">Evidence <span className="text-xs tabular-nums text-muted-foreground">{all.filter(a => a.evidence).length}</span></TabsTrigger>
          </TabsList>
        </Tabs>
        <label className="relative"><Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" /><Input aria-label="Find an artifact" placeholder="Search artifacts or people…" value={search} onChange={e => setSearch(e.target.value)} className="w-64 max-w-full pl-9" /></label>
        <select aria-label="Part" value={part} onChange={e => setPart(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="all">All parts</option>{[...new Set(all.map(a => a.part))].map(p => <option key={p}>{p}</option>)}</select>
        <p className="ml-auto text-xs text-muted-foreground">{tab === 'evidence' ? 'Research, tests and recordings that back the whys' : `${matches.length} ${matches.length === 1 ? 'artifact' : 'artifacts'}`}</p>
      </div>
      <div className="rounded-lg border"><Table><TableHeader><TableRow>
        <TableHead className="w-[30%] pl-4">Artifact</TableHead>
        <TableHead>{tab === 'evidence' ? 'Backs' : 'Status'}</TableHead>
        <TableHead>Working now</TableHead>
        <TableHead>Owner</TableHead>
        <TableHead className="pr-4">Updated</TableHead>
      </TableRow></TableHeader><TableBody>
        {matches.map(a => {
          const Icon = KIND_ICON[a.kind]
          const s = stateOf(a, tasks)
          return <TableRow key={a.id}>
            <TableCell className="py-3 pl-4"><button className="flex items-center gap-3 text-left hover:underline" onClick={() => open(a)}><Icon className="size-4 shrink-0 text-muted-foreground" /><span><span className="block font-medium">{a.name}</span><span className="block text-xs text-muted-foreground">{a.kind} · {a.part}</span></span></button></TableCell>
            <TableCell className="whitespace-normal">
              {tab === 'evidence'
                ? <span className="text-xs text-muted-foreground">{s.backs.length ? `${s.backs.length} ${s.backs.length === 1 ? 'decision' : 'decisions'}` : '—'}</span>
                : s.pending.length
                  ? <div className="space-y-0.5"><Badge variant="outline" className="font-normal">Needs update</Badge><p className="max-w-56 truncate text-xs text-muted-foreground" title={s.pending[0].decision.title}>{s.pending[0].decision.title}</p></div>
                  : <span className="flex items-center gap-1 text-xs text-muted-foreground"><Check className="size-3.5" />Up to date</span>}
            </TableCell>
            <TableCell className="text-xs">{s.working ? <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-foreground" />{PEOPLE[s.working.who]?.name.split(' ')[0]} · {s.working.tool ?? 'here'}</span> : <span className="text-muted-foreground">—</span>}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{PEOPLE[a.owner]?.name}</TableCell>
            <TableCell className="pr-4 text-xs text-muted-foreground">{a.updated}</TableCell>
          </TableRow>
        })}
        {!matches.length && <TableRow><TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">{inTab.length ? 'No artifacts match your search.' : tab === 'evidence' ? 'No evidence in this project yet.' : 'No artifacts in this project yet.'}</TableCell></TableRow>}
      </TableBody></Table></div>
    </div>
    <DialogPrimitive.Root open={!!selected} modal={false} onOpenChange={o => { if (!o) close() }}>
      {selected && <><div className="absolute inset-0 z-[44] bg-black/20" onPointerDown={close} /><DialogPrimitive.Content className="absolute inset-4 z-[45] flex min-h-0 flex-col overflow-hidden rounded-xl border bg-background shadow-2xl outline-none sm:inset-8" onInteractOutside={e => e.preventDefault()} onFocusOutside={e => e.preventDefault()}>
        <ArtifactViewer artifact={selected} tasks={tasks} />
      </DialogPrimitive.Content></>}
    </DialogPrimitive.Root>
  </div>
}

function ArtifactViewer({ artifact: a, tasks }: { artifact: Artifact; tasks: Task[] }) {
  const { openDecision, patchTask } = useStore()
  const statusOf = useStatusOf()
  const s = stateOf(a, tasks)
  const tool = TOOL[a.kind]
  const prompt = `Continue ${a.name} (${a.kind}). Keep to these decisions:\n${s.follows.map((d, i) => `${i + 1}. ${d.title}. ${d.why ?? ''}`).join('\n')}`
  const decisionRow = (d: Decision) => <button key={d.id} onClick={() => openDecision(d.id)} className="flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left hover:bg-muted">
    <StatusIcon status={statusOf(d)} className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
    <span className="min-w-0 flex-1"><span className="block text-xs font-medium">{d.title}</span><span className="block text-[11px] text-muted-foreground">{d.by ?? PEOPLE[d.owner]?.name} · {d.when ?? d.due}</span></span>
  </button>

  return <>
    <div className="flex items-start justify-between gap-4 border-b p-5">
      <div><DialogPrimitive.Title className="text-lg font-semibold">{a.name}</DialogPrimitive.Title><DialogPrimitive.Description className="mt-1 text-xs text-muted-foreground">{a.kind} · {a.part} · {PEOPLE[a.owner]?.name} · Updated {a.updated}{a.version ? ` · ${a.version}` : ''}</DialogPrimitive.Description></div>
      <DialogPrimitive.Close asChild><Button variant="ghost" size="icon" aria-label="Close artifact"><X /></Button></DialogPrimitive.Close>
    </div>
    <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_340px] lg:overflow-hidden">
      <div className="space-y-3 p-6 lg:overflow-y-auto">
        <div className="h-[min(55vh,520px)] min-h-64 overflow-hidden rounded-lg border bg-muted/40 p-5"><ArtifactPicture artifact={a} /></div>
        <p className="text-sm text-muted-foreground">{a.meta}</p>
        <p className="text-xs text-muted-foreground">Wireframe preview</p>
      </div>
      <aside className="space-y-6 border-t p-5 lg:overflow-y-auto lg:border-t-0 lg:border-l">
        {s.pending.map(({ decision, task }) => <div key={decision.id} className="space-y-2 rounded-lg border border-dashed p-3">
          <p className="text-xs font-medium">Needs update</p>
          <button className="text-left text-sm hover:underline" onClick={() => openDecision(decision.id)}>{decision.title}</button>
          <p className="text-xs text-muted-foreground">Task for {PEOPLE[task.owner]?.name.split(' ')[0]} · due {task.due}</p>
          <div className="flex gap-2">
            {task.prompt && <Button size="sm" variant="outline" onClick={() => copy(task.prompt!, task.tool ?? tool)}><Copy />Copy prompt</Button>}
            <Button size="sm" variant="ghost" onClick={() => { patchTask(task.id, { status: 'done' }); toast('Marked updated', { action: { label: 'Undo', onClick: () => patchTask(task.id, { status: task.status }) } }) }}><Check />Mark updated</Button>
          </div>
        </div>)}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Working now</p>
          {s.working ? <div className="flex items-center gap-2 text-sm"><PersonAvatar id={s.working.who} /><span className="font-medium">{PEOPLE[s.working.who]?.name}</span><span className="truncate text-muted-foreground">· {s.working.tool} · {s.working.since}</span></div> : <p className="text-sm text-muted-foreground">Nobody right now.</p>}
          {s.working?.aiDoing && <p className="text-xs text-muted-foreground">{s.working.aiDoing}</p>}
        </div>
        {a.evidence ? <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Backs these decisions</p>
          {s.backs.length ? s.backs.map(decisionRow) : <p className="text-sm text-muted-foreground">Not linked to a decision yet.</p>}
        </div> : <>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Decisions it follows</p>
            {s.follows.length ? s.follows.map(decisionRow) : <p className="text-sm text-muted-foreground">No decisions shape this yet.</p>}
            <p className="text-[11px] text-muted-foreground">Connected AI tools pull these through MCP when someone works on it.</p>
          </div>
          {s.follows.length > 0 && <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Continue in {tool}</p>
            <pre className="max-h-40 overflow-y-auto rounded-lg border bg-muted/30 p-3 font-sans text-xs leading-relaxed whitespace-pre-wrap">{prompt}</pre>
            <Button size="sm" onClick={() => copy(prompt, tool)}><Copy />Copy prompt<ArrowRight className="opacity-60" />{tool}</Button>
          </div>}
        </>}
      </aside>
    </div>
  </>
}
