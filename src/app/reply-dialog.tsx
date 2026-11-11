import { useState, type ReactNode } from "react"
import { ArrowUp, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PersonAvatar } from "@/components/app/person"
import { StatusIcon } from "@/components/app/status-badge"
import { ME, PEOPLE, decisionById, projectName, type Decision } from "@/data"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { useStatusOf } from "@/lib/work"
import { cn } from "@/lib/utils"
import { whenOf } from "./caught-model"
import { chatOfLine, chatOfTopic } from "./chats-model"
import { DUET_LOG, type DuetLine } from "./duet"
import { answerAsk, closeReply, first, useDuetState, type Level } from "./duet-state"
import { answerSuggestion, isTopicId, saveAnswer, sendTogether, suggestionOf, topicOf, useSettleTogether, type Topic } from "./together"

// The reply window: your conversations with teammates, opened from Today, While you were away and the
// Duet. It is the same chat as in Chats, and Open in Chats goes there.
// A question your Duet held opens on your conversation with that teammate, so it's clear you're
// answering them and not your Duet; sending swaps the composer for a sent receipt, and you can save
// your answer as a decision so your Duet can answer it next time. A conversation your Duet started
// between two owners (a clash, or a question that touches someone else's decision) opens here too,
// with each decision and why on top; what you settle is saved with both names.
export function ReplyDialog() {
  const { reply, answered, level } = useDuetState()
  const topic = isTopicId(reply?.id) ? topicOf(reply!.id) : undefined
  const ask = topic ? undefined : DUET_LOG.find((l) => l.id === reply?.id)
  return (
    <Dialog open={(!!ask || !!topic) && !!reply?.open} onOpenChange={(o) => !o && closeReply()}>
      {topic ? <Together key={topic.id} topic={topic} /> : ask && <Conversation key={ask.id} ask={ask} sent={answered[ask.id]} level={level} />}
    </Dialog>
  )
}

const shortName = (project: string) => projectName(project).replace(/\s*\(.*\)$/, "")

function Conversation({ ask, sent, level }: { ask: DuetLine; sent?: string; level: Level }) {
  const { confirmed, confirmDecision } = useStore()
  const { saved } = useDuetState()
  const [text, setText] = useState("")
  const name = first(ask.who)
  const send = (words: string) => {
    if (!words.trim()) return
    answerAsk(ask.id, words.trim())
    setText("")
  }
  // A guess of yours would answer it: confirming the guess sends it as your reply.
  const guess = decisionById(ask.decision)
  const offer = guess && !confirmed[guess.id] ? guess : undefined
  const held = offer
    ? "Your Duet held this. Your guess answers it once you confirm it."
    : level === "off"
      ? `Your Duet is off, so ${name}’s question came straight to you.`
      : level === "draft"
        ? "Your Duet had nothing to draft from. No decision of yours covers this yet."
        : "Your Duet held this. No decision of yours covers it yet."
  const savedDecision = decisionById(saved[ask.id])
  // An answer made by confirming your guess is already a decision; a typed one can become one.
  const canSave = !!sent && !savedDecision && sent !== guess?.title

  return (
    <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
      <header className="flex items-center gap-3 border-b py-2 pr-12 pl-4">
        <PersonAvatar id={ask.who} className="size-8" />
        <div className="min-w-0">
          <DialogTitle className="truncate text-sm leading-tight font-medium">{PEOPLE[ask.who]?.name ?? name}</DialogTitle>
          <DialogDescription className="truncate text-xs">{[shortName(ask.project), ask.where].filter(Boolean).join(" · ")}</DialogDescription>
        </div>
        <OpenInChats chat={chatOfLine(ask)} />
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5" aria-live="polite">
        <Bubble who={ask.who} when={whenOf(ask)}>{ask.message ?? `Asked ${ask.text}`}</Bubble>
        <DuetNote>
          <p className="leading-4">{held}</p>
          {offer && !sent && (
            <div className="flex flex-col items-start gap-2 rounded-lg border bg-background px-3 py-2 text-foreground">
              <p className="text-sm">{offer.title}</p>
              <Button size="xs" onClick={() => { confirmDecision(offer.id); answerAsk(ask.id, offer.title) }}>Confirm and send</Button>
            </div>
          )}
        </DuetNote>
        {sent && <Bubble who={ME.id} mine when="Just now">{sent}</Bubble>}
        {savedDecision && <DuetNote><p className="leading-4">Saved as your decision. Next time I can answer this.</p><DecisionCard d={savedDecision} /></DuetNote>}
      </div>

      <footer className={cn("flex flex-col gap-2.5 border-t p-3", sent && "bg-muted/50")}>
        {sent ? (
          <>
            <Sent to={name} />
            {canSave && <SaveAsDecision suggestion={answerSuggestion(ask, sent)} onSave={(title) => saveAnswer(ask, title)} />}
          </>
        ) : (
          <Composer label={`Reply to ${name}`} placeholder={`Reply to ${name}…`} send={`Send to ${name}`} value={text} onChange={setText} onSend={() => send(text)} />
        )}
      </footer>
    </DialogContent>
  )
}

