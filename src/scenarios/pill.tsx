import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown, CircleCheck, MessageCircle, PenLine, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MarkIcon } from "@/components/app/status-badge"
import { PersonAvatar } from "@/components/app/person"
import { ProjectMark } from "@/components/app/project-mark"
import { OverlayAct, OverlayCount, OverlayLogo, OverlayWhere } from "@/components/app/overlay-kit"
import { SureMark } from "@/app/sure-mark"
import { useHifi } from "@/lib/hifi"
import { PEOPLE, type Decision } from "@/data"
import type { Mark } from "@/lib/marks"
import { cn } from "@/lib/utils"
import { DESK } from "./desks"
import { setDesk, setPill, useDesk, type Desk, type Saved, type View } from "./desk-state"
import { appApi, useApp, type AppSnapshot } from "./frame"
import { markOfKind, rowsOf, type Row } from "./rows"
import { focusWin } from "./windows"

// Whyspace's overlay on the desktop: the pill at the right edge. It lists what the tools caught,
// opens by itself on a possible misalignment (after a yellow line runs once around it) and on the
// check after a share, and peeks out to ask why when a guess arrives without a reason. A clash
// offers two things: take theirs, or ask why (their Duet answers; if that isn't enough, ask them).

const WHERE = { project: "whiskr", part: "Marketing" }

const guesses = (rows: Row[]) => rows.filter((r) => r.kind === "guess")
const settled = (rows: Row[]) => rows.filter((r) => r.kind === "conf" || r.kind === "prec")
const clashOf = (rows: Row[]) => rows.find((r) => r.kind === "clash")
const defaultView = (d: Desk, rows: Row[]): View => (clashOf(rows) ? "alert" : d.shared && !d.checkClosed ? "check" : "needs")
const theirsOf = (app: AppSnapshot, clash?: Row): Decision | undefined => app.decisions.find((d) => d.id === clash?.clashes)
const firstName = (id?: string) => (id ? PEOPLE[id]?.name.split(" ")[0] ?? id : "")

const take = (id: string) => {
  appApi()?.settleClash(id, "theirs")
  setDesk((d) => ({ auto: d.pill.open && d.pill.view === "alert" ? "collapse" : null }))
}
// Your why confirms the guess; the pill says where it was saved, with Undo.
const confirm = (row: Row, why: string) => {
  appApi()?.confirm(row.id, why)
  setDesk({ saved: { id: row.id, why, before: row.why } })
}
const undo = (saved: Saved) => {
  appApi()?.unconfirm(saved.id, saved.before)
  setDesk({ saved: null })
}

