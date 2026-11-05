import { useId, type ReactNode } from "react"
import { Check, Plus, Search } from "lucide-react"
import { MarkIcon } from "@/components/app/status-badge"
import { Blob, Paint, PaintButton, PaintSurface } from "@/components/brand/paint"
import { handPath } from "@/components/brand/hand"
import { KIND_ICON } from "@/playground/artifact"
import { cn } from "@/lib/utils"
import illRibbon from "@/assets/landing/ill-ribbon.webp"
import keep from "./assets/keep.webp"
import echo from "./assets/echo.webp"
import { BRAND as B, PROJECT_MARK, PROJECT_PAGES, INK, WASH, initialsOf, personPigment, useHifiHome, useHifiNav, useHifiToday, type HAction, type HNeed, type HThread, type Pigment } from "./model"
import { Scroll, type StyleProps } from "./shared"

// Warm and painterly: the hand-made shape kit in the product. Needs are sticky notes painted in
// washes, threads are ribbons woven across the project, people are daubs of pigment. Type stays
// crisp on top; overlaps multiply. Two illustrations a screen at most.

export function PainterlyStyle({ page, go }: StyleProps) {
  return (
    <div className="flex h-full bg-(--paper) text-(--forest)">
      <Sidebar page={page} go={go} />
      <Scroll>{page === "today" ? <Today /> : <Home />}</Scroll>
    </div>
  )
}

/* ---------------- painted pieces ---------------- */

type Pt = [number, number]
type RibbonSpec = { color: string; y: number; amp: number; waves: number; phase: number; w: number; turns?: number }

// A closed Catmull-Rom curve through the points, as cubic Béziers.
function smooth(pts: Pt[]) {
  const m = pts.length
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < m; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + m) % m], pts[i], pts[(i + 1) % m], pts[(i + 2) % m]]
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d + "Z"
}

// A ribbon across the box: a wavy band that narrows where it turns, like a strip of paper seen edge-on.
function ribbonPath(r: RibbonSpec, W: number, H: number) {
  const N = 64
  const top: Pt[] = []
  const bottom: Pt[] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const x = -60 + t * (W + 120)
    const y = r.y * H + r.amp * Math.sin(Math.PI * 2 * r.waves * t + r.phase) + r.amp * 0.22 * Math.sin(Math.PI * 2 * r.waves * 2.3 * t + r.phase * 1.7)
    const half = (r.w * (0.3 + 0.7 * Math.abs(Math.cos(Math.PI * (r.turns ?? 1.5) * t + r.phase * 0.6)))) / 2
    top.push([x, y - half])
    bottom.push([x, y + half])
  }
  return smooth([...top, ...bottom.reverse()])
}

function Ribbons({ ribbons, width, height, seed = 5, className }: { ribbons: RibbonSpec[]; width: number; height: number; seed?: number; className?: string }) {
  const id = useId().replace(/:/g, "")
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <defs><Paint id={`r${id}`} level="soft" seed={seed} /></defs>
      {ribbons.map((r, i) => <path key={i} d={ribbonPath(r, width, height)} fill={r.color} filter={`url(#r${id})`} style={{ mixBlendMode: "multiply" }} opacity={0.92} />)}
    </svg>
  )
}

// The project's threads, woven into one band: one ribbon per thread, in its pigment.
function ThreadRibbons({ threads, className }: { threads: HThread[]; className?: string }) {
  const specs: RibbonSpec[] = threads.map((t, i) => ({ color: B[t.pigment], y: 0.5, amp: 34 + (i % 2) * 10, waves: 1.6 + i * 0.18, phase: i * 1.55, w: 30 - i * 2, turns: 2 + i * 0.4 }))
  return <Ribbons ribbons={specs} width={1200} height={150} seed={9} className={className} />
}

// A short ribbon swatch for a thread in a list.
function Swatch({ pigment, className }: { pigment: Pigment; className?: string }) {
  return <Ribbons ribbons={[{ color: B[pigment], y: 0.5, amp: 3, waves: 1, phase: 0.6, w: 9, turns: 0.6 }]} width={30} height={16} seed={3} className={cn("h-4 w-[30px] shrink-0", className)} />
}

