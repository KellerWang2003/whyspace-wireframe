import { useContext, type ReactElement } from "react"
import { useHifi } from "@/lib/hifi"
import { cn } from "@/lib/utils"
import { FilterId, INK, Layer, Ribbon, Scene, Tile, ease, useClock, type End, type P } from "./kit"

/* The illustration set (Keller, Nov 11 2026). Two kinds of piece:
   - With a person: a painted person (Figma AI, empty hands) and, where it belongs to what they
     are doing, a marker ribbon drawn in code from their hand. Still.
   - Just the ribbon: drawn in code with the marker texture, and each moves in its own way
     (`motion`: "once" plays when it appears and holds, "loop" plays, holds, lets go and starts
     again, "off" shows the held frame). Reduced motion always shows the held frame.
   Invite people keeps its painted hands (spot-art.tsx).
   Color has one meaning per kind of moment, see ILLO_COLORS. Only under High-fi. */

export const ILLO_COLORS = [
  { name: "Rose", hex: INK.rose, use: "Something is wrong or blocked" },
  { name: "Leaf", hex: INK.leaf, use: "Starting something" },
  { name: "Apricot", hex: INK.apricot, use: "People and rest" },
  { name: "Sky", hex: INK.sky, use: "Your Duet and AI tools" },
] as const

export const ILLO_RULES = [
  "Art only in rare moments: a first visit, an empty page, something going wrong. Places where work happens stay plain.",
  "One piece per screen at most, never inside a list, a chat or a table.",
  "A person only when the moment is about you, your Duet, or resting. Moments about the space or the work get just the ribbon.",
  "A ribbon a person holds starts at their hand and belongs to what they are doing.",
  "A ribbon that crosses itself stays opaque. Different strands blend where they meet.",
  "People are still. Ribbon-only pieces move in their own way when they appear, then hold.",
] as const

const people = (name: string) => `${import.meta.env.BASE_URL}illustrations/people/${name}.webp`

function Painting({ name, s = 1, x = 0, y = 0 }: { name: string; s?: number; x?: number; y?: number }) {
  const id = useContext(FilterId)
  return (
    <g style={{ mixBlendMode: "multiply" }}>
      <g filter={`url(#${id})`}><image href={people(name)} x={x} y={y} width={240 * s} height={240 * s} /></g>
    </g>
  )
}

const R = ({ pts, color, w = 16, start = "none", end = "notch", see, opacity, draw = 1, from = 0 }: { pts: P[]; color: string; w?: number; start?: End; end?: End; see?: boolean; opacity?: number; draw?: number; from?: number }) =>
  draw <= from ? null : <Ribbon pts={pts} color={color} w={w} start={start} end={end} layers={see ? 2 : 1} opaque={!see} opacity={opacity} draw={draw} from={from} />

// ---------------------------------------------------------------- motion

export type Motion = "once" | "loop" | "off"
const span = (c: number, a: number, b: number) => ease((c - a) / (b - a))
const lerp = (a: P[], b: P[], k: number): P[] => a.map((p, i) => [p[0] + (b[i][0] - p[0]) * k, p[1] + (b[i][1] - p[1]) * k])

/** Where a piece is in its motion. `c`: seconds into the cycle (held at `hold` when it shouldn't
    play). `t`: free-running seconds for small idle sways. `out`: 0..1 as a loop lets go. */
