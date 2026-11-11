import { useState, type ReactNode } from "react"
import {
  ArrowLeft, Bookmark, CalendarDays, Check, ChevronDown, ChevronRight, ChevronsUpDown, CircleDot, Columns2, PanelBottom,
  Home, Inbox, LayoutGrid, ListChecks, PanelLeft, Plus, Search, Star, X, type LucideIcon,
} from "lucide-react"
import { ProjectMark } from "@/components/app/project-mark"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Kbd } from "@/components/ui/kbd"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"
import { THREAD_COLORS } from "@/app/threads"
import { ThreadDot } from "@/app/thread-ui"

// Playground: five left navs that hold up with many projects and many threads per project.
// Shared rules: Search, Inbox and My tasks never leave. Opening a project hands the project area
// over to that project only (no other projects beside it), with one clear way back.
// Self-contained mock: it draws its own nav, so the real sidebar and data are untouched.

type Option = "drill" | "rail" | "views" | "switcher" | "dock"
const OPTIONS: [Option, string, LucideIcon][] = [
  ["drill", "Drill in", ArrowLeft],
  ["rail", "Rail", PanelLeft],
  ["views", "Views + panel", Columns2],
  ["switcher", "Switcher", ChevronsUpDown],
  ["dock", "Dock", PanelBottom],
]

const RULES: Record<Option, string[]> = {
  drill: [
    "Outside a project: pinned and recent projects, plus All projects.",
    "Click a project and the nav slides into it.",
    "← Projects at the top is the way back. The project name switches sideways.",
  ],
  rail: [
    "A thin rail holds the universal icons and pinned project marks.",
    "The wide panel shows only what the rail has selected.",
    "Back is any rail icon. Projects never stack in the panel.",
  ],
  views: [
    "Main level: universal items, your custom views, pinned projects.",
    "Views cut across projects (Needs me, This week, a saved filter).",
    "Opening a project adds a second panel just for it. × closes it.",
  ],
  switcher: [
    "No project list in the nav. A switcher at the top picks one (⌘P).",
    "Under the universal items, the nav belongs to the current project.",
    "Pick All projects in the switcher to go back.",
  ],
  dock: [
    "Each project is a space. One space fills the nav at a time.",
    "Pinned spaces sit in a dock at the bottom. Home is the first space.",
    "Home holds views and recent projects. It's the way back.",
  ],
}

// ---------- Mock data: lots of projects, some with lots of threads ----------

type MockThread = { id: string; name: string; color: string; pinned?: boolean; active?: boolean; waiting?: number }
type MockProject = { id: string; name: string; pinned?: boolean; recent?: number; needs?: number; threads: MockThread[] }

const POOL = ["Research", "Brand", "App", "Marketing", "Pricing", "Onboarding", "Legal", "Hiring", "Partnerships", "Video shoot", "Website", "Support", "Analytics", "Fundraising", "Launch", "Content", "Ops", "Retail"]
const threadsOf = (names: string[], pinned: string[] = [], active: string[] = [], waiting: Record<string, number> = {}): MockThread[] =>
  names.map((name, i) => ({ id: name.toLowerCase().replace(/\s+/g, "-"), name, color: THREAD_COLORS[i % THREAD_COLORS.length].value, pinned: pinned.includes(name), active: active.includes(name), waiting: waiting[name] }))

