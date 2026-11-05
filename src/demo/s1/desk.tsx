import { Fragment, useEffect, useRef, useState, type ReactNode } from "react"
import { ArrowUp, Check, ChevronDown, Copy, Sparkles } from "lucide-react"
import { MarkIcon } from "@/components/app/status-badge"
import { PersonAvatar } from "@/components/app/person"
import { Toast, Win } from "@/design-b/desk/win"
import { cn } from "@/lib/utils"
import { ATTACHMENTS, LINES, THREAD_DECISIONS, THREAD_INTENT, markOf, replyParts, timeAt, type Action, type Part, type State } from "./model"
import { DemoPill } from "./pill"

// Keller's desk: Claude, connected to Whyspace over MCP, and the pill. The tester types (or pastes)
// into Claude; the reply follows the script for that turn, whatever the words were.

const WIN = "top-12 right-[4%] bottom-16 left-[3%] xl:right-[26%]"

export function DemoDesk({ s, dispatch }: { s: State; dispatch: (a: Action) => void }) {
  const exit = () => dispatch({ type: "surface", to: "app" })
  return (
    <div className="relative h-svh w-full overflow-hidden bg-[linear-gradient(160deg,#d9dde3_0%,#c9ced6_55%,#b9bfc9_100%)] text-[13px] text-neutral-900">
      <div className="absolute inset-x-0 top-0 z-10 flex h-7 items-center gap-4 bg-white/55 px-4 text-[12px] backdrop-blur select-none">
        <span className="size-3 rounded-full bg-neutral-800" aria-hidden />
        <span className="font-semibold">Claude</span>
        <span className="text-neutral-600">File</span>
        <span className="text-neutral-600">Edit</span>
        <span className="text-neutral-600">View</span>
        <span className="ml-auto text-neutral-700">Keller · Chief marketing officer</span>
        <span className="text-neutral-700 tabular-nums">Tue {timeAt(Math.max(0, s.exchanges.length - 1))}</span>
        <button type="button" onClick={exit} className="rounded px-1.5 py-0.5 text-neutral-700 hover:bg-black/5">Open Whyspace</button>
      </div>
      <ClaudeWin s={s} dispatch={dispatch} />
      <DemoPill s={s} dispatch={dispatch} onOpenApp={exit} />
      <NextLine n={s.exchanges.length} />
    </div>
  )
}

// The tester's card: the next line to say to Claude, ready to copy. Part of the test harness, not
// of the product, so it is styled like the scenario bar.
function NextLine({ n }: { n: number }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])
  const line = LINES[n]
  if (!line) return null
  const copy = () => {
    void navigator.clipboard?.writeText(line).catch(() => { /* clipboard blocked: the line is on screen to retype */ })
    setCopied(true)
  }
  return (
    <div className="fixed bottom-3 left-3 z-40 flex max-w-[20rem] items-start gap-2 rounded-2xl bg-neutral-900/85 py-2 pr-2 pl-3 text-[12px] text-white shadow-lg backdrop-blur select-none">
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-white/60">Say to Claude · {n + 1} of {LINES.length}</div>
        <button type="button" onClick={copy} title="Copy" className="mt-0.5 line-clamp-3 w-full text-left leading-4 hover:text-white/80">“{line}”</button>
      </div>
      <button type="button" onClick={copy} aria-label={copied ? "Copied" : "Copy line"} title="Copy" className="flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-white/15">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  )
}