function useMotion(motion: Motion, cycle: number, hold: number, letGo = cycle - 1) {
  const t = useClock(motion === "loop" ? "loop" : motion, motion === "loop" ? 1 : hold)
  const still = motion === "off" || (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  const c = still ? hold : motion === "loop" ? t % cycle : Math.min(t, hold)
  const out = motion === "loop" && !still ? span(c, letGo, cycle - 0.1) : 0
  return { c, t: still ? 0 : t, out, still }
}

// A small Duet: a painted pebble with an ink face, like the Duet faces in the app.
function Pebble({ x, y, r = 18, color = INK.sky }: { x: number; y: number; r?: number; color?: string }) {
  const ink = "#2B2B27"
  return (
    <g transform={`translate(${x} ${y}) scale(${r / 18})`}>
      <Layer opaque><path d="M-18 2 C-18 -14 -6 -19 4 -18 C16 -17 20 -6 19 4 C18 15 6 19 -3 18 C-14 17 -18 12 -18 2 Z" fill={color} /></Layer>
      <circle cx={-6} cy={-2} r={2.3} fill={ink} />
      <circle cx={6} cy={-2} r={2.3} fill={ink} />
      <path d="M-4 5 Q0 9 4 5" fill="none" stroke={ink} strokeWidth={1.8} strokeLinecap="round" />
    </g>
  )
}

const sag = (x: number) => 64 + 36 * (1 - ((x - 120) / 124) ** 2)
const tilt = (x: number) => (Math.atan((sag(x + 1) - sag(x - 1)) / 2) * 180) / Math.PI
const line = [-4, 30, 70, 120, 170, 210, 244].map((x) => [x, sag(x)] as P)

// ---------------------------------------------------------------- the pieces

// Bunting: the line draws across, then the flags drop on one by one and sway.
const Welcome = ({ motion = "off" }: Props) => {
  const { c, t, out } = useMotion(motion, 5.2, 2.2)
  return (
    <g opacity={1 - out}>
      <R color={INK.leaf} w={7} end="none" pts={line} draw={span(c, 0, 0.9)} />
      {([[34, INK.apricot], [77, INK.rose], [120, INK.sky], [163, INK.leaf], [206, INK.apricot]] as const).map(([x, col], i) => {
        const k = span(c, 0.6 + i * 0.2, 1.2 + i * 0.2)
        if (k <= 0) return null
        const sway = Math.sin(t * 1.8 + i) * 3
        return <Layer key={x} opaque><path d="M-13 0 L13 0 L0 32 Z" fill={col} opacity={k} transform={`translate(${x} ${sag(x) + 2}) rotate(${tilt(x) + sway}) scale(1 ${0.3 + 0.7 * k})`} /></Layer>
      })}
    </g>
  )
}

// A stack of blank cards gets tied: one band down, one across, the loose ends fall out.
const CreateWorkspace = ({ motion = "off" }: Props) => {
  const { c, out } = useMotion(motion, 5.4, 2.4)
  const cards = span(c, 0, 0.5)
  return (
    <g opacity={1 - out}>
      <g opacity={cards} transform={`translate(0 ${(1 - cards) * 6})`}>
        <Layer opaque><rect x={76} y={64} width={92} height={112} rx={9} fill={INK.wood} transform="rotate(-7 122 120)" /></Layer>
        <Layer opaque><rect x={76} y={64} width={92} height={112} rx={9} fill={INK.peach} transform="rotate(3 122 120)" /></Layer>
      </g>
      <R color={INK.leaf} w={14} end="none" pts={[[124, 60], [123, 120], [119, 182]]} draw={span(c, 0.4, 1.0)} />
      <R color={INK.leaf} w={14} end="none" pts={[[71, 112], [122, 114], [172, 118]]} draw={span(c, 0.9, 1.5)} />
      <R color={INK.leaf} w={13} pts={[[123, 114], [146, 140], [176, 164], [208, 172]]} draw={span(c, 1.4, 2.1)} />
      <R color={INK.leaf} w={13} pts={[[123, 114], [140, 148], [150, 190], [170, 214]]} draw={span(c, 1.5, 2.3)} />
    </g>
  )
}

// A ribbon end tossed in from off the edge, just reaching the open hands.
const Join = () => (
  <>
    <Painting name="join" />
    <R color={INK.apricot} w={8} end="cut" pts={[[-10, 104], [20, 84], [52, 70], [84, 62], [112, 58], [138, 57]]} />
  </>
)

// You and your Duet, walking together.
const MeetDuet = ({ duet }: Props) => (
  <>
    <Painting name="duet" />
    <Pebble x={180} y={150} r={20} color={duet} />
  </>
)

// Lying back, flying a ribbon like a kite.
const NothingToday = () => (
  <>
    <Painting name="lying" />
    <R color={INK.apricot} w={8} pts={[[106, 99], [110, 82], [122, 64], [140, 52], [160, 50], [176, 38], [196, 30], [222, 26]]} />
  </>
)

// Two people apart, each holding one end. The ends don't meet yet.
const NoChats = () => (
  <>
    <Painting name="two-apart" />
    <R color={INK.apricot} w={8} pts={[[83, 164], [86, 180], [94, 194], [106, 200]]} />
    <R color={INK.leaf} w={8} pts={[[155, 165], [153, 181], [145, 195], [134, 201]]} />
  </>
)

// Leaning back. Nothing left to do.
const CaughtUp = () => <Painting name="caught-up" s={0.86} y={30} />

// A plain wood thread runs across, then each tool slides onto it and settles. The thread stays behind,
// in its own color so the deeper blue Duet bubble on it still reads (Nov 14).
const ConnectTools = ({ motion = "off" }: Props) => {
  const { c, t, out } = useMotion(motion, 5.4, 2.3)
  const tiles = [
    { x: 40, y: 104, size: 56, angle: -6, color: INK.leaf, glyph: "braces" as const },
    { x: 98, y: 140, size: 46, angle: 4, color: INK.apricot, glyph: "arrow" as const },
    { x: 154, y: 118, size: 52, angle: -3, color: INK.rose, glyph: "lines" as const },
    { x: 210, y: 106, size: 48, angle: 0, color: INK.deepSky, glyph: "dots" as const, bubble: true },
  ]
  return (
    <g opacity={1 - out}>
      <R see color={INK.wood} w={18} start="cut" pts={[[-4, 100], [40, 112], [96, 134], [150, 126], [196, 108], [244, 120]]} draw={span(c, 0, 1)} />
      {tiles.map((d, i) => {
        const k = span(c, 0.7 + i * 0.3, 1.3 + i * 0.3)
        if (k <= 0) return null
        const bob = Math.sin(t * 1.5 + i * 1.3) * 1.5
        return <g key={d.glyph} opacity={k} transform={`translate(0 ${(1 - k) * -18 + bob})`}><Tile {...d} opaque /></g>
      })}
    </g>
  )
}

// An empty line strung across, pegs ready and nothing hung on it yet. The line draws across, the
// pegs drop on one by one and the line sways a little. (Was a coil until Nov 14: it read as a snake.)
const PEGS = [[70, INK.apricot, -4], [120, INK.wood, 0], [170, INK.rose, 4]] as const
const peg = (x: number, sway: number) => 112 - 16 * ((x - 120) / 124) ** 2 + 6 + sway * (1 - ((x - 120) / 124) ** 2)
const NoProjects = ({ motion = "off" }: Props) => {
  const { c, t, out } = useMotion(motion, 5.2, 2.0)
  const sway = Math.sin(t * 1.3) * 2
  const pts: P[] = [-4, 60, 120, 180, 244].map((x) => [x, peg(x, sway) - 6] as P)
  return (
    <g opacity={1 - out}>
      <R color={INK.leaf} w={6} start="cut" end="cut" pts={pts} draw={span(c, 0, 0.9)} />
      {PEGS.map(([x, col, a], i) => {
        const k = span(c, 0.8 + i * 0.25, 1.3 + i * 0.25)
        if (k <= 0) return null
        const y = peg(x, sway)
        return <Layer key={x} opaque><rect x={x - 5} y={y - 14 - (1 - k) * 14} width={10} height={30} rx={3} fill={col} opacity={k} transform={`rotate(${a} ${x} ${y})`} /></Layer>
      })}
    </g>
  )
}

// The page settles, then the bookmark slips in across its corner and its tail sways.
const NewProject = ({ motion = "off" }: Props) => {
  const { c, t, out } = useMotion(motion, 5.2, 1.8)
  const page = span(c, 0, 0.5)
  const sway = Math.sin(t * 1.3) * 3
  return (
    <g opacity={1 - out}>
      <g opacity={page} transform={`translate(0 ${(1 - page) * 8})`}>
        <Layer opaque><rect x={66} y={48} width={104} height={132} rx={8} fill={INK.peach} transform="rotate(-4 118 114)" /></Layer>
      </g>
      <R color={INK.leaf} w={13} start="cut" pts={[[138, 40], [150, 62], [168, 84], [194, 100 + sway * 0.5], [222, 106 + sway]]} draw={span(c, 0.4, 1.6)} />
    </g>
  )
}

// The ribbon comes in fine, knots up in the middle, and the knot keeps tugging at itself.
const KNOT: P[] = [[-4, 152], [40, 148], [72, 136], [88, 112], [108, 96], [128, 108], [116, 128], [94, 118], [104, 92], [132, 84], [152, 100], [140, 124], [116, 132], [130, 104], [158, 94], [170, 116], [150, 134], [176, 150], [236, 148]]
const WentWrong = ({ motion = "off" }: Props) => {
  const { c, t, out } = useMotion(motion, 5.8, 2.4)
  const tug = c > 2.2 ? Math.sin(t * 6) * 2.2 * Math.min(1, (c - 2.2) * 2) : 0
  const pts = KNOT.map(([x, y], i) => (i > 2 && i < KNOT.length - 3 ? [x + tug * Math.sin(i * 1.7), y + tug * Math.cos(i * 1.3)] : [x, y]) as P)
  return <R color={INK.rose} w={14} pts={pts} draw={span(c, 0, 2.2)} from={out} />
}

// A rope barrier: two posts rise in, the ribbon slings across between them, sags and sways a little.
// (Was a tied bow until Nov 14: it read as a gift.)
function Post({ x, k }: { x: number; k: number }) {
  if (k <= 0) return null
  return (
    <g opacity={k} transform={`translate(0 ${(1 - k) * 10})`}>
      <Layer opaque><ellipse cx={x} cy={180} rx={22} ry={7} fill={INK.wood} /></Layer>
      <Layer opaque><rect x={x - 6} y={96} width={12} height={84} rx={5} fill={INK.wood} /></Layer>
      <Layer opaque><circle cx={x} cy={94} r={9} fill={INK.wood} /></Layer>
    </g>
  )
}
const NoAccess = ({ motion = "off" }: Props) => {
  const { c, t, out } = useMotion(motion, 5.2, 1.9)
  const settle = c > 1.3 ? Math.sin((c - 1.3) * 9) * Math.max(0, 1.9 - c) * 10 : 0
  const sway = Math.sin(t * 1.2) * 1.5
  const dip = 30 + settle + sway
  const pts: P[] = [[54, 104], [88, 104 + dip * 0.75], [120, 104 + dip], [152, 104 + dip * 0.75], [186, 104]]
  return (
    <g opacity={1 - out}>
      <Post x={52} k={span(c, 0, 0.5)} />
      <Post x={188} k={span(c, 0.15, 0.65)} />
      <R color={INK.rose} w={13} end="none" pts={pts} draw={span(c, 0.6, 1.4)} />
    </g>
  )
}

// One ribbon draws across and pulls tight, then snaps: the torn ends spring apart and droop.
const WHOLE_L: P[] = [[-4, 116], [40, 115], [80, 114], [120, 114]]
const WHOLE_R: P[] = [[244, 112], [200, 112], [160, 113], [120, 114]]
const TORN_L: P[] = [[-4, 118], [40, 117], [74, 122], [92, 134]]
const TORN_R: P[] = [[244, 110], [200, 112], [166, 106], [150, 94]]
const LostConnection = ({ motion = "off" }: Props) => {
  const { c, t, out } = useMotion(motion, 4.8, 2.2, 4)
  if (c < 1.1) {
    const draw = span(c, 0, 0.8)
    const pull = c > 0.8 ? Math.sin((c - 0.8) * 40) * (1.1 - c) * 6 : 0
    const pts: P[] = [[-4, 116], [60, 114 + pull], [120, 114 - pull], [180, 113 + pull], [244, 112]]
    return <R color={INK.rose} w={20} end="none" pts={pts} draw={draw} />
  }
  const k = span(c, 1.1, 1.8)
  const drift = Math.sin(t * 1.1) * 3 * k
  const l = lerp(WHOLE_L, TORN_L, k), r = lerp(WHOLE_R, TORN_R, k)
  l[3] = [l[3][0], l[3][1] + drift]; r[3] = [r[3][0], r[3][1] - drift]
  return (
    <g opacity={1 - out}>
      <R color={INK.rose} w={20} end="torn" pts={l} />
      <R color={INK.rose} w={20} end="torn" pts={r} />
    </g>
  )
}

// ---------------------------------------------------------------- the set

type Props = { duet?: string; motion?: Motion }
type Piece = { label: string; kind: "person" | "ribbon"; where: string; view: string; Art: (p: Props) => ReactElement }

export const ILLO = {
  welcome: { label: "Welcome", kind: "ribbon", where: "Sign in", view: "0 56 240 83", Art: Welcome },
  "create-workspace": { label: "Create your workspace", kind: "ribbon", where: "Onboarding", view: "64 53 161 179", Art: CreateWorkspace },
  join: { label: "Join from an invite", kind: "person", where: "Join a workspace", view: "0 30 232 194", Art: Join },
  "meet-duet": { label: "Meet your Duet", kind: "person", where: "Every new Duet chat, Decided for you", view: "8 11 199 216", Art: MeetDuet },
  "nothing-today": { label: "Nothing for today", kind: "person", where: "Today, new workspace", view: "5 15 230 206", Art: NothingToday },
  "no-chats": { label: "No chats yet", kind: "person", where: "Chats, a chat with no messages", view: "0 69 240 144", Art: NoChats },
  "caught-up": { label: "All caught up", kind: "person", where: "Today and the overlay, all done", view: "2 80 177 128", Art: CaughtUp },
  "connect-tools": { label: "Connect your AI tools", kind: "ribbon", where: "Settings, Connectors", view: "0 68 240 101", Art: ConnectTools },
  "no-projects": { label: "No projects yet", kind: "ribbon", where: "All projects, Decisions, Search", view: "-6 76 252 76", Art: NoProjects },
  "new-project": { label: "New project, nothing in it", kind: "ribbon", where: "A project's first page, Tasks, Artifacts", view: "56 30 183 158", Art: NewProject },
  "went-wrong": { label: "Something went wrong", kind: "ribbon", where: "Errors, gone threads and chats", view: "0 71 240 93", Art: WentWrong },
  "no-access": { label: "No access", kind: "ribbon", where: "A project you're not in", view: "16 76 208 124", Art: NoAccess },
  "lost-connection": { label: "Lost connection", kind: "ribbon", where: "Strip at the top of the page", view: "0 77 240 72", Art: LostConnection },
} satisfies Record<string, Piece>

export type IlloName = keyof typeof ILLO

/** One piece of the set, cropped to its art and multiplied onto the paper. Only under High-fi unless `force`. Size it by height. */
export function Illo({ name, className, force, duet, motion = "once" }: { name: IlloName; className?: string; force?: boolean; duet?: string; motion?: Motion }) {
  const hifi = useHifi()
  if (!hifi && !force) return null
  const p: Piece = ILLO[name]
  return (
    <Scene label={p.label} viewBox={p.view} intrinsic className={cn("w-auto shrink-0 mix-blend-multiply", className)}>
      <p.Art duet={duet} motion={motion} />
    </Scene>
  )
}
