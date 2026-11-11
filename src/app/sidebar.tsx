import { useState, type DragEvent } from "react"
import { ListFilter, MoreHorizontal, Plus } from "lucide-react"
import { SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useHifi } from "@/lib/hifi"
import { useNeedsYou } from "@/lib/work"
import { moveThread, useHidden, useThreads } from "./threads"
import { pigmentOf } from "./hifi-model"
import { NewThreadDialog, ShowThreadsMenu, ThreadIcon, ThreadMenu } from "./thread-ui"

// A project's pages and threads: Home, Tasks, Artifacts, Decisions, then threads (drag to reorder, + to add).
// The whole panel beside the rail when a project is open.
export function ProjectNavList({ id, route, className }: { id: string; route: string[]; className?: string }) {
  const inProject = route[0] === "p" && route[1] === id
  const hifi = useHifi()
  const [creating, setCreating] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  // Threads you've hidden stay out of the list, unless you're on one.
  const off = useHidden(id)
  const threads = useThreads(id).filter((t) => !off.includes(t.id) || (route[2] === "t" && route[3] === t.id))
  const needs = useNeedsYou(id)
  const section = inProject ? (!route[2] || ["catch-up", "ask", "overview"].includes(route[2]) ? "home" : route[2]) : null
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
        {/* Where people actively work first (Tasks), then the reference shelves they
            visit now and then (Artifacts, Decisions). Decisions mostly surface elsewhere. */}
        {(["tasks", "artifacts", "decisions"] as const).map((key) => (
          <SidebarMenuSubItem key={key}>
            <SidebarMenuSubButton asChild isActive={section === key}>
              <a href={`#/p/${id}/${key}`}>
                {key[0].toUpperCase() + key.slice(1)}
              </a>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        ))}

        <li className={cn("mt-4 flex h-7 items-center justify-between pr-1 text-xs text-muted-foreground", hifi ? "pl-3" : "pl-2")}>
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
              {/* High-fi: the open thread sits on a light wash of its color. */}
              <SidebarMenuSubButton asChild isActive={active} style={hifi && active ? { backgroundColor: `color-mix(in oklab, ${pigmentOf(t)} 16%, var(--background))` } : undefined}>
                <a href={`#/p/${id}/t/${t.id}`}>
                  <ThreadIcon thread={t} style={hifi ? { color: pigmentOf(t) } : undefined} />
                  <span className="truncate">{t.name}</span>
                  {/* One slot on the right, lined up with Home's count: how many decisions wait on you here.
                      Hovering swaps it for the options button in the same spot. */}
                  {waiting > 0 && (
                    <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground group-hover/menu-sub-item:invisible group-has-[[data-state=open]]/menu-sub-item:invisible" title={`${waiting} ${waiting === 1 ? "decision needs" : "decisions need"} you`}>
                      {waiting}
                    </span>
                  )}
                </a>
              </SidebarMenuSubButton>
              <ThreadMenu
                projectId={id}
                thread={t}
                side="right"
                trigger={
                  <button aria-label={`${t.name} options`} className={cn("absolute top-1 flex size-5 items-center justify-center rounded-md text-sidebar-foreground opacity-0 group-hover/menu-sub-item:opacity-100 hover:bg-sidebar-accent focus-visible:opacity-100 data-[state=open]:opacity-100", hifi ? "right-[10px]" : "right-1.5")}>
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
