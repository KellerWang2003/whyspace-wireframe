import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { PersonAvatar } from "@/components/app/person"
import { StatusIcon } from "@/components/app/status-badge"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Project } from "@/data"
import { ArtifactPicture } from "@/playground/artifact"
import { buildModel } from "@/playground/model"
import { DecisionSheet, FocusView } from "@/playground/panels"
import { HubsView } from "@/playground/views"

// A project's Artifacts page: every piece of work (prototypes, designs, repos, docs, decks,
// AI outputs), grouped by part. Opening one shows the focus view with its decisions beside it.
export function ProjectArtifacts({ project }: { project: Project }) {
  const m = buildModel(project.id)
  const [part, setPart] = useState("all")
  const [view, setView] = useState<"grid" | "hubs">("grid")
  const [decision, setDecision] = useState<string | null>(null)
  const [artifact, setArtifact] = useState<string | null>(null)
  const parts = m.parts.filter((p) => part === "all" || p.name === part)

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-auto p-8 [contain:inline-size]">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Artifacts</h1>
          <p className="text-sm text-muted-foreground">{m.artifacts.length} pieces of work in {project.name}. Open one to see the decisions behind it.</p>
        </div>
        <Button size="sm" onClick={() => toast("Add an artifact: paste a link or connect a tool")}><Plus />Add artifact</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup type="single" variant="outline" size="sm" value={part} onValueChange={(v) => v && setPart(v)}>
          <ToggleGroupItem value="all" className="px-3">All parts</ToggleGroupItem>
          {m.parts.map((p) => <ToggleGroupItem key={p.name} value={p.name} className="px-3">{p.name}</ToggleGroupItem>)}
        </ToggleGroup>
        <ToggleGroup type="single" variant="outline" size="sm" value={view} onValueChange={(v) => v && setView(v as "grid" | "hubs")} className="ml-auto">
          <ToggleGroupItem value="grid" className="px-3">Grid</ToggleGroupItem>
          <ToggleGroupItem value="hubs" className="px-3">With decisions</ToggleGroupItem>
        </ToggleGroup>
      </div>
      {view === "hubs" ? (
        <HubsView m={{ ...m, parts }} onDecision={setDecision} onArtifact={setArtifact} />
      ) : (
        parts.map((p) => {
          const arts = m.artifacts.filter((a) => a.part === p.name)
          if (!arts.length) return null
          return (
            <section key={p.name} className="space-y-3">
              <h2 className="text-sm font-medium">{p.name} <span className="font-normal text-muted-foreground">· {arts.length}</span></h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
                {arts.map((a) => {
                  const ds = m.decisionsOf(a)
                  const latest = ds.at(-1)
                  return (
                    <button key={a.id} onClick={() => setArtifact(a.id)} className="flex flex-col overflow-hidden rounded-xl border bg-background text-left transition hover:border-foreground/40 hover:shadow-sm">
                      <div className="h-36 overflow-hidden border-b bg-muted/50"><ArtifactPicture artifact={a} /></div>
                      <div className="space-y-1.5 p-3">
                        <div className="truncate text-sm font-medium">{a.name}</div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <PersonAvatar id={a.owner} className="size-4" />
                          {a.kind} · {a.updated}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {latest ? <><StatusIcon status={latest.status} className="size-3.5 shrink-0" /><span className="truncate">{latest.title}</span></> : "No decisions yet"}
                          {ds.length > 1 && <span className="ml-auto shrink-0">+{ds.length - 1}</span>}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })
      )}
      <DecisionSheet m={m} id={decision} onClose={() => setDecision(null)} onDecision={setDecision} onArtifact={(id) => (setDecision(null), setArtifact(id))} />
      <FocusView m={m} id={artifact} onClose={() => setArtifact(null)} onDecision={setDecision} />
    </div>
  )
}
