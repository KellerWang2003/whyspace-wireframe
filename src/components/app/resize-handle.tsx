import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react"
import { cn } from "@/lib/utils"

/**
 * A thin drag strip on one edge of a panel. `edge` is the panel edge it sits on:
 * "right" for panels on the left of the screen, "left" for panels on the right.
 * Double-click resets to `reset` when given.
 */
export function ResizeHandle({
  edge,
  getWidth,
  onWidth,
  min = 200,
  max = 720,
  reset,
  className,
  style,
}: {
  edge: "left" | "right"
  getWidth: () => number
  onWidth: (w: number) => void
  min?: number
  max?: number
  reset?: number
  className?: string
  style?: CSSProperties
}) {
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startW = getWidth()
    const cap = Math.min(max, window.innerWidth - 240)
    const root = document.documentElement
    root.dataset.resizing = ""
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const w = edge === "right" ? startW + dx : startW - dx
      onWidth(Math.max(min, Math.min(cap, w)))
    }
    const up = () => {
      delete root.dataset.resizing
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Drag to resize"
      onPointerDown={onPointerDown}
      onDoubleClick={reset ? () => onWidth(reset) : undefined}
      style={style}
      className={cn(
        "group/resize absolute inset-y-0 z-30 w-2 cursor-col-resize touch-none select-none",
        edge === "right" ? "-right-1" : "-left-1",
        className
      )}
    >
      <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover/resize:bg-foreground/25 group-active/resize:bg-foreground/40" />
    </div>
  )
}

/**
 * A drag zone that resizes in one or both directions, for floating panels.
 * x/y say which way grows the panel: -1 = dragging left/up grows it (left or top edge), 1 = right/down.
 */
export function ResizeGrip({
  x = 0,
  y = 0,
  getSize,
  onSize,
  minW = 280,
  maxW = 900,
  minH = 280,
  maxH = 1200,
  onReset,
  className,
}: {
  x?: -1 | 0 | 1
  y?: -1 | 0 | 1
  getSize: () => { w: number; h: number }
  onSize: (s: { w: number; h: number }) => void
  minW?: number
  maxW?: number
  minH?: number
  maxH?: number
  onReset?: () => void
  className?: string
}) {
  const cursor = x && y ? (x === y ? "nwse-resize" : "nesw-resize") : y ? "row-resize" : "col-resize"
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const sx = e.clientX
    const sy = e.clientY
    const start = getSize()
    const capW = Math.min(maxW, window.innerWidth - 40)
    const capH = Math.min(maxH, window.innerHeight - 40)
    const root = document.documentElement
    root.dataset.resizing = ""
    root.style.setProperty("--resize-cursor", cursor)
    const move = (ev: PointerEvent) => {
      const w = x ? start.w + x * (ev.clientX - sx) : start.w
      const h = y ? start.h + y * (ev.clientY - sy) : start.h
      onSize({ w: Math.max(minW, Math.min(capW, w)), h: Math.max(minH, Math.min(capH, h)) })
    }
    const up = () => {
      delete root.dataset.resizing
      root.style.removeProperty("--resize-cursor")
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
  }
  return (
    <div
      aria-hidden
      onPointerDown={onPointerDown}
      onDoubleClick={onReset}
      style={{ cursor }}
      className={cn("absolute z-30 touch-none select-none", className)}
    />
  )
}