export function Pill() {
  const desk = useDesk()
  const app = useApp()
  const boxRef = useRef<HTMLElement>(null)
  const rows = rowsOf(app, desk.caught, DESK?.hints)
  const open = desk.pill.open
  const clash = clashOf(rows)
  const wait = guesses(rows)
  const n = (clash ? 1 : 0) + wait.length
  // The most urgent shape with the total waiting inside. Nothing waiting: a plain circle.
  const top: Mark | null = clash ? "triangle" : wait.length ? "empty" : null
  const peek = !open && desk.peek ? rows.find((r) => r.id === desk.peek) : undefined

  // It opens by itself on a clash and on the check, and folds away once you took theirs.
  useEffect(() => {
    if (!desk.auto) return
    const auto = desk.auto
    // A clash opens once the yellow trace has gone round.
    const t = setTimeout(() => (auto === "collapse" ? setPill(false) : setPill(true, auto)), auto === "collapse" ? 1100 : auto === "alert" ? 1200 : 800)
    return () => clearTimeout(t)
  }, [desk.auto])

  // The peek shows "Saved" for a moment after you answer it, then tucks back into the pill.
  useEffect(() => {
    if (!desk.peek || desk.saved?.id !== desk.peek) return
    const t = setTimeout(() => setDesk({ peek: null }), 4000)
    return () => clearTimeout(t)
  }, [desk.peek, desk.saved])

  // Their Duet answers after a beat.
  useEffect(() => {
    if (desk.asked !== "duet-wait") return
    const t = setTimeout(() => setDesk({ asked: "duet" }), 900)
    return () => clearTimeout(t)
  }, [desk.asked])

  // Clicking anywhere else closes it, the Whyspace window included (focus leaves this page for it).
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!boxRef.current?.contains(e.target as Node)) setPill(false) }
    const onBlur = () => setPill(false)
    document.addEventListener("pointerdown", onDown)
    window.addEventListener("blur", onBlur)
    return () => { document.removeEventListener("pointerdown", onDown); window.removeEventListener("blur", onBlur) }
  }, [open])

  // ⌘⇧Y opens and closes it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "y") { e.preventDefault(); setPill(!open, open ? undefined : defaultView(desk, rows)) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const view = desk.pill.view === "alert" && clash ? "alert" : desk.pill.view === "check" && !desk.checkClosed ? "check" : "needs"

  return (
    <>
    <section
      ref={boxRef}
      aria-label="Whyspace desktop overlay"
      data-overlay={open ? "open" : "pill"}
      onKeyDown={(e) => { if (e.key === "Escape") setPill(false) }}
      className={cn(
        "fixed top-1/2 right-3 z-30 flex -translate-y-1/2 flex-col overflow-hidden border border-white/60 bg-background/90 text-foreground shadow-xl ring-1 ring-black/5 backdrop-blur-xl transition-[border-radius,box-shadow] duration-300",
        open ? "max-h-[calc(100svh-1.5rem)] w-[320px] rounded-2xl" : cn("w-12 hover:bg-background hover:shadow-2xl hover:ring-black/15", top ? "rounded-[24px]" : "h-12 rounded-full"),
      )}
    >
      {desk.trace > 0 && <span key={desk.trace} aria-hidden className="pill-trace" />}
      {!open ? (
        <button type="button" aria-expanded={false} aria-label="Open Whyspace · Whiskr" onClick={() => setPill(true, defaultView(desk, rows))} className={cn("flex flex-col items-center gap-2.5 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset", top ? "px-2 py-3" : "size-full justify-center")}>
          <ProjectMark project={WHERE.project} className="size-7 rounded-md" />
          {top ? <OverlayCount top={top} n={n} /> : null}
        </button>
      ) : (
        <div className="flex min-h-0 flex-col animate-in duration-200 fade-in-0">
          <header data-overlay-head className="flex h-12 shrink-0 items-center gap-2 border-b pr-2 pl-4">
            <OverlayLogo onClick={() => { setPill(false); focusWin("whyspace") }} />
            <span className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-xs" aria-label={`Saving to Whiskr, ${WHERE.part}`}>
              <OverlayWhere project={WHERE.project} name="Whiskr" part={WHERE.part} />
            </span>
            <Button size="icon-sm" variant="ghost" className="size-7" aria-label="Close" onClick={() => setPill(false)}><X className="size-3.5" /></Button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {view === "alert" && clash ? <Alert desk={desk} clash={clash} theirs={theirsOf(app, clash)} /> : view === "check" ? <CheckList rows={rows} ids={desk.check} /> : <Needs rows={rows} theirs={theirsOf(app, clash)} />}
          </div>
        </div>
      )}
    </section>
    {peek && <Peek row={peek} saved={desk.saved} />}
    </>
  )
}

// A guess just arrived without a reason: the question peeks out beside the pill, your words as chips.
function Peek({ row, saved }: { row: Row; saved: Saved | null }) {
  return (
    <aside aria-label="Why?" data-overlay="peek" className="fixed top-1/2 right-[68px] z-30 w-[272px] -translate-y-1/2 rounded-2xl border border-white/60 bg-background/95 p-3 text-foreground shadow-xl ring-1 ring-black/5 backdrop-blur-xl duration-300 animate-in fade-in-0 slide-in-from-right-2">
      {saved?.id === row.id ? <SavedNote saved={saved} /> : (
        <>
          <div className="flex items-start gap-2">
            <MarkIcon mark="empty" className="mt-[3px] size-3.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug font-semibold">{DESK?.asks?.[row.id] ?? "Why?"}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{row.title}</p>
            </div>
            <Button size="icon-sm" variant="ghost" className="-mt-1 -mr-1 size-6 shrink-0" aria-label="Not now" onClick={() => setDesk({ peek: null })}><X className="size-3" /></Button>
          </div>
          <div className="mt-2.5 pl-[22px]"><Chips row={row} /></div>
        </>
      )}
    </aside>
  )
}

