import { useState, type ComponentProps, type ReactNode } from "react"
import { Blend, LayoutGrid, MessageCircle, MoreHorizontal, Plus, Search, Users } from "lucide-react"
import { AccountMenuContent, WorkspaceMark } from "@/components/app/app-sidebar"
import { dateOfDay } from "@/components/app/calendar/events"
import { PersonAvatar } from "@/components/app/person"
import { ProjectMark } from "@/components/app/project-mark"
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar"
import { MY_PROJECTS } from "@/data"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { VIEWER } from "@/lib/viewer"
import { useNeedsYou } from "@/lib/work"
import { ComingUp } from "@/screens/inbox"
import { activityOf, useChats, useChatsState, useUnread } from "@/app/chats-model"
import { ThreadIcon } from "@/app/thread-ui"
import { useThreads } from "@/app/threads"
import { onToday, todayDay, useTodayRows } from "@/app/today-model"

// Playground (#/playground/rail): hovering the rail widens it to show each tab's name, in place of tooltips.
// The wide rail floats over the panel and the page, so nothing beside it moves or reflows.
// Self-contained mock: the real rail is untouched. Rail clicks switch the mock page only.

// Wide: after a short pause on hover (so passing over the rail doesn't open it), while a key moves
// through it, and while its account menu is open. Narrowing waits a beat for the names to fade first.
// Class names stay literal so Tailwind finds them.
const RAIL = cn(
  "group/rail absolute inset-y-0 left-0 flex w-12 flex-col gap-1 overflow-hidden border-r border-sidebar-border bg-sidebar px-1.5 py-2 text-sidebar-foreground transition-[width,box-shadow] delay-50 duration-150 ease-out",
  "hover:w-56 hover:shadow-[8px_0_24px_-12px_rgb(0_0_0/0.2)] hover:delay-100",
  "has-[:focus-visible]:w-56 has-[:focus-visible]:shadow-[8px_0_24px_-12px_rgb(0_0_0/0.2)]",
  "has-[[data-state=open]]:w-56 has-[[data-state=open]]:shadow-[8px_0_24px_-12px_rgb(0_0_0/0.2)]",
)
// Names fade in as the rail finishes widening, and go at once when it narrows.
const NAME = "opacity-0 transition-opacity duration-75 group-hover/rail:opacity-100 group-hover/rail:delay-175 group-hover/rail:duration-100 group-has-[:focus-visible]/rail:opacity-100 group-has-[[data-state=open]]/rail:opacity-100"

export function RailPlayground() {
  const { current, setSearchOpen, setNewProjectOpen } = useStore()
  const [tab, setTab] = useState("today")
  const projects = current?.example ? MY_PROJECTS : []
  const project = projects.find((p) => p.id === tab)
  const needs = useTodayRows().length
  const unread = Object.values(useUnread()).reduce((a, b) => a + b, 0)

  return (
    <div className="flex h-svh w-full overflow-hidden bg-background">
      {/* The rail always takes 48px of the layout. Inside that, it widens over whatever is to its right. */}
      <div className="relative z-30 w-12 shrink-0">
        <nav aria-label="Rail" className={RAIL}>
          <RailItem label="Search" hint="⌘K" onClick={() => setSearchOpen(true)}><Search className="size-4" /></RailItem>
          <RailItem label="Today" active={tab === "today"} badge={needs} onClick={() => setTab("today")}><DateGlyph day={new Date(dateOfDay(todayDay())).getDate()} /></RailItem>
          <RailItem label="Duet" active={tab === "duet"} onClick={() => setTab("duet")}><Blend className="size-4" /></RailItem>
          <RailItem label="Chats" active={tab === "chats"} badge={unread} onClick={() => setTab("chats")}><MessageCircle className="size-4" /></RailItem>
          <RailItem label="Projects" active={tab === "projects"} onClick={() => setTab("projects")}><LayoutGrid className="size-4" /></RailItem>
          <div className="mx-1.5 my-1 h-px shrink-0 bg-sidebar-border" />
          <div className="-mx-1.5 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1.5">
            {projects.map((p) => <RailProject key={p.id} id={p.id} name={p.name} active={p.id === tab} onClick={() => setTab(p.id)} />)}
            <RailItem label="New project" onClick={() => setNewProjectOpen(true)}><Plus className="size-4 text-muted-foreground" /></RailItem>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <RailItem label={current?.name ?? "Account"} className="mt-1"><WorkspaceMark name={current?.name} className="size-7 text-sm" /></RailItem>
            </DropdownMenuTrigger>
            <AccountMenuContent side="right" align="end" />
          </DropdownMenu>
        </nav>
      </div>

      {project ? <ProjectPanel id={project.id} name={project.name} /> : tab === "chats" ? <ChatsPanel /> : null}

      <main className="min-w-0 flex-1 overflow-y-auto">
        {tab === "today" ? <TodayPage /> : (
          <Page title={project?.name ?? { duet: "Duet", chats: "Chats", projects: "Projects" }[tab] ?? ""} mark={project && <ProjectMark project={project.id} className="size-9 rounded-lg" />} />
        )}
      </main>
    </div>
  )
}

