import { useEffect, useLayoutEffect, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { ChevronRight, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Project } from '@/data'
import { type WorkSection } from './section-model'

type Point = { x: number; y: number; width: number; height: number }
type View = { x: number; y: number; scale: number }
const CARD_WIDTH = 300
const COLUMN_GAP = 112
const ROW_GAP = 36
const PROJECT = '__project__'

// Parent sections sit at the midpoint of their expanded branches. Heights come
// from the rendered contents, so opening decisions never overlaps other sections.
function arrange(sections: WorkSection[], expanded: string[], heights: Record<string, number>, projectOpen: boolean, focused: string | null, minimized: string[]) {
  const points: Record<string, Point> = {}
  const depths: Record<string, number> = {}
  const depthOf = (id: string): number => {
    if (depths[id] !== undefined) return depths[id]
    const parent = sections.find(s => s.id === id)?.parent
    return depths[id] = parent ? depthOf(parent) + 1 : 1
  }
  const wideDepth = focused ? depthOf(focused) : -1
  const nodeWidth = (id: string) => id === focused ? 840 : CARD_WIDTH
  const xAt = (depth: number) => Array.from({ length: depth }, (_, i) => (i === wideDepth ? 840 : CARD_WIDTH) + COLUMN_GAP).reduce((a, b) => a + b, 0)
  const estimatedHeight = (id: string) => id === focused ? 760 : minimized.includes(id) || (id === PROJECT && focused) ? 52 : id === PROJECT ? 175 : 300
  const children = (id: string) => id === PROJECT
    ? projectOpen ? sections.filter(s => !s.parent) : []
    : expanded.includes(id) ? sections.filter(s => s.parent === id) : []
  function measure(id: string): number {
    const own = heights[id] ?? estimatedHeight(id)
    const kids = children(id)
    return Math.max(own, kids.reduce((sum, child) => sum + measure(child.id), 0) + Math.max(0, kids.length - 1) * ROW_GAP)
  }
  function place(id: string, depth: number, top: number) {
    const height = heights[id] ?? estimatedHeight(id)
    const span = measure(id)
    points[id] = { x: xAt(depth), y: top + (span - height) / 2, width: nodeWidth(id), height }
    const kids = children(id)
    const childSpan = kids.reduce((sum, child) => sum + measure(child.id), 0) + Math.max(0, kids.length - 1) * ROW_GAP
    let cursor = top + (span - childSpan) / 2
    for (const child of kids) {
      place(child.id, depth + 1, cursor)
      cursor += measure(child.id) + ROW_GAP
    }
  }
  place(PROJECT, 0, 0)
  return points
}

export function SectionMap({ project, sections, expanded, toggleExpanded, renderSection, selected, onSelect, showDecisions, focusDecision, onTrace, focused, minimized, dragged, canMove, onDropSection, hovered, onExitFocus, navigation, insets }: {
  project: Project
  navigation: { id: string; serial: number } | null
  insets: { left: number; right: number; top: number; bottom: number }
  sections: WorkSection[]
  expanded: string[]
  toggleExpanded: (id: string) => void
  renderSection: (section: WorkSection) => ReactNode
  selected: string
  onSelect: (id: string) => void
  showDecisions: boolean
  focusDecision: string | null
  onTrace: (id: string) => void
  focused: string | null
  minimized: string[]
  onExitFocus: () => void
  hovered: string | null
  dragged: string | null
  canMove: (id: string, parent: string | null) => boolean
  onDropSection: (event: DragEvent, parent: string | null) => void
}) {
  const viewport = useRef<HTMLDivElement>(null)
  const layer = useRef<HTMLDivElement>(null)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })
  const previousViewport = useRef('')
  const [heights, setHeights] = useState<Record<string, number>>({})
  const [view, setView] = useState<View>({ x: 40, y: 40, scale: .7 })
  const [projectVisibility, setProjectVisibility] = useState({ open: true, navigationSerial: -1 })
  const projectOpen = projectVisibility.open || !!(navigation && navigation.id !== PROJECT && navigation.serial > projectVisibility.navigationSerial)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const pan = useRef<{ x: number; y: number; view: View } | null>(null)
  const initialFit = useRef(false)
  const handledNavigation = useRef(-1)
  const navigationSection = useRef<string | null>(null)
  const presentationKey = `${focused}:${minimized.join(',')}:${sections.map(s => `${s.id}/${s.parent}`).join(',')}`
  const previousPresentation = useRef(presentationKey)
  const fitPresentation = useRef(false)
  const expandedBranch = useRef<string | null>(null)
  const anchor = useRef<{ id: string; x: number; y: number } | null>(null)
  const points = arrange(sections, expanded, heights, projectOpen, focused, minimized)
  const width = Math.max(...Object.values(points).map(p => p.x + p.width))
  const height = Math.max(...Object.values(points).map(p => p.y + p.height))

  function bounds() {
    const box = viewport.current
    if (!box) return null
    return { x: insets.left, y: insets.top, width: Math.max(120, box.clientWidth - insets.left - insets.right), height: Math.max(100, box.clientHeight - insets.top - insets.bottom) }
  }
  function fit() {
    const box = bounds()
    if (!box) return
    const scale = Math.max(.15, Math.min(1, (box.width - 48) / (width + 28), (box.height - 48) / height))
    setView({ x: box.x + (box.width - width * scale) / 2, y: box.y + (box.height - height * scale) / 2, scale })
  }
  function center(point: Point) {
    const box = bounds()
    if (!box) return
    const scale = Math.min(1, (box.width - 48) / point.width, (box.height - 48) / point.height)
    setView({ scale, x: box.x + (box.width - point.width * scale) / 2 - point.x * scale, y: box.y + (box.height - point.height * scale) / 2 - point.y * scale })
  }

  // The outline is a docked sibling. Reframe when its opening or closing changes
  // the actual canvas size, including when the main app navigation is toggled.
  useLayoutEffect(() => {
    const box = viewport.current
    if (!box) return
    const observer = new ResizeObserver(() => {
      const width = box.clientWidth, height = box.clientHeight
      setViewportSize(old => old.width === width && old.height === height ? old : { width, height })
    })
    observer.observe(box)
    return () => observer.disconnect()
  }, [])

  // Observe the actual cards, including disclosure changes and viewport resizing.
  useLayoutEffect(() => {
    if (!layer.current) return
    const observer = new ResizeObserver(entries => {
      setHeights(old => {
        const next = { ...old }
        let changed = false
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.mapSection!
          const size = (entry.target as HTMLElement).offsetHeight
          if (Math.abs((next[id] ?? 0) - size) > 1) { next[id] = size; changed = true }
        }
        return changed ? next : old
      })
    })
    layer.current.querySelectorAll<HTMLElement>('[data-map-section]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [sections, expanded, showDecisions, projectOpen, focused, minimized])

  useLayoutEffect(() => {
    const viewportKey = `${viewportSize.width}:${viewportSize.height}`
    if (previousViewport.current !== viewportKey) {
      previousViewport.current = viewportKey
      fitPresentation.current = true
      expandedBranch.current = null
      anchor.current = null
    }
    if (previousPresentation.current !== presentationKey) {
      previousPresentation.current = presentationKey
      navigationSection.current = null
      fitPresentation.current = !focused
      expandedBranch.current = null
      anchor.current = null
    }
    if (navigation && handledNavigation.current !== navigation.serial) {
      handledNavigation.current = navigation.serial
      navigationSection.current = navigation.id
      expandedBranch.current = null
      anchor.current = null
      fitPresentation.current = false
    }
    if (!initialFit.current && Object.keys(heights).length) {
      initialFit.current = true
      fit()
    }
    if (navigationSection.current && points[navigationSection.current]) {
      center(points[navigationSection.current])
    } else if (focused && points[focused]) {
      center(points[focused])
    } else if (expandedBranch.current && viewport.current) {
      const branchId = expandedBranch.current
      const inBranch = (id: string): boolean => {
        if (id === branchId) return true
        const parent = sections.find(s => s.id === id)?.parent
        return parent ? inBranch(parent) : false
      }
      const branch = Object.entries(points).filter(([id]) => inBranch(id)).map(([, p]) => p)
      if (branch.length) {
        const left = Math.min(...branch.map(p => p.x))
        const top = Math.min(...branch.map(p => p.y))
        const right = Math.max(...branch.map(p => p.x + p.width + 30))
        const bottom = Math.max(...branch.map(p => p.y + p.height))
        const box = bounds()!
        setView(() => {
          const scale = Math.min(1, (box.width - 48) / (right - left), (box.height - 48) / (bottom - top))
          return { scale, x: box.x + (box.width - (right - left) * scale) / 2 - left * scale, y: box.y + (box.height - (bottom - top) * scale) / 2 - top * scale }
        })
      }
    } else if (fitPresentation.current) {
      fit()
    } else if (anchor.current) {
      const at = anchor.current
      const point = points[at.id]
      if (point) setView(v => ({ ...v, x: at.x - point.x * v.scale, y: at.y - (point.y + point.height / 2) * v.scale }))
    }
    // The layout is derived each render; only geometry changes should reposition it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heights, expanded, projectOpen, focused, minimized, sections, navigation, viewportSize.width, viewportSize.height, insets.left, insets.right, insets.top, insets.bottom])

  useEffect(() => {
    const box = viewport.current
    if (!box) return
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      anchor.current = null
      navigationSection.current = null
      expandedBranch.current = null
      fitPresentation.current = false
      if (e.ctrlKey || e.metaKey) {
        const bounds = box.getBoundingClientRect()
        const px = e.clientX - bounds.left, py = e.clientY - bounds.top
        setView(v => {
          const scale = Math.min(1.6, Math.max(.15, v.scale * Math.exp(-e.deltaY * .008)))
          return { scale, x: px - (px - v.x) / v.scale * scale, y: py - (py - v.y) / v.scale * scale }
        })
      } else setView(v => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
    }
    box.addEventListener('wheel', wheel, { passive: false })
    return () => box.removeEventListener('wheel', wheel)
  }, [])

  function toggle(id: string) {
    const point = points[id]
    navigationSection.current = null
    fitPresentation.current = false
    expandedBranch.current = id !== PROJECT && !expanded.includes(id) ? id : null
    anchor.current = { id, x: view.x + point.x * view.scale, y: view.y + (point.y + point.height / 2) * view.scale }
    if (id === PROJECT) { if (projectOpen && focused) onExitFocus(); setProjectVisibility({ open: !projectOpen, navigationSerial: navigation?.serial ?? -1 }) }
    else toggleExpanded(id)
  }

  const visibleAncestor = (id: string): string | undefined => {
    if (points[id]) return id
    const section = sections.find(s => s.id === id)
    return section?.parent ? visibleAncestor(section.parent) : undefined
  }
  const influences = showDecisions ? sections.flatMap(source => source.decisions
    .filter(d => !focusDecision || d.id === focusDecision)
    .flatMap(d => d.drives.map(target => ({ source: visibleAncestor(source.id), target: visibleAncestor(target), decision: d })))) : []
  const hierarchy = Object.keys(points).filter(id => id !== PROJECT).map(id => ({ id, parent: sections.find(s => s.id === id)?.parent ?? PROJECT }))
  const curve = (a: Point, b: Point) => {
    const x1 = a.x + a.width, y1 = a.y + a.height / 2, x2 = b.x, y2 = b.y + b.height / 2
    const bend = Math.max(48, Math.abs(x2 - x1) * .5)
    return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`
  }

  return <div
    data-section-drop="__project__"
    ref={viewport}
    tabIndex={0}
    role="region"
    aria-label="Project section map. Drag background or scroll to pan, pinch to zoom, double-click background to fit."
    className={cn('relative h-full overflow-hidden bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-size-[22px_22px] outline-none focus-visible:ring-2 focus-visible:ring-ring', dragging ? 'cursor-grabbing' : 'cursor-grab')}
    onDoubleClick={e => { if (!(e.target as HTMLElement).closest('section,button')) { anchor.current = null; navigationSection.current = null; expandedBranch.current = null; fit() } }}
    onPointerDown={e => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('section,button,a,input,summary,[draggable],[data-influence]')) return
      anchor.current = null
      navigationSection.current = null
      expandedBranch.current = null
      fitPresentation.current = false
      pan.current = { x: e.clientX, y: e.clientY, view }
      setDragging(true)
      e.currentTarget.setPointerCapture(e.pointerId)
    }}
    onPointerMove={e => { const start = pan.current; if (start) setView({ ...start.view, x: start.view.x + e.clientX - start.x, y: start.view.y + e.clientY - start.y }) }}
    onPointerUp={() => { pan.current = null; setDragging(false) }}
    onPointerCancel={() => { pan.current = null; setDragging(false) }}
    onKeyDown={e => {
      if (e.target !== e.currentTarget) return
      const delta: Record<string, [number, number]> = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] }
      if (delta[e.key]) { e.preventDefault(); anchor.current = null; navigationSection.current = null; expandedBranch.current = null; setView(v => ({ ...v, x: v.x + delta[e.key][0], y: v.y + delta[e.key][1] })) }
      if (e.key === '0') { anchor.current = null; navigationSection.current = null; expandedBranch.current = null; fit() }
    }}
    onDragOver={e => { if (dragged) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' } }}
    onDrop={e => { setDropTarget(null); onDropSection(e, null) }}
  >
    <div ref={layer} className="absolute origin-top-left" style={{ width, height, transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
      <svg className="pointer-events-none absolute overflow-visible" width={width} height={height} aria-label="Section hierarchy connections">
        <defs><marker id="section-influence-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
        {hierarchy.map(({ id, parent }) => points[parent] && <path key={id} d={curve(points[parent], points[id])} fill="none" className="stroke-foreground/25" strokeWidth="1.5" />)}
        {influences.map(({ source, target, decision }, i) => source && target && source !== target && <path
          key={`${decision.id}-${target}-${i}`}
          data-influence
          d={curve(points[source], points[target])}
          fill="none"
          strokeWidth={focusDecision ? 2 : 1.5}
          strokeDasharray="6 5"
          markerEnd="url(#section-influence-arrow)"
          className={cn('pointer-events-auto cursor-pointer stroke-foreground', !focusDecision && 'opacity-40 hover:opacity-100')}
          role="button"
          tabIndex={0}
          aria-label={`Trace ${decision.title}`}
          onClick={() => onTrace(decision.id)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTrace(decision.id) } }}
        ><title>{decision.title}</title></path>)}
      </svg>
      {Object.entries(points).map(([id, point]) => <div key={id} data-map-section={id} data-section-drop={id} className={cn('absolute cursor-auto rounded-xl', (dropTarget === id || hovered === id) && 'ring-4 ring-foreground/40')}
        style={{ left: point.x, top: point.y, width: point.width }}
        onDragOver={e => {
          const target = id === PROJECT ? null : id
          if (dragged && canMove(dragged, target)) { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; setDropTarget(id) }
        }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null) }}
        onDrop={e => { setDropTarget(null); if (dragged && !canMove(dragged, id === PROJECT ? null : id)) { e.preventDefault(); e.stopPropagation(); return }; onDropSection(e, id === PROJECT ? null : id) }}>
        {id === PROJECT ? <section className="rounded-xl border bg-background p-5 shadow-xs">{!focused && <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Project</p>}<h2 className="text-xl font-semibold">{project.name}</h2>{!focused && <><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{project.brief}</p><p className="mt-4 text-[11px] text-muted-foreground">{sections.filter(s => !s.parent).length} sections · {sections.length} areas of work</p></>}</section> : <div className={cn('rounded-xl transition-shadow', selected === id && 'ring-2 ring-foreground/15')} onPointerDown={() => onSelect(id)}>{renderSection(sections.find(s => s.id === id)!)}</div>}
        {(id === PROJECT || sections.some(s => s.parent === id)) && <button
          aria-label={`${(id === PROJECT ? projectOpen : expanded.includes(id)) ? 'Collapse' : 'Expand'} ${id === PROJECT ? 'project' : sections.find(s => s.id === id)?.name}`}
          aria-expanded={id === PROJECT ? projectOpen : expanded.includes(id)}
          onClick={() => toggle(id)}
          className="absolute top-1/2 -right-[26px] z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border bg-background shadow-xs transition hover:bg-muted"
        >{(id === PROJECT ? projectOpen : expanded.includes(id)) ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}<span className="absolute left-9 whitespace-nowrap text-[10px] text-muted-foreground">{id === PROJECT ? '' : sections.filter(s => s.parent === id).length}</span></button>}
      </div>)}
    </div>
    <div style={{ left: insets.left }} className="pointer-events-none absolute bottom-3 flex flex-wrap gap-3 rounded-md border bg-background/95 px-3 py-2 text-[10px] text-muted-foreground"><span>Drag background to pan · pinch to zoom · drag grips to nest · double-click to fit</span><span className="flex items-center gap-1"><span className="h-px w-4 bg-foreground/40" />Subsection</span>{showDecisions && <span className="flex items-center gap-1"><span className="w-4 border-t border-dashed border-foreground" /><ChevronRight className="size-3" />Decision influence</span>}</div>
  </div>
}
