import { Fragment, useEffect, useRef, useState, type ReactNode } from "react"
import { ArrowLeft, ArrowUp, CircleCheck, Clock, FolderOpen, Link2, Mail, PanelRight, Plus, Reply, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AppShell } from "@/components/app/app-shell"
import { PersonAvatar } from "@/components/app/person"
import { PIGMENT, handPath } from "@/components/brand/hand"
import { useHifi } from "@/lib/hifi"
import { CountBadge } from "@/components/app/count-badge"
import { StatusIcon } from "@/components/app/status-badge"
import { DECISIONS, ME, MY_PROJECTS, PEOPLE, decisionById, projectName, type Decision } from "@/data"
import { markOf, stateLabel } from "@/lib/marks"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useStatusOf } from "@/lib/work"
import { whenOf } from "./caught-model"
import { DUET_LOG } from "./duet"
import { answerAsk, first, useDuetState } from "./duet-state"
import { answerSuggestion, saveAnswer, suggestionOf, topicOf, useSettleTogether } from "./together"
import { threadOf } from "./threads"
import { useArtifactsOf } from "./work"
import { ThreadChip } from "./hifi-kit"
import { DuetReply } from "./duet-reply"
import {
  activityOf, foldReplies, isAway, lastChat, linkOptions, makeChat, msgsOf, sendChat, setLastChat, setLinks, useChats, useChatsState, usePending, useUnread,
  type Chat, type ChatMsg, type Link,
} from "./chats-model"
import { Illo } from "@/components/brand/illo/pieces"

// The Chats tab (see chats-model.ts): the list beside the rail, a chat, and the work it's about
// opening beside it. Your Duet has its own tab, so the list holds only people.

const shortName = (project: string) => projectName(project).replace(/\s*\(.*\)$/, "")
const linkName = (l: Link) => `${shortName(l.project)} · ${threadOf(l.project, l.part).name}`
const nameOf = (m: ChatMsg) => (m.duet ? (m.who === ME.id ? "Your Duet" : `${first(m.who)}’s Duet`) : PEOPLE[m.who]?.name ?? m.who)
const others = (chat: Chat) => chat.members.filter((p) => p !== ME.id)

// The list, in the panel beside the rail: DMs and groups, latest first.
// A chat is bold, with a count, only while a question to you waits there.
export function ChatsPanel({ route }: { route: string[] }) {
  const s = useChatsState()
  const chats = useChats()
  const unread = useUnread()
  const [making, setMaking] = useState(false)
  const openId = route[1]
  useEffect(() => { if (openId) setLastChat(openId) }, [openId])
  const sorted = [...chats].sort((a, b) => activityOf(b, s) - activityOf(a, s))
  const sections = [
    { title: "Groups", chats: sorted.filter((c) => c.kind === "group") },
    { title: "Direct messages", chats: sorted.filter((c) => c.kind === "dm") },
  ].filter((x) => x.chats.length)
  return (
    <div className="p-2">
      <div className="mb-3 flex h-9 items-center gap-1 pr-1 pl-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">Chats</span>
        <button onClick={() => setMaking(true)} aria-label="New chat" className="flex size-6 items-center justify-center rounded-md hover:bg-sidebar-accent"><Plus className="size-4" /></button>
      </div>
      <div className="flex flex-col gap-4">
        {sections.map((x) => (
          <section key={x.title} aria-label={x.title} className="flex flex-col gap-1">
            <h2 className="px-2 type-label text-muted-foreground">{x.title}</h2>
            <SidebarMenuSub className="mx-0 translate-x-0 border-l-0 px-0">
              {x.chats.map((c) => <ChatRow key={c.id} id={c.id} active={openId === c.id} name={c.name} face={<ChatFace chat={c} />} unread={unread[c.id]} />)}
            </SidebarMenuSub>
          </section>
        ))}
      </div>
      <NewChatDialog open={making} onOpenChange={setMaking} />
    </div>
  )
}

function ChatRow({ id, active, name, face, unread }: { id: string; active: boolean; name: string; face: ReactNode; unread?: number }) {
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={active} className="h-8">
        <a href={`#/chats/${id}`}>
          {face}
          <span className={cn("min-w-0 flex-1 truncate", unread && "font-semibold")}>{name}</span>
          {unread ? <CountBadge n={unread} size="md" /> : null}
        </a>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}

function ChatFace({ chat, size = "size-5" }: { chat: Chat; size?: string }) {
  if (chat.kind === "dm") return <PersonAvatar id={others(chat)[0]} className={cn(size, size === "size-5" && "text-[9px]")} />
  return <span className={cn("flex shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground", size)}><Users className="size-3" /></span>
}

