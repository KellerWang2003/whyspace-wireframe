import { useEffect, useState, type CSSProperties, type ReactNode } from "react"
import { ArrowRight, ArrowUp, Check, ChevronDown, ChevronRight, CircleCheck, PanelRight, X } from "lucide-react"
import { AppShell } from "@/components/app/app-shell"
import { PersonAvatar } from "@/components/app/person"
import { StatusIcon } from "@/components/app/status-badge"
import { PIGMENT, blobPath, handPath } from "@/components/brand/hand"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ME, PEOPLE, decisionById, projectName } from "@/data"
import { useHifi } from "@/lib/hifi"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useStatusOf } from "@/lib/work"
import { DayDivider } from "@/app/chats"
import { first } from "@/app/duet-state"
import { SURE_LABEL, type Sure } from "@/app/duet"
import { ThreadChip } from "@/app/hifi-kit"
import { pigmentOf } from "@/app/hifi-model"
import { SureMark } from "@/app/sure-mark"
import { threadOf } from "@/app/threads"

// Playground (#/playground/fold/<n>): ways to fold a Duet's reply under the question it answered, in a
// chat. Keller's idea (Nov 11): like Slack, the answered question gets a check, a short line says your
// Duet responded and what it said, and opening it shows why. Each version changes what the fold shows
// and where the reasoning opens. Self-contained mock of the Trevor DM: the real Chats tab is untouched.

type Answer = {
  short: string
  full: string
  decision: string
  sure: Sure
  // Why it was that sure, in a sentence.
  sureWhy: string
  // Why the Duet answered and not its person.
  away: string
  at: string
}
type Ex = { id: string; asker: string; owner: string; question: string; time: string; answer?: Answer }

const TREVOR = "TR"
const EXCHANGES: Ex[] = [
  {
    id: "e1", asker: ME.id, owner: TREVOR, question: "Why is the brand blue now?", time: "9:05",
    answer: { short: "Cats can’t see red, so the brand changed to blue.", full: "The brand blue. Research found that cats can’t see red, so I changed the brand from red to blue.", decision: "nored", sure: "sure", sureWhy: "Trevor’s decision says this outright.", away: "Trevor was away.", at: "9:05" },
  },
  {
    id: "e2", asker: TREVOR, owner: ME.id, question: "Does the promo video open on Luna’s clip?", time: "10:48",
    answer: { short: "Yes, it opens on a real cat clip.", full: "Yes. It opens on a real cat clip, because seeing a cat chase the screen explains the app in a second.", decision: "pounce", sure: "sure", sureWhy: "Your decision says this outright.", away: "You were away.", at: "10:48" },
  },
  { id: "e3", asker: TREVOR, owner: ME.id, question: "How long will the promo video be?", time: "11:05" },
  {
    id: "e4", asker: TREVOR, owner: ME.id, question: "Should the app open on a cat clip too?", time: "11:30",
    answer: { short: "Probably, like the promo video.", full: "Probably. The promo video opens on a real cat clip, so the app could too.", decision: "pounce", sure: "unsure", sureWhy: "Your decision covers the promo video, not the app.", away: "You were away.", at: "11:31" },
  },
]
const answered = EXCHANGES.filter((x) => x.answer)

const mine = (x: Ex) => x.owner === ME.id
const duetName = (owner: string, lower = false) => (owner === ME.id ? (lower ? "your Duet" : "Your Duet") : `${first(owner)}’s Duet`)
const nameOf = (id: string) => PEOPLE[id]?.name ?? id

// ——— Shared pieces, drawn like the real chat (app/chats.tsx) ———

function Msg({ who, duet, time, mark, children, className }: { who: string; duet?: boolean; time: string; mark?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative mt-2 flex gap-3 rounded-lg px-2 py-1", className)}>
      <div className="w-8 shrink-0"><PersonAvatar id={who} agent={duet} className="size-8" /></div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{duet ? duetName(who) : nameOf(who)}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{time}</span>
          {mark}
        </div>
        {children}
      </div>
    </div>
  )
}

