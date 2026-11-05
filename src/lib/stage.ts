// Prototype helper only: the Whiskr project plays out over one week of scenarios.
// Pick a stage in the debug panel to see the project as it stood at that point.
// The choice is kept in localStorage and applied when data.ts loads, so switching reloads the page.
// A test scenario (lib/scenario.ts) pins the stage its data starts from.
import { PINS } from "@/lib/scenario"

export const STAGES = [
  { name: "After the first cat test", date: "Oct 21", what: "The brand color is red and the swipe card doesn't move. Trevor has the cat test videos." },
  { name: "Cat video review", date: "Oct 22", what: "Trevor and Kelly review the videos in the workshop. Cats only notice movement, so they add a moving dot." },
  { name: "No more red", date: "Oct 23", what: "Research finds cats can't see red. Trevor changes the brand to blue and marks it important. The posters are still red." },
  { name: "Promo video", date: "Oct 25", what: "Keller plans a 15-second video with Claude. The length waits for him to confirm." },
  { name: "Christine catches up", date: "Oct 25", what: "The whole week is in. Christine reads it on Home." },
] as const

const KEY = "whiskr-stage"

function read() {
  if (PINS) return PINS.stage
  try {
    const n = Number(localStorage.getItem(KEY))
    return n >= 1 && n <= STAGES.length ? n : STAGES.length
  } catch {
    return STAGES.length
  }
}

// 1-based, so "first shown at stage 2" reads naturally in data.ts.
export const STAGE = read()

export function setStage(n: number) {
  try {
    localStorage.setItem(KEY, String(n))
  } catch {
    // Storage blocked: nothing to keep.
  }
  location.reload()
}