// The chat page. `item`: what's open beside the chat, a decision or task id, or "work" for the
// thread the chat is linked to.
export function ChatsPage({ id, item }: { id?: string; item?: string }) {
  const chat = useChats().find((c) => c.id === id)
  const [making, setMaking] = useState(false)
  return (
    <AppShell crumbs={[{ label: "Chats" }]}>
      {chat ? (
        <ChatView key={chat.id} chat={chat} item={item} />
      ) : (
        <div className="p-6 sm:p-8">
          <Empty className="border border-dashed py-16">
            <EmptyHeader><Illo name={id ? "went-wrong" : "no-chats"} className={id ? "mb-3 h-20" : "mb-3 h-32"} /><EmptyTitle>{id ? "This chat isn’t here anymore" : "No chats yet"}</EmptyTitle></EmptyHeader>
            {!id && <EmptyContent><Button variant="outline" size="sm" onClick={() => setMaking(true)}>New chat</Button></EmptyContent>}
          </Empty>
          <NewChatDialog open={making} onOpenChange={setMaking} />
        </div>
      )}
    </AppShell>
  )
}

// The panel beside a chat, from the route's `item`: the decisions related to the chat ("decisions",
// "work", or a decision id to open it there) or the artifacts ("artifacts"). People open in a card
// from their face or name, not in the panel.
type Side = { tab: "decisions" | "artifacts"; focus?: string }
function sideOf(item?: string): Side | undefined {
  if (!item) return undefined
  if (item === "artifacts") return { tab: item }
  if (decisionById(item)) return { tab: "decisions", focus: item }
  return { tab: "decisions" }
}

// What a chat touches: decisions said or shown in it, and the threads it's linked to plus the threads
// of those decisions.
function relatedOf(chat: Chat, msgs: ChatMsg[]) {
  const said = [...new Set(msgs.flatMap((m) => [...(m.cards ?? []), m.from, m.caught]).filter((x): x is string => !!x && !!decisionById(x)))]
  const threads: Link[] = []
  for (const l of [...chat.links, ...said.map((id) => decisionById(id)!)]) {
    if (!threads.some((t) => t.project === l.project && t.part === l.part)) threads.push({ project: l.project, part: l.part })
  }
  return { said, threads }
}

// Temporary (Nov 11): message width, full like Slack unless localStorage "whyspace-chat-exp" is
// {"width":"center"}. Remove once Keller settles it.
type Exp = { width: "center" | "full" }
const EXP: Exp = (() => {
  const base: Exp = { width: "full" }
  try { return { ...base, ...JSON.parse(localStorage.getItem("whyspace-chat-exp") ?? "{}") } } catch { return base }
})()
const column = EXP.width === "center" ? "mx-auto w-full max-w-3xl px-3 sm:px-5" : "w-full px-3 sm:px-4"

function ChatView({ chat, item }: { chat: Chat; item?: string }) {
  const s = useChatsState()
  const duet = useDuetState()
  const confirmedMsgs = useConfirmed(chat, msgsOf(chat, s))
  const msgs = [...msgsOf(chat, s), ...confirmedMsgs]
  const { shown, replyOf } = foldReplies(msgs)
  const pending = usePending(msgs)
  // Replying quotes the newest question or conversation waiting on you, until you pick another or clear it.
  const [quote, setQuote] = useState<string | null | undefined>(undefined)
  const quoteId = quote === undefined ? pending.at(-1)?.id : quote ?? undefined
  const quoted = msgs.find((m) => m.id === quoteId)
  const side = sideOf(item)
  const open = (to?: string) => navigate(`/chats/${chat.id}${to ? `/${to}` : ""}`)
  const typing = [
    ...(s.typing[chat.id] ? [`${first(s.typing[chat.id]!)}’s Duet is typing…`] : []),
    ...msgs.filter((m) => m.topic && duet.together[m.topic]?.typing).map((m) => `${first(topicOf(m.topic!)?.other ?? "")} is typing…`),
  ]
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }) }, [msgs.length, typing.length])
  const send = (text: string) => {
    sendChat(chat, text, quoteId)
    setQuote(undefined)
  }

  return (
    <div className="relative flex min-h-0 flex-1">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ChatHeader chat={chat} open={!!side} onToggle={() => open(side ? undefined : "decisions")} />
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className={cn("flex flex-col py-6", column)} aria-live="polite">
            {msgs.length === 0 && <p className="px-2 text-sm text-muted-foreground">No messages yet.</p>}
            {shown.map((m, i) => {
              const prev = shown[i - 1]
              const newDay = !prev || prev.day !== m.day
              const grouped = !!prev && !newDay && prev.who === m.who && !!prev.duet === !!m.duet && !prev.only && !m.only && !m.quote && prev.time === m.time
              return (
                <Fragment key={m.id}>
                  {newDay && <DayDivider day={m.day} />}
                  <Message m={m} reply={replyOf(m.id)} quoted={msgs.find((x) => x.id === m.quote)} grouped={grouped} waiting={pending.some((p) => p.id === m.id && !!m.ask)} onQuote={() => setQuote(m.id)} onOpen={open} />
                </Fragment>
              )
            })}
            {typing.map((t) => <p key={t} className="mt-3 px-2 pl-13 text-xs text-muted-foreground">{t}</p>)}
            <Offers chat={chat} msgs={msgs} onOpen={open} />
          </div>
        </div>
        <div className={cn("pb-4", column)}>
          <Composer key={chat.id} chat={chat} quoted={quoted} onClearQuote={() => setQuote(null)} onSend={send} />
        </div>
      </section>
      {side && <ChatSide chat={chat} msgs={msgs} side={side} onOpen={open} />}
    </div>
  )
}

