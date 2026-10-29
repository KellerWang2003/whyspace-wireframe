import { ARTIFACTS, DECISIONS, PROJECTS } from "@/data"
import { navigate, useRoute } from "@/lib/router"
import { useStore } from "@/lib/store"
import { Chat } from "@/playground/panels"

// Mounted above the routes so navigating never closes the assistant or loses its conversation.
export function AskWhyspace() {
  const [first, second] = useRoute()
  const { current } = useStore()
  const project = ["p", "playground"].includes(first) ? PROJECTS.find((item) => item.id === second) : undefined
  const context = {
    scopeName: project?.name ?? current?.name ?? "your workspace",
    decisions: current?.example ? DECISIONS.filter((item) => !project || item.project === project.id) : [],
    artifacts: current?.example ? ARTIFACTS.filter((item) => !project || item.project === project.id) : [],
  }

  // Artifacts open in their project's Artifacts tab, the one place they're viewed.
  return <Chat m={context} onDecision={(decision) => navigate(`/p/${decision.project}/decisions/${decision.id}`)} onArtifact={(a) => navigate(`/p/${a.project}/artifacts/${a.id}`)} />
}
