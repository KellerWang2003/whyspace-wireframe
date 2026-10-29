import { useState } from "react"
import { toast } from "sonner"
import {
  Archive,
  Bell,
  Bot,
  Building2,
  Check,
  ChevronRight,
  ChevronsUpDown,
  CircleUser,
  Inbox,
  LayoutGrid,
  ListChecks,
  LogIn,
  Link2,
  LogOut,
  MoreHorizontal,
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
import { INBOX, ME, MY_PROJECTS, SESSIONS, SETTINGS_TABS, needsYou } from "@/data"
import { navigate, useRoute } from "@/lib/router"
import { useStore } from "@/lib/store"

export function AppSidebar() {
  const route = useRoute()
  const { inboxState, workspaces, current, switchWorkspace, setInviteOpen, setNewProjectOpen, setSearchOpen, setWorkspaceOpen } = useStore()
  const projects = current?.example ? MY_PROJECTS : []
  const unread = current?.example ? INBOX.filter((i) => !inboxState[i.id]?.done && !(inboxState[i.id]?.read ?? !i.unread)).length : 0
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
        {/* 2. Search, Inbox, My tasks, All projects. New project is the + beside Projects. */}
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
                <SidebarMenuButton isActive={route[0] === "projects" || route[0] === "decisions" || route.length === 0} onClick={() => navigate("/projects")}>
                  <LayoutGrid />
                  <span>All projects</span>
                </SidebarMenuButton>
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
                    <AvatarFallback className="rounded-md">{ME.name[0]}</AvatarFallback>
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

// 3a. Each project expands in place to its pages. Hovering the project shows ⋯ for its settings.
const SECTIONS = [
  ["catch-up", "Catch up"],
  ["tasks", "Tasks"],
  ["decisions", "Decisions"],
  ["artifacts", "Artifacts"],
  ["sessions", "Meetings"],
] as const

function ProjectNavItem({ id, name, route }: { id: string; name: string; route: string[] }) {
  const inProject = route[0] === "p" && route[1] === id
  const [open, setOpen] = useState(inProject)
  const section = inProject ? (!route[2] || ["overview", "ask"].includes(route[2]) ? "catch-up" : route[2]) : null
  const live = SESSIONS.some((s) => s.project === id && s.status === "Live")
  const waiting = needsYou(id).length

  return (
    <Collapsible asChild open={open || inProject} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={inProject && section === "catch-up"}
          onClick={() => {
            setOpen(true)
            navigate(`/p/${id}/catch-up`)
          }}
        >
          <ProjectMark project={id} />
          <span>{name}</span>
          {live && <Radio className="ml-auto size-3.5 text-muted-foreground group-hover/menu-item:hidden" />}
        </SidebarMenuButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction showOnHover className="right-7">
              <MoreHorizontal />
              <span className="sr-only">{name} settings</span>
            </SidebarMenuAction>
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
        <CollapsibleTrigger asChild>
          <SidebarMenuAction className="data-[state=open]:rotate-90" showOnHover>
            <ChevronRight />
            <span className="sr-only">Toggle</span>
          </SidebarMenuAction>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {SECTIONS.map(([key, label]) => (
              <SidebarMenuSubItem key={key}>
                <SidebarMenuSubButton asChild isActive={section === key}>
                  <a href={`#/p/${id}/${key}`}>
                    {label}
                    {key === "sessions" && live ? (
                      <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"><Radio className="size-3" />Live</span>
                    ) : (
                      key === "catch-up" && waiting > 0 && <span className="ml-auto text-xs tabular-nums text-muted-foreground" title={`${waiting} need you`}>{waiting}</span>
                    )}
                  </a>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}