function ChatHeader({ chat, open, onToggle }: { chat: Chat; open: boolean; onToggle: () => void }) {
  const other = chat.kind === "dm" ? others(chat)[0] : undefined
  const sub = other
    ? isAway(other) ? `Away · ${first(other)}’s Duet answers` : "Online"
    : `${others(chat).map(first).join(", ")} and you`
  const who = (
    <button type="button" className="-ml-1.5 flex min-w-0 items-center gap-3 rounded-lg py-1 pr-2 pl-1.5 text-left">
      <ChatFace chat={chat} size="size-8" />
      <span className="min-w-0">
        <span className="block truncate text-sm leading-tight font-medium hover:underline">{chat.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{sub}</span>
      </span>
    </button>
  )
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 sm:px-6">
      <div className="flex min-w-0 flex-1">{other ? <PersonCard id={other} align="start">{who}</PersonCard> : <MembersCard chat={chat}>{who}</MembersCard>}</div>
      {chat.kind === "group" && <LinkMenu chat={chat} />}
      <PanelToggle open={open} onToggle={onToggle} />
    </header>
  )
}

// Opens the chat's context: the decisions and artifacts it touches.
function PanelToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <Button variant={open ? "secondary" : "outline"} size="sm" className="shrink-0" aria-pressed={open} onClick={onToggle}>
      <PanelRight />Context
    </Button>
  )
}

