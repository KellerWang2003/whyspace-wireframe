import type { ReactNode } from "react"
import { LayoutGrid, PanelLeftClose, PanelLeftOpen, Search, Sun } from "lucide-react"
import { AccountMenuContent, WorkspaceMark } from "@/components/app/app-sidebar"
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sidebar, SidebarContent } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { setPanelCollapsed, usePanelCollapsed } from "@/app/rail-state"
import { navigate, useRoute } from "@/lib/router"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { PROJECTS_C, THREADS_C } from "./data"
import { needsYou, talkPhase, talksOfProject } from "./model"
import { useC } from "./state"
import { MarkC, ThreadDotC } from "./ui"

// Design C sidebar: the rail holds Search, Today, Projects and the project marks.
// Inside a project, a panel lists its threads and its talks. Nothing else.
export function RailSidebarC() {
  const route = useRoute()
  const s = useC()
  const { current, setSearchOpen } = useStore()
  const projects = PROJECTS_C.filter((p) => p.members.includes(s.viewer))
  const openId = route[0] === "p" ? route[1] : null
  const open = projects.find((p) => p.id === openId)
  const folded = usePanelCollapsed()
  const rows = needsYou(s)

  return (
    <Sidebar>
      <SidebarContent className="flex-row gap-0 overflow-hidden">
        <nav aria-label="Rail" className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-sidebar-border py-2">
          <RailButton label="Search" hint="⌘K" onClick={() => setSearchOpen(true)}><Search className="size-4" /></RailButton>
          <RailButton label="Today" active={route[0] === "today" || route.length === 0} badge={rows.length} onClick={() => navigate("/today")}><Sun className="size-4" /></RailButton>
          <RailButton label="Projects" active={route[0] === "projects"} onClick={() => navigate("/projects")}><LayoutGrid className="size-4" /></RailButton>
          <div className="my-1 h-px w-6 shrink-0 bg-sidebar-border" />
          <div className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto">
            {projects.map((p) => {
              const n = rows.filter((r) => (r.kind === "talk" || r.kind === "stance" ? r.talk.project : r.handoff.project) === p.id).length
              return (
                <RailButton key={p.id} label={p.name} active={p.id === openId} badge={n} onClick={() => navigate(`/p/${p.id}`)}>
                  <MarkC project={p.id} />
                </RailButton>
              )
            })}
          </div>
          {open && folded && <RailButton label="Expand sidebar" onClick={() => setPanelCollapsed(false)}><PanelLeftOpen className="size-4 text-muted-foreground" /></RailButton>}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Account" className="mt-1 flex size-9 items-center justify-center rounded-lg hover:bg-sidebar-accent">
                <WorkspaceMark name={current?.name} className="size-7 text-sm" />
              </button>
            </DropdownMenuTrigger>
            <AccountMenuContent side="right" align="end" />
          </DropdownMenu>
        </nav>

        {open && !folded && (
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <div className="mb-2 flex h-9 items-center pl-2">
                <button type="button" onClick={() => navigate(`/p/${open.id}`)} className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:underline">{open.name}</button>
              </div>
              <ul className="flex flex-col gap-0.5">
                {THREADS_C.filter((t) => t.project === open.id).map((t) => {
                  const active = route[2] === "t" && route[3] === t.id
                  const n = rows.filter((r) => r.kind !== "talk" && r.kind !== "stance" && r.handoff.thread === t.id).length
                  return (
                    <li key={t.id}>
                      <button type="button" onClick={() => navigate(`/p/${open.id}/t/${t.id}`)} className={cn("flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm hover:bg-sidebar-accent", active && "bg-sidebar-accent")}>
                        <ThreadDotC thread={t.id} />
                        <span className="min-w-0 flex-1 truncate">{t.name}</span>
                        {n > 0 && <span className="text-xs tabular-nums">{n}</span>}
                      </button>
                    </li>
                  )
                })}
                {talksOfProject(open.id, s).length > 0 && (
                  <li className="mt-2">
                    <ul className="flex flex-col gap-0.5">
                      {talksOfProject(open.id, s).filter((t) => talkPhase(t, s) !== "done").map((t) => {
                        const active = route[2] === "talks" && route[3] === t.id
                        const live = talkPhase(t, s) === "live"
                        return (
                          <li key={t.id}>
                            <button type="button" onClick={() => navigate(`/p/${open.id}/talks/${t.id}`)} className={cn("flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm hover:bg-sidebar-accent", active && "bg-sidebar-accent")}>
                              <span className={cn("size-2 shrink-0 rounded-full border border-foreground", live && "bg-foreground")} />
                              <span className="min-w-0 flex-1 truncate">{t.title}</span>
                              <span className="text-xs text-muted-foreground tabular-nums">{live ? "Live" : `${t.day} ${t.time}`}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                )}
              </ul>
            </div>
            <div className="flex justify-end p-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => setPanelCollapsed(true)} aria-label="Collapse sidebar" className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                    <PanelLeftClose className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Collapse sidebar</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}

function RailButton({ label, hint, active, badge, onClick, children }: { label: string; hint?: string; active?: boolean; badge?: number; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          aria-label={label}
          aria-current={active ? "page" : undefined}
          className={cn("relative flex size-9 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring", active && "bg-sidebar-accent")}
        >
          {active && <span aria-hidden className="absolute top-2 -left-1.5 h-5 w-1 rounded-r-full bg-foreground" />}
          {children}
          {badge ? <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] tabular-nums text-background">{badge}</span> : null}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}{hint && <span className="ml-1.5 opacity-60">{hint}</span>}</TooltipContent>
    </Tooltip>
  )
}
