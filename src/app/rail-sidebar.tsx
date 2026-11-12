import { useLayoutEffect, useRef, useState, type ComponentProps, type FocusEvent, type MouseEvent, type ReactNode } from "react"
import { toast } from "sonner"
import { Archive, Blend, LayoutGrid, Link2, MessageCircle, MoreHorizontal, Pin, PinOff, Plus, Search } from "lucide-react"
import { AccountMenuContent, WorkspaceMark } from "@/components/app/app-sidebar"
import { dateOfDay } from "@/components/app/calendar/events"
import { ProjectMark } from "@/components/app/project-mark"
import { RailCount } from "@/components/app/count-badge"
import { WhyspaceMark } from "@/components/brand/logo"
import { ProjectNewMenu } from "@/components/app/project-new-menu"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sidebar, SidebarContent } from "@/components/ui/sidebar"
import { ME, MY_PROJECTS, PROJECTS, WEEK_SUMMARY } from "@/data"
import { PersonAvatar } from "@/components/app/person"
import { navigate, useRoute } from "@/lib/router"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useHifi } from "@/lib/hifi"
import { useNeedsYou } from "@/lib/work"
import { ProjectNavList } from "./sidebar"
import { ChatsPanel } from "./chats"
import { lastChat, useUnread } from "./chats-model"
import { DuetPanel } from "./duet-page"
import { SettingsPanel } from "@/screens/settings-page"
import { PROJECT_TABS } from "@/lib/project-tabs"
import { DuetSettingsRow } from "./duet-settings"
import { DuetAvatar } from "./duet-avatar"
import { RailPeekLayer, closePeek, enterPeek, leavePeek } from "./rail-peek"
import { setPanelCollapsed, usePanelCollapsed } from "./rail-state"
import { FoldPanelButton } from "./fold-panel"
import { onToday, todayDay, useTodayRows } from "./today-model"
import { setPinned, usePinned, usePinnedFilter } from "./pins"

// Clicking the open project again brings back its folded panel.
const unfold = () => setPanelCollapsed(false)

