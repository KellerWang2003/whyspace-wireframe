import type { ReactNode } from "react"
import { ArrowUpRight, Plus, Search } from "lucide-react"
import { MarkIcon } from "@/components/app/status-badge"
import { KIND_ICON } from "@/playground/artifact"
import { cn } from "@/lib/utils"
import { BRAND as B, PROJECT_MARK, PROJECT_PAGES, INK, PIGMENTS, initialsOf, useHifiHome, useHifiNav, useHifiToday, type HAction, type HNeed, type HThread, type Pigment } from "./model"
import { Scroll, YMark, type StyleProps } from "./shared"

// Restrained and editorial: a paper page set like a journal. Type does the work: Geist Serif for the
// why (decisions, questions, summaries), Instrument Sans for the work, mono for times and labels.
// Hairlines instead of boxes. Pigment only as a strand tick, and once as the threads converging.

export function EditorialStyle({ page, go }: StyleProps) {
  return (
    <div className="flex h-full bg-(--paper) text-(--forest)">
      <Sidebar page={page} go={go} />
      <Scroll>{page === "today" ? <Today /> : <Home />}</Scroll>
    </div>
  )
}

/* ---------------- shell ---------------- */

function Sidebar({ page, go }: StyleProps) {
  const nav = useHifiNav()
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-(--line) px-4 py-6">
      <div className="flex items-center gap-2.5 px-3">
        <YMark color={B.forest} className="h-[18px] w-auto" />
        <span className="font-serif text-[19px] leading-none tracking-[-0.01em]">Whyspace</span>
      </div>
      <nav className="mt-10 flex flex-col">
        <Item active={page === "today"} onClick={() => go("today")} end={<span className="font-mono text-[11px] tabular-nums">{nav.today}</span>}>Today</Item>
        <Item>Search</Item>
      </nav>
      <Label className="mt-9 mb-2 px-3">Projects</Label>
      <nav className="flex flex-col">
        {nav.projects.map((p) => (
          <div key={p.id}>
            <Item active={page === "home" && p.id === "whiskr"} onClick={p.id === "whiskr" ? () => go("home") : undefined}>{p.name}</Item>
            {p.id === "whiskr" && (
              <div className="mb-2 ml-3 flex flex-col border-l border-(--line) pl-2">
                {PROJECT_PAGES.slice(1).map((name) => <Item key={name} small>{name}</Item>)}
              </div>
            )}
          </div>
        ))}
      </nav>
      <Label className="mt-7 mb-2 px-3">Threads</Label>
      <nav className="flex flex-col">
        {nav.threads.map((t) => <Item key={t.id} start={<Tick pigment={t.pigment} />}>{t.name}</Item>)}
      </nav>
      <div className="mt-auto flex items-center gap-2.5 px-3">
        <Face id={nav.me.id} />
        <span className="truncate text-[13px]">{nav.workspace}</span>
      </div>
    </aside>
  )
}

function Item({ children, active, small, start, end, onClick }: { children: ReactNode; active?: boolean; small?: boolean; start?: ReactNode; end?: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("group relative flex items-center gap-2.5 rounded-md px-3 text-left transition-colors", small ? "h-7 text-[13px]" : "h-8 text-[14px]", active ? "font-medium text-(--forest)" : "text-(--muted) hover:text-(--forest)")}>
      {active && <span aria-hidden className="absolute top-1/2 -left-1 h-4 w-[2px] -translate-y-1/2 rounded-full bg-(--forest)" />}
      {start}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {end}
    </button>
  )
}

/* ---------------- parts ---------------- */

function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("font-mono text-[11px] tracking-[0.08em] text-(--muted) uppercase", className)}>{children}</div>
}

// A thread's strand: a short band leaning like the Y's.
function Tick({ pigment, className }: { pigment: Pigment; className?: string }) {
  return (
    <svg viewBox="0 0 8 12" className={cn("h-3 w-2 shrink-0", className)} aria-hidden>
      <path d="M1.5 0H4.5L6.5 12H3.5Z" fill={B[pigment]} />
    </svg>
  )
}

function Face({ id, agent, className }: { id: string; agent?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium tracking-[0.02em]", agent ? "border-dashed border-(--muted)" : "border-(--forest)/40", className)}>
      {initialsOf(id)}
    </span>
  )
}

// The masthead rule: four strands come in from the left and run on as one line.
function ThreadLine({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center", className)} aria-hidden>
      <svg viewBox="0 0 160 28" className="h-7 w-40 shrink-0 overflow-visible">
        {PIGMENTS.map((p, i) => (
          <path key={p} d={`M0 ${2 + i * 8} C 60 ${2 + i * 8}, 90 14, 160 14`} fill="none" stroke={B[p]} strokeWidth="1.5" />
        ))}
      </svg>
      <span className="h-[1.5px] flex-1 bg-(--forest)" />
    </div>
  )
}

