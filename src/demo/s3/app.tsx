import { useEffect, useRef, useState } from "react"
import { ArrowUp, Blend, Maximize2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { PersonAvatar } from "@/components/app/person"
import { MarkIcon } from "@/components/app/status-badge"
import { cn } from "@/lib/utils"
import { ComingUp, HandledList, Lane, NeedsRow, Page, Rail, Recap, TesterCard, Where, type HandledLine, type Upcoming } from "../kit/app"
import { Chips } from "../kit/pill"
import { CHRISTINE, KELLY, LABELS, LINES, PROJECTS, TODAY_LABEL, VIEWER, replyParts, stepOf, waiting, type Action, type State } from "./model"

// Scenario 3 is the app alone: Keller's Thursday Today with two rows from his Duet, the Duet page
// with its switch, and the Duet in the corner. Same look as the real app; its own data.

const UPCOMING: Upcoming = [
  ["Thu, Oct 29", [["11:00", "Launch call", "whiskr"], ["14:00", "App store screenshots", "whiskr"]]],
  ["Fri, Oct 30", [["10:00", "Poster and video review", "whiskr"], ["13:00", "Final crit", "studio"]]],
]

export function DemoApp3({ s, dispatch }: { s: State; dispatch: (a: Action) => void }) {
  const step = stepOf(s)
  const nav = (key: string) => {
    if (key === "today") dispatch({ type: "page", to: "today" })
    if (key === "duet") dispatch({ type: "page", to: "duet" })
  }
  return (
    <div className="flex h-svh w-full overflow-hidden bg-background text-foreground">
      <Rail viewer={VIEWER} projects={PROJECTS} active={s.page} badge={waiting(s)} onNav={nav} />
      {s.page === "today" ? (
        <Page title="Today" label={TODAY_LABEL} aside={<ComingUp days={UPCOMING} />}>
          <Lane title="Needs you" count={waiting(s)}>
            {waiting(s) === 0 ? <p className="py-4 text-sm text-muted-foreground">Nothing waits on you.</p> : <ul className="flex flex-col gap-2"><AskedRows s={s} dispatch={dispatch} /></ul>}
          </Lane>
          <Lane title="Across your projects">
            <ul className="flex flex-col gap-1">
              <Recap project="whiskr" name="Whiskr" summary="The video is in Runway, following the blue brand. Your posters are still red." />
              <Recap project="studio" name="AI Studio · Recall" summary="Jordan linked the first question evaluation." />
              <Recap project="holiday" name="Holiday campaign" summary="Nothing new this week." />
            </ul>
          </Lane>
          <Lane title="Handled"><HandledList lines={handled(s)} /></Lane>
        </Page>
      ) : (
        <Page title="Duet" aside={<DuetAside s={s} dispatch={dispatch} />}>
          <div className="flex min-h-[60svh] flex-col rounded-xl border bg-card">
            <Conversation s={s} dispatch={dispatch} />
          </div>
        </Page>
      )}

      {s.page === "today" && (
        s.panelOpen ? (
          <section aria-label="Duet" className="fixed right-5 bottom-5 z-30 flex h-[540px] w-[380px] flex-col overflow-hidden rounded-2xl border bg-background shadow-xl animate-in duration-200 fade-in-0">
            <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-2 pl-4">
              <Blend className="size-4" />
              <span className="flex-1 text-sm font-medium">Duet</span>
              <Button size="icon-sm" variant="ghost" className="size-7" aria-label="Open the Duet page" onClick={() => dispatch({ type: "page", to: "duet" })}><Maximize2 className="size-3.5" /></Button>
              <Button size="icon-sm" variant="ghost" className="size-7" aria-label="Close" onClick={() => dispatch({ type: "panel", open: false })}><X className="size-3.5" /></Button>
            </header>
            <Conversation s={s} dispatch={dispatch} compact />
          </section>
        ) : (
          <button type="button" onClick={() => dispatch({ type: "panel", open: true })} className="fixed right-5 bottom-5 z-30 flex h-10 items-center gap-2 rounded-full border bg-background px-4 text-sm shadow-lg hover:bg-muted">
            <Blend className="size-4" />Ask your Duet
          </button>
        )
      )}

      {s.toast && <div role="status" className="fixed right-5 bottom-20 z-40 rounded-md bg-foreground px-3 py-2 text-xs text-background shadow-lg animate-in duration-200 fade-in-0">{s.toast}</div>}

      <Dialog open={s.answerOpen} onOpenChange={(o) => dispatch({ type: "answer", open: o })}>
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><PersonAvatar id={CHRISTINE.who} className="size-6" />Christine asked {CHRISTINE.asked}</DialogTitle>
            <DialogDescription>No decision of yours covers it. Your Duet passes on what you say and keeps it as your decision.</DialogDescription>
          </DialogHeader>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = String(new FormData(e.currentTarget).get("v") ?? "").trim(); if (v) dispatch({ type: "tellChristine", text: v }) }}>
            <Input name="v" placeholder="Tell Christine…" aria-label="Tell Christine" />
            <Button type="submit">Send</Button>
          </form>
        </DialogContent>
      </Dialog>

      <TesterCard label={LABELS[step] ?? ""} lines={LINES} n={step} />
    </div>
  )
}

