import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { PersonAvatar } from "@/components/app/person"
import { StatusIcon } from "@/components/app/status-badge"
import { ME, decisionById, projectName } from "@/data"
import { askWhyspace } from "@/lib/ask"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { useStatusOf } from "@/lib/work"
import { cn } from "@/lib/utils"
import type { DuetLine } from "./duet"
import { first, useDuetActivity, type Handled } from "./duet-state"

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Asked: teammates' questions your Duet could not answer, waiting on you. Handled: what it told
// people from your decisions and what it took from precedent. The panel shows a few lines
// (`compact`); the page shows them all, Earlier folded.
export function DuetSide({ projectId, compact, className }: { projectId?: string; compact?: boolean; className?: string }) {
  const { asked, handled } = useDuetActivity(projectId)
  const { openDecision } = useStore()
  const statusOf = useStatusOf()
  // A question a guess of yours would answer opens that decision to confirm; any other goes to the conversation.
  const answer = (l: DuetLine) => (l.decision ? openDecision(l.decision) : askWhyspace(`${first(l.who)} asked ${l.text}. What should I say?`, l.id))
  const recent = handled.filter((h) => h.day !== "earlier")
  const earlier = handled.filter((h) => h.day === "earlier")
  const shown = compact ? handled.slice(0, 3) : recent
  const row = (h: Handled) => {
    const d = decisionById(h.decision)
    return (
      <li key={h.id}>
        <button type="button" disabled={!d} onClick={() => d && openDecision(d.id)} className={cn("flex w-full gap-2.5 rounded-md px-2 py-1.5 text-left text-sm enabled:hover:bg-muted/50", compact ? "items-center" : "items-start")}>
          <PersonAvatar id={ME.id} agent className="size-5" />
          <span className={cn("min-w-0 flex-1", compact && "truncate")}>{cap(h.text)}</span>
          {d && <StatusIcon status={statusOf(d)} className={cn("size-3 shrink-0 text-muted-foreground", !compact && "mt-1")} />}
          <span className={cn("shrink-0 text-xs text-muted-foreground tabular-nums", !compact && "leading-5")}>{h.when}</span>
        </button>
      </li>
    )
  }

  if (!asked.length && !handled.length) return compact ? null : <p className={cn("text-sm text-muted-foreground", className)}>Nothing yet. It answers teammates from the decisions you confirm.</p>
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {asked.length > 0 && (
        <section aria-label="Asked" className="flex flex-col gap-1.5">
          <h3 className="flex items-center gap-2 px-2 type-label text-muted-foreground">Asked<span className="tabular-nums">{asked.length}</span></h3>
          <ul className="flex flex-col">
            {asked.map((l) => (
              <li key={l.id} className={cn("flex gap-2.5 rounded-md px-2 py-1.5 text-sm", compact ? "items-center" : "items-start")}>
                <PersonAvatar id={l.who} className="size-5" />
                <span className={cn("min-w-0 flex-1", compact && "truncate")}>{first(l.who)} asked {l.text}{!projectId && <span className="text-muted-foreground"> · {projectName(l.project)}</span>}</span>
                <Button size="xs" variant="outline" onClick={() => answer(l)}>Answer</Button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {handled.length > 0 && (
        <section aria-label="Handled" className="flex flex-col gap-1.5">
          <h3 className="px-2 type-label text-muted-foreground">Handled</h3>
          <ul className="flex flex-col">{shown.map(row)}</ul>
          {compact
            ? handled.length > shown.length && <button type="button" onClick={() => navigate("/duet")} className="px-2 py-1 text-left text-xs text-muted-foreground hover:text-foreground">All {handled.length}</button>
            : earlier.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger className="group flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />Earlier<span className="tabular-nums">{earlier.length}</span>
                </CollapsibleTrigger>
                <CollapsibleContent><ul className="flex flex-col">{earlier.map(row)}</ul></CollapsibleContent>
              </Collapsible>
            )}
        </section>
      )}
    </div>
  )
}