// The sidebar, rail version: built for many projects with many threads.
// A thin rail, in the order people use it: Search, Today, Duet, All projects, then your pinned projects.
// Chats sits at the bottom above your photo. The panel beside it shows only in a project (that project),
// in the Duet (your chats with it, Decided for you pinned on top, the settings at the bottom) and in Chats (the chat list).
// The rail is --rail-w wide (48px, 60px under High-fi; tiles --rail-tile, index.css); AppShell shrinks the sidebar to that everywhere else.
// Hovering a tab shows its name in a tooltip; hovering a project shows a small card with what's new there.
// `at` lets the design system page show the rail on a given page.
export function RailSidebar({ at }: { at?: string[] } = {}) {
  const here = useRoute()
  const route = at ?? here
  const { current, setSearchOpen, setNewProjectOpen } = useStore()
  const projects = current?.example ? MY_PROJECTS : []
  const pinnedOnly = usePinnedFilter()
  const hifi = useHifi()
  const needs = useTodayRows().length
  // Only questions to you count as unread in Chats.
  const unread = Object.values(useUnread()).reduce((a, b) => a + b, 0)
  const openId = route[0] === "p" ? route[1] : null
  const open = projects.find((p) => p.id === openId)
  // Only pinned projects sit in the rail. An unpinned project you open from All projects shows at the end while it's open.
  const inRail = pinnedOnly(projects)
  if (open && !inRail.includes(open)) inRail.push(open)
  const chats = route[0] === "chats"
  const duet = route[0] === "duet"
  const settings = route[0] === "settings"
  const panel = !!open || chats || duet || settings
  const folded = usePanelCollapsed()
  const railRef = useRef<HTMLElement>(null)

  return (
    // z-30 keeps the wide rail above the page's own layers (sticky rows, the calendar's now line).
    <Sidebar className="z-30">
      <SidebarContent className="flex-row gap-0 overflow-visible">
        <div className="relative z-10 w-(--rail-w) shrink-0">
          <nav ref={railRef} aria-label="Rail" className={RAIL}>
            {hifi && <RailSheetTab at={route.join("/")} />}
            {/* The Whyspace mark alone, 22px wide (about 15px clear each side of the rail), centered on the panel title's line. */}
            {/* High-fi: the panel is a sheet set 8px down, so the mark drops the same 8px. */}
            <div className={cn("mb-1 flex h-9 w-full shrink-0 items-center justify-center", hifi && "mt-2")}>
              <WhyspaceMark className="w-[22px]" />
            </div>
            <div data-rail-zone className="flex min-h-0 flex-col gap-(--rail-gap)">
            <RailButton label="Search" hint="⌘K" onClick={() => setSearchOpen(true)}><Search className="size-4" /></RailButton>
            <RailButton label="Today" active={route[0] === "today" || route.length === 0} badge={needs} onClick={() => navigate("/today")}><DateGlyph day={new Date(dateOfDay(todayDay())).getDate()} /></RailButton>
            {/* High-fi: your own Duet face stands in for the Duet icon. */}
            <RailButton label="Duet" active={duet} onClick={() => navigate("/duet")}>{hifi ? <DuetAvatar owner={ME.id} className="size-7" /> : <Blend className="size-4" />}</RailButton>
            <RailButton label="All projects" active={route[0] === "projects"} onClick={() => navigate("/projects")}><LayoutGrid className="size-4" /></RailButton>
            <div className="mx-1.5 my-1 h-px shrink-0 bg-sidebar-border" />
            <div data-rail-projects className="-mx-(--rail-pad) flex min-h-0 flex-col gap-(--rail-gap) overflow-y-auto px-(--rail-pad)">
              {inRail.map((p) => <RailProject key={p.id} id={p.id} name={p.name} active={p.id === openId} />)}
              <RailButton label="New project" onClick={() => setNewProjectOpen(true)}><Plus className="size-4 text-muted-foreground" /></RailButton>
            </div>
            </div>
            <div className="flex-1" />
            {/* Chat is secondary (most teams keep Slack), so it sits low, above your photo, out of the way of the work. */}
            <RailButton label="Chats" active={chats} badge={unread} className="mt-1" onClick={() => navigate(lastChat() ? `/chats/${lastChat()}` : "/chats")}><MessageCircle className="size-4" /></RailButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <RailButton label={current?.name ?? "Account"} tip={false} className="mt-1">{hifi ? <PersonAvatar id={ME.id} className="size-8" /> : <WorkspaceMark name={current?.name} className="size-7 text-sm" />}</RailButton>
              </DropdownMenuTrigger>
              <AccountMenuContent side="right" align="end" />
            </DropdownMenu>
          </nav>
          <RailPeekLayer rail={railRef} />
        </div>

        {/* The panel only exists inside a project, in the Duet, in Chats and in Settings. Other universal pages get the rail alone. */}
        {/* Only a project panel folds; the Duet and Chats lists always show. */}
        {panel && !(open && folded) && (
          <div data-rail-panel className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto">
              {open ? <ProjectPanel id={open.id} name={open.name} route={route} /> : duet ? <DuetPanel route={route} /> : settings ? <SettingsPanel route={route} /> : <ChatsPanel route={route} />}
            </div>
            {duet && <div className="p-2"><DuetSettingsRow className="w-full" /></div>}
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}

// High-fi: the open tab's paper tile, one piece that slides from tab to tab when you switch.
function RailSheetTab({ at }: { at: string }) {
  const self = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ top: number; height: number; slide: boolean } | null>(null)
  useLayoutEffect(() => {
    const nav = self.current?.parentElement
    if (!nav) return
    const place = (slide: boolean) => {
      const tab = nav.querySelector<HTMLElement>('[aria-current="page"]')
      if (!tab) return setBox(null)
      const t = tab.getBoundingClientRect()
      const top = t.top - nav.getBoundingClientRect().top
      setBox((b) => (b && b.top === top && b.height === t.height ? b : { top, height: t.height, slide: slide && !!b }))
    }
    place(true)
    // Scrolling the project list or resizing moves the tab without sliding.
    const still = () => place(false)
    const list = nav.querySelector("[data-rail-projects]")
    list?.addEventListener("scroll", still)
    const watch = new ResizeObserver(still)
    watch.observe(nav)
    return () => { list?.removeEventListener("scroll", still); watch.disconnect() }
  }, [at])
  return (
    <div
      ref={self}
      data-rail-sheet
      aria-hidden
      className="pointer-events-none absolute top-0 right-0 left-(--rail-pad)"
      style={box ? { height: box.height, transform: `translateY(${box.top}px)`, transition: box.slide ? "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)" : "none" } : { display: "none" }}
    />
  )
}

// Today's icon: a calendar page with the date, drawn like a Lucide icon (24 grid, round joins) so its line
// weight matches the other rail icons; the date is set in the page below the binding line.
function DateGlyph({ day }: { day: number }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="lucide size-4">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
      <text x="12" y="19.25" textAnchor="middle" fill="currentColor" stroke="none" fontSize="9" fontWeight="600" className="tabular-nums">{day}</text>
    </svg>
  )
}

const RAIL = "absolute inset-y-0 left-0 flex w-(--rail-w) flex-col gap-(--rail-gap) overflow-hidden border-r border-sidebar-border bg-sidebar px-(--rail-pad) py-2"

// The open tab: a darker gray tile, its icon in full ink and its name in medium. The other icons stay quiet
// gray until hovered, and hover is a lighter gray, so a hovered tab never reads as the open one.
const TAB = "group/tab relative flex h-(--rail-tile) w-full shrink-0 items-center rounded-lg text-left text-sidebar-foreground outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:bg-sidebar-accent"
const TAB_OPEN = "bg-sidebar-foreground/[0.07] hover:bg-sidebar-foreground/[0.07]"
const ICON_QUIET = "text-muted-foreground group-hover/tab:text-sidebar-foreground group-focus-visible/tab:text-sidebar-foreground group-data-[state=open]/tab:text-sidebar-foreground"

// A rail tab: an icon with its badge. Hover shows its name, or a `card` when given (projects).
function RailButton({ label, hint, active, badge, dot, card, tip = true, className, children, onClick, ...props }: { label: string; hint?: string; active?: boolean; badge?: number; dot?: boolean; card?: ReactNode; tip?: boolean; children: ReactNode } & ComponentProps<"button">) {
  // High-fi: counts sit inside the tile, smaller, so nothing is clipped; a project shows only a dot.
  const hifi = useHifi()
  // A mouse click doesn't leave focus in the rail, so a dialog closing later doesn't hand focus back to it.
  const click = (e: MouseEvent<HTMLButtonElement>) => { closePeek(); if (e.detail > 0) e.currentTarget.blur(); onClick?.(e) }
  // The rail's one peek (rail-peek.tsx): the name, or the project's card.
  const peek = card || tip
    ? (el: HTMLElement) => enterPeek({ key: label, el, kind: card ? "card" : "tip", content: card ?? <>{label}{hint && <span className="ml-1.5 opacity-60">{hint}</span>}</> })
    : null
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(TAB, active && TAB_OPEN, className)}
      onClick={click}
      onPointerEnter={peek ? (e) => { if (e.pointerType === "mouse") peek(e.currentTarget) } : undefined}
      onPointerLeave={peek ? leavePeek : undefined}
      onFocus={peek ? (e: FocusEvent<HTMLButtonElement>) => { if (e.currentTarget.matches(":focus-visible")) peek(e.currentTarget) } : undefined}
      onBlur={peek ? leavePeek : undefined}
      {...props}
    >
      <span data-rail-icon className={cn("relative flex size-(--rail-tile) shrink-0 items-center justify-center", !active && ICON_QUIET)}>
        {children}
        {badge && hifi ? <RailCount n={badge} dot={dot} /> : null}
        {badge && !hifi ? <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] tabular-nums text-background">{badge}</span> : null}
      </span>
    </button>
  )
}

