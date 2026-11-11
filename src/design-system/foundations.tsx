import type { ReactNode } from "react"
import { Check, MessageCircle, Plus, Search, Spline } from "lucide-react"
import { MarkIcon, StatusLegend } from "@/components/app/status-badge"
import { MARKS, MARK_CHAR, MARK_LABEL } from "@/lib/marks"
import { PIGMENT } from "@/components/brand/hand"
import { MarksRow } from "@/app/card"
import { decisionsOf } from "@/app/card-model"
import { SURE_LABEL, SURE_LEVELS } from "@/app/duet"
import { SureMark } from "@/app/sure-mark"
import { ARTIFACTS, TASKS, WEEK_SUMMARY, decisionById, projectName } from "@/data"
import { useHifi } from "@/lib/hifi"
import { cn } from "@/lib/utils"
import { Code, Group, Specimen } from "./kit"
import { cssVar, family, lengthPx, lightness, px, shadowOf, toHex, tracking, useComputed } from "./measure"

/* ---------- Type ---------- */

// Each role with a line the product really shows in it.
const ROLES: { cls: string; text: string }[] = [
  { cls: "type-display", text: "Welcome back" },
  { cls: "type-title", text: decisionById("nored")?.title ?? "Change the brand color from red to blue" },
  { cls: "type-heading", text: "Start with a thread" },
  { cls: "type-subhead", text: "Duet settings" },
  { cls: "type-section", text: "While you were away" },
  { cls: "type-prose", text: WEEK_SUMMARY.whiskr ?? "The brand color is now blue, but the posters are still red." },
  { cls: "type-body", text: TASKS.find((t) => t.project === projectName("whiskr"))?.title ?? "Plan the 15-second promo video" },
  { cls: "type-label", text: "Waiting for you" },
  { cls: "type-caption", text: "Trevor · Claude · Oct 22" },
]

const SPEC_COLS = "md:grid-cols-[104px_minmax(0,1fr)_64px_64px_48px_112px]"

function Spec({ children }: { children: ReactNode }) {
  return <span className="type-caption text-muted-foreground tabular-nums">{children}</span>
}

function TypeRow({ cls, text }: { cls: string; text: string }) {
  const [ref, c] = useComputed<HTMLParagraphElement>()
  return (
    <div className={cn("grid items-baseline gap-x-6 gap-y-2 py-5", SPEC_COLS)}>
      <Code>{cls}</Code>
      <p ref={ref} className={cn(cls, "min-w-0 text-pretty")}>{text}</p>
      <div className="flex gap-4 md:contents">
        <Spec>{c && `${px(c.fontSize)}/${px(c.lineHeight)}`}</Spec>
        <Spec>{c && tracking(c.letterSpacing, c.fontSize)}</Spec>
        <Spec>{c && (parseFloat(c.webkitTextStrokeWidth) > 0 ? `${c.fontWeight}, +${parseFloat(c.webkitTextStrokeWidth)}px stroke` : c.fontWeight)}</Spec>
        <Spec>{c && family(c.fontFamily)}</Spec>
      </div>
    </div>
  )
}

export function TypeSection() {
  return (
    <div>
      <div className={cn("hidden gap-x-6 pb-3 type-label text-muted-foreground md:grid", SPEC_COLS)} aria-hidden>
        <span>Role</span><span /><span>Size</span><span>Tracking</span><span>Weight</span><span>Font</span>
      </div>
      <div className="divide-y border-t">
        {ROLES.map((r) => <TypeRow key={r.cls} {...r} />)}
      </div>
    </div>
  )
}

/* ---------- Color ---------- */

// Every color token the app reads (charts are left out: no screen draws one).
const APP_TOKENS = [
  "--background", "--foreground", "--card", "--card-foreground", "--popover", "--popover-foreground",
  "--primary", "--primary-foreground", "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
  "--accent", "--accent-foreground", "--destructive", "--border", "--input", "--ring",
  "--sidebar", "--sidebar-foreground", "--sidebar-primary", "--sidebar-primary-foreground",
  "--sidebar-accent", "--sidebar-accent-foreground", "--sidebar-border", "--sidebar-ring",
]

