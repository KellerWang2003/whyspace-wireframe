import { useEffect, useState } from "react"
import { ChevronDown, ChevronRight, CircleCheck, ListTodo, RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MarkIcon } from "@/components/app/status-badge"
import { PersonAvatar } from "@/components/app/person"
import { CardBand, Suggestions } from "@/app/needs-focus"
import type { Answer, Side, Source } from "@/app/needs-model"
import type { Sure } from "@/app/duet"
import { Illo } from "@/components/brand/illo/pieces"
import { useHifi } from "@/lib/hifi"
import type { Mark } from "@/lib/marks"
import { cn } from "@/lib/utils"

// The open overlay, one at a time (Keller picked it Nov 13): the Needs you card from Today, one thing at a
// time, in the same words. Alerts (a possible misalignment) come first; asks (a guess without a why) after.
// Under the card: Saved, the log of this session, folded; then what waits elsewhere, in Today.
// Both desktop overlays use it: the Desk's pill (screens/desktop-overlay.tsx) and the test scenarios' pill
// (scenarios/pill.tsx). Each turns what it caught into OverlayItems.

// What the card shows for a moment after you answer: where it was saved, and Undo.
export type Flash = { text: string; note?: string; undo?: () => void }
// An answer, plus the note it leaves (`flash`, given what you typed, when it asks you to type).
export type OverlayAnswer = Answer & { flash?: (text?: string) => Flash }
export type OverlayItem = {
  id: string
  // alert: a possible misalignment, the only thing that opens the overlay by itself. ask: needs your judgment.
  level: "alert" | "ask"
  source: Source
  title: string
  sides: Side[]
  answers: OverlayAnswer[]
  // A clash's "Ask Trevor why": the other person's Duet answers in the card from their decision, then you
  // can still ask them. The card shows it; `send` asks the person.
  ask?: { face: string; name: string; text: string; why?: string; when?: string; sure?: Sure; send?: () => void }
}
// A line in Saved: a decision's mark (or a task), your words, your why.
export type LogEntry = { id: string; mark: Mark | "task"; title: string; note?: string; onRemove?: () => void }

type Asked = "wait" | "said" | "sent"

