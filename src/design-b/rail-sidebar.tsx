import type { ReactNode } from "react"
import { HoverCard } from "radix-ui"
import { toast } from "sonner"
import { Archive, Blend, PanelLeftClose, PanelLeftOpen, Radio, LayoutGrid, Link2, MoreHorizontal, Plus, Search, Sun } from "lucide-react"
import { AccountMenuContent, WorkspaceMark } from "@/components/app/app-sidebar"
import { ProjectMark } from "@/components/app/project-mark"
import { ProjectNewMenu } from "@/components/app/project-new-menu"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sidebar, SidebarContent } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MY_PROJECTS, PROJECTS, SESSIONS, SETTINGS_TABS, WEEK_SUMMARY } from "@/data"
import { navigate, useRoute } from "@/lib/router"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useNeedsYou } from "@/lib/work"
import { ProjectNavList } from "./sidebar"
import { setPanelCollapsed, usePanelCollapsed } from "./rail-state"
import { onToday, useTodayRows } from "./today-model"

// Design B sidebar, rail version: built for many projects with many threads.
// A thin rail always holds Search, Today, Duet, Projects and the project marks.
// The panel beside it shows only when you are in a project, and only that project.
// The rail is 48px wide (w-12); AppShell shrinks the sidebar to that outside projects.
export function RailSidebar() {
  const route = useRoute()
  const { current, setSearchOpen, setNewProjectOpen } = useStore()
  const projects = current?.example ? MY_PROJECTS : []
  const needs = useTodayRows().length
  const openId = route[0] === "p" ? route[1] : null
  const open = projects.find((p) => p.id === openId)
  const folded = usePanelCollapsed()

  return (
    <Sidebar>
      <SidebarContent className="flex-row gap-0 overflow-hidden">
        <nav aria-label="Rail" className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-sidebar-border py-2">
          <RailButton label="Search" hint="⌘K" onClick={() => setSearchOpen(true)}><Search className="size-4" /></RailButton>
          <RailButton label="Today" active={route[0] === "today" || route.length === 0} badge={needs} onClick={() => navigate("/today")}><Sun className="size-4" /></RailButton>
          <RailButton label="Duet" active={route[0] === "duet"} onClick={() => navigate("/duet")}><Blend className="size-4" /></RailButton>
          <RailButton label="Projects" active={route[0] === "projects"} onClick={() => navigate("/projects")}><LayoutGrid className="size-4" /></RailButton>
          <div className="my-1 h-px w-6 shrink-0 bg-sidebar-border" />
          <div className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto">
            {projects.map((p) => <RailProject key={p.id} id={p.id} name={p.name} active={p.id === openId} />)}
            <RailButton label="New project" onClick={() => setNewProjectOpen(true)}><Plus className="size-4 text-muted-foreground" /></RailButton>
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

        {/* The panel only exists inside a project. Universal pages get the rail alone. */}
        {open && !folded && (
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ProjectPanel id={open.id} name={open.name} route={route} />
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

// A rail icon. Shows its name on hover, or a richer `card` when given (projects).
function RailButton({ label, hint, active, badge, card, onClick, children }: { label: string; hint?: string; active?: boolean; badge?: number; card?: ReactNode; onClick: () => void; children: ReactNode }) {
  const Root = card ? HoverCard.Root : Tooltip
  const Trigger = card ? HoverCard.Trigger : TooltipTrigger
  return (
    <Root {...(card ? { openDelay: 250, closeDelay: 100 } : {})}>
      <Trigger asChild>
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
      </Trigger>
      {card ? (
        <HoverCard.Portal>
          <HoverCard.Content side="right" align="start" sideOffset={10} className="z-50 w-64 rounded-lg border bg-popover p-3 text-popover-foreground shadow-sm outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0">
            {card}
          </HoverCard.Content>
        </HoverCard.Portal>
      ) : (
        <TooltipContent side="right">{label}{hint && <span className="ml-1.5 opacity-60">{hint}</span>}</TooltipContent>
      )}
    </Root>
  )
}

function RailProject({ id, name, active }: { id: string; name: string; active: boolean }) {
  // Counts what Today lists, so a one-task test scenario shows no other work waiting.
  const needs = useNeedsYou(id).filter((n) => (n.kind === "decide" ? onToday(n.decision.id, "decision") : onToday(n.task.id, "task")))
  return (
    <RailButton label={name} active={active} badge={needs.length} card={<ProjectCard id={id} name={name} needs={needs} />} onClick={() => navigate(`/p/${id}/home`)}>
      <ProjectMark project={id} className="size-6" />
    </RailButton>
  )
}

// Hover card for a rail project: a glance at what's new, not a page. Empty projects say so.
function ProjectCard({ id, name, needs }: { id: string; name: string; needs: ReturnType<typeof useNeedsYou> }) {
  const project = PROJECTS.find((p) => p.id === id)
  const summary = WEEK_SUMMARY[id]?.match(/^.*?[.!?](\s|$)/)?.[0].trim()
  const live = SESSIONS.find((s) => s.project === id && s.status === "Live")
  const verb = { answer: "Answer", confirm: "Confirm", review: "Review", clash: "Clash" } as const
  const rows = needs.slice(0, 2).map((n) => n.kind === "decide" ? { id: n.id, lead: verb[n.ask], title: n.decision.title } : { id: n.id, lead: "Do", title: n.task.title })
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center gap-2">
        <ProjectMark project={id} className="size-5" />
        <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
        {project?.updated && <span className="shrink-0 text-xs text-muted-foreground">{project.updated}</span>}
      </div>
      {live && <p className="flex items-center gap-1.5 text-xs"><Radio className="size-3" />Live · {live.title}</p>}
      <p className="text-xs leading-relaxed text-muted-foreground">{summary ?? "Nothing new yet."}</p>
      {rows.length > 0 && (
        <ul className="flex flex-col gap-1 border-t pt-2">
          {rows.map((r) => (
            <li key={r.id} className="flex gap-1.5 text-xs">
              <span className="shrink-0 text-muted-foreground">{r.lead}</span>
              <span className="min-w-0 truncate">{r.title}</span>
            </li>
          ))}
          {needs.length > 2 && <li className="text-xs text-muted-foreground">+{needs.length - 2} more</li>}
        </ul>
      )}
    </div>
  )
}

// The open project fills the panel: name with its actions, then Home, Workshops and threads.
function ProjectPanel({ id, name, route }: { id: string; name: string; route: string[] }) {
  return (
    <div className="p-2">
      <div className="mb-3 flex h-9 items-center gap-1 pr-1 pl-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
        <ProjectNewMenu
          project={{ id, name }}
          side="right"
          trigger={<button aria-label={`New in ${name}`} className="flex size-6 items-center justify-center rounded-md hover:bg-sidebar-accent"><Plus className="size-4" /></button>}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label={`${name} settings`} className="flex size-6 items-center justify-center rounded-md hover:bg-sidebar-accent"><MoreHorizontal className="size-4" /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Settings</DropdownMenuLabel>
            {SETTINGS_TABS.map(([key, label]) => (
              <DropdownMenuItem key={key} onSelect={() => navigate(`/p/${id}/settings/${key}`)}>{label}</DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toast("Link copied")}><Link2 />Copy link</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast(`${name} archived`)}><Archive />Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ProjectNavList id={id} route={route} className="mx-0 translate-x-0 border-l-0 px-0" />
    </div>
  )
}
