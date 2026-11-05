import type { CSSProperties, ReactNode } from "react"
import { Plus, Search } from "lucide-react"
import { MarkIcon } from "@/components/app/status-badge"
import { KIND_ICON } from "@/playground/artifact"
import { cn } from "@/lib/utils"
import { BRAND as B, PROJECT_MARK, PROJECT_PAGES, initialsOf, personPigment, useHifiHome, useHifiNav, useHifiToday, type HAction, type HNeed, type HThread, type Pigment } from "./model"
import { Scroll, YMark, type StyleProps } from "./shared"

// Bold color-block: the sticky notes as flat, square blocks of pigment on a grid, with huge serif
// numerals and the brand's cut shapes (circle, arch, band) as poster graphics. No texture, no tilt;
// where shapes overlap they multiply. Dark text on the light pigments, paper on forest and leaf ink.

export function BlockStyle({ page, go }: StyleProps) {
  return (
    <div className="flex h-full bg-(--paper) text-(--forest-deep)">
      <Sidebar page={page} go={go} />
      <Scroll>{page === "today" ? <Today /> : <Home />}</Scroll>
    </div>
  )
}

/* ---------------- parts ---------------- */

// The fill and ink of each block color. Leaf carries text as leaf ink, which holds paper type.
type Fill = Pigment | "forest" | "subtle" | "paper"
const FILL: Record<Fill, { bg: string; fg: string; dark?: boolean }> = {
  apricot: { bg: B.apricot, fg: B.forestDeep },
  sky: { bg: B.sky, fg: B.forestDeep },
  rose: { bg: B.rose, fg: B.forestDeep },
  leaf: { bg: B.leafInk, fg: B.paper, dark: true },
  forest: { bg: B.forest, fg: B.paper, dark: true },
  subtle: { bg: B.subtle, fg: B.forestDeep },
  paper: { bg: B.paper, fg: B.forestDeep },
}

function Block({ fill, className, children, style }: { fill: Fill; className?: string; children: ReactNode; style?: CSSProperties }) {
  return <section className={cn("relative overflow-hidden", className)} style={{ background: FILL[fill].bg, color: FILL[fill].fg, ...style }}>{children}</section>
}

function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("text-[12px] font-semibold tracking-[0.12em] uppercase", className)}>{children}</div>
}

function Button({ a, dark }: { a: HAction; dark?: boolean }) {
  return (
    <button
      type="button"
      onClick={a.run}
      className={cn(
        "h-10 shrink-0 px-4 text-[14px] font-semibold transition-transform active:translate-y-px",
        a.primary ? (dark ? "bg-(--paper) text-(--forest-deep)" : "bg-(--forest-deep) text-(--paper)") : cn("border-2", dark ? "border-(--paper)" : "border-(--forest-deep)"),
      )}
    >
      {a.label}
    </button>
  )
}

// A person as a square of their pigment. On a pigment tile it turns neutral, so it never vanishes.
function Square({ id, size = 36, on }: { id: string; size?: number; on?: "light" | "dark" }) {
  const f = on === "light" ? { bg: B.forestDeep, fg: B.paper } : on === "dark" ? { bg: B.paper, fg: B.forestDeep } : FILL[personPigment(id)]
  return (
    <span className="inline-flex shrink-0 items-center justify-center font-semibold" style={{ width: size, height: size, fontSize: Math.round(size * 0.34), background: f.bg, color: f.fg }}>
      {initialsOf(id)}
    </span>
  )
}

function Chip({ pigment, size = 12 }: { pigment: Pigment; size?: number }) {
  return <span aria-hidden className="inline-block shrink-0" style={{ width: size, height: size, background: B[pigment] }} />
}

/* ---------------- shell ---------------- */

