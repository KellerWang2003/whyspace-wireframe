import { FolderKanban, Plus, Radio } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ProjectMark } from "@/components/app/project-mark"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AppShell, PageHeader } from "@/components/app/app-shell"
import { AvatarStack, PersonAvatar } from "@/components/app/person"
import { StatusIcon } from "@/components/app/status-badge"
import { DECISIONS, PROJECTS, SESSIONS, TASKS } from "@/data"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"

// Projects as a portfolio: every project side by side, so you can catch up on
// all of them at once and then dive into one.
export function Projects() {
  const { current, setNewProjectOpen } = useStore()
  const projects = current?.example ? PROJECTS : []

  const recent = ["Today", "Yesterday", "Oct 22", "Oct 21"]
  const stats = [
    { label: "To confirm", value: DECISIONS.filter((d) => d.status === "inf").length, note: "Logged by AI tools, waiting on a person" },
    { label: "Changed this week", value: DECISIONS.filter((d) => d.status === "chg").length, note: "Decisions others may be building on" },
    { label: "Open", value: DECISIONS.filter((d) => d.status === "open").length, note: "Still need a decision" },
    { label: "Live now", value: SESSIONS.filter((s) => s.status === "Live").length, note: "Sessions you can join" },
  ]

  return (
    <AppShell crumbs={[{ label: current?.name ?? "" }, { label: "Projects" }]}>
      <div className="flex flex-1 flex-col gap-6 p-8">
        <PageHeader title="Projects" description={`Everything happening across ${current?.name}.`} />
        {projects.length === 0 ? (
          <Empty className="flex-1 border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon"><FolderKanban /></EmptyMedia>
              <EmptyTitle>No projects yet</EmptyTitle>
              <EmptyDescription>Start one with New project in the sidebar.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setNewProjectOpen(true)}><Plus />New project</Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((s) => (
                <Card key={s.label} className="cursor-pointer gap-2 py-5 transition-colors hover:bg-accent/50" onClick={() => navigate("/decisions")}>
                  <CardHeader className="px-5">
                    <CardDescription>{s.label}</CardDescription>
                    <CardTitle className="text-3xl tabular-nums">{s.value}</CardTitle>
                    <CardDescription className="text-xs">{s.note}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[34%]">Project</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>People</TableHead>
                    <TableHead className="text-right">Decisions</TableHead>
                    <TableHead>Needs a look</TableHead>
                    <TableHead className="text-right">Open tasks</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => {
                    const ds = DECISIONS.filter((d) => d.project === p.id)
                    const inf = ds.filter((d) => d.status === "inf").length
                    const chg = ds.filter((d) => d.status === "chg").length
                    const open = ds.filter((d) => d.status === "open").length
                    const fresh = ds.filter((d) => d.when && recent.includes(d.when)).length
                    const tasks = TASKS.filter((t) => t.project === p.name && t.status !== "done").length
                    const live = SESSIONS.find((s) => s.project === p.id && s.status === "Live")
                    return (
                      <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/p/${p.id}/overview`)}>
                        <TableCell className="whitespace-normal">
                          <div className="flex items-center gap-2 font-medium">
                            <ProjectMark project={p.id} className="size-5" />
                            {p.name}
                            {live && <Badge variant="secondary" className="gap-1 font-normal"><Radio />Live</Badge>}
                          </div>
                          <div className="line-clamp-1 text-xs text-muted-foreground">
                            {fresh > 0 ? `${fresh} new or changed decisions this week` : "Quiet this week"}
                          </div>
                        </TableCell>
                        <TableCell><PersonAvatar id={p.members[0]} /></TableCell>
                        <TableCell><AvatarStack ids={p.members} max={3} /></TableCell>
                        <TableCell className="text-right tabular-nums">{ds.length}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-sm tabular-nums">
                            {inf > 0 && <span className="flex items-center gap-1"><StatusIcon status="inf" />{inf}</span>}
                            {chg > 0 && <span className="flex items-center gap-1"><StatusIcon status="chg" />{chg}</span>}
                            {open > 0 && <span className="flex items-center gap-1"><StatusIcon status="open" />{open}</span>}
                            {inf + chg + open === 0 && <span className="text-muted-foreground">—</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{tasks}</TableCell>
                        <TableCell className="text-muted-foreground">{p.updated}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><StatusIcon status="inf" className="size-3.5" />Inferred, to confirm</span>
              <span className="flex items-center gap-1"><StatusIcon status="chg" className="size-3.5" />Changed</span>
              <span className="flex items-center gap-1"><StatusIcon status="open" className="size-3.5" />Open</span>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
