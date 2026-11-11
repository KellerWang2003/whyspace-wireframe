import { useEffect, useState, type CSSProperties, type ReactNode } from "react"
import { toast } from "sonner"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PersonAvatar } from "@/components/app/person"
import { StatusIcon } from "@/components/app/status-badge"
import { Blob, PaintSurface } from "@/components/brand/paint"
import { PIGMENT } from "@/components/brand/hand"
import { DecisionCard } from "@/app/card"
import { decisionsOf, tailOf } from "@/app/card-model"
import { ThreadChip } from "@/app/hifi-kit"
import { pigmentOf } from "@/app/hifi-model"
import { threadOf } from "@/app/threads"
import { ARTIFACTS, ME, PROJECTS, TASKS } from "@/data"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { useConfirmed, useStatusOf, useWithdrawn } from "@/lib/work"
import { cn } from "@/lib/utils"
import { ChoicesDemo, InputsDemo, MenusDemo, RowsDemo, TableDemo, TabsDemo } from "./system-playground"
import { ART } from "./system-art"
import "./paint-playground.css"

// Playground, painted round (#/playground/paint/<part>): Keller picked one high-fi look per part (Nov 11) and
// asked to try the brand's own visual elements on top: watercolor pigment, hand-cut edges, marker strokes, the
// thread. Option 1 is the pick as it now runs in the app; 2 and 3 add paint. Scoped in paint-playground.css
// ([data-px="<part>-<n>"]); the painted surfaces are SVGs from system-art.ts, handed to the CSS as variables.

const WHISKR = PROJECTS.find((p) => p.id === "whiskr")!
const GRAY_PAINT = "#e2e2da"
const LAYER_PAINT = "#ebebe5"

type Demo = (p: { pg: string; n: number }) => ReactNode
type Part = { id: string; label: string; options: string[]; wide?: boolean; Demo: Demo }

const PARTS: Part[] = [
  { id: "inputs", label: "Inputs", options: ["Picked", "Hand-drawn edge", "Wash on focus"], Demo: ({ pg }) => <InputsDemo pg={pg} /> },
  { id: "choices", label: "Choices", options: ["Picked", "Hand-drawn", "Sticky notes"], Demo: ({ pg }) => <ChoicesDemo pg={pg} /> },
  { id: "tabs", label: "Tabs", options: ["Picked", "Painted strip", "Thread pigment"], Demo: ({ pg }) => <TabsDemo pg={pg} /> },
  { id: "menus", label: "Menus and dialogs", options: ["Picked", "Hand-cut paper", "Painted hover"], Demo: ({ pg, n }) => <MenusDemo pg={pg} corner={n === 3 ? <Corner /> : undefined} /> },
  { id: "rows", label: "Rows", options: ["Picked", "Pigment edge", "Thread through"], wide: true, Demo: () => <RowsDemo /> },
  { id: "card", label: "Decision card", options: ["Picked", "Painted header", "On a thread"], wide: true, Demo: PaintCard },
  { id: "table", label: "Table", options: ["Picked", "Painted header", "Painted rows"], wide: true, Demo: () => <TableDemo /> },
]