export function OverlayStack({ items, log, more, check, className }: {
  items: OverlayItem[]
  log: LogEntry[]
  // What waits outside this thread: "3 more in Today". Without a count, it says "Open Today".
  more?: { n?: number; onOpen: () => void }
  // The check after a share: the stack holds only what you shared, with a line on top and Done.
  check?: { intro: string; onDone: () => void }
  className?: string
}) {
  const hifi = useHifi()
  // Skip takes a card out of the stack, into a short list you can put it back from (as in Today).
  const [skipped, setSkipped] = useState<string[]>([])
  const [front, setFront] = useState<string[]>([])
  // "1 of 4" counts what you've moved past since it opened, skipped cards included.
  const [seen, setSeen] = useState<string[]>(() => items.map((i) => i.id))
  const added = items.filter((i) => !seen.includes(i.id)).map((i) => i.id)
  if (added.length) setSeen([...seen, ...added])
  const [typing, setTyping] = useState<{ id: string; answer: number } | null>(null)
  const [text, setText] = useState("")
  const [flash, setFlash] = useState<Flash | null>(null)
  const [asked, setAsked] = useState<Record<string, Asked>>({})

  // The note after an answer stays a few seconds, then the log keeps it.
  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 4000)
    return () => clearTimeout(t)
  }, [flash])
  // Their Duet answers after a beat.
  const waiting = Object.keys(asked).find((id) => asked[id] === "wait")
  useEffect(() => {
    if (!waiting) return
    const t = setTimeout(() => setAsked((a) => ({ ...a, [waiting]: "said" })), 900)
    return () => clearTimeout(t)
  }, [waiting])

  const rank = (i: OverlayItem) => (front.includes(i.id) ? front.indexOf(i.id) : front.length)
  const queue = items.filter((i) => !skipped.includes(i.id)).sort((a, b) => rank(a) - rank(b))
  const out = items.filter((i) => skipped.includes(i.id))
  const it = queue[0]
  const total = seen.length + added.length
  const pos = total - queue.length + 1
  const stop = () => { setTyping(null); setText("") }

  // "Ask Trevor why" turns into "Ask Trevor" once his Duet has answered, and goes once you've asked him.
  const answersOf = (item: OverlayItem): OverlayAnswer[] => {
    const state = asked[item.id]
    if (!item.ask) return item.answers
    return item.answers.flatMap((a): OverlayAnswer[] => {
      if (a.icon !== "talk") return [a]
      if (!state) return [{ ...a, run: () => setAsked((x) => ({ ...x, [item.id]: "wait" })) }]
      if (state === "said") return [{ label: `Ask ${item.ask!.name}`, icon: "talk", run: () => { item.ask!.send?.(); setAsked((x) => ({ ...x, [item.id]: "sent" })) } }]
      return []
    })
  }
  const pick = (item: OverlayItem, a: OverlayAnswer, i: number) => {
    if (a.input) { setTyping({ id: item.id, answer: i }); setText(""); return }
    a.run?.()
    if (a.flash) setFlash(a.flash())
  }

  return (
    <div className={cn("flex flex-col gap-2 p-2", className)}>
      {check && (
        <div className="flex items-center gap-2 pr-1 pl-2">
          <p className="min-w-0 flex-1 text-xs text-muted-foreground">{check.intro}</p>
          <Button size="sm" variant="ghost" className={cn("text-xs", !hifi && "h-7")} onClick={check.onDone}>Done</Button>
        </div>
      )}
      {flash && <FlashNote flash={flash} onUndo={() => { flash.undo?.(); setFlash(null) }} />}

      {it ? (
        <section aria-label="Needs you" className="flex flex-col gap-1.5">
          {(total > 1 || out.length > 0) && (
            <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground tabular-nums">
              <span className="flex-1">{pos} of {total}</span>
              {out.length > 0 && <SkippedMenu items={out} onPutBack={(item) => { setSkipped((s) => s.filter((x) => x !== item.id)); setFront((f) => [item.id, ...f.filter((x) => x !== item.id)]) }} />}
            </div>
          )}
          <Card
            key={it.id}
            item={it}
            answers={answersOf(it)}
            asked={asked[it.id]}
            behind={Math.min(queue.length - 1, 2)}
            writing={typing?.id === it.id ? it.answers[typing.answer]?.input : undefined}
            text={text}
            onText={setText}
            onSubmit={() => {
              const a = typing ? it.answers[typing.answer] : undefined
              if (!a?.input || !text.trim()) return
              a.input.run(text)
              if (a.flash) setFlash(a.flash(text.trim()))
              stop()
            }}
            onCancel={stop}
            onPick={(a, i) => pick(it, a, i)}
            onSkip={() => { setSkipped((s) => [...s, it.id]); setFront((f) => f.filter((x) => x !== it.id)); stop() }}
          />
        </section>
      ) : (
        <div className="flex flex-col items-center gap-2 px-2 pt-3 pb-2 text-center">
          <Illo name="caught-up" className="h-12" />
          <p className="text-xs text-muted-foreground">{check ? "Nothing left to check." : "Nothing needs you here."}</p>
          {out.length > 0 && <SkippedMenu items={out} onPutBack={(item) => setSkipped((s) => s.filter((x) => x !== item.id))} />}
        </div>
      )}

      {!check && <SavedFold log={log} />}
      {!check && more && (more.n === undefined || more.n > 0) && (
        <button type="button" onClick={more.onOpen} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs text-muted-foreground outline-none hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex-1 text-left">{more.n === undefined ? "Open Today" : `${more.n} more in Today`}</span>
          <ChevronRight className="size-3.5" />
        </button>
      )}
    </div>
  )
}

