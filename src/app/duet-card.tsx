import { ThinkingLoop } from "@/components/brand/ribbons"
import { cn } from "@/lib/utils"
import { SURE_LABEL, SURE_LEVELS, type Sure } from "./duet"
import { titleOf, useDuetActivity, useDuetState } from "./duet-state"
import { SureMark } from "./sure-mark"

// Hover card for the rail's Duet tab (Tally, picked Nov 14 in #/playground/duet-card): how many decisions
// your Duet made for you today, split by how sure it was, then your latest chats with it. A chat your Duet
// is still answering sits on top and shimmers. The face is on the tab beside it, so the card doesn't repeat it.
export function DuetCard() {
  const { handled } = useDuetActivity()
  const { chats } = useDuetState()
  const today = handled.filter((h) => !h.byYou && !!h.sure && h.day === "today")
  const count = (s: Sure) => today.filter((h) => h.sure === s).length
  const shown = chats
    .filter((c) => c.msgs.length)
    .map((c) => ({ id: c.id, title: titleOf(c), working: !!c.msgs.at(-1)?.thinking }))
    .sort((a, b) => Number(b.working) - Number(a.working))
    .slice(0, 3)
  return (
    <div className="flex flex-col gap-2.5 text-sm">
      <p className="truncate">
        <span className="font-medium">Duet</span>
        {today.length > 0 && <span className="text-muted-foreground tabular-nums"> decided {today.length} today</span>}
      </p>
      {today.length > 0 && (
        <ul className="grid grid-cols-3 gap-1.5">
          {SURE_LEVELS.map((s) => (
            <li key={s} aria-label={`${SURE_LABEL[s]} ${count(s)}`} className={cn("flex flex-col gap-1.5 rounded-md bg-muted/60 px-2.5 py-2", !count(s) && "opacity-50")}>
              <span className="text-lg leading-none font-medium tabular-nums">{count(s)}</span>
              <SureMark sure={s} />
            </li>
          ))}
        </ul>
      )}
      {shown.length > 0 && (
        <ul className={cn("flex flex-col gap-1.5", today.length > 0 && "border-t pt-2.5")}>
          {shown.map((c) => (
            <li key={c.id} className="flex items-center gap-1.5 text-xs">
              {c.working && <ThinkingLoop className="-my-1 h-4 w-7 shrink-0" />}
              <span className={cn("min-w-0 truncate", c.working && "shimmer-text font-medium")}>{c.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
