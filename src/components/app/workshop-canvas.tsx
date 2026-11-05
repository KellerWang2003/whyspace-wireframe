import { createContext, useContext, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"
import { Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ThreadDot } from "@/design-b/thread-ui"
import { threadOf, useThreads } from "@/design-b/threads"

// The workshop canvas works like a design file: zoom and pan freely, move anything,
// and group work into sections. A section is tagged with a thread (Figma-style); anything
// outside a section, or in a General section, is general work.

export const MIN_ZOOM = 0.2
export const MAX_ZOOM = 3
export const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

export type Offset = { dx: number; dy: number }
// `when` keeps a demo section hidden until the work it holds shows up.
export type Section = { id: string; part: string; name: string; x: number; y: number; w: number; h: number; when?: "clips" | "protos" | "hearing" }
export type SectionDrag = "move" | "r" | "b" | "br"

export const GENERAL = "General"
const GENERAL_COLOR = "#8f8f8f"

type Ctx = {
  tool: string
  zoom: number
  selected: string | null
  offsets: Record<string, Offset>
  startDrag: (id: string, e: ReactPointerEvent) => void
}
export const CanvasCtx = createContext<Ctx | null>(null)
const useCanvas = () => useContext(CanvasCtx)!

export const offsetOf = (offsets: Record<string, Offset>, id: string): Offset => offsets[id] ?? { dx: 0, dy: 0 }

// Anything placed on the canvas. Drag to move it; it keeps its own content and behavior.
export function Movable({ id, x, y, className, style, children }: { id: string; x: number; y: number; className?: string; style?: CSSProperties; children: ReactNode }) {
  const { offsets, selected, startDrag, tool } = useCanvas()
  const o = offsetOf(offsets, id)
  return (
    <div
      data-item={id}
      onPointerDown={(e) => startDrag(id, e)}
      className={cn("absolute", tool !== "hand" && "cursor-move", selected === id && "rounded-lg outline-2 outline-offset-4 outline-primary/60", className)}
      style={{ left: x + o.dx, top: y + o.dy, ...style }}
    >
      {children}
    </div>
  )
}

function useThreadLook(projectId: string, part: string) {
  useThreads(projectId)
  if (part === GENERAL) return { name: GENERAL, color: GENERAL_COLOR }
  const t = threadOf(projectId, part)
  return { name: t.name, color: t.color }
}

// A section: a tinted area with a thread label. Drag the body or label to move it with
// everything inside; drag an edge or corner to resize; click the thread to retag it.
export function SectionFrame({ projectId, section, selected, menuOpen, onMenuOpen, onDrag, onChange, onDelete }: {
  projectId: string
  section: Section
  selected: boolean
  menuOpen: boolean
  onMenuOpen: (open: boolean) => void
  onDrag: (mode: SectionDrag, e: ReactPointerEvent) => void
  onChange: (patch: Partial<Section>) => void
  onDelete: () => void
}) {
  const { zoom, tool } = useCanvas()
  const threads = useThreads(projectId)
  const look = useThreadLook(projectId, section.part)
  const [renaming, setRenaming] = useState(false)
  // Labels keep a readable size when zoomed out, like Figma.
  const labelScale = Math.min(4, Math.max(1, 1 / zoom))
  const grab = (mode: SectionDrag) => (e: ReactPointerEvent) => {
    if (tool === "hand") return
    e.stopPropagation()
    onDrag(mode, e)
  }
  return (
    <div
      data-section={section.id}
      onPointerDown={grab("move")}
      className={cn("absolute rounded-xl border animate-in fade-in duration-500", tool !== "hand" && "cursor-default", selected && "outline-2 outline-offset-2 outline-primary/60")}
      style={{ left: section.x, top: section.y, width: section.w, height: section.h, backgroundColor: `${look.color}12`, borderColor: `${look.color}66` }}
    >
      <div className="absolute bottom-full left-0 flex origin-bottom-left items-center gap-1.5 pb-1.5" style={{ transform: `scale(${labelScale})` }}>
        <DropdownMenu modal={false} open={menuOpen} onOpenChange={onMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              className="flex h-6 items-center gap-1.5 rounded-md border bg-background px-2 text-xs font-medium whitespace-nowrap shadow-xs hover:bg-muted"
            >
              <ThreadDot color={look.color} />
              {look.name}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-44" onPointerDown={(e) => e.stopPropagation()}>
            {threads.map((t) => (
              <DropdownMenuItem key={t.id} onSelect={() => onChange({ part: t.part })} className="text-xs">
                <ThreadDot color={t.color} />{t.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onSelect={() => onChange({ part: GENERAL })} className="text-xs">
              <ThreadDot color={GENERAL_COLOR} />{GENERAL}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete} className="text-xs"><Trash2 />Delete section</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {renaming ? (
          <input
            autoFocus
            defaultValue={section.name}
            onPointerDown={(e) => e.stopPropagation()}
            onBlur={(e) => { onChange({ name: e.target.value.trim() }); setRenaming(false) }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") (e.target as HTMLInputElement).blur() }}
            className="h-6 w-44 rounded-md border bg-background px-1.5 text-xs outline-none"
          />
        ) : (
          <span
            onPointerDown={grab("move")}
            onDoubleClick={() => setRenaming(true)}
            className="cursor-move px-0.5 text-xs whitespace-nowrap text-muted-foreground select-none"
          >
            {section.name || "Untitled"}
          </span>
        )}
      </div>
      {/* Resize from the right edge, bottom edge or corner */}
      <div onPointerDown={grab("r")} className="absolute top-3 -right-1.5 bottom-3 w-3 cursor-ew-resize" />
      <div onPointerDown={grab("b")} className="absolute right-3 -bottom-1.5 left-3 h-3 cursor-ns-resize" />
      <div onPointerDown={grab("br")} className="absolute -right-1.5 -bottom-1.5 size-4 cursor-nwse-resize" />
    </div>
  )
}
