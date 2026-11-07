import { Fragment, useEffect, useRef, useState } from "react"
import { Check, Download } from "lucide-react"
import { MarkIcon } from "@/components/app/status-badge"
import { PersonAvatar } from "@/components/app/person"
import { cn } from "@/lib/utils"
import { CatMark } from "../artifacts/brand-deck"
import { Ai, Composer, Me, Tool } from "./chat"
import type { ToolEvent } from "./events"
import { FOLLOWED_BY, FOLLOWS, FOLLOW_LINKS, READ, SHOTS, STAR, STAR_NOTES, TASK, exported, replyParts, turnOf, type Part, type Turn } from "./runway-script"
import { markSent } from "./sent"
import { useStickToEnd } from "./use-stick"

// Runway on the scenario desktop (scenario 2): the chat on the left, the cut on the board, Export
// shares it. Only the inside of the window; the desktop draws the frame. It writes to Whyspace
// through onEvent, the way a tool connected over MCP would.

type Exchange = { me: string; turn: Turn }

export function RunwayApp({ onEvent, person = "Keller" }: { onEvent: (e: ToolEvent) => void; person?: string }) {
  const [xs, setXs] = useState<Exchange[]>([])
  const [pending, setPending] = useState(false)
  const [starred, setStarred] = useState(false)
  const [shared, setShared] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const emit = useRef(onEvent)
  useEffect(() => { emit.current = onEvent })
  const scrollRef = useStickToEnd([xs.length, pending])

  const send = (text: string) => {
    if (pending) return
    markSent("runway")
    setXs((all) => [...all, { me: text, turn: turnOf(text, all.length, starred) }])
    setPending(true)
  }

  // Runway answers a beat later and writes what the turn changed.
  useEffect(() => {
    if (!pending) return
    const turn = xs[xs.length - 1]?.turn
    const t = setTimeout(() => {
      if (turn === "setup") emit.current({ type: "record", decisions: FOLLOWS, links: FOLLOW_LINKS })
      if (turn === "star") { setStarred(true); emit.current({ type: "record", decisions: [STAR], links: [] }) }
      if (turn === "export") {
        setShared(true)
        setToast("Exported and shared to Whiskr · Marketing")
        emit.current({ type: "share", artifact: exported(starred), check: starred ? [STAR.id] : [] })
        emit.current({ type: "done", task: TASK })
      }
      setPending(false)
    }, 1100)
    return () => clearTimeout(t)
  }, [pending, xs, starred])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  const cut = xs.some((x, i) => x.turn === "setup" && !(pending && i === xs.length - 1))

  return (
    <div className="@container relative flex min-h-0 min-w-0 flex-1 bg-[#111111] text-neutral-100">
      <div className="flex w-[44%] min-w-[240px] shrink-0 flex-col border-r border-white/10">
        <div className="flex h-9 shrink-0 items-center gap-2 px-4 text-[11px] text-neutral-400"><span className="rounded bg-white/10 px-1.5 py-0.5 text-neutral-200">Chat</span><span>Gen-4</span></div>
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex w-full flex-col px-4 py-4 text-[13px] leading-6">
            {xs.length === 0 && <p className="mt-[16vh] text-center text-neutral-500">Describe the video, or set it up from a plan.</p>}
            {xs.map((x, i) => (
              <Fragment key={i}>
                <Me className="bg-white/10 text-neutral-100">{x.me}</Me>
                {pending && i === xs.length - 1 ? (
                  <Ai glyph={<R />}><span className="inline-block animate-pulse text-neutral-500">Working…</span></Ai>
                ) : (
                  <Ai glyph={<R />}>{replyParts(x.turn).map((p, j) => <PartView key={j} part={p} />)}</Ai>
                )}
              </Fragment>
            ))}
          </div>
        </div>
        <Composer dark disabled={pending} onSend={send} placeholder="Describe a change…" footer={`${person}’s Runway · connected to Whyspace`} label="Message Runway" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-9 shrink-0 items-center gap-3 border-b border-white/10 px-4 text-[12px]">
          <span className="truncate font-medium">Whiskr promo</span>
          <span className="hidden truncate text-neutral-500 @2xl:inline">15 s · 9:16 and 16:9</span>
          {shared ? (
            <span className="ml-auto flex shrink-0 items-center gap-1.5 text-neutral-300"><Check className="size-3.5" />Shared · Marketing</span>
          ) : (
            <button type="button" disabled={!cut || pending} onClick={() => send("Export and share it to the Marketing thread.")} className="ml-auto flex h-6 shrink-0 items-center gap-1.5 rounded-md bg-white px-2.5 text-[12px] font-medium text-neutral-900 disabled:opacity-30"><Download className="size-3.5" />Export</button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {cut ? (
            <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-4">
              {SHOTS.map((sh, i) => (
                <div key={sh.at} className="flex flex-col gap-2">
                  <div className="relative aspect-[9/16] max-h-80 overflow-hidden rounded-md bg-neutral-800 ring-1 ring-white/10">
                    <ShotArt i={i} />
                    <span className="absolute top-2 left-2 rounded bg-black/40 px-1 text-[10px] text-white/80 tabular-nums">{sh.at}</span>
                    {starred && i > 0 && <span className="absolute top-2 right-2 rounded bg-white/90 px-1.5 text-[10px] font-medium text-neutral-900">Luna</span>}
                  </div>
                  <div className="text-[12px]">{sh.title}</div>
                  <div className="-mt-1.5 text-[11px] text-neutral-400">{starred ? STAR_NOTES[i] : sh.note}</div>
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
      {toast && <div role="status" className="absolute right-4 bottom-14 z-10 rounded-md bg-white px-3 py-2 text-[12px] text-neutral-900 shadow-lg">{toast}</div>}
    </div>
  )
}

function R() {
  return <span className="flex size-5 items-center justify-center rounded bg-white text-[10px] font-bold text-neutral-900">R</span>
}

function PartView({ part }: { part: Part }) {
  if (part.kind === "text") return <p className={cn("mt-3 first:mt-0", part.muted && "text-neutral-500")}>{part.text}</p>
  if (part.kind === "read") return <ReadTool />
  if (part.kind === "follows") return <FollowsTool />
  if (part.kind === "star") return (
    <Tool dark name="record_decision" meta="Promo video · 1">
      <p className="flex items-start gap-2"><MarkIcon mark="empty" className="mt-[3px] size-3.5 shrink-0" /><span className="min-w-0 flex-1">{STAR.title}</span></p>
    </Tool>
  )
  return (
    <>
      <Tool dark app="runway" name="export" meta="whiskr-promo-15s · 9:16, 16:9" />
      <Tool dark name="share" meta="Promo video · Marketing"><p className="text-neutral-400">Shared with Whiskr · 4 people</p></Tool>
    </>
  )
}

// What Runway read from the Marketing thread: the plan and Trevor's brand guidelines.
function ReadTool() {
  const [open, setOpen] = useState(false)
  return (
    <Tool dark name="read_thread" meta={`Marketing · ${READ.plan.length + READ.brand.length} decisions · 3 attachments`} open={open} onToggle={() => setOpen((v) => !v)}>
      <div className="flex flex-col gap-1.5">
        <p className="text-neutral-400">Promo video plan · Keller · Tuesday</p>
        <ul className="flex flex-col gap-1">{READ.plan.map((r) => <Row key={r.title} title={r.title} mark={r.mark} who="MC" />)}</ul>
        <p className="pt-1 text-neutral-400">Brand guidelines v3 · Trevor · Monday</p>
        <ul className="flex flex-col gap-1">{READ.brand.map((t) => <Row key={t} title={t} mark="filled" who="TR" />)}</ul>
      </div>
    </Tool>
  )
}

function FollowsTool() {
  const [open, setOpen] = useState(false)
  return (
    <Tool dark name="record_decision" meta={`Promo video · ${FOLLOWS.length} follow, nothing new`} open={open} onToggle={() => setOpen((v) => !v)}>
      <ul className="flex flex-col gap-1">{FOLLOWS.map((d) => <Row key={d.id} title={d.title} mark="ringed" who={FOLLOWED_BY[d.id]} />)}</ul>
    </Tool>
  )
}

function Row({ title, mark, who }: { title: string; mark: "filled" | "ringed" | "empty"; who: string }) {
  return (
    <li className="flex items-center gap-2">
      <MarkIcon mark={mark} className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{title}</span>
      <PersonAvatar id={who} className="size-4" />
    </li>
  )
}

// A sketch of each shot, enough to tell them apart.
function ShotArt({ i }: { i: number }) {
  if (i === 0) return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,#6b6b6b_0%,#2a2a2a_70%)]">
      <svg viewBox="0 0 90 160" className="absolute inset-0 h-full w-full text-neutral-200" aria-hidden>
        <ellipse cx="45" cy="104" rx="22" ry="14" fill="currentColor" opacity="0.85" />
        <circle cx="62" cy="88" r="11" fill="currentColor" />
        <path d="M54 80 L57 70 L62 79 Z M66 79 L72 70 L72 81 Z" fill="currentColor" />
        <path d="M24 104 C 10 98, 8 84, 16 76" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  )
  if (i === 1) return <div className="absolute inset-0 flex items-center justify-center bg-neutral-600"><span className="font-serif text-xl text-white">Whiskr</span></div>
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