const MANY: MockProject[] = [
  { id: "whiskr", name: "Whiskr", pinned: true, recent: 1, needs: 3, threads: threadsOf(POOL.slice(0, 16), ["Brand", "Marketing"], ["App", "Research", "Video shoot", "Pricing"], { Brand: 1, App: 2 }) },
  { id: "studio", name: "AI Studio · Recall", pinned: true, recent: 2, needs: 1, threads: threadsOf(["Interviews", "Concept", "Prototype", "Final crit"], [], ["Prototype"], { Concept: 1 }) },
  { id: "fern", name: "Fern website", pinned: true, recent: 3, threads: threadsOf(["Sitemap", "Copy", "Visual design", "Build", "SEO", "Launch"], [], ["Copy"]) },
  { id: "orbit", name: "Orbit mobile", recent: 4, needs: 2, threads: threadsOf(POOL.slice(2, 13), ["App"], ["Onboarding", "Analytics"], { Onboarding: 2 }) },
  { id: "offsite", name: "Q1 offsite", recent: 5, threads: threadsOf(["Venue", "Agenda", "Travel"]) },
  { id: "thesis", name: "Thesis", threads: threadsOf(["Literature", "Method", "Writing", "Defense"]) },
  { id: "northwind", name: "Northwind client", threads: threadsOf(POOL.slice(0, 9)) },
  { id: "podcast", name: "Podcast", threads: threadsOf(["Guests", "Recording", "Editing"]) },
  { id: "kiln", name: "Kiln studio", threads: threadsOf(["Brand", "Website", "Retail", "Classes"]) },
  { id: "grant", name: "Arts grant", threads: threadsOf(["Draft", "Budget", "Letters"]) },
  { id: "pantry", name: "Pantry app", threads: threadsOf(POOL.slice(3, 15)) },
  { id: "portfolio", name: "Portfolio", threads: threadsOf(["Case studies", "Site"]) },
  { id: "hiring", name: "Design hiring", threads: threadsOf(["Sourcing", "Interviews", "Offers"]) },
  { id: "ds", name: "Design system", threads: threadsOf(["Tokens", "Components", "Docs", "Adoption", "Icons"]) },
]
const FEW: MockProject[] = [
  { ...MANY[0], threads: threadsOf(["Research", "Brand", "App", "Marketing"], [], ["App"], { Brand: 1, App: 2 }) },
  MANY[1],
]

const VIEWS: { id: string; name: string; icon: LucideIcon; count?: number }[] = [
  { id: "needs", name: "Needs me", icon: CircleDot, count: 6 },
  { id: "week", name: "This week", icon: CalendarDays },
  { id: "confirm", name: "To confirm", icon: Check, count: 4 },
  { id: "brand", name: "Brand everywhere", icon: Bookmark },
]

// ---------- Where you are ----------

type Page = "home" | "thread"
type Loc =
  | { kind: "inbox" | "tasks" | "all" | "search" }
  | { kind: "view"; id: string }
  | { kind: "project"; project: string; page: Page; thread?: string }

const titleOf = (loc: Loc, projects: MockProject[]) => {
  if (loc.kind === "inbox") return ["Inbox"]
  if (loc.kind === "tasks") return ["My tasks"]
  if (loc.kind === "all") return ["All projects"]
  if (loc.kind === "search") return ["Search"]
  if (loc.kind === "view") return ["Views", VIEWS.find((v) => v.id === loc.id)?.name ?? ""]
  if (loc.kind !== "project") return [""]
  const p = projects.find((x) => x.id === loc.project)
  const t = p?.threads.find((x) => x.id === loc.thread)
  return [p?.name ?? "", loc.page === "thread" ? t?.name ?? "" : "Home"]
}

type Nav = { projects: MockProject[]; loc: Loc; go: (l: Loc) => void }
const openProject = (go: Nav["go"], id: string) => go({ kind: "project", project: id, page: "home" })
const inProject = (loc: Loc) => (loc.kind === "project" ? loc.project : null)

// ---------- Playground page ----------