// The brand colors index.css puts on those tokens, by their identity-system names. Every other token is a gray.
const BRAND: [string, string][] = [
  ["--brand-paper", "Paper"], ["--brand-leaf", "Leaf"], ["--brand-rose-ink", "Rose ink"], ["--brand-forest", "Forest"],
]

// Tokens that share a value share a swatch, lightest first, so the real palette shows.
function appPalette() {
  const byHex = new Map<string, string[]>()
  for (const name of APP_TOKENS) {
    const hex = toHex(cssVar(name))
    byHex.set(hex, [...(byHex.get(hex) ?? []), name])
  }
  const named = new Map(BRAND.map(([v, label]) => [toHex(cssVar(v)), label]))
  return [...byHex]
    .map(([hex, names]) => ({ hex, names, label: named.get(hex) }))
    .sort((a, b) => lightness(b.hex) - lightness(a.hex))
}

const words = (key: string) => key.replace(/([A-Z])/g, " $1").toLowerCase().replace(/^./, (c) => c.toUpperCase())

function Chip({ color, className }: { color: string; className?: string }) {
  return <span aria-hidden className={cn("block rounded-md border border-foreground/10", className)} style={{ background: color }} />
}

function Swatches({ colors }: { colors: ReturnType<typeof appPalette> }) {
  return (
    <ul className="divide-y border-y">
      {colors.map(({ hex, names, label }) => (
        <li key={hex} className="flex items-center gap-4 py-2.5">
          <Chip color={`var(${names[0]})`} className="h-8 w-14 shrink-0" />
          <span className="flex w-[72px] shrink-0 flex-col">
            {label && <span className="type-label">{label}</span>}
            <Code className="text-foreground">{hex}</Code>
          </span>
          <span className="flex min-w-0 flex-wrap gap-x-3 gap-y-0.5">{names.map((n) => <Code key={n}>{n}</Code>)}</span>
        </li>
      ))}
    </ul>
  )
}

// With High-fi off the app is all grays, so Brand drops out and every token shows under Grays.
export function ColorSection() {
  const app = appPalette()
  const brand = app.filter((c) => c.label)
  const inApp = new Set(app.map((c) => c.hex))
  const pigments = (Object.entries(PIGMENT) as [string, string][]).filter(([, hex]) => !inApp.has(hex.toUpperCase()))
  return (
    <>
      {brand.length > 0 && <Group title="Brand"><Swatches colors={brand} /></Group>}
      <Group title="Grays" note={brand.length > 0 ? "Text and secondary actions" : undefined}><Swatches colors={app.filter((c) => !c.label)} /></Group>
      <Group title="Pigments" note="Home page only">
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 xl:grid-cols-4">
          {pigments.map(([key, hex]) => (
            <div key={key} className="flex flex-col gap-2">
              <Chip color={hex} className="h-16" />
              <span className="type-label">{words(key)}</span>
              <Code>{hex.toUpperCase()}</Code>
            </div>
          ))}
        </div>
      </Group>
    </>
  )
}

/* ---------- Marks ---------- */

const PROMO = ARTIFACTS.find((a) => a.id === "w7")

export function MarksSection() {
  return (
    <>
      <Group title="Shapes" note="Shape first, color backs it">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {MARKS.map((m) => (
            <div key={m} className="flex flex-col gap-3">
              <span className="flex items-end gap-3">
                <MarkIcon mark={m} className="size-8" />
                <MarkIcon mark={m} className="size-4" />
                <MarkIcon mark={m} className="size-3" />
              </span>
              <span className="flex items-baseline gap-2 type-label">{MARK_LABEL[m]}<Code>{MARK_CHAR[m]}</Code></span>
            </div>
          ))}
        </div>
      </Group>
      <Group title="Legend"><StatusLegend /></Group>
      {PROMO && <Group title="In a row"><MarksRow decisions={decisionsOf(PROMO, TASKS)} /></Group>}
      <Group title="How sure" note="What your Duet decided">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {SURE_LEVELS.map((s) => <span key={s} className="flex items-center gap-2 type-label"><SureMark sure={s} />{SURE_LABEL[s]}</span>)}
        </div>
      </Group>
    </>
  )
}

