import { useId, useState, type CSSProperties, type ReactNode } from "react"
import { LayoutGrid, MessageCircle, Plus, Search, type LucideIcon } from "lucide-react"
import { PIGMENT, blobPath, handPath } from "@/components/brand/hand"
import { Paint } from "@/components/brand/paint"
import { WhyspaceMark } from "@/components/brand/logo"
import { PersonAvatar } from "@/components/app/person"
import { CountBadge, NeedsDot } from "@/components/app/count-badge"
import { ICON_OF, MARK_HEX, MARK_INK, MARK_WASH, MARK_WASH_INK, hashId, useProjectIcon } from "@/components/app/project-icon"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ME, PROJECTS } from "@/data"
import { DuetAvatar } from "@/app/duet-avatar"
import { PIGMENT_HEX, useDuetFace, type DuetFace } from "@/app/duet-face"

// Playground (#/playground/rail-looks, Nov 14): how the rail's icons, project marks, badges and Duet can read as one system.
// Self-contained mock rails; the real rail is untouched.

type Look = "now" | "flat" | "wash" | "paint" | "all" | "mid" | "soft" | "white" | "ink" | "clean" | "l55" | "l45" | "l35"
// Round 1 (Nov 14 08:00): flat, wash, paint, all. Round 2 (Keller 08:08 picked Full paint, but too heavy, and wash too light):
// Full paint at three strengths, with a hand-cut open tab that echoes the painted tiles.
export const ROUND_1: [Look, string][] = [["now", "Now"], ["flat", "Flat wash"], ["wash", "Painted wash"], ["paint", "Full paint"], ["all", "All wash"]]
export const ROUND_2: [Look, string][] = [["now", "Now"], ["paint", "Full paint"], ["mid", "Middle"], ["soft", "Soft"]]
// Round 3 (Keller 08:34): the line color on Middle tiles reads poorly and looks dirty. Three cleaner rules beside it.
export const ROUND_3: [Look, string][] = [["mid", "Now"], ["white", "White"], ["ink", "One ink"], ["clean", "Clean tint"]]
// Round 4 (Keller 08:42, One ink picked): the paint a little lighter so the ink icon reads.
const OPTIONS: [Look, string][] = [["ink", "Now 70%"], ["l55", "55%"], ["l45", "45%"], ["l35", "35%"]]
// How much pigment a painted tile carries (the rest is paper).
const STRENGTH: Partial<Record<Look, number>> = { paint: 1, mid: 0.7, soft: 0.5, white: 0.7, ink: 0.7, clean: 0.7, l55: 0.55, l45: 0.45, l35: 0.35 }
const painted = (look: Look) => STRENGTH[look] !== undefined

function hexToRgb(h: string) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255] }
const toHex = (c: number[]) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")
const mix = (a: string, b: string, t: number) => { const x = hexToRgb(a), y = hexToRgb(b); return toHex(x.map((v, i) => v * t + y[i] * (1 - t))) }
const lum = (h: string) => { const [r, g, b] = hexToRgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 }
// The tile's color at this strength, and an icon or face color that reads on it: paper on the deep ones, a deep shade of the pigment on the lighter ones.
function tint(pigment: string, look: Look) {
  const bg = mix(pigment, PAPER, STRENGTH[look] ?? 1)
  if (look === "white") return { bg, ink: PAPER }
  if (look === "ink" || look === "l55" || look === "l45" || look === "l35") return { bg, ink: "#2B2B27" }
  if (look === "clean") return { bg, ink: clean(pigment) }
  return { bg, ink: lum(bg) < 0.55 ? PAPER : mix(pigment, "#2B2B27", 0.5) }
}

// The pigment's own hue, deep and saturated, with no gray mixed in: same hue, lightness 32%, saturation up.
function clean(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  h *= 60
  const l0 = (max + min) / 2
  const s0 = d ? d / (1 - Math.abs(2 * l0 - 1)) : 0
  const sat = s0 < 0.08 ? s0 : Math.min(1, s0 * 1.35 + 0.1), l = 0.32
  const c = (1 - Math.abs(2 * l - 1)) * sat, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2
  const [R, G, B] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return toHex([R + m, G + m, B + m].map((v) => v * 255))
}
type Badges = "count" | "mixed"

const LAYER = "var(--hifi-layer)"
const PAPER = PIGMENT.paper
const GRAY = "#8A8A83"
const GRAY_INK = "#6B6B64"
const TILE = 30

