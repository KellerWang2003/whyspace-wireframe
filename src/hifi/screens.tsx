import { useState, type ReactNode } from "react"
import { ArrowUpRight, Blend, CalendarDays, ChevronDown, ChevronRight, Circle, CircleDashed, Columns3, LayoutGrid, ListFilter, MessageCircle, MoreHorizontal, PanelLeftClose, Plus, Search, Sun, Table2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { DECISIONS, PROJECT_ICON, RAIL_PROJECTS, TODAY, firstName, type Page, type StyleId } from "./model"
import { Avatar, Badge, Button } from "./shared"
import { DecisionsEmpty, HandledEmpty, QuietArt, Squiggle, TitleMark, TornEdge } from "./art"

// Keller's two screens from Figma, laid out as drawn: the rail, Today with its Coming up rail, and
// an empty project's Decisions page. The styles only change type, color, shape and the fun visuals.

export function Screens({ style, page, go }: { style: StyleId; page: Page; go: (page: Page) => void }) {
  return (
    <div className="hf-app relative flex h-full">
      <Rail style={style} page={page} go={go} />
      {page === "decisions" && <ProjectSidebar style={style} />}
      <main className="hf-main min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        {page === "today" ? <Today style={style} /> : <Decisions style={style} />}
      </main>
      {page === "today" && <ComingUp style={style} />}
      <button type="button" aria-label="Ask Whyspace" className="hf-ask absolute right-5 bottom-5 z-20 flex size-10 items-center justify-center">
        <MessageCircle className="size-[18px]" />
      </button>
    </div>
  )
}

/* ---------------- shell ---------------- */

function Rail({ style, page, go }: { style: StyleId; page: Page; go: (page: Page) => void }) {
  return (
    <nav aria-label="Rail" className="hf-rail relative z-10 flex w-14 shrink-0 flex-col items-center gap-1 py-3">
      <RailButton label="Search"><Search /></RailButton>
      <RailButton label="Today" active={page === "today"} badge={TODAY.badge} onClick={() => go("today")}><Sun /></RailButton>
      <RailButton label="Duet"><Blend /></RailButton>
      <RailButton label="Projects"><LayoutGrid /></RailButton>
      <span aria-hidden className="hf-rail-rule my-1.5 h-px w-6" />
      {RAIL_PROJECTS.map((p) => {
        const Icon = PROJECT_ICON[p.id]
        return (
          <RailButton key={p.id} label={p.name} active={page === "decisions" && p.id === DECISIONS.project.id} badge={p.badge} onClick={p.id === DECISIONS.project.id ? () => go("decisions") : undefined}>
            <span className={cn("hf-rail-tile", p.id === "whiskr" && "hf-tile-whiskr")}><Icon /></span>
          </RailButton>
        )
      })}
      <RailButton label="New project" muted><Plus /></RailButton>
      <span className="hf-me mt-auto flex size-8 items-center justify-center text-[13px] font-semibold">K</span>
      {style === "weave" && <TornEdge />}
    </nav>
  )
}

function RailButton({ label, active, badge, muted, onClick, children }: { label: string; active?: boolean; badge?: number; muted?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} aria-current={active ? "page" : undefined} onClick={onClick} className={cn("hf-rail-btn [&_svg]:size-[18px]", muted && "hf-rail-muted")}>
      {children}
      {badge !== undefined && <Badge n={badge} />}
    </button>
  )
}

function IconButton({ label, children }: { label: string; children: ReactNode }) {
  return <button type="button" aria-label={label} title={label} className="hf-icon-btn flex size-7 items-center justify-center [&_svg]:size-4">{children}</button>
}

function ProjectSidebar({ style }: { style: StyleId }) {
  return (
    <aside className="hf-side relative z-[5] flex w-[250px] shrink-0 flex-col px-3 pt-4 pb-3">
      <div className="flex h-9 items-center gap-0.5 pr-1 pl-2.5">
        <span className="hf-side-title min-w-0 flex-1 truncate">{DECISIONS.project.name}</span>
        <IconButton label="New"><Plus /></IconButton>
        <IconButton label="More"><MoreHorizontal /></IconButton>
      </div>
      <nav className="mt-3 flex flex-col gap-0.5">
        {DECISIONS.nav.map((name) => (
          <button key={name} type="button" aria-current={name === DECISIONS.title ? "page" : undefined} className="hf-side-item flex h-9 items-center px-2.5 text-left">{name}</button>
        ))}
      </nav>
      <div className="mt-6 flex h-8 items-center gap-0.5 pr-1 pl-2.5">
        <span className="hf-side-label min-w-0 flex-1">Threads</span>
        <IconButton label="Show threads"><ListFilter /></IconButton>
        <IconButton label="New thread"><Plus /></IconButton>
      </div>
      <div className="mt-auto flex justify-end"><IconButton label="Collapse sidebar"><PanelLeftClose /></IconButton></div>
      {style === "weave" && <TornEdge color="var(--side)" />}
    </aside>
  )
}

