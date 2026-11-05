import { Fragment } from "react"
import { Win } from "@/design-b/desk/win"
import { cn } from "@/lib/utils"
import { TesterCard } from "../kit/app"
import { Composer, DeskShell, WIN } from "../kit/desk"
import { useStickToEnd } from "../kit/hooks"
import { Pill } from "../kit/pill"
import { DAY, LABEL, LATER_REPLY, LINES, RUN, timeAt, type Action, type State } from "./model"

// Kelly's desk: Claude Code in the terminal, connected to Whyspace over MCP, and the pill. The
// tester pastes the task's prompt; the run plays out line by line.

export function DemoDesk4({ s, dispatch }: { s: State; dispatch: (a: Action) => void }) {
  const exit = () => dispatch({ type: "surface", to: "app" })
  return (
    <DeskShell app="Terminal" person="Kelly · Chief product officer" day={DAY} time={timeAt(Math.max(0, s.exchanges.length - 1))} onExit={exit}>
      <CodeWin s={s} dispatch={dispatch} />
      <Pill project="whiskr" part="App" caught={s.caught} open={s.pill.open} view={s.pill.view} checkIds={[]} checkClosed
        onOpen={(open, view) => dispatch({ type: "pill", open, view })} onConfirm={(id, why) => dispatch({ type: "confirm", id, why })} onDone={() => dispatch({ type: "pill", open: false })} onOpenApp={exit} />
      <TesterCard label={LABEL} lines={LINES} n={s.exchanges.length} />
    </DeskShell>
  )
}

function CodeWin({ s, dispatch }: { s: State; dispatch: (a: Action) => void }) {
  const scrollRef = useStickToEnd([s.exchanges.length, s.shown, s.pending])
  return (
    <Win title="kelly — whiskr-app — claude" dark className={cn(WIN, "bg-[#1b1b1b] font-mono")}>
      <div className="flex min-w-0 flex-1 flex-col">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex w-full flex-col gap-3 px-6 py-5 text-[12.5px] leading-6 text-neutral-200">
            <div className="rounded-md border border-neutral-700 px-4 py-3 text-neutral-400">
              <p><span className="text-[#d97757]">✻</span> <span className="text-neutral-100">Claude Code</span> · whiskr-app</p>
              <p>MCP: whyspace connected · 3 tools</p>
              <p>Tip: paste a task’s prompt from Whyspace to start with its context.</p>
            </div>
            {s.exchanges.map((x, i) => {
              const last = i === s.exchanges.length - 1
              const lines = i === 0 ? RUN.slice(0, last ? s.shown : RUN.length) : []
              return (
                <Fragment key={i}>
                  <p className="whitespace-pre-wrap text-neutral-100"><span className="text-neutral-500">{">"} </span>{x.me}</p>
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
                      {last && s.pending && <li className="text-neutral-500"><span className="mr-2 inline-block animate-pulse text-[#d97757]">✻</span>Working…</li>}
                    </ul>
                  ) : (
                    last && s.pending ? <p className="text-neutral-500"><span className="mr-2 inline-block animate-pulse text-[#d97757]">✻</span>Working…</p> : <p className="text-neutral-300"><span className="mr-2 text-emerald-400">✓</span>{LATER_REPLY}</p>
                  )}
                </Fragment>
              )
            })}
          </div>
        </div>
        <Composer dark disabled={s.pending} onSend={(t) => dispatch({ type: "send", text: t })} placeholder="Paste a prompt, or type what to change…" footer="Kelly’s Claude Code · connected to Whyspace" label="Message Claude Code" />
      </div>
      {s.toast && <div className="absolute right-6 bottom-24 z-10 rounded-md bg-white px-3 py-2 text-[12px] text-neutral-900 shadow-lg">{s.toast}</div>}
    </Win>
  )
}