// One thing that needs you: who raised it, the sentence, the two sides, and the answers as Suggested chips,
// with Skip at the end of their row. The next ones peek out underneath.
function Card({ item, answers, asked, behind, writing, text, onText, onSubmit, onCancel, onPick, onSkip }: {
  item: OverlayItem
  answers: OverlayAnswer[]
  asked?: Asked
  behind: number
  writing?: Answer["input"]
  text: string
  onText: (text: string) => void
  onSubmit: () => void
  onCancel: () => void
  onPick: (a: OverlayAnswer, i: number) => void
  onSkip: () => void
}) {
  const hifi = useHifi()
  const alert = item.level === "alert"
  return (
    <div className={cn("relative isolate", behind > 0 && (behind > 1 ? "mb-3" : "mb-1.5"))}>
      {/* The cards still to come, as edges under this one. */}
      {Array.from({ length: behind }, (_, i) => (
        <span key={i} aria-hidden className={cn("absolute inset-x-0 h-10", i === 0 ? "-bottom-1.5 z-[-1] mx-2.5" : "-bottom-3 z-[-2] mx-5", hifi ? "rounded-[16px] shadow-[0_0_0_1px_var(--hifi-hairline)]" : "rounded-lg border", i === 0 ? "bg-card/80" : "bg-card/50")} />
      ))}
      <article
        aria-label={item.title}
        data-level={item.level}
        className={cn(
          "bg-card duration-200 animate-in fade-in-0 slide-in-from-bottom-1",
          hifi ? "rounded-[18px] px-4 pt-3.5 pb-4 shadow-[0_0_0_1px_oklch(0_0_0/0.05)]" : "rounded-lg border p-3",
          alert && hifi && "shadow-[0_0_0_1px_color-mix(in_oklab,var(--brand-rose-ink)_28%,transparent)]",
        )}
      >
        <CardBand kind={alert ? "misalign" : "open"} className="-mx-4 -mt-3.5 mb-3 rounded-t-[18px] px-4 py-1.5" />
        <p className={cn("text-balance", hifi ? "font-serif text-[17px] leading-[1.25]" : "text-sm leading-snug font-semibold")}>
          <MarkIcon mark={alert ? "triangle" : "empty"} className="mr-1.5 inline-block size-3.5 align-[-1px]" />
          {item.title}
        </p>

        <div className={cn("mt-3 grid gap-1.5", item.sides.length > 1 && "grid-cols-2")}>
          {item.sides.map((s, i) => (
            <div key={i} className={cn("min-w-0 bg-muted px-3 py-2", hifi ? "rounded-xl" : "rounded-md", item.ask && asked && i === 1 && "ring-1 ring-foreground/15")}>
              <p className="text-[11px] leading-4 text-muted-foreground">{s.label}</p>
              <p className="mt-0.5 text-xs leading-snug font-medium">{s.text}</p>
              {s.note && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{s.note}</p>}
            </div>
          ))}
        </div>

        {item.ask && asked && <Reply ask={item.ask} state={asked} />}

        {writing ? (
          <form className="mt-4 flex flex-wrap gap-1.5" onSubmit={(e) => { e.preventDefault(); onSubmit() }}>
            <Input autoFocus value={text} onChange={(e) => onText(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); onCancel() } }} placeholder={writing.placeholder} aria-label={writing.placeholder} className="h-7 min-w-0 flex-1 basis-40 text-xs" />
            <Button type="submit" size="xs" disabled={!text.trim()}>{writing.save}</Button>
            <Button type="button" size="xs" variant="ghost" className="text-muted-foreground" onClick={onCancel}>Cancel</Button>
          </form>
        ) : (
          <Suggestions compact answers={answers} pick={(a, i) => onPick(a as OverlayAnswer, i)} note={<Button variant="ghost" size="xs" className="text-muted-foreground" onClick={onSkip}>Skip</Button>} />
        )}
      </article>
    </div>
  )
}

// Their Duet's answer, from their decision and its why; then, once asked, that it went to them.
type ReplyProps = { ask: NonNullable<OverlayItem["ask"]>; state: Asked }
const whyOf = (ask: ReplyProps["ask"]) => ask.why ?? ask.text
const fromOf = (ask: ReplyProps["ask"]) => `From ${ask.name}’s decision${ask.when ? `, ${ask.when}` : ""}`
const Answering = () => <p className="text-xs text-muted-foreground" aria-label="Answering">···</p>
const SentNote = ({ name }: { name: string }) => <p className="mt-2 text-[11px] leading-4 text-muted-foreground">Sent to {name}. The answer comes back here and in Today.</p>
const DuetName = ({ ask }: { ask: ReplyProps["ask"] }) => (
  <span className="flex min-w-0 items-center gap-1.5 text-[11px] leading-4 text-muted-foreground">
    <PersonAvatar id={ask.face} agent className="size-4 shrink-0" />
    <span><span className="font-medium text-foreground">{ask.name}’s Duet</span> answers for {ask.name}</span>
  </span>
)

