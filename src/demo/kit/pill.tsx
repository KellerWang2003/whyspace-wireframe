import { useEffect, useRef, useState, type ReactNode } from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MarkIcon } from "@/components/app/status-badge"
import { ProjectMark } from "@/components/app/project-mark"
import { cn } from "@/lib/utils"
import { guesses, markOf, settled, type Caught, type View } from "./model"

// The pill for scenarios 2 to 4: the same shape as scenario 1's, without the clash. Collapsed it
// shows the guesses waiting, or how many lines the work follows or confirms. Expanded it shows what
// needs you here, what was caught, or the check when the work was shared.

export type PillProps = {
  project: string
  part: string
  caught: Caught[]
  open: boolean
  view: View
  checkIds: string[]
  checkClosed: boolean
  onOpen: (open: boolean, view?: View) => void
  onConfirm: (id: string, why: string) => void
  onDone: () => void
  onOpenApp: () => void
}

export function Pill(p: PillProps) {
  const boxRef = useRef<HTMLElement>(null)
  const wait = guesses(p.caught)
  const done = settled(p.caught)
  const close = () => p.onOpen(false)

  useEffect(() => {
    if (!p.open) return
    const onDown = (e: PointerEvent) => { if (!boxRef.current?.contains(e.target as Node)) close() }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "y") { e.preventDefault(); p.onOpen(!p.open) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const view: View = p.view === "check" && !p.checkClosed ? "check" : "needs"

  return (
    <section
      ref={boxRef}
      aria-label="Whyspace desktop overlay"
      onKeyDown={(e) => { if (e.key === "Escape") close() }}
      className={cn(
        "fixed top-1/2 right-3 z-30 flex -translate-y-1/2 flex-col overflow-hidden border border-white/60 bg-background/90 shadow-xl ring-1 ring-black/5 backdrop-blur-xl transition-[border-radius,box-shadow] duration-300",
        p.open ? "max-h-[calc(100svh-1.5rem)] w-[320px] rounded-2xl" : "w-12 rounded-[24px] hover:bg-background hover:shadow-2xl hover:ring-black/15",
      )}
    >
      {!p.open ? (
        <button type="button" aria-expanded={false} aria-label="Open Whyspace · Whiskr" onClick={() => p.onOpen(true)} className="flex flex-col items-center gap-2.5 px-2 py-3 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
          <ProjectMark project={p.project} className="size-7 rounded-md" />
          {wait.length ? (
            <span role="status" className="relative grid size-8 place-items-center">
              <MarkIcon mark="empty" className="absolute inset-0 size-8 [&>span]:size-full [&>span]:border-[1.25px]" />
              <span className="relative text-[11px] leading-none font-semibold tabular-nums">{wait.length}</span>
              <span className="sr-only"> waiting, most urgent: a guess</span>
            </span>
          ) : done.length > 0 ? (
            <span role="status" className="text-xs font-medium text-muted-foreground tabular-nums">{done.length}<span className="sr-only"> confirmed or followed</span></span>
          ) : null}
        </button>
      ) : (
        <div className="flex min-h-0 flex-col animate-in duration-200 fade-in-0">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-2 pl-4">
            <button type="button" onClick={p.onOpenApp} title="Open Whyspace" aria-label="Open Whyspace" className="shrink-0 rounded-sm px-0.5 text-sm font-semibold tracking-tight outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring">Y</button>
            <span className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-xs" aria-label={`Saving to Whiskr, ${p.part}`}>
              <ProjectMark project={p.project} className="size-4" />
              <span className="truncate font-medium">Whiskr</span>
              <span className="text-muted-foreground">/</span><span className="truncate text-muted-foreground">{p.part}</span>
            </span>
            <Button size="icon-sm" variant="ghost" className="size-7" aria-label="Close" onClick={close}><X className="size-3.5" /></Button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {view === "check" ? <CheckList caught={p.caught} ids={p.checkIds} onConfirm={p.onConfirm} onDone={p.onDone} /> : <Needs caught={p.caught} onConfirm={p.onConfirm} />}
          </div>
        </div>
      )}
    </section>
  )
}

// What needs you here, then what was caught, folded.
function Needs({ caught, onConfirm }: { caught: Caught[]; onConfirm: (id: string, why: string) => void }) {
  const [caughtOpen, setCaughtOpen] = useState(false)
  const rows = guesses(caught)
  const done = settled(caught)
  return (
    <div className="p-2">
      <section aria-label="Needs you">
        {rows.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">Nothing needs you here.</p>}
        <ul className="flex flex-col gap-0.5">
          {rows.map((c) => (
            <li key={c.id} className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-foreground/5">
              <MarkIcon mark={markOf(c)} className="mt-[3px] size-3.5 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-xs leading-snug font-medium">{c.title}</p>
                <Chips c={c} onConfirm={onConfirm} />
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section aria-label="Caught this session" className="mt-2">
        <button type="button" aria-expanded={caughtOpen} onClick={() => setCaughtOpen((v) => !v)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex-1 text-left font-medium">Caught</span>
          <span className="text-muted-foreground tabular-nums">{done.length}</span>
          <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform duration-300", caughtOpen && "rotate-180")} />
        </button>
        {caughtOpen && (
          done.length ? (
            <ul className="flex flex-col gap-0.5 pb-1">
              {done.map((c) => (
                <li key={c.id} className="flex items-start gap-2 rounded-md px-2 py-1.5 text-xs">
                  <MarkIcon mark={markOf(c)} className="mt-[3px] size-3.5 shrink-0" />
                  <span className="min-w-0 flex-1 leading-snug">{c.title}{c.why && <span className="text-muted-foreground"> · {c.why}</span>}</span>
                </li>
              ))}
            </ul>
          ) : <p className="px-2 pb-2 text-xs text-muted-foreground">Nothing yet</p>
        )}
      </section>
    </div>
  )
}

// The check: the guesses still in the work, your words as chips. Nothing blocks.
export function CheckList({ caught, ids, onConfirm, onDone }: { caught: Caught[]; ids: string[]; onConfirm: (id: string, why: string) => void; onDone: () => void }) {
  const rows = ids.map((id) => caught.find((c) => c.id === id)).filter((c): c is Caught => !!c)
  const fresh = rows.filter((c) => c.kind === "guess").length
  const n = settled(caught).length
  const m = caught.length
  return (
    <section aria-label="Check" className="flex flex-col gap-3 p-3">
      <p className="text-xs text-muted-foreground">{fresh ? `${fresh} ${fresh === 1 ? "guess is" : "guesses are"} still in it. Tap your words to confirm one.` : "Everything in it is yours."}</p>
      <ul className="flex flex-col gap-2.5">
        {rows.map((c) => (
          <li key={c.id} className="flex items-start gap-2">
            <MarkIcon mark={markOf(c)} className="mt-[3px] size-3.5 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-xs leading-snug font-medium">{c.title}</p>
              {c.kind === "guess" ? <Chips c={c} onConfirm={onConfirm} /> : <p className="text-[11px] text-muted-foreground">{c.why}</p>}
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-xs text-muted-foreground tabular-nums">{n} of {m} confirmed</span>
        <Button size="sm" className="h-7 text-xs" onClick={onDone}>Done</Button>
      </div>
    </section>
  )
}

// Your words as chips for a one-tap why, or type one.
export function Chips({ c, onConfirm }: { c: Caught; onConfirm: (id: string, why: string) => void }) {
  const [typing, setTyping] = useState(false)
  if (typing) {
    return (
      <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); const v = String(new FormData(e.currentTarget).get("v") ?? "").trim(); if (v) onConfirm(c.id, v); setTyping(false) }}>
        <Input autoFocus name="v" aria-label="Why" placeholder="Why?" onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setTyping(false) } }} className="h-7 min-w-0 flex-1 text-xs" />
        <Button size="icon-sm" variant="ghost" className="size-7 shrink-0" type="submit" aria-label="Save"><Check className="size-3.5" /></Button>
      </form>
    )
  }
  return (
    <div className="flex flex-wrap gap-1">
      {c.hints.map((h) => <Act key={h} onClick={() => onConfirm(c.id, h)}>{h}</Act>)}
      <Act muted onClick={() => setTyping(true)}>Why…</Act>
    </div>
  )
}

export function Act({ primary, muted, onClick, children }: { primary?: boolean; muted?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "max-w-full truncate rounded-full border px-2 py-0.5 text-[11px] leading-4 transition-colors",
        primary ? "border-foreground bg-foreground text-background hover:bg-foreground/90" : muted ? "border-dashed text-muted-foreground hover:border-foreground hover:text-foreground" : "hover:border-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}
