import { Fragment, useState } from "react"
import { Check, Download } from "lucide-react"
import { MarkIcon } from "@/components/app/status-badge"
import { PersonAvatar } from "@/components/app/person"
import { Toast, Win } from "@/app/desk/win"
import { cn } from "@/lib/utils"
import { markOf } from "../kit/model"
import { Ai, Composer, DeskShell, Me, Tool, WIN } from "../kit/desk"
import { useStickToEnd } from "../kit/hooks"
import { TesterCard } from "../kit/app"
import { Pill } from "../kit/pill"
import { CatMark } from "./app"
import { BRAND, DAY, LABEL, LINES, PLAN, SHOTS, hasCut, replyParts, timeAt, type Action, type Part, type State } from "./model"

// Keller's desk on Wednesday: Runway, connected to Whyspace over MCP, and the pill. The tester
// pastes into Runway's chat; the cut appears on the board; Export shares it.

export function DemoDesk2({ s, dispatch }: { s: State; dispatch: (a: Action) => void }) {
  const exit = () => dispatch({ type: "surface", to: "app" })
  return (
    <DeskShell app="Runway" person="Keller · Chief marketing officer" day={DAY} time={timeAt(Math.max(0, s.exchanges.length - 1))} onExit={exit}>
      <RunwayWin s={s} dispatch={dispatch} />
      <Pill project="whiskr" part="Marketing" caught={s.caught} open={s.pill.open} view={s.pill.view} checkIds={s.checkIds} checkClosed={s.checkClosed}
        onOpen={(open, view) => dispatch({ type: "pill", open, view })} onConfirm={(id, why) => dispatch({ type: "confirm", id, why })} onDone={() => dispatch({ type: "checkDone" })} onOpenApp={exit} />
      <TesterCard label={LABEL} lines={LINES} n={Math.min(s.exchanges.length, LINES.length)} />
    </DeskShell>
  )
}

