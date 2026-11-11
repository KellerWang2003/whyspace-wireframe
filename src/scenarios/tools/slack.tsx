import { useEffect, useRef, useState, type ReactNode } from "react"
import { ArrowUpRight, Bookmark, ChevronDown, Hash, SendHorizontal } from "lucide-react"
import { PersonAvatar } from "@/components/app/person"
import { MarkIcon } from "@/components/app/status-badge"
import { PEOPLE, type Decision } from "@/data"
import { DUET_LOG, TOGETHER } from "@/app/duet"
import { markOf, type Mark } from "@/lib/marks"
import { cn } from "@/lib/utils"
import { TODAY, dayOf } from "@/playground/model"
import { appApi, useApp, type AppSnapshot } from "../frame"
import { focusWin } from "../windows"

// Slack on the scenario desktop, with Whyspace's Slack app in it (the chat plan's row 1). A stand-in,
// not Whyspace UI, except for what the app posts: on Pro your Duet answers asks for you while you're
// away, marked as yours; Save as decision on any message files it in the thread its channel links to;
// new decisions post back to that channel; a conversation the Duet started brings both owners
// together; and the app's DM is your Duet chat, opening on what it caught for you. Everything that
// changes Whyspace goes through the app's API, and everything Whyspace knows is read from its
// snapshot, so an answer given in either place shows in both.

export type SlackCard = { mark: Mark; title: string; who: string; why?: string }
export type SlackMsg = {
  id: string
  // A PEOPLE id, or "app" for Whyspace itself.
  who: string
  // The day it falls under ("Tuesday", "Yesterday", "Today") and the time.
  day: string
  when: string
  text: string
  // Written by the sender's Duet, marked as theirs.
  duet?: boolean
  // Decision cards under the message: ids read live from Whyspace, or a card as it stood then.
  cards?: (string | SlackCard)[]
  // Whyspace caught this message as a decision: its id.
  caught?: string
  // What Save as decision files it as, when the words don't read as a decision.
  save?: string
  // The Duet's list of what it caught for you.
  caughtList?: boolean
  // A conversation it points to.
  link?: string
  // A question, or words already in a decision: no Save as decision on it.
  nosave?: boolean
}
export type SlackConvo = {
  id: string
  kind: "channel" | "dm" | "app"
  name: string
  // Who's in it besides you.
  people?: string[]
  // The Whyspace thread a channel links to. Decisions saved there land in it, and new ones post back.
  part?: string
  // A question to your Duet asked here: your next message answers it.
  ask?: string
  // A conversation your Duet started between two owners (app/together.ts).
  together?: string
  msgs: SlackMsg[]
}
export type SlackConfig = { workspace: string; person: string; project: string; open: string; convos: SlackConvo[] }

type Local = { id: string; text: string }