export function NavPlayground({ option = "drill" }: { option?: string }) {
  const current = (OPTIONS.find(([id]) => id === option) ?? OPTIONS[0])[0]
  const [scale, setScale] = useState<"few" | "many">("many")
  const projects = scale === "many" ? MANY : FEW
  const [loc, setLoc] = useState<Loc>({ kind: "project", project: "whiskr", page: "thread", thread: "brand" })
  const nav: Nav = { projects, loc, go: setLoc }
  const [where, title] = [titleOf(loc, projects).slice(0, -1), titleOf(loc, projects).at(-1)]

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4 text-sm">
        <span className="text-muted-foreground">Prototype</span>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="font-medium">Left nav</span>
        <div className="ml-auto flex items-center gap-2">
          <ToggleGroup type="single" variant="outline" size="sm" value={scale} onValueChange={(v) => v && setScale(v as "few" | "many")}>
            <ToggleGroupItem value="few" className="px-3">2 projects</ToggleGroupItem>
            <ToggleGroupItem value="many" className="px-3">14 projects</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup type="single" variant="outline" size="sm" value={current} onValueChange={(v) => v && navigate(`/playground/nav/${v}`)}>
            {OPTIONS.map(([id, label, Icon], i) => (
              <ToggleGroupItem key={id} value={id} className="gap-1.5 px-3" aria-label={label}>
                <span className="text-xs tabular-nums text-muted-foreground">{i + 1}</span><Icon /><span className="hidden lg:inline">{label}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {current === "drill" && <DrillNav {...nav} />}
        {current === "rail" && <RailNav {...nav} />}
        {current === "views" && <ViewsNav {...nav} />}
        {current === "switcher" && <SwitcherNav {...nav} />}
        {current === "dock" && <DockNav {...nav} />}

        <main className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-8">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1">
              {where.length > 0 && <p className="text-sm text-muted-foreground">{where.join(" / ")}</p>}
              <h1 className="type-title">{title}</h1>
            </div>
            <aside className="w-80 shrink-0 rounded-lg border p-4 text-sm">
              <p className="mb-2 font-medium">{OPTIONS.find(([id]) => id === current)?.[1]}</p>
              <ol className="list-decimal space-y-1.5 pl-4 text-muted-foreground">
                {RULES[current].map((r) => <li key={r}>{r}</li>)}
              </ol>
            </aside>
          </div>
          {loc.kind === "all" ? <Directory {...nav} /> : (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 rounded-md bg-muted/60" style={{ width: `${92 - i * 9}%` }} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// All projects, as a page: the place every option sends you to find the rest.
function Directory({ projects, go }: Nav) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3">
      {projects.map((p) => (
        <button key={p.id} onClick={() => openProject(go, p.id)} className="flex items-center gap-2 rounded-lg border p-3 text-left text-sm hover:bg-muted/50">
          <ProjectMark project={p.id === "whiskr" || p.id === "studio" ? p.id : p.name} className="size-6" />
          <span className="min-w-0 flex-1 truncate">{p.name}</span>
          {p.pinned && <Star className="size-3.5 fill-current text-muted-foreground" />}
          <span className="text-xs tabular-nums text-muted-foreground">{p.threads.length}</span>
        </button>
      ))}
    </div>
  )
}

// ---------- Shared pieces ----------

const Mark = ({ p, className }: { p: MockProject; className?: string }) => (
  <ProjectMark project={p.id === "whiskr" || p.id === "studio" ? p.id : p.name} className={className} />
)

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <nav className={cn("flex w-60 shrink-0 flex-col overflow-hidden border-r bg-sidebar text-sm text-sidebar-foreground", className)}>{children}</nav>
}

function Row({ icon: Icon, lead, label, active, count, dot, onClick, muted, trail }: {
  icon?: LucideIcon; lead?: ReactNode; label: ReactNode; active?: boolean; count?: number; dot?: boolean; onClick?: () => void; muted?: boolean; trail?: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group/row flex h-8 w-full items-center gap-2 rounded-md px-2 text-left outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
        muted && "text-muted-foreground",
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      {lead}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trail}
      {count ? <span className="text-xs tabular-nums text-muted-foreground">{count}</span> : null}
      {dot && <span className="size-1.5 shrink-0 rounded-full bg-foreground" />}
    </button>
  )
}

function Label({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex h-8 items-center justify-between px-2 pt-2 text-xs text-muted-foreground">
      <span>{children}</span>
      {action}
    </div>
  )
}

function IconButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="flex size-5 items-center justify-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
      <Icon className="size-3.5" />
    </button>
  )
}

// Search, Inbox, My tasks: in every option, always.
function Universal({ loc, go, compact }: Pick<Nav, "loc" | "go"> & { compact?: boolean }) {
  return (
    <div className="space-y-0.5">
      <Row icon={Search} label="Search" onClick={() => go({ kind: "search" })} active={loc.kind === "search"} trail={!compact && <Kbd>⌘K</Kbd>} />
      <Row icon={Inbox} label="Inbox" count={5} onClick={() => go({ kind: "inbox" })} active={loc.kind === "inbox"} />
      <Row icon={ListChecks} label="My tasks" onClick={() => go({ kind: "tasks" })} active={loc.kind === "tasks"} />
    </div>
  )
}