// The two questions waiting on you, as Today and the Duet page show them.
function AskedRows({ s, dispatch, compact }: { s: State; dispatch: (a: Action) => void; compact?: boolean }) {
  return (
    <>
      {s.christine === null && (
        <NeedsRow face={<PersonAvatar id={CHRISTINE.who} className={compact ? "size-6" : "size-8"} />} lead="Asked your Duet" title={`Christine asked ${CHRISTINE.asked}`}
          sub={<><span className="truncate">No decision of yours covers it</span>{!compact && <Where thread="Marketing" />}</>} onOpen={() => dispatch({ type: "answer", open: true })}
          actions={<Button size="sm" variant="outline" onClick={() => dispatch({ type: "answer", open: true })}>Answer</Button>} />
      )}
      {s.kelly === null && (
        <NeedsRow face={<PersonAvatar id={KELLY.who} className={compact ? "size-6" : "size-8"} />} lead="Confirm" mark={<MarkIcon mark="empty" className="size-3.5 shrink-0" />} title={`Kelly asked ${KELLY.asked}`}
          sub={<><span className="truncate">Drafted from your guess: “{KELLY.draft}”</span>{!compact && <Where thread="Marketing" />}</>}
          actions={<Chips c={{ id: "purr", title: KELLY.guess, kind: "guess", hints: [KELLY.hint], when: "" }} onConfirm={(_, why) => dispatch({ type: "confirmKelly", why })} />} />
      )}
    </>
  )
}

function handled(s: State): HandledLine[] {
  const now: HandledLine[] = []
  if (s.kelly !== null) {
    now.push({ id: "k2", text: "Your Duet told Kelly the video uses the dot’s purr", when: "Just now", who: "MC", agent: true })
    now.push({ id: "k1", text: `You confirmed “${KELLY.guess}”`, when: "Just now", who: "MC" })
  }
  if (s.christine !== null) {
    now.push({ id: "c2", text: `Your Duet told Christine: “${s.christine}”`, when: "Just now", who: "MC", agent: true })
    now.push({ id: "c1", text: `You decided “${CHRISTINE.decision}”`, when: "Just now", who: "MC" })
  }
  return [
    ...now,
    { id: "y1", text: "Your Duet told Christine the video is blue, following Trevor’s decision", when: "Yesterday 14:20", who: "MC", agent: true },
    { id: "y2", text: "You finished “Make the promo video”", when: "Yesterday 11:05", who: "MC" },
    { id: "y3", text: "Your Duet told Trevor the promo video is 15 seconds", when: "Tuesday 9:40", who: "MC", agent: true },
    { id: "y4", text: "You took Trevor’s decision: change the brand color from red to blue", when: "Tuesday 9:22", who: "MC" },
  ]
}

