import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { CheckPanel } from "./check"
import { listNames, nameOf, threadOf, type Handoff } from "./data"
import { asText, counts, isLive, readersOf, refLabel, useEffective, type Eff } from "./model"
import { backCall, useC } from "./state"
import { Count, Dot, Dots, Face, Faces, Readers, ThreadTagC, WhereLabel, Why } from "./ui"

// One handoff: who, what, where it landed, who read it, and its calls as marks. Opens to the calls.
// While the sender's check is on, the card is the check.
export function HandoffCard({ handoff, open: openAsked, showThread, className }: { handoff: Handoff; open?: boolean; showThread?: boolean; className?: string }) {
  const s = useC()
  const effs = useEffective(handoff)
  const live = isLive(handoff, s)
  const [toggled, setToggled] = useState<boolean | null>(null)
  const open = live || (toggled ?? openAsked ?? false)
  const n = counts(effs)
  const thread = threadOf(handoff.thread)
  const readers = live ? [] : readersOf(handoff, s.scene)

  return (
    <article className={cn("rounded-lg border bg-card", live && "border-foreground", className)}>
      <button type="button" onClick={() => !live && setToggled(!open)} className="flex w-full flex-col gap-2 px-4 py-3 text-left" aria-expanded={open}>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <Face id={handoff.from} />
            <ArrowRight className="size-3 text-muted-foreground" />
            <Faces ids={handoff.to} />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{handoff.title}</span>
          <WhereLabel where={handoff.where} detail={handoff.landed} className="hidden text-xs sm:inline-flex" />
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{handoff.day}{handoff.time && ` ${handoff.time}`}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {showThread && thread && <ThreadTagC thread={thread.id} />}
          <Dots states={effs.map((e) => e.state)} />
          <Count backed={n.backed} total={n.total} />
          {handoff.tool && <span>· {handoff.tool}</span>}
          {readers.length > 0 && <Readers readers={readers} className="ml-auto" />}
        </div>
      </button>
      {open && (
        <div className="border-t px-4 py-4">
          {live ? <CheckPanel handoff={handoff} effs={effs} /> : (
            <>
              <CallList effs={effs} handoff={handoff} />
              <CopyText handoff={handoff} effs={effs} />
            </>
          )}
        </div>
      )}
    </article>
  )
}

// The card as text, for a tool that only has a comment box.
function CopyText({ handoff, effs }: { handoff: Handoff; effs: Eff[] }) {
  const [done, setDone] = useState(false)
  const copy = () => {
    const text = asText(handoff, effs)
    navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500) }).catch(() => {})
  }
  return (
    <div className="mt-3 flex justify-end">
      <button type="button" onClick={copy} className="text-xs text-muted-foreground hover:text-foreground">{done ? "Copied" : "Copy as text"}</button>
    </div>
  )
}

// The calls, one line each, with the why after. Read in a thread, in Slack, in a doc comment, by an agent.
// A guess can be backed by whoever builds on it: tap it, say why, and it carries your face.
export function CallList({ effs, handoff, className, dense }: { effs: Eff[]; handoff?: Handoff; className?: string; dense?: boolean }) {
  const { viewer, scene } = useC()
  return (
    <ul className={cn("flex flex-col", dense ? "gap-1.5 text-[13px]" : "gap-2.5 text-sm", className)}>
      {effs.map((e) => {
        const built = e.talk?.builtOn && e.talk.builtOn.at <= scene ? e.talk.builtOn : undefined
        return (
          <li key={e.call.id} className="flex items-start gap-2.5 leading-5">
            <Dot state={e.state} className="mt-[7px]" />
            <span className="min-w-0 flex-1">
              {e.state === "guess" && handoff ? (
                <Adopt eff={e} handoff={handoff} />
              ) : (
                <>
                  <span className={cn(e.state === "took" && "text-muted-foreground line-through")}>{e.text}</span>
                  {e.state === "took" && e.ref && <span> {e.ref.call.text}</span>}
                  {" "}
                  <Why>
                    {e.state === "backed" && e.why}
                    {(e.state === "precedent" || e.state === "follows" || e.state === "took") && e.ref && <>{e.why}{e.why && " · "}{refLabel(e, viewer, handoff?.project)}</>}
                    {e.state === "clash" && e.ref && <>clashes with {nameOf(e.ref.who)}’s {e.ref.call.text.toLowerCase()}</>}
                    {e.state === "talk" && e.talk && (
                      e.talk.unsettled ? <>unsettled · {listNames(e.talk.people)}{built && <> · built on {nameOf(built.stance)}’s stance</>}</>
                      : e.talk.mode === "written" ? <>written · by {e.talk.window} · {listNames(e.talk.people)}</>
                      : <>talk · {e.talk.day} {e.talk.time} · {listNames(e.talk.people)}</>
                    )}
                    {e.state === "settled" && e.talk && <>{e.why}{e.why && " · "}settled {e.talk.day}{e.talk.mode === "written" ? "" : ` ${e.talk.time}`}</>}
                  </Why>
                </>
              )}
            </span>
            {e.by && <Face id={e.by} className="mt-0.5 size-5" />}
            {e.state === "settled" && e.talk?.outcome && <Faces ids={e.talk.outcome.backedBy} size="size-5" className="mt-0.5" />}
            {e.state === "talk" && built && <Face id={built.who} className="mt-0.5 size-5" />}
          </li>
        )
      })}
    </ul>
  )
}

function Adopt({ eff, handoff }: { eff: Eff; handoff: Handoff }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const back = (why: string) => { backCall(handoff.id, eff.call.id, why); setOpen(false); setDraft("") }
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="rounded-sm text-left hover:bg-muted">{eff.text}</button>
  return (
    <span className="flex flex-col gap-1.5">
      <span>{eff.text}</span>
      <span className="flex flex-wrap gap-1.5">
        {(eff.call.hints ?? []).map((h) => (
          <button key={h} type="button" onClick={() => back(h)} className="rounded-full border px-2.5 py-0.5 text-xs leading-5 hover:border-foreground hover:bg-muted">{h}</button>
        ))}
      </span>
      <form className="flex gap-1.5" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) back(draft.trim()) }}>
        <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setOpen(false) }} aria-label="Why" placeholder="Why…" className="h-7 min-w-0 flex-1 rounded-md border bg-background px-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
        <button type="submit" className="rounded-md border px-2 text-xs hover:bg-muted">Back it</button>
      </form>
    </span>
  )
}

// The card as receivers see it where the share landed: a Slack thread reply, a doc comment, a PR block.
// The same calls; the sender's faces say who stands behind what.
export function ReceiverCard({ handoff, className, dense }: { handoff: Handoff; className?: string; dense?: boolean }) {
  const effs = useEffective(handoff)
  const n = counts(effs)
  return (
    <div className={cn("@container rounded-md border bg-background text-foreground", dense ? "px-3 py-2.5" : "px-3.5 py-3", className)}>
      <div className="flex items-center gap-2 text-xs whitespace-nowrap text-muted-foreground">
        <Wordmark />
        <span className="min-w-0 truncate">{handoff.title}</span>
        <Count backed={n.backed} total={n.total} className="shrink-0" />
        <Dots states={effs.map((e) => e.state)} className="ml-auto hidden shrink-0 @[380px]:inline-flex" />
      </div>
      <CallList effs={effs} handoff={handoff} dense className="mt-2" />
    </div>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("font-serif text-[13px] tracking-tight text-foreground", className)}>Whyspace</span>
}
