import { useEffect, useState, type ComponentType, type ReactNode } from "react"
import { Check, ChevronRight, Sparkles, Copy, ExternalLink, MessageCircle, PenLine, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PersonAvatar } from "@/components/app/person"
import { ProjectMark } from "@/components/app/project-mark"
import { projectName } from "@/data"
import { AI_TOOLS, ToolLogo } from "@/components/app/tool-logo"
import { PaintSurface } from "@/components/brand/paint"
import { useHifi } from "@/lib/hifi"
import { cn } from "@/lib/utils"
import type { Answer, AnswerIcon, NeedsItem, NeedsQueue, Source } from "./needs-model"
import { ThreadChip } from "./hifi-kit"
import { pigmentOf, threadOfRow } from "./hifi-model"
import { useStackLook } from "./needs-stack"
import { Illo } from "@/components/brand/illo/pieces"

// Needs you, one at a time: the faces of what's left with the current one ringed, the item's sentence,
// its two sides, and the answers. Skip sends it to the back. Clicking the sentence opens the detail.
// Compact is the thread page's side panel: smaller, the sides stacked, the reasons left to the detail.
// How the painted pieces behind sit: their rough edges stay under the card, only a little shows on the right and below.
// They sit on the bottom and follow the card's height only once it has settled, so the motion never waits on a repaint.
// The number is how much shorter than the card each piece is.
const TUCK: Record<"two" | "one" | "tilt", [string, number][]> = {
  two: [["left-4 -right-2.5 -bottom-2 rotate-[0.6deg]", 8], ["left-8 -right-1 -bottom-4 -rotate-[0.6deg]", 8]],
  one: [["left-4 -right-2.5 -bottom-2.5 rotate-[0.8deg]", 6]],
  tilt: [["left-8 -right-2 -bottom-1.5 rotate-[1.4deg]", 18], ["left-8 -right-0.5 -bottom-3 rotate-[0.4deg]", 8]],
}
const LEAVE_MS = { rise: 160, fade: 120, none: 0 } as const

const ICONS: Record<AnswerIcon, ComponentType<{ className?: string }>> = { done: Check, talk: MessageCircle, write: PenLine, no: X, copy: Copy, open: ExternalLink }

// Where the item comes from: "Your Duet caught this in Claude", "Jordan shared their test".
// Small (the wireframe and beside a thread) wraps instead of cutting the words off.
function SourceLine({ source, small }: { source: Source; small?: boolean }) {
  const logo = source.tool && AI_TOOLS.includes(source.tool)
  return (
    <span className={cn("flex min-w-0", small ? "items-start gap-1.5 text-xs leading-5" : "items-center gap-2 text-sm")}>
      <PersonAvatar id={source.face} agent={source.agent} className={cn("shrink-0", small ? "size-5" : "size-6")} />
      <span className={cn("min-w-0", !small && "truncate")}>
        <span className="text-foreground">{source.who}</span>
        <span className="text-muted-foreground">
          {" "}{source.what}
          {source.tool && <>{" "}<span className="inline-flex h-lh items-center gap-[3px] whitespace-nowrap align-top">{logo && <ToolLogo tool={source.tool} className="size-3" />}{source.tool}</span></>}
        </span>
      </span>
    </span>
  )
}

// Which project and thread it belongs to: the project's mark and name, then the thread.
function Where({ project, part }: { project: string; part?: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-muted-foreground">
      <ProjectMark project={project} className="size-4" />
      <span>{projectName(project).replace(/\s*\(.*\)$/, "")}</span>
      {part && <><ChevronRight className="size-3.5 opacity-60" aria-hidden /><ThreadChip projectId={project} part={part} /></>}
    </span>
  )
}

// The answers as suggestions, not buttons: what Whyspace thinks you'll want, each one finishing the item.
// Soft chips under a "Suggested" label, the first one tinted; `note` (Skip) sits at the far right of their row.
function Suggestions({ answers, compact, pick, note }: { answers: Answer[]; compact?: boolean; pick: (a: Answer, i: number) => void; note?: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-2", compact ? "mt-4" : "mt-6")}>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles className="size-3.5" />Suggested</p>
      <div className="flex flex-wrap items-center gap-2">
        {answers.map((a, i) => {
          const Icon = ICONS[a.icon ?? "done"]
          return (
            <button key={a.label} type="button" onClick={() => pick(a, i)}
              className={cn("inline-flex items-center rounded-[var(--hifi-button-radius,0.5rem)] border transition-colors",
                compact ? "h-7 gap-1.5 px-2.5 text-xs" : "h-9 gap-2 px-3.5 text-sm",
                a.primary ? "border-primary/25 bg-primary/[0.07] text-primary hover:bg-primary/[0.12]" : "border-border bg-card text-foreground hover:bg-muted")}>
              <Icon className={compact ? "size-3.5" : "size-4"} />{a.label}
            </button>
          )
        })}
        {note && <span className="ml-auto min-w-0 pl-2">{note}</span>}
      </div>
    </div>
  )
}

// The painted pieces are heavy to draw, so they take their new colors only once the next card has arrived.
function useSettled<T>(value: T, ms: number) {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return settled
}