const Text = ({ children }: { children: ReactNode }) => <p className="max-w-full text-sm leading-relaxed">{children}</p>
const Waiting = () => <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">Waiting for you</span>

// A question no decision answered yet: it waits for you, the same in every version.
function Unanswered({ x }: { x: Ex }) {
  return <Msg who={x.asker} time={x.time}><Text>{x.question}</Text><Waiting /></Msg>
}

// The answered question's check.
const Done = ({ className }: { className?: string }) => <CircleCheck aria-label="Answered" className={cn("size-3.5 shrink-0 self-center text-muted-foreground", className)} />

function DecisionLine({ id, className }: { id: string; className?: string }) {
  const statusOf = useStatusOf()
  const d = decisionById(id)
  if (!d) return null
  return (
    <span className={cn("flex min-w-0 items-start gap-2", className)}>
      <StatusIcon status={statusOf(d)} className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm">{d.title}</span>
        <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
          <span className="shrink-0">{d.by ?? first(d.owner)} · {projectName(d.project).replace(/\s*\(.*\)$/, "")} ·</span>
          <ThreadChip projectId={d.project} part={d.part} className="min-w-0 [&_svg]:size-3.5" />
        </span>
      </span>
    </span>
  )
}

// Why the Duet said what it said: its words, the decision it spoke from and that decision's why, how
// sure it was, and why it spoke at all. `from`: show the decision (left out where the fold already does,
// keeping only its why).
function Reasoning({ x, from = true, className }: { x: Ex; from?: boolean; className?: string }) {
  const a = x.answer!
  const d = decisionById(a.decision)
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="text-sm leading-relaxed">{a.full}</p>
      <dl className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-2.5 text-sm">
        {from ? (
          <>
            <dt className="pt-0.5 type-label text-muted-foreground">From</dt>
            <dd className="flex min-w-0 flex-col gap-1">
              <DecisionLine id={a.decision} />
              {d?.why && <p className="pl-5.5 text-xs leading-relaxed text-muted-foreground">{d.why}</p>}
            </dd>
          </>
        ) : d?.why && (
          <>
            <dt className="pt-0.5 type-label text-muted-foreground">Decision’s why</dt>
            <dd>{d.why}</dd>
          </>
        )}
        <dt className="pt-0.5 type-label text-muted-foreground">How sure</dt>
        <dd className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-2"><SureMark sure={a.sure} />{SURE_LABEL[a.sure]}</span>
          <span className="text-xs text-muted-foreground">{a.sureWhy}</span>
        </dd>
        <dt className="pt-0.5 type-label text-muted-foreground">Why it answered</dt>
        <dd>{a.away}</dd>
      </dl>
      <div className="flex gap-2">
        {mine(x) ? <Button size="xs" variant="outline" className="bg-background">Change answer</Button> : <Button size="xs" variant="outline" className="bg-background">Ask {first(x.owner)}</Button>}
      </div>
    </div>
  )
}

// The chat around each version: the Trevor DM's header, Today, the messages, your Duet's offer for the
// question waiting on you, and the composer. `side`: a panel beside the chat.
function ChatFrame({ children, side }: { children: ReactNode; side?: ReactNode }) {
  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-xl border bg-background">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
          <PersonAvatar id={TREVOR} className="size-8" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm leading-tight font-medium">{nameOf(TREVOR)}</span>
            <span className="block truncate text-xs text-muted-foreground">Online</span>
          </span>
          <Button variant="outline" size="sm" className="shrink-0"><PanelRight />Context</Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex w-full flex-col px-3 py-6 sm:px-4">
            <DayDivider day="today" />
            {children}
            <Offer />
          </div>
        </div>
        <div className="w-full px-3 pb-4 sm:px-4">
          <div className="flex items-end gap-2 rounded-2xl border border-border/80 bg-background p-2">
            <span className="flex-1 px-1.5 py-2 text-sm text-muted-foreground">Message {first(TREVOR)}</span>
            <Button size="icon-sm" className="shrink-0 rounded-lg" disabled aria-label="Send"><ArrowUp /></Button>
          </div>
        </div>
      </section>
      {side}
    </div>
  )
}

