import { useRef, useState, type DragEvent } from 'react'
import { toast } from 'sonner'
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Code, Copy, Film, HardDrive, Link2, MoreHorizontal, PenTool, Plus, Search, Sparkles, Upload, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { PersonAvatar } from '@/components/app/person'
import { StatusIcon } from '@/components/app/status-badge'
import { ACTIVITY, ARTIFACTS, ARTIFACT_SOURCE, DECISIONS, PEOPLE, partsOf, reachOf, type Artifact, type ArtifactKind, type ArtifactSource, type Decision, type Project, type Task } from '@/data'
import { navigate } from '@/lib/router'
import { VIEWER } from '@/lib/viewer'
import { useStore } from '@/lib/store'
import { useStatusOf, useTasks } from '@/lib/work'
import { ArtifactPicture } from '@/playground/artifact'
import { DESIGN } from '@/lib/design'
import { DecisionCard, MarksRow } from '@/app/card'
import { decisionsOf } from '@/app/card-model'
import { PRESET } from '@/scenarios/data'
import { BrandDeckDialog } from '@/scenarios/artifacts/brand-deck'

// Artifacts are a quiet shelf of links: one card per thread, tiles in a sideways row.
// The work lives in its own tool; only manual uploads and pasted text are stored here.

export type Item = Artifact & { source: ArtifactSource; where: string; url?: string }

const SOURCE_ICON: Record<ArtifactSource, typeof FileText> = {
  Figma: PenTool, 'Google Drive': HardDrive, GitHub: Code, Runway: Film, Claude: Sparkles, Notion: FileText, Link: Link2, Whyspace: Upload,
}

// Guess where a pasted link lives.
export function sourceOf(url: string): { source: ArtifactSource; kind: ArtifactKind } {
  const u = url.toLowerCase()
  if (u.includes('figma.com')) return { source: 'Figma', kind: 'Figma' }
  if (u.includes('github.com')) return { source: 'GitHub', kind: 'Repo' }
  if (u.includes('drive.google') || u.includes('docs.google')) return { source: 'Google Drive', kind: 'Doc' }
  if (u.includes('runway')) return { source: 'Runway', kind: 'Video' }
  if (u.includes('claude.ai')) return { source: 'Claude', kind: 'AI output' }
  if (u.includes('notion.')) return { source: 'Notion', kind: 'Doc' }
  return { source: 'Link', kind: 'Prototype' }
}

// Mock files offered by each connected tool.
const CONNECTED: { source: ArtifactSource; files: { name: string; kind: ArtifactKind; where: string }[] }[] = [
  { source: 'Google Drive', files: [{ name: 'Launch checklist', kind: 'Sheet', where: 'Shared drive' }, { name: 'Cat owner survey', kind: 'Doc', where: 'Research' }] },
  { source: 'Figma', files: [{ name: 'Onboarding flow', kind: 'Figma', where: 'App' }, { name: 'Sticker set', kind: 'Figma', where: 'Brand' }] },
  { source: 'GitHub', files: [{ name: 'whiskr/app', kind: 'Repo', where: 'Repository' }] },
  { source: 'Notion', files: [{ name: 'Team rituals', kind: 'Doc', where: 'Workspace' }] },
]

export function stateOf(a: Artifact, tasks: Task[]) {
  const follows = DECISIONS.filter(d => reachOf(d.id, tasks).some(r => r.artifact.id === a.id) || d.evidence?.some(e => e.artifact === a.id))
  const tasksDue = [...new Set(DECISIONS.flatMap(d => reachOf(d.id, tasks).filter(r => r.artifact.id === a.id && r.needsUpdate).map(r => r.task!)))]
  const pending = tasksDue.map(task => ({ task, decision: DECISIONS.find(d => d.id === task.decision) ?? follows[0] }))
  const working = ACTIVITY.find(x => x.artifact === a.id && x.state === 'active')
  return { follows, pending, working }
}

