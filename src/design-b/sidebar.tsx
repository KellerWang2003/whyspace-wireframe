import { useState, type DragEvent } from "react"
import { toast } from "sonner"
import { Archive, ChevronRight, Link2, ListFilter, MoreHorizontal, Plus, Radio } from "lucide-react"
import { ProjectMark } from "@/components/app/project-mark"
import { ProjectNewMenu } from "@/components/app/project-new-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar"
import { SESSIONS, SETTINGS_TABS } from "@/data"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"
import { useNeedsYou } from "@/lib/work"
import { moveThread, useHidden, useThreads } from "./threads"
import { ThreadCount } from "./confirmed"
import { NewThreadDialog, ShowThreadsMenu, ThreadDot, ThreadMenu } from "./thread-ui"

// Design B sidebar: under each project, Home and Workshops, then the project's threads.
// Threads drag to reorder; + beside the label adds one.
export function ProjectNavItemB({ id, name, route }: { id: string; name: string; route: string[] }) {
  const inProject = route[0] === "p" && route[1] === id
  const [open, setOpen] = useState(inProject)
  const live = SESSIONS.some((s) => s.project === id && s.status === "Live")

  return (
    <Collapsible asChild open={open || inProject} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={() => { setOpen(true); navigate(`/p/${id}/home`) }}>
          <ProjectMark project={id} />
          <span>{name}</span>
          {live && <Radio className="ml-auto size-3.5 text-muted-foreground group-hover/menu-item:hidden" />}
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
          <ProjectNavList id={id} route={route} />
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

// A project's pages and threads: Home, Workshops, then threads (drag to reorder, + to add).
// Used under each project in the list, and as the whole panel in the rail sidebar.
export function ProjectNavList({ id, route, className }: { id: string; route: string[]; className?: string }) {
  const inProject = route[0] === "p" && route[1] === id
  const [creating, setCreating] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  // Threads you've hidden stay out of the list, unless you're on one.
  const off = useHidden(id)
  const threads = useThreads(id).filter((t) => !off.includes(t.id) || (route[2] === "t" && route[3] === t.id))
  const needs = useNeedsYou(id)
  const section = inProject ? (!route[2] || ["catch-up", "ask", "overview"].includes(route[2]) ? "home" : route[2]) : null
  const live = SESSIONS.some((s) => s.project === id && s.status === "Live")
  // A thread gets a dot when a decision in it waits on you (to confirm, review or answer).
  const waitingIn = (part: string) => needs.filter((i) => i.kind === "decide" && i.decision.part === part).length

  const drop = (e: DragEvent, before?: string) => {
    e.preventDefault()
    const moving = e.dataTransfer.getData("whyspace/thread")
    if (moving) moveThread(id, moving, before)
    setDragging(null)
    setOver(null)
  }

  return (
    <>
      <SidebarMenuSub className={cn("mr-0 pr-0", className)}>
        <SidebarMenuSubItem>
          <SidebarMenuSubButton asChild isActive={section === "home"}>
            <a href={`#/p/${id}/home`}>
              Home
              {needs.length > 0 && <span className="ml-auto text-xs tabular-nums text-muted-foreground">{needs.length}</span>}
            </a>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
        {/* Where people actively work first (Tasks, Workshops), then the reference shelves they
            visit now and then (Artifacts, Decisions). Decisions mostly surface elsewhere. */}
        {(["tasks", "sessions", "artifacts", "decisions"] as const).map((key) => (
          <SidebarMenuSubItem key={key}>
            <SidebarMenuSubButton asChild isActive={section === key}>
              <a href={`#/p/${id}/${key}`}>
                {key === "sessions" ? "Workshops" : key[0].toUpperCase() + key.slice(1)}
                {key === "sessions" && live && <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"><Radio className="size-3" />Live</span>}
              </a>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        ))}

        <li className="mt-4 flex h-7 items-center justify-between pr-1 pl-2 text-xs text-muted-foreground">
          <span>Threads</span>
          <span className="flex items-center">
            <ShowThreadsMenu
              projectId={id}
              side="right"
              align="start"
              trigger={
                <button aria-label="Show threads" title="Show threads" className={cn("flex size-5 items-center justify-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", off.length > 0 && "text-sidebar-foreground")}>
                  <ListFilter className="size-3.5" />
                </button>
              }
            />
            <button onClick={() => setCreating(true)} aria-label="New thread" className="flex size-5 items-center justify-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <Plus className="size-3.5" />
            </button>
          </span>
        </li>
        {threads.map((t) => {
          const active = route[2] === "t" && route[3] === t.id
          const waiting = waitingIn(t.part)
          return (
            <SidebarMenuSubItem
              key={t.id}
              draggable
              onDragStart={(e) => { e.dataTransfer.setData("whyspace/thread", t.id); e.dataTransfer.effectAllowed = "move"; setDragging(t.id) }}
              onDragEnd={() => { setDragging(null); setOver(null) }}
              onDragOver={(e) => { if (dragging) { e.preventDefault(); setOver(t.id) } }}
              onDrop={(e) => drop(e, t.id)}
              className={cn(dragging === t.id && "opacity-40", over === t.id && dragging !== t.id && "before:absolute before:inset-x-1 before:-top-0.5 before:h-0.5 before:rounded-full before:bg-foreground")}
            >
              <SidebarMenuSubButton asChild isActive={active} className="pr-7">
                <a href={`#/p/${id}/t/${t.id}`}>
                  <ThreadDot color={t.color} />
                  <span className="truncate">{t.name}</span>
                  <span className="ml-auto flex shrink-0 items-center gap-1.5 group-hover/menu-sub-item:hidden">
                    <ThreadCount projectId={id} part={t.part} short className="text-[10px]" />
                    {waiting > 0 && <span className="size-1.5 shrink-0 rounded-full bg-foreground" title={`${waiting} ${waiting === 1 ? "decision needs" : "decisions need"} you`} />}
                  </span>
                </a>
              </SidebarMenuSubButton>
              <ThreadMenu
                projectId={id}
                thread={t}
                side="right"
                trigger={
                  <button aria-label={`${t.name} options`} className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-md text-sidebar-foreground opacity-0 group-hover/menu-sub-item:opacity-100 hover:bg-sidebar-accent focus-visible:opacity-100 data-[state=open]:opacity-100">
                    <MoreHorizontal className="size-3.5" />
                  </button>
                }
              />
            </SidebarMenuSubItem>
          )
        })}
        {dragging && (
          <li
            aria-hidden
            onDragOver={(e) => { e.preventDefault(); setOver("__end") }}
            onDrop={(e) => drop(e)}
            className={cn("relative h-3", over === "__end" && "before:absolute before:inset-x-1 before:top-0 before:h-0.5 before:rounded-full before:bg-foreground")}
          />
        )}
      </SidebarMenuSub>
    <NewThreadDialog projectId={id} open={creating} onOpenChange={setCreating} />
    </>
  )
}
