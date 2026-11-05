import { useEffect, useRef, useState, type ReactNode } from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MarkIcon } from "@/components/app/status-badge"
import { PersonAvatar } from "@/components/app/person"
import { ProjectMark } from "@/components/app/project-mark"
import { cn } from "@/lib/utils"
import type { Mark } from "@/lib/marks"
import { TREVOR, confirmed, guesses, markOf, type Action, type Caught, type State } from "./model"

// The pill for the demo: the same shape as the real overlay, with the behaviour from the test
// scenario. It opens by itself on a misalignment and on the check. A clash offers two things:
// take Trevor's, or ask why (his Duet answers; if that isn't enough, ask Trevor himself).

export function DemoPill({ s, dispatch, onOpenApp }: { s: State; dispatch: (a: Action) => void; onOpenApp: () => void }) {
  const boxRef = useRef<HTMLElement>(null)
  const open = s.pill.open
  const wait = guesses(s)
  const n = (s.clash === "open" ? 1 : 0) + wait.length
  const top: Mark | null = s.clash === "open" ? "triangle" : wait.length ? "empty" : null
  const done = confirmed(s).length
  const close = () => dispatch({ type: "pill", open: false })

  // Clicking anywhere outside closes it.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!boxRef.current?.contains(e.target as Node)) close() }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  })

  // ⌘⇧Y opens and closes it from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "y") { e.preventDefault(); dispatch({ type: "pill", open: !open }) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, dispatch])

  const view = s.pill.view === "alert" && s.clash === "open" ? "alert" : s.pill.view === "check" && !s.checkClosed ? "check" : "needs"

  return (
    <section
      ref={boxRef}
      aria-label="Whyspace desktop overlay"
      onKeyDown={(e) => { if (e.key === "Escape") close() }}
      className={cn(
        "fixed top-1/2 right-3 z-30 flex -translate-y-1/2 flex-col overflow-hidden border border-white/60 bg-background/90 shadow-xl ring-1 ring-black/5 backdrop-blur-xl transition-[border-radius,box-shadow] duration-300",
        open ? "max-h-[calc(100svh-1.5rem)] w-[320px] rounded-2xl" : "w-12 rounded-[24px] hover:bg-background hover:shadow-2xl hover:ring-black/15",
      )}
    >
      {!open ? (
        <button type="button" aria-expanded={false} aria-label="Open Whyspace · Whiskr" onClick={() => dispatch({ type: "pill", open: true })} className="flex flex-col items-center gap-2.5 px-2 py-3 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
          <ProjectMark project="whiskr" className="size-7 rounded-md" />
          {top ? (
            <span role="status" className="relative grid size-8 place-items-center">
              <MarkIcon mark={top} className={cn("absolute inset-0 size-8", top === "empty" && "[&>span]:size-full [&>span]:border-[1.25px]", top === "triangle" && "text-foreground/15")} />
              {top === "triangle" && <svg aria-hidden viewBox="0 0 16 16" className="absolute inset-0 size-8 fill-none stroke-foreground" strokeWidth={0.9}><path d="M8 3 L13.2 12.8 H2.8 Z" strokeLinejoin="round" /></svg>}
              <span className={cn("relative text-[11px] leading-none font-semibold tabular-nums", top === "triangle" && "translate-y-[3px]")}>{n}</span>
              <span className="sr-only"> waiting, most urgent: {top === "triangle" ? "a clash" : "a guess"}</span>
            </span>
          ) : done > 0 ? (
            <span role="status" className="text-xs font-medium text-muted-foreground tabular-nums">{done}<span className="sr-only"> confirmed</span></span>
          ) : null}
        </button>
      ) : (
        <div className="flex min-h-0 flex-col animate-in duration-200 fade-in-0">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-2 pl-4">
            <button type="button" onClick={onOpenApp} title="Open Whyspace" aria-label="Open Whyspace" className="shrink-0 rounded-sm px-0.5 text-sm font-semibold tracking-tight outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring">Y</button>
            <span className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-xs" aria-label="Saving to Whiskr, Marketing">
              <ProjectMark project="whiskr" className="size-4" />
              <span className="truncate font-medium">Whiskr</span>
              <span className="text-muted-foreground">/</span><span className="truncate text-muted-foreground">Marketing</span>
            </span>
            <Button size="icon-sm" variant="ghost" className="size-7" aria-label="Close" onClick={close}><X className="size-3.5" /></Button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {view === "alert" ? <Alert s={s} dispatch={dispatch} /> : view === "check" ? <CheckList s={s} dispatch={dispatch} ids={s.checkIds} onDone={() => dispatch({ type: "checkDone" })} /> : <Needs s={s} dispatch={dispatch} />}
          </div>
        </div>
      )}
    </section>
  )
}