// A conversation your Duet started: the people in it, each decision and why, what they said, and,
// once the other owner has answered, what to save with both names.
function Together({ topic }: { topic: Topic }) {
  const { together } = useDuetState()
  const settle = useSettleTogether()
  const [text, setText] = useState("")
  const t = together[topic.id]
  const saved = decisionById(t?.saved)
  const heard = !!t?.msgs.some((m) => m.who === topic.other)
  const names = `${topic.people.map(first).join(", ")} and you`
  const other = first(topic.other)
  const intro = topic.ask
    ? `No decision of yours covers this, and it touches ${other}’s decision, so I brought ${other} in.`
    : `Your decision clashes with ${other}’s, so I brought you both in.`
  const send = () => {
    sendTogether(topic, text)
    setText("")
  }

  return (
    <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
      <header className="flex items-center gap-3 border-b py-2 pr-12 pl-4">
        <span className="flex -space-x-2">{topic.people.map((id) => <PersonAvatar key={id} id={id} className="size-8 ring-2 ring-background" />)}</span>
        <div className="min-w-0">
          <DialogTitle className="truncate text-sm leading-tight font-medium">{names}</DialogTitle>
          <DialogDescription className="truncate text-xs">{[shortName(topic.project), topic.part, topic.ask?.where].filter(Boolean).join(" · ")}</DialogDescription>
        </div>
        <OpenInChats chat={chatOfTopic(topic.id)} />
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5" aria-live="polite">
        {topic.ask && <Bubble who={topic.ask.who} name={first(topic.ask.who)} when={whenOf(topic.ask)}>{topic.ask.message ?? `Asked ${topic.ask.text}`}</Bubble>}
        <DuetNote>
          <p className="leading-4">{intro}</p>
          {topic.decisions.map((d) => <DecisionCard key={d.id} d={d} />)}
        </DuetNote>
        {t?.msgs.map((m, i) => <Bubble key={i} who={m.who} mine={m.who === ME.id} name={m.who === ME.id ? undefined : first(m.who)} when="Just now">{m.text}</Bubble>)}
        {t?.typing && <p className="flex items-center gap-2 text-xs text-muted-foreground"><PersonAvatar id={topic.other} className="size-6" />{other} is typing…</p>}
        {saved && <DuetNote><p className="leading-4">Saved with both your names.</p><DecisionCard d={saved} /></DuetNote>}
      </div>

      <footer className={cn("flex flex-col gap-2.5 border-t p-3", saved && "bg-muted/50")}>
        {saved ? (
          <div role="status" className="flex items-center gap-2.5 pl-1">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background"><Check className="size-3" strokeWidth={3} /></span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">Saved to {saved.part}</span>
            <Button size="sm" onClick={closeReply}>Done</Button>
          </div>
        ) : (
          <>
            {heard && <SaveAsDecision suggestion={suggestionOf(topic)} onSave={(title) => settle(topic, title)} />}
            <Composer label={`Message ${names}`} placeholder="Message…" send="Send" value={text} onChange={setText} onSend={send} />
          </>
        )}
      </footer>
    </DialogContent>
  )
}

