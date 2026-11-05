import { Fragment, useEffect, useRef, useState, type ReactNode } from "react"
import { ArrowUp, ChevronDown, Sparkles } from "lucide-react"
import { MarkIcon } from "@/components/app/status-badge"
import { PersonAvatar } from "@/components/app/person"
import { cn } from "@/lib/utils"
import { appSnapshot, useApp } from "../frame"
import { markOfKind, rowOf, type Row } from "../rows"
import { TesterCard } from "../tester"
import type { ToolEvent } from "../tools/events"
import { S1_ARTIFACT, S1_DECISIONS, S1_LINES, S1_TASK, S1_THREAD } from "./data"
import { getChat, setChat, useChat } from "./state"

// Keller's Claude, connected to Whyspace over MCP: the inside of its window on the scenario
// desktop. The tester types (or pastes); the reply follows the script for that turn, whatever the
// words were. What Claude records goes into Whyspace through onEvent, and the record tool shows it
// with the marks the app gives it.

const RED = S1_DECISIONS.red.id
const BLUE = S1_DECISIONS.blue.id
// The guesses in the plan, checked when it is shared.
const PLAN = [S1_DECISIONS.len.id, S1_DECISIONS.luna.id, S1_DECISIONS.dot.id]

export function S1Claude({ onEvent }: { onEvent: (e: ToolEvent) => void }) {
  const chat = useChat()
  const app = useApp()
  const taken = app.clashes[RED]?.choice === "theirs"
  const scrollRef = useRef<HTMLDivElement>(null)

  const send = (text: string) => {
    const c = getChat()
    if (c.pending) return
    setChat({ pending: true, exchanges: [...c.exchanges, { me: text, blue: taken }] })
  }

  // Claude takes a moment to answer; what it records lands in Whyspace as it answers.
  useEffect(() => {
    if (!chat.pending) return
    const t = setTimeout(() => {
      const i = getChat().exchanges.length - 1
      if (i === 1) onEvent({ type: "record", decisions: [S1_DECISIONS.len, S1_DECISIONS.red], links: [] })
      if (i === 2) onEvent({ type: "record", decisions: [S1_DECISIONS.luna, S1_DECISIONS.dot], links: [] })
      if (i === 3) {
        const now = appSnapshot()
        onEvent({ type: "share", artifact: S1_ARTIFACT, check: PLAN.filter((id) => rowOf(now, id)?.kind === "guess") })
        onEvent({ type: "done", task: S1_TASK.id })
        onEvent({ type: "toast", text: "“Promo video plan” is on Whiskr · Marketing, shared with 4 people." })
      }
      setChat({ pending: false })
    }, 1000)
    return () => clearTimeout(t)
  }, [chat.pending, onEvent])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat.exchanges.length, chat.pending, app])

  return (
    <div className="@container flex min-h-0 flex-1 bg-[#faf9f5] text-[13px] text-[#1f1e1b]">
      <nav className="hidden w-44 shrink-0 flex-col gap-1 bg-[#efede6] p-3 text-[12px] text-[#6b6a64] @2xl:flex">
        <div className="mb-2 font-semibold text-[#1f1e1b]">Claude</div>
        <div className="rounded bg-black/[0.07] px-2 py-1 text-[#1f1e1b]">{chat.exchanges.length ? "Promo video plan" : "New chat"}</div>
        <div className="px-2 py-1">Onboarding copy ideas</div>
        <div className="px-2 py-1">Match screen feedback</div>
      </nav>
      <div className="flex min-w-0 flex-1 flex-col">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[680px] flex-col px-6 py-6 leading-6">
            {chat.exchanges.length === 0 && !chat.pending && (
              <p className="mt-[16vh] flex items-center justify-center gap-3 font-serif text-2xl"><span className="text-[#c96442]" aria-hidden>✳</span>Good morning, Keller</p>
            )}
            {chat.exchanges.map((x, i) => (
              <Fragment key={i}>
                <Me>{x.me}</Me>
                {i === chat.exchanges.length - 1 && chat.pending ? (
                  <Ai><span className="inline-block animate-pulse text-neutral-400">Thinking…</span></Ai>
                ) : (
                  <Ai>{replyParts(i, x.blue).map((p, j) => <PartView key={j} part={p} rows={PLAN.concat(RED, BLUE).map((id) => rowOf(app, id)).filter((r): r is Row => !!r)} />)}</Ai>
                )}
              </Fragment>
            ))}
          </div>
        </div>
        <Composer disabled={chat.pending} onSend={send} />
      </div>
    </div>
  )
}

