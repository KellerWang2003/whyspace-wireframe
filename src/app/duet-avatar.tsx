import { useId, type CSSProperties } from "react"
import { Shuffle } from "lucide-react"
import { blobPath, handPath } from "@/components/brand/hand"
import { Paint } from "@/components/brand/paint"
import { paintTint } from "@/components/brand/tint"
import { PersonAvatar } from "@/components/app/person"
import { Button } from "@/components/ui/button"
import { ME, PEOPLE } from "@/data"
import { cn } from "@/lib/utils"
import "./duet-motion.css"
import { EYES, MOUTHS, PIGMENTS, PIGMENT_HEX, SHAPES, resetDuetFace, setDuetFace, shuffleFace, useDuetFace, type DuetFace } from "./duet-face"

// A person's Duet: its own face (never the person's photo), a painted pebble with a small ink face.
// A teammate's Duet carries its person's face as a small badge, so you can tell whose it is.
type Pt = [number, number]
const ring = (cx: number, cy: number, r: number, n = 8): Pt[] =>
  Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * r, cy + Math.sin((i / n) * Math.PI * 2) * r])

// It hops and grins when you hover it (or the button it sits in), and blinks on its own now and then (duet-motion.css).
export function DuetAvatar({ owner, face, badge, className }: { owner: string; face?: DuetFace; badge?: boolean; className?: string }) {
  const live = useDuetFace(owner)
  const f = face ?? live
  const id = useId().replace(/:/g, "")
  const showBadge = badge ?? owner !== ME.id
  const name = owner === ME.id ? "Your Duet" : `${PEOPLE[owner]?.name?.split(" ")[0] ?? "A teammate"}’s Duet`
  return (
    <span
      role="img"
      aria-label={name}
      data-duet=""
      style={{ "--duet-delay": `${-(f.seed % 6)}s` } as CSSProperties}
      className={cn("relative inline-flex size-6 shrink-0", className)}
    >
      <svg viewBox="0 0 64 64" className="size-full overflow-visible" aria-hidden>
        <Pebble f={f} id={id} />
      </svg>
      {showBadge && <PersonAvatar id={owner} className="absolute -right-[12%] -bottom-[12%] size-[48%] text-[0px] ring-[1.5px] ring-background" />}
    </span>
  )
}

// The face's outline in its 64 box. The rail's open tab grows it to the tab's size, so the paper follows the paint.
export function duetOutline(f: DuetFace): { d: string; transform?: string } {
  if (f.shape === "note") return { d: handPath([[8, 8], [56, 8], [56, 56], [8, 56]], { seed: f.seed, radius: 7, wobble: 1.1, unevenCorners: 0.5 }), transform: "rotate(-6 32 32)" }
  if (f.shape === "round") return { d: handPath(ring(32, 32, 28), { seed: f.seed, radius: 16, wobble: 1, unevenCorners: 0.3 }) }
  return { d: blobPath(68, f.seed), transform: "translate(-2 -2)" }
}

// The color at MARK_STRENGTH (Nov 14), the same as the project tiles beside it.
export const duetTint = (f: DuetFace) => paintTint(PIGMENT_HEX[f.pigment])

function Pebble({ f, id }: { f: DuetFace; id: string }) {
  const o = duetOutline(f)
  const shape = <path d={o.d} transform={o.transform} />
  const { bg, ink } = duetTint(f)
  const L = 23.5
  const R = 40.5
  const y = 30
  const dot = (x: number) => <circle cx={x} cy={y} r={3.6} fill={ink} />
  const arc = (x: number) => <path d={`M${x - 3.6} ${y + 1} Q${x} ${y - 4} ${x + 3.6} ${y + 1}`} fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
  const tall = (x: number) => <ellipse cx={x} cy={y} rx={2.8} ry={4.4} fill={ink} />
  return (
    <>
      <defs><Paint id={`d${id}`} level="soft" seed={f.seed} /></defs>
      <g className="duet-all">
        {/* A flat base under the paint fills its lighter blooms, so the color stays deep. */}
        <g fill={bg} opacity={0.55} transform="translate(32 32) scale(0.9) translate(-32 -32)">{shape}</g>
        <g fill={bg} filter={`url(#d${id})`}>{shape}</g>
        <g className="duet-face">
          <g className="duet-calm">
            <g className="duet-eyes">
              {f.eyes === "dots" && <>{dot(L)}{dot(R)}</>}
              {f.eyes === "happy" && <>{arc(L)}{arc(R)}</>}
              {f.eyes === "wide" && <>{tall(L)}{tall(R)}</>}
              {f.eyes === "wink" && <>{dot(L)}{arc(R)}</>}
            </g>
            {f.mouth === "smile" && <path d="M27 39 Q32 44.5 37 39" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />}
            {f.mouth === "flat" && <path d="M28 41 H36" stroke={ink} strokeWidth={3} strokeLinecap="round" />}
          </g>
          {/* The grin it shows on hover: happy eyes and an open smile. */}
          <g className="duet-joy">
            {arc(L)}{arc(R)}
            <path d="M26 38 Q32 39.5 38 38 Q37 46 32 46 Q27 46 26 38 Z" fill={ink} stroke={ink} strokeWidth={1.4} strokeLinejoin="round" />
          </g>
        </g>
      </g>
    </>
  )
}

// Make your Duet’s face: color, shape, eyes and mouth, each a row of small previews. Opens from your Duet’s face at the top of the Duet list.
const PARTS: [string, keyof DuetFace, readonly string[]][] = [["Color", "pigment", PIGMENTS], ["Shape", "shape", SHAPES], ["Eyes", "eyes", EYES], ["Mouth", "mouth", MOUTHS]]

export function DuetFaceMaker({ className }: { className?: string }) {
  const f = useDuetFace(ME.id)
  return (
    <div className={cn("flex items-start gap-5", className)}>
      <div className="flex flex-col items-center gap-2">
        <DuetAvatar owner={ME.id} className="size-20" />
        <Button variant="ghost" size="sm" onClick={() => setDuetFace(ME.id, shuffleFace())}><Shuffle />Shuffle</Button>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {PARTS.map(([label, key, values]) => (
          <div key={key} role="radiogroup" aria-label={label} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-xs text-muted-foreground">{label}</span>
            <div className="flex flex-wrap gap-1">
              {values.map((v) => {
                const on = f[key] === v
                return (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={`${label}: ${v}`}
                    onClick={() => setDuetFace(ME.id, { [key]: v })}
                    className={cn("flex size-8 cursor-pointer items-center justify-center rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-ring", on ? "ring-2 ring-foreground/60" : "hover:ring-2 hover:ring-foreground/15")}
                  >
                    {key === "pigment"
                      ? <span className="size-5 rounded-full" style={{ background: paintTint(PIGMENT_HEX[v as DuetFace["pigment"]]).bg }} />
                      : <DuetAvatar owner={ME.id} face={{ ...f, [key]: v }} badge={false} className="size-6" />}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <button type="button" onClick={() => resetDuetFace(ME.id)} className="cursor-pointer self-start pl-14 text-xs text-muted-foreground underline-offset-2 hover:underline">Reset</button>
      </div>
    </div>
  )
}

