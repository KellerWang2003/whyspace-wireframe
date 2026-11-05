import { Radio } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/app/app-shell"
import { PROJECTS, SESSIONS } from "@/data"
import { useRoute } from "@/lib/router"
import { Project } from "@/screens/project"
import { HomeB, type HomeTab } from "./home"
import { ThreadPage, type ThreadTab } from "./thread-page"
import { useAnyThread } from "./threads"

// Design B's project routes:
//   /p/<id>/home | tasks | decisions(/<decision>) | artifacts(/<artifact>)   Home and its tabs
//   /p/<id>/t/<thread>(/decisions | /artifacts(/<artifact>))                 a thread, opens on Tasks
// Workshops and settings are the same pages as in Design A.
export function ProjectB() {
  const [, id, asked = "home", a, b, c] = useRoute()
  const project = PROJECTS.find((p) => p.id === id) ?? PROJECTS[0]
  const thread = useAnyThread(project.id, asked === "t" ? a : undefined)
  if (asked === "sessions" || asked === "settings") return <Project id={project.id} section={asked} sub={a} />

  const live = SESSIONS.find((s) => s.project === project.id && s.status === "Live")
  const actions = live && (
    <Badge asChild variant="secondary" className="gap-1.5 font-normal">
      <a href={`#/p/${project.id}/sessions/${live.id}`}><Radio className="size-3" />Live · {live.title}</a>
    </Badge>
  )
  const home = { label: project.name, to: `/p/${project.id}/home` }

  if (asked === "t") {
    const tab: ThreadTab = b === "decisions" || b === "artifacts" ? b : "tasks"
    return (
      <AppShell crumbs={[home, { label: thread?.name ?? "Thread" }]} actions={actions}>
        <ThreadPage key={`${project.id}/${a}`} project={project} threadId={a ?? ""} tab={tab} sub={c} />
      </AppShell>
    )
  }

  // Catch up, Ask and Overview became Home; old links still land there.
  const tab: HomeTab = asked === "tasks" || asked === "decisions" || asked === "artifacts" ? asked : "home"
  return (
    <AppShell crumbs={[home, { label: tab === "home" ? "Home" : tab[0].toUpperCase() + tab.slice(1) }]} actions={actions}>
      <HomeB key={project.id} project={project} tab={tab} sub={a} />
    </AppShell>
  )
}