// A rail tab: the icon keeps its spot and its badge; the name sits beside it, seen only when the rail is wide.
function RailItem({ label, hint, active, badge, className, children, ...props }: { label: string; hint?: string; active?: boolean; badge?: number; children: ReactNode } & ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn("group/tab relative flex h-9 w-full shrink-0 items-center rounded-lg text-left text-sidebar-foreground outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring", active && "bg-sidebar-foreground/[0.07] hover:bg-sidebar-foreground/[0.07]", className)}
      {...props}
    >
      <span className={cn("relative flex size-9 shrink-0 items-center justify-center", !active && "text-muted-foreground group-hover/tab:text-sidebar-foreground group-focus-visible/tab:text-sidebar-foreground")}>
        {children}
        {badge ? <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] tabular-nums text-background">{badge}</span> : null}
      </span>
      <span className={cn(NAME, "min-w-0 flex-1 truncate pl-1.5 text-sm whitespace-nowrap", active && "font-medium")}>{label}</span>
      {hint && <span className={cn(NAME, "shrink-0 pr-2.5 text-xs text-muted-foreground")}>{hint}</span>}
    </button>
  )
}

function RailProject({ id, name, active, onClick }: { id: string; name: string; active: boolean; onClick: () => void }) {
  // Same count as the real rail: what Today lists for this project.
  const needs = useNeedsYou(id).filter((n) => (n.kind === "decide" ? onToday(n.decision.id, "decision") : onToday(n.task.id, "task")))
  return <RailItem label={name} active={active} badge={needs.length} onClick={onClick}><ProjectMark project={id} className="size-6" /></RailItem>
}

// Today's icon, as in the real rail.
function DateGlyph({ day }: { day: number }) {
  return (
    <span aria-hidden className="flex size-[18px] flex-col overflow-hidden rounded-[4px] border-[1.5px] border-current">
      <span className="h-[3px] shrink-0 bg-current" />
      <span className="flex flex-1 items-center justify-center text-[9px] leading-none font-semibold tabular-nums">{day}</span>
    </span>
  )
}

// The panel beside the rail, as in the real app: a project's pages and threads, or the chat list.
function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <aside className="w-52 shrink-0 overflow-y-auto border-r border-sidebar-border bg-sidebar p-2 text-sidebar-foreground">
      <div className="mb-3 flex h-9 items-center gap-1 pr-1 pl-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
        <span className="flex size-6 items-center justify-center"><Plus className="size-4" /></span>
        {action}
      </div>
      <SidebarMenuSub className="mx-0 translate-x-0 border-l-0 px-0">{children}</SidebarMenuSub>
    </aside>
  )
}

function PanelRow({ active, className, children }: { active?: boolean; className?: string; children: ReactNode }) {
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={active} className={className}><div>{children}</div></SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}

