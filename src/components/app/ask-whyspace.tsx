import { useState } from "react"
import { ARTIFACTS, DECISIONS, PROJECTS, type Artifact } from "@/data"
import { navigate, useRoute } from "@/lib/router"
import { useStore } from "@/lib/store"
import { buildModel } from "@/playground/model"
import { Chat, FocusView } from "@/playground/panels"

// Mounted above the routes so navigating never closes the assistant or loses its conversation.
export function AskWhyspace() {
  const [first, second] = useRoute()
  const { current } = useStore()
  const [artifact, setArtifact] = useState<Artifact | null>(null)
  const project = ["p", "playground"].includes(first) ? PROJECTS.find((item) => item.id === second) : undefined
  const context = {
    scopeName: project?.name ?? current?.name ?? "your workspace",
    decisions: current?.example ? DECISIONS.filter((item) => !project || item.project === project.id) : [],
    artifacts: current?.example ? ARTIFACTS.filter((item) => !project || item.project === project.id) : [],
  }

  return <>
    <Chat m={context} onDecision={(decision) => navigate(`/p/${decision.project}/decisions/${decision.id}`)} onArtifact={setArtifact} />
    {artifact && <FocusView m={buildModel(artifact.project)} id={artifact.id} onClose={() => setArtifact(null)} onDecision={(id) => {
      navigate(`/p/${artifact.project}/decisions/${id}`)
      setArtifact(null)
    }} />}
  </>
}