const firstName = (id: string) => PEOPLE[id]?.name.split(' ')[0] ?? id

export function ProjectArtifacts({ project, selectedId }: { project: Project; selectedId?: string }) {
  const tasks = useTasks()
  const [added, setAdded] = useState<Item[]>([])
  const [moved, setMoved] = useState<Record<string, string>>({})
  const [removed, setRemoved] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState<{ thread?: string } | null>(null)

  const all: Item[] = [
    ...ARTIFACTS.filter(a => a.project === project.id).map(a => ({ ...a, ...(ARTIFACT_SOURCE[a.id] ?? { source: 'Link' as const, where: '' }) })),
    ...added,
  ].filter(a => !removed.includes(a.id)).map(a => ({ ...a, part: moved[a.id] ?? a.part }))
  const threads = [...new Set([...partsOf(DECISIONS.filter(d => d.project === project.id)).map(p => p.name), ...all.map(a => a.part)])]
  const query = search.trim().toLowerCase()
  const matches = (a: Item) => !query || `${a.name} ${a.source} ${a.where} ${a.part} ${PEOPLE[a.owner]?.name}`.toLowerCase().includes(query)
  const selected = all.find(a => a.id === selectedId)
  const open = (a: Item) => navigate(`/p/${project.id}/artifacts/${a.id}`)
  const close = () => navigate(`/p/${project.id}/artifacts`)

  const add = (a: Omit<Item, 'id' | 'project' | 'owner' | 'updated' | 'decisions' | 'meta'> & { meta?: string }) => {
    setAdded(xs => [...xs, { id: `new-${Date.now()}`, project: project.id, owner: VIEWER, updated: 'Just now', decisions: 0, meta: a.meta ?? '', ...a }])
    toast(`Added to ${a.part}`)
  }
  const move = (id: string, thread: string) => { setMoved(m => ({ ...m, [id]: thread })); toast(`Moved to ${thread}`) }
  const remove = (a: Item) => {
    setRemoved(r => [...r, a.id]); close()
    toast('Removed from Whyspace', { action: { label: 'Undo', onClick: () => setRemoved(r => r.filter(x => x !== a.id)) } })
  }

  // Drop a tile to move it, or drop a file or link straight into a thread.
  const drop = (thread: string, e: DragEvent) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('whyspace/artifact')
    if (id) { if (all.find(a => a.id === id)?.part !== thread) move(id, thread); return }
    const file = e.dataTransfer.files[0]
    if (file) { add({ name: file.name, kind: 'Doc', part: thread, source: 'Whyspace', where: `Uploaded · ${file.name}` }); return }
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
    if (url) add({ name: url.replace(/^https?:\/\//, '').slice(0, 40), part: thread, url, where: url.replace(/^https?:\/\//, '').split('/')[0], ...sourceOf(url) })
  }

  const visible = threads.filter(t => !query || all.some(a => a.part === t && matches(a)))

  return <div className="relative min-h-0 min-w-0 flex-1">
    <div className="h-full space-y-6 overflow-y-auto p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto type-title">Artifacts</h1>
        <label className="relative"><Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" /><Input aria-label="Find an artifact" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} className="w-56 max-w-full pl-9" /></label>
        <Button size="sm" onClick={() => setAdding({})}><Plus />Add</Button>
      </div>
      {visible.map(t => <ThreadCard key={t} name={t} items={all.filter(a => a.part === t && matches(a))} tasks={tasks} onOpen={open} onAdd={() => setAdding({ thread: t })} onDrop={e => drop(t, e)} />)}
      {!visible.length && <p className="py-12 text-center text-sm text-muted-foreground">No matches.</p>}
    </div>
    <Sheet open={!!selected} onOpenChange={o => { if (!o) close() }}>
      <SheetContent resizeKey="artifact" className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {selected && <ArtifactSheet artifact={selected} tasks={tasks} threads={threads} onMove={t => move(selected.id, t)} onRemove={() => remove(selected)} />}
      </SheetContent>
    </Sheet>
    <AddArtifactDialog open={!!adding} thread={adding?.thread} threads={threads} onClose={() => setAdding(null)} onAdd={add} />
  </div>
}

function ThreadCard({ name, items, tasks, onOpen, onAdd, onDrop }: { name: string; items: Item[]; tasks: Task[]; onOpen: (a: Item) => void; onAdd: () => void; onDrop: (e: DragEvent) => void }) {
  const row = useRef<HTMLDivElement>(null)
  const [over, setOver] = useState(false)
  const scroll = (dir: number) => row.current?.scrollBy({ left: dir * 440, behavior: 'smooth' })
  return <section
    className={`group/thread rounded-xl transition-colors ${over ? 'bg-muted/60' : ''}`}
    onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={e => { setOver(false); onDrop(e) }}>
    <div className="flex items-center gap-2">
      <h2 className="type-section">{name}</h2>
      <span className="text-xs tabular-nums text-muted-foreground">{items.length}</span>
    </div>
    <div className="relative">
      <div ref={row} className="flex gap-3 overflow-x-auto scroll-smooth pt-2 pb-2 [scrollbar-width:none]">
        {items.map(a => <Tile key={a.id} artifact={a} needsUpdate={stateOf(a, tasks).pending.length > 0} onOpen={() => onOpen(a)} />)}
        <button onClick={onAdd} className="flex w-52 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-xs text-muted-foreground hover:border-foreground/40 hover:text-foreground" style={{ minHeight: 172 }}><Plus className="size-4" />Add</button>
      </div>
      {items.length > 3 && <>
        <Button size="icon-sm" variant="outline" aria-label="Scroll left" className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full opacity-0 shadow-sm transition group-hover/thread:opacity-100" onClick={() => scroll(-1)}><ChevronLeft /></Button>
        <Button size="icon-sm" variant="outline" aria-label="Scroll right" className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full opacity-0 shadow-sm transition group-hover/thread:opacity-100" onClick={() => scroll(1)}><ChevronRight /></Button>
      </>}
    </div>
  </section>
}

export function Tile({ artifact: a, needsUpdate, onOpen }: { artifact: Item; needsUpdate: boolean; onOpen: () => void }) {
  const Icon = SOURCE_ICON[a.source]
  return <button draggable onDragStart={e => e.dataTransfer.setData('whyspace/artifact', a.id)} onClick={onOpen}
    className="flex w-52 shrink-0 flex-col overflow-hidden rounded-xl bg-muted text-left transition-colors hover:bg-muted/70">
    <div className="pointer-events-none h-24 overflow-hidden p-3"><ArtifactPicture artifact={a} /></div>
    <div className="space-y-1 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span className="truncate text-sm font-medium">{a.name}</span>
        {needsUpdate && <span title="Needs update" className="size-1.5 shrink-0 rounded-full bg-foreground" />}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="size-3 shrink-0" /><span className="truncate">{a.source === 'Whyspace' ? 'Stored here' : a.source}</span></div>
      <div className="truncate text-[11px] text-muted-foreground">{firstName(a.owner)} · {a.updated}</div>
      {DESIGN === 'b' && <TileMarks artifact={a} />}
    </div>
  </button>
}

// Main design: the card's marks on the tile, so a shelf reads what is confirmed before anything opens.
function TileMarks({ artifact }: { artifact: Item }) {
  const tasks = useTasks()
  return <MarksRow decisions={decisionsOf(artifact, tasks)} className="pt-0.5" />
}

export function ArtifactSheet({ artifact: a, tasks, threads, onMove, onRemove }: { artifact: Item; tasks: Task[]; threads: string[]; onMove: (t: string) => void; onRemove: () => void }) {
  const { openDecision, patchTask } = useStore()
  const statusOf = useStatusOf()
  const s = stateOf(a, tasks)
  const Icon = SOURCE_ICON[a.source]
  const stored = a.source === 'Whyspace'
  const [deck, setDeck] = useState(false)
  const openSource = () => { if (PRESET.deck === a.id) setDeck(true); else if (a.url) window.open(a.url, '_blank', 'noopener'); else toast(stored ? 'Opening file' : 'No link yet') }
  const copy = (text: string) => { try { void navigator.clipboard?.writeText(text) } catch { /* blocked */ } toast('Prompt copied') }
  const decisionRow = (d: Decision) => <button key={d.id} onClick={() => openDecision(d.id)} className="flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left hover:bg-muted">
    <StatusIcon status={statusOf(d)} className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
    <span className="min-w-0 flex-1 text-xs font-medium">{d.title}</span>
  </button>

  return <>
    <SheetHeader className="gap-1 border-b pr-12">
      <SheetTitle>{a.name}</SheetTitle>
      <SheetDescription className="flex items-center gap-1.5 text-xs"><Icon className="size-3.5" />{stored ? 'Stored in Whyspace' : a.source}{a.where ? ` · ${a.where}` : ''}</SheetDescription>
    </SheetHeader>
    <div className="space-y-6 p-4">
      <div className="h-48 overflow-hidden rounded-xl bg-muted p-4"><ArtifactPicture artifact={a} /></div>
      <div className="flex items-center gap-2">
        <Button size="sm" className="flex-1" onClick={openSource}>{stored ? 'Open file' : `Open in ${a.source === 'Link' ? 'browser' : a.source}`}<ArrowUpRight /></Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button size="icon-sm" variant="outline" aria-label="More"><MoreHorizontal /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to thread</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>{threads.map(t => <DropdownMenuItem key={t} disabled={t === a.part} onSelect={() => onMove(t)}>{t}</DropdownMenuItem>)}</DropdownMenuSubContent>
            </DropdownMenuSub>
            {!stored && <DropdownMenuItem onSelect={() => toast('Link editing is mocked')}>Edit link</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onRemove}>Remove from Whyspace</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="text-xs text-muted-foreground">{a.part} · added by {firstName(a.owner)} · {a.updated}</p>
      {s.working && <div className="flex items-center gap-2 text-sm"><PersonAvatar id={s.working.who} /><span>{firstName(s.working.who)} is in it now</span><span className="truncate text-muted-foreground">· {s.working.tool ?? 'here'}</span></div>}
      {s.pending.map(({ decision, task }) => <div key={task.id} className="space-y-2 rounded-lg border border-dashed p-3">
        <p className="text-xs font-medium">Needs update</p>
        <button className="text-left text-sm hover:underline" onClick={() => openDecision(decision.id)}>{decision.title}</button>
        <div className="flex gap-2">
          {task.prompt && <Button size="sm" variant="outline" onClick={() => copy(task.prompt!)}><Copy />Copy prompt</Button>}
          <Button size="sm" variant="ghost" onClick={() => { patchTask(task.id, { status: 'done' }); toast('Marked updated', { action: { label: 'Undo', onClick: () => patchTask(task.id, { status: task.status }) } }) }}><Check />Mark updated</Button>
        </div>
      </div>)}
      {DESIGN === 'b' ? <DecisionCard artifact={a} decisions={s.follows} /> : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Decisions</p>
          {s.follows.length ? s.follows.map(decisionRow) : <p className="text-sm text-muted-foreground">None yet</p>}
        </div>
      )}
    </div>
    {PRESET.deck === a.id && <BrandDeckDialog open={deck} onOpenChange={setDeck} artifact={a.id} />}
  </>
}

export function AddArtifactDialog({ open, thread, threads, onClose, onAdd }: { open: boolean; thread?: string; threads: string[]; onClose: () => void; onAdd: (a: Omit<Item, 'id' | 'project' | 'owner' | 'updated' | 'decisions' | 'meta'> & { meta?: string }) => void }) {
  const [tab, setTab] = useState('link')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [picked, setPicked] = useState<{ source: ArtifactSource; name: string; kind: ArtifactKind; where: string } | null>(null)
  const [to, setTo] = useState('')
  const target = to || thread || threads[0]
  const reset = () => { setUrl(''); setTitle(''); setText(''); setFile(null); setPicked(null); setTo(''); setTab('link') }
  const done = () => { reset(); onClose() }
  const host = url.replace(/^https?:\/\//, '').split('/')[0]
  const ready = { link: !!host, tool: !!picked, upload: !!file, text: !!text.trim() }[tab]

  const submit = () => {
    if (tab === 'link') onAdd({ name: title.trim() || host, part: target, url: url.startsWith('http') ? url : `https://${url}`, where: host, ...sourceOf(url) })
    if (tab === 'tool' && picked) onAdd({ name: picked.name, kind: picked.kind, part: target, source: picked.source, where: picked.where, url: 'https://example.com' })
    if (tab === 'upload' && file) onAdd({ name: title.trim() || file.name, kind: 'Doc', part: target, source: 'Whyspace', where: `Uploaded · ${file.name}` })
    if (tab === 'text') onAdd({ name: title.trim() || 'Untitled note', kind: 'AI output', part: target, source: 'Whyspace', where: 'Saved as .md', content: { heading: title.trim() || 'Untitled note', paragraphs: text.trim().split(/\n+/).slice(0, 4) } })
    done()
  }

  return <Dialog open={open} onOpenChange={o => { if (!o) done() }}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>Add artifact</DialogTitle></DialogHeader>
      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList className="w-full">
          <TabsTrigger value="link">Link</TabsTrigger>
          {DESIGN !== 'b' && <TabsTrigger value="tool">From a tool</TabsTrigger>}
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
        </TabsList>
        <TabsContent value="link" className="space-y-3">
          <Input autoFocus placeholder="Paste a link" value={url} onChange={e => setUrl(e.target.value)} />
          {host && <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{(() => { const I = SOURCE_ICON[sourceOf(url).source]; return <I className="size-3.5" /> })()}{sourceOf(url).source} · {host}</p>}
          <Input placeholder="Name (optional)" value={title} onChange={e => setTitle(e.target.value)} />
        </TabsContent>
        <TabsContent value="tool" className="max-h-64 space-y-3 overflow-y-auto">
          {CONNECTED.map(c => { const I = SOURCE_ICON[c.source]; return <div key={c.source} className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><I className="size-3.5" />{c.source}</p>
            {c.files.map(f => { const on = picked?.name === f.name; return <button key={f.name} onClick={() => setPicked({ source: c.source, ...f })} className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted ${on ? 'border-foreground' : ''}`}>
              <span>{f.name}</span><span className="text-xs text-muted-foreground">{on ? <Check className="size-3.5" /> : f.where}</span>
            </button> })}
          </div> })}
        </TabsContent>
        <TabsContent value="upload" className="space-y-3">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground hover:border-foreground/40">
            <Upload className="size-4" />{file ? file.name : 'Choose or drop a file'}
            <input type="file" className="sr-only" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <p className="text-xs text-muted-foreground">Stored in Whyspace.</p>
        </TabsContent>
        <TabsContent value="text" className="space-y-3">
          <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Paste an AI answer or notes" rows={6} value={text} onChange={e => setText(e.target.value)} />
        </TabsContent>
      </Tabs>
      <div className="space-y-1.5">
        <Label htmlFor="add-thread" className="text-xs text-muted-foreground">Thread</Label>
        <select id="add-thread" value={target} onChange={e => setTo(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{threads.map(t => <option key={t}>{t}</option>)}</select>
      </div>
      <DialogFooter><Button variant="ghost" onClick={done}>Cancel</Button><Button disabled={!ready} onClick={submit}>Add</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
