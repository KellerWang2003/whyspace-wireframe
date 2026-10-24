import { useState } from "react"
import {
  Bell,
  Bot,
  Building2,
  Check,
  ChevronRight,
  ChevronsUpDown,
  CircleUser,
  GitFork,
  Inbox,
  LayoutGrid,
  ListChecks,
  LogIn,
  LogOut,
  Plus,
  Radio,
  Search,
  Settings,
  UserPlus,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ProjectMark } from "@/components/app/project-mark"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Kbd } from "@/components/ui/kbd"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { DECISIONS, INBOX, ME, PROJECTS, SESSIONS, TASKS } from "@/data"
import { navigate, useRoute } from "@/lib/router"
import { useStore } from "@/lib/store"

export function AppSidebar() {
  const route = useRoute()
  const { workspaces, current, switchWorkspace, setInviteOpen, setNewProjectOpen, setSearchOpen, setWorkspaceOpen } = useStore()
  const projects = current?.example ? PROJECTS : []
  const unread = current?.example ? INBOX.filter((i) => i.unread).length : 0
  const toReview = current?.example ? DECISIONS.filter((d) => d.status === "inf").length : 0
  const at = (path: string) => "/" + route.join("/") === path

  return (
    <Sidebar>
      {/* 1. Workspace menu: switch, invite people, settings, create or join */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
                    {current ? current.name[0] : <Building2 className="size-4" />}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{current?.name ?? "No workspace"}</span>
                    <span className="truncate text-xs text-muted-foreground">{current ? `${current.plan} plan` : "Create or join one"}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="start">
                {workspaces.length > 0 && <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>}
                {workspaces.map((w) => (
                  <DropdownMenuItem key={w.id} onSelect={() => { switchWorkspace(w.id); navigate("/projects") }}>
                    <div className="flex size-6 items-center justify-center rounded-sm border text-xs">{w.name[0]}</div>
                    {w.name}
                    {w.id === current?.id && <Check className="ml-auto" />}
                  </DropdownMenuItem>
                ))}
                {current && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setInviteOpen(true)}>
                      <UserPlus />
                      Invite people
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate("/settings/general")}>
                      <Settings />
                      Workspace settings
                    </DropdownMenuItem>
                  </>
                )}
                {workspaces.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onSelect={() => setWorkspaceOpen("create")}>
                  <Plus />
                  Create workspace
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setWorkspaceOpen("join")}>
                  <LogIn />
                  Join a workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* 2. Search, Inbox, My tasks, All projects, Decisions. New project is the + beside Projects. */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setSearchOpen(true)}>
                  <Search />
                  <span>Search</span>
                  <Kbd className="ml-auto">⌘K</Kbd>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={at("/inbox")} onClick={() => navigate("/inbox")}>
                  <Inbox />
                  <span>Inbox</span>
                </SidebarMenuButton>
                {unread > 0 && <SidebarMenuBadge>{unread}</SidebarMenuBadge>}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={at("/my-tasks")} onClick={() => navigate("/my-tasks")}>
                  <ListChecks />
                  <span>My tasks</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={route[0] === "projects" || route.length === 0} onClick={() => navigate("/projects")}>
                  <LayoutGrid />
                  <span>All projects</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Every decision across projects, same views as inside a project */}
              <SidebarMenuItem>
                <SidebarMenuButton isActive={route[0] === "decisions"} onClick={() => navigate("/decisions")}>
                  <GitFork />
                  <span>Decisions</span>
                </SidebarMenuButton>
                {toReview > 0 && <SidebarMenuBadge>{toReview}</SidebarMenuBadge>}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 3. Projects section, every project in the workspace */}
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <button onClick={() => navigate("/projects")} className="hover:text-sidebar-foreground">
              Projects
            </button>
          </SidebarGroupLabel>
          <SidebarGroupAction title="New project" onClick={() => setNewProjectOpen(true)}>
            <Plus />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.map((p) => (
                <ProjectNavItem key={p.id} id={p.id} name={p.name} route={route} />
              ))}
              {projects.length === 0 && (
                <p className="px-2 py-1 text-xs text-muted-foreground">No projects yet</p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* 4. Profile menu */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-8 rounded-md">
                    <AvatarFallback className="rounded-md">MC</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{ME.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{ME.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60" side="top" align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => navigate("/account/profile")}>
                    <CircleUser />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate("/account/ai-tools")}>
                    <Bot />
                    My AI tools
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate("/account/notifications")}>
                    <Bell />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate("/login")}>
                  <LogOut />
                  Log out
                  <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

// 3a. Each project expands in place to its sections. Settings live in the project's ⋯ menu.
const SECTIONS = [
  ["overview", "Overview"],
  ["decisions", "Decisions"],
  ["artifacts", "Artifacts"],
  ["tasks", "Tasks"],
  ["sessions", "Sessions"],
] as const

function ProjectNavItem({ id, name, route }: { id: string; name: string; route: string[] }) {
  const inProject = route[0] === "p" && route[1] === id
  const [open, setOpen] = useState(inProject)
  const section = inProject ? route[2] ?? "overview" : null
  const live = SESSIONS.some((s) => s.project === id && s.status === "Live")
  const toReview = DECISIONS.filter((d) => d.project === id && d.status === "inf").length
  const projectName = PROJECTS.find((p) => p.id === id)?.name
  const openTasks = TASKS.filter((t) => t.project === projectName && t.status !== "done").length

  return (
    <Collapsible asChild open={open || inProject} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={inProject && section === "overview"}
          onClick={() => {
            setOpen(true)
            navigate(`/p/${id}/overview`)
          }}
        >
          <ProjectMark project={id} />
          <span>{name}</span>
          {live && <Radio className="ml-auto size-3.5 text-muted-foreground" />}
        </SidebarMenuButton>
        <CollapsibleTrigger asChild>
          <SidebarMenuAction className="data-[state=open]:rotate-90" showOnHover={!live}>
            <ChevronRight />
            <span className="sr-only">Toggle</span>
          </SidebarMenuAction>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {SECTIONS.map(([key, label]) => {
              const count = key === "tasks" ? openTasks : key === "decisions" ? toReview : 0
              return (
                <SidebarMenuSubItem key={key}>
                  <SidebarMenuSubButton asChild isActive={section === key}>
                    <a href={`#/p/${id}/${key}`}>
                      {label}
                      {key === "sessions" && live ? (
                        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"><Radio className="size-3" />Live</span>
                      ) : (
                        count > 0 && <span className="ml-auto text-xs tabular-nums text-muted-foreground">{count}</span>
                      )}
                    </a>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}
