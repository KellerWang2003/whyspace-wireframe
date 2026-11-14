import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OverlayFold, OverlayLogo, OverlayWhere } from "@/components/app/overlay-kit"
import { OverlayStack, type LogEntry, type OverlayAnswer, type OverlayItem } from "@/components/app/overlay-stack"
import { clashTask, clashTitle } from "@/app/needs-model"
import { PEOPLE, type Decision } from "@/data"
import { cn } from "@/lib/utils"
import { DESK } from "./desks"
import { setDesk, setPill, useDesk, type Desk, type Saved } from "./desk-state"
import { appApi, useApp, type AppSnapshot } from "./frame"
import { markOfKind, rowsOf, type Row } from "./rows"
import { focusWin } from "./windows"

// Whyspace's overlay on the desktop: the pill at the right edge. Folded, it shows the project's mark and how
// many decisions it captured this session; while a clash waits, the alert symbol instead, until it's cleared.
// A clash is the only thing that opens it by itself (after a yellow line runs once around it); the check opens
// after a share. Open, it shows one card at a time, Today's Needs you card in the same words
// (components/app/overlay-stack). A clash offers four answers: use theirs, use mine, add a task, ask them why.

const WHERE = { project: "whiskr", part: "Marketing" }

const firstName = (id?: string) => (id ? PEOPLE[id]?.name.split(" ")[0] ?? id : "")
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
const waits = (r: Row) => (r.kind === "clash" && !r.task) || r.kind === "guess"
const theirsOf = (app: AppSnapshot, r?: Row): Decision | undefined => app.decisions.find((d) => d.id === r?.clashes)
const tool = DESK?.tools[0]?.name

// Your why confirms the guess; the card says where it was saved, with Undo.
const confirm = (row: Row, why: string) => {
  appApi()?.confirm(row.id, why)
  setDesk({ saved: { id: row.id, why, before: row.why } })
}
const undo = (saved: Saved) => {
  appApi()?.unconfirm(saved.id, saved.before)
  setDesk({ saved: null })
}

function itemOf(app: AppSnapshot, r: Row): OverlayItem {
  const me = DESK?.person ?? "MC"
  const saved = (note?: string, undoIt?: () => void) => ({ text: `Saved to ${WHERE.part}`, note, undo: undoIt })
  if (r.kind === "clash") {
    const mine = app.decisions.find((d) => d.id === r.id)
    const theirs = theirsOf(app, r)
    const name = firstName(theirs?.owner) || "them"
    const answers: OverlayAnswer[] = [
      { label: `Use ${name}’s`, primary: true, icon: "done", run: () => appApi()?.settleClash(r.id, "theirs"), flash: () => saved(`Uses ${name}’s decision`) },
      {
        label: "Use mine",
        icon: "write",
        input: { placeholder: `Why keep yours? ${name} will see it.`, save: "Keep mine", run: (why) => appApi()?.settleClash(r.id, "mine", why.trim()) },
        flash: (why) => ({ text: "Kept yours", note: why }),
      },
      ...(mine && theirs ? [{ label: "Add a task", icon: "task" as const, run: () => appApi()?.addTask(clashTask(mine, theirs, me)), flash: () => ({ text: "Task added for today", note: clashTask(mine, theirs, me).title }) }] : []),
      ...(theirs ? [{ label: `Ask ${name} why`, icon: "talk" as const }] : []),
    ]
    return {
      id: r.id,
      level: "alert",
      source: { face: me, agent: true, who: "Your Duet", what: tool ? "caught this in" : "caught this", tool },
      title: mine && theirs ? clashTitle(mine, theirs) : `Your decision clashes with ${name}’s.`,
      sides: [
        { label: "Yours · just now", text: r.title },
        ...(theirs ? [{ label: [`${name}’s`, theirs.when].filter(Boolean).join(" · "), text: theirs.title }] : []),
      ],
      answers,
      ask: theirs ? { face: theirs.owner, name, text: `${name} confirmed it on ${theirs.when}. ${theirs.why ?? ""}`.trim(), why: theirs.why, when: theirs.when, sure: "sure" } : undefined,
    }
  }
  const pick = (why: string) => saved(why, () => undo({ id: r.id, why, before: r.why }))
  return {
    id: r.id,
    level: "ask",
    source: { face: me, agent: true, who: "Your Duet", what: tool ? "saved this guess from" : "saved this guess", tool },
    title: DESK?.asks?.[r.id] ?? `Why ${lowerFirst(r.title)}?`,
    sides: [{ label: "You said · just now", text: r.title, note: "No reason yet." }],
    answers: [
      ...r.hints.map((h, i): OverlayAnswer => ({ label: h, primary: i === 0, icon: "done", run: () => confirm(r, h), flash: () => pick(h) })),
      { label: "Other reason", icon: "write", input: { placeholder: "Why?", save: "Save", run: (why) => confirm(r, why.trim()) }, flash: (why) => pick(why ?? "") },
    ],
  }
}

