import { createContext, useContext, useState, type ReactNode } from "react"
import { AudioLines, Circle, CircleDashed, Pause, Square, type LucideIcon } from "lucide-react"
import { AppShell } from "@/components/app/app-shell"
import { ProjectMark } from "@/components/app/project-mark"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { navigate } from "@/lib/router"
import { ExpandedPillPlayground } from "./pill-expanded-playground"

// Playground: 21 takes on the collapsed overlay pill, each shown in the same 8 states,
// so we can pick one that stays small and only speaks up when something needs you.
// Self-contained mock: the real overlay is untouched.

type Live = "off" | "on" | "paused"
type State = { breaks: number; open: number; inferred: number; confirmed: number; live: Live }
type Kind = "breaks" | "open" | "inferred"

const STATES: [string, State][] = [
  ["Empty", { breaks: 0, open: 0, inferred: 0, confirmed: 0, live: "off" }],
  ["All confirmed", { breaks: 0, open: 0, inferred: 0, confirmed: 5, live: "off" }],
  ["One open", { breaks: 0, open: 1, inferred: 0, confirmed: 2, live: "off" }],
  ["Mix", { breaks: 0, open: 2, inferred: 1, confirmed: 4, live: "off" }],
  ["Breaks one", { breaks: 1, open: 1, inferred: 1, confirmed: 4, live: "off" }],
  ["Many", { breaks: 2, open: 12, inferred: 7, confirmed: 48, live: "off" }],
  ["Live", { breaks: 0, open: 2, inferred: 1, confirmed: 4, live: "on" }],
  ["Live paused", { breaks: 0, open: 2, inferred: 1, confirmed: 4, live: "paused" }],
]

// Most urgent first: something that breaks a decision, then open, then inferred.
const KINDS: [Kind, LucideIcon][] = [["breaks", Square], ["open", Circle], ["inferred", CircleDashed]]
const waiting = (s: State) => s.breaks + s.open + s.inferred
const urgent = (s: State) => KINDS.find(([k]) => s[k] > 0)
const nonzero = (s: State) => KINDS.filter(([k]) => s[k] > 0)
const fmt = (n: number) => (n > 99 ? "99+" : String(n))

const BOX = "border border-white/60 bg-background/90 shadow-lg ring-1 ring-black/5 backdrop-blur-xl"
// Whyspace detects the project from what you have open. Working across two at once, the
// mark becomes a cluster: the main project in front, the other tucked behind it.
type Detect = "one" | "two"
const DetectContext = createContext<Detect>("one")
function Mark({ className }: { className?: string }) {
  const detect = useContext(DetectContext)
  const mark = <ProjectMark project="whiskr" className={cn("size-7 rounded-md", className)} />
  if (detect === "one") return <span title="Whiskr · detected">{mark}</span>
  // Same footprint as one mark: two smaller marks share the square, main one in front.
  return (
    <span className={cn("relative inline-block size-7 shrink-0", className)} title="Whiskr and AI Studio · detected">
      <ProjectMark project="studio" className="absolute top-0 left-0 size-[64%] rounded-[5px] border-0 bg-muted-foreground text-background" />
      <ProjectMark project="whiskr" className="absolute right-0 bottom-0 size-[64%] rounded-[5px] ring-2 ring-background" />
    </span>
  )
}

// A state shape with its count inside.
function Shape({ icon: Icon, n, size = 28 }: { icon: LucideIcon; n?: number; size?: number }) {
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <Icon className="absolute inset-0 text-foreground" style={{ width: size, height: size }} strokeWidth={1.4} />
      {n !== undefined && <span className="relative font-semibold leading-none tabular-nums" style={{ fontSize: Math.max(9, size * 0.36) }}>{fmt(n)}</span>}
    </span>
  )
}

function LiveIcon({ live, className }: { live: Live; className?: string }) {
  if (live === "off") return null
  return live === "paused" ? <Pause className={cn("size-3.5 text-muted-foreground", className)} /> : <AudioLines className={cn("size-4 animate-pulse", className)} />
}

// A small black count badge.
const Badge = ({ n, className }: { n: number; className?: string }) => (
  <span className={cn("grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[9px] font-semibold leading-none text-background tabular-nums", className)}>{fmt(n)}</span>
)