/* ---------- Icons ---------- */

// The sizes the app draws Lucide icons at, and what draws them there.
const ICON_SIZES: { cls: string; n: number; where: string }[] = [
  { cls: "size-3", n: 3, where: "Small buttons, badges" },
  { cls: "size-3.5", n: 3.5, where: "Thread icons, rows" },
  { cls: "size-4", n: 4, where: "Buttons, menus" },
  { cls: "size-5", n: 5, where: "Thread page" },
]
const ICONS = [Plus, Check, Search, MessageCircle, Spline]

// Lucide's stroke can be set for every icon at once (index.css, svg.lucide).
const STROKES = [1.5, 1.75, 2] as const
const STROKE_NOTE: Record<(typeof STROKES)[number], string> = { 1.5: "High-fi", 1.75: "In between", 2: "Lucide's default, the wireframe" }

export function IconsSection() {
  const unit = lengthPx(cssVar("--spacing"))
  return (
    <>
    <Group title="Sizes" note="Lucide">
      <ul className="divide-y border-y">
        {ICON_SIZES.map((s) => (
          <li key={s.cls} className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-4 py-3 sm:grid-cols-[72px_160px_minmax(0,1fr)]">
            <Code className="text-foreground">{s.cls}</Code>
            <span className="flex items-center gap-3">{ICONS.map((Icon, i) => <Icon key={i} aria-hidden className={s.cls} />)}</span>
            <span className="col-start-2 type-caption text-muted-foreground sm:col-start-auto">
              <span className="tabular-nums">{s.n * unit}px</span>, {s.where.toLowerCase()}
            </span>
          </li>
        ))}
      </ul>
    </Group>
    <Group title="Stroke" note="High-fi draws 1.5px">
      <ul className="divide-y border-y">
        {STROKES.map((w) => (
          <li key={w} className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-4 py-3 sm:grid-cols-[72px_160px_minmax(0,1fr)]">
            <Code className="text-foreground">{w}px</Code>
            <span className="flex items-center gap-3">{ICONS.map((Icon, i) => <Icon key={i} aria-hidden className="size-5" style={{ strokeWidth: w }} />)}</span>
            <span className="col-start-2 type-caption text-muted-foreground sm:col-start-auto">{STROKE_NOTE[w]}</span>
          </li>
        ))}
      </ul>
    </Group>
    </>
  )
}

/* ---------- Spacing ---------- */

// Steps of the 4px scale the app's paddings and gaps use most.
const STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 6, 8, 12, 16]

export function SpacingSection() {
  const hifi = useHifi()
  const unit = lengthPx(cssVar("--spacing"))
  return (
    <>
    <Group title="Scale" note={<>One step is <Code>--spacing</Code></>}>
      <ul className="flex flex-col gap-2.5">
        {STEPS.map((n) => (
          <li key={n} className="grid grid-cols-[40px_48px_minmax(0,1fr)] items-center gap-4">
            <Code className="text-foreground">{n}</Code>
            <span className="type-caption text-muted-foreground tabular-nums">{n * unit}px</span>
            <span aria-hidden className="h-2 rounded-[1px] bg-foreground" style={{ width: `calc(var(--spacing) * ${n})` }} />
          </li>
        ))}
      </ul>
    </Group>
    {hifi && <PaddingGroup />}
    </>
  )
}