function RailProject({ id, name, active }: { id: string; name: string; active: boolean }) {
  // Counts what Today lists, so a one-task test scenario shows no other work waiting.
  const needs = useNeedsYou(id).filter((n) => (n.kind === "decide" ? onToday(n.decision.id, "decision") : onToday(n.task.id, "task")))
  const hifi = useHifi()
  return (
    <RailButton data-rail-project label={name} active={active} badge={needs.length} dot card={<ProjectCard id={id} name={name} needs={needs} />} onClick={() => { if (active) unfold(); navigate(`/p/${id}/home`) }}>
      {/* High-fi: 23px so the glyph (88% of the mark) lands at 20px, the same as the tab icons. */}
      <ProjectMark project={id} className={hifi ? "size-[23px]" : "size-6"} />
    </RailButton>
  )
}

// Hover card for a rail project: a glance at what's new, not a page. Empty projects say so.
function ProjectCard({ id, name, needs }: { id: string; name: string; needs: ReturnType<typeof useNeedsYou> }) {
  const project = PROJECTS.find((p) => p.id === id)
  const summary = WEEK_SUMMARY[id]?.match(/^.*?[.!?](\s|$)/)?.[0].trim()
  const verb = { answer: "Answer", confirm: "Confirm", review: "Review", clash: "Clash" } as const
  const rows = needs.slice(0, 2).map((n) => n.kind === "decide" ? { id: n.id, lead: verb[n.ask], title: n.decision.title } : { id: n.id, lead: "Do", title: n.task.title })
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center gap-2">
        <ProjectMark project={id} className="size-5" />
        <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
        {project?.updated && <span className="shrink-0 text-xs text-muted-foreground">{project.updated}</span>}
      </div>
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

// The open project fills the panel: name with its actions, then its pages and threads.
function ProjectPanel({ id, name, route }: { id: string; name: string; route: string[] }) {
  const hifi = useHifi()
  return (
    <div className="p-2">
      <div className={cn("mb-3 flex h-9 items-center gap-1 pr-1", hifi ? "pl-3" : "pl-2")}>
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
            {PROJECT_TABS.map(([key, label]) => (
              <DropdownMenuItem key={key} onSelect={() => navigate(`/p/${id}/settings/${key}`)}>{label}</DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <PinItem id={id} />
            <DropdownMenuItem onSelect={() => toast("Link copied")}><Link2 />Copy link</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast(`${name} archived`)}><Archive />Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <FoldPanelButton />
      </div>
      <ProjectNavList id={id} route={route} className="mx-0 translate-x-0 border-l-0 px-0" />
    </div>
  )
}

function PinItem({ id }: { id: string }) {
  const pinned = usePinned(id)
  return <DropdownMenuItem onSelect={() => setPinned(id, !pinned)}>{pinned ? <PinOff /> : <Pin />}{pinned ? "Unpin from rail" : "Pin to rail"}</DropdownMenuItem>
}