// The painted pieces, as CSS variables for paint-playground.css.
function artVars(): CSSProperties {
  const marketing = pigmentOf(threadOf(WHISKR.id, "Marketing"))
  const v: Record<string, string> = {
    "--x-outline": ART.handOutline("rgba(0,0,0,0.22)", { w: 384, h: 40 }),
    "--x-outline-focus": ART.handOutline(PIGMENT.leaf, { w: 384, h: 40, width: 1.6 }),
    "--x-outline-area": ART.handOutline("rgba(0,0,0,0.22)", { w: 384, h: 64, seed: 9 }),
    "--x-outline-area-focus": ART.handOutline(PIGMENT.leaf, { w: 384, h: 64, seed: 9, width: 1.6 }),
    "--x-outline-sm": ART.handOutline("rgba(0,0,0,0.22)", { w: 200, h: 40, seed: 7 }),
    "--x-wash": ART.paintedSurface(PIGMENT.leafWash, { w: 384, h: 40, seed: 4, opacity: 1 }),
    "--x-wash-area": ART.paintedSurface(PIGMENT.leafWash, { w: 384, h: 64, seed: 6, opacity: 1 }),
    "--x-box": ART.handOutline("rgba(0,0,0,0.35)", { w: 36, h: 36, radius: 10, seed: 3, width: 1.3, wobble: 0.6 }),
    "--x-ring": ART.handOutline("rgba(0,0,0,0.35)", { w: 36, h: 36, radius: 18, seed: 4, width: 1.3, wobble: 0.6 }),
    "--x-tick": ART.tick(PIGMENT.forest),
    "--x-dot": ART.dot(PIGMENT.forest),
    "--x-track": ART.paintedSurface(PIGMENT.forest, { w: 152, h: 88, radius: 42, seed: 5, opacity: 1, wobble: 2 }),
    "--x-note-forest": ART.paintedSurface(PIGMENT.forest, { w: 72, h: 72, radius: 12, seed: 2, opacity: 1, wobble: 2 }),
    "--x-note": ART.paintedSurface("#e9dfb8", { w: 64, h: 30, radius: 6, seed: 12, opacity: 1 }),
    "--x-strip": ART.paintedSurface(LAYER_PAINT, { w: 420, h: 44, radius: 14, seed: 8, opacity: 1 }),
    "--x-segment-strip": ART.paintedSurface(LAYER_PAINT, { w: 150, h: 32, radius: 12, seed: 11, opacity: 1 }),
    "--x-pigment-marker": ART.marker(marketing),
    "--x-paper": ART.handPaper({ w: 176, h: 180 }),
    "--x-paper-wide": ART.handPaper({ w: 208, h: 150, seed: 12 }),
    "--x-paper-dialog": ART.handPaper({ w: 448, h: 240, radius: 22, seed: 14 }),
    "--x-hover": ART.paintedSurface(GRAY_PAINT, { w: 164, h: 34, radius: 10, seed: 13, opacity: 1 }),
    "--x-edge-rose": ART.edgeStroke(PIGMENT.rose, 2),
    "--x-edge-sky": ART.edgeStroke(PIGMENT.sky, 5),
    "--x-edge-leaf": ART.edgeStroke(PIGMENT.leaf, 8),
    "--x-thread": ART.threadLine(PIGMENT.forest),
    "--x-head": ART.paintedSurface(LAYER_PAINT, { w: 940, h: 40, radius: 12, seed: 15, opacity: 1 }),
    "--x-row": ART.paintedSurface("#efefe9", { w: 940, h: 48, radius: 14, seed: 17, opacity: 1 }),
  }
  return v as CSSProperties
}

export function PaintPlayground({ part = "inputs" }: { part?: string }) {
  const p = PARTS.find((x) => x.id === part) ?? PARTS[0]
  const [vars] = useState(artVars)
  // Menus and dialogs open in a portal outside the page, so the painted pieces go on <html> too.
  useEffect(() => {
    const root = document.documentElement
    const entries = Object.entries(vars as Record<string, string>)
    entries.forEach(([k, v]) => root.style.setProperty(k, v))
    return () => entries.forEach(([k]) => root.style.removeProperty(k))
  }, [vars])
  return (
    <div className="h-svh overflow-y-auto bg-background text-foreground" style={vars}>
      <header className="sticky top-0 z-40 flex flex-wrap items-baseline gap-x-8 gap-y-3 border-b bg-background px-10 pt-6 pb-4">
        <h1 className="type-title">Painted playground</h1>
        <nav aria-label="Parts" className="flex flex-wrap items-baseline gap-x-5 gap-y-2 text-sm">
          {PARTS.map((x) => (
            <button key={x.id} type="button" aria-current={x.id === p.id ? "page" : undefined} onClick={() => navigate(`/playground/paint/${x.id}`)}
              className={cn("transition-colors", x.id === p.id ? "font-medium text-foreground underline decoration-1 underline-offset-[6px]" : "text-muted-foreground hover:text-foreground")}>
              {x.label}
            </button>
          ))}
        </nav>
        <span className="ml-auto flex gap-5 text-sm">
          <button type="button" onClick={() => navigate(`/playground/system/${p.id}`)} className="text-muted-foreground hover:text-foreground">First round</button>
          <button type="button" onClick={() => navigate("/design-system")} className="text-muted-foreground hover:text-foreground">Design system</button>
        </span>
      </header>
      <main className={cn("grid gap-x-12 gap-y-16 px-10 py-10", p.wide ? "max-w-5xl grid-cols-1" : "lg:grid-cols-3")}>
        {p.options.map((name, i) => (
          <section key={`${p.id}-${i}`} data-px={`${p.id}-${i + 1}`} aria-labelledby={`px-${p.id}-${i + 1}`} className="flex min-w-0 flex-col gap-6">
            <h2 id={`px-${p.id}-${i + 1}`} className="type-heading flex items-baseline gap-2.5">
              <span className="text-muted-foreground tabular-nums">{i + 1}</span>{name}
            </h2>
            <p.Demo pg={`x-${p.id}-${i + 1}`} n={i + 1} />
          </section>
        ))}
      </main>
    </div>
  )
}