const logOf = (rows: Row[]): LogEntry[] =>
  rows.filter((r) => !waits(r)).map((r) => (r.task
    ? { id: r.id, mark: "task", title: r.title, note: "A task, for today" }
    : { id: r.id, mark: markOfKind(r.kind), title: r.title, note: r.why }))

export function Pill() {
  const desk = useDesk()
  const app = useApp()
  const boxRef = useRef<HTMLElement>(null)
  const rows = rowsOf(app, desk.caught, DESK?.hints)
  const open = desk.pill.open
  const clash = rows.find((r) => r.kind === "clash" && !r.task)
  const theirs = theirsOf(app, clash)
  const checking = desk.pill.view === "check" && desk.shared && !desk.checkClosed

  // It opens by itself on a clash and on the check.
  useEffect(() => {
    if (!desk.auto) return
    const auto = desk.auto
    // A clash opens once the yellow trace has gone round.
    const t = setTimeout(() => (auto === "collapse" ? setPill(false) : setPill(true, auto === "check" ? "check" : "needs")), auto === "collapse" ? 1100 : auto === "alert" ? 1200 : 800)
    return () => clearTimeout(t)
  }, [desk.auto])

  // Clicking anywhere else closes it, the Whyspace window included (focus leaves this page for it).
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement
      // The skipped list opens in a popover outside the box.
      if (boxRef.current?.contains(t) || t.closest?.("[data-slot=popover-content]")) return
      setPill(false)
    }
    const onBlur = () => setPill(false)
    document.addEventListener("pointerdown", onDown)
    window.addEventListener("blur", onBlur)
    return () => { document.removeEventListener("pointerdown", onDown); window.removeEventListener("blur", onBlur) }
  }, [open])

  // ⌘⇧Y opens and closes it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "y") { e.preventDefault(); setPill(!open, open ? undefined : defaultView(desk)) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const openToday = () => { setPill(false); appApi()?.navigate("/today"); focusWin("whyspace") }
  const check = desk.check.filter((id) => rows.some((r) => r.id === id && r.kind === "guess"))

  return (
    <section
      ref={boxRef}
      aria-label="Whyspace desktop overlay"
      data-overlay={open ? "open" : "pill"}
      onKeyDown={(e) => { if (e.key === "Escape") setPill(false) }}
      className={cn(
        "fixed top-1/2 right-3 z-30 flex -translate-y-1/2 flex-col border border-white/60 bg-background/90 text-foreground shadow-xl ring-1 ring-black/5 backdrop-blur-xl transition-[border-radius,box-shadow] duration-300",
        open ? "max-h-[calc(100svh-1.5rem)] w-[340px] overflow-hidden rounded-[24px]" : "w-12 rounded-[24px] hover:bg-background hover:shadow-2xl hover:ring-black/15",
      )}
    >
      {desk.trace > 0 && <span key={desk.trace} aria-hidden className="pill-trace" />}
      {!open ? (
        <button type="button" aria-expanded={false} aria-label="Open Whyspace · Whiskr" onClick={() => setPill(true, defaultView(desk))} className="flex flex-col items-center gap-2.5 rounded-[inherit] px-2 py-3 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
          <OverlayFold project={WHERE.project} captured={rows.length} alert={clash ? `${clash.title}, against ${firstName(theirs?.owner) || "a teammate"}’s decision` : undefined} />
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
            <OverlayStack
              key={checking ? "check" : "needs"}
              items={rows.filter(waits).filter((r) => !checking || check.includes(r.id)).sort((a, b) => Number(b.kind === "clash") - Number(a.kind === "clash")).map((r) => itemOf(app, r))}
              log={logOf(rows)}
              more={{ onOpen: openToday }}
              check={checking ? { intro: `${desk.check.length} ${desk.check.length === 1 ? "guess" : "guesses"} in what you shared`, onDone: () => setDesk((d) => ({ checkClosed: true, pill: { ...d.pill, open: false } })) } : undefined}
            />
          </div>
        </div>
      )}
    </section>
  )
}

const defaultView = (d: Desk) => (d.shared && !d.checkClosed ? "check" : "needs")