// After a why: where it went, the why itself, and Undo.
function SavedNote({ saved, className }: { saved: Saved; className?: string }) {
  return (
    <div role="status" className={cn("flex items-start gap-2 rounded-lg bg-muted/60 px-2.5 py-2", className)}>
      <CircleCheck className="mt-px size-3.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium">Saved to {WHERE.part}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{saved.why}</p>
      </div>
      <button type="button" onClick={() => undo(saved)} className="shrink-0 rounded-sm text-[11px] font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">Undo</button>
    </div>
  )
}

// A possible misalignment: yours against theirs, and two things to do about it.
function Alert({ desk, clash, theirs }: { desk: Desk; clash: Row; theirs?: Decision }) {
  const name = firstName(theirs?.owner) || "Trevor"
  const hifi = useHifi()
  return (
    <div className="flex flex-col gap-3 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"><MarkIcon mark="triangle" className="size-3.5" />Clashes with {name}’s decision</p>
      <div data-overlay-side className="rounded-lg border bg-background p-3">
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><PersonAvatar id={DESK?.person ?? "MC"} className="size-4" />You · just now</p>
        <p className="mt-1 text-sm leading-snug font-medium">{clash.title}</p>
      </div>
      <div data-overlay-side className="rounded-lg border bg-muted/50 p-3">
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><PersonAvatar id={theirs?.owner ?? "TR"} className="size-4" />{name} · {theirs?.when}</p>
        <p className="mt-1 text-sm leading-snug font-medium">{theirs?.title}</p>
      </div>
      {desk.asked !== "none" && desk.asked !== "person" && (
        <div className="flex items-start gap-2.5 pt-1 animate-in duration-200 fade-in-0">
          <PersonAvatar id={theirs?.owner ?? "TR"} agent className="size-9" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs">{hifi ? <><span className="font-medium">{name}’s Duet</span>{desk.asked === "duet" && <SureMark sure="sure" className="ml-auto" />}</> : <><span className="font-medium">{name}</span><span className="rounded-full border px-1.5 text-[10px] leading-4 text-muted-foreground">Duet</span></>}</p>
            {desk.asked === "duet-wait" ? (
              <p className="text-xs text-muted-foreground" aria-label="Answering">···</p>
            ) : (
              <>
                <p className="mt-1 text-xs leading-5">{name} confirmed it on {theirs?.when}. {theirs?.why}</p>
              </>
            )}
          </div>
        </div>
      )}
      {desk.asked === "person" && <p className="rounded-md bg-muted/60 px-3 py-2 text-[11px] leading-4 text-muted-foreground">Sent to {name}.</p>}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {hifi ? (
          <>
            <OverlayAct primary icon={Check} onClick={() => take(clash.id)}>Use {name}’s</OverlayAct>
            {desk.asked === "none" && <OverlayAct icon={MessageCircle} onClick={() => setDesk({ asked: "duet-wait" })}>Ask why</OverlayAct>}
            {desk.asked === "duet" && <OverlayAct icon={MessageCircle} onClick={() => setDesk({ asked: "person" })}>Ask {name}</OverlayAct>}
          </>
        ) : (
          <>
            <Button size="sm" className="h-7 text-xs" onClick={() => take(clash.id)}>Use {name}’s</Button>
            {desk.asked === "none" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDesk({ asked: "duet-wait" })}>Ask why</Button>}
            {desk.asked === "duet" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDesk({ asked: "person" })}>Ask {name}</Button>}
          </>
        )}
      </div>
    </div>
  )
}