function Offer() {
  const statusOf = useStatusOf()
  const d = decisionById("short")
  return (
    <div className="mt-2 flex gap-3 rounded-lg bg-muted/40 px-2 py-2">
      <PersonAvatar id={ME.id} agent className="size-8" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <div className="flex items-baseline gap-2"><span className="text-sm font-medium">Your Duet</span><span className="text-xs text-muted-foreground">Only you can see this</span></div>
        <p className="text-sm">Your guess answers {first(TREVOR)} once you confirm it.</p>
        {d && (
          <span className="flex w-full max-w-md items-start gap-2 rounded-lg border bg-background px-3 py-2">
            <StatusIcon status={statusOf(d)} className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1"><span className="block text-sm">{d.title}</span><span className="block truncate text-xs text-muted-foreground">Keller · Whiskr · Marketing</span></span>
          </span>
        )}
        <Button size="xs">Confirm and send</Button>
      </div>
    </div>
  )
}

// Which answers are open, by exchange id.
function useOpen(initial?: string) {
  const [open, setOpen] = useState<string | null>(initial ?? null)
  return [open, (id: string) => setOpen((o) => (o === id ? null : id))] as const
}

// ——— 1 · Thread reply (Keller's idea) ———
// The question gets a check; under it one line, like Slack's replies: the Duet's face, "Responded by
// your Duet" and the gist. Opening it unfolds the reply in place, with why.
function V1() {
  const [open, toggle] = useOpen("e4")
  return (
    <ChatFrame>
      {EXCHANGES.map((x) => {
        if (!x.answer) return <Unanswered key={x.id} x={x} />
        const on = open === x.id
        return (
          <Msg key={x.id} who={x.asker} time={x.time} mark={<Done />}>
            <Text>{x.question}</Text>
            <button type="button" onClick={() => toggle(x.id)} aria-expanded={on} className="-ml-1 flex max-w-full items-center gap-2 rounded-md py-0.5 pr-2 pl-1 text-left text-xs hover:bg-muted/60">
              <PersonAvatar id={x.owner} agent className="size-5" />
              <span className="shrink-0 font-medium">Responded by {duetName(x.owner, true)}</span>
              <span className="min-w-0 truncate text-muted-foreground">{x.answer.short}</span>
              {on ? <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />}
            </button>
            {on && (
              <div className="mt-1 ml-2 flex w-full max-w-xl flex-col gap-3 border-l-2 pl-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{duetName(x.owner)}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{x.answer.at}</span>
                </div>
                <Reasoning x={x} />
              </div>
            )}
          </Msg>
        )
      })}
    </ChatFrame>
  )
}

// ——— 2 · Gist line, why beside ———
// No face, no name: a check and the gist under the question, with how sure. Why opens in the panel
// beside the chat, where the decisions already live.
function V2() {
  const [open, toggle] = useOpen("e4")
  const x = EXCHANGES.find((e) => e.id === open)
  const side = x?.answer && (
    <aside aria-label="Why" className="absolute inset-0 z-10 flex min-h-0 flex-col bg-background lg:static lg:w-[360px] lg:shrink-0 lg:border-l">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b pr-2 pl-4">
        <PersonAvatar id={x.owner} agent className="size-6" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{duetName(x.owner)}</span>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label="Close" onClick={() => toggle(x.id)}><X /></Button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="border-l-2 pl-2 text-xs text-muted-foreground"><span className="font-medium">{first(x.asker)}</span> {x.question}</div>
        <Reasoning x={x} />
      </div>
    </aside>
  )
  return (
    <ChatFrame side={side}>
      {EXCHANGES.map((x) => {
        if (!x.answer) return <Unanswered key={x.id} x={x} />
        return (
          <Msg key={x.id} who={x.asker} time={x.time}>
            <Text>{x.question}</Text>
            <button type="button" onClick={() => toggle(x.id)} aria-pressed={open === x.id} className={cn("-ml-1 flex max-w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-left text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground", open === x.id && "bg-muted text-foreground")}>
              <Check className="size-3.5 shrink-0" />
              <span className="min-w-0 truncate"><span className="font-medium text-foreground">{duetName(x.owner)}:</span> {x.answer.short}</span>
              <SureMark sure={x.answer.sure} className="ml-1" />
            </button>
          </Msg>
        )
      })}
    </ChatFrame>
  )
}