export function RailCohesion() {
  const [badges, setBadges] = useState<Badges>("count")
  return (
    <div className="min-h-svh bg-(--hifi-layer) p-10">
      <ToggleGroup type="single" value={badges} onValueChange={(v) => v && setBadges(v as Badges)} className="mb-8">
        <ToggleGroupItem value="count">One count</ToggleGroupItem>
        <ToggleGroupItem value="mixed">Count + dot</ToggleGroupItem>
      </ToggleGroup>
      <div className="flex flex-wrap gap-10">
        {OPTIONS.map(([look, name], i) => (
          <div key={look} className="flex flex-col gap-3">
            <h2 className="type-label text-muted-foreground">{look === "now" ? name : `${i} ${name}`}</h2>
            <MockRail look={look} badges={badges} />
          </div>
        ))}
      </div>
    </div>
  )
}

const PINNED = ["whiskr", "studio", "holiday", "seed", "panel", "android"]
const NEEDS: Record<string, number> = { whiskr: 3, studio: 1 }

function MockRail({ look, badges }: { look: Look; badges: Badges }) {
  // Full paint: badges go ink so they don't fight the painted tiles.
  const style = painted(look) ? ({ "--hifi-badge": "#2B2B27" } as CSSProperties) : undefined
  return (
    <div className="flex h-[620px]" style={style}>
      <div className="flex w-[52px] flex-col gap-1 px-1.5 py-2">
        <div className="mt-2 flex h-9 items-center justify-center"><WhyspaceMark className="w-[22px]" /></div>
        <Divider />
        <Row look={look} nav icon={Search} />
        <Row look={look} nav date count={4} />
        <Row look={look} duet />
        <Row look={look} nav icon={LayoutGrid} />
        <Divider />
        {PINNED.map((id) => <Row key={id} look={look} project={id} open={id === "whiskr"} count={NEEDS[id]} dot={badges === "mixed" || look === "now"} />)}
        <Row look={look} nav icon={Plus} quiet />
        <div className="flex-1" />
        <Row look={look} nav icon={MessageCircle} count={3} />
        <div className="flex h-10 items-center justify-center"><PersonAvatar id={ME.id} className="size-8" /></div>
      </div>
      {/* The paper sheet beside the rail, so the open tab reads as it does in the app. */}
      <div className="w-10 rounded-l-[20px] bg-background" />
    </div>
  )
}

const Divider = () => <div className="mx-1.5 my-1 h-px shrink-0 bg-sidebar-border" />

function Row({ look, date, duet, project, icon, open, count, dot, quiet }: { look: Look; nav?: true; date?: boolean; duet?: boolean; project?: string; icon?: LucideIcon; open?: boolean; count?: number; dot?: boolean; quiet?: boolean }) {
  const behind = open ? PAPER : LAYER
  let mark: ReactNode = null
  if (project) mark = <ProjectTile look={look} id={project} />
  else if (duet) mark = look === "all" ? <WashDuet owner={ME.id} /> : painted(look) && look !== "paint" ? <TintDuet owner={ME.id} look={look} /> : <DuetAvatar owner={ME.id} badge={false} className="size-[30px]" />
  else mark = <NavTile look={look} icon={icon} date={date} open={open} quiet={quiet} />
  return (
    <div className="relative flex h-10 shrink-0 items-center justify-center" style={{ "--badge-cut": behind } as CSSProperties}>
      {open && (painted(look) ? <HandTab seed={project ? (hashId(project) % 40) + 1 : 3} /> : <SheetTab />)}
      <span className="relative">{mark}</span>
      {count ? (dot ? <NeedsDot halo className="absolute top-1 right-1" /> : <CountBadge halo n={count} className="absolute top-0 right-0" />) : null}
    </div>
  )
}

// The open tab: paper, running into the sheet, with the two fillets where it meets it.
function SheetTab() {
  const fillet = (at: string): CSSProperties => ({ position: "absolute", right: -6, width: 12, height: 12, background: `radial-gradient(circle 12px at 0 ${at}, transparent 11.5px, ${PAPER} 12px)` })
  return (
    <span aria-hidden className="absolute inset-y-0 left-0 -right-1.5 rounded-l-xl" style={{ background: PAPER }}>
      <span style={{ ...fillet("0"), top: -12 }} />
      <span style={{ ...fillet("100%"), bottom: -12 }} />
    </span>
  )
}