/* ---------------- parts ---------------- */

function SectionHead({ title, count }: { title: string; count?: ReactNode }) {
  return (
    <div className="flex h-8 items-center gap-2">
      <h2 className="hf-h2">{title}</h2>
      {count !== undefined && <span className="hf-muted text-[14px] tabular-nums">{count}</span>}
    </div>
  )
}

function ProjectTile({ id, size = 30 }: { id: string; size?: number }) {
  const Icon = PROJECT_ICON[id]
  return (
    <span className={cn("hf-project-tile inline-flex shrink-0 items-center justify-center", id === "whiskr" && "hf-tile-whiskr")} style={{ width: size, height: size }}>
      {Icon && <Icon style={{ width: size * 0.56, height: size * 0.56 }} />}
    </span>
  )
}

function StatusMark({ status }: { status: string }) {
  return (
    <span className="flex items-center gap-2">
      {status === "In progress" ? <CircleDashed className="hf-status-prog size-4" /> : <Circle className="hf-muted size-4" />}
      {status}
    </span>
  )
}

function People({ ids }: { ids: string[] }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="flex -space-x-1.5">{ids.map((id) => <Avatar key={id} id={id} size={22} className="hf-avatar-ring" />)}</span>
      <span className="truncate">{ids.map(firstName).join(", ")}</span>
    </span>
  )
}

/* ---------------- Today ---------------- */