function Masthead({ kicker, title, right }: { kicker: ReactNode; title: string; right?: ReactNode }) {
  return (
    <header>
      <div className="flex h-9 items-center justify-between gap-6">
        <Label>{kicker}</Label>
        {right}
      </div>
      <h1 className="mt-4 font-serif text-[112px] leading-[0.92] tracking-[-0.03em]">{title}</h1>
      <ThreadLine className="mt-8" />
    </header>
  )
}

function Section({ label, count, aside, children, className }: { label: string; count?: number; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-label={label} className={className}>
      <div className="flex items-baseline gap-3 pb-4">
        <Label className="text-(--forest)">{label}</Label>
        {count !== undefined && <span className="font-mono text-[11px] text-(--muted) tabular-nums">{String(count).padStart(2, "0")}</span>}
        {aside && <span className="ml-auto">{aside}</span>}
      </div>
      {children}
    </section>
  )
}

function Action({ a }: { a: HAction }) {
  return a.primary ? (
    <button type="button" onClick={a.run} className="h-9 shrink-0 rounded-full bg-(--forest) px-4 text-[13px] font-medium text-(--paper) transition-colors hover:bg-(--forest-deep)">{a.label}</button>
  ) : (
    <button type="button" onClick={a.run} className="h-9 shrink-0 text-[13px] font-medium underline decoration-(--line) decoration-1 underline-offset-[5px] transition-colors hover:decoration-(--forest)">{a.label}</button>
  )
}

// Serif for the why (decisions and questions), sans for the work.
const isWhy = (n: HNeed) => n.kind === "clash" || n.kind === "decide" || n.kind === "asked"

function Need({ n, index, compact }: { n: HNeed; index: number; compact?: boolean }) {
  const lead = compact && n.kind === "do" ? null : n.lead
  return (
    <li className={cn("grid grid-cols-[40px_minmax(0,1fr)_auto] items-start gap-x-5 border-t border-(--line)", compact ? "py-5" : "py-6")}>
      <span className="pt-[3px] font-mono text-[11px] text-(--muted) tabular-nums">{String(index).padStart(2, "0")}</span>
      <div className="min-w-0">
        <div className={cn("flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] uppercase", n.kind === "clash" ? "text-(--rose-ink)" : "text-(--muted)")}>
          {n.mark && <MarkIcon mark={n.mark} className="size-3.5" />}
          {lead && <span>{lead}</span>}
          {n.thread && <>{lead && <span aria-hidden>·</span>}<Tick pigment={n.thread.pigment} /><span>{n.thread.name}</span></>}
        </div>
        <h3 className={cn("mt-2", isWhy(n) ? cn("font-serif tracking-[-0.01em]", compact ? "text-[21px] leading-[1.25]" : "text-[25px] leading-[1.2]") : "text-[17px] leading-snug font-medium")}>{n.title}</h3>
        <p className="mt-1.5 text-[14px] leading-relaxed text-(--muted)">{n.sub}</p>
      </div>
      <div className={cn("flex items-center gap-4", compact ? "pt-4" : "pt-6")}>
        {n.actions.map((a) => <Action key={a.label} a={a} />)}
      </div>
    </li>
  )
}

/* ---------------- Today ---------------- */

