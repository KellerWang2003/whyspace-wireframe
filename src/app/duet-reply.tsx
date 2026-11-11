import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { PersonAvatar } from "@/components/app/person"
import { StatusIcon } from "@/components/app/status-badge"
import { Button } from "@/components/ui/button"
import { ME, decisionById, projectName } from "@/data"
import { useHifi } from "@/lib/hifi"
import { cn } from "@/lib/utils"
import { useStatusOf } from "@/lib/work"
import { SURE_LABEL, type Sure } from "./duet"
import { first } from "./duet-state"
import { ThreadChip } from "./hifi-kit"
import { pigmentOf } from "./hifi-model"
import { SureMark } from "./sure-mark"
import { threadOf } from "./threads"
import { isAway, type ChatMsg } from "./chats-model"

// A Duet's reply, folded under the question it answered (Keller's pick, Nov 11, from
// #/playground/fold/10): one line, "Responded by your Duet" and the gist, with a short painted strand in
// the color of the thread its decision lives in. Opening it shows why: what the Duet said, the decision it
// spoke from and that decision's why, how sure it was, and why it answered at all. The strand then runs
// down the whole reply.

const duetName = (owner: string, lower = false) => (owner === ME.id ? (lower ? "your Duet" : "Your Duet") : `${first(owner)}’s Duet`)
const whose = (owner: string) => (owner === ME.id ? "Your" : `${first(owner)}’s`)
const SURE_WHY: Record<Sure, string> = { sure: "decision says this outright.", fairly: "decision covers a similar case.", unsure: "decision covers something close, not this exactly." }
const firstSentence = (t: string) => t.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? t

// Why the Duet spoke for its person.
function awayOf(r: ChatMsg) {
  if (r.who === ME.id) return "You were away."
  return isAway(r.who) ? `${first(r.who)} is away.` : `${first(r.who)} was away.`
}

// A loose hand-drawn strand, top to bottom.
const STRAND = "M2 0 C 3.2 18, 0.8 34, 2 50 S 3.2 82, 2 100"

// `onChange`: quote the question, to correct your Duet or ask its person.
export function DuetReply({ reply, onChange }: { reply: ChatMsg; onChange: () => void }) {
  const hifi = useHifi()
  const [open, setOpen] = useState(false)
  const d = decisionById(reply.from)
  const thread = d && threadOf(d.project, d.part)
  const color = hifi && thread ? pigmentOf(thread) : "var(--border)"
  // No decision to answer from: the Duet passed the question on. Your own shows as "Waiting for you"
  // on the question instead, so only a teammate's is drawn, and there's nothing to open.
  if (!d) {
    if (reply.who === ME.id) return null
    return (
      <Strand color={color}>
        <span className="flex max-w-full items-center gap-2 py-0.5 text-xs">
          <PersonAvatar id={reply.who} agent className="size-5" />
          <span className="shrink-0 font-medium">Responded by {duetName(reply.who, true)}</span>
          <span className="min-w-0 truncate text-muted-foreground">Passed it to {first(reply.who)}.</span>
        </span>
      </Strand>
    )
  }
  const gist = firstSentence(reply.text)
  const sure = reply.sure ?? "sure"
  return (
    <Strand color={color}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="-ml-1 flex max-w-full items-center gap-2 rounded-md py-0.5 pr-2 pl-1 text-left text-xs hover:bg-muted/60">
        <PersonAvatar id={reply.who} agent className="size-5" />
        <span className="shrink-0 font-medium">Responded by {duetName(reply.who, true)}</span>
        <span className="min-w-0 truncate text-muted-foreground">{gist}</span>
        {open ? <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="mt-1 flex w-full max-w-xl flex-col gap-3 pl-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium">{duetName(reply.who)}</span>
            {reply.time && <span className="text-xs text-muted-foreground tabular-nums">{reply.time}</span>}
          </div>
          {reply.text !== gist && <p className="text-sm leading-relaxed whitespace-pre-wrap">{reply.text}</p>}
          <dl className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-2.5 text-sm">
            <dt className="pt-0.5 type-label text-muted-foreground">From</dt>
            <dd className="flex min-w-0 flex-col gap-1">
              <DecisionLine id={d.id} />
              {d.why && <p className="pl-5.5 text-xs leading-relaxed text-muted-foreground">{d.why}</p>}
            </dd>
            <dt className="pt-0.5 type-label text-muted-foreground">How sure</dt>
            <dd className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-2"><SureMark sure={sure} />{SURE_LABEL[sure]}</span>
              <span className="text-xs text-muted-foreground">{whose(reply.who)} {SURE_WHY[sure]}</span>
            </dd>
            <dt className="pt-0.5 type-label text-muted-foreground">Why it answered</dt>
            <dd>{awayOf(reply)}</dd>
          </dl>
          <div className="pb-1">
            <Button size="xs" variant="outline" className="bg-background" onClick={onChange}>{reply.who === ME.id ? "Change answer" : `Ask ${first(reply.who)}`}</Button>
          </div>
        </div>
      )}
    </Strand>
  )
}

function Strand({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="relative w-full pl-3">
      <svg viewBox="0 0 4 100" preserveAspectRatio="none" className="absolute top-0.5 left-0 h-[calc(100%-4px)] w-1" aria-hidden>
        <path d={STRAND} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {children}
    </div>
  )
}

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