// High-fi padding tokens, drawn with the tokens themselves so the specimens change when the tokens do.
function PaddingGroup() {
  const row = `${lengthPx(cssVar("--hifi-row-height"))}px tall, ${lengthPx(cssVar("--hifi-row-x"))}px at the sides`
  const tile = `${lengthPx(cssVar("--hifi-tile-y"))}px top and bottom, ${lengthPx(cssVar("--hifi-tile-x"))}px at the sides`
  return (
    <Group title="Padding" note="High-fi gives rows and tiles more room">
      <div className="flex flex-wrap gap-x-10 gap-y-6">
        <Specimen name="Row" note={`${row}; project navigation`}>
          <div className="flex w-56 items-center justify-between rounded-md bg-muted text-sm" style={{ height: "var(--hifi-row-height)", paddingInline: "var(--hifi-row-x)" }}>Home<span className="text-xs text-muted-foreground tabular-nums">6</span></div>
        </Specimen>
        <Specimen name="Tile" note={`${tile}; a project's threads`}>
          <div data-tile className="flex w-72 flex-col gap-1 bg-muted/60 text-sm">
            <span className="font-medium">Brand</span>
            <span className="text-xs leading-relaxed text-muted-foreground">Give Whiskr a look that cats can see and owners like.</span>
          </div>
        </Specimen>
      </div>
    </Group>
  )
}

/* ---------- Radius ---------- */

// High-fi is rounder: the radii the high-fi screens actually use, from the small menu items to the round avatars.
const HIFI_RADII: { cls: string; where: string }[] = [
  { cls: "rounded-sm", where: "Menu items, keys" },
  { cls: "rounded-md", where: "Inputs, menus" },
  { cls: "rounded-2xl", where: "Panels inside a card, list rows" },
  { cls: "rounded-xl", where: "Project marks, the page sheet" },
  { cls: "rounded-[24px]", where: "Cards" },
  { cls: "rounded-[10px]", where: "Buttons, segmented controls" },
  { cls: "rounded-full", where: "Badges, avatars" },
]

const RADII: { cls: string; where: string }[] = [
  { cls: "rounded-sm", where: "Menu items, keys" },
  { cls: "rounded-md", where: "Buttons, inputs, menus" },
  { cls: "rounded-lg", where: "Dialogs, lists, tab bars" },
  { cls: "rounded-xl", where: "Cards" },
  { cls: "rounded-full", where: "Badges, avatars, switches" },
]

function RadiusTile({ cls, where, hifi }: { cls: string; where: string; hifi: boolean }) {
  const [ref, c] = useComputed<HTMLDivElement>()
  const r = c ? parseFloat(c.borderTopLeftRadius) : 0
  return (
    <Specimen name={cls} note={c && <>{r > 999 ? "Full" : `${px(c.borderTopLeftRadius)}px`}, {where.toLowerCase()}</>}>
      <div ref={ref} className={cn("size-20 bg-muted", !hifi && "border border-foreground/25", cls)} />
    </Specimen>
  )
}

export function RadiusSection() {
  const hifi = useHifi()
  const base = lengthPx(cssVar("--radius"))
  const list = hifi ? HIFI_RADII : RADII
  return (
    <Group title="Scale" note={<><Code>--radius</Code> is {base}px{hifi && "; buttons use 10px"}</>}>
      <div className={cn("grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3", hifi ? "xl:grid-cols-4" : "xl:grid-cols-5")}>
        {list.map((r) => <RadiusTile key={`${hifi}-${r.cls}`} {...r} hifi={hifi} />)}
      </div>
    </Group>
  )
}

/* ---------- Elevation ---------- */

const SHADOWS: { cls: string; where: string }[] = [
  { cls: "shadow-none", where: "Everything else: hairlines instead" },
  { cls: "shadow-xs", where: "Inputs, outline buttons, checkboxes, switches" },
  { cls: "shadow-sm", where: "Menus, popovers, dialogs, sheets, the active tab" },
]

function ShadowTile({ cls, where }: { cls: string; where: string }) {
  const [ref, c] = useComputed<HTMLDivElement>()
  return (
    <Specimen name={cls} note={c && <>{shadowOf(c.boxShadow)}<br />{where}</>}>
      <div ref={ref} className={cn("h-20 w-40 rounded-lg border bg-background", cls)} />
    </Specimen>
  )
}

export function ElevationSection() {
  return (
    <Group title="Shadows">
      <div className="grid gap-x-8 gap-y-8 sm:grid-cols-3">{SHADOWS.map((s) => <ShadowTile key={s.cls} {...s} />)}</div>
    </Group>
  )
}
