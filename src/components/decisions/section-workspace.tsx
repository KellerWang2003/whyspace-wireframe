import { useRef, useState, type DragEvent, type PointerEvent, type ReactNode } from 'react'
import { ArrowRight, PanelLeft, ChevronDown, ChevronRight, FileText, Folder, GripVertical, Maximize2, Minimize2, Plus, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { STATUS_LABEL, type Project } from '@/data'
import { SectionMap } from './section-map'
import { SectionWindow } from './section-window'
import { ArtifactStage } from './section-detail'
import { descendants, moveWorkSection, sectionPath, type SectionArtifact, type SectionDecision, type WorkSection } from './section-model'

type Preview = { title: string; description: string; body: ReactNode }

export function SectionWorkspace({ project, initialSections, selectedId, onDecisionChange, onArtifact }: {
  project: Project
  initialSections: WorkSection[]
  selectedId?: string
  onDecisionChange?: (id: string | null) => void
  onArtifact?: (id: string) => void
}) {
  const [sections, setSections] = useState<WorkSection[]>(initialSections)
  const [outlineOpen, setOutlineOpen] = useState(false)
  const [navigation, setNavigation] = useState<{ id: string; serial: number } | null>(null)
  const navigationSerial = useRef(0)
  const [showDecisions, setShowDecisions] = useState(false)
  const [selected, setSelected] = useState(initialSections[0]?.id ?? '')
  const [expanded, setExpanded] = useState<string[]>([])
  const [minimized, setMinimized] = useState<string[]>([])
  const [focused, setFocused] = useState<string | null>(null)
  const [focusDecision, setFocusDecision] = useState<string | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [moving, setMoving] = useState<string | null>(null)
  const [dragged, setDragged] = useState<string | null>(null)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const dragSession = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null)
  const didDrag = useRef(false)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [lastMove, setLastMove] = useState<{ id: string; parent: string | null; before?: string } | null>(null)
  const [message, setMessage] = useState('')
  const kids = (parent: string | null) => sections.filter(s => s.parent === parent)
  const current = sections.find(s => s.id === selected) ?? sections[0]
  const activeDecision = sections.flatMap(s => s.decisions).find(d => d.id === focusDecision)
  const sourceSection = activeDecision ? sections.find(s => s.decisions.some(d => d.id === activeDecision.id)) : undefined
  const pathLabel = (id: string) => sectionPath(sections, id).map(s => s.name).join(' / ')
  const toggleExpanded = (id: string) => {
    if (expanded.includes(id) && focused && descendants(sections, id).includes(focused)) setFocused(null)
    setExpanded(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id])
  }
  const isMinimized = (id: string) => minimized.includes(id)
  const reveal = (id: string) => {
    setSelected(id)
    setExpanded(old => [...new Set([...old, ...sectionPath(sections, id).slice(0, -1).map(s => s.id)])])
  }
  const navigateSection = (id: string) => {
    if (id !== '__project__') reveal(id)
    setNavigation({ id, serial: ++navigationSerial.current })
  }
  const focus = (id: string) => { setSelected(id); setFocused(id); setFocusDecision(null) }
  const toggleMinimized = (id: string) => {
    const minimal = isMinimized(id)
    if (focused) setFocused(null)
    setMinimized(old => minimal ? old.filter(x => x !== id) : [...new Set([...old, id])])
  }
  const canMove = (id: string, parent: string | null) => id !== parent && !descendants(sections, id).includes(parent ?? '')
  const move = (id: string, parent: string | null, before?: string) => {
    const next = moveWorkSection(sections, id, parent, before)
    if (next === sections) { setMessage('A section cannot be moved inside itself or one of its subsections.'); return }
    const original = sections.find(s => s.id === id)!
    const siblings = sections.filter(s => s.parent === original.parent)
    setLastMove({ id, parent: original.parent, before: siblings[siblings.findIndex(s => s.id === id) + 1]?.id })
    setSections(next)
    setExpanded(old => [...new Set([...old, ...(parent ? sectionPath(next, parent).map(s => s.id) : [])])])
    setMessage(`Moved ${sections.find(s => s.id === id)?.name} into ${parent ? sections.find(s => s.id === parent)?.name : project.name}.`)
    setDragged(null)
    setDropTarget(null)
  }
  const pointerTarget = (x: number, y: number) => {
    const hit = document.elementFromPoint(x, y)
    const before = hit?.closest<HTMLElement>('[data-section-before]')
    const target = hit?.closest<HTMLElement>('[data-section-drop]')
    return { parent: target?.dataset.sectionDrop === '__project__' ? null : target?.dataset.sectionDrop, before: before?.dataset.sectionBefore }
  }
  const dragEvents = (id: string) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      e.stopPropagation()
      didDrag.current = false
      dragSession.current = { id, x: e.clientX, y: e.clientY, moved: false }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const session = dragSession.current
      if (!session || session.id !== id) return
      if (!session.moved && Math.hypot(e.clientX - session.x, e.clientY - session.y) < 6) return
      session.moved = true
      didDrag.current = true
      setDragged(id)
      setDragPosition({ x: e.clientX, y: e.clientY })
      const target = pointerTarget(e.clientX, e.clientY)
      setDropTarget(target.parent && canMove(id, target.parent) ? target.parent : null)
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const session = dragSession.current
      if (session?.moved) {
        const target = pointerTarget(e.clientX, e.clientY)
        if (target.parent !== undefined) move(session.id, target.parent, target.before)
      }
      dragSession.current = null
      setDragged(null); setDragPosition(null); setDropTarget(null)
    },
    onPointerCancel: () => { dragSession.current = null; setDragged(null); setDragPosition(null); setDropTarget(null) },
  })
  const drop = (event: DragEvent, parent: string | null, before?: string) => {
    event.preventDefault()
    event.stopPropagation()
    const data = event.dataTransfer.getData('text/plain')
    if (data.startsWith('whyspace-section:')) move(data.slice(17), parent, before)
  }
  const related = (s: WorkSection) => !activeDecision || [s.id, ...descendants(sections, s.id)].some(id => id === sourceSection?.id || activeDecision.drives.includes(id))

  const decisionPreview = (d: SectionDecision, s: WorkSection): Preview => ({
    title: d.title,
    description: `${pathLabel(s.id)} · ${s.owner} · ${d.source ? STATUS_LABEL[d.source.status] : d.inferred ? 'Inferred by AI · awaiting human confirmation' : 'Confirmed by a person'}`,
    body: <div className="space-y-5">
      <div><p className="mb-2 text-xs text-muted-foreground">Why</p><p className="text-sm leading-relaxed">{d.why}</p></div>
      {d.source?.was && <div><p className="mb-2 text-xs text-muted-foreground">Replaced</p><p className="text-sm line-through">{d.source.was}</p></div>}
      {d.source?.snippet && <blockquote className="border-l-2 pl-3 text-sm italic text-muted-foreground">{d.source.snippet}</blockquote>}
      <div><p className="mb-2 text-xs text-muted-foreground">Drives work in</p><div className="flex flex-wrap gap-2">{d.drives.map(id => <Button key={id} variant="outline" size="sm" onClick={() => { focus(id); closePreview() }}>{sections.find(s => s.id === id)?.name}<ArrowRight /></Button>)}</div></div>
      {d.inferred && <Button onClick={() => { setSections(old => old.map(section => ({ ...section, decisions: section.decisions.map(item => item.id === d.id ? { ...item, inferred: false, source: item.source ? { ...item.source, status: 'conf' } : undefined } : item) }))); closePreview() }}>Confirm decision</Button>}
    </div>,
  })
  function closePreview() {
    setPreview(null)
    if (onDecisionChange && selectedId) onDecisionChange(null)
  }
  function openDecision(d: SectionDecision, s: WorkSection) {
    if (onDecisionChange) { reveal(s.id); onDecisionChange(d.id) }
    else setPreview(decisionPreview(d, s))
  }
  const routeSection = selectedId ? sections.find(s => s.decisions.some(d => d.id === selectedId)) : undefined
  const routeDecision = routeSection?.decisions.find(d => d.id === selectedId)
  const visiblePreview = routeSection && routeDecision ? decisionPreview(routeDecision, routeSection) : preview
  const openArtifact = (a: SectionArtifact, s: WorkSection) => {
    if (a.source && onArtifact) { onArtifact(a.id); return }
    setPreview({
    title: a.name,
    description: `${a.kind} · ${pathLabel(s.id)} · ${a.updated}`,
    body: <div className="space-y-4"><ArtifactStage artifact={a} /><p className="text-xs text-muted-foreground">Wireframe preview</p><Button variant="outline" onClick={() => { focus(s.id); closePreview() }}>Open section in detail<ArrowRight /></Button></div>,
    })
  }

  function decisionList(s: WorkSection) {
    return <div className="space-y-2">
      {s.decisions.length === 0 && <p className="text-xs text-muted-foreground">No decisions recorded here.</p>}
      {s.decisions.map(d => <div key={d.id} className={cn('rounded-md border p-2.5', d.inferred && 'border-dashed', focusDecision === d.id && 'ring-2 ring-foreground/30')}>
        <button className="text-left text-xs font-medium hover:underline" onClick={() => openDecision(d, s)}>{d.inferred && <Sparkles className="mr-1 inline size-3" />}{d.title}</button>
        {showDecisions && <><button className="mt-2 block text-[10px] underline underline-offset-2" onClick={() => setFocusDecision(focusDecision === d.id ? null : d.id)}>Trace relationships</button><div className="mt-2 space-y-1">{d.drives.map(id => <button key={id} onClick={() => { reveal(id); setFocusDecision(d.id) }} className="flex items-start gap-1 text-left text-[10px] text-muted-foreground hover:text-foreground"><ArrowRight className="mt-0.5 size-3 shrink-0" /><span>Drives {pathLabel(id)}</span></button>)}</div></>}
      </div>)}
    </div>
  }

  function frame(s: WorkSection) {
    const minimal = isMinimized(s.id)
    return <section className={cn('@container rounded-xl border bg-background shadow-xs', !related(s) && 'opacity-35')}>
      <div className={cn('flex items-center gap-1 border-b px-3 py-3', minimal && 'border-b-0')}>
        <span {...dragEvents(s.id)} title={`Drag ${s.name} to move it`} aria-label={`Drag ${s.name}`} className="touch-none cursor-grab select-none rounded p-1 text-muted-foreground active:cursor-grabbing"><GripVertical className="size-3.5" /></span>
        <button className="min-w-0 flex-1 truncate text-left text-sm font-semibold" onClick={() => focus(s.id)}>{s.name}</button>
        <button aria-label={`${minimal ? 'Restore' : 'Minimize'} ${s.name}`} title={minimal ? 'Show section content' : 'Title only'} className="rounded p-1.5 text-muted-foreground hover:bg-muted" onClick={() => toggleMinimized(s.id)}>{minimal ? <ChevronDown className="size-3.5" /> : <Minimize2 className="size-3.5" />}</button>
        <button aria-label={`Expand ${s.name} details`} title="Expand section" className="rounded p-1.5 text-muted-foreground hover:bg-muted" onClick={() => focus(s.id)}><Maximize2 className="size-3.5" /></button>
        <button aria-label={`Move ${s.name}`} title="Move section" className="rounded p-1.5 text-muted-foreground hover:bg-muted" onClick={() => setMoving(s.id)}><Folder className="size-3.5" /></button>
      </div>
      {!minimal && <div className="space-y-4 p-4">
        <div className="space-y-1.5"><p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"><Sparkles className="size-3" />Current direction</p><p className="text-xs leading-relaxed">{s.summary}</p></div>
        <div><p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Artifacts · {s.artifacts.length}</p><div className="space-y-1.5">{s.artifacts.map(a => <button key={a.id} className="flex w-full items-center gap-2 rounded-md border p-2.5 text-left hover:bg-muted" onClick={() => openArtifact(a, s)}><FileText className="size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{a.name}</span><span className="text-[10px] text-muted-foreground">{a.kind} · {a.updated}</span></span><ChevronRight className="size-3" /></button>)}{s.artifacts.length === 0 && <p className="text-xs text-muted-foreground">No artifacts yet.</p>}</div></div>
        {showDecisions ? decisionList(s) : <details className="border-t pt-2"><summary className="cursor-pointer text-xs text-muted-foreground">Decisions · {s.decisions.length}</summary><div className="mt-3">{decisionList(s)}</div></details>}
      </div>}
    </section>
  }

  function treeNav(parent: string | null, depth = 0): ReactNode {
    return kids(parent).map(s => <div key={s.id}>
      <div data-section-before={s.id} data-section-drop={parent ?? "__project__"} className="h-1 rounded transition-colors hover:bg-foreground/30" aria-label={`Move before ${s.name}`} onDragOver={e => { if (dragged && canMove(dragged, parent)) e.preventDefault() }} onDrop={e => drop(e, parent, s.id)} />
      <div data-section-drop={s.id} className={cn('flex items-center gap-1 rounded-md py-1', selected === s.id && 'bg-muted', dropTarget === s.id && 'ring-2 ring-foreground/40')} style={{ paddingLeft: depth * 14 }} onDragOver={e => { if (dragged && canMove(dragged, s.id)) { e.preventDefault(); e.stopPropagation(); setDropTarget(s.id) } }} onDragLeave={() => setDropTarget(null)} onDrop={e => drop(e, s.id)}>
        <button disabled={!kids(s.id).length} aria-label={`${expanded.includes(s.id) ? 'Collapse' : 'Expand'} ${s.name}`} className="p-1 disabled:opacity-20" onClick={() => toggleExpanded(s.id)}>{expanded.includes(s.id) ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}</button>
        <button {...dragEvents(s.id)} className="flex-1 touch-none select-none py-1 text-left text-xs" onClick={() => { if (!didDrag.current) navigateSection(s.id) }}>{s.name}</button>
        <button aria-label={`Move ${s.name}`} className="p-1 text-muted-foreground hover:text-foreground" onClick={() => setMoving(s.id)}><GripVertical className="size-3" /></button>
      </div>
      {expanded.includes(s.id) && treeNav(s.id, depth + 1)}
    </div>)
  }

  return <>
    <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden [contain:inline-size]">
      <h1 className="sr-only">{project.name} Decisions</h1>
      {outlineOpen && <aside id="section-outline" aria-label="Section outline" className="flex h-full w-68 max-w-[45%] shrink-0 flex-col overflow-hidden border-r bg-background">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-4"><div><p className="text-[10px] text-muted-foreground">{project.name}</p><h2 className="mt-0.5 text-sm font-semibold">Decisions</h2></div><Button variant="ghost" size="icon" className="size-7" aria-label="Close outline" onClick={() => setOutlineOpen(false)}><PanelLeft /></Button></div>
        <div className="min-h-0 flex-1 overflow-auto p-3"><p className="mb-2 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Outline</p><button data-section-drop="__project__" className="mb-2 w-full rounded-md px-2 py-2 text-left text-xs font-medium hover:bg-muted" onDragOver={event => { if (dragged) event.preventDefault() }} onDrop={event => drop(event, null)} onClick={() => navigateSection('__project__')}>{project.name}</button>{treeNav(null)}</div>
        <p className="border-t px-4 py-3 text-[10px] text-muted-foreground">Select a section to go to it on the canvas.</p>
      </aside>}
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
      <SectionMap project={project} sections={sections} expanded={expanded} toggleExpanded={toggleExpanded} renderSection={frame} selected={selected} onSelect={setSelected} showDecisions={showDecisions} focusDecision={focusDecision} onTrace={setFocusDecision} focused={null} minimized={sections.filter(s => isMinimized(s.id)).map(s => s.id)} dragged={dragged} hovered={dropTarget} canMove={canMove} onDropSection={drop} onExitFocus={() => setFocused(null)} navigation={navigation} insets={{ left: 24, right: 24, top: 100, bottom: 56 }} />
      <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex flex-wrap items-start justify-between gap-3">
        {!outlineOpen && <div className="pointer-events-auto flex items-center gap-1 rounded-xl border bg-background/95 p-1.5 shadow-sm backdrop-blur">
          <div className="px-2"><p className="text-[10px] text-muted-foreground">{project.name}</p><p className="text-sm font-semibold">Decisions</p></div>
          <div className="mx-1 h-6 w-px bg-border" />
          <Button variant="ghost" size="sm" aria-expanded={outlineOpen} aria-controls="section-outline" onClick={() => setOutlineOpen(open => !open)}><PanelLeft />Outline</Button>
        </div>}
        <div className="pointer-events-auto ml-auto flex items-center gap-3 rounded-xl border bg-background/95 p-2 shadow-sm backdrop-blur">
          <label className="flex items-center gap-2 px-2 text-xs"><Switch checked={showDecisions} onCheckedChange={value => { setShowDecisions(value); if (!value) setFocusDecision(null) }} />Show decisions</label>
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}><Plus />Section</Button>
        </div>
      </div>
      {activeDecision && showDecisions && <div className="pointer-events-none absolute right-4 top-24 z-20 flex max-w-sm flex-col items-end gap-2">
        {activeDecision && showDecisions && <div className="pointer-events-auto flex items-start gap-3 rounded-lg border bg-background/95 p-3 text-xs shadow-sm"><ArrowRight className="mt-0.5 size-4 shrink-0" /><div className="min-w-0 flex-1"><p className="font-medium">{activeDecision.title}</p><p className="mt-1 text-muted-foreground">{sourceSection?.name} → {activeDecision.drives.map(id => sections.find(s => s.id === id)?.name).join(' · ')}</p></div><button aria-label="Clear relationship focus" onClick={() => setFocusDecision(null)}><X className="size-4" /></button></div>}
      </div>}
      {message && <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-background/95 px-4 py-2 text-xs shadow-sm"><span role="status">{message}</span>{lastMove && <button className="font-medium underline" onClick={() => { setSections(old => moveWorkSection(old, lastMove.id, lastMove.parent, lastMove.before)); setLastMove(null); setMessage('Move undone.') }}>Undo move</button>}</div>}
      </div>
      <SectionWindow section={sections.find(section => section.id === focused)} sections={sections} onClose={() => setFocused(null)} onSection={focus} onDecision={openDecision} onMove={setMoving} />
    </div>
    {dragPosition && dragged && <div className="pointer-events-none fixed z-[100] rounded-lg border bg-background px-4 py-2 text-xs font-medium shadow-lg" style={{ left: dragPosition.x + 14, top: dragPosition.y + 14 }}>Move {sections.find(s => s.id === dragged)?.name}</div>}
    <Dialog open={!!visiblePreview} onOpenChange={open => !open && closePreview()}><DialogContent className="max-h-[85vh] overflow-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{visiblePreview?.title}</DialogTitle><DialogDescription>{visiblePreview?.description}</DialogDescription></DialogHeader>{visiblePreview?.body}</DialogContent></Dialog>
    <Dialog open={adding} onOpenChange={setAdding}><DialogContent><DialogHeader><DialogTitle>Add a section</DialogTitle><DialogDescription>Create a section at any depth.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={e => {
      e.preventDefault()
      const data = new FormData(e.currentTarget), id = `section-${Date.now()}`, parent = String(data.get('parent')) || null
      if (!newName.trim()) return
      setSections(old => [...old, { id, parent, name: newName.trim(), owner: 'Keller', summary: 'A new area of work. Add artifacts and capture the reasons behind your choices here.', artifacts: [], decisions: [] }])
      if (parent) setExpanded(old => [...new Set([...old, ...sectionPath(sections, parent).map(s => s.id)])])
      setSelected(id); setFocused(id); setNewName(''); setAdding(false)
    }}><label className="block space-y-2 text-xs"><span>Name</span><Input required autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Sound design" /></label><label className="block space-y-2 text-xs"><span>Inside</span><select name="parent" defaultValue={current.id} className="w-full rounded-md border bg-background p-2"><option value="">{project.name} · top level</option>{sections.map(s => <option key={s.id} value={s.id}>{pathLabel(s.id)}</option>)}</select></label><Button type="submit">Create section</Button></form></DialogContent></Dialog>
    <Dialog open={!!moving} onOpenChange={open => !open && setMoving(null)}><DialogContent><DialogHeader><DialogTitle>Move {sections.find(s => s.id === moving)?.name}</DialogTitle><DialogDescription>Move this section and all its subsections. You can also drag its grip onto another section.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={e => { e.preventDefault(); const parent = String(new FormData(e.currentTarget).get('parent')) || null; if (moving) move(moving, parent); setMoving(null) }}><label className="block space-y-2 text-xs"><span>New parent</span><select name="parent" defaultValue={sections.find(s => s.id === moving)?.parent ?? ''} className="w-full rounded-md border bg-background p-2"><option value="">{project.name} · top level</option>{sections.filter(s => moving && canMove(moving, s.id)).map(s => <option key={s.id} value={s.id}>{pathLabel(s.id)}</option>)}</select></label><Button type="submit">Move section</Button></form></DialogContent></Dialog>
  </>
}