// The same conversation, full size, in Chats. Not for one held in Slack: it stays there.
function OpenInChats({ chat }: { chat?: string }) {
  if (!chat) return null
  return <Button variant="ghost" size="sm" className="ml-auto shrink-0 text-muted-foreground" onClick={() => { closeReply(); navigate(`/chats/${chat}`) }}>Open in Chats</Button>
}

function Sent({ to }: { to: string }) {
  return (
    <div role="status" className="flex items-center gap-2.5 pl-1">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background"><Check className="size-3" strokeWidth={3} /></span>
      <span className="min-w-0 flex-1 text-sm font-medium">Sent to {to}</span>
      <Button size="sm" onClick={closeReply}>Done</Button>
    </div>
  )
}

function Composer({ label, placeholder, send, value, onChange, onSend }: { label: string; placeholder: string; send: string; value: string; onChange: (v: string) => void; onSend: () => void }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSend() }} className="flex items-end gap-2">
      <Textarea
        autoFocus
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); onSend() } }}
        placeholder={placeholder}
        aria-label={label}
        className="max-h-40 min-h-9 resize-none py-2"
      />
      <Button type="submit" size="icon" disabled={!value.trim()} aria-label={send}><ArrowUp /></Button>
    </form>
  )
}

// One tap turns what was said into a decision. The words are yours to change first.
function SaveAsDecision({ suggestion, onSave }: { suggestion: string; onSave: (title: string) => void }) {
  const [title, setTitle] = useState(suggestion)
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(title) }} className="flex items-center gap-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Decision" className="h-8 flex-1 bg-background text-sm" />
      <Button type="submit" size="sm" variant="outline" className="bg-background" disabled={!title.trim()}>Save as decision</Button>
    </form>
  )
}

// What your Duet says in the conversation: small, on its own line, under its mark.
export function DuetNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 pl-8 text-xs text-muted-foreground">
      <PersonAvatar id={ME.id} agent className="size-4 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2">{children}</div>
    </div>
  )
}

// A decision with whose it is and why, as the Duet shows it in a conversation.
function DecisionCard({ d }: { d: Decision }) {
  const statusOf = useStatusOf()
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-background px-3 py-2 text-foreground">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><PersonAvatar id={d.owner} className="size-4 text-[8px]" />{d.by ?? first(d.owner)}{d.when && ` · ${whenOf(d)}`}</span>
      <span className="flex items-start gap-1.5 text-sm font-medium"><StatusIcon status={statusOf(d)} className="mt-1 size-3 shrink-0" />{d.title}</span>
      {d.why && <span className="text-xs leading-relaxed text-muted-foreground">{d.why}</span>}
    </div>
  )
}

// One message: theirs on the left, yours on the right. In a group, theirs carry the sender's name.
export function Bubble({ who, mine = false, name, when, children }: { who: string; mine?: boolean; name?: string; when?: string; children: ReactNode }) {
  return (
    <div className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
      <PersonAvatar id={who} className="size-6 shrink-0" />
      <div className={cn("flex max-w-[80%] flex-col gap-1", mine && "items-end")}>
        {name && <span className="px-1 text-[11px] text-muted-foreground">{name}</span>}
        <p className={cn("rounded-2xl px-3.5 py-2 text-sm leading-relaxed", mine ? "rounded-br-md bg-foreground text-background" : "rounded-bl-md bg-muted")}>{children}</p>
        {when && <span className="px-1 text-[11px] text-muted-foreground tabular-nums">{when}</span>}
      </div>
    </div>
  )
}