// Link a group to the threads it talks about. Decisions caught there go to the first one.
function LinkMenu({ chat }: { chat: Chat }) {
  const options = linkOptions()
  const linked = (o: Link) => chat.links.some((l) => l.project === o.project && l.part === o.part)
  const toggle = (o: Link) => setLinks(chat.id, linked(o) ? chat.links.filter((l) => !(l.project === o.project && l.part === o.part)) : [...chat.links, { project: o.project, part: o.part }])
  const projects = [...new Set(options.map((o) => o.project))]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground" aria-label="Link to threads"><Link2 /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-60 overflow-y-auto">
        {projects.map((p, i) => (
          <Fragment key={p}>
            {i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs text-muted-foreground">{shortName(p)}</DropdownMenuLabel>
            {options.filter((o) => o.project === p).map((o) => (
              <DropdownMenuCheckboxItem key={o.part} checked={linked(o)} onCheckedChange={() => toggle(o)} onSelect={(e) => e.preventDefault()}>{o.name}</DropdownMenuCheckboxItem>
            ))}
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Days in a chat. In high-fi, Today is a hand-cut apricot sticky note on a loose apricot thread
// (Keller's pick, Nov 11); earlier days stay gray.
export function DayDivider({ day }: { day: ChatMsg["day"] }) {
  const hifi = useHifi()
  const label = day === "today" ? "Today" : day === "yesterday" ? "Yesterday" : "Earlier"
  if (hifi && day === "today") {
    const thread = (
      <svg viewBox="0 0 400 8" preserveAspectRatio="none" className="h-2 flex-1" aria-hidden>
        <path d={WAVE} fill="none" stroke={PIGMENT.apricot} strokeWidth={1.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
    )
    return (
      <div className="my-4 flex items-center gap-3 px-2 text-xs">
        {thread}
        <span className="relative -rotate-2 px-3 py-1 font-medium">
          <svg viewBox="0 0 64 26" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden><path d={NOTE} fill={PIGMENT.apricotWash} /></svg>
          <span className="relative">{label}</span>
        </span>
        {thread}
      </div>
    )
  }
  return (
    <div className="my-3 flex items-center gap-3 px-2 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />{label}<span className="h-px flex-1 bg-border" />
    </div>
  )
}
// A hand-cut sticky note and a loose thread, from the brand's shapes.
const NOTE = handPath([[0, 1], [64, 0], [63, 26], [1, 25]], { seed: 7, radius: 4, wobble: 0.8 })
const WAVE = "M2 4" + Array.from({ length: 16 }, (_, i) => ` Q${i * 25 + 14.5} ${i % 2 ? 7 : 1} ${i * 25 + 27} 4`).join("")

// One message, flat: face, name and time, the quote it replies to, the text, and its cards.
// Clicking the face or name opens that person's card. `reply`: a Duet's reply to it, folded under it;
// an answered question gets a check.
export function Message({ m, reply, quoted, grouped, waiting, onQuote, onOpen }: { m: ChatMsg; reply?: ChatMsg; quoted?: ChatMsg; grouped: boolean; waiting: boolean; onQuote: () => void; onOpen: (to: string) => void }) {
  return (
    <div className={cn("group/msg relative flex gap-3 rounded-lg px-2 py-1 hover:bg-muted/40", !grouped && "mt-2", m.only && "bg-muted/40")}>
      <div className="w-8 shrink-0">{!grouped && <PersonCard id={m.who}><button type="button" aria-label={PEOPLE[m.who]?.name ?? m.who} className="block rounded-full"><PersonAvatar id={m.who} agent={m.duet} className="size-8" /></button></PersonCard>}</div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
        {!grouped && (
          <div className="flex items-baseline gap-2">
            <PersonCard id={m.who}><button type="button" className="text-sm font-medium hover:underline">{nameOf(m)}</button></PersonCard>
            <span className="text-xs text-muted-foreground tabular-nums">{m.seq !== undefined ? "Just now" : m.time}</span>
            {m.only && <span className="text-xs text-muted-foreground">Only you can see this</span>}
            {reply?.from && <CircleCheck aria-label="Answered" className="size-3.5 shrink-0 self-center text-muted-foreground" />}
          </div>
        )}
        {quoted && (
          <div className="max-w-full border-l-2 pl-2 text-xs text-muted-foreground">
            <span className="font-medium">{nameOf(quoted)}</span> <span className="line-clamp-1">{quoted.text}</span>
          </div>
        )}
        <p className="max-w-full text-sm leading-relaxed whitespace-pre-wrap">{withMentions(m.text)}</p>
        {m.cards?.map((id) => <DecisionCard key={id} id={id} onOpen={onOpen} />)}
        {m.from && <p className="text-xs text-muted-foreground">{fromLine(m)}</p>}
        {m.caught && <Guess id={m.caught} onOpen={onOpen} />}
        {reply && <DuetReply reply={reply} onChange={onQuote} />}
        {waiting && <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">Waiting for you</span>}
      </div>
      <Button variant="ghost" size="icon-xs" className="absolute top-1 right-1 hidden bg-background text-muted-foreground group-hover/msg:flex focus-visible:flex" aria-label={`Quote ${nameOf(m)}`} title="Quote" onClick={onQuote}><Reply /></Button>
    </div>
  )
}

const withMentions = (text: string) => text.split(/(@\w+)/).map((part, i) => (part.startsWith("@") ? <span key={i} className="font-medium">{part}</span> : part))

// Under a Duet's answer: whose decision it spoke from, and why the Duet spoke.
function fromLine(m: ChatMsg) {
  const owner = decisionById(m.from)?.owner
  const whose = owner === ME.id ? "your" : `${first(owner ?? m.who)}’s`
  const why = m.who === ME.id ? "You were away" : isAway(m.who) ? `${first(m.who)} is away` : `${first(m.who)} was away`
  return `From ${whose} decision · ${why}`
}

// A decision in a message. Clicking it opens its thread beside the chat, with it open.
function DecisionCard({ id, onOpen }: { id: string; onOpen: (to: string) => void }) {
  const statusOf = useStatusOf()
  const d = decisionById(id)
  if (!d) return null
  return (
    <button type="button" onClick={() => onOpen(d.id)} className="flex w-full max-w-md items-start gap-2 rounded-lg border bg-background px-3 py-2 text-left hover:bg-muted/50">
      <StatusIcon status={statusOf(d)} className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm">{d.title}</span>
        <span className="block truncate text-xs text-muted-foreground">{[d.by ?? first(d.owner), linkName(d)].join(" · ")}</span>
      </span>
    </button>
  )
}

// A decision said in a group, caught as a guess for whoever said it. Only they can confirm it.
function Guess({ id, onOpen }: { id: string; onOpen: (to: string) => void }) {
  const { confirmDecision } = useStore()
  const statusOf = useStatusOf()
  const d = decisionById(id)
  if (!d) return null
  const status = statusOf(d)
  const guess = markOf(status) === "empty"
  return (
    <div className={cn("flex w-full max-w-md flex-col gap-1 rounded-lg border bg-background px-3 py-2", guess && "border-dashed")}>
      <div className="flex min-h-6 items-center gap-1.5 text-xs text-muted-foreground">
        <StatusIcon status={status} className="size-3 shrink-0" />
        <span className="flex-1">{stateLabel(status)}{guess && d.owner !== ME.id && ` · Waiting for ${first(d.owner)}`}</span>
        {guess && d.owner === ME.id && <Button size="xs" onClick={() => confirmDecision(d.id)}>Confirm</Button>}
      </div>
      <button type="button" onClick={() => onOpen(d.id)} className="text-left text-sm font-medium hover:underline">{d.title}</button>
    </div>
  )
}

// A question your Duet held that a decision of yours now answers, because you confirmed it somewhere
// else: your Duet tells them. Its reply folds under the question.
function useConfirmed(chat: Chat, msgs: ChatMsg[]): ChatMsg[] {
  const { confirmed } = useStore()
  const { answered } = useDuetState()
  if (chat.id.startsWith("a-")) return []
  const lines = msgs.filter((m) => m.ask).map((m) => DUET_LOG.find((l) => l.id === m.ask)!).filter((l) => l?.decision && confirmed[l.decision] && !answered[l.id])
  return lines.map((l) => {
    const d = decisionById(l.decision)!
    return { id: `${l.id}-c`, who: ME.id, duet: true, text: `${d.title}.`, day: "today", time: "", seq: 0, from: d.id, replyTo: `${l.id}-q`, sure: "sure" }
  })
}

// What only you see, at the bottom of the chat: a guess of yours that answers a question once you
// confirm it, an answer you can save as a decision, and what you and another owner settled.
function Offers({ chat, msgs, onOpen }: { chat: Chat; msgs: ChatMsg[]; onOpen: (to: string) => void }) {
  const { confirmDecision } = useStore()
  const { answered, saved, together } = useDuetState()
  const statusOf = useStatusOf()
  const settle = useSettleTogether()
  const pending = usePending(msgs)
  const offers: ReactNode[] = []
  for (const m of pending) {
    const l = m.ask ? DUET_LOG.find((x) => x.id === m.ask) : undefined
    const guess = decisionById(l?.decision)
    if (!l || !guess || guess.owner !== ME.id || markOf(statusOf(guess)) !== "empty" || chat.id.startsWith("a-")) continue
    offers.push(
      <Offer key={`g-${l.id}`} text={`Your guess answers ${first(l.who)} once you confirm it.`}>
        <DecisionCard id={guess.id} onOpen={onOpen} />
        <Button size="xs" onClick={() => { confirmDecision(guess.id); answerAsk(l.id, guess.title) }}>Confirm and send</Button>
      </Offer>,
    )
  }
  if (!chat.id.startsWith("a-")) {
    for (const m of msgs) {
      const l = m.ask && answered[m.ask] && !saved[m.ask] ? DUET_LOG.find((x) => x.id === m.ask) : undefined
      if (!l || answered[l.id] === decisionById(l.decision)?.title) continue
      offers.push(
        <Offer key={`s-${l.id}`} text="Save your answer as a decision, so I can answer this next time.">
          <SaveAsDecision suggestion={answerSuggestion(l, answered[l.id])} onSave={(title) => saveAnswer(l, title)} />
        </Offer>,
      )
    }
  }
  for (const m of msgs) {
    const topic = m.topic ? topicOf(m.topic) : undefined
    const t = topic && together[topic.id]
    if (!topic || !t || t.saved || !t.msgs.some((x) => x.who === topic.other)) continue
    offers.push(
      <Offer key={`t-${topic.id}`} text={`Save what you and ${first(topic.other)} settled, with both your names.`}>
        <SaveAsDecision suggestion={suggestionOf(topic)} onSave={(title) => settle(topic, title)} />
      </Offer>,
    )
  }
  return offers
}

function Offer({ text, children }: { text: string; children: ReactNode }) {
  return (
    <div className="mt-2 flex gap-3 rounded-lg bg-muted/40 px-2 py-2">
      <PersonAvatar id={ME.id} agent className="size-8" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <div className="flex items-baseline gap-2"><span className="text-sm font-medium">Your Duet</span><span className="text-xs text-muted-foreground">Only you can see this</span></div>
        <p className="text-sm">{text}</p>
        {children}
      </div>
    </div>
  )
}

function SaveAsDecision({ suggestion, onSave }: { suggestion: string; onSave: (title: string) => void }) {
  const [title, setTitle] = useState(suggestion)
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(title) }} className="flex w-full max-w-md items-center gap-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Decision" className="h-8 flex-1 bg-background text-sm" />
      <Button type="submit" size="sm" variant="outline" className="bg-background" disabled={!title.trim()}>Save as decision</Button>
    </form>
  )
}

function Composer({ chat, quoted, onClearQuote, onSend }: { chat: Chat; quoted?: ChatMsg; onClearQuote: () => void; onSend: (text: string) => void }) {
  const [text, setText] = useState("")
  const to = chat.kind === "dm" ? first(others(chat)[0]) : chat.name
  const send = () => {
    if (!text.trim()) return
    onSend(text)
    setText("")
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); send() }} className="rounded-2xl border border-border/80 bg-background p-2 transition-colors focus-within:border-ring/50">
      {quoted && (
        <div className="mb-1.5 flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-xs">
          <Reply className="size-3 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate"><span className="font-medium">{nameOf(quoted)}</span> <span className="text-muted-foreground">{quoted.text}</span></span>
          <button type="button" onClick={onClearQuote} aria-label="Remove quote" className="rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"><X className="size-3" /></button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
          placeholder={`Message ${to}`}
          aria-label={`Message ${to}`}
          className="max-h-40 min-h-9 resize-none border-0 bg-transparent px-1.5 py-2 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <Button type="submit" size="icon-sm" className="shrink-0 rounded-lg" disabled={!text.trim()} aria-label="Send"><ArrowUp /></Button>
      </div>
    </form>
  )
}

// The panel beside every chat, DM or group: the decisions and artifacts the chat touches (relatedOf).
// Decisions said or shown in the chat come first.
function ChatSide({ chat, msgs, side, onOpen }: { chat: Chat; msgs: ChatMsg[]; side: Side; onOpen: (to?: string) => void }) {
  const { said, threads } = relatedOf(chat, msgs)
  const artifacts = useArtifactsOf([...new Set(threads.map((t) => t.project))])
  return (
    <aside aria-label="Context" className="absolute inset-0 z-10 flex min-h-0 flex-col bg-background lg:static lg:w-[360px] lg:shrink-0 lg:border-l">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b pr-2 pl-4">
        <Tabs value={side.tab} onValueChange={(t) => onOpen(t)} className="min-w-0 flex-1">
          <TabsList variant="line" className="-ml-2">
            <TabsTrigger value="decisions">Decisions</TabsTrigger>
            <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label="Close" onClick={() => onOpen()}><X /></Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {side.tab === "decisions" && (
          <div className="flex flex-col gap-5 p-2 pt-3">
            {said.length > 0 && (
              <SideSection title="In this chat">
                {said.map((id) => <BesideDecision key={id} d={decisionById(id)!} focused={id === side.focus} onFocus={() => onOpen(id === side.focus ? "decisions" : id)} />)}
              </SideSection>
            )}
            {threads.map((t) => {
              const rest = DECISIONS.filter((d) => d.project === t.project && d.part === t.part && !said.includes(d.id))
              return rest.length > 0 && (
                <SideSection key={`${t.project}/${t.part}`} title={<ThreadTitle {...t} />}>
                  {rest.map((d) => <BesideDecision key={d.id} d={d} focused={d.id === side.focus} onFocus={() => onOpen(d.id === side.focus ? "decisions" : d.id)} />)}
                </SideSection>
              )
            })}
            {said.length === 0 && threads.length === 0 && <p className="px-2 text-sm text-muted-foreground">No decisions yet.</p>}
          </div>
        )}
        {side.tab === "artifacts" && (
          <div className="flex flex-col gap-5 p-2 pt-3">
            {threads.map((t) => {
              const list = artifacts.filter((a) => a.project === t.project && a.part === t.part)
              const thread = threadOf(t.project, t.part)
              return list.length > 0 && (
                <SideSection key={`${t.project}/${t.part}`} title={<ThreadTitle {...t} />}>
                  {list.map((a) => (
                    <li key={a.id}>
                      <a href={`#/p/${t.project}/t/${thread.id}/artifacts/${a.id}`} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60">
                        <span className="min-w-0 flex-1 truncate">{a.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{a.source}</span>
                      </a>
                    </li>
                  ))}
                </SideSection>
              )
            })}
            {!threads.some((t) => artifacts.some((a) => a.project === t.project && a.part === t.part)) && <p className="px-2 text-sm text-muted-foreground">No artifacts yet.</p>}
          </div>
        )}
      </div>
    </aside>
  )
}

function SideSection({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="px-2 type-label text-muted-foreground">{title}</h3>
      <ul className="flex flex-col">{children}</ul>
    </section>
  )
}

// A thread's name in its pigment (high-fi), linking to the thread.
function ThreadTitle({ project, part }: Link) {
  const thread = threadOf(project, part)
  return (
    <a href={`#/p/${project}/t/${thread.id}`} className="inline-flex max-w-full items-center gap-1 hover:text-foreground">
      <span className="shrink-0">{shortName(project)} ·</span><ThreadChip projectId={project} part={part} className="min-w-0" />
    </a>
  )
}

// Where everyone is, for their local time. Jordan works from another time zone.
const ZONE: Record<string, string> = { JK: "Asia/Seoul" }
const localTime = (id: string) => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: ZONE[id] })

// A person's card, from their face or name anywhere in a chat: photo, role, online or away, local
// time, email, projects together.
function PersonCard({ id, align = "start", children }: { id: string; align?: "start" | "center" | "end"; children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className="w-72 p-0"><Profile id={id} /></PopoverContent>
    </Popover>
  )
}

// A group's members, from its name in the header. Each opens their card in place.
function MembersCard({ chat, children }: { chat: Chat; children: ReactNode }) {
  const [person, setPerson] = useState<string | null>(null)
  return (
    <Popover onOpenChange={(o) => { if (!o) setPerson(null) }}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        {person ? <Profile id={person} onBack={() => setPerson(null)} /> : <Members chat={chat} onPerson={setPerson} />}
      </PopoverContent>
    </Popover>
  )
}

function Profile({ id, onBack }: { id: string; onBack?: () => void }) {
  const p = PEOPLE[id]
  const hifi = useHifi()
  const projects = MY_PROJECTS.filter((x) => x.members.includes(id) && x.members.includes(ME.id))
  const away = isAway(id)
  const here = window.location.hash.startsWith(`#/chats/dm-${id}`)
  return (
    <div className="flex flex-col gap-4 p-4">
      {onBack && <Button variant="ghost" size="xs" className="-mt-1 -ml-1 self-start text-muted-foreground" onClick={onBack}><ArrowLeft />Members</Button>}
      <div className="flex items-center gap-3">
        <PersonAvatar id={id} className="size-14 text-lg" />
        <div className="min-w-0">
          <h2 className="truncate type-heading">{p?.name ?? id}</h2>
          {p?.role && <p className="truncate text-sm text-muted-foreground">{p.role}</p>}
        </div>
      </div>
      <ul className="flex flex-col gap-2 text-sm">
        {id !== ME.id && (
          <li className="flex items-center gap-2.5">
            <span className="flex size-4 items-center justify-center"><span className={cn("size-2 rounded-full", away ? "border border-muted-foreground" : "bg-foreground")} style={!away && hifi ? { background: PIGMENT.leaf } : undefined} /></span>
            {away ? `Away · ${first(id)}’s Duet answers` : "Online"}
          </li>
        )}
        <li className="flex items-center gap-2.5"><Clock className="size-4 text-muted-foreground" />{localTime(id)} local time</li>
        {p?.email && <li className="flex min-w-0 items-center gap-2.5"><Mail className="size-4 shrink-0 text-muted-foreground" /><span className="truncate">{p.email}</span></li>}
        {projects.length > 0 && <li className="flex min-w-0 items-center gap-2.5"><FolderOpen className="size-4 shrink-0 text-muted-foreground" /><span className="truncate">{projects.map((x) => shortName(x.id)).join(", ")}</span></li>}
      </ul>
      {id !== ME.id && !here && <Button variant="outline" size="sm" className="self-start" onClick={() => navigate(`/chats/${makeChat([id], "", [])}`)}>Message</Button>}
    </div>
  )
}

function Members({ chat, onPerson }: { chat: Chat; onPerson: (id: string) => void }) {
  const sorted = [...chat.members].sort((a, b) => (a === ME.id ? 1 : b === ME.id ? -1 : 0))
  return (
    <ul className="flex flex-col p-2">
      {sorted.map((id) => (
        <li key={id}>
          <button type="button" onClick={() => onPerson(id)} className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-muted/60">
            <PersonAvatar id={id} className="size-8" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{PEOPLE[id]?.name ?? id}{id === ME.id && <span className="text-muted-foreground"> (you)</span>}</span>
              <span className="block truncate text-xs text-muted-foreground">{PEOPLE[id]?.role}</span>
            </span>
            {isAway(id) && <span className="shrink-0 text-xs text-muted-foreground">Away</span>}
          </button>
        </li>
      ))}
    </ul>
  )
}

function BesideDecision({ d, focused, onFocus }: { d: Decision; focused: boolean; onFocus: () => void }) {
  const { confirmDecision, openDecision } = useStore()
  const statusOf = useStatusOf()
  const status = statusOf(d)
  const guess = markOf(status) === "empty"
  const ref = useRef<HTMLLIElement>(null)
  useEffect(() => { if (focused) ref.current?.scrollIntoView({ block: "nearest" }) }, [focused])
  return (
    <li ref={ref} className={cn("rounded-md", focused && "bg-muted")}>
      <button type="button" onClick={onFocus} aria-expanded={focused} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm", !focused && "hover:bg-muted/60")}>
        <StatusIcon status={status} className="size-3.5 shrink-0 text-muted-foreground" />
        <span className={cn("min-w-0 flex-1", !focused && "truncate", focused && "font-medium")}>{d.title}</span>
        {guess && <span className="shrink-0 rounded-full border border-dashed px-1.5 text-[10px] text-muted-foreground">Guess</span>}
        <span className="shrink-0 text-xs text-muted-foreground">{first(d.owner)}</span>
      </button>
      {focused && (
        <div className="flex flex-col items-start gap-2 pr-2 pb-2.5 pl-7.5">
          {d.why && <p className="text-xs leading-relaxed text-muted-foreground">{d.why}</p>}
          <p className="text-xs text-muted-foreground">{[d.by ?? first(d.owner), d.tool, whenOf(d)].filter(Boolean).join(" · ")}</p>
          <div className="flex gap-2">
            {guess && d.owner === ME.id && <Button size="xs" onClick={() => confirmDecision(d.id)}>Confirm</Button>}
            <Button size="xs" variant="outline" className="bg-background" onClick={() => openDecision(d.id)}>Open</Button>
          </div>
        </div>
      )}
    </li>
  )
}

// New chat: pick people. One person is a DM; a name, a link or more people make a group.
function NewChatDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const people = [...new Set(MY_PROJECTS.flatMap((p) => p.members))].filter((id) => id !== ME.id && PEOPLE[id])
  const [picked, setPicked] = useState<string[]>([])
  const [name, setName] = useState("")
  const [links, setPickedLinks] = useState<Link[]>([])
  const options = linkOptions()
  const has = (o: Link) => links.some((l) => l.project === o.project && l.part === o.part)
  const toggleLink = (o: Link) => setPickedLinks(has(o) ? links.filter((l) => !(l.project === o.project && l.part === o.part)) : [...links, { project: o.project, part: o.part }])
  const close = (o: boolean) => {
    onOpenChange(o)
    if (!o) { setPicked([]); setName(""); setPickedLinks([]) }
  }
  const start = () => {
    const id = makeChat(picked, picked.length === 1 && links.length ? name || PEOPLE[picked[0]]?.name || "" : name, links)
    close(false)
    navigate(`/chats/${id}`)
  }
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 sm:max-w-md">
        <DialogHeader><DialogTitle>New chat</DialogTitle></DialogHeader>
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          <ul aria-label="People" className="flex flex-col gap-0.5">
            {people.map((id) => (
              <li key={id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/60">
                  <Checkbox checked={picked.includes(id)} onCheckedChange={(on) => setPicked(on ? [...picked, id] : picked.filter((x) => x !== id))} />
                  <PersonAvatar id={id} className="size-6" />
                  <span className="min-w-0 flex-1 truncate text-sm">{PEOPLE[id].name}</span>
                  {isAway(id) && <span className="text-xs text-muted-foreground">Away</span>}
                </label>
              </li>
            ))}
          </ul>
          {picked.length > 0 && (
            <>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={picked.length > 1 ? picked.map(first).join(", ") : "Name"} aria-label="Group name" />
              <section aria-label="Link to threads" className="flex flex-col gap-1">
                <h3 className="px-2 type-label text-muted-foreground">Link to threads</h3>
                {[...new Set(options.map((o) => o.project))].map((p) => (
                  <div key={p} className="flex flex-col">
                    <span className="px-2 pt-1 text-xs text-muted-foreground">{shortName(p)}</span>
                    {options.filter((o) => o.project === p).map((o) => (
                      <label key={o.part} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1 hover:bg-muted/60">
                        <Checkbox checked={has(o)} onCheckedChange={() => toggleLink(o)} />
                        <span className="text-sm">{o.name}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </section>
            </>
          )}
        </div>
        <DialogFooter><Button disabled={!picked.length} onClick={start}>Start chat</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { lastChat }