function ProjectPanel({ id, name }: { id: string; name: string }) {
  const threads = useThreads(id)
  const needs = useNeedsYou(id).length
  return (
    <Panel title={name} action={<span className="flex size-6 items-center justify-center"><MoreHorizontal className="size-4" /></span>}>
      <PanelRow active>Home{needs > 0 && <span className="ml-auto text-xs tabular-nums text-muted-foreground">{needs}</span>}</PanelRow>
      <PanelRow>Tasks</PanelRow>
      <PanelRow>Artifacts</PanelRow>
      <PanelRow>Decisions</PanelRow>
      {threads.length > 0 && <li className="mt-4 flex h-7 items-center pl-2 text-xs text-muted-foreground">Threads</li>}
      {threads.map((t) => <PanelRow key={t.id}><ThreadIcon thread={t} /><span className="truncate">{t.name}</span></PanelRow>)}
    </Panel>
  )
}

function ChatsPanel() {
  const s = useChatsState()
  const chats = [...useChats()].sort((a, b) => activityOf(b, s) - activityOf(a, s))
  const unread = useUnread()
  return (
    <Panel title="Chats">
      {chats.map((c, i) => (
        <PanelRow key={c.id} active={i === 0} className="h-8">
          {c.kind === "dm"
            ? <PersonAvatar id={c.members.find((m) => m !== VIEWER) ?? VIEWER} className="size-5 text-[9px]" />
            : <span className="flex size-5 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground"><Users className="size-3" /></span>}
          <span className={cn("min-w-0 flex-1 truncate", unread[c.id] && "font-semibold")}>{c.name}</span>
          {unread[c.id] ? <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-foreground px-1 text-[10px] tabular-nums text-background">{unread[c.id]}</span> : null}
        </PanelRow>
      ))}
    </Panel>
  )
}

// Today's look, with its rows close to the rail, so the wide rail visibly lies over them.
const NEEDS: { who: string; lead?: string; title: string; sub: string }[] = [
  { who: "MC", lead: "Clash", title: "Make the end card red, like the old logo", sub: "Trevor confirmed “Change the brand color from red to blue” · Whiskr" },
  { who: "MC", lead: "Confirm", title: "Make the promo video 15 seconds", sub: "Cats lose interest fast. · Whiskr" },
  { who: "MC", lead: "Confirm", title: "Make the posters blue, like the brand", sub: "No reason yet · Whiskr" },
  { who: "MC", lead: "Review", title: "Generate five practice questions from one course PDF", sub: "Keller and Jordan Kim decided · AI Studio · Recall" },
  { who: "MC", lead: "Answer", title: "How should we split the demo and evaluation story?", sub: "Due Fri Oct 30 · AI Studio · Recall" },
  { who: "TR", lead: "Trevor asked", title: "How long will the promo video be?", sub: "11:05 · Whiskr" },
  { who: "CH", lead: "Christine asked", title: "Do the posters go up before the video?", sub: "12:40 · Whiskr" },
  { who: "TR", title: "Cats can't see red. Change your posters to blue.", sub: "Due Fri Oct 30 · Whiskr" },
]

function TodayPage() {
  const date = new Date(dateOfDay(todayDay())).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
  return (
    <div className="flex min-h-full">
      <div className="min-w-0 flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 p-8">
          <header className="flex items-baseline gap-3">
            <h1 className="type-title">Today</h1>
            <span className="text-sm text-muted-foreground">{date}</span>
          </header>
          <section className="flex flex-col gap-3">
            <div className="flex h-8 items-center gap-2">
              <h2 className="type-section">Needs you</h2>
              <span className="text-sm text-muted-foreground tabular-nums">{NEEDS.length}</span>
            </div>
            <ul className="flex flex-col gap-2">
              {NEEDS.map((n) => (
                <li key={n.title} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
                  <PersonAvatar id={n.who} className="size-8" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm">
                      {n.lead && <span className="shrink-0 text-muted-foreground">{n.lead}</span>}
                      <span className="min-w-0 truncate font-medium">{n.title}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{n.sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      <ComingUp className="w-80 shrink-0 border-l p-8 px-6" />
    </div>
  )
}

// Every other tab: its title over empty rows, starting close to the rail like All projects.
function Page({ title, mark }: { title: string; mark?: ReactNode }) {
  return (
    <div className="flex w-full max-w-5xl flex-col gap-8 p-8">
      <header className="flex items-center gap-3">
        {mark}
        <h1 className="type-title">{title}</h1>
      </header>
      <ul className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, i) => <li key={i} className="h-16 rounded-lg border bg-card" />)}
      </ul>
    </div>
  )
}
