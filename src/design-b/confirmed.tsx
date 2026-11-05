import { DECISIONS, type Decision } from "@/data"
import { useConfirmed } from "@/lib/work"
import { cn } from "@/lib/utils"

// "n of m confirmed" next to a thread or a piece of work. `short` drops the word for tight rows.
export function ConfirmedCount({ decisions, short, className }: { decisions: Decision[]; short?: boolean; className?: string }) {
  const { n, m } = useConfirmed(decisions)
  if (!m) return null
  return <span className={cn("shrink-0 text-xs text-muted-foreground tabular-nums", className)}>{n} of {m}{short ? "" : " confirmed"}</span>
}

export function ThreadCount({ projectId, part, short, className }: { projectId: string; part: string; short?: boolean; className?: string }) {
  return <ConfirmedCount decisions={DECISIONS.filter((d) => d.project === projectId && d.part === part)} short={short} className={className} />
}
