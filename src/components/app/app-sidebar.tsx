import { useState } from "react"
import { toast } from "sonner"
import {
  Archive,
  Bell,
  Bot,
  Check,
  ChevronRight,
  ChevronsUpDown,
  CircleUser,
  Globe,
  Inbox,
  LayoutGrid,
  ListChecks,
  Link2,
  LogOut,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  UserPlus,
} from "lucide-react"
import { ProjectMark } from "@/components/app/project-mark"
import { ProjectNewMenu } from "@/components/app/project-new-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { INBOX, ME, MY_PROJECTS, PEOPLE, SETTINGS_TABS } from "@/data"
import { useNeedsYou } from "@/lib/work"
import { navigate, useRoute } from "@/lib/router"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { DESIGN } from "@/lib/design"

export function AppSidebar() {
  const route = useRoute()
  const { inboxState, current, setNewProjectOpen, setSearchOpen } = useStore()
  const projects = current?.example ? MY_PROJECTS : []
  const unread = current?.example ? INBOX.filter((i) => !inboxState[i.id]?.done && !(inboxState[i.id]?.read ?? !i.unread)).length : 0
  const at = (path: string) => "/" + route.join("/") === path

  return (
    <Sidebar>
      <SidebarContent>
        {/* 1. Search, Inbox, My tasks, All projects. New project is the + beside Projects. */}
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

        {/* 2. Projects section, every project in the workspace */}
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <button onClick={() => navigate("/projects")} className="hover:text-sidebar-foreground">
              Projects
            </button>
          </SidebarGroupLabel>
          <SidebarGroupAction aria-label="New project" onClick={() => setNewProjectOpen(true)}>
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

      {/* 3. Account menu, like Notion: workspace, settings, invite, switch workspace, account, log out */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <WorkspaceMark name={current?.name} className="size-8 text-sm" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{current?.name ?? "No workspace"}</span>
                    <span className="truncate text-xs text-muted-foreground">{ME.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <AccountMenuContent side="top" align="start" />
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}


// The account menu (workspace, settings, invite, account, switch workspace, log out).
export function AccountMenuContent({ side, align }: { side: "top" | "right"; align: "start" | "end" }) {
  const { workspaces, current, switchWorkspace, setInviteOpen, setWorkspaceOpen } = useStore()
  const members = current?.example ? Object.keys(PEOPLE).length : 1
  return (
        <DropdownMenuContent className="w-72" side={side} align={align}>
          {current && (
            <>
              <DropdownMenuLabel className="flex items-center gap-3 py-2">
                <WorkspaceMark name={current.name} className="size-9 text-base" />
                <div className="grid leading-tight">
                  <span className="truncate">{current.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{current.plan} plan · {members} members</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => navigate(DESIGN === "b" ? "/settings/profile" : "/settings/general")}>
                <Settings />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setInviteOpen(true)}>
                <UserPlus />
                Invite people
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {/* The main design keeps everything about you in Settings, so the email is just the label over your workspaces. */}
          {DESIGN === "b" ? <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">{ME.email}</DropdownMenuLabel> : <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-xs text-muted-foreground [&>svg:last-child]:hidden">
              <span className="truncate">{ME.email}</span>
              <MoreHorizontal className="ml-auto" />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              <DropdownMenuItem onSelect={() => navigate("/account/profile")}><CircleUser />Profile</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/account/ai-tools")}><Bot />My AI tools</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/account/notifications")}><Bell />Notifications</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>}
          {workspaces.map((w) => (
            <DropdownMenuItem key={w.id} onSelect={() => { switchWorkspace(w.id); navigate("/projects") }}>
              <WorkspaceMark name={w.name} className="size-5 text-[10px]" />
              <span className="truncate">{w.name}</span>
              {w.id === current?.id && <Check className="ml-auto" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onSelect={() => setWorkspaceOpen("create")}>
            <Plus />
            New workspace
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate("/site")}>
            <Globe />
            Home page
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate("/login")}>
            <LogOut />
            Log out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
  )
}

export function WorkspaceMark({ name, className }: { name?: string; className?: string }) {
  return (
    <div className={cn("flex aspect-square shrink-0 items-center justify-center rounded-md bg-sidebar-primary font-semibold text-sidebar-primary-foreground", className)}>
      {name?.[0] ?? "?"}
    </div>
  )
}

// 2a. Each project expands in place to its pages. Hovering the project shows ⋯ for its settings.
const SECTIONS = [
  ["home", "Home"],
  ["tasks", "Tasks"],
  ["decisions", "Decisions"],
  ["artifacts", "Artifacts"],
] as const

function ProjectNavItem({ id, name, route }: { id: string; name: string; route: string[] }) {
  const inProject = route[0] === "p" && route[1] === id
  const [open, setOpen] = useState(inProject)
  const section = inProject ? (!route[2] || ["catch-up", "ask", "overview"].includes(route[2]) ? "home" : route[2]) : null
  const waiting = useNeedsYou(id).length

  return (
    <Collapsible asChild open={open || inProject} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => {
            setOpen(true)
            navigate(`/p/${id}/home`)
          }}
        >
          <ProjectMark project={id} />
          <span>{name}</span>
        </SidebarMenuButton>
        <ProjectNewMenu
          project={{ id, name }}
          side="right"
          trigger={
            <SidebarMenuAction showOnHover className="right-[3.25rem]">
              <Plus />
              <span className="sr-only">New in {name}</span>
            </SidebarMenuAction>
          }
        />
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
                    {key === "home" && waiting > 0 && <span className="ml-auto text-xs tabular-nums text-muted-foreground">{waiting}</span>}
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