function ClaudeWin({ s, dispatch }: { s: State; dispatch: (a: Action) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [s.exchanges.length, s.pending, s.caught])

  return (
    <Win title="Claude" className={cn(WIN, "bg-[#faf9f5]")}>
      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-44 shrink-0 flex-col gap-1 bg-[#efede6] p-3 text-[12px] text-[#6b6a64] md:flex">
          <div className="mb-2 font-semibold text-[#1f1e1b]">Claude</div>
          <div className="rounded bg-black/[0.07] px-2 py-1 text-[#1f1e1b]">{s.exchanges.length ? "Promo video plan" : "New chat"}</div>
          <div className="px-2 py-1">Onboarding copy ideas</div>
          <div className="px-2 py-1">Match screen feedback</div>
        </nav>
        <div className="flex min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-[680px] flex-col px-6 py-6 text-[13px] leading-6 text-[#1f1e1b]">
              {s.exchanges.length === 0 && !s.pending && (
                <p className="mt-[18vh] flex items-center justify-center gap-3 font-serif text-2xl text-[#1f1e1b]"><span className="text-[#c96442]" aria-hidden>✳</span>Good morning, Keller</p>
              )}
              {s.exchanges.map((x, i) => {
                const last = i === s.exchanges.length - 1
                return (
                  <Fragment key={i}>
                    <Me>{x.me}</Me>
                    {last && s.pending ? (
                      <Ai><span className="inline-block animate-pulse text-neutral-400">Thinking…</span></Ai>
                    ) : (
                      <Ai>{replyParts(i, x.blue).map((p, j) => <PartView key={j} part={p} s={s} />)}</Ai>
                    )}
                  </Fragment>
                )
              })}
            </div>
          </div>
          <Composer disabled={s.pending} onSend={(t) => dispatch({ type: "send", text: t })} />
        </div>
      </div>
      {s.toast && <Toast className="left-6 bottom-24">{s.toast}</Toast>}
    </Win>
  )
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

function PartView({ part, s }: { part: Part; s: State }) {
  if (part.kind === "text") return <p className={cn("mt-3 first:mt-0", part.muted && "text-neutral-500")}>{part.text}</p>
  if (part.kind === "thread") return <ThreadTool />
  if (part.kind === "drive") {
    return (
      <Tool name="save" app="google drive" meta="Promo video plan · Whiskr">
        <p className="text-neutral-600">Shared with Whiskr · 4 people</p>
      </Tool>
    )
  }
  const rows = part.ids.map((id) => s.caught.find((c) => c.id === id)).filter((c) => !!c)
  return (
    <Tool name="record_decision" meta={`Promo video plan · ${rows.length}`}>
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

// What Claude read from the Marketing thread, folded to a line until opened.
function ThreadTool() {
  const [open, setOpen] = useState(false)
  return (
    <Tool name="read_thread" meta={`Marketing · ${THREAD_DECISIONS.length} decisions · ${ATTACHMENTS.length} attachments`} onToggle={() => setOpen((v) => !v)} open={open}>
      {open && (
        <div className="flex flex-col gap-1.5">
          <p className="text-neutral-600">{THREAD_INTENT}</p>
          <ul className="flex flex-col gap-1">
            {THREAD_DECISIONS.map((d) => (
              <li key={d.title} className="flex items-center gap-2">
                <MarkIcon mark="filled" className="size-3.5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{d.title}</span>
                <span className="flex shrink-0 items-center gap-1.5 text-neutral-400"><PersonAvatar id={d.who} className="size-4" />{d.when}</span>
              </li>
            ))}
          </ul>
          <p className="text-neutral-500">Attachments: {ATTACHMENTS.join(", ")}</p>
        </div>
      )}
    </Tool>
  )
}

// An MCP tool call, the way a chat app shows one.
function Tool({ name, app = "whyspace", meta, open, onToggle, children }: { name: string; app?: string; meta?: string; open?: boolean; onToggle?: () => void; children: ReactNode }) {
  const head = (
    <>
      <Sparkles className="size-3" />
      <span>{app} · {name}</span>
      {meta && <span className="ml-auto">{meta}</span>}
      {onToggle && <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />}
    </>
  )
  return (
    <div className="mt-3 rounded-lg border border-black/10 bg-white px-3 py-2 text-[12px] leading-5 first:mt-0">
      {onToggle ? (
        <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-center gap-2 text-left text-[11px] text-neutral-500">{head}</button>
      ) : (
        <div className="flex items-center gap-2 text-[11px] text-neutral-500">{head}</div>
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