// What needs you here, then what was saved, folded.
function Needs({ rows, theirs }: { rows: Row[]; theirs?: Decision }) {
  const { saved } = useDesk()
  const [caughtOpen, setCaughtOpen] = useState(false)
  const clash = clashOf(rows)
  const name = firstName(theirs?.owner)
  const list = [...(clash ? [clash] : []), ...guesses(rows)]
  const done = settled(rows)
  return (
    <div className="p-2">
      <section aria-label="Needs you">
        {saved && done.some((r) => r.id === saved.id) && <SavedNote saved={saved} className="mx-1 mb-1.5" />}
        {list.length === 0 && !saved && <p className="px-2 py-3 text-xs text-muted-foreground">Nothing needs you here.</p>}
        <ul data-rows={list.length ? "" : undefined} className="flex flex-col gap-0.5">
          {list.map((r) => (
            <li key={r.id} className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-foreground/5">
              <MarkIcon mark={markOfKind(r.kind)} className="mt-[3px] size-3.5 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-xs leading-snug font-medium">{r.title}</p>
                {r.kind === "clash" ? (
                  <>
                    <p className="text-[11px] leading-snug text-muted-foreground">{name} confirmed “{theirs?.title}”</p>
                    <div className="flex flex-wrap gap-1">
                      <OverlayAct primary icon={Check} onClick={() => take(r.id)}>Use {name}’s</OverlayAct>
                      <OverlayAct icon={MessageCircle} onClick={() => setPill(true, "alert")}>Ask why</OverlayAct>
                    </div>
                  </>
                ) : <Chips row={r} />}
              </div>
            </li>
          ))}
        </ul>
      </section>
      {/* Saved sits on the layer itself, no card: it's a record, not something to act on. */}
      <section aria-label="Saved this session" className="mt-2">
        <button type="button" aria-expanded={caughtOpen} onClick={() => setCaughtOpen((v) => !v)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex-1 text-left font-medium">Saved</span>
          <span className="text-muted-foreground tabular-nums">{done.length}</span>
          <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform duration-300", caughtOpen && "rotate-180")} />
        </button>
        {caughtOpen && (
          done.length ? (
            <ul className="flex flex-col gap-0.5 pb-1">
              {done.map((r) => (
                <li key={r.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs">
                  <MarkIcon mark={markOfKind(r.kind)} className="size-3.5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate" title={r.title}>{r.title}{r.why && <span className="text-muted-foreground"> · {r.why}</span>}</span>
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
function CheckList({ rows, ids }: { rows: Row[]; ids: string[] }) {
  const { saved } = useDesk()
  const list = ids.map((id) => rows.find((r) => r.id === id)).filter((r): r is Row => !!r)
  const fresh = list.filter((r) => r.kind === "guess").length
  const hifi = useHifi()
  return (
    <section aria-label="Check" className="flex flex-col gap-3 p-3">
      <p className="text-xs text-muted-foreground">{fresh ? `${fresh} ${fresh === 1 ? "guess" : "guesses"} in what you shared` : "Everything in it is confirmed"}</p>
      <ul data-rows="" className="flex flex-col gap-2.5">
        {list.map((r) => (
          <li key={r.id} className="flex items-start gap-2">
            <MarkIcon mark={markOfKind(r.kind)} className="mt-[3px] size-3.5 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-xs leading-snug font-medium">{r.title}</p>
              {r.kind === "guess" ? <Chips row={r} /> : saved?.id === r.id ? <SavedNote saved={saved} className="mt-0.5" /> : <p className="text-[11px] text-muted-foreground">{r.why}</p>}
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-end gap-3 pt-1">
        <Button size="sm" className={hifi ? undefined : "h-7 text-xs"} onClick={() => setDesk((d) => ({ checkClosed: true, pill: { ...d.pill, open: false } }))}>Done</Button>
      </div>
    </section>
  )
}

// Your words as chips for a one-tap why, or type one.
function Chips({ row }: { row: Row }) {
  const [typing, setTyping] = useState(false)
  if (typing) {
    return (
      <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); const v = String(new FormData(e.currentTarget).get("v") ?? "").trim(); if (v) confirm(row, v); setTyping(false) }}>
        <Input autoFocus name="v" aria-label="Why" placeholder="Why?" onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setTyping(false) } }} className="h-7 min-w-0 flex-1 text-xs" />
        <Button size="icon-sm" variant="ghost" className="size-7 shrink-0" type="submit" aria-label="Save"><Check className="size-3.5" /></Button>
      </form>
    )
  }
  return (
    <div className="flex flex-wrap gap-1">
      {row.hints.map((h) => <OverlayAct key={h} onClick={() => confirm(row, h)}>{h}</OverlayAct>)}
      <OverlayAct muted icon={PenLine} onClick={() => setTyping(true)}>Other reason</OverlayAct>
    </div>
  )
}