/* ---------- Menus: a piece of paint tucked in a corner ---------- */

function Corner() {
  return (
    <span aria-hidden data-x-corner className="pointer-events-none absolute -top-6 -right-6 size-24">
      <Blob color={PIGMENT.leaf} seed={11} size={120} className="absolute inset-0 size-full opacity-70 mix-blend-multiply" />
      <Blob color={PIGMENT.apricot} seed={4} size={120} className="absolute top-8 right-10 size-12 opacity-80 mix-blend-multiply" />
    </span>
  )
}

/* ---------- Decision card ---------- */

function PaintCard({ n }: { n: number }) {
  const promo = ARTIFACTS.find((a) => a.id === "w7")!
  const decisions = decisionsOf(promo, TASKS)
  if (n === 1) return <DecisionCard artifact={promo} decisions={decisions} title={promo.name} />
  return <PaintedCard n={n} />
}

function PaintedCard({ n }: { n: number }) {
  const { openDecision, confirmDecision } = useStore()
  const statusOf = useStatusOf()
  const withdrawn = useWithdrawn()
  const promo = ARTIFACTS.find((a) => a.id === "w7")!
  const decisions = decisionsOf(promo, TASKS).filter((d) => !withdrawn(d))
  const { n: confirmed, m } = useConfirmed(decisions)
  const pigment = pigmentOf(threadOf(WHISKR.id, promo.part))
  const washColor = `color-mix(in oklab, ${pigment} 22%, ${PIGMENT.paper})`
  const header = (
    <header className="flex items-center gap-3 px-6 pt-5 pb-5">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <ThreadChip projectId={WHISKR.id} part={promo.part} className="text-xs" />
        <h3 className="type-heading truncate">{promo.name}</h3>
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{confirmed} of {m} confirmed</span>
      <button type="button" onClick={() => toast("Copied")} className="text-xs text-muted-foreground hover:text-foreground">Copy as text</button>
    </header>
  )
  const onThread = n === 3
  return (
    <section className="overflow-hidden rounded-[24px] shadow-[0_0_0_1px_oklch(0_0_0/0.05)]">
      {onThread
        ? <div style={{ background: `color-mix(in oklab, ${pigment} 14%, var(--background))` }}>{header}</div>
        : <PaintSurface color={washColor} seed={6} level="soft" radius={18} className="-mx-3 -mt-3 px-3 pt-3">{header}</PaintSurface>}
      <ul className={cn("relative flex flex-col px-6 pt-4 pb-6 text-sm", onThread ? "gap-4" : "gap-3")}>
        {onThread && <span aria-hidden className="absolute top-6 bottom-8 left-[29px] w-2.5" style={{ background: `${ART.threadLine(pigment, 9)} center / 100% 100% no-repeat` }} />}
        {decisions.map((d) => {
          const status = statusOf(d)
          const guess = status === "inf" || status === "open"
          return (
            <li key={d.id} className="relative flex items-start gap-3 leading-5">
              <span className={cn("mt-[1px] flex size-[18px] shrink-0 items-center justify-center rounded-full", onThread && "bg-background")}><StatusIcon status={status} className="size-3.5" /></span>
              <span className="min-w-0 flex-1">
                <button type="button" onClick={() => openDecision(d.id)} className="text-left hover:underline">{d.title}</button>
                {" "}<span className="text-muted-foreground">{tailOf(d, status)}</span>
              </span>
              {status !== "open" && <PersonAvatar id={d.owner} agent={guess && !!d.tool} className="mt-0.5 size-5" />}
              {status === "inf" && d.owner === ME.id && (
                <Button size="xs" onClick={() => { confirmDecision(d.id); toast("Decision confirmed") }}><Check />Confirm</Button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