// Their Duet's answer hangs off their side (a small notch points up at it), so it reads as theirs (Keller, Nov 14).
function Reply({ ask, state }: ReplyProps) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5 duration-200 animate-in fade-in-0">
      <div className="relative col-span-2 rounded-xl border border-foreground/10 bg-card px-3 py-2.5">
        <span aria-hidden className="absolute -top-[5px] right-[22%] size-2.5 rotate-45 border-t border-l border-foreground/10 bg-card" />
        <DuetName ask={ask} />
        {state === "wait" ? <Answering /> : <>
          <p className="mt-1.5 text-xs leading-5">{whyOf(ask)}</p>
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{fromOf(ask)}</p>
        </>}
        {state === "sent" && <SentNote name={ask.name} />}
      </div>
    </div>
  )
}

// Saved to the thread a moment ago, with Undo while it shows.
function FlashNote({ flash, onUndo }: { flash: Flash; onUndo: () => void }) {
  return (
    <div role="status" className="flex items-start gap-2 rounded-xl bg-card/70 px-3 py-2 duration-200 animate-in fade-in-0">
      <CircleCheck className="mt-px size-3.5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium">{flash.text}</p>
        {flash.note && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{flash.note}</p>}
      </div>
      {flash.undo && <button type="button" onClick={onUndo} className="shrink-0 rounded-sm text-[11px] font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">Undo</button>}
    </div>
  )
}

// What you saved this session: a record, not something to act on, so it sits on the layer, folded.
function SavedFold({ log }: { log: LogEntry[] }) {
  const [open, setOpen] = useState(false)
  return (
    <section aria-label="Saved this session">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex-1 text-left font-medium">Saved</span>
        <span className="tabular-nums text-muted-foreground">{log.length}</span>
        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform duration-300", open && "rotate-180")} />
      </button>
      {open && (log.length ? (
        <ul className="flex flex-col gap-0.5 pb-1">
          {log.map((e) => (
            <li key={e.id} className="group flex items-start gap-2 rounded-md px-2 py-1.5 text-xs">
              {e.mark === "task" ? <ListTodo className="mt-px size-3.5 shrink-0 text-muted-foreground" /> : <MarkIcon mark={e.mark} className="mt-px size-3.5 shrink-0" />}
              <span className="min-w-0 flex-1 leading-snug">{e.title}{e.note && <span className="text-muted-foreground"> · {e.note}</span>}</span>
              {e.onRemove && <button type="button" aria-label={`Remove: ${e.title}`} onClick={e.onRemove} className="rounded-sm p-0.5 text-muted-foreground opacity-0 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"><X className="size-3" /></button>}
            </li>
          ))}
        </ul>
      ) : <p className="px-2 pb-2 text-xs text-muted-foreground">Nothing yet</p>)}
    </section>
  )
}

// "1 skipped": the cards you skipped, to put one back on top.
function SkippedMenu({ items, onPutBack }: { items: OverlayItem[]; onPutBack: (item: OverlayItem) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums transition-colors hover:text-foreground data-[state=open]:text-foreground">
          {items.length} skipped<ChevronDown className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 max-w-[calc(100vw-2rem)] p-1.5">
        <ul className="flex flex-col">
          {items.map((it) => (
            <li key={it.id}>
              <button type="button" onClick={() => { onPutBack(it); setOpen(false) }} className="group flex w-full items-start gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-xs transition-colors hover:bg-[var(--hifi-fill,var(--muted))] focus-visible:bg-[var(--hifi-fill,var(--muted))] focus-visible:outline-none">
                <span className="line-clamp-2 min-w-0 flex-1">{it.title}</span>
                <span className="mt-px inline-flex shrink-0 items-center gap-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><RotateCcw className="size-3" />Put back</span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