function Today() {
  const t = useHifiToday()
  const open = t.tasks.filter((x) => !x.done)
  const dayOf = (d: string) => (d === "today" ? "Today" : d === "yesterday" ? "Yesterday" : "Earlier")
  return (
    <div className="mx-auto max-w-[1180px] px-16 pt-12 pb-28">
      <Masthead kicker={`${t.weekday} · ${t.date}`} title="Today" />
      <p className="mt-9 max-w-[820px] font-serif text-[30px] leading-[1.28] tracking-[-0.012em]">{t.lead}</p>

      <div className="mt-16 grid grid-cols-[minmax(0,1fr)_280px] gap-x-20">
        <div className="min-w-0 space-y-16">
          <Section label="Needs you" count={t.needs.length}>
            {t.needs.length
              ? <ol>{t.needs.map((n, i) => <Need key={n.id} n={n} index={i + 1} />)}</ol>
              : <p className="border-t border-(--line) py-6 font-serif text-[22px]">Nothing waits on you.</p>}
          </Section>

          <Section label="Across your projects">
            <div className="grid grid-cols-3 gap-x-8">
              {t.recap.map((r) => (
                <article key={r.id} className="border-t border-(--forest) pt-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="truncate font-serif text-[22px] leading-tight">{r.name}</h3>
                    {r.unread > 0 && <span className="shrink-0 font-mono text-[11px] tracking-[0.06em] text-(--apricot-ink) uppercase">{r.unread} new</span>}
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-(--muted)">{r.summary}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section label="Handled">
            <ul className="border-t border-(--line)">
              {t.handled.map((l, i) => {
                const day = dayOf(l.day)
                const head = i === 0 || day !== dayOf(t.handled[i - 1].day)
                return (
                  <li key={l.id} className="grid grid-cols-[96px_20px_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-(--line) py-3 text-[14px]">
                    <span className="font-mono text-[11px] tracking-[0.06em] text-(--muted) uppercase">{head ? day : ""}</span>
                    <span className="self-center">{l.agent ? <YMark color={B.forest} className="h-3 w-auto" /> : <span className="block size-1.5 rounded-full bg-(--forest)" />}</span>
                    <span className="min-w-0">{l.text}</span>
                    <span className="font-mono text-[11px] text-(--muted) tabular-nums">{l.when === day ? "" : l.when}</span>
                  </li>
                )
              })}
            </ul>
          </Section>
        </div>

        <aside className="space-y-14">
          <Section label="Coming up">
            <div className="border-t border-(--line)">
              {t.upcoming.map((g) => (
                <div key={g.label} className="grid grid-cols-[52px_minmax(0,1fr)] gap-x-3 border-b border-(--line) py-4">
                  <div className="leading-none">
                    <div className="font-mono text-[11px] tracking-[0.06em] text-(--muted) uppercase">{g.weekday}</div>
                    <div className="mt-1.5 font-serif text-[28px] leading-none">{g.num}</div>
                  </div>
                  <ul className="space-y-2.5 pt-0.5">
                    {g.events.map((e) => (
                      <li key={e.id}>
                        <div className="text-[14px] leading-snug font-medium">{e.title}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-(--muted) tabular-nums">{e.time} · {e.mins} min</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section label="My tasks" count={open.length}>
            <ul className="border-t border-(--line)">
              {t.tasks.map((x) => (
                <li key={x.id} className="flex items-start gap-3 border-b border-(--line) py-3">
                  <button type="button" aria-label={x.done ? "Done" : "Mark done"} onClick={x.done ? undefined : x.finish} className={cn("mt-0.5 size-3.5 shrink-0 rounded-[3px] border border-(--forest) transition-colors", x.done ? "bg-(--forest)" : "hover:bg-(--subtle)")} />
                  <div className="min-w-0 flex-1">
                    <div className={cn("text-[14px] leading-snug", x.done && "text-(--muted) line-through decoration-(--line)")}>{x.title}</div>
                    <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-(--muted)">
                      {x.thread && <Tick pigment={x.thread.pigment} className="h-2.5" />}{x.due}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        </aside>
      </div>
    </div>
  )
}

/* ---------------- Home ---------------- */

function Home() {
  const h = useHifiHome()
  const mark = PROJECT_MARK.whiskr
  return (
    <div className="mx-auto max-w-[1180px] px-16 pt-12 pb-28">
      <Masthead
        kicker={<span className="flex items-center gap-2"><mark.icon className="size-3.5" />Project</span>}
        title={h.name}
        right={
          <div className="flex items-center gap-5">
            <div className="flex -space-x-1.5">{h.members.map((m) => <Face key={m.id} id={m.id} className="bg-(--paper)" />)}</div>
            <button type="button" aria-label="Search" className="flex size-9 items-center justify-center rounded-full text-(--muted) hover:text-(--forest)"><Search className="size-4" /></button>
            <button type="button" className="flex h-9 items-center gap-1.5 rounded-full bg-(--forest) pr-4 pl-3 text-[13px] font-medium text-(--paper) hover:bg-(--forest-deep)"><Plus className="size-4" />New</button>
          </div>
        }
      />
      <p className="mt-9 max-w-[860px] font-serif text-[30px] leading-[1.28] tracking-[-0.012em]">{h.stands}</p>

      <section aria-label="Threads" className="mt-14 grid grid-cols-4 gap-x-8">
        {h.threads.map((t) => <ThreadColumn key={t.id} t={t} />)}
      </section>

      <div className="mt-16 grid grid-cols-[minmax(0,1fr)_280px] gap-x-20">
        <div className="min-w-0 space-y-16">
          <Section label="Since you were here" aside={<Label>{h.sinceLabel}</Label>}>
            <p className="border-t border-(--line) pt-5 font-serif text-[24px] leading-[1.32] tracking-[-0.01em]">{h.since}</p>
          </Section>
          <Section label="Decide" count={h.decide.length}>
            <ol>{h.decide.map((n, i) => <Need key={n.id} n={n} index={i + 1} compact />)}</ol>
          </Section>
          <Section label="Do" count={h.todo.length}>
            <ol>{h.todo.map((n, i) => <Need key={n.id} n={n} index={i + 1} compact />)}</ol>
          </Section>
          <Section label="What changed" count={h.changed.length}>
            <ul className="border-t border-(--line)">
              {h.changed.map((c) => {
                const Icon = c.kind === "artifact" ? KIND_ICON[c.artifact] : null
                return (
                  <li key={c.id} className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-(--line) py-3">
                    <span className="self-center">{c.kind === "decision" ? <MarkIcon mark={c.mark} className="size-3.5" /> : Icon && <Icon className="size-3.5 text-(--muted)" />}</span>
                    <span className={cn("min-w-0 truncate", c.kind === "decision" ? "font-serif text-[18px]" : "text-[14px] font-medium")}>{c.title}</span>
                    <span className="flex items-center gap-1.5 font-mono text-[11px] text-(--muted)">{c.thread && <Tick pigment={c.thread.pigment} className="h-2.5" />}{c.meta}</span>
                  </li>
                )
              })}
            </ul>
          </Section>
        </div>

        <aside className="space-y-14">
          <Section label="Working now" count={h.working.length}>
            <ul className="border-t border-(--line)">
              {h.working.map((w) => (
                <li key={w.who} className="border-b border-(--line) py-4">
                  <div className="flex items-center gap-2.5">
                    <Face id={w.who} />
                    <span className="text-[14px] font-medium">{w.name}</span>
                    {w.thread && <span className="flex items-center gap-1 text-[12px] text-(--muted)"><Tick pigment={w.thread.pigment} className="h-2.5" />{w.thread.name}</span>}
                    <span className="ml-auto font-mono text-[11px] text-(--muted)">{w.since}</span>
                  </div>
                  <p className="mt-2 pl-[38px] text-[13px] leading-snug"><span className="text-(--muted)">{w.tool} · </span>{w.doing}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section label="This week" aside={<Label>{h.range}</Label>}>
            <ul className="border-t border-(--line)">
              {h.week.map((d) => (
                <li key={d.key} className="grid grid-cols-[52px_minmax(0,1fr)] gap-x-3 border-b border-(--line) py-2.5">
                  <span className={cn("font-mono text-[11px] tracking-[0.06em] uppercase tabular-nums", d.today ? "text-(--forest)" : "text-(--muted)")}>{d.weekday} {d.num}</span>
                  <span className="min-w-0 space-y-1 text-[13px] leading-snug">
                    {d.events.length ? d.events.map((e) => <span key={e.id} className="flex gap-2"><span className="w-10 shrink-0 font-mono text-[11px] text-(--muted) tabular-nums">{e.time}</span><span className="min-w-0">{e.title}</span></span>) : <span className="text-(--line)">—</span>}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section label="Members" count={h.members.length}>
            <ul className="border-t border-(--line)">
              {h.members.map((m) => (
                <li key={m.id} className="flex items-center gap-2.5 border-b border-(--line) py-2.5">
                  <Face id={m.id} />
                  <span className="text-[14px]">{m.name}</span>
                  <span className="ml-auto truncate text-[12px] text-(--muted)">{m.role}</span>
                </li>
              ))}
            </ul>
          </Section>
        </aside>
      </div>
    </div>
  )
}

function ThreadColumn({ t }: { t: HThread }) {
  return (
    <article className="group cursor-default border-t-2 pt-4" style={{ borderColor: B[t.pigment] }}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-serif text-[26px] leading-tight tracking-[-0.01em]">{t.name}</h3>
        <ArrowUpRight className="size-4 text-(--muted) opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="mt-2 min-h-[44px] text-[14px] leading-relaxed text-(--muted)">{t.intent}</p>
      <div className="mt-4 flex items-center gap-2">
        <span className="flex gap-1">
          {Array.from({ length: t.m }, (_, i) => <span key={i} className={cn("size-[7px] rounded-full border", i < t.n ? "bg-current" : "")} style={{ color: INK[t.pigment], borderColor: INK[t.pigment] }} />)}
        </span>
        <span className="font-mono text-[11px] text-(--muted) tabular-nums">{t.n} of {t.m}</span>
      </div>
    </article>
  )
}