// A daub of pigment with something crisp on it: a face, a count, a project's icon.
function Daub({ color, seed = 4, size = 32, children, className }: { color: string; seed?: number; size?: number; children?: ReactNode; className?: string }) {
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      <Blob color={color} seed={seed} size={100} level="soft" className="absolute -inset-[14%] size-[128%]" />
      <span className="relative">{children}</span>
    </span>
  )
}

function Face({ id, size = 32, agent, onWash }: { id: string; size?: number; agent?: boolean; onWash?: boolean }) {
  const p = personPigment(id)
  return (
    <Daub color={onWash ? B.paper : WASH[p]} seed={id.charCodeAt(0) + id.charCodeAt(1)} size={size} className={agent ? "opacity-80" : undefined}>
      <span className="font-medium tracking-[0.02em]" style={{ color: INK[p], fontSize: Math.round(size * 0.34) }}>{initialsOf(id)}</span>
    </Daub>
  )
}

function ProjectDaub({ id, size = 26 }: { id: string; size?: number }) {
  const mark = PROJECT_MARK[id] ?? { icon: undefined, pigment: "leaf" as Pigment }
  const Icon = mark.icon
  return <Daub color={WASH[mark.pigment]} seed={id.length * 5} size={size}>{Icon && <Icon style={{ color: INK[mark.pigment], width: size * 0.5, height: size * 0.5 }} />}</Daub>
}

// A hand-drawn box to tick.
function Tickbox({ done, seed, onClick }: { done: boolean; seed: number; onClick?: () => void }) {
  return (
    <button type="button" aria-label={done ? "Done" : "Mark done"} onClick={onClick} className="relative mt-0.5 size-[18px] shrink-0">
      <svg viewBox="-2 -2 22 22" className="absolute inset-0 size-full" aria-hidden>
        <path d={handPath([[0, 0], [18, 0], [18, 18], [0, 18]], { seed, radius: 4, wobble: 0.7 })} fill={done ? B.leaf : "transparent"} stroke={done ? B.leaf : B.forest} strokeWidth="1.4" />
      </svg>
      {done && <Check className="absolute inset-0 m-auto size-3 text-(--paper)" strokeWidth={3} />}
    </button>
  )
}

const SOLID = [4, 8, 14, 24, 28, 5, 11]

function Action({ a, ink, seed }: { a: HAction; ink: string; seed: number }) {
  return a.primary
    ? <PaintButton size="sm" seed={SOLID[seed % SOLID.length]} onClick={a.run} className="shrink-0">{a.label}</PaintButton>
    : <button type="button" onClick={a.run} className="h-10 shrink-0 px-1 text-[14px] font-medium underline decoration-1 underline-offset-4 hover:opacity-70" style={{ color: ink, textDecorationColor: `${ink}66` }}>{a.label}</button>
}

function Heading({ children, count, pigment = "apricot", className }: { children: ReactNode; count?: number; pigment?: Pigment; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <h2 className="font-serif text-[30px] leading-none tracking-[-0.01em]">{children}</h2>
      {count !== undefined && <Daub color={WASH[pigment]} seed={count + 11} size={30}><span className="text-[13px] font-semibold tabular-nums" style={{ color: INK[pigment] }}>{count}</span></Daub>}
    </div>
  )
}

/* ---------------- shell ---------------- */