// ——— 3 · Answered tag ———
// The least: a small tag, the Duet's face, "Answered" and how sure. What it said and why open in a card.
function V3() {
  return (
    <ChatFrame>
      {EXCHANGES.map((x) => {
        if (!x.answer) return <Unanswered key={x.id} x={x} />
        return (
          <Msg key={x.id} who={x.asker} time={x.time}>
            <Text>{x.question}</Text>
            <Popover defaultOpen={x.id === "e4"}>
              <PopoverTrigger asChild>
                <button type="button" className="flex items-center gap-1.5 rounded-full border py-0.5 pr-2 pl-0.5 text-xs text-muted-foreground hover:bg-muted/60 data-[state=open]:bg-muted data-[state=open]:text-foreground">
                  <PersonAvatar id={x.owner} agent className="size-4.5" />
                  Answered
                  <SureMark sure={x.answer.sure} className="ml-0.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-96 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <PersonAvatar id={x.owner} agent className="size-6" />
                  <span className="text-sm font-medium">{duetName(x.owner)}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{x.answer.at}</span>
                </div>
                <Reasoning x={x} />
              </PopoverContent>
            </Popover>
          </Msg>
        )
      })}
    </ChatFrame>
  )
}

// ——— 4 · The decision is the answer ———
// Under the question, the decision the Duet answered from, as the card it already is in chats, with a
// check and how sure. Opening the card shows what the Duet said and why.
function V4() {
  const [open, toggle] = useOpen("e4")
  return (
    <ChatFrame>
      {EXCHANGES.map((x) => {
        if (!x.answer) return <Unanswered key={x.id} x={x} />
        const on = open === x.id
        return (
          <Msg key={x.id} who={x.asker} time={x.time}>
            <Text>{x.question}</Text>
            <div className={cn("flex w-full max-w-md flex-col rounded-lg border bg-background", on && "max-w-xl")}>
              <button type="button" onClick={() => toggle(x.id)} aria-expanded={on} className="flex w-full flex-col gap-1.5 rounded-lg px-3 py-2 text-left hover:bg-muted/50">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="size-3.5" />
                  <span className="flex-1">Answered by {duetName(x.owner, true)}</span>
                  <SureMark sure={x.answer.sure} />
                </span>
                <DecisionLine id={x.answer.decision} />
              </button>
              {on && (
                <div className="flex flex-col gap-3 border-t px-3 py-3">
                  <Reasoning x={x} from={false} />
                </div>
              )}
            </div>
          </Msg>
        )
      })}
    </ChatFrame>
  )
}

