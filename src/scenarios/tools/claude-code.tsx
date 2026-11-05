import { Fragment, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Composer } from "./chat"
import { DONE_TOAST, FOLLOW, FOLLOW_LINKS, LATER_REPLY, RECORD_AT, RUN, TASK } from "./claude-code-script"
import type { ToolEvent } from "./events"
import { markSent } from "./sent"
import { useStickToEnd } from "./use-stick"

// Claude Code in the terminal on the scenario desktop (scenario 4): the tester pastes the update
// task's prompt and the run plays out line by line. Only the inside of the window; the desktop
// draws the frame. It writes to Whyspace through onEvent, the way a tool connected over MCP would.

export function ClaudeCodeApp({ onEvent, person = "Kelly", repo = "whiskr-app" }: { onEvent: (e: ToolEvent) => void; person?: string; repo?: string }) {
  const [xs, setXs] = useState<string[]>([])
  const [shown, setShown] = useState(0)
  const [pending, setPending] = useState(false)
  const emit = useRef(onEvent)
  useEffect(() => { emit.current = onEvent })
  const scrollRef = useStickToEnd([xs.length, shown, pending])

  const send = (text: string) => {
    if (pending) return
    markSent("claude-code")
    setXs((all) => [...all, text])
    setShown(0)
    setPending(true)
  }

  // The first prompt runs the update one line at a time; a later one gets a short answer.
  useEffect(() => {
    if (!pending) return
    const first = xs.length === 1
    const t = setTimeout(() => {
      if (!first) { setPending(false); return }
      const next = shown + 1
      if (next === RECORD_AT) emit.current({ type: "record", decisions: [FOLLOW], links: FOLLOW_LINKS })
      if (next >= RUN.length) {
        emit.current({ type: "done", task: TASK })
        emit.current({ type: "toast", text: DONE_TOAST })
        setPending(false)
      }
      setShown(next)
    }, shown === 0 ? 900 : 550)
    return () => clearTimeout(t)
  }, [pending, shown, xs.length])

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#1b1b1b] font-mono text-neutral-200">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex w-full flex-col gap-3 px-5 py-4 text-[12.5px] leading-6">
          <div className="rounded-md border border-neutral-700 px-4 py-3 text-neutral-400">
            <p><span className="text-[#d97757]">✻</span> <span className="text-neutral-100">Claude Code</span> · {repo}</p>
            <p>MCP: whyspace connected · 3 tools</p>
            <p>Tip: paste a task’s prompt from Whyspace to start with its context.</p>
          </div>
          {xs.map((me, i) => {
            const last = i === xs.length - 1
            const lines = i === 0 ? RUN.slice(0, last ? shown : RUN.length) : []
            return (
              <Fragment key={i}>
                <p className="whitespace-pre-wrap text-neutral-100"><span className="text-neutral-500">{">"} </span>{me}</p>
                {i === 0 ? (
                  <ul className="flex flex-col gap-1.5">
                    {lines.map((l, j) => (
                      <li key={j} className="animate-in duration-200 fade-in-0">
                        <p className={cn(l.kind === "done" ? "text-neutral-100" : "text-neutral-300")}>
                          <span className={cn("mr-2", l.kind === "done" ? "text-emerald-400" : l.kind === "tool" ? "text-[#d97757]" : "text-neutral-500")}>{l.kind === "done" ? "✓" : "⏺"}</span>
                          {l.text}
                        </p>
                        {l.sub && <p className="pl-6 text-neutral-500"><span className="mr-2">⎿</span>{l.kind === "note" ? <span className="text-neutral-300 underline underline-offset-2">{l.sub}</span> : l.sub}</p>}
                      </li>
                    ))}
                    {last && pending && <li className="text-neutral-500"><span className="mr-2 inline-block animate-pulse text-[#d97757]">✻</span>Working…</li>}
                  </ul>
                ) : last && pending ? (
                  <p className="text-neutral-500"><span className="mr-2 inline-block animate-pulse text-[#d97757]">✻</span>Working…</p>
                ) : (
                  <p className="text-neutral-300"><span className="mr-2 text-emerald-400">✓</span>{LATER_REPLY}</p>
                )}
              </Fragment>
            )
          })}
        </div>
      </div>
      <Composer dark mono disabled={pending} onSend={send} placeholder="Paste a prompt, or type what to change…" footer={`${person}’s Claude Code · connected to Whyspace`} label="Message Claude Code" />
    </div>
  )
}