// The tester's next line to Claude.
export function S1Overlay() {
  const { exchanges } = useChat()
  return <TesterCard label="Say to Claude" lines={S1_LINES} n={exchanges.length} />
}

// What Claude says back, by turn. Turn 3 reads blue once Trevor's decision was taken.
type Part =
  | { kind: "text"; text: string; muted?: boolean }
  | { kind: "thread" }
  | { kind: "record"; ids: string[] }
  | { kind: "drive" }

function replyParts(i: number, blue: boolean): Part[] {
  if (i === 0) return [
    { kind: "thread" },
    { kind: "text", text: "That’s everything on the promo video so far. The Marketing thread wants cat owners to download Whiskr at launch. Trevor’s brand guidelines and the cat test videos are attached, and nobody has planned the video yet." },
    { kind: "text", muted: true, text: "How long should it be, and what should it look like?" },
  ]
  if (i === 1) return [
    { kind: "text", text: "A 15-second cut, red throughout: red title card, red end card, red accents on the swipe dot. That fits a reel and leaves room for one idea." },
    { kind: "record", ids: [S1_DECISIONS.len.id, RED] },
    { kind: "text", muted: true, text: "What should it open on?" },
  ]
  if (i === 2) return [
    { kind: "text", text: blue
      ? "Opening on Luna’s real clip from the test footage, the pounce at 0:42, and ending on the moving dot on a blue card, following Trevor’s brand change."
      : "Opening on Luna’s real clip from the test footage, the pounce at 0:42, and ending on the moving dot on the red card." },
    { kind: "text", muted: true, text: "0:00 Luna’s pounce · 0:04 the swipe · 0:08 the dot · 0:12 title card · 0:14 end card" },
    { kind: "record", ids: [S1_DECISIONS.luna.id, S1_DECISIONS.dot.id] },
  ]
  if (i === 3) return [
    { kind: "drive" },
    { kind: "text", text: "Saved to Drive as “Promo video plan” and shared with Whiskr, 4 people." },
  ]
  return [{ kind: "text", text: "Done. Anything else for the plan?" }]
}

function Me({ children }: { children: ReactNode }) {
  return <div className="mt-5 max-w-[80%] self-end rounded-2xl bg-[#ebe8df] px-4 py-2 whitespace-pre-wrap first:mt-0">{children}</div>
}