export function NeedsFocus({ queue, onOpen, compact }: { queue: NeedsQueue; onOpen: (item: NeedsItem) => void; compact?: boolean }) {
  const { queue: list, current: it, skip } = queue
  const [typing, setTyping] = useState<{ id: string; answer: number } | null>(null)
  const [text, setText] = useState("")
  const hifiLook = useHifi()
  const look = useStackLook()
  const [leaving, setLeaving] = useState<string | null>(null)
  const [cardH, setCardH] = useState(0)
  const pieceH = useSettled(cardH, 340) || cardH
  const measure = (el: HTMLElement | null) => {
    if (!el) return
    const ro = new ResizeObserver(() => setCardH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }
  const pieceColors = useSettled(list.slice(1, 3).map((x) => { const t = threadOfRow(x.row); return t ? pigmentOf(t) : "#d9d9d6" }).join(" "), 340).split(" ")
  // All caught up: the person leaning back, centered where the card was, the card itself gone (High-fi only, Illo draws nothing in the wireframe).
  if (!it) return queue.cleared
    ? <div className={cn("flex w-full flex-col items-center gap-3 text-center", hifiLook && !compact ? "px-8 pt-6 pb-8" : "py-4")}><Illo name="caught-up" className={compact ? "h-20" : "h-28"} /><p className="text-sm text-muted-foreground">Nothing else needs you.</p></div>
    : <p className="py-4 text-sm text-muted-foreground">Nothing waits on you.</p>

  const writing = typing?.id === it.id ? it.answers[typing.answer]?.input : undefined
  const stop = () => { setTyping(null); setText("") }
  const size = compact ? "xs" : "sm"
  // High-fi: the queue is a stack of cards, the next ones painted pieces tucked behind, each in its thread's pigment.
  const hifi = hifiLook && !compact
  const thread = threadOfRow(it.row)
  const behind = list.slice(1, look.behind === "one" ? 2 : 3)
  // Finishing or skipping a card: it lifts away first, then the next one comes up from behind.
  const finish = (done: () => void) => {
    const ms = hifi ? LEAVE_MS[look.motion] : 0
    if (!ms || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return done()
    setLeaving(it.id)
    setTimeout(() => { done(); setLeaving(null) }, ms)
  }

  return (
    <div className={cn("flex flex-col", hifi ? "gap-5" : "gap-3")}>
      <div className={cn("relative isolate", hifi && behind.length > 0 && (behind.length > 1 ? "mb-4" : "mb-2"))}>
      {hifi && pieceH > 0 && behind.map((_, i) => {
        const [place, shorter] = TUCK[look.behind][i] ?? TUCK.two[i]
        return (
          <PaintSurface key={i} color={pieceColors[i] ?? "#d9d9d6"} seed={7 + i * 5} level="soft" radius={26} opacity={i === 0 ? 0.6 : 0.38}
            style={{ height: pieceH - shorter }} className={cn("absolute! will-change-transform", i === 0 ? "z-[-1]" : "z-[-2]", place)} />
        )
      })}
      <article ref={hifi ? measure : undefined} key={hifi ? it.id : undefined} aria-label={it.title} className={cn("bg-card", hifi ? cn("rounded-[24px] px-8 pt-6 pb-8 shadow-[0_0_0_1px_oklch(0_0_0/0.05)]", look.motion !== "none" && (leaving === it.id ? `hifi-${look.motion}-out` : `hifi-${look.motion}`)) : "rounded-xl border", !hifi && (compact ? "p-4" : "px-6 pt-5 pb-6"))}>
        {/* The project and thread on the left, who raised it on the right; Skip sits at the bottom right, beside the suggestions. */}
        <div className={cn("flex items-center gap-x-3 gap-y-1", compact ? "mb-2" : "flex-wrap", hifi ? "mb-3 min-h-8 text-sm" : "mb-2 min-h-7 text-xs", "text-muted-foreground")}>
          {!compact && <Where project={it.row.project} part={thread?.part} />}
          <span className={cn("min-w-0", !compact && "ml-auto")}><SourceLine source={it.source} small /></span>
        </div>
        <button type="button" onClick={() => onOpen(it)} className={cn("block text-left hover:underline", compact ? "font-serif text-lg leading-6" : "type-heading text-balance")}>{it.title}</button>

        <div className={cn("grid gap-2.5", hifi ? "mt-5" : "mt-4", !compact && it.sides.length > 1 && "sm:grid-cols-2")}>
          {it.sides.map((s, i) => (
            <div key={i} className={cn("min-w-0 bg-muted", hifi ? "rounded-2xl px-4 py-3.5" : "rounded-lg px-3.5 py-3")}>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-sm font-medium">{s.text}</p>
              {s.note && !compact && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.note}</p>}
            </div>
          ))}
        </div>

        {writing ? (
          <form className="mt-5 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; const value = text; finish(() => { writing.run(value); stop() }) }}>
            <Input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={writing.placeholder} aria-label={writing.placeholder} className={cn("min-w-0 flex-1 basis-56 text-sm", compact ? "h-7" : "h-8")} />
            <Button type="submit" size={size} disabled={!text.trim()}>{writing.save}</Button>
            <Button type="button" size={size} variant="ghost" className="text-muted-foreground" onClick={stop}>Cancel</Button>
          </form>
        ) : (
          <Suggestions answers={it.answers} compact={compact} note={list.length > 1 ? <Button variant="ghost" size={size} className="text-muted-foreground" onClick={() => finish(() => { skip(it.id); stop() })}>Skip</Button> : undefined} pick={(a, i) => (a.input ? (setTyping({ id: it.id, answer: i }), setText("")) : finish(() => a.run?.()))} />
        )}
      </article>
      </div>
    </div>
  )
}