// The Duet page's column: the switch, what teammates asked, what the Duet handled.
function DuetAside({ s, dispatch }: { s: State; dispatch: (a: Action) => void }) {
  const [on, setOn] = useState(true)
  return (
    <section className="flex shrink-0 flex-col gap-8 border-t p-6 sm:p-8 xl:w-96 xl:overflow-y-auto xl:border-t-0 xl:border-l xl:px-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm">Answers teammates from my decisions</span>
        <Switch checked={on} onCheckedChange={setOn} aria-label="Answers teammates from my decisions" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex h-8 items-center gap-2"><h2 className="type-section">Asked</h2>{waiting(s) > 0 && <span className="text-sm text-muted-foreground tabular-nums">{waiting(s)}</span>}</div>
        {waiting(s) === 0 ? <p className="text-sm text-muted-foreground">Nothing waits on you.</p> : <ul className="flex flex-col gap-2"><AskedRows s={s} dispatch={dispatch} compact /></ul>}
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex h-8 items-center"><h2 className="type-section">Handled</h2></div>
        <HandledList lines={handled(s).filter((l) => l.agent)} />
      </div>
    </section>
  )
}

// Asking your own Duet about a project, the way teammates ask it about you.
function Conversation({ s, dispatch, compact }: { s: State; dispatch: (a: Action) => void; compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { const el = ref.current; if (el) el.scrollTop = el.scrollHeight }, [s.msgs.length, s.pending])
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={ref} className="min-h-0 flex-1 overflow-y-auto">
        <div className={cn("flex flex-col gap-4 p-4", !compact && "p-6")}>
          {s.msgs.length === 0 && !s.pending && (
            <div className={cn("flex flex-col gap-3", !compact && "py-6")}>
              <p className="text-sm text-muted-foreground">Ask about any project. Teammates can ask me about you.</p>
              <div className="flex flex-wrap gap-1.5">
                {["What changed in the app this week?", "What waits on me?"].map((q) => (
                  <button key={q} type="button" onClick={() => dispatch({ type: "ask", text: q })} className="rounded-full border px-2.5 py-1 text-xs hover:border-foreground hover:bg-muted">{q}</button>
                ))}
              </div>
            </div>
          )}
          {s.msgs.map((m, i) => m.who === "me" ? (
            <div key={i} className="max-w-[85%] self-end rounded-2xl bg-muted px-3.5 py-2 text-sm whitespace-pre-wrap">{m.text}</div>
          ) : (
            <DuetReply key={i} turn={m.turn} />
          ))}
          {s.pending && <div className="flex items-start gap-2"><PersonAvatar id="MC" agent className="size-6" /><p className="text-sm text-muted-foreground" aria-label="Answering">···</p></div>}
        </div>
      </div>
      <AppComposer disabled={s.pending} onSend={(t) => dispatch({ type: "ask", text: t })} />
    </div>
  )
}

function DuetReply({ turn }: { turn: number }) {
  return (
    <div className="flex items-start gap-2 animate-in duration-200 fade-in-0">
      <PersonAvatar id="MC" agent className="mt-0.5 size-6" />
      <div className="min-w-0 flex-1 text-sm leading-6">
        {replyParts(turn).map((p, j) => p.kind === "text" ? (
          <p key={j} className={cn("mt-2 first:mt-0", p.muted && "text-muted-foreground")}>{p.text}</p>
        ) : (
          <ul key={j} className="mt-2 flex flex-col gap-2 rounded-lg border bg-background p-3">
            {p.rows.map((r) => (
              <li key={r.title} className="flex items-start gap-2">
                <MarkIcon mark="filled" className="mt-[5px] size-3.5 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-snug font-medium">{r.title}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"><PersonAvatar id={r.who} className="size-3.5" />{r.sub}</span>
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}

function AppComposer({ disabled, onSend }: { disabled: boolean; onSend: (t: string) => void }) {
  const [text, setText] = useState("")
  const send = () => { const t = text.trim(); if (!t || disabled) return; onSend(t); setText("") }
  return (
    <form className="flex shrink-0 items-end gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); send() }}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Ask your Duet…" aria-label="Ask your Duet" rows={1} className="max-h-32 min-h-9 flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      <Button type="submit" size="icon" disabled={disabled || !text.trim()} aria-label="Send"><ArrowUp /></Button>
    </form>
  )
}