type Version = { name: string; note: string; render: (s: State) => ReactNode }

const VERSIONS: Version[] = [
  {
    name: "Dynamic shapes",
    note: "Only states that need you, confirmed hidden",
    render: (s) => (
      <div className={cn(BOX, "flex w-11 flex-col items-center gap-2 rounded-full p-2")}>
        <Mark />
        {nonzero(s).map(([k, I]) => <Shape key={k} icon={I} n={s[k]} size={24} />)}
        <LiveIcon live={s.live} />
      </div>
    ),
  },
  {
    name: "Mark + badge",
    note: "One number: everything waiting",
    render: (s) => (
      <div className={cn(BOX, "relative rounded-2xl p-2")}>
        <Mark />
        {waiting(s) > 0 && <Badge n={waiting(s)} className="absolute -top-1.5 -left-1.5 ring-2 ring-background" />}
        {s.live !== "off" && <span className={cn("absolute -bottom-1 -left-1 size-3 rounded-full ring-2 ring-background", s.live === "on" ? "animate-pulse bg-foreground" : "bg-muted-foreground")} />}
      </div>
    ),
  },
  {
    name: "Most urgent shape",
    note: "Top shape, total inside; number alone when nothing waits",
    render: (s) => {
      const u = urgent(s)
      return (
        <div className={cn(BOX, "flex w-11 flex-col items-center gap-2 rounded-full p-2")}>
          <Mark />
          {u ? <Shape icon={u[1]} n={waiting(s)} size={26} /> : s.confirmed > 0 && <span className="text-xs font-medium text-muted-foreground tabular-nums">{fmt(s.confirmed)}</span>}
          <LiveIcon live={s.live} />
        </div>
      )
    },
  },
  {
    name: "Most urgent, filled",
    note: "Like 3 with a solid shape",
    render: (s) => {
      const u = urgent(s)
      return (
        <div className={cn(BOX, "flex w-11 flex-col items-center gap-2 rounded-full p-2")}>
          <Mark />
          {u ? (
            <span className={cn("grid size-6 place-items-center bg-foreground text-[10px] font-semibold text-background tabular-nums", u[0] === "breaks" ? "rounded-[5px]" : "rounded-full", u[0] === "inferred" && "bg-foreground/60")}>{fmt(waiting(s))}</span>
          ) : s.confirmed > 0 && <span className="text-xs font-medium text-muted-foreground tabular-nums">{fmt(s.confirmed)}</span>}
          <LiveIcon live={s.live} />
        </div>
      )
    },
  },
  {
    name: "Split pill",
    note: "Black foot with the count, gone when empty",
    render: (s) => (
      <div className={cn(BOX, "flex w-11 flex-col items-center overflow-hidden rounded-full")}>
        <div className="flex flex-col items-center gap-1.5 p-2"><Mark /><LiveIcon live={s.live} /></div>
        {waiting(s) > 0 && <div className="grid w-full place-items-center bg-foreground py-2 text-xs font-semibold text-background tabular-nums">{fmt(waiting(s))}</div>}
      </div>
    ),
  },
  {
    name: "Edge tab",
    note: "A sliver on the screen edge, grows when needed",
    render: (s) => (
      <div className={cn(BOX, "flex flex-col items-center justify-center gap-1.5 rounded-l-xl rounded-r-none border-r-0 transition-all", waiting(s) || s.live !== "off" ? "w-8 py-2.5" : "h-14 w-2 p-0")}>
        {waiting(s) > 0 && <span className="text-xs font-semibold tabular-nums">{fmt(waiting(s))}</span>}
        {s.live !== "off" && <LiveIcon live={s.live} className="size-3.5" />}
      </div>
    ),
  },
  {
    name: "Progress ring",
    note: "Ring fills as decisions get confirmed",
    render: (s) => {
      const total = waiting(s) + s.confirmed
      const pct = total ? s.confirmed / total : 0
      return (
        <div className={cn(BOX, "relative grid size-12 place-items-center rounded-full")}>
          <svg viewBox="0 0 40 40" className="absolute inset-1 -rotate-90">
            <circle cx="20" cy="20" r="18" fill="none" className="stroke-muted" strokeWidth="2.5" />
            <circle cx="20" cy="20" r="18" fill="none" className="stroke-foreground transition-all" strokeWidth="2.5" strokeDasharray={`${pct * 113} 113`} strokeLinecap="round" />
          </svg>
          <Mark className="size-6" />
          {waiting(s) > 0 && <Badge n={waiting(s)} className="absolute -top-1 -left-1 ring-2 ring-background" />}
          {s.live !== "off" && <LiveIcon live={s.live} className="absolute -bottom-5 size-3.5" />}
        </div>
      )
    },
  },
  {
    name: "Mini bar",
    note: "One stacked bar, a segment per state",
    render: (s) => {
      const total = waiting(s) + s.confirmed
      return (
        <div className={cn(BOX, "flex w-11 flex-col items-center gap-2 rounded-full p-2")}>
          <Mark />
          {total > 0 && (
            <div className="flex h-14 w-2 flex-col overflow-hidden rounded-full bg-muted">
              <span className="bg-foreground" style={{ flex: s.breaks }} />
              <span className="border-x border-foreground" style={{ flex: s.open }} />
              <span className="bg-[repeating-linear-gradient(0deg,var(--foreground)_0_2px,transparent_2px_4px)]" style={{ flex: s.inferred }} />
              <span className="bg-muted-foreground/30" style={{ flex: s.confirmed }} />
            </div>
          )}
          <LiveIcon live={s.live} />
        </div>
      )
    },
  },
  {
    name: "Tiny shapes",
    note: "Small shape glyphs, one total number",
    render: (s) => (
      <div className={cn(BOX, "flex w-11 flex-col items-center gap-1.5 rounded-full p-2")}>
        <Mark />
        {waiting(s) > 0 && <>
          <div className="flex flex-col items-center gap-1">{nonzero(s).map(([k, I]) => <I key={k} className="size-2.5" strokeWidth={2.5} />)}</div>
          <span className="text-xs font-semibold tabular-nums">{fmt(waiting(s))}</span>
        </>}
        <LiveIcon live={s.live} />
      </div>
    ),
  },
  {
    name: "Horizontal capsule",
    note: "Sits on the edge sideways, shapes inline",
    render: (s) => (
      <div className={cn(BOX, "flex items-center gap-1.5 rounded-full p-1.5 pr-2.5")}>
        <Mark className="size-6" />
        {nonzero(s).map(([k, I]) => <Shape key={k} icon={I} n={s[k]} size={22} />)}
        <LiveIcon live={s.live} />
      </div>
    ),
  },
  {
    name: "Corner glyphs",
    note: "Shapes perch on the mark's corners",
    render: (s) => (
      <div className={cn(BOX, "relative rounded-2xl p-2.5")}>
        <Mark />
        {s.breaks > 0 && <Square className="absolute -top-1 -left-1 size-3.5 fill-background" strokeWidth={2.5} />}
        {s.open > 0 && <Circle className="absolute -bottom-1 -left-1 size-3.5 fill-background" strokeWidth={2.5} />}
        {s.inferred > 0 && <CircleDashed className="absolute -top-1 -right-1 size-3.5 fill-background" strokeWidth={2.5} />}
        {s.live !== "off" && <span className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-background ring-1 ring-black/10"><LiveIcon live={s.live} className="size-2.5" /></span>}
      </div>
    ),
  },
  {
    name: "Count only",
    note: "No mark, just the waiting number",
    render: (s) => (
      <div className={cn(BOX, "grid min-w-9 place-items-center gap-1 rounded-full px-2 py-2")}>
        {waiting(s) > 0 ? <span className="text-sm font-semibold tabular-nums">{fmt(waiting(s))}</span> : <span className="size-2 rounded-full bg-muted-foreground/40" />}
        <LiveIcon live={s.live} className="size-3.5" />
      </div>
    ),
  },
  {
    name: "Ghost when quiet",
    note: "Fades to a dot when nothing waits",
    render: (s) => {
      const quiet = waiting(s) === 0 && s.live === "off"
      return quiet ? <div className={cn(BOX, "size-4 rounded-full opacity-50")} /> : (
        <div className={cn(BOX, "flex w-11 flex-col items-center gap-2 rounded-full p-2")}>
          <Mark />
          {nonzero(s).map(([k, I]) => <Shape key={k} icon={I} n={s[k]} size={24} />)}
          <LiveIcon live={s.live} />
        </div>
      )
    },
  },
  {
    name: "Live takes over",
    note: "While live, the pill becomes the recorder",
    render: (s) => s.live !== "off" ? (
      <div className={cn(BOX, "flex w-11 flex-col items-center gap-1.5 rounded-full bg-foreground p-2 text-background")}>
        <LiveIcon live={s.live} className={s.live === "paused" ? "text-background/60" : ""} />
        <span className="text-[10px] font-medium tabular-nums">12:04</span>
        {waiting(s) > 0 && <Badge n={waiting(s)} className="bg-background text-foreground" />}
      </div>
    ) : (
      <div className={cn(BOX, "relative rounded-2xl p-2")}>
        <Mark />
        {waiting(s) > 0 && <Badge n={waiting(s)} className="absolute -top-1.5 -left-1.5 ring-2 ring-background" />}
      </div>
    ),
  },
  {
    name: "Outlined mark",
    note: "The mark wears the most urgent shape",
    render: (s) => {
      const u = urgent(s)
      return (
        <div className={cn(BOX, "flex w-12 flex-col items-center gap-1.5 rounded-full p-2")}>
          <span className={cn("grid size-9 place-items-center border-[1.5px] border-transparent", u?.[0] === "breaks" && "rounded-md border-foreground", u?.[0] === "open" && "rounded-full border-foreground", u?.[0] === "inferred" && "rounded-full border-dashed border-foreground")}>
            <Mark className="size-6" />
          </span>
          {waiting(s) > 0 && <span className="text-xs font-semibold tabular-nums">{fmt(waiting(s))}</span>}
          <LiveIcon live={s.live} />
        </div>
      )
    },
  },
  {
    name: "Number stack",
    note: "Small shapes beside numbers, nonzero only",
    render: (s) => (
      <div className={cn(BOX, "flex flex-col items-start gap-1.5 rounded-2xl p-2")}>
        <Mark className="size-6" />
        {nonzero(s).map(([k, I]) => (
          <span key={k} className="flex items-center gap-1 text-[11px] font-semibold tabular-nums"><I className="size-3" strokeWidth={2.5} />{fmt(s[k])}</span>
        ))}
        <LiveIcon live={s.live} className="size-3.5" />
      </div>
    ),
  },
  {
    name: "Tongue",
    note: "Count slides out to the left of the mark",
    render: (s) => (
      <div className="flex items-center">
        {waiting(s) > 0 && <span className={cn(BOX, "-mr-3 flex h-7 items-center gap-1 rounded-l-full pr-4 pl-2.5 text-xs font-semibold tabular-nums")}>{urgent(s) && (() => { const I = urgent(s)![1]; return <I className="size-3" strokeWidth={2.5} /> })()}{fmt(waiting(s))}</span>}
        <div className={cn(BOX, "relative z-10 rounded-2xl p-2")}><Mark />{s.live !== "off" && <LiveIcon live={s.live} className="absolute -bottom-1 -left-1 size-3.5 rounded-full bg-background" />}</div>
      </div>
    ),
  },
  {
    name: "Dot rail",
    note: "One dot per waiting decision, up to 6",
    render: (s) => {
      const dots = KINDS.flatMap(([k]) => Array.from({ length: s[k] }, () => k)).slice(0, 6)
      return (
        <div className={cn(BOX, "flex w-10 flex-col items-center gap-1 rounded-full p-1.5 pb-2")}>
          <Mark />
          {dots.length > 0 && <div className="mt-1 flex flex-col items-center gap-1">{dots.map((k, i) => <span key={i} className={cn("size-2", k === "breaks" ? "rounded-[2px] bg-foreground" : k === "open" ? "rounded-full border-[1.5px] border-foreground" : "rounded-full border-[1.5px] border-dashed border-foreground")} />)}</div>}
          {waiting(s) > 6 && <span className="text-[9px] text-muted-foreground tabular-nums">+{waiting(s) - 6}</span>}
          <LiveIcon live={s.live} className="size-3.5" />
        </div>
      )
    },
  },
  {
    name: "Y only",
    note: "Brand letter, a ring when something waits",
    render: (s) => (
      <div className={cn(BOX, "relative grid size-10 place-items-center rounded-full text-sm font-semibold", waiting(s) > 0 && "ring-2 ring-foreground", s.breaks > 0 && "rounded-lg")}>
        Y
        {s.live !== "off" && <span className={cn("absolute -bottom-0.5 -left-0.5 size-3 rounded-full ring-2 ring-background", s.live === "on" ? "animate-pulse bg-foreground" : "bg-muted-foreground")} />}
      </div>
    ),
  },
  {
    name: "Two lines",
    note: "Waiting on top, confirmed below, muted",
    render: (s) => (
      <div className={cn(BOX, "flex w-11 flex-col items-center gap-1.5 rounded-full p-2")}>
        <Mark />
        {waiting(s) > 0 && <span className="text-sm font-semibold tabular-nums">{fmt(waiting(s))}</span>}
        {s.confirmed > 0 && <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground tabular-nums"><span className="size-1.5 rounded-full bg-muted-foreground" />{fmt(s.confirmed)}</span>}
        <LiveIcon live={s.live} className="size-3.5" />
      </div>
    ),
  },
  {
    name: "Shape chips",
    note: "Shapes in one dark chip under the mark",
    render: (s) => (
      <div className={cn(BOX, "flex w-11 flex-col items-center gap-2 rounded-full p-2")}>
        <Mark />
        {waiting(s) > 0 && (
          <div className="flex w-full flex-col items-center gap-1 rounded-full bg-foreground py-1.5 text-background">
            {nonzero(s).map(([k, I]) => <span key={k} className="flex flex-col items-center text-[10px] font-semibold leading-none tabular-nums"><I className="mb-0.5 size-2.5" strokeWidth={3} />{fmt(s[k])}</span>)}
          </div>
        )}
        <LiveIcon live={s.live} />
      </div>
    ),
  },
]

export function PillPlayground({ view = "grid" }: { view?: string }) {
  const [detect, setDetect] = useState<Detect>("one")
  const tabs = (
    <ToggleGroup type="single" variant="outline" size="sm" value={view === "expanded" ? "expanded" : "grid"} onValueChange={(v) => v && navigate(`/playground/pill/${v}`)}>
      <ToggleGroupItem value="grid" className="px-3">Collapsed</ToggleGroupItem>
      <ToggleGroupItem value="expanded" className="px-3">Expanded</ToggleGroupItem>
    </ToggleGroup>
  )
  if (view === "expanded") {
    return (
      <AppShell crumbs={[{ label: "Prototype" }, { label: "Overlay pill playground" }]}>
        <div className="flex items-center gap-3 px-4 pt-4">{tabs}</div>
        <ExpandedPillPlayground />
      </AppShell>
    )
  }
  return (
    <AppShell crumbs={[{ label: "Prototype" }, { label: "Overlay pill playground" }]}>
      <DetectContext.Provider value={detect}>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="mb-3 flex items-center gap-3">
          {tabs}
          <h1 className="text-sm font-medium">Overlay pill</h1>
          <ToggleGroup type="single" variant="outline" size="sm" value={detect} onValueChange={(v) => v && setDetect(v as Detect)}>
            <ToggleGroupItem value="one" className="px-3">One project</ToggleGroupItem>
            <ToggleGroupItem value="two" className="px-3">Two projects</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <table className="border-separate border-spacing-1.5">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-background" />
              {STATES.map(([label]) => <th key={label} className="px-1 pb-1 text-left text-xs font-medium whitespace-nowrap">{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {VERSIONS.map((v, i) => (
              <tr key={v.name}>
                <th className="sticky left-0 z-10 w-44 bg-background pr-3 text-left align-middle font-normal">
                  <div className="text-xs font-medium"><span className="mr-1.5 text-muted-foreground tabular-nums">{i + 1}</span>{v.name}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{v.note}</div>
                </th>
                {STATES.map(([label, s]) => (
                  <td key={label} className="p-0">
                    {/* A strip of stand-in desktop with the pill on its right edge. */}
                    <div className="flex h-40 w-32 items-center justify-end rounded-lg pr-2" style={{ background: "linear-gradient(160deg, #e7e7e9 0%, #d3d4d8 100%)" }}>
                      {v.render(s)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </DetectContext.Provider>
    </AppShell>
  )
}
