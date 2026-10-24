import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Project } from "@/data"
import { navigate } from "@/lib/router"
import { buildModel, isAI, isNew, LAST_VISIT } from "@/playground/model"
import { Chat, DecisionSheet, FocusView } from "@/playground/panels"
import { BoardView, TreeView } from "@/playground/views"

// A project's Decisions page. Board by parts is the main view: each part reads top to bottom as
// what changed since you were here, what's open, its artifacts, then its decision tree.
// The Decision tree tab is the nested-sections canvas (its look is still being refined).
// Chat is never in the page: the bottom-right button opens it as a floating panel or a sidebar.
export function ProjectDecisions({ project, selectedId }: { project: Project; selectedId?: string }) {
  const m = buildModel(project.id)
  const [view, setView] = useState<"board" | "tree">("board")
  const [artifact, setArtifact] = useState<string | null>(null)
  const base = `/p/${project.id}/decisions`
  const open = (id: string | null) => navigate(id ? `${base}/${id}` : base)
  const fresh = m.decisions.filter(isNew)
  const toConfirm = m.decisions.filter(isAI).length
  const stillOpen = m.decisions.filter((d) => d.status === "open").length

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden p-6 [contain:inline-size]">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Decisions</h1>
          <p className="text-sm text-muted-foreground">
            Since Oct {LAST_VISIT}: {fresh.length} new decisions, {toConfirm} from AI tools to confirm, {stillOpen} still open.
          </p>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as "board" | "tree")}>
          <TabsList>
            <TabsTrigger value="board">Board by parts</TabsTrigger>
            <TabsTrigger value="tree">Decision tree</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="min-h-0 flex-1">
        {view === "board" ? <BoardView m={m} onDecision={open} onArtifact={setArtifact} /> : <TreeView m={m} onDecision={open} onArtifact={setArtifact} />}
      </div>
      <DecisionSheet m={m} id={selectedId ?? null} onClose={() => open(null)} onDecision={open} onArtifact={(id) => (open(null), setArtifact(id))} />
      <FocusView m={m} id={artifact} onClose={() => setArtifact(null)} onDecision={open} />
      <Chat m={m} onDecision={open} onArtifact={setArtifact} />
    </div>
  )
}