export function SlackWindow({ config }: { config: SlackConfig }) {
  const app = useApp()
  const [active, setActive] = useState(config.open)
  const [seen, setSeen] = useState<string[]>([config.open])
  const [local, setLocal] = useState<Record<string, Local[]>>({})
  const convo = config.convos.find((c) => c.id === active) ?? config.convos[0]
  const open = (id: string) => { setActive(id); setSeen((s) => (s.includes(id) ? s : [...s, id])) }
  const me = config.person
  const decision = (id?: string) => app.decisions.find((d) => d.id === id)
  const answered = (ask?: string) => !!ask && !!app.duet.answered[ask]
  // A question the Duet took to a conversation with the other owner waits for you there.
  const elsewhere = (ask: string) => config.convos.some((o) => o.together === `a-${ask}`)
  // Mentions: a question to you not answered yet, or a conversation the Duet started that waits on you.
  const mentions = (c: SlackConvo) => (c.ask && !answered(c.ask) && !elsewhere(c.ask) ? 1 : 0) || (c.together && !app.duet.together[c.together]?.msgs.some((m) => m.who === me) && !answered(TOGETHER_ASK(c.together)) ? 1 : 0) || (c.kind === "app" && !seen.includes(c.id) ? 1 : 0)
  const unread = (c: SlackConvo) => !seen.includes(c.id) || mentions(c) > 0

  const send = (text: string) => {
    const api = appApi()
    if (convo.kind === "app") api?.ask(text)
    else if (convo.together && !app.duet.together[convo.together]?.saved) api?.sendTogether(convo.together, text)
    else if (convo.ask && !answered(convo.ask)) api?.answer(convo.ask, text)
    else setLocal((l) => ({ ...l, [convo.id]: [...(l[convo.id] ?? []), { id: `${convo.id}-${Date.now()}`, text }] }))
  }

  const sections: [string, SlackConvo[]][] = [
    ["Channels", config.convos.filter((c) => c.kind === "channel")],
    ["Direct messages", config.convos.filter((c) => c.kind === "dm")],
    ["Apps", config.convos.filter((c) => c.kind === "app")],
  ]

  return (
    <div className="@container flex min-h-0 flex-1 bg-white text-[13px] text-[#1d1c1d]">
      <nav aria-label="Slack" className="flex w-52 shrink-0 flex-col gap-0.5 overflow-y-auto bg-[#3f0e40] p-2.5 text-purple-100 max-[900px]:w-44">
        <div className="mb-2 flex items-center gap-1 px-2 pt-1 text-[15px] font-bold text-white">{config.workspace}<ChevronDown className="size-3.5" /></div>
        {sections.map(([title, list]) => (
          <div key={title} className="mt-2 flex flex-col gap-px">
            <p className="px-2 pb-1 text-[12px] text-purple-200/75">{title}</p>
            {list.map((c) => (
              <button key={c.id} type="button" onClick={() => open(c.id)} className={cn("flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-left", c.id === convo.id ? "bg-[#1164a3] text-white" : "hover:bg-white/10", unread(c) && c.id !== convo.id && "font-bold text-white")}>
                <ConvoIcon c={c} />
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
                {mentions(c) > 0 && c.id !== convo.id && <span className="rounded-full bg-[#e01e5a] px-1.5 text-[11px] leading-4 font-bold text-white">{mentions(c)}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-black/10 px-4">
          <span className="flex min-w-0 items-center gap-1.5 text-[15px] font-bold">{convo.kind === "channel" && <Hash className="size-4" />}<span className="truncate">{convo.name}</span></span>
          {convo.kind === "app" && <Tag>App</Tag>}
          {convo.part && <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-md border border-black/10 px-2 py-0.5 text-[12px] text-neutral-600"><Y className="size-4 text-[9px]" />{convo.part}</span>}
          {convo.kind === "app" && <span className="ml-auto shrink-0 text-[12px] text-neutral-500">Your Duet · Pro</span>}
        </header>

        <Bottom key={`feed-${convo.id}`} className="min-h-0 flex-1 overflow-y-auto py-3">
          <Feed convo={convo} config={config} app={app} local={local[convo.id] ?? []} open={open} decision={decision} />
        </Bottom>

        {convo.together && app.duet.together[convo.together]?.typing && <p className="px-5 pb-1 text-[12px] text-neutral-500">{first(app.duet.together[convo.together].with)} is typing…</p>}
        <Composer key={`send-${convo.id}`} placeholder={`Message ${convo.kind === "channel" ? "#" : ""}${convo.name}`} onSend={send} />
      </div>
    </div>
  )
}

const first = (id: string) => PEOPLE[id]?.name.split(" ")[0] ?? id
const TOGETHER_ASK = (id: string) => (id.startsWith("a-") ? id.slice(2) : undefined)

// Everything in one conversation, oldest first: the history, then what happened since in Whyspace or here.
function Feed({ convo, config, app, local, open, decision }: { convo: SlackConvo; config: SlackConfig; app: AppSnapshot; local: Local[]; open: (id: string) => void; decision: (id?: string) => Decision | undefined }) {
  const me = config.person
  const items: ReactNode[] = []
  let day = ""
  const divider = (d: string) => { if (d !== day) { day = d; items.push(<Divider key={`d-${d}-${items.length}`}>{d}</Divider>) } }
  const msg = (m: SlackMsg, extra?: ReactNode) => { divider(m.day); items.push(<Message key={m.id} m={m} convo={convo} config={config} app={app} decision={decision} open={open}>{extra}</Message>) }

  for (const m of convo.msgs) msg(m)

  // A question asked here, answered in Whyspace or here: your answer, then the offer to save it. When
  // you answered in the conversation the Duet started with the other owner, the answer shows there.
  const line = DUET_LOG.find((l) => l.id === convo.ask)
  const answer = line && app.duet.answered[line.id]
  const there = !!line && !!app.duet.together[`a-${line.id}`]?.msgs.length
  if (line && answer && !there) {
    msg({ id: `a-${line.id}`, who: me, day: "Today", when: "Now", text: answer, nosave: true })
    const saved = decision(app.duet.saved[line.id])
    // In the channel it posts back to, the decision shows in that post, so the note needs no card.
    const postsHere = convo.kind === "channel" && saved?.part === convo.part
    items.push(saved
      ? <Ephemeral key="saved" text="Saved as your decision. Next time your Duet can answer this.">{!postsHere && <DecisionCard d={saved} app={app} />}</Ephemeral>
      : <Ephemeral key="offer" text="Save your answer as a decision? Next time your Duet can answer this." quote={line.save ?? answer} action="Save as decision" onAction={() => appApi()?.saveAnswer(line.id, line.save ?? answer)} />)
  }

  // A conversation the Duet started: what you and the other owner said, then saving what you settled.
  const t = convo.together ? app.duet.together[convo.together] : undefined
  if (convo.together && t) {
    for (const [i, m] of t.msgs.entries()) msg({ id: `t-${i}`, who: m.who, day: "Today", when: "Now", text: m.text, nosave: true })
    const saved = decision(t.saved)
    const script = TOGETHER[convo.together]
    if (saved) items.push(<AppNote key="settled" text="Saved with both your names."><DecisionCard d={saved} app={app} /></AppNote>)
    else if (script && t.msgs.some((m) => m.who === t.with)) items.push(<Ephemeral key="settle" text={`Save what you and ${first(t.with)} settled as one decision with both names?`} quote={script.save} action="Save as decision" onAction={() => appApi()?.settleTogether(convo.together!, script.save)} />)
  }

  // Your Duet chat (the app's DM): the same conversation as the Duet in Whyspace, with the decisions it cites.
  if (convo.kind === "app") for (const [i, m] of app.duet.chat.entries()) msg({ id: `c-${i}`, who: m.who === "me" ? me : "app", day: "Today", when: "Now", text: m.text, cards: m.refs, caughtList: m.caught })

  for (const m of local) msg({ id: m.id, who: me, day: "Today", when: "Now", text: m.text })

  // New decisions in the thread this channel links to post back here.
  if (convo.kind === "channel" && convo.part) {
    for (const id of app.duet.posted) {
      const d = decision(id)
      if (!d || d.part !== convo.part || d.project !== config.project) continue
      divider("Today")
      items.push(<AppNote key={`p-${id}`} text={`New decision in ${d.part}`} time="Now"><DecisionCard d={d} app={app} /></AppNote>)
    }
  }
  return <div className="flex flex-col">{items}</div>
}

function Message({ m, convo, config, app, decision, open, children }: { m: SlackMsg; convo: SlackConvo; config: SlackConfig; app: AppSnapshot; decision: (id?: string) => Decision | undefined; open: (id: string) => void; children?: ReactNode }) {
  const isApp = m.who === "app"
  const person = PEOPLE[m.who]
  const savedAs = decision(`sl-${m.id}`)
  const caught = decision(m.caught)
  const canSave = !isApp && !m.duet && !m.nosave && !caught && !savedAs && convo.kind !== "app"
  const save = () => appApi()?.saveMessage({ id: m.id, who: m.who, text: m.text, title: m.save ?? m.text, project: config.project, part: convo.part ?? "Marketing", where: convo.kind === "channel" ? `Slack · #${convo.name}` : "Slack · DM" })
  const marked = (d: Decision, verb: string) => {
    const mark = markOf(app.status[d.id] ?? d.status)
    const whose = d.owner === config.person ? "your" : `${first(d.owner)}’s`
    return <p className="mt-1 flex items-center gap-1.5 text-[12px] text-neutral-500"><Y className="size-4 text-[9px]" /><MarkIcon mark={mark} className="size-3" />{verb} {whose} {mark === "empty" ? "guess" : "decision"} in {d.part}</p>
  }
  return (
    <div className="group/msg relative flex gap-2.5 px-5 py-1.5 hover:bg-neutral-50">
      {isApp ? <Y className="size-9 rounded-md text-base" /> : <PersonAvatar id={m.who} agent={m.duet} className="size-9" />}
      <div className="min-w-0 flex-1 leading-[1.45]">
        <p className="flex items-baseline gap-1.5">
          <span className="font-bold">{isApp ? "Whyspace" : person?.name ?? m.who}</span>
          {m.duet && <span className="rounded border border-neutral-300 px-1 text-[10px] text-neutral-600">Duet</span>}
          {isApp && <Tag>App</Tag>}
          <span className="text-[12px] text-neutral-500 tabular-nums">{m.when}</span>
        </p>
        <p className="whitespace-pre-wrap">{m.text}</p>
        {m.cards?.map((c, i) => (typeof c === "string" ? decision(c) && <DecisionCard key={c} d={decision(c)!} app={app} /> : <Card key={i} card={c} />))}
        {m.caughtList && <CaughtList config={config} app={app} open={open} />}
        {m.link && <button type="button" onClick={() => open(m.link!)} className="mt-1 text-[13px] text-[#1264a3] hover:underline">Open the conversation</button>}
        {caught && marked(caught, "Caught as")}
        {savedAs && marked(savedAs, "Saved as")}
        {children}
      </div>
      {canSave && (
        <span className="absolute -top-3 right-4 hidden items-center rounded-md border border-black/10 bg-white shadow-sm group-hover/msg:flex">
          <button type="button" onClick={save} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-neutral-700 hover:bg-neutral-100"><Bookmark className="size-3.5" />Save as decision</button>
        </span>
      )}
    </div>
  )
}

// A decision as Whyspace shows it in Slack, read live: the mark, whose, the thread, the why. It opens in Whyspace.
function DecisionCard({ d, app }: { d: Decision; app: AppSnapshot }) {
  return <Card card={{ mark: markOf(app.status[d.id] ?? d.status), title: d.title, who: [d.by ?? first(d.owner), d.part, d.when === "Today" ? "Today" : d.when].filter(Boolean).join(" · "), why: d.why }} onOpen={() => { appApi()?.openDecision(d.id); focusWin("whyspace") }} />
}

function Card({ card, onOpen }: { card: SlackCard; onOpen?: () => void }) {
  return (
    <button type="button" disabled={!onOpen} onClick={onOpen} className="group/card mt-1.5 flex w-full max-w-[460px] flex-col gap-0.5 border-l-4 border-neutral-300 py-0.5 pl-3 text-left enabled:hover:border-neutral-500">
      <span className="flex items-start gap-1.5 font-bold"><MarkIcon mark={card.mark} className="mt-[4px] size-3.5 shrink-0" /><span className="group-enabled/card:group-hover/card:underline">{card.title}</span></span>
      <span className="text-[12px] text-neutral-500">{card.who}</span>
      {card.why && <span className="text-[12px] text-neutral-600">{card.why}</span>}
    </button>
  )
}

// What the Duet caught for you, as its Slack DM lists it: live, so an answer crosses off its question.
function CaughtList({ config, app, open }: { config: SlackConfig; app: AppSnapshot; open: (id: string) => void }) {
  const me = config.person
  const mine = DUET_LOG.filter((l) => l.owner === me && l.project === config.project)
  const waiting = mine.filter((l) => l.kind === "asked")
  const answeredForYou = mine.filter((l) => l.kind === "answered" && l.day !== "earlier")
  const confirmed = app.decisions.filter((d) => d.project === config.project && d.owner !== me && !d.by?.split(" and ").includes(PEOPLE[me]?.name ?? "") && ["conf", "chg"].includes(app.status[d.id] ?? d.status) && (dayOf(d.when) ?? 0) >= TODAY - 1)
  const where = (askId: string) => config.convos.find((c) => c.together === `a-${askId}`) ?? config.convos.find((c) => c.ask === askId)
  return (
    <div className="mt-2 flex max-w-[520px] flex-col gap-3 rounded-lg border border-black/10 p-3">
      <Section title="Waiting for you">
        {waiting.map((l) => {
          const done = app.duet.answered[l.id]
          const c = where(l.id)
          return (
            <li key={l.id} className="flex items-start gap-2">
              <PersonAvatar id={l.who} className="mt-0.5 size-5 text-[9px]" />
              <span className={cn("min-w-0 flex-1", done && "text-neutral-400 line-through")}>{first(l.who)} asked {l.text}{l.touches && ` · with ${first(decisionOwner(app, l.touches))}`}</span>
              {c && !done && <button type="button" onClick={() => open(c.id)} className="shrink-0 text-[12px] text-[#1264a3] hover:underline">Open</button>}
            </li>
          )
        })}
      </Section>
      <Section title="Answered for you">
        {answeredForYou.map((l) => <li key={l.id} className="flex items-start gap-2"><PersonAvatar id={me} agent className="mt-0.5 size-5 text-[9px]" /><span className="min-w-0 flex-1">Told {first(l.who)} {l.text}</span></li>)}
      </Section>
      <Section title="Confirmed">
        {confirmed.map((d) => <li key={d.id} className="flex items-start gap-2"><MarkIcon mark={markOf(app.status[d.id] ?? d.status)} className="mt-[4px] size-3.5 shrink-0" /><span className="min-w-0 flex-1">{d.title} <span className="text-neutral-500">· {d.by ?? first(d.owner)}</span></span></li>)}
      </Section>
      <button type="button" onClick={() => { appApi()?.navigate(`/p/${config.project}`); focusWin("whyspace") }} className="flex items-center gap-1 self-start rounded-md border border-black/15 px-2.5 py-1 text-[12px] font-semibold hover:bg-neutral-50">Open in Whyspace<ArrowUpRight className="size-3.5" /></button>
    </div>
  )
}

const decisionOwner = (app: AppSnapshot, id: string) => app.decisions.find((d) => d.id === id)?.owner ?? ""

function Section({ title, children }: { title: string; children: ReactNode[] }) {
  if (!children.length) return null
  return (
    <div>
      <p className="mb-1 text-[12px] font-bold text-neutral-600">{title}</p>
      <ul className="flex flex-col gap-1">{children}</ul>
    </div>
  )
}

// Only you see it: an offer with its button, then what came of it.
function Ephemeral({ text, quote, action, onAction, children }: { text: string; quote?: string; action?: string; onAction?: () => void; children?: ReactNode }) {
  return (
    <div className="mx-5 my-1.5 flex gap-2.5 rounded-lg bg-neutral-50 px-3 py-2.5">
      <Y className="size-9 rounded-md text-base" />
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-1.5"><span className="font-bold">Whyspace</span><Tag>App</Tag><span className="text-[12px] text-neutral-500">Only visible to you</span></p>
        <p>{text}</p>
        {quote && <p className="mt-1 text-neutral-600">“{quote}”</p>}
        {action && <button type="button" onClick={onAction} className="mt-2 rounded-md bg-[#007a5a] px-3 py-1 text-[13px] font-bold text-white hover:bg-[#148567]">{action}</button>}
        {children}
      </div>
    </div>
  )
}

function AppNote({ text, time = "Now", children }: { text: string; time?: string; children?: ReactNode }) {
  return (
    <div className="flex gap-2.5 px-5 py-1.5">
      <Y className="size-9 rounded-md text-base" />
      <div className="min-w-0 flex-1 leading-[1.45]">
        <p className="flex items-baseline gap-1.5"><span className="font-bold">Whyspace</span><Tag>App</Tag><span className="text-[12px] text-neutral-500">{time}</span></p>
        <p>{text}</p>
        {children}
      </div>
    </div>
  )
}

function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="relative my-2 flex justify-center">
      <span className="absolute inset-x-0 top-1/2 border-t border-black/10" />
      <span className="relative rounded-full border border-black/10 bg-white px-3 py-0.5 text-[12px] font-bold">{children}</span>
    </div>
  )
}

function ConvoIcon({ c }: { c: SlackConvo }) {
  if (c.kind === "channel") return <Hash className="size-3.5 shrink-0 opacity-80" />
  if (c.kind === "app") return <Y className="size-4 shrink-0 rounded text-[9px]" />
  if ((c.people?.length ?? 0) > 1) return <span className="flex size-4 shrink-0 items-center justify-center rounded bg-white/20 text-[10px]">{c.people!.length}</span>
  return <span className="size-2 shrink-0 rounded-full bg-emerald-400" />
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded bg-neutral-200 px-1 text-[10px] font-semibold text-neutral-600 uppercase">{children}</span>
}

// Whyspace's mark, as its Slack app's icon.
function Y({ className }: { className?: string }) {
  return <span className={cn("flex shrink-0 items-center justify-center rounded bg-neutral-900 font-serif text-white", className)}>Y</span>
}

// A pane that opens scrolled to its newest message and follows new ones, like a chat.
function Bottom({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const down = () => { el.scrollTop = el.scrollHeight }
    down()
    const ro = new ResizeObserver(down)
    for (const child of Array.from(el.children)) ro.observe(child)
    return () => ro.disconnect()
  }, [])
  return <div ref={ref} className={className}>{children}</div>
}

function Composer({ placeholder, onSend }: { placeholder: string; onSend: (text: string) => void }) {
  const [text, setText] = useState("")
  const send = () => { const t = text.trim(); if (!t) return; onSend(t); setText("") }
  return (
    <form onSubmit={(e) => { e.preventDefault(); send() }} className="mx-4 mb-4 flex shrink-0 items-end gap-2 rounded-lg border border-neutral-300 px-3 py-2 focus-within:border-neutral-500">
      <textarea
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="max-h-32 min-h-6 flex-1 resize-none bg-transparent text-[13px] leading-6 outline-none placeholder:text-neutral-400"
      />
      <button type="submit" disabled={!text.trim()} aria-label="Send" className="flex size-7 shrink-0 items-center justify-center rounded bg-[#007a5a] text-white disabled:bg-transparent disabled:text-neutral-400"><SendHorizontal className="size-4" /></button>
    </form>
  )
}