// The open tab around a painted tile: its left side is the tile's own hand-cut outline, grown to the tab's size,
// so the paper follows the paint; the right side runs straight into the sheet with the usual fillets.
function HandTab({ seed }: { seed: number }) {
  const fillet = (at: string): CSSProperties => ({ position: "absolute", right: -6, width: 12, height: 12, background: `radial-gradient(circle 12px at 0 ${at}, transparent 11.5px, ${PAPER} 12px)` })
  const d = handPath([[3, 3], [61, 3], [61, 61], [3, 61]], { seed, radius: 18, wobble: 1, unevenCorners: 0.4 })
  return (
    <span aria-hidden className="absolute inset-y-0 left-0 -right-1.5">
      <svg viewBox="3 3 58 58" width={40} height={40} className="absolute top-0 left-0 overflow-visible"><path d={d} fill={PAPER} /></svg>
      <span className="absolute inset-y-0 right-0 left-5" style={{ background: PAPER }} />
      <span style={{ ...fillet("0"), top: -12 }} />
      <span style={{ ...fillet("100%"), bottom: -12 }} />
    </span>
  )
}

// A hand-cut tile in a light coat of paint.
function WashShape({ color, alpha, seed, round }: { color: string; alpha: number; seed: number; round?: boolean }) {
  const uid = useId().replace(/:/g, "")
  const ring = Array.from({ length: 8 }, (_, i) => [32 + Math.cos((i / 8) * Math.PI * 2) * 29, 32 + Math.sin((i / 8) * Math.PI * 2) * 29] as [number, number])
  const d = round ? handPath(ring, { seed, radius: 16, wobble: 1, unevenCorners: 0.3 }) : handPath([[3, 3], [61, 3], [61, 61], [3, 61]], { seed, radius: 18, wobble: 1, unevenCorners: 0.4 })
  return (
    <svg viewBox="0 0 64 64" className="absolute inset-0 size-full overflow-visible" aria-hidden>
      <defs><Paint id={`w${uid}`} level="soft" seed={seed} /></defs>
      <path d={d} fill={color} opacity={alpha * 0.6} />
      <path d={d} fill={color} opacity={alpha} filter={`url(#w${uid})`} />
    </svg>
  )
}

function NavTile({ look, icon: Icon, date, open, quiet }: { look: Look; icon?: LucideIcon; date?: boolean; open?: boolean; quiet?: boolean }) {
  const glyph = date ? <DateGlyph /> : Icon ? <Icon className="size-[18px]" strokeWidth={1.5} absoluteStrokeWidth /> : null
  const ink = open ? "var(--foreground)" : quiet ? "#A3A39C" : GRAY_INK
  if (painted(look) || look === "now") return <span className="flex items-center justify-center" style={{ width: TILE, height: TILE, color: ink }}>{date ? <DateGlyph big /> : Icon ? <Icon className="size-5" strokeWidth={1.5} absoluteStrokeWidth /> : null}</span>
  if (look === "flat") return <span className="flex items-center justify-center rounded-[9px]" style={{ width: TILE, height: TILE, color: ink, background: open ? LAYER : PAPER }}>{glyph}</span>
  return (
    <span className="relative flex items-center justify-center" style={{ width: TILE, height: TILE, color: ink }}>
      <WashShape color={GRAY} alpha={0.11} seed={9} />
      <span className="relative flex">{glyph}</span>
    </span>
  )
}

function ProjectTile({ look, id }: { look: Look; id: string }) {
  const icon = useProjectIcon(id)
  const Icon = icon.icon ? ICON_OF[icon.icon] : undefined
  const name = PROJECTS.find((p) => p.id === id)?.name ?? id
  const letter = name.trim()[0]?.toUpperCase() ?? "P"
  const t = tint(MARK_HEX[icon.color], look)
  const ink = look === "paint" ? MARK_INK[icon.color] : painted(look) ? t.ink : MARK_WASH_INK[icon.color]
  const glyph = Icon ? <Icon className="relative size-[18px]" strokeWidth={1.5} absoluteStrokeWidth /> : <span className="relative font-serif text-[17px] leading-none">{letter}</span>
  const seed = (hashId(id) % 40) + 1
  if (look === "now") return <span className="flex items-center justify-center" style={{ width: TILE, height: TILE, color: ink }}>{Icon ? <Icon className="size-5" strokeWidth={1.5} absoluteStrokeWidth /> : <span className="font-serif text-[22px] leading-none">{letter}</span>}</span>
  if (look === "flat") return <span className="flex items-center justify-center rounded-[9px]" style={{ width: TILE, height: TILE, background: MARK_WASH[icon.color], color: ink }}>{glyph}</span>
  return (
    <span className="relative flex items-center justify-center" style={{ width: TILE, height: TILE, color: ink }}>
      {painted(look) ? <FullTile color={t.bg} seed={seed} /> : <WashShape color={MARK_HEX[icon.color]} alpha={0.26} seed={seed} />}
      {glyph}
    </span>
  )
}