// One project's nav: Home, then threads.
// Threads scale like this: pinned first, then ones with recent activity, the rest folded
// behind "N more". A filter shows once a project has more than 8 threads.
function ProjectBody({ p, loc, go }: { p: MockProject } & Pick<Nav, "loc" | "go">) {
  const [all, setAll] = useState(false)
  const [q, setQ] = useState("")
  const at = loc.kind === "project" && loc.project === p.id ? loc : null
  const pinned = p.threads.filter((t) => t.pinned)
  const rest = p.threads.filter((t) => !t.pinned)
  const big = rest.length > 7
  const surfaced = big && !all ? rest.filter((t) => t.active || t.waiting || at?.thread === t.id) : rest
  const hidden = rest.length - surfaced.length
  const match = (t: MockThread) => t.name.toLowerCase().includes(q.trim().toLowerCase())
  const thread = (t: MockThread) => (
    <Row
      key={t.id}
      lead={<ThreadDot color={t.color} />}
      label={t.name}
      dot={!!t.waiting}
      active={at?.page === "thread" && at.thread === t.id}
      onClick={() => go({ kind: "project", project: p.id, page: "thread", thread: t.id })}
    />
  )

  return (
    <div className="space-y-0.5">
      <Row icon={Home} label="Home" count={p.needs} active={at?.page === "home"} onClick={() => go({ kind: "project", project: p.id, page: "home" })} />
      <Label action={<IconButton icon={Plus} label="New thread" />}>Threads</Label>
      {p.threads.length > 8 && (
        <div className="px-1 pb-1">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Filter ${p.threads.length} threads`} className="h-7 w-full rounded-md border bg-background px-2 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring" />
        </div>
      )}
      {q ? p.threads.filter(match).map(thread) : <>
        {pinned.map(thread)}
        {pinned.length > 0 && surfaced.length > 0 && <div className="mx-2 my-1 h-px bg-sidebar-border" />}
        {surfaced.map(thread)}
        {big && (
          <Row muted icon={all ? ChevronDown : ChevronRight} label={all ? "Show less" : `${hidden} more`} onClick={() => setAll(!all)} />
        )}
      </>}
    </div>
  )
}

// Jump to another project without going back first.
function ProjectSwitcher({ projects, current, go, trigger, withAll }: { projects: MockProject[]; current?: string; go: Nav["go"]; trigger: ReactNode; withAll?: boolean }) {
  const pinned = projects.filter((p) => p.pinned)
  const recent = projects.filter((p) => !p.pinned && p.recent).sort((a, b) => a.recent! - b.recent!)
  const item = (p: MockProject) => (
    <DropdownMenuItem key={p.id} onSelect={() => openProject(go, p.id)}>
      <Mark p={p} />{p.name}{p.id === current && <Check className="ml-auto" />}
    </DropdownMenuItem>
  )
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {pinned.length > 0 && <DropdownMenuLabel className="text-xs text-muted-foreground">Pinned</DropdownMenuLabel>}
        {pinned.map(item)}
        {recent.length > 0 && <><DropdownMenuSeparator /><DropdownMenuLabel className="text-xs text-muted-foreground">Recent</DropdownMenuLabel></>}
        {recent.map(item)}
        <DropdownMenuSeparator />
        {withAll && <DropdownMenuItem onSelect={() => go({ kind: "all" })}><LayoutGrid />All projects<span className="ml-auto text-xs text-muted-foreground">{projects.length}</span></DropdownMenuItem>}
        <DropdownMenuItem><Plus />New project</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Pinned, then recent (up to 5), then All projects. Never the full list.
function ProjectShortlist({ projects, loc, go }: Nav) {
  const pinned = projects.filter((p) => p.pinned)
  const recent = projects.filter((p) => !p.pinned && p.recent).sort((a, b) => a.recent! - b.recent!).slice(0, 5)
  const row = (p: MockProject) => <Row key={p.id} lead={<Mark p={p} />} label={p.name} count={p.needs} onClick={() => openProject(go, p.id)} />
  return <>
    {pinned.length > 0 && <Label action={<IconButton icon={Plus} label="New project" />}>Pinned</Label>}
    {pinned.map(row)}
    {recent.length > 0 && <Label>Recent</Label>}
    {recent.map(row)}
    {projects.length > pinned.length + recent.length && (
      <Row muted icon={LayoutGrid} label="All projects" count={projects.length} active={loc.kind === "all"} onClick={() => go({ kind: "all" })} />
    )}
  </>
}

const Scroll = ({ children }: { children: ReactNode }) => <div className="min-h-0 flex-1 overflow-y-auto p-2">{children}</div>

// ---------- 1. Drill in ----------

function DrillNav(nav: Nav) {
  const { projects, loc, go } = nav
  const pid = inProject(loc)
  const p = projects.find((x) => x.id === pid)
  // Remember the project you were in, so stepping into Inbox doesn't throw you out of it.
  const [stay, setStay] = useState<string | null>(pid)
  if (pid && pid !== stay) setStay(pid)
  const focused = p ?? projects.find((x) => x.id === stay)
  const back = () => { setStay(null); go({ kind: "all" }) }

  return (
    <Panel>
      <div className="border-b p-2"><Universal loc={loc} go={go} /></div>
      <Scroll>
        {focused ? (
          <div key={focused.id} className="animate-in slide-in-from-right-4 fade-in-0 duration-200">
            <Row muted icon={ArrowLeft} label="Projects" onClick={back} />
            <ProjectSwitcher
              projects={projects}
              current={focused.id}
              go={(l) => { setStay(inProject(l)); go(l) }}
              trigger={
                <button className="mt-1 mb-1 flex h-10 w-full items-center gap-2 rounded-md px-2 text-left font-medium hover:bg-sidebar-accent">
                  <Mark p={focused} className="size-6" />
                  <span className="min-w-0 flex-1 truncate">{focused.name}</span>
                  <ChevronsUpDown className="size-3.5 text-muted-foreground" />
                </button>
              }
            />
            <ProjectBody p={focused} loc={loc} go={go} />
          </div>
        ) : (
          <div className="animate-in slide-in-from-left-4 fade-in-0 duration-200">
            <ProjectShortlist {...nav} go={(l) => { setStay(inProject(l)); go(l) }} />
          </div>
        )}
      </Scroll>
    </Panel>
  )
}

// ---------- 2. Rail ----------

function RailNav({ projects, loc, go }: Nav) {
  const pid = inProject(loc)
  const [stay, setStay] = useState<string | null>(pid)
  if (pid && pid !== stay) setStay(pid)
  const focused = projects.find((x) => x.id === (pid ?? stay))
  const pinned = projects.filter((p) => p.pinned)
  // A project you open from All projects gets a temporary spot in the rail until you leave it.
  const extra = focused && !focused.pinned ? focused : null
  const open = (id: string) => { setStay(id); openProject(go, id) }
  const railBtn = (key: string, active: boolean, label: string, onClick: () => void, child: ReactNode, badge?: number) => (
    <button key={key} onClick={onClick} title={label} aria-label={label} className={cn("relative flex size-9 items-center justify-center rounded-lg hover:bg-sidebar-accent", active && "bg-sidebar-accent ring-1 ring-sidebar-border")}>
      {child}
      {badge ? <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[9px] text-background tabular-nums">{badge}</span> : null}
    </button>
  )
  const universalOn = loc.kind !== "project" && loc.kind !== "all"

  return <>
    <nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r bg-sidebar py-2">
      {railBtn("search", loc.kind === "search", "Search ⌘K", () => go({ kind: "search" }), <Search className="size-4" />)}
      {railBtn("inbox", loc.kind === "inbox", "Inbox", () => go({ kind: "inbox" }), <Inbox className="size-4" />, 5)}
      {railBtn("tasks", loc.kind === "tasks", "My tasks", () => go({ kind: "tasks" }), <ListChecks className="size-4" />)}
      <div className="my-1 h-px w-6 bg-sidebar-border" />
      <div className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto">
        {pinned.map((p) => railBtn(p.id, pid === p.id, p.name, () => open(p.id), <Mark p={p} className="size-6" />, p.needs))}
        {extra && railBtn(extra.id, pid === extra.id, extra.name, () => open(extra.id), <Mark p={extra} className="size-6 opacity-80" />)}
        {railBtn("all", loc.kind === "all", "All projects", () => go({ kind: "all" }), <LayoutGrid className="size-4 text-muted-foreground" />)}
        {railBtn("new", false, "New project", () => {}, <Plus className="size-4 text-muted-foreground" />)}
      </div>
    </nav>
    <Panel className="w-56">
      {universalOn ? (
        <Scroll>
          <p className="px-2 pt-1 pb-2 font-medium">{titleOf(loc, projects).at(-1)}</p>
          {loc.kind === "inbox" && ["All", "Mentions", "Decisions", "Invites"].map((f, i) => <Row key={f} label={f} active={i === 0} count={i === 0 ? 5 : undefined} />)}
          {loc.kind === "tasks" && ["Assigned to me", "Due this week", "Done"].map((f, i) => <Row key={f} label={f} active={i === 0} />)}
          {loc.kind === "search" && <p className="px-2 text-xs text-muted-foreground">Recent searches</p>}
        </Scroll>
      ) : loc.kind === "all" ? (
        <Scroll><p className="px-2 pt-1 pb-2 font-medium">All projects</p><Row label="Pinned" /><Row label="Archived" /></Scroll>
      ) : focused && (
        <Scroll>
          <div key={focused.id} className="animate-in fade-in-0 duration-150">
            <div className="flex h-10 items-center gap-2 px-2 font-medium"><span className="min-w-0 flex-1 truncate">{focused.name}</span><Star className={cn("size-3.5 text-muted-foreground", focused.pinned && "fill-current")} /></div>
            <ProjectBody p={focused} loc={loc} go={go} />
          </div>
        </Scroll>
      )}
    </Panel>
  </>
}

// ---------- 3. Views + project panel (Keller's idea) ----------

function ViewsNav(nav: Nav) {
  const { projects, loc, go } = nav
  const pid = inProject(loc)
  const [stay, setStay] = useState<string | null>(pid)
  if (pid && pid !== stay) setStay(pid)
  const focused = projects.find((x) => x.id === (pid ?? stay))
  const pinned = projects.filter((p) => p.pinned)
  const open = (id: string) => { setStay(id); openProject(go, id) }

  return <>
    <Panel className="w-56">
      <div className="border-b p-2"><Universal loc={loc} go={go} compact={!!focused} /></div>
      <Scroll>
        <Label action={<IconButton icon={Plus} label="New view" />}>Views</Label>
        {VIEWS.map((v) => <Row key={v.id} icon={v.icon} label={v.name} count={v.count} active={loc.kind === "view" && loc.id === v.id} onClick={() => go({ kind: "view", id: v.id })} />)}
        <Label action={<IconButton icon={Plus} label="New project" />}>Projects</Label>
        {pinned.map((p) => (
          <Row key={p.id} lead={<Mark p={p} />} label={p.name} active={focused?.id === p.id} count={p.needs} onClick={() => open(p.id)} trail={focused?.id === p.id && <ChevronRight className="size-3.5 text-muted-foreground" />} />
        ))}
        {focused && !focused.pinned && <Row lead={<Mark p={focused} />} label={focused.name} active trail={<ChevronRight className="size-3.5 text-muted-foreground" />} />}
        <Row muted icon={LayoutGrid} label="All projects" count={projects.length} active={loc.kind === "all"} onClick={() => go({ kind: "all" })} />
      </Scroll>
    </Panel>
    {focused && (
      <Panel className="w-56 animate-in slide-in-from-left-4 fade-in-0 duration-200 bg-background">
        <div className="flex h-12 items-center gap-2 border-b px-3">
          <Mark p={focused} className="size-5" />
          <span className="min-w-0 flex-1 truncate font-medium">{focused.name}</span>
          <IconButton icon={X} label="Close project" onClick={() => { setStay(null); if (pid) go({ kind: "view", id: "needs" }) }} />
        </div>
        <Scroll>
          <ProjectBody key={focused.id} p={focused} loc={loc} go={go} />
          <Label action={<IconButton icon={Plus} label="New view" />}>Views here</Label>
          <Row icon={CircleDot} label="Needs me" count={focused.needs} />
        </Scroll>
      </Panel>
    )}
  </>
}

// ---------- 4. Switcher ----------

function SwitcherNav(nav: Nav) {
  const { projects, loc, go } = nav
  const pid = inProject(loc)
  const [stay, setStay] = useState<string | null>(pid)
  if (pid && pid !== stay) setStay(pid)
  const focused = projects.find((x) => x.id === (pid ?? stay))
  const goTrack = (l: Loc) => { if (l.kind === "all") setStay(null); else if (l.kind === "project") setStay(l.project); go(l) }

  return (
    <Panel>
      <div className="p-2">
        <ProjectSwitcher
          projects={projects}
          current={focused?.id}
          go={goTrack}
          withAll
          trigger={
            <button className="flex h-11 w-full items-center gap-2 rounded-md border bg-background px-2 text-left hover:bg-sidebar-accent">
              {focused ? <Mark p={focused} className="size-6" /> : <LayoutGrid className="size-5 text-muted-foreground" />}
              <span className="min-w-0 flex-1 truncate font-medium">{focused?.name ?? "All projects"}</span>
              <Kbd>⌘P</Kbd>
              <ChevronsUpDown className="size-3.5 text-muted-foreground" />
            </button>
          }
        />
      </div>
      <div className="border-b px-2 pb-2"><Universal loc={loc} go={go} /></div>
      <Scroll>
        {focused ? (
          <div key={focused.id} className="animate-in fade-in-0 duration-150"><ProjectBody p={focused} loc={loc} go={go} /></div>
        ) : (
          <ProjectShortlist {...nav} go={goTrack} />
        )}
      </Scroll>
    </Panel>
  )
}

// ---------- 5. Dock ----------

function DockNav({ projects, loc, go }: Nav) {
  const pid = inProject(loc)
  const [space, setSpace] = useState<string>(pid ?? "home")
  if (pid && pid !== space) setSpace(pid)
  const focused = projects.find((x) => x.id === space)
  const pinned = projects.filter((p) => p.pinned)
  const extra = focused && !focused.pinned ? focused : null
  const to = (id: string) => { setSpace(id); if (id === "home") go({ kind: "view", id: "needs" }); else openProject(go, id) }
  const dockBtn = (id: string, label: string, child: ReactNode) => (
    <button key={id} onClick={() => to(id)} title={label} aria-label={label} className={cn("flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-sidebar-accent", space === id && "bg-sidebar-accent ring-1 ring-sidebar-border")}>{child}</button>
  )

  return (
    <Panel>
      <div className="border-b p-2"><Universal loc={loc} go={go} /></div>
      <Scroll>
        {focused ? (
          <div key={focused.id} className="animate-in slide-in-from-right-4 fade-in-0 duration-200">
            <div className="flex h-10 items-center gap-2 px-2 font-medium"><Mark p={focused} className="size-6" /><span className="truncate">{focused.name}</span></div>
            <ProjectBody p={focused} loc={loc} go={go} />
          </div>
        ) : (
          <div className="animate-in slide-in-from-left-4 fade-in-0 duration-200">
            <Label action={<IconButton icon={Plus} label="New view" />}>Views</Label>
            {VIEWS.map((v) => <Row key={v.id} icon={v.icon} label={v.name} count={v.count} active={loc.kind === "view" && loc.id === v.id} onClick={() => go({ kind: "view", id: v.id })} />)}
            <Label>Recent</Label>
            {projects.filter((p) => p.recent).sort((a, b) => a.recent! - b.recent!).slice(0, 5).map((p) => <Row key={p.id} lead={<Mark p={p} />} label={p.name} onClick={() => to(p.id)} />)}
            <Row muted icon={LayoutGrid} label="All projects" count={projects.length} active={loc.kind === "all"} onClick={() => go({ kind: "all" })} />
          </div>
        )}
      </Scroll>
      <div className="flex items-center gap-1 overflow-x-auto border-t p-2">
        {dockBtn("home", "Home", <Home className="size-4" />)}
        <div className="mx-0.5 h-5 w-px shrink-0 bg-sidebar-border" />
        {pinned.map((p) => dockBtn(p.id, p.name, <Mark p={p} className="size-5" />))}
        {extra && dockBtn(extra.id, extra.name, <Mark p={extra} className="size-5 opacity-80" />)}
        <button title="New project" aria-label="New project" className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent"><Plus className="size-4" /></button>
      </div>
    </Panel>
  )
}
