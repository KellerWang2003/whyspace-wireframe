import { cn } from "@/lib/utils"
import gesturePair from "./assets/gesture-pair.webp"
import gestureRibbons from "./assets/gesture-ribbons.webp"
import gestureTop from "./assets/gesture-top.webp"
import weavePeople from "./assets/weave-people.webp"
import weaveMotif from "./assets/weave-motif.webp"
import weaveCrop from "./assets/weave-crop.webp"
import studioPeople from "./assets/studio-people.webp"
import studioGroup from "./assets/studio-group.webp"
import studioPlant from "./assets/studio-plant.webp"
import type { StyleId } from "./model"

// The fun visuals, and only where nothing important happens: empty states, the title's corner
// and the quiet bottom of the Coming up rail. Each style brings its own from its tile in Figma:
// hands passing ribbons, people weaving tape, natural-light photos under green glass.

// A hand-drawn underline (Shared gesture's tabs and title).
export function Squiggle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 10" preserveAspectRatio="none" className={className} aria-hidden>
      <path d="M2 6.5C18 2.5 34 8.5 52 5.2S88 2.4 118 5.6" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// Open weave's panels end in a torn paper edge instead of a ruled line.
const TORN = "M0 0H4L6 9 3 18 7 27 4 38 6 47 2 56 6 66 4 75 7 86 3 95 5 104 2 113 6 124 4 133 7 142 3 153 6 162 4 171 7 182 3 191 5 200 2 210 6 219 4 228 7 238 3 247 6 256 4 266 7 275 3 284 5 294 2 303 6 312 4 322 7 331 3 340 6 350 4 359 7 368 3 378 5 387 2 396 4 400H0Z"
export function TornEdge({ color = "var(--rail)" }: { color?: string }) {
  return (
    <svg viewBox="0 0 8 400" preserveAspectRatio="none" className="pointer-events-none absolute top-0 -right-[7px] h-full w-2" aria-hidden>
      <path d={TORN} fill={color} />
    </svg>
  )
}

// A strip of woven tape, the way Open weave frames a card.
const WEAVE = ["var(--mustard)", "var(--dark)", "var(--vermilion)", "var(--lavender)", "var(--mustard)", "var(--vermilion)", "var(--dark)", "var(--lavender)", "var(--vermilion)", "var(--mustard)"]
export function WovenStrip({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex h-3", className)}>
      {WEAVE.map((c, i) => <span key={i} className="h-full" style={{ background: c, flex: [3, 2, 4, 2, 3, 5, 2, 3, 4, 2][i] }} />)}
    </div>
  )
}

// Shared gesture's pictures fade out at their edges, so the hands float on the page.
const FLOAT = "[mask-image:radial-gradient(ellipse_72%_72%_at_50%_50%,black_58%,transparent_100%)]"

// A pane of green glass over Studio's photos.
function Glass({ className }: { className?: string }) {
  return <span aria-hidden className={cn("absolute bg-[rgba(53,146,107,0.32)] backdrop-blur-[6px]", className)} />
}

// The title's corner.
export function TitleMark({ style }: { style: StyleId }) {
  if (style === "gesture") return <Squiggle className="pointer-events-none absolute -bottom-2.5 left-0 h-2.5 w-full" />
  if (style === "weave") return <span aria-hidden className="pointer-events-none absolute -bottom-3 left-0 h-[5px] w-12 bg-(--vermilion)" />
  return null
}

// "Nothing today or yesterday." under Handled.
export function HandledEmpty({ style, text }: { style: StyleId; text: string }) {
  if (style === "gesture") {
    return (
      <div className="flex items-center gap-7">
        <img src={gesturePair} alt="" className={cn("h-[150px] w-auto mix-blend-multiply select-none", FLOAT)} />
        <p className="hf-empty">{text}</p>
      </div>
    )
  }
  if (style === "weave") {
    return (
      <div className="flex items-center gap-6">
        <img src={weaveMotif} alt="" className="size-[128px] object-cover select-none" />
        <p className="hf-empty">{text}</p>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-7">
      <div className="relative h-[120px] w-[300px] shrink-0">
        <img src={studioGroup} alt="" className="size-full rounded-[22px] object-cover select-none" />
        <Glass className="-top-3 -right-4 h-[52px] w-[78px] rounded-[26px_26px_8px_26px]" />
      </div>
      <p className="hf-empty">{text}</p>
    </div>
  )
}

// "No decisions yet" on an empty project.
export function DecisionsEmpty({ style, text }: { style: StyleId; text: string }) {
  if (style === "gesture") {
    return (
      <div className="hf-card flex flex-col items-center px-8 pt-10 pb-12">
        <img src={gestureRibbons} alt="" className={cn("h-[320px] w-auto mix-blend-multiply select-none", FLOAT)} />
        <p className="hf-empty-lg mt-6">{text}</p>
      </div>
    )
  }
  if (style === "weave") {
    return (
      <div className="hf-card overflow-hidden">
        <WovenStrip />
        <div className="flex flex-col items-center px-8 pt-8 pb-12">
          <img src={weavePeople} alt="" className="h-[320px] w-auto select-none" />
          <p className="hf-empty-lg mt-7">{text}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="hf-card flex flex-col items-center px-8 pt-10 pb-12">
      <div className="relative h-[260px] w-[380px]">
        <img src={studioPeople} alt="" className="size-full rounded-[120px_120px_120px_24px] object-cover select-none" />
        <Glass className="-top-5 -left-6 h-[86px] w-[118px] rounded-[40px_40px_12px_40px]" />
        <Glass className="-right-5 -bottom-4 h-[60px] w-[84px] rounded-[28px_8px_28px_28px]" />
      </div>
      <p className="hf-empty-lg mt-9">{text}</p>
    </div>
  )
}

// The quiet bottom of the Coming up rail.
export function QuietArt({ style, className }: { style: StyleId; className?: string }) {
  if (style === "gesture") return <div className={className}><img src={gestureTop} alt="" className="w-full mix-blend-multiply select-none [mask-image:linear-gradient(to_bottom,transparent,black_30%)]" /></div>
  if (style === "weave") return <div className={className}><img src={weaveCrop} alt="" className="aspect-square w-full object-cover select-none" /></div>
  return <div className={className}><img src={studioPlant} alt="" className="aspect-square w-full rounded-[22px] object-cover select-none" /></div>
}