// ——— 5 · Folded together ———
// Each answered question keeps only a check. What the Duets said while you were away folds into one
// row at the end; open it for each answer, and each answer for why.
function V5() {
  const [all, setAll] = useState(true)
  const [open, toggle] = useOpen("e4")
  const owners = [...new Set(answered.map((x) => x.owner))]
  return (
    <ChatFrame>
      {EXCHANGES.map((x) => x.answer
        ? <Msg key={x.id} who={x.asker} time={x.time}><p className="flex max-w-full items-center gap-1.5 text-sm leading-relaxed">{x.question}<Done /></p></Msg>
        : <Unanswered key={x.id} x={x} />)}
      <div className="mt-3 flex flex-col rounded-lg border">
        <button type="button" onClick={() => setAll(!all)} aria-expanded={all} className="flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/50">
          <span className="flex -space-x-1.5">{owners.map((o) => <PersonAvatar key={o} id={o} agent className="size-6 rounded-full ring-2 ring-background" />)}</span>
          <span className="flex-1 text-sm"><span className="font-medium">Duets answered {answered.length} questions</span></span>
          {all ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        </button>
        {all && (
          <ul className="flex flex-col border-t py-1">
            {answered.map((x) => {
              const on = open === x.id
              return (
                <li key={x.id} className="px-1">
                  <button type="button" onClick={() => toggle(x.id)} aria-expanded={on} className={cn("grid w-full grid-cols-[1.5rem_minmax(0,1fr)_auto] items-start gap-x-2 rounded-md px-2 py-1.5 text-left hover:bg-muted/50", on && "bg-muted/50")}>
                    <PersonAvatar id={x.owner} agent className="mt-0.5 size-5" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs text-muted-foreground">{first(x.asker)}: {x.question}</span>
                      <span className="block text-sm">{x.answer!.short}</span>
                    </span>
                    <SureMark sure={x.answer!.sure} className="mt-1.5" />
                  </button>
                  {on && <Reasoning x={x} className="px-2 pt-2 pb-3 pl-10" />}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </ChatFrame>
  )
}

// ——— 6 · Just a check ———
// Only a check beside the question, with the Duet's face. Hover for the gist; click for the whole
// answer and why, in a window.
function V6() {
  const [open, setOpen] = useState<string | null>(null)
  const x = EXCHANGES.find((e) => e.id === open)
  return (
    <ChatFrame>
      {EXCHANGES.map((x) => {
        if (!x.answer) return <Unanswered key={x.id} x={x} />
        return (
          <Msg key={x.id} who={x.asker} time={x.time}>
            <p className="flex max-w-full flex-wrap items-center gap-x-2 text-sm leading-relaxed">
              {x.question}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => setOpen(x.id)} aria-label={`Answered by ${duetName(x.owner, true)}`} className="flex items-center gap-1 rounded-full py-0.5 pr-1 pl-0.5 text-muted-foreground hover:bg-muted">
                    <PersonAvatar id={x.owner} agent className="size-4.5" />
                    <Check className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-72">{duetName(x.owner)}: {x.answer.short}</TooltipContent>
              </Tooltip>
            </p>
          </Msg>
        )
      })}
      <Dialog open={!!x} onOpenChange={(o) => { if (!o) setOpen(null) }}>
        <DialogContent className="sm:max-w-lg">
          {x?.answer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><PersonAvatar id={x.owner} agent className="size-6" />{duetName(x.owner)}</DialogTitle>
              </DialogHeader>
              <div className="border-l-2 pl-2 text-xs text-muted-foreground"><span className="font-medium">{first(x.asker)}</span> {x.question}</div>
              <Reasoning x={x} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </ChatFrame>
  )
}

// ——— 7 · Paper note ———
// The reply folds into a small hand-cut note in its thread's color, tucked under the question, with the
// gist and how sure. Click and the note unfolds flat, with why.
const WASH: Record<string, string> = { [PIGMENT.leaf]: PIGMENT.leafWash, [PIGMENT.apricot]: PIGMENT.apricotWash, [PIGMENT.sky]: PIGMENT.skyWash, [PIGMENT.rose]: PIGMENT.roseWash }
const NOTE = handPath([[0, 2], [100, 0], [99, 40], [1, 39]], { seed: 9, radius: 5, wobble: 0.9 })
function V7() {
  const hifi = useHifi()
  const [open, toggle] = useOpen("e4")
  return (
    <ChatFrame>
      {EXCHANGES.map((x) => {
        if (!x.answer) return <Unanswered key={x.id} x={x} />
        const on = open === x.id
        const d = decisionById(x.answer.decision)!
        const wash = hifi ? WASH[pigmentOf(threadOf(d.project, d.part))] ?? PIGMENT.subtle : "var(--muted)"
        return (
          <Msg key={x.id} who={x.asker} time={x.time} mark={<Done />}>
            <Text>{x.question}</Text>
            <div className={cn("relative w-full max-w-md transition-transform duration-200", on ? "max-w-xl rotate-0" : "-rotate-1")} style={{ "--wash": wash } as CSSProperties}>
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden><path d={NOTE} fill="var(--wash)" /></svg>
              <button type="button" onClick={() => toggle(x.id)} aria-expanded={on} className="relative flex w-full items-center gap-2 px-3.5 py-2.5 text-left">
                <PersonAvatar id={x.owner} agent className="size-5" />
                <span className="min-w-0 flex-1 text-sm">{x.answer.short}</span>
                <SureMark sure={x.answer.sure} />
              </button>
              {on && <Reasoning x={x} className="relative px-3.5 pb-3.5" />}
            </div>
          </Msg>
        )
      })}
    </ChatFrame>
  )
}

// ——— 8 · Trail ———
// One line from question to answer: the Duet, the decision it used, what it said. Opening it lays the
// trail out step by step along a thread.
function V8() {
  const [open, toggle] = useOpen("e4")
  return (
    <ChatFrame>
      {EXCHANGES.map((x) => {
        if (!x.answer) return <Unanswered key={x.id} x={x} />
        const on = open === x.id
        const a = x.answer
        const d = decisionById(a.decision)!
        return (
          <Msg key={x.id} who={x.asker} time={x.time} mark={<Done />}>
            <Text>{x.question}</Text>
            <button type="button" onClick={() => toggle(x.id)} aria-expanded={on} className={cn("-ml-1 flex max-w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-left text-xs text-muted-foreground hover:bg-muted/60", on && "bg-muted/60")}>
              <PersonAvatar id={x.owner} agent className="size-4.5" />
              <span className="shrink-0 font-medium text-foreground">{duetName(x.owner)}</span>
              <ArrowRight className="size-3 shrink-0" />
              <span className="min-w-0 max-w-56 truncate">{d.title}</span>
              <ArrowRight className="size-3 shrink-0" />
              <span className="min-w-0 truncate text-foreground">{a.short}</span>
            </button>
            {on && (
              <ol className="mt-1 flex w-full max-w-xl flex-col">
                <Step label={`${first(x.asker)} asked`}>{x.question}</Step>
                <Step label={`Looked in ${x.owner === ME.id ? "your" : `${first(x.owner)}’s`} decisions`}>
                  <DecisionLine id={a.decision} />
                  {d.why && <p className="pl-5.5 text-xs leading-relaxed text-muted-foreground">{d.why}</p>}
                </Step>
                <Step label={SURE_LABEL[a.sure]} icon={<SureMark sure={a.sure} />}>{a.sureWhy}</Step>
                <Step label={`Answered · ${a.at}`} last>
                  {a.full}
                  <span className="block pt-1 text-xs text-muted-foreground">{a.away}</span>
                  <span className="flex gap-2 pt-2">{mine(x) ? <Button size="xs" variant="outline" className="bg-background">Change answer</Button> : <Button size="xs" variant="outline" className="bg-background">Ask {first(x.owner)}</Button>}</span>
                </Step>
              </ol>
            )}
          </Msg>
        )
      })}
    </ChatFrame>
  )
}

// ——— Between 1 and 7 (Keller, Nov 11: likes 7, but too much for a chat tool) ———
// v1's quiet line, with a little of the note's paper and thread color.

// The thread color of the decision an answer came from: its pigment and its wash. Wireframe: grays.
function useTint(x: Ex) {
  const hifi = useHifi()
  const d = decisionById(x.answer!.decision)!
  const pigment = pigmentOf(threadOf(d.project, d.part))
  return hifi ? { pigment, wash: WASH[pigment] ?? PIGMENT.subtle } : { pigment: "var(--border)", wash: "var(--muted)" }
}

// v1's line: face, "Responded by your Duet", the gist, a chevron.
function ReplyLine({ x, on, face }: { x: Ex; on: boolean; face?: ReactNode }) {
  return (
    <>
      {face ?? <PersonAvatar id={x.owner} agent className="size-5" />}
      <span className="shrink-0 font-medium">Responded by {duetName(x.owner, true)}</span>
      <span className="min-w-0 truncate text-muted-foreground">{x.answer!.short}</span>
      {on ? <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />}
    </>
  )
}

function Opened({ x, className, style }: { x: Ex; className?: string; style?: CSSProperties }) {
  return (
    <div className={cn("mt-1 ml-2 flex w-full max-w-xl flex-col gap-3 pl-4", className)} style={style}>
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium">{duetName(x.owner)}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{x.answer!.at}</span>
      </div>
      <Reasoning x={x} />
    </div>
  )
}

const SLIP = handPath([[0, 1], [100, 0], [99, 20], [1, 19]], { seed: 4, radius: 4, wobble: 0.5 })

// 9 · Wash line: v1's line sits on a flat slip of its thread's wash, fitted to the words, no tilt.
// Opened, the reply hangs under it on a line in the same color.
function V9() {
  const [open, toggle] = useOpen("e4")
  return (
    <ChatFrame>
      {EXCHANGES.map((x) => x.answer ? <V9Row key={x.id} x={x} on={open === x.id} onToggle={() => toggle(x.id)} /> : <Unanswered key={x.id} x={x} />)}
    </ChatFrame>
  )
}
function V9Row({ x, on, onToggle }: { x: Ex; on: boolean; onToggle: () => void }) {
  const { pigment, wash } = useTint(x)
  return (
    <Msg who={x.asker} time={x.time} mark={<Done />}>
      <Text>{x.question}</Text>
      <button type="button" onClick={onToggle} aria-expanded={on} className="relative -ml-1 flex max-w-full items-center gap-2 py-1 pr-2.5 pl-1.5 text-left text-xs">
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden><path d={SLIP} fill={wash} /></svg>
        <span className="relative flex min-w-0 items-center gap-2"><ReplyLine x={x} on={on} /></span>
      </button>
      {on && <Opened x={x} className="border-l-2" style={{ borderColor: pigment }} />}
    </Msg>
  )
}

// A loose hand-drawn strand, top to bottom.
const STRAND = "M2 0 C 3.2 18, 0.8 34, 2 50 S 3.2 82, 2 100"

// 10 · Painted edge: v1's line untouched, with a short painted strand in the thread's color beside it.
// Opened, the strand runs down the whole reply, like a thread.
function V10() {
  const [open, toggle] = useOpen("e4")
  return (
    <ChatFrame>
      {EXCHANGES.map((x) => x.answer ? <V10Row key={x.id} x={x} on={open === x.id} onToggle={() => toggle(x.id)} /> : <Unanswered key={x.id} x={x} />)}
    </ChatFrame>
  )
}
function V10Row({ x, on, onToggle }: { x: Ex; on: boolean; onToggle: () => void }) {
  const { pigment } = useTint(x)
  return (
    <Msg who={x.asker} time={x.time} mark={<Done />}>
      <Text>{x.question}</Text>
      <div className="relative w-full pl-3">
        <svg viewBox="0 0 4 100" preserveAspectRatio="none" className="absolute top-0.5 bottom-0.5 left-0 h-[calc(100%-4px)] w-1" aria-hidden>
          <path d={STRAND} fill="none" stroke={pigment} strokeWidth={2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <button type="button" onClick={onToggle} aria-expanded={on} className="-ml-1 flex max-w-full items-center gap-2 rounded-md py-0.5 pr-2 pl-1 text-left text-xs hover:bg-muted/60">
          <ReplyLine x={x} on={on} />
        </button>
        {on && <Opened x={x} className="ml-0 pl-1" />}
      </div>
    </Msg>
  )
}

// 11 · Paper when open: closed it's v1's line, only the Duet's face sits on a dab of the thread's wash.
// Opened, the reply lies on a flat note in that wash.
function V11() {
  const [open, toggle] = useOpen("e4")
  return (
    <ChatFrame>
      {EXCHANGES.map((x) => x.answer ? <V11Row key={x.id} x={x} on={open === x.id} onToggle={() => toggle(x.id)} /> : <Unanswered key={x.id} x={x} />)}
    </ChatFrame>
  )
}
const DAB = blobPath(32, 6)
function V11Row({ x, on, onToggle }: { x: Ex; on: boolean; onToggle: () => void }) {
  const { wash } = useTint(x)
  const face = (
    <span className="relative flex size-6 shrink-0 items-center justify-center">
      <svg viewBox="0 0 32 32" className="absolute -top-2 -left-1.5 size-10" aria-hidden><path d={DAB} fill={wash} /></svg>
      <PersonAvatar id={x.owner} agent className="relative size-5" />
    </span>
  )
  return (
    <Msg who={x.asker} time={x.time} mark={<Done />}>
      <Text>{x.question}</Text>
      <button type="button" onClick={onToggle} aria-expanded={on} className="-ml-1.5 flex max-w-full items-center gap-2 rounded-md py-0.5 pr-2 pl-1 text-left text-xs hover:bg-muted/60">
        <ReplyLine x={x} on={on} face={face} />
      </button>
      {on && (
        <div className="relative mt-1 w-full max-w-xl">
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden><path d={NOTE} fill={wash} /></svg>
          <Opened x={x} className="relative m-0 py-3.5 pr-4" />
        </div>
      )}
    </Msg>
  )
}

// 12 · Flat note: 7's note, toned down: no tilt, fitted to the words, smaller, with v1's "Responded by".
// It unfolds flat, the same as 7.
function V12() {
  const [open, toggle] = useOpen("e4")
  return (
    <ChatFrame>
      {EXCHANGES.map((x) => x.answer ? <V12Row key={x.id} x={x} on={open === x.id} onToggle={() => toggle(x.id)} /> : <Unanswered key={x.id} x={x} />)}
    </ChatFrame>
  )
}
function V12Row({ x, on, onToggle }: { x: Ex; on: boolean; onToggle: () => void }) {
  const { wash } = useTint(x)
  return (
    <Msg who={x.asker} time={x.time} mark={<Done />}>
      <Text>{x.question}</Text>
      <div className={cn("relative max-w-full", on ? "w-full max-w-xl" : "w-fit")}>
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden><path d={NOTE} fill={wash} /></svg>
        <button type="button" onClick={onToggle} aria-expanded={on} className="relative flex max-w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs">
          <ReplyLine x={x} on={on} />
        </button>
        {on && <Reasoning x={x} className="relative px-2.5 pt-1 pb-3" />}
      </div>
    </Msg>
  )
}

function Step({ label, icon, last, children }: { label: string; icon?: ReactNode; last?: boolean; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[1.25rem_1fr] gap-x-2">
      <span className="flex flex-col items-center">
        <span className="mt-1.5 flex h-3 items-center">{icon ? null : <span className="size-1.5 rounded-full bg-foreground/50" />}</span>
        {!last && <span className="w-px flex-1 bg-border" />}
      </span>
      <div className="flex min-w-0 flex-col gap-1 pb-3">
        <span className="flex items-center gap-2 type-label text-muted-foreground">{icon}{label}</span>
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </li>
  )
}

const VERSIONS: [string, string, () => ReactNode][] = [
  ["1", "Thread reply", V1],
  ["2", "Gist line, why beside", V2],
  ["3", "Answered tag", V3],
  ["4", "Decision is the answer", V4],
  ["5", "Folded together", V5],
  ["6", "Just a check", V6],
  ["7", "Paper note", V7],
  ["8", "Trail", V8],
  ["9", "1+7 · Wash line", V9],
  ["10", "1+7 · Painted edge", V10],
  ["11", "1+7 · Paper when open", V11],
  ["12", "1+7 · Flat note", V12],
]

export function FoldPlayground({ version = "1" }: { version?: string }) {
  const i = Math.max(0, VERSIONS.findIndex(([id]) => id === version))
  const [, , View] = VERSIONS[i]
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [role=dialog]")) return
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") navigate(`/playground/fold/${VERSIONS[(i + (e.key === "ArrowRight" ? 1 : VERSIONS.length - 1)) % VERSIONS.length][0]}`)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [i])
  return (
    <AppShell crumbs={[{ label: "Playground" }, { label: "Duet replies in chats" }]}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <ToggleGroup type="single" variant="outline" size="sm" value={VERSIONS[i][0]} onValueChange={(v) => v && navigate(`/playground/fold/${v}`)} className="flex-wrap">
          {VERSIONS.map(([id, label]) => <ToggleGroupItem key={id} value={id} className="px-3"><span className="text-muted-foreground">{id}</span>{label}</ToggleGroupItem>)}
        </ToggleGroup>
        <View key={VERSIONS[i][0]} />
      </div>
    </AppShell>
  )
}