function RunwayWin({ s, dispatch }: { s: State; dispatch: (a: Action) => void }) {
  const scrollRef = useStickToEnd([s.exchanges.length, s.pending, s.caught])
  const cut = hasCut(s)
  const zoom = s.caught.some((c) => c.id === "zoom")
  return (
    <Win title="Runway — Whiskr promo" dark className={cn(WIN, "bg-[#111111]")}>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-[44%] min-w-0 shrink-0 flex-col border-r border-white/10">
          <div className="flex h-9 shrink-0 items-center gap-2 px-4 text-[11px] text-neutral-400"><span className="rounded bg-white/10 px-1.5 py-0.5 text-neutral-200">Chat</span><span>Gen-4</span></div>
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex w-full flex-col px-5 py-4 text-[13px] leading-6 text-neutral-100">
              {s.exchanges.length === 0 && !s.pending && (
                <p className="mt-[16vh] text-center text-neutral-500">Describe the video, or set it up from a plan.</p>
              )}
              {s.exchanges.map((x, i) => {
                const last = i === s.exchanges.length - 1
                return (
                  <Fragment key={i}>
                    <Me className="bg-white/10 text-neutral-100">{x.me}</Me>
                    {last && s.pending ? (
                      <Ai glyph={<R />}><span className="inline-block animate-pulse text-neutral-500">Working…</span></Ai>
                    ) : (
                      <Ai glyph={<R />}>{replyParts(x.turn).map((p, j) => <PartView key={j} part={p} s={s} />)}</Ai>
                    )}
                  </Fragment>
                )
              })}
            </div>
          </div>
          <Composer dark disabled={s.pending} onSend={(t) => dispatch({ type: "send", text: t })} placeholder="Describe a change…" footer="Keller’s Runway · connected to Whyspace" label="Message Runway" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-9 shrink-0 items-center gap-3 border-b border-white/10 px-4 text-[12px]">
            <span className="font-medium text-neutral-100">Whiskr promo</span>
            <span className="text-neutral-500">15 s · 9:16 and 16:9</span>
            {s.shared ? (
              <span className="ml-auto flex items-center gap-1.5 text-neutral-300"><Check className="size-3.5" />Shared · Whiskr · Marketing</span>
            ) : (
              <button type="button" disabled={!cut || s.pending} onClick={() => dispatch({ type: "send", text: "Export and share it to the Marketing thread." })} className="ml-auto flex h-6 items-center gap-1.5 rounded-md bg-white px-2.5 text-[12px] font-medium text-neutral-900 disabled:opacity-30"><Download className="size-3.5" />Export</button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {cut ? (
              <div className="grid grid-cols-4 gap-4">
                {SHOTS.map((sh, i) => (
                  <div key={sh.at} className="flex flex-col gap-2">
                    <div className="relative aspect-[9/16] overflow-hidden rounded-md bg-neutral-800 ring-1 ring-white/10">
                      <ShotArt i={i} zoom={zoom && i === 0} />
                      <span className="absolute top-2 left-2 rounded bg-black/40 px-1 text-[10px] text-white/80 tabular-nums">{sh.at}</span>
                      {zoom && i === 0 && <span className="absolute top-2 right-2 rounded bg-white/90 px-1.5 text-[10px] font-medium text-neutral-900">Slow zoom</span>}
                    </div>
                    <div className="text-[12px] text-neutral-100">{sh.title}</div>
                    <div className="-mt-1.5 text-[11px] text-neutral-400">{sh.note}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-white/10 text-[12px] text-neutral-500">No shots yet</div>
            )}
          </div>
          <div className="flex h-10 shrink-0 items-center gap-3 border-t border-white/10 px-4 text-[11px] text-neutral-500">
            <span>Timeline</span>
            <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-white/5">{cut && SHOTS.map((sh, i) => <span key={sh.at} className={cn("h-full border-r border-black/40", i % 2 ? "bg-white/20" : "bg-white/30")} style={{ width: `${[27, 27, 33, 13][i]}%` }} />)}</div>
            <span className="tabular-nums">0:15</span>
          </div>
        </div>
      </div>
      {s.toast && <Toast className="right-6 bottom-6 left-auto">{s.toast}</Toast>}
    </Win>
  )
}

function R() {
  return <span className="flex size-5 items-center justify-center rounded bg-white text-[10px] font-bold text-neutral-900">R</span>
}

// A sketch of each shot, enough to tell them apart.
function ShotArt({ i, zoom }: { i: number; zoom: boolean }) {
  if (i === 0) return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,#6b6b6b_0%,#2a2a2a_70%)]">
      <svg viewBox="0 0 90 160" className={cn("absolute inset-0 h-full w-full text-neutral-200 transition-transform duration-[3000ms]", zoom && "scale-125")} aria-hidden>
        <ellipse cx="45" cy="104" rx="22" ry="14" fill="currentColor" opacity="0.85" />
        <circle cx="62" cy="88" r="11" fill="currentColor" />
        <path d="M54 80 L57 70 L62 79 Z M66 79 L72 70 L72 81 Z" fill="currentColor" />
        <path d="M24 104 C 10 98, 8 84, 16 76" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  )
  if (i === 1) return (
    <div className="absolute inset-0 flex items-center justify-center bg-neutral-600">
      <span className="font-serif text-xl text-white">Whiskr</span>
    </div>
  )
  if (i === 2) return (
    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
      <div className="relative h-[62%] w-[70%] rounded-lg bg-neutral-300">
        <svg viewBox="0 0 70 100" className="absolute inset-0 h-full w-full text-neutral-900" aria-hidden>
          <path d="M14 78 L 30 60 L 42 72 L 58 50" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="58" cy="50" r="5" fill="currentColor" />
        </svg>
      </div>
    </div>
  )
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-600 text-white">
      <CatMark className="h-10 w-auto" />
      <span className="font-serif text-sm">Whiskr</span>
    </div>
  )
}

function PartView({ part, s }: { part: Part; s: State }) {
  if (part.kind === "text") return <p className={cn("mt-3 first:mt-0", part.muted && "text-neutral-500")}>{part.text}</p>
  if (part.kind === "thread") return <ThreadTool />
  if (part.kind === "follows") return <FollowsTool s={s} />
  if (part.kind === "export") return (
    <>
      <Tool dark app="runway" name="export" meta="whiskr-promo-15s · 9:16, 16:9" />
      <Tool dark name="share" meta="Promo video · Marketing"><p className="text-neutral-400">Shared with Whiskr · 4 people</p></Tool>
    </>
  )
  const rows = part.ids.map((id) => s.caught.find((c) => c.id === id)).filter((c) => !!c)
  return (
    <Tool dark name="record_decision" meta={`Promo video · ${rows.length}`}>
      <ul className="flex flex-col gap-1">
        {rows.map((c) => (
          <li key={c.id} className="flex items-start gap-2">
            <MarkIcon mark={markOf(c)} className="mt-[3px] size-3.5 shrink-0" />
            <span className="min-w-0 flex-1">{c.title}{c.why && <span className="text-neutral-500"> · {c.why}</span>}</span>
          </li>
        ))}
      </ul>
    </Tool>
  )
}

// What Runway read from the Marketing thread: the plan and Trevor's brand guidelines.
function ThreadTool() {
  const [open, setOpen] = useState(false)
  return (
    <Tool dark name="read_thread" meta={`Marketing · ${PLAN.length + BRAND.length} decisions · 3 attachments`} open={open} onToggle={() => setOpen((v) => !v)}>
      <div className="flex flex-col gap-1.5">
        <p className="text-neutral-400">Promo video plan · Keller · yesterday</p>
        <List rows={PLAN.map((p) => ({ title: p.title, mark: p.mark, who: "MC" }))} />
        <p className="pt-1 text-neutral-400">Brand guidelines v3 · Trevor · Monday</p>
        <List rows={BRAND.map((d) => ({ title: d.title, mark: "filled" as const, who: "TR" }))} />
      </div>
    </Tool>
  )
}

function FollowsTool({ s }: { s: State }) {
  const [open, setOpen] = useState(false)
  const rows = s.caught.filter((c) => c.kind === "prec")
  return (
    <Tool dark name="record_decision" meta={`Promo video · ${rows.length} follow, nothing new`} open={open} onToggle={() => setOpen((v) => !v)}>
      <ul className="flex flex-col gap-1">
        {rows.map((c) => (
          <li key={c.id} className="flex items-start gap-2">
            <MarkIcon mark="ringed" className="mt-[3px] size-3.5 shrink-0" />
            <span className="min-w-0 flex-1">{c.title}<span className="text-neutral-500"> · {c.why}</span></span>
          </li>
        ))}
      </ul>
    </Tool>
  )
}

function List({ rows }: { rows: { title: string; mark: "filled" | "ringed" | "empty" | "triangle"; who: string }[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {rows.map((r) => (
        <li key={r.title} className="flex items-center gap-2">
          <MarkIcon mark={r.mark} className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{r.title}</span>
          <PersonAvatar id={r.who} className="size-4" />
        </li>
      ))}
    </ul>
  )
}

