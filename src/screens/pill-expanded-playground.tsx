import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectMark } from "@/components/app/project-mark"
import { PROJECTS } from "@/data"
import { useState } from "react"
import { ExpandedPanel } from "./overlay-panel"
import { LAYOUTS, checkRows, useCaught, type Layout } from "./overlay-model"

// Playground: the expanded pill in three layouts, side by side on the same caught decisions, each
// one live. "Share" opens the check in that panel, as a share in Docs or Figma would.
const WHERE = { project: "whiskr", part: "Marketing" }

export function ExpandedPillPlayground() {
  return (
    <div className="min-h-0 flex-1 overflow-auto p-4">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-sm font-medium">Expanded pill</h1>
        <p className="text-xs text-muted-foreground">Same decisions in each. One clash, three guesses, two caught. Tap a line to read the other side.</p>
      </div>
      <div className="flex flex-wrap items-start gap-6">
        {LAYOUTS.map((l, i) => <One key={l.id} index={i + 1} layout={l.id} name={l.name} note={l.note} />)}
      </div>
    </div>
  )
}

function One({ index, layout, name, note }: { index: number; layout: Layout; name: string; note: string }) {
  const [all, act] = useCaught()
  const [check, setCheck] = useState<string[] | null>(null)
  const projectName = PROJECTS.find((p) => p.id === WHERE.project)?.name
  return (
    <div className="flex w-[320px] shrink-0 flex-col gap-2">
      <div className="flex items-start gap-2 px-1">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium"><span className="mr-1.5 text-muted-foreground tabular-nums">{index}</span>{name}</div>
          <div className="text-[11px] text-muted-foreground">{note}</div>
        </div>
        <Button size="xs" variant="outline" onClick={() => setCheck(checkRows(all, WHERE).map((c) => c.id))}>Share</Button>
        <Button size="xs" variant="ghost" onClick={() => { act.reset(); setCheck(null) }}>Reset</Button>
      </div>
      {/* A strip of stand-in desktop with the panel at the pill's size. */}
      <div className="flex justify-end rounded-xl p-3" style={{ background: "linear-gradient(160deg, #e7e7e9 0%, #d3d4d8 100%)" }}>
        <section aria-label={`Expanded pill, ${name}`} className="flex h-[560px] w-[296px] flex-col overflow-hidden rounded-2xl border border-white/60 bg-background/90 shadow-xl ring-1 ring-black/5 backdrop-blur-xl">
          <ExpandedPanel
            layout={layout}
            all={all}
            act={act}
            where={WHERE}
            check={check}
            onCheckDone={() => setCheck(null)}
            header={
              <header className="flex h-11 shrink-0 items-center gap-2 border-b pr-2 pl-3">
                <span className="shrink-0 text-sm font-semibold tracking-tight" aria-label="Whyspace">Y</span>
                <span className="flex min-w-0 flex-1 items-center gap-1.5 text-xs">
                  <ProjectMark project={WHERE.project} className="size-4" />
                  <span className="truncate font-medium">{projectName?.replace(/\s*\(.*\)$/, "")}</span>
                  <span className="text-muted-foreground">/</span><span className="truncate text-muted-foreground">{WHERE.part}</span>
                  <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
                </span>
              </header>
            }
          />
        </section>
      </div>
    </div>
  )
}