function Today({ style }: { style: StyleId }) {
  const [open, setOpen] = useState(true)
  const [view, setView] = useState(TODAY.views[0])
  const [layout, setLayout] = useState<"table" | "board">("table")
  return (
    <div className="mx-auto w-full max-w-[900px] px-12 pt-12 pb-32">
      <header className="flex items-baseline gap-3">
        <h1 className="hf-title relative">{TODAY.title}<TitleMark style={style} /></h1>
        <span className="hf-date">{TODAY.date}</span>
      </header>

      <section aria-label="Needs you" className="mt-12">
        <SectionHead title="Needs you" count={TODAY.needs.length} />
        <ul className="mt-3 space-y-2">
          {TODAY.needs.map((n) => (
            <li key={n.id} className="hf-card flex items-center gap-3 px-4 py-3">
              <Avatar id={n.who} size={32} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[14px]"><span className="hf-muted shrink-0">{n.lead}</span><span className="truncate font-medium">{n.title}</span></p>
                <p className="hf-muted mt-0.5 flex items-center gap-1.5 text-[12.5px]">{n.sub}<span aria-hidden>·</span>{n.project}</p>
              </div>
              <Button>{n.action}</Button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Across your projects" className="mt-12">
        <SectionHead title="Across your projects" />
        <ul className="mt-2 -mx-3">
          {TODAY.projects.map((p) => (
            <li key={p.id}>
              <button type="button" className="hf-row flex w-full items-center gap-3 px-3 py-2.5 text-left">
                <ProjectTile id={p.id} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">{p.name}</span>
                  <span className="hf-muted block truncate text-[12.5px]">{p.summary}</span>
                </span>
                {p.unread > 0 && <span className="hf-pill">{p.unread} new</span>}
                {p.unread > 0 ? <ChevronRight className="hf-muted size-4" /> : <ArrowUpRight className="hf-muted size-4" />}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="My tasks" className="mt-10">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex h-8 items-center gap-2">
          <ChevronDown className={cn("hf-muted size-4 transition-transform", !open && "-rotate-90")} />
          <span className="hf-h2">My tasks</span>
          <span className="hf-muted text-[14px]">{TODAY.tasks.length} open</span>
        </button>
        {open && (
          <>
            <div className="mt-4 flex items-center gap-3">
              <div role="tablist" className="hf-tabs flex items-center">
                {TODAY.views.map((v) => (
                  <button key={v} type="button" role="tab" aria-selected={v === view} onClick={() => setView(v)} className="hf-tab">
                    {v}
                    {v === view && style === "gesture" && <Squiggle className="pointer-events-none absolute bottom-0.5 left-2 h-2 w-[calc(100%-1rem)]" />}
                  </button>
                ))}
                <button type="button" aria-label="New view" className="hf-tab hf-muted"><Plus className="size-4" /></button>
              </div>
              <label className="hf-input ml-auto flex h-9 w-44 items-center gap-2 px-3">
                <Search className="hf-muted size-4 shrink-0" />
                <input placeholder="Search tasks…" className="min-w-0 flex-1 bg-transparent outline-none" />
              </label>
              <div className="hf-seg flex items-center">
                <button type="button" aria-pressed={layout === "table"} onClick={() => setLayout("table")}><Table2 className="size-4" />Table</button>
                <button type="button" aria-pressed={layout === "board"} onClick={() => setLayout("board")}><Columns3 className="size-4" />Board</button>
              </div>
              <Button kind="primary"><Plus className="size-4" />New task</Button>
            </div>
            {layout === "table" ? (
              <table className="hf-table mt-3 w-full table-fixed text-left text-[13px]">
                <thead>
                  <tr>
                    <th className="w-9" aria-label="Select" />
                    <th className="w-[27%]">Thread</th>
                    <th>Task</th>
                    <th className="w-[14%]">Status</th>
                    <th className="w-[21%]">Assignees</th>
                    <th className="w-[11%]">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {TODAY.tasks.map((t) => (
                    <tr key={t.id}>
                      <td><span className="hf-check block size-4" /></td>
                      <td className="hf-muted"><span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5"><span>{t.project}</span><span aria-hidden>·</span><span className="flex items-center gap-1.5"><span className="hf-thread-dot size-2 shrink-0 rounded-full" />{t.thread}</span></span></td>
                      <td className="leading-snug font-medium">{t.title}</td>
                      <td><StatusMark status={t.status} /></td>
                      <td><People ids={t.people} /></td>
                      <td className="hf-muted">{t.due}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {["To do", "In progress"].map((col) => (
                  <div key={col} className="hf-board-col p-3">
                    <p className="flex items-center gap-2 px-1 text-[13px] font-semibold"><StatusMark status={col} /></p>
                    <ul className="mt-3 space-y-2">
                      {TODAY.tasks.filter((t) => t.status === col).map((t) => (
                        <li key={t.id} className="hf-card p-3">
                          <p className="text-[13.5px] font-medium">{t.title}</p>
                          <p className="hf-muted mt-2 flex items-center justify-between text-[12px]"><People ids={t.people} /><span className="shrink-0">{t.due}</span></p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section aria-label="Handled" className="mt-12">
        <SectionHead title="Handled" />
        <div className="mt-4"><HandledEmpty style={style} text={TODAY.handled} /></div>
      </section>
    </div>
  )
}

function ComingUp({ style }: { style: StyleId }) {
  return (
    <aside aria-label="Coming up" className="hf-coming relative flex w-[316px] shrink-0 flex-col overflow-y-auto px-6 pt-12 pb-6">
      <div className="flex h-8 items-center justify-between">
        <h2 className="hf-h2">Coming up</h2>
        <Button kind="ghost"><CalendarDays className="size-3.5" />Calendar</Button>
      </div>
      <div className="mt-3 space-y-4">
        {TODAY.upcoming.map((g) => (
          <div key={g.day}>
            <p className="hf-day">{g.day}</p>
            <ul className="mt-1">
              {g.events.map((e) => (
                <li key={e.time + e.title} className="flex gap-3 py-1.5">
                  <span className="hf-time w-11 shrink-0 tabular-nums">{e.time}</span>
                  <span className="min-w-0">
                    <span className="block text-[14px] leading-snug font-medium">{e.title}</span>
                    <span className="hf-muted mt-0.5 flex items-center gap-1.5 text-[12px]"><ProjectTile id="whiskr" size={15} />{TODAY.upcomingProject}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <QuietArt style={style} className="mt-auto pt-8 pb-14" />
    </aside>
  )
}

/* ---------------- Decisions ---------------- */

function Decisions({ style }: { style: StyleId }) {
  return (
    <div className="w-full px-12 pt-8 pb-32">
      <header className="flex items-center gap-3">
        <h1 className="hf-title relative flex items-baseline gap-2">{DECISIONS.title}<span className="hf-count">{DECISIONS.count}</span><TitleMark style={style} /></h1>
        <div className="ml-auto flex items-center gap-3">
          <label className="hf-input flex h-10 w-56 items-center gap-2 px-3">
            <Search className="hf-muted size-4 shrink-0" />
            <input placeholder="Search" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
          <Button kind="primary" className="h-10 px-4"><Plus className="size-4" />New</Button>
        </div>
      </header>
      <div className="mt-7"><DecisionsEmpty style={style} text={DECISIONS.empty} /></div>
    </div>
  )
}
