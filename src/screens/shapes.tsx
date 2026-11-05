import type { ReactNode } from "react"
import { navigate } from "@/lib/router"
import { PIGMENT as P } from "@/components/brand/hand"
import { Blob, PaintButton, PaintSurface, Strands } from "@/components/brand/paint"

// The hand-made shape system on one page, so it can be judged and tuned before it spreads.
const THREAD = [
  { w: 70, color: P.rose }, { w: 70, color: P.leaf }, { w: 170, color: P.apricot }, { w: 70, color: P.forest },
  { w: 190, color: P.sky }, { w: 70, color: P.leaf }, { w: 170, color: P.rose }, { w: 70, color: P.apricot },
]

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="grid gap-6 border-t py-12 md:grid-cols-[200px_1fr]" style={{ borderColor: "#E0E5DC" }}>
      <h2 className="font-serif text-[24px] leading-tight">{label}</h2>
      <div>{children}</div>
    </section>
  )
}

// the old, ruled strands for comparison
const RULED_H = 130
const RULED_S = RULED_H * 0.6
const RULED = THREAD.reduce<{ x: number; parts: { d: string; color: string }[] }>((acc, s) => ({
  x: acc.x + s.w + 16,
  parts: [...acc.parts, { d: `M${acc.x} 0H${acc.x + s.w}L${acc.x + s.w + RULED_S} ${RULED_H}H${acc.x + RULED_S}Z`, color: s.color }],
}), { x: 0, parts: [] })
function Ruled() {
  return (
    <svg viewBox={`-8 -8 ${RULED.x + RULED_S + 16} ${RULED_H + 16}`} className="w-full" aria-hidden>
      {RULED.parts.map((p, i) => <path key={i} d={p.d} fill={p.color} strokeLinejoin="round" stroke={p.color} strokeWidth="14" />)}
    </svg>
  )
}

export function Shapes() {
  return (
    <div className="h-svh overflow-y-auto" style={{ background: P.paper, color: P.forest }}>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-baseline justify-between">
          <h1 className="font-serif text-[56px] leading-none">Hand-made shapes</h1>
          <button onClick={() => navigate("/site")} className="text-[15px] hover:opacity-70">Home page</button>
        </div>

        <Row label="Cut by hand">
          <div className="space-y-8">
            <Ruled />
            <Strands strands={THREAD} seed={7} />
          </div>
        </Row>

        <Row label="Edge">
          <div className="grid grid-cols-3 gap-6">
            {(["soft", "painted", "torn"] as const).map((level, i) => (
              <div key={level}>
                <PaintSurface color={P.leaf} level={level} seed={i + 2} className="h-36" />
                <div className="mt-3 text-[14px]" style={{ color: "#676F5D" }}>{level === "soft" ? "Soft · UI" : level === "painted" ? "Painted · default" : "Torn · collage"}</div>
              </div>
            ))}
          </div>
        </Row>

        <Row label="Pigment">
          <div className="grid grid-cols-5 gap-4">
            {[P.forest, P.leaf, P.apricot, P.sky, P.rose].map((c, i) => <PaintSurface key={c} color={c} seed={i + 10} className="h-28" radius={22} />)}
            {[P.subtle, P.leafWash, P.apricotWash, P.skyWash, P.roseWash].map((c, i) => <PaintSurface key={c} color={c} seed={i + 20} className="h-20" radius={18} level="soft" />)}
          </div>
        </Row>

        <Row label="Overlap">
          <div className="relative h-56">
            <Blob color={P.sky} seed={3} size={220} className="absolute left-0 top-0 w-56 mix-blend-multiply" />
            <Blob color={P.leaf} seed={8} size={220} className="absolute left-32 top-6 w-56 mix-blend-multiply opacity-90" />
            <Blob color={P.apricot} seed={12} size={220} className="absolute left-64 top-0 w-56 mix-blend-multiply opacity-90" />
            <Blob color={P.rose} seed={17} size={220} className="absolute left-96 top-8 w-56 mix-blend-multiply opacity-90" />
          </div>
        </Row>

        <Row label="Pieces">
          <div className="grid items-start gap-8 md:grid-cols-3">
            <PaintSurface color={P.roseWash} seed={31} radius={10} className="-rotate-2">
              <p className="p-7 pt-20 font-serif text-[26px] leading-[1.15]" style={{ color: "#A8486A" }}>Sticky note</p>
            </PaintSurface>
            <PaintSurface color={P.skyWash} seed={33} radius={32} level="soft">
              <div className="p-8">
                <div className="font-serif text-[36px] leading-none" style={{ color: "#42718D" }}>Card</div>
                <p className="mt-3 text-[16px]">Painted surface, crisp type.</p>
              </div>
            </PaintSurface>
            <div className="flex flex-col items-start gap-4">
              <PaintButton seed={4}>Start free</PaintButton>
              <PaintButton seed={9} color={P.apricotWash} ink={P.forest}>Secondary</PaintButton>
            </div>
          </div>
        </Row>

        <Row label="Rules">
          <ul className="space-y-2 text-[17px]">
            <li>Paint the surface. Keep the type crisp.</li>
            <li>Nothing ruled: no straight edge, no even corner.</li>
            <li>Where colors meet, multiply.</li>
            <li>The product stays calm. Painting is for the story.</li>
          </ul>
        </Row>
      </div>
    </div>
  )
}