// A possible misalignment: yours against Trevor's, and two things to do about it.
export function Alert({ s, dispatch }: { s: State; dispatch: (a: Action) => void }) {
  const mine = s.caught.find((c) => c.id === "red")
  if (!mine) return null
  return (
    <div className="flex flex-col gap-3 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"><MarkIcon mark="triangle" className="size-3.5" />Possible misalignment</p>
      <div className="rounded-lg border bg-background p-3">
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><PersonAvatar id="MC" className="size-4" />You · just now</p>
        <p className="mt-1 text-sm leading-snug font-medium">{mine.title}</p>
      </div>
      <div className="rounded-lg border bg-muted/50 p-3">
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><PersonAvatar id={TREVOR.who} className="size-4" />Trevor · {TREVOR.when}</p>
        <p className="mt-1 text-sm leading-snug font-medium">{TREVOR.title}</p>
      </div>
      {s.asked !== "none" && (
        <div className="flex items-start gap-2 pt-1 animate-in duration-200 fade-in-0">
          <PersonAvatar id={TREVOR.who} agent className="mt-0.5 size-6" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-muted-foreground">Trevor · Duet</p>
            {s.asked === "duet-wait" ? (
              <p className="text-xs text-muted-foreground" aria-label="Answering">···</p>
            ) : (
              <>
                <p className="text-xs leading-5">Trevor confirmed it on Monday: research found cats can’t see red. Blue is what they see best.</p>
                <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-4 text-muted-foreground"><MarkIcon mark="filled" className="mt-px size-3 shrink-0" /><span>{TREVOR.title} · {TREVOR.why}</span></p>
              </>
            )}
          </div>
        </div>
      )}
      {s.asked === "trevor" && <p className="rounded-md bg-muted/60 px-3 py-2 text-[11px] leading-4 text-muted-foreground">Sent to Trevor. The clash stays on both your Todays until one of you changes it.</p>}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <Button size="sm" className="h-7 text-xs" onClick={() => dispatch({ type: "take" })}>Take Trevor’s</Button>
        {s.asked === "none" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => dispatch({ type: "askWhy" })}>Ask why</Button>}
        {s.asked === "duet" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => dispatch({ type: "askTrevor" })}>Ask Trevor</Button>}
      </div>
    </div>
  )
}

// What needs you here, then what was caught, folded.
function Needs({ s, dispatch }: { s: State; dispatch: (a: Action) => void }) {
  const [caughtOpen, setCaughtOpen] = useState(false)
  const clash = s.clash === "open" ? s.caught.find((c) => c.id === "red") : undefined
  const rows = [...(clash ? [clash] : []), ...guesses(s)]
  const done = confirmed(s)
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
                {c.kind === "clash" ? (
                  <p className="text-[11px] leading-snug text-muted-foreground">Trevor confirmed “{TREVOR.title}”</p>
                ) : null}
                {c.kind === "clash" ? (
                  <div className="flex flex-wrap gap-1">
                    <Act primary onClick={() => dispatch({ type: "take" })}>Take Trevor’s</Act>
                    <Act onClick={() => dispatch({ type: "pill", open: true, view: "alert" })}>Ask why</Act>
                  </div>
                ) : <Chips c={c} dispatch={dispatch} />}
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
                <li key={c.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs">
                  <MarkIcon mark={markOf(c)} className="size-3.5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate" title={c.title}>{c.title}{c.why && <span className="text-muted-foreground"> · {c.why}</span>}</span>
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
export function CheckList({ s, dispatch, ids, onDone }: { s: State; dispatch: (a: Action) => void; ids: string[]; onDone: () => void }) {
  const rows = ids.map((id) => s.caught.find((c) => c.id === id)).filter((c): c is Caught => !!c)
  const fresh = rows.filter((c) => c.kind === "guess").length
  const n = confirmed(s).length
  const m = s.caught.length
  return (
    <section aria-label="Check" className="flex flex-col gap-3 p-3">
      <p className="text-xs text-muted-foreground">{fresh ? `${fresh} ${fresh === 1 ? "guess is" : "guesses are"} still in it. Tap your words to confirm one.` : "Everything in it is yours."}</p>
      <ul className="flex flex-col gap-2.5">
        {rows.map((c) => (
          <li key={c.id} className="flex items-start gap-2">
            <MarkIcon mark={markOf(c)} className="mt-[3px] size-3.5 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-xs leading-snug font-medium">{c.title}</p>
              {c.kind === "conf" ? <p className="text-[11px] text-muted-foreground">{c.why}</p> : <Chips c={c} dispatch={dispatch} />}
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
function Chips({ c, dispatch }: { c: Caught; dispatch: (a: Action) => void }) {
  const [typing, setTyping] = useState(false)
  if (typing) {
    return (
      <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); const v = String(new FormData(e.currentTarget).get("v") ?? "").trim(); if (v) dispatch({ type: "confirm", id: c.id, why: v }); setTyping(false) }}>
        <Input autoFocus name="v" aria-label="Why" placeholder="Why?" onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setTyping(false) } }} className="h-7 min-w-0 flex-1 text-xs" />
        <Button size="icon-sm" variant="ghost" className="size-7 shrink-0" type="submit" aria-label="Save"><Check className="size-3.5" /></Button>
      </form>
    )
  }
  return (
    <div className="flex flex-wrap gap-1">
      {c.hints.map((h) => <Act key={h} onClick={() => dispatch({ type: "confirm", id: c.id, why: h })}>{h}</Act>)}
      <Act muted onClick={() => setTyping(true)}>Why…</Act>
    </div>
  )
}

function Act({ primary, muted, onClick, children }: { primary?: boolean; muted?: boolean; onClick: () => void; children: ReactNode }) {
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
