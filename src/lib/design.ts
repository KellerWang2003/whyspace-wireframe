// Prototype helper only. The main design is "b" (its code is src/app): each thread owns its tasks,
// decisions and artifacts, and Home rolls them all up. Two earlier designs are archived but still
// open from the debug panel, grayed out under Archived:
// A: project-wide Tasks, Decisions and Artifacts pages (the original design).
// C: the handoff is the only object. Work reaching a shared place (Docs, Figma, Slack, GitHub)
//    gets its calls pulled out; the sender backs the ones that matter; Today and threads show the rest.
// The ids stay "a", "b" and "c" so stored picks and shared ?design= links keep working.
// Picked in the debug panel (kept in localStorage, so switching reloads), or with ?design=c in the URL.
// A test scenario (lib/scenario.ts) pins the design it runs on.
import { PINS } from "@/lib/scenario"

export type Design = "a" | "b" | "c"

const KEY = "whyspace-design"
const DESIGNS: Design[] = ["a", "b", "c"]
const isDesign = (v: unknown): v is Design => DESIGNS.includes(v as Design)
// Opens on the main design unless VITE_DEFAULT_DESIGN says otherwise.
const FALLBACK: Design = isDesign(import.meta.env.VITE_DEFAULT_DESIGN) ? import.meta.env.VITE_DEFAULT_DESIGN : "b"

function read(): Design {
  if (PINS) return PINS.design
  try {
    const asked = new URLSearchParams(window.location.search).get("design")
    if (isDesign(asked)) {
      localStorage.setItem(KEY, asked)
      return asked
    }
    const stored = localStorage.getItem(KEY)
    return isDesign(stored) ? stored : FALLBACK
  } catch {
    return FALLBACK
  }
}

export const DESIGN: Design = read()

export function setDesign(design: Design) {
  try {
    localStorage.setItem(KEY, design)
  } catch {
    // Storage blocked: nothing to keep.
  }
  const url = new URL(window.location.href)
  if (url.searchParams.has("design")) {
    url.searchParams.delete("design")
    window.location.replace(url.toString())
  } else {
    window.location.reload()
  }
}
