import { useEffect, useSyncExternalStore, type ReactNode, type RefObject } from "react"
import { createPortal } from "react-dom"

// One floating peek for the whole rail: a tab's name, or a project's card. Hover waits half a second the
// first time; once a peek is open, sliding to another icon moves it there at once, with no new wait.

export type PeekKind = "tip" | "card"
type Peek = { key: string; el: HTMLElement; kind: PeekKind; content: ReactNode }
type State = { peek: Peek | null; moved: boolean; seq: number }

const OPEN_DELAY = 500
const CLOSE_DELAY = 150
// Just closed counts as still open, so a quick slide over a gap doesn't restart the wait.
const WARM = 300

let state: State = { peek: null, moved: false, seq: 0 }
let openTimer: ReturnType<typeof setTimeout> | undefined
let closeTimer: ReturnType<typeof setTimeout> | undefined
let closedAt = 0
const listeners = new Set<() => void>()

function set(next: State) {
  state = next
  for (const listener of listeners) listener()
}

export function enterPeek(next: Peek) {
  clearTimeout(closeTimer)
  clearTimeout(openTimer)
  if (state.peek || Date.now() - closedAt < WARM) {
    set({ peek: next, moved: !!state.peek, seq: state.peek ? state.seq : state.seq + 1 })
    return
  }
  openTimer = setTimeout(() => set({ peek: next, moved: false, seq: state.seq + 1 }), OPEN_DELAY)
}

export function leavePeek() {
  clearTimeout(openTimer)
  clearTimeout(closeTimer)
  closeTimer = setTimeout(closePeek, CLOSE_DELAY)
}

function holdPeek() {
  clearTimeout(closeTimer)
}

export function closePeek() {
  clearTimeout(openTimer)
  clearTimeout(closeTimer)
  if (!state.peek) return
  closedAt = Date.now()
  set({ peek: null, moved: false, seq: state.seq })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Drawn once per rail, for peeks that belong to that rail (the design system page shows two rails).
export function RailPeekLayer({ rail }: { rail: RefObject<HTMLElement | null> }) {
  const { peek, moved, seq } = useSyncExternalStore(subscribe, () => state)
  useEffect(() => {
    const close = () => closePeek()
    window.addEventListener("scroll", close, true)
    window.addEventListener("hashchange", close)
    return () => {
      window.removeEventListener("scroll", close, true)
      window.removeEventListener("hashchange", close)
    }
  }, [])
  if (!peek || !rail.current?.contains(peek.el)) return null
  const r = peek.el.getBoundingClientRect()
  const x = r.right + 10
  const y = peek.kind === "card" ? r.top : r.top + r.height / 2
  return createPortal(
    <div
      onPointerEnter={holdPeek}
      onPointerLeave={leavePeek}
      className="fixed top-0 left-0 z-50"
      style={{ transform: `translate(${x}px, ${y}px)`, transition: moved ? "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)" : "none" }}
    >
      <div key={seq} className="animate-in duration-150 fade-in-0">
        {peek.kind === "card" ? (
          <div data-rail-card className="w-64 rounded-lg border bg-popover p-3 text-popover-foreground shadow-sm">{peek.content}</div>
        ) : (
          <div role="tooltip" className="-translate-y-1/2 rounded-md bg-foreground px-3 py-1.5 text-xs whitespace-nowrap text-background">{peek.content}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}
