import { useState } from "react"
import { Check, ChevronDown, RotateCcw } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"
import { SCENARIOS } from "./scenarios"
import { DemoApp } from "./s1/app"
import { DemoDesk } from "./s1/desk"
import { useScenario1 } from "./s1/model"
import { DemoApp2 } from "./s2/app"
import { DemoDesk2 } from "./s2/desk"
import { useScenario2 } from "./s2/model"
import { DemoApp3 } from "./s3/app"
import { useScenario3 } from "./s3/model"
import { DemoApp4 } from "./s4/app"
import { DemoDesk4 } from "./s4/desk"
import { useScenario4 } from "./s4/model"

// Test scenarios: a demo page of its own, apart from the prototype's data and screens. One scenario
// at a time, picked from the bar at the bottom. #/demo/1 opens scenario 1. The list lives in
// scenarios.ts, which the debug panel reads too.

export function Demo({ scenario }: { scenario?: string }) {
  const n = SCENARIOS.some((x) => x.n === Number(scenario)) ? Number(scenario) : 1
  const sc = SCENARIOS.find((x) => x.n === n)!
  // Restart remounts the scenario, which drops its state.
  const [run, setRun] = useState(0)
  return (
    <div className="relative h-svh w-full overflow-hidden bg-background text-foreground">
      {sc.built ? <Running key={`${n}-${run}`} n={n} /> : <Placeholder title={sc.title} who={sc.who} />}
      <div className="fixed bottom-3 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-1 rounded-full bg-neutral-900/85 p-1 text-[12px] text-white shadow-lg backdrop-blur select-none">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className="flex h-7 items-center gap-1 rounded-full px-3 outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60" aria-label="Pick a scenario">
            <span className="text-white/60">Scenario</span><span className="tabular-nums">{n}</span><ChevronDown className="size-3.5 text-white/60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-80">
            {SCENARIOS.map((x) => (
              <DropdownMenuItem key={x.n} onSelect={() => navigate(`/demo/${x.n}`)} className="flex items-start gap-2">
                <span className="w-4 shrink-0 text-muted-foreground tabular-nums">{x.n}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{x.title}</span>
                  <span className="block text-xs text-muted-foreground">{x.who}{!x.built && " · coming next"}</span>
                </span>
                {x.n === n && <Check className="size-4 shrink-0" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="min-w-0 truncate px-1" title={sc.title}>{sc.title}</span>
        <button type="button" aria-label="Restart scenario" title="Restart" onClick={() => setRun((r) => r + 1)} className={cn("flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-white/15", !sc.built && "invisible")}><RotateCcw className="size-3.5" /></button>
      </div>
    </div>
  )
}

function Running({ n }: { n: number }) {
  if (n === 2) return <Scenario2 />
  if (n === 3) return <Scenario3 />
  if (n === 4) return <Scenario4 />
  return <Scenario1 />
}

function Scenario1() {
  const [s, dispatch] = useScenario1()
  return s.surface === "desk" ? <DemoDesk s={s} dispatch={dispatch} /> : <DemoApp s={s} dispatch={dispatch} />
}

function Scenario2() {
  const [s, dispatch] = useScenario2()
  return s.surface === "desk" ? <DemoDesk2 s={s} dispatch={dispatch} /> : <DemoApp2 s={s} dispatch={dispatch} />
}

function Scenario3() {
  const [s, dispatch] = useScenario3()
  return <DemoApp3 s={s} dispatch={dispatch} />
}

function Scenario4() {
  const [s, dispatch] = useScenario4()
  return s.surface === "desk" ? <DemoDesk4 s={s} dispatch={dispatch} /> : <DemoApp4 s={s} dispatch={dispatch} />
}

function Placeholder({ title, who }: { title: string; who: string }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <p className="type-title">{title}</p>
        <p className="mt-2 text-sm text-muted-foreground">{who} · coming next</p>
      </div>
    </div>
  )
}