function Ai({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 flex items-start gap-2 animate-in duration-200 fade-in-0">
      <span className="mt-1 text-[#c96442]" aria-hidden>✳</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function PartView({ part, rows }: { part: Part; rows: Row[] }) {
  if (part.kind === "text") return <p className={cn("mt-3 first:mt-0", part.muted && "text-neutral-500")}>{part.text}</p>
  if (part.kind === "thread") return <ThreadTool />
  if (part.kind === "drive") {
    return (
      <Tool name="save" app="google drive" meta="Promo video plan · Whiskr">
        <p className="text-neutral-600">Shared with Whiskr · 4 people</p>
      </Tool>
    )
  }
  // A clash you took shows as what it became: Trevor's blue, in your plan.
  const shown = part.ids.map((id) => (id === RED && !rows.some((r) => r.id === RED) ? BLUE : id)).map((id) => rows.find((r) => r.id === id)).filter((r): r is Row => !!r)
  return (
    <Tool name="record_decision" meta={`Promo video plan · ${shown.length}`}>
      <ul className="flex flex-col gap-1">
        {shown.map((r) => (
          <li key={r.id} className="flex items-start gap-2">
            <MarkIcon mark={markOfKind(r.kind)} className="mt-[3px] size-3.5 shrink-0" />
            <span className="min-w-0 flex-1">{r.title}{r.why && <span className="text-neutral-500"> · {r.why}</span>}</span>
          </li>
        ))}
      </ul>
    </Tool>
  )
}

// What Claude read from the Marketing thread, folded to a line until opened.
function ThreadTool() {
  const [open, setOpen] = useState(false)
  return (
    <Tool name="read_thread" meta={`Marketing · ${S1_THREAD.decisions.length} decisions · ${S1_THREAD.attachments.length} attachments`} onToggle={() => setOpen((v) => !v)} open={open}>
      {open && (
        <div className="flex flex-col gap-1.5">
          <p className="text-neutral-600">{S1_THREAD.intent}</p>
          <ul className="flex flex-col gap-1">
            {S1_THREAD.decisions.map((d) => (
              <li key={d.title} className="flex items-center gap-2">
                <MarkIcon mark="filled" className="size-3.5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{d.title}</span>
                <span className="flex shrink-0 items-center gap-1.5 text-neutral-400"><PersonAvatar id={d.who} className="size-4" />{d.when}</span>
              </li>
            ))}
          </ul>
          <p className="text-neutral-500">Attachments: {S1_THREAD.attachments.join(", ")}</p>
        </div>
      )}
    </Tool>
  )
}

// An MCP tool call, the way a chat app shows one.
function Tool({ name, app = "whyspace", meta, open, onToggle, children }: { name: string; app?: string; meta?: string; open?: boolean; onToggle?: () => void; children: ReactNode }) {
  const head = (
    <>
      <Sparkles className="size-3 shrink-0" />
      <span className="shrink-0">{app} · {name}</span>
      {meta && <span className="ml-auto truncate">{meta}</span>}
      {onToggle && <ChevronDown className={cn("size-3 shrink-0 transition-transform", open && "rotate-180")} />}
    </>
  )
  return (
    <div className="mt-3 rounded-lg border border-black/10 bg-white px-3 py-2 text-[12px] leading-5 first:mt-0">
      {onToggle ? (
        <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full min-w-0 items-center gap-2 text-left text-[11px] text-neutral-500">{head}</button>
      ) : (
        <div className="flex min-w-0 items-center gap-2 text-[11px] text-neutral-500">{head}</div>
      )}
      {(!onToggle || open) && <div className="mt-1.5">{children}</div>}
    </div>
  )
}

// Type or paste, Enter sends. Shift+Enter for a new line.
function Composer({ disabled, onSend }: { disabled: boolean; onSend: (text: string) => void }) {
  const [text, setText] = useState("")
  const ref = useRef<HTMLTextAreaElement>(null)
  const send = () => {
    const t = text.trim()
    if (!t || disabled) return
    onSend(t)
    setText("")
  }
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "0px"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [text])
  return (
    <div className="mx-auto w-full max-w-[680px] shrink-0 px-6 pb-5">
      <form className="flex items-end gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 shadow-sm focus-within:border-black/30" onSubmit={(e) => { e.preventDefault(); send() }}>
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Reply to Claude…"
          aria-label="Message Claude"
          rows={1}
          className="max-h-40 min-h-6 flex-1 resize-none bg-transparent text-[13px] leading-6 text-[#1f1e1b] outline-none placeholder:text-neutral-400"
        />
        <button type="submit" disabled={disabled || !text.trim()} aria-label="Send" className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#c96442] text-white disabled:opacity-30"><ArrowUp className="size-4" /></button>
      </form>
      <p className="mt-2 text-[11px] text-neutral-400">Keller’s Claude · connected to Whyspace, Google Drive</p>
    </div>
  )
}
