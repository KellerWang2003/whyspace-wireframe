import { Check, ChevronDown, RotateCcw, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SCENARIOS } from "@/demo/scenarios"
import { SCENARIO, exitScenario, openScenario, setScenario } from "@/lib/scenario"

// The scenario's controls, in the desktop's menu bar: switch scenario, restart this one (everything
// lives in memory, so a reload starts it over), or exit to the prototype.

export function ScenarioBar() {
  const sc = SCENARIOS.find((x) => x.n === SCENARIO)
  if (!sc) return null
  return (
    <div className="flex shrink-0 items-center gap-1">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger title={sc.title} className="flex h-5 items-center gap-1 rounded px-1.5 outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-black/20" aria-label="Pick a scenario">
          <span className="text-neutral-500">Scenario</span><span className="tabular-nums">{sc.n}</span><ChevronDown className="size-3 text-neutral-500" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" sideOffset={6} className="w-80">
          {SCENARIOS.map((x) => (
            <DropdownMenuItem key={x.n} onSelect={() => openScenario(x.n)} className="flex items-start gap-2">
              <span className="w-4 shrink-0 text-muted-foreground tabular-nums">{x.n}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{x.title}</span>
                <span className="block text-xs text-muted-foreground">{x.who}</span>
              </span>
              {x.n === sc.n && <Check className="size-4 shrink-0" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <button type="button" aria-label="Restart scenario" title="Restart" onClick={() => setScenario(SCENARIO, "/today")} className="flex size-5 items-center justify-center rounded hover:bg-black/5"><RotateCcw className="size-3" /></button>
      <button type="button" onClick={exitScenario} title="Back to the prototype" className="flex h-5 items-center gap-1 rounded bg-black/5 px-1.5 hover:bg-black/10"><X className="size-3" />Exit</button>
    </div>
  )
}