function Sidebar({ page, go }: StyleProps) {
  const nav = useHifiNav()
  return (
    <aside className="w-[264px] shrink-0 p-3">
      <PaintSurface color={B.subtle} seed={41} radius={30} level="soft" className="h-full">
        <div className="flex h-[calc(100svh-24px)] flex-col px-4 py-6">
          <div className="flex items-center gap-2.5 px-3">
            <PaintedY className="h-6 w-auto" />
            <span className="font-serif text-[22px] leading-none tracking-[-0.01em]">Whyspace</span>
          </div>
          <nav className="mt-9 flex flex-col gap-0.5">
            <Item active={page === "today"} onClick={() => go("today")} end={<span className="text-[12px] font-semibold text-(--apricot-ink) tabular-nums">{nav.today}</span>}>Today</Item>
            <Item start={<Search className="size-4 text-(--muted)" />}>Search</Item>
          </nav>
          <p className="mt-8 mb-2 px-3 text-[12px] font-medium text-(--muted)">Projects</p>
          <nav className="flex flex-col gap-0.5">
            {nav.projects.map((p) => (
              <div key={p.id}>
                <Item active={page === "home" && p.id === "whiskr"} onClick={p.id === "whiskr" ? () => go("home") : undefined} start={<ProjectDaub id={p.id} size={22} />}>{p.name}</Item>
                {p.id === "whiskr" && (
                  <div className="mt-0.5 mb-2 flex flex-col gap-0.5 pl-9">
                    {PROJECT_PAGES.slice(1).map((name) => <Item key={name} small>{name}</Item>)}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <p className="mt-6 mb-2 px-3 text-[12px] font-medium text-(--muted)">Threads</p>
          <nav className="flex flex-col gap-0.5">
            {nav.threads.map((t) => <Item key={t.id} start={<Swatch pigment={t.pigment} />}>{t.name}</Item>)}
          </nav>
          <div className="mt-auto flex items-center gap-2.5 px-3">
            <Face id={nav.me.id} size={30} />
            <span className="truncate text-[13px]">{nav.workspace}</span>
          </div>
        </div>
      </PaintSurface>
    </aside>
  )
}

function Item({ children, active, small, start, end, onClick }: { children: ReactNode; active?: boolean; small?: boolean; start?: ReactNode; end?: ReactNode; onClick?: () => void }) {
  const body = (
    <span className={cn("flex items-center gap-2.5 px-3", small ? "h-8 text-[13px]" : "h-9 text-[14px]")}>
      {start}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {end}
    </span>
  )
  return (
    <button type="button" onClick={onClick} className={cn("text-left transition-colors", active ? "font-medium" : "text-(--forest)/80 hover:text-(--forest)")}>
      {active ? <PaintSurface color={B.paper} seed={7} radius={14} level="soft" wobble={1}>{body}</PaintSurface> : body}
    </button>
  )
}

// The Y mark, painted.
function PaintedY({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "")
  return (
    <svg viewBox="-20 -20 535 690" className={className} aria-hidden>
      <defs><Paint id={`y${id}`} level="soft" seed={6} /></defs>
      <g filter={`url(#y${id})`} fill={B.forest}>
        <path d="M476.7 15.6Q495.0 0.0 495.0 24.0L495.0 173.4Q495.0 197.4 475.9 211.8L185.2 431.9Q166.1 446.4 166.1 422.4L166.1 304.7Q166.1 280.7 184.3 265.1Z" />
        <path d="M21.8 31.4Q1.2 19.0 1.0 43.0L0.2 174.5Q0.0 198.5 21.8 208.6L132.4 260.1Q154.1 270.2 172.3 254.6L245.7 191.6Q263.9 176.0 243.3 163.7Z" />
        <path d="M337.9 334.9Q356.9 320.2 356.9 344.2L356.9 483.3Q356.9 507.3 337.7 521.7L185.4 635.6Q166.2 650.0 166.2 626.0L166.2 491.3Q166.2 467.3 185.2 452.7Z" />
      </g>
    </svg>
  )
}

/* ---------------- Today ---------------- */

// Each kind of need is a sticky note in its own wash.
const NOTE: Record<HNeed["kind"], Pigment> = { clash: "rose", decide: "apricot", asked: "sky", invite: "sky", do: "leaf" }
const TILT = [-1.4, 1.1, -0.5, 1.6, -1.1, 0.6]

function Note({ n, i, wide }: { n: HNeed; i: number; wide: boolean }) {
  const p = NOTE[n.kind]
  return (
    <div className={cn("hf-note", wide ? "col-span-3" : "col-span-2")} style={{ rotate: `${TILT[i % TILT.length]}deg` }}>
      <PaintSurface color={WASH[p]} seed={i * 7 + 3} radius={8} level="painted" wobble={2}>
        <div className={cn("flex flex-col p-6 pb-5", wide ? "min-h-[232px]" : "min-h-[262px]")}>
          <div className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: INK[p] }}>
            {n.mark && <MarkIcon mark={n.mark} className="size-3.5" />}
            <span>{n.lead}</span>
            {n.thread && <span className="ml-auto flex items-center gap-1.5 font-normal"><Swatch pigment={n.thread.pigment} className="h-3.5 w-6" />{n.thread.name}</span>}
          </div>
          <h3 className={cn("mt-4", n.kind === "do" || n.kind === "invite" ? "text-[18px] leading-snug font-medium" : "font-serif text-[24px] leading-[1.18] tracking-[-0.01em]")}>{n.title}</h3>
          <p className="mt-2.5 text-[14px] leading-snug text-(--muted)">{n.sub}</p>
          <div className="mt-auto flex items-center gap-3 pt-6">
            <Face id={n.who} size={36} agent={n.agent} onWash />
            <div className="ml-auto flex items-center gap-2">
              {[...n.actions].reverse().map((a, k) => <Action key={a.label} a={a} ink={INK[p]} seed={i * 3 + k + 2} />)}
            </div>
          </div>
        </div>
      </PaintSurface>
    </div>
  )
}

function Today() {
  const t = useHifiToday()
  return (
    <div className="mx-auto max-w-[1220px] px-14 pt-12 pb-32">
      <header className="relative grid grid-cols-[minmax(0,1fr)_minmax(0,540px)] items-end gap-6">
        <div>
          <p className="text-[16px] text-(--muted)">{t.weekday}, {t.date}</p>
          <h1 className="mt-1 font-serif text-[96px] leading-[0.95] tracking-[-0.025em]">Today</h1>
          <p className="mt-6 max-w-[600px] font-serif text-[26px] leading-[1.3] tracking-[-0.01em]">{t.lead}</p>
        </div>
        <img src={keep} alt="" className="pointer-events-none -mr-14 mb-2 w-[580px] max-w-none justify-self-end mix-blend-multiply select-none [mask-image:linear-gradient(to_right,transparent,black_22%)]" />
      </header>

      <section aria-label="Needs you" className="mt-16">
        <Heading count={t.needs.length} pigment="apricot">Needs you</Heading>
        <div className="mt-8 grid grid-cols-6 gap-x-7 gap-y-8">
          {t.needs.map((n, i) => <Note key={n.id} n={n} i={i} wide={i < 2 && t.needs.length > 3} />)}
        </div>
      </section>

      <div className="mt-20 grid grid-cols-[minmax(0,1fr)_360px] gap-14">
        <div className="min-w-0 space-y-16">
          <section aria-label="Across your projects">
            <Heading>Across your projects</Heading>
            <div className="mt-6 space-y-3">
              {t.recap.map((r, i) => (
                <PaintSurface key={r.id} color={B.subtle} seed={60 + i} radius={20} level="soft">
                  <div className="flex items-center gap-4 px-5 py-4">
                    <ProjectDaub id={r.id} size={34} />
                    <h3 className="w-48 shrink-0 truncate font-serif text-[22px] leading-tight">{r.name}</h3>
                    <p className="min-w-0 flex-1 truncate text-[15px] text-(--muted)">{r.summary}</p>
                    {r.unread > 0 && <span className="shrink-0 text-[13px] font-semibold text-(--apricot-ink)">{r.unread} new</span>}
                  </div>
                </PaintSurface>
              ))}
            </div>
          </section>

          <section aria-label="Handled" className="relative">
            <img src={echo} alt="" className="pointer-events-none absolute -top-14 right-0 w-[150px] mix-blend-multiply select-none [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent),linear-gradient(to_bottom,transparent,black_14%,black_90%,transparent)]" />
            <Heading>Handled</Heading>
            <ul className="mt-6 space-y-1">
              {t.handled.map((l, i) => (
                <li key={l.id} className="flex items-center gap-4 rounded-2xl px-2 py-2.5">
                  <Daub color={l.agent ? B.skyWash : B.leafWash} seed={i + 30} size={26}>
                    {l.agent ? <PaintedY className="h-3 w-auto" /> : <Check className="size-3.5 text-(--leaf-ink)" strokeWidth={2.5} />}
                  </Daub>
                  <span className="min-w-0 flex-1 text-[15px] leading-snug">{l.text}</span>
                  <span className="shrink-0 text-[13px] text-(--muted) tabular-nums">{l.when}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-8">
          <PaintSurface color={B.skyWash} seed={71} radius={26} level="soft">
            <div className="p-6">
              <h2 className="font-serif text-[26px] leading-none">Coming up</h2>
              <div className="mt-5 space-y-5">
                {t.upcoming.map((g) => (
                  <div key={g.label}>
                    <p className="text-[13px] font-semibold text-(--sky-ink)">{g.label}</p>
                    <ul className="mt-2 space-y-2">
                      {g.events.map((e) => (
                        <li key={e.id} className="flex items-baseline gap-3 text-[15px]">
                          <span className="w-11 shrink-0 text-[13px] text-(--sky-ink) tabular-nums">{e.time}</span>
                          <span className="min-w-0 leading-snug">{e.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </PaintSurface>

          <PaintSurface color={B.leafWash} seed={77} radius={26} level="soft">
            <div className="p-6">
              <h2 className="font-serif text-[26px] leading-none">My tasks</h2>
              <ul className="mt-5 space-y-3.5">
                {t.tasks.map((x, i) => (
                  <li key={x.id} className="flex items-start gap-3">
                    <Tickbox done={x.done} seed={i + 4} onClick={x.done ? undefined : x.finish} />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-[15px] leading-snug", x.done && "text-(--muted) line-through")}>{x.title}</span>
                      <span className="mt-0.5 block text-[13px] text-(--leaf-ink)">{x.due}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </PaintSurface>
        </aside>
      </div>
    </div>
  )
}

/* ---------------- Home ---------------- */

function Home() {
  const h = useHifiHome()
  return (
    <div className="mx-auto max-w-[1220px] px-14 pt-12 pb-32">
      <header>
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-6">
            <ProjectDaub id="whiskr" size={76} />
            <h1 className="font-serif text-[96px] leading-[0.95] tracking-[-0.025em]">{h.name}</h1>
          </div>
          <div className="flex items-center gap-4 pt-3">
            <div className="flex -space-x-2.5">{h.members.map((m) => <span key={m.id} className="mix-blend-multiply"><Face id={m.id} size={36} /></span>)}</div>
            <PaintButton size="sm" seed={12} color={B.apricotWash} ink={B.forest}><Search className="size-4" /></PaintButton>
            <PaintButton size="sm" seed={4}><Plus className="size-4" />New</PaintButton>
          </div>
        </div>
        <p className="mt-7 max-w-[820px] font-serif text-[27px] leading-[1.3] tracking-[-0.01em]">{h.stands}</p>
      </header>

      <ThreadRibbons threads={h.threads} className="-mx-14 mt-4 block h-[150px] w-[calc(100%+7rem)] [mask-image:linear-gradient(to_right,transparent,black_9%)]" />

      <section aria-label="Threads" className="mt-2 grid grid-cols-4 gap-5">
        {h.threads.map((t, i) => (
          <PaintSurface key={t.id} color={WASH[t.pigment]} seed={80 + i * 3} radius={22} level="painted">
            <div className="flex min-h-[188px] flex-col p-5">
              <h3 className="font-serif text-[28px] leading-none tracking-[-0.01em]" style={{ color: INK[t.pigment] }}>{t.name}</h3>
              <p className="mt-3 text-[14px] leading-snug">{t.intent}</p>
              <div className="mt-auto flex items-center gap-2 pt-4">
                <span className="flex items-center gap-1">{Array.from({ length: t.m }, (_, k) => k < t.n
                  ? <Daub key={k} color={B[t.pigment]} seed={k + i * 9} size={11} />
                  : <span key={k} className="size-[10px] rounded-full border-[1.5px]" style={{ borderColor: INK[t.pigment] }} />)}</span>
                <span className="text-[13px] font-medium" style={{ color: INK[t.pigment] }}>{t.n} of {t.m} confirmed</span>
              </div>
            </div>
          </PaintSurface>
        ))}
      </section>

      <div className="mt-16 grid grid-cols-[minmax(0,1fr)_380px] gap-14">
        <div className="min-w-0 space-y-14">
          <PaintSurface color={B.subtle} seed={91} radius={30} level="soft">
            <div className="p-8">
              <p className="text-[13px] font-semibold text-(--muted)">{h.sinceLabel}</p>
              <p className="mt-2 font-serif text-[28px] leading-[1.25] tracking-[-0.01em]">{h.since}</p>
              <Group label="Decide" needs={h.decide} />
              <Group label="Do" needs={h.todo} />
            </div>
          </PaintSurface>

          <section aria-label="What changed">
            <Heading count={h.changed.length} pigment="sky">What changed</Heading>
            <ul className="mt-5 space-y-1">
              {h.changed.map((c) => {
                const Icon = c.kind === "artifact" ? KIND_ICON[c.artifact] : null
                return (
                  <li key={c.id} className="flex items-center gap-3 rounded-2xl px-2 py-2.5">
                    <span className="flex w-7 shrink-0 justify-center">{c.kind === "decision" ? <MarkIcon mark={c.mark} className="size-4" /> : Icon && <Icon className="size-4 text-(--muted)" />}</span>
                    <span className={cn("min-w-0 flex-1 truncate", c.kind === "decision" ? "font-serif text-[19px]" : "text-[15px] font-medium")}>{c.title}</span>
                    {c.thread && <Swatch pigment={c.thread.pigment} />}
                    <span className="w-28 shrink-0 truncate text-right text-[13px] text-(--muted)">{c.meta}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>

        <aside className="space-y-12">
          <section aria-label="Working now">
            <div className="flex items-end justify-between">
              <Heading count={h.working.length} pigment="leaf">Working now</Heading>
              <img src={illRibbon} alt="" className="pointer-events-none -mt-6 -mb-3 w-[150px] mix-blend-multiply select-none" />
            </div>
            <ul className="mt-5 space-y-4">
              {h.working.map((w) => (
                <li key={w.who} className="flex items-start gap-3.5">
                  <Face id={w.who} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[15px]">
                      <span className="font-medium">{w.name}</span>
                      {w.thread && <span className="flex items-center gap-1 text-[13px] text-(--muted)"><Swatch pigment={w.thread.pigment} className="h-3.5 w-6" />{w.thread.name}</span>}
                      <span className="ml-auto text-[13px] text-(--muted)">{w.since}</span>
                    </span>
                    <span className="mt-0.5 block text-[14px] leading-snug"><span className="text-(--muted)">{w.tool} · </span>{w.doing}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="This week">
            <div className="flex items-baseline justify-between">
              <Heading>This week</Heading>
              <span className="text-[13px] text-(--muted)">{h.range}</span>
            </div>
            <ul className="mt-5 space-y-2.5">
              {h.week.map((d, i) => (
                <li key={d.key} className="flex items-start gap-3">
                  <PaintSurface color={d.today ? B.apricotWash : B.subtle} seed={100 + i} radius={12} level="soft" className="shrink-0">
                    <span className={cn("flex h-11 w-14 flex-col items-center justify-center leading-none", d.today && "text-(--apricot-ink)")}>
                      <span className="text-[11px] font-medium">{d.weekday}</span>
                      <span className="mt-1 font-serif text-[19px]">{d.num}</span>
                    </span>
                  </PaintSurface>
                  <span className="min-w-0 flex-1 space-y-1 pt-1">
                    {d.events.length ? d.events.map((e) => (
                      <span key={e.id} className="flex items-baseline gap-2.5 text-[14px] leading-snug"><span className="w-10 shrink-0 text-[13px] text-(--muted) tabular-nums">{e.time}</span><span className="min-w-0">{e.title}</span></span>
                    )) : <span className="block pt-2 text-[13px] text-(--muted)/50">—</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}

function Group({ label, needs }: { label: string; needs: HNeed[] }) {
  if (!needs.length) return null
  return (
    <div className="mt-8">
      <p className="text-[13px] font-semibold text-(--muted)">{label}</p>
      <ul className="mt-3 space-y-2.5">
        {needs.map((n, i) => {
          const p = NOTE[n.kind]
          return (
            <li key={n.id}>
              <PaintSurface color={B.paper} seed={110 + i * 5 + label.length} radius={16} level="soft">
                <div className="flex items-center gap-4 py-3.5 pr-4 pl-4">
                  <Daub color={WASH[p]} seed={i + label.length} size={30}>
                    {n.mark ? <span style={{ color: INK[p] }}><MarkIcon mark={n.mark} className="size-3.5" /></span> : <Check className="size-3.5" style={{ color: INK[p] }} strokeWidth={2.5} />}
                  </Daub>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate", n.kind === "do" ? "text-[15px] font-medium" : "font-serif text-[20px] leading-tight")}>{n.title}</span>
                    <span className="mt-0.5 block truncate text-[13px] text-(--muted)">{n.sub}</span>
                  </span>
                  {n.actions.map((a, k) => <Action key={a.label} a={a} ink={INK[p]} seed={i * 4 + k + 20} />)}
                </div>
              </PaintSurface>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
