import { DecisionPlayground } from "@/screens/decision-playground"
import { useState, type ReactNode } from "react"
import { SectionPlayground } from "@/playground/section-playground"
import { SECTION_LAYOUTS } from "@/components/decisions/section-model"
import { AppShell } from "@/components/app/app-shell"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PROJECTS } from "@/data"
import { navigate } from "@/lib/router"
import { buildModel } from "@/playground/model"
import { DecisionSheet, FocusView } from "@/playground/panels"
import { BoardView, TreeView, type ViewProps } from "@/playground/views"

// Prototype playground: a few ways to draw the same decisions, side by side, so we can pick.
// Every view shares the decision sheet, the artifact focus view and the bottom-right chat.
const VIEWS: [string, string, (p: ViewProps) => ReactNode][] = [
  ["board", "Board by parts", BoardView],
  ["tree", "Decision tree", TreeView],
]

export function Playground({ project = "platiful", view = "board" }: { project?: string; view?: string }) {
  if (project === "decisions") return <DecisionPlayground />
  if (SECTION_LAYOUTS.some(([id]) => id === view) || ["columns", "bands", "expand", "outline"].includes(view)) return <SectionPlayground />
  // Keyed by project so open sheets and chat history reset when you switch.
  return <PlaygroundFor key={project} project={project} view={view} />
}

function PlaygroundFor({ project, view }: { project: string; view: string }) {
  const m = buildModel(project)
  const [decision, setDecision] = useState<string | null>(null)
  const [artifact, setArtifact] = useState<string | null>(null)
  const View = (VIEWS.find(([id]) => id === view) ?? VIEWS[0])[2]
  const go = (p: string, v: string) => navigate(`/playground/${p}/${v}`)

  return (
    <AppShell
      crumbs={[{ label: "Prototype" }, { label: "Decision views playground" }]}
      actions={
        <ToggleGroup type="single" variant="outline" size="sm" value={m.project.id} onValueChange={(v) => v && go(v, view)}>
          {PROJECTS.map((p) => <ToggleGroupItem key={p.id} value={p.id} className="px-3">{p.name}</ToggleGroupItem>)}
        </ToggleGroup>
      }
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden p-4 [contain:inline-size]">
        <button className="w-fit text-xs text-muted-foreground underline underline-offset-4" onClick={() => navigate("/playground/platiful/canvas")}>Explore the section map and outline →</button>
        <Tabs value={view} onValueChange={(v) => go(m.project.id, v)}>
          <TabsList>
            {VIEWS.map(([id, label], i) => <TabsTrigger key={id} value={id}><span className="text-muted-foreground">{i + 1}</span>{label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <div className="min-h-0 flex-1">
          <View m={m} onDecision={setDecision} onArtifact={setArtifact} />
        </div>
      </div>
      <DecisionSheet m={m} id={decision} onClose={() => setDecision(null)} onDecision={setDecision} onArtifact={(id) => (setDecision(null), setArtifact(id))} />
      <FocusView m={m} id={artifact} onClose={() => setArtifact(null)} onDecision={setDecision} />
    </AppShell>
  )
}