// The painted pigment tile (the old Painted project look), deep like the Duet.
function FullTile({ color, seed }: { color: string; seed: number }) {
  const uid = useId().replace(/:/g, "")
  const d = handPath([[3, 3], [61, 3], [61, 61], [3, 61]], { seed, radius: 18, wobble: 1, unevenCorners: 0.4 })
  return (
    <svg viewBox="0 0 64 64" className="absolute inset-0 size-full overflow-visible" aria-hidden>
      <defs><Paint id={`f${uid}`} level="soft" seed={seed} /></defs>
      <path d={d} fill={color} opacity={0.55} transform="translate(32 32) scale(0.9) translate(-32 -32)" />
      <path d={d} fill={color} filter={`url(#f${uid})`} />
    </svg>
  )
}

// Middle and Soft: the Duet painted at the same strength as the project tiles.
function TintDuet({ owner, look }: { owner: string; look: Look }) {
  const f = useDuetFace(owner)
  const uid = useId().replace(/:/g, "")
  const { bg, ink } = tint(PIGMENT_HEX[f.pigment], look)
  return (
    <span role="img" aria-label="Your Duet" className="relative flex" style={{ width: TILE, height: TILE }}>
      <svg viewBox="0 0 64 64" className="size-full overflow-visible" aria-hidden>
        <defs><Paint id={`t${uid}`} level="soft" seed={f.seed} /></defs>
        <g fill={bg} transform={f.shape === "pebble" ? "translate(-2 -2)" : undefined}>
          <path d={shapeOf(f)} opacity={0.55} transform="translate(32 32) scale(0.9) translate(-32 -32)" />
          <path d={shapeOf(f)} filter={`url(#t${uid})`} />
        </g>
        <Face f={f} ink={ink} />
      </svg>
    </span>
  )
}

// All wash: the Duet in the same light coat as the projects, its face drawn in its pigment.
function WashDuet({ owner }: { owner: string }) {
  const f = useDuetFace(owner)
  const uid = useId().replace(/:/g, "")
  const ink = PIGMENT_HEX[f.pigment]
  return (
    <span role="img" aria-label="Your Duet" className="relative flex" style={{ width: TILE, height: TILE }}>
      <svg viewBox="0 0 64 64" className="size-full overflow-visible" aria-hidden>
        <defs><Paint id={`d${uid}`} level="soft" seed={f.seed} /></defs>
        <g fill={ink} transform={f.shape === "pebble" ? "translate(-2 -2)" : undefined}>
          <path d={shapeOf(f)} opacity={0.16} />
          <path d={shapeOf(f)} opacity={0.26} filter={`url(#d${uid})`} />
        </g>
        <Face f={f} ink={ink} />
      </svg>
    </span>
  )
}

function shapeOf(f: DuetFace) {
  if (f.shape === "note") return handPath([[8, 8], [56, 8], [56, 56], [8, 56]], { seed: f.seed, radius: 7, wobble: 1.1, unevenCorners: 0.5 })
  if (f.shape === "round") return handPath(Array.from({ length: 8 }, (_, i) => [32 + Math.cos((i / 8) * Math.PI * 2) * 28, 32 + Math.sin((i / 8) * Math.PI * 2) * 28] as [number, number]), { seed: f.seed, radius: 16, wobble: 1, unevenCorners: 0.3 })
  return blobPath(68, f.seed)
}

function Face({ f, ink }: { f: DuetFace; ink: string }) {
  const L = 23.5, R = 40.5, y = 30
  const dot = (x: number) => <circle cx={x} cy={y} r={3.6} fill={ink} />
  const arc = (x: number) => <path d={`M${x - 3.6} ${y + 1} Q${x} ${y - 4} ${x + 3.6} ${y + 1}`} fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
  const tall = (x: number) => <ellipse cx={x} cy={y} rx={2.8} ry={4.4} fill={ink} />
  return (
    <g>
      {f.eyes === "dots" && <>{dot(L)}{dot(R)}</>}
      {f.eyes === "happy" && <>{arc(L)}{arc(R)}</>}
      {f.eyes === "wide" && <>{tall(L)}{tall(R)}</>}
      {f.eyes === "wink" && <>{dot(L)}{arc(R)}</>}
      {f.mouth === "smile" && <path d="M27 39 Q32 44.5 37 39" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />}
      {f.mouth === "flat" && <path d="M28 41 H36" stroke={ink} strokeWidth={3} strokeLinecap="round" />}
    </g>
  )
}

function DateGlyph({ big }: { big?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={big ? 1.8 : 2} strokeLinecap="round" strokeLinejoin="round" className={big ? "size-5" : "size-[18px]"}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
      <text x="12" y="19.25" textAnchor="middle" fill="currentColor" stroke="none" fontSize="9" fontWeight="600">14</text>
    </svg>
  )
}
