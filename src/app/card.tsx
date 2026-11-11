import { useState } from "react"
import { toast } from "sonner"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PersonAvatar } from "@/components/app/person"
import { MarkIcon, StatusIcon } from "@/components/app/status-badge"
import { ME, type Artifact, type Decision } from "@/data"
import { markOf } from "@/lib/marks"
import { useStore } from "@/lib/store"
import { useConfirmed, useStatusOf, useWithdrawn } from "@/lib/work"
import { cn } from "@/lib/utils"
import { useHifi } from "@/lib/hifi"
import { ThreadChip } from "./hifi-kit"
import { pigmentOf } from "./hifi-model"
import { threadOf } from "./threads"
import { cardText, tailOf } from "./card-model"

// One card per piece of work: the decisions in it, a mark on each, who stands behind it, one why.
// The tile shows the marks in a row; the sheet shows the whole card; Copy as text gives the same
// card to a Slack reply, a doc comment or a pull request where there is no adapter.

// A row of marks, one per decision, with the count. On tiles and in headers.
export function MarksRow({ decisions: all, className }: { decisions: Decision[]; className?: string }) {
  const statusOf = useStatusOf()
  const withdrawn = useWithdrawn()
  const decisions = all.filter((d) => !withdrawn(d))
  const { n, m } = useConfirmed(decisions)
  if (!m) return null
  return (
    <span className={cn("flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums", className)}>
      <span className="flex items-center gap-0.5">{decisions.map((d) => <MarkIcon key={d.id} mark={markOf(statusOf(d))} className="size-3" />)}</span>
      {n} of {m} confirmed
    </span>
  )
}

// The whole card: one line per decision, the why after it, the face of who stands behind it.
// A guess of yours can be confirmed here; it carries your face from then on.
// High-fi (Keller's pick, Nov 11): a paper card with a faint ring, its header washed in the thread's pigment.
// `title` names the work in the header (the design system); in a work's own panel the header just says Decisions.
export function DecisionCard({ artifact, decisions: all, title, className }: { artifact: Artifact; decisions: Decision[]; title?: string; className?: string }) {
  const hifi = useHifi()
  const { openDecision, confirmDecision } = useStore()
  const statusOf = useStatusOf()
  const withdrawn = useWithdrawn()
  const decisions = all.filter((d) => !withdrawn(d))
  const { n, m } = useConfirmed(decisions)
  const [copied, setCopied] = useState(false)
  const copy = () => {
    try { void navigator.clipboard?.writeText(cardText(artifact, decisions, statusOf, n)) } catch { /* clipboard blocked */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  const rows = decisions.map((d) => {
    const status = statusOf(d)
    const guess = status === "inf" || status === "open"
    return (
      <li key={d.id} className="flex items-start gap-2.5 leading-5">
        <StatusIcon status={status} className="mt-[3px] size-3.5 shrink-0" />
        <span className="min-w-0 flex-1">
          <button type="button" onClick={() => openDecision(d.id)} className="text-left hover:underline">{d.title}</button>
          {" "}<span className="text-muted-foreground">{tailOf(d, status)}</span>
        </span>
        {status !== "open" && <PersonAvatar id={d.owner} agent={guess && !!d.tool} className="mt-0.5 size-5" />}
        {status === "inf" && d.owner === ME.id && (
          <Button size="xs" onClick={() => { confirmDecision(d.id); toast("Decision confirmed") }}><Check />Confirm</Button>
        )}
      </li>
    )
  })
  if (hifi) {
    const pigment = pigmentOf(threadOf(artifact.project, artifact.part))
    return (
      <section data-decision-card className={cn("overflow-hidden rounded-[24px] shadow-[0_0_0_1px_oklch(0_0_0/0.05)]", className)}>
        <header className="flex items-center gap-3 px-5 pt-4 pb-3.5" style={{ background: `color-mix(in oklab, ${pigment} 14%, var(--background))` }}>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {title && <ThreadChip projectId={artifact.project} part={artifact.part} className="text-xs" />}
            <h3 className="type-heading truncate">{title ?? "Decisions"}</h3>
          </div>
          {m > 0 && <span className="text-xs text-muted-foreground tabular-nums">{n} of {m} confirmed</span>}
          {m > 0 && <button type="button" onClick={copy} className="text-xs text-muted-foreground hover:text-foreground">{copied ? "Copied" : "Copy as text"}</button>}
        </header>
        {m === 0 ? <p className="px-5 pt-4 pb-5 text-sm text-muted-foreground">None yet</p> : <ul className="flex flex-col gap-3 px-5 pt-4 pb-5 text-sm">{rows}</ul>}
      </section>
    )
  }
  return (
    <section className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex items-center gap-2">
        <h3 className="type-label text-muted-foreground">Decisions</h3>
        {m > 0 && <span className="text-xs text-muted-foreground tabular-nums">{n} of {m} confirmed</span>}
        {m > 0 && <button type="button" onClick={copy} className="ml-auto text-xs text-muted-foreground hover:text-foreground">{copied ? "Copied" : "Copy as text"}</button>}
      </div>
      {m === 0 ? <p className="text-sm text-muted-foreground">None yet</p> : (
        <ul className="flex flex-col gap-2.5 text-sm">
          {decisions.map((d) => {
            const status = statusOf(d)
            const guess = status === "inf" || status === "open"
            return (
              <li key={d.id} className="flex items-start gap-2.5 leading-5">
                <StatusIcon status={status} className="mt-[3px] size-3.5 shrink-0" />
                <span className="min-w-0 flex-1">
                  <button type="button" onClick={() => openDecision(d.id)} className="text-left hover:underline">{d.title}</button>
                  {" "}<span className="text-muted-foreground">{tailOf(d, status)}</span>
                </span>
                {status !== "open" && <PersonAvatar id={d.owner} agent={guess && !!d.tool} className="mt-0.5 size-5" />}
                {status === "inf" && d.owner === ME.id && (
                  <Button size="xs" onClick={() => { confirmDecision(d.id); toast("Decision confirmed") }}><Check />Confirm</Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