function Sidebar({ page, go }: StyleProps) {
  const nav = useHifiNav()
  return (
    <aside className="flex w-64 shrink-0 flex-col bg-(--forest) pb-6 text-(--paper)">
      <div className="flex items-center gap-3 px-6 pt-7">
        <YMark color={B.paper} className="h-7 w-auto" />
        <span className="font-serif text-[24px] leading-none tracking-[-0.01em]">Whyspace</span>
      </div>
      <nav className="mt-10 flex flex-col">
        <Item active={page === "today"} onClick={() => go("today")} end={<span className={cn("flex h-6 min-w-6 items-center justify-center px-1 text-[12px] font-semibold tabular-nums", page === "today" ? "bg-(--forest-deep) text-(--paper)" : "bg-(--rose) text-(--forest-deep)")}>{nav.today}</span>}>Today</Item>
        <Item start={<Search className="size-4" />}>Search</Item>
      </nav>
      <Label className="mt-9 mb-2 px-6 text-(--paper)/50">Projects</Label>
      <nav className="flex flex-col">
        {nav.projects.map((p) => {
          const mark = PROJECT_MARK[p.id]
          return (
            <div key={p.id}>
              <Item active={page === "home" && p.id === "whiskr"} onClick={p.id === "whiskr" ? () => go("home") : undefined} start={mark && <span className="flex size-6 shrink-0 items-center justify-center" style={{ background: B[mark.pigment] }}><mark.icon className="size-3.5 text-(--forest-deep)" /></span>}>{p.name}</Item>
              {p.id === "whiskr" && (
                <div className="flex flex-col pb-2">
                  {PROJECT_PAGES.slice(1).map((name) => <Item key={name} small>{name}</Item>)}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      <Label className="mt-7 mb-2 px-6 text-(--paper)/50">Threads</Label>
      <nav className="flex flex-col">
        {nav.threads.map((t) => <Item key={t.id} start={<Chip pigment={t.pigment} />}>{t.name}</Item>)}
      </nav>
      <div className="mt-auto flex items-center gap-3 px-6">
        <Square id={nav.me.id} size={32} />
        <span className="truncate text-[13px] text-(--paper)/80">{nav.workspace}</span>
      </div>
    </aside>
  )
}

function Item({ children, active, small, start, end, onClick }: { children: ReactNode; active?: boolean; small?: boolean; start?: ReactNode; end?: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex items-center gap-3 text-left transition-colors", small ? "h-8 pr-6 pl-[60px] text-[13px]" : "h-11 px-6 text-[15px]", active ? "bg-(--apricot) font-semibold text-(--forest-deep)" : "text-(--paper)/80 hover:bg-(--paper)/5 hover:text-(--paper)")}>
      {start}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {end}
    </button>
  )
}

/* ---------------- Today ---------------- */

// Needs, one flat note per kind of ask.
const NOTE: Record<HNeed["kind"], Fill> = { clash: "rose", decide: "apricot", asked: "sky", invite: "subtle", do: "leaf" }

// Circle, arch and band from the brand's shape sheet, overlapping.
function Shapes({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 560 320" className={className} aria-hidden>
      <g style={{ isolation: "isolate" }}>
        <circle cx="250" cy="130" r="112" fill={B.apricot} />
        <path d="M330 330 A130 130 0 0 1 590 330 Z" fill={B.rose} style={{ mixBlendMode: "multiply" }} />
        <path d="M400 -20 H470 L560 330 H490 Z" fill={B.leafInk} style={{ mixBlendMode: "multiply" }} />
        <rect x="252" y="198" width="120" height="122" fill={B.paper} />
        <path d="M276 320 L312 250 L348 320 Z" fill={B.forestDeep} />
      </g>
    </svg>
  )
}

function Tile({ n, wide }: { n: HNeed; wide: boolean }) {
  const f = NOTE[n.kind]
  const dark = !!FILL[f].dark
  const why = n.kind !== "do" && n.kind !== "invite"
  return (
    <Block fill={f} className={cn("flex flex-col p-7", wide ? "col-span-6 min-h-[300px]" : "col-span-4 min-h-[320px]")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label>{n.lead}</Label>
          {n.thread && <div className="mt-1.5 text-[13px] font-medium opacity-80">{n.thread.name}</div>}
        </div>
        {n.mark && <MarkIcon mark={n.mark} className="size-9" />}
      </div>
      <h3 className={cn("mt-6", why ? "font-serif text-[34px] leading-[1.08] tracking-[-0.015em]" : "text-[24px] leading-[1.2] font-semibold tracking-[-0.01em]")}>{n.title}</h3>
      <p className="mt-3 text-[15px] leading-snug opacity-80">{n.sub}</p>
      <div className="mt-auto flex items-center gap-2 pt-7">
        <Square id={n.who} size={40} on={dark ? "dark" : "light"} />
        <div className="ml-auto flex items-center gap-2">{n.actions.map((a) => <Button key={a.label} a={a} dark={dark} />)}</div>
      </div>
    </Block>
  )
}

function Today() {
  const t = useHifiToday()
  const open = t.tasks.filter((x) => !x.done).length
  return (
    <div className="grid grid-cols-12 gap-3 p-3 pb-28">
      <Block fill="sky" className="col-span-12 h-[340px]">
        <Shapes className="absolute top-0 right-0 h-full w-auto" />
        <div className="relative flex h-full flex-col justify-between p-8">
          <Label>{t.weekday} · {t.date}</Label>
          <h1 className="-mb-5 font-serif text-[176px] leading-[0.8] tracking-[-0.04em] min-[1400px]:text-[200px]">Today</h1>
        </div>
      </Block>

      <Block fill="forest" className="col-span-8 flex min-h-[200px] items-end p-8">
        <p className="max-w-[720px] font-serif text-[40px] leading-[1.12] tracking-[-0.015em]">{t.lead}</p>
      </Block>
      <Block fill="rose" className="col-span-4 flex flex-col justify-between p-8">
        <Label>Needs you</Label>
        <div className="font-serif text-[150px] leading-[0.75] tracking-[-0.04em]">{t.needs.length}</div>
      </Block>

      <div className="col-span-12 grid grid-cols-12 gap-3">
        {t.needs.map((n, i) => <Tile key={n.id} n={n} wide={i < 2 && t.needs.length > 3} />)}
      </div>

      <Block fill="paper" className="col-span-8 pt-6 pr-2">
        <Label>Across your projects</Label>
        <ul className="mt-4">
          {t.recap.map((r) => {
            const mark = PROJECT_MARK[r.id]
            return (
              <li key={r.id} className="flex items-center gap-5 border-t-[3px] border-(--forest-deep) py-5">
                <span className="flex size-14 shrink-0 items-center justify-center" style={{ background: mark ? B[mark.pigment] : B.subtle }}>{mark && <mark.icon className="size-6" />}</span>
                <h3 className="w-72 shrink-0 truncate font-serif text-[30px] leading-none tracking-[-0.015em] whitespace-nowrap">{r.name}</h3>
                <p className="min-w-0 flex-1 text-[16px] leading-snug">{r.summary}</p>
                {r.unread > 0 && <span className="flex h-9 shrink-0 items-center bg-(--apricot) px-3 text-[13px] font-semibold">{r.unread} new</span>}
              </li>
            )
          })}
        </ul>
      </Block>
      <Block fill="subtle" className="col-span-4 p-7">
        <div className="flex items-baseline justify-between">
          <Label>My tasks</Label>
          <span className="font-serif text-[44px] leading-none">{open}</span>
        </div>
        <ul className="mt-5 space-y-3">
          {t.tasks.map((x) => (
            <li key={x.id} className="flex items-start gap-3">
              <button type="button" aria-label={x.done ? "Done" : "Mark done"} onClick={x.done ? undefined : x.finish} className={cn("mt-0.5 size-5 shrink-0 border-2 border-(--forest-deep)", x.done && "bg-(--forest-deep)")} />
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[15px] leading-snug font-medium", x.done && "line-through opacity-50")}>{x.title}</span>
                <span className="mt-1 flex items-center gap-1.5 text-[13px]">{x.thread && <Chip pigment={x.thread.pigment} size={10} />}{x.due}</span>
              </span>
            </li>
          ))}
        </ul>
      </Block>

      <Block fill="paper" className="col-span-8 pt-6">
        <Label>Coming up</Label>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {t.upcoming.slice(0, 4).map((g, i) => (
            <div key={g.label} className={cn("flex min-h-[230px] flex-col p-5", i === 0 ? "bg-(--apricot)" : "bg-(--subtle)")}>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-[56px] leading-[0.8] tracking-[-0.03em]">{g.num}</span>
                <span className="text-[13px] font-semibold tracking-[0.1em] uppercase">{g.weekday}</span>
              </div>
              <ul className="mt-5 space-y-2">
                {g.events.map((e) => (
                  <li key={e.id} className="bg-(--forest-deep) px-3 py-2 text-(--paper)">
                    <div className="text-[12px] font-semibold opacity-70 tabular-nums">{e.time}</div>
                    <div className="text-[14px] leading-snug font-medium">{e.title}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Block>
      <Block fill="forest" className="col-span-4 p-7">
        <Label className="text-(--paper)/70">Handled</Label>
        <ul className="mt-5 space-y-4">
          {t.handled.map((l) => (
            <li key={l.id} className="flex items-start gap-3">
              <span className="mt-1 flex size-5 shrink-0 items-center justify-center" style={{ background: l.agent ? B.sky : B.apricot }}>
                {l.agent ? <YMark color={B.forestDeep} className="h-3 w-auto" /> : <span className="size-2 bg-(--forest-deep)" />}
              </span>
              <span className="min-w-0 flex-1 text-[15px] leading-snug">{l.text}</span>
              <span className="shrink-0 pt-0.5 text-[12px] font-semibold opacity-60 tabular-nums">{l.when}</span>
            </li>
          ))}
        </ul>
      </Block>
    </div>
  )
}

/* ---------------- Home ---------------- */

// The threads as the Y's bands: each strand comes in from the edge and they meet in one stem.
function Converge({ threads, className }: { threads: HThread[]; className?: string }) {
  const meet: [number, number] = [470, 196]
  return (
    <svg viewBox="0 0 640 340" className={className} aria-hidden>
      {threads.map((t, i) => {
        const x = 90 + i * 128
        return <line key={t.id} x1={x} y1={-40} x2={meet[0]} y2={meet[1]} stroke={B[t.pigment]} strokeWidth="58" style={{ mixBlendMode: "multiply" }} />
      })}
      <line x1={meet[0] - 6} y1={meet[1] - 8} x2={600} y2={380} stroke={B.forest} strokeWidth="66" style={{ mixBlendMode: "multiply" }} />
    </svg>
  )
}

function Home() {
  const h = useHifiHome()
  const mark = PROJECT_MARK.whiskr
  return (
    <div className="grid grid-cols-12 gap-3 p-3 pb-28">
      <Block fill="paper" className="col-span-12 h-[360px]">
        <Converge threads={h.threads} className="absolute top-0 right-0 h-full w-auto" />
        <div className="relative flex h-full flex-col justify-between p-8 pr-[46%]">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center" style={{ background: B[mark.pigment] }}><mark.icon className="size-6" /></span>
            <div className="flex">{h.members.map((m) => <Square key={m.id} id={m.id} size={48} />)}</div>
            <button type="button" aria-label="Search" className="flex size-12 items-center justify-center border-2 border-(--forest-deep)"><Search className="size-5" /></button>
            <button type="button" className="flex h-12 items-center gap-2 bg-(--forest-deep) px-5 text-[15px] font-semibold text-(--paper)"><Plus className="size-5" />New</button>
          </div>
          <h1 className="-mb-6 font-serif text-[176px] leading-[0.8] tracking-[-0.04em] min-[1400px]:text-[200px]">{h.name}</h1>
        </div>
      </Block>

      {h.threads.map((t) => {
        const f = FILL[t.pigment]
        return (
          <Block key={t.id} fill={t.pigment} className="col-span-3 flex min-h-[340px] flex-col p-7">
            <h3 className="font-serif text-[44px] leading-none tracking-[-0.02em]">{t.name}</h3>
            <p className="mt-4 text-[15px] leading-snug opacity-85">{t.intent}</p>
            <div className="mt-auto">
              <div className="flex gap-1.5">
                {Array.from({ length: t.m }, (_, k) => <span key={k} className="size-4 border-2" style={{ borderColor: f.fg, background: k < t.n ? f.fg : "transparent" }} />)}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-serif text-[64px] leading-[0.8] tracking-[-0.03em]">{t.n}/{t.m}</span>
                <span className="text-[13px] font-semibold tracking-[0.1em] uppercase">Confirmed</span>
              </div>
            </div>
          </Block>
        )
      })}

      <Block fill="forest" className="col-span-7 flex min-h-[260px] flex-col justify-between p-8">
        <Label className="text-(--paper)/70">Where it stands</Label>
        <p className="mt-6 font-serif text-[36px] leading-[1.14] tracking-[-0.015em]">{h.stands}</p>
      </Block>
      <Block fill="subtle" className="col-span-5 flex flex-col justify-between p-8">
        <Label>{h.sinceLabel}</Label>
        <p className="mt-6 font-serif text-[32px] leading-[1.15] tracking-[-0.015em]">{h.since}</p>
      </Block>

      <Block fill="apricot" className="col-span-7 p-8">
        <div className="flex items-start justify-between">
          <Label>Needs you</Label>
          <span className="font-serif text-[88px] leading-[0.75] tracking-[-0.04em]">{h.decide.length + h.todo.length}</span>
        </div>
        <NeedList label="Decide" needs={h.decide} />
        <NeedList label="Do" needs={h.todo} />
      </Block>
      <Block fill="subtle" className="col-span-5 p-8">
        <Label>Working now</Label>
        <ul className="mt-6 space-y-3">
          {h.working.map((w) => (
            <li key={w.who} className="flex items-stretch bg-(--paper)">
              <span className="w-2 shrink-0" style={{ background: w.thread ? B[w.thread.pigment] : B.leaf }} />
              <div className="flex min-w-0 flex-1 items-center gap-4 p-4">
                <Square id={w.who} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[17px] font-semibold">{w.name}</span>
                    <span className="text-[13px] opacity-70">{w.thread?.name}</span>
                    <span className="ml-auto text-[13px] font-semibold tabular-nums">{w.since}</span>
                  </div>
                  <p className="mt-0.5 truncate text-[14px]"><span className="opacity-60">{w.tool} · </span>{w.doing}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Block>

      <Block fill="paper" className="col-span-12 pt-6">
        <div className="flex items-baseline gap-4">
          <Label>This week</Label>
          <span className="text-[13px] font-semibold opacity-60">{h.range}</span>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-3">
          {h.week.map((d) => (
            <div key={d.key} className={cn("flex min-h-[200px] flex-col p-4", d.today ? "bg-(--apricot)" : "bg-(--subtle)")}>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-[48px] leading-[0.8] tracking-[-0.03em]">{d.num}</span>
                <span className="text-[12px] font-semibold tracking-[0.1em] uppercase">{d.weekday}</span>
              </div>
              <ul className="mt-4 space-y-2">
                {d.events.map((e) => (
                  <li key={e.id} className="bg-(--forest-deep) px-2.5 py-2 text-(--paper)">
                    <div className="text-[11px] font-semibold opacity-70 tabular-nums">{e.time}</div>
                    <div className="text-[13px] leading-snug font-medium">{e.title}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Block>

      <Block fill="paper" className="col-span-12 pt-6">
        <Label>What changed</Label>
        <ul className="mt-4 grid grid-cols-2 gap-x-3">
          {h.changed.map((c) => {
            const Icon = c.kind === "artifact" ? KIND_ICON[c.artifact] : null
            return (
              <li key={c.id} className="flex items-center gap-4 border-t-[3px] border-(--forest-deep) py-4">
                <span className="flex size-10 shrink-0 items-center justify-center" style={{ background: c.thread ? B[c.thread.pigment] : B.subtle }}>
                  {c.kind === "decision" ? <MarkIcon mark={c.mark} className="size-5" /> : Icon && <Icon className="size-5" />}
                </span>
                <span className={cn("min-w-0 flex-1 truncate", c.kind === "decision" ? "font-serif text-[22px] leading-tight" : "text-[16px] font-semibold")}>{c.title}</span>
                <span className="shrink-0 text-[13px] font-semibold opacity-60">{c.meta}</span>
              </li>
            )
          })}
        </ul>
      </Block>
    </div>
  )
}

function NeedList({ label, needs }: { label: string; needs: HNeed[] }) {
  if (!needs.length) return null
  return (
    <div className="mt-6">
      <div className="text-[13px] font-semibold opacity-70">{label}</div>
      <ul className="mt-2">
        {needs.map((n) => (
          <li key={n.id} className="flex items-center gap-4 border-t-2 border-(--forest-deep) py-3.5">
            {n.mark ? <MarkIcon mark={n.mark} className="size-5" /> : <span className="size-5 shrink-0 border-2 border-(--forest-deep)" />}
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate", n.kind === "do" ? "text-[16px] font-semibold" : "font-serif text-[22px] leading-tight")}>{n.title}</span>
              <span className="mt-0.5 block truncate text-[13px] opacity-75">{n.sub}</span>
            </span>
            {n.actions.map((a) => <Button key={a.label} a={a} />)}
          </li>
        ))}
      </ul>
    </div>
  )
}
