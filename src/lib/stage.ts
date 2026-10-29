// Prototype helper only: the Whiskr project plays out over one week of scenarios.
// Pick a stage in the debug panel to see the project as it stood at that point.
// The choice is kept in localStorage and applied when data.ts loads, so switching reloads the page.

export const STAGES = [
  { name: "After the first cat test", date: "Oct 21", what: "Brand is tuna red. The swipe card is static. Trevor has the test footage to review." },
  { name: "Footage review", date: "Oct 22", what: "Trevor and Kelly are live on the canvas. Movement, the moving dot and the purr get logged." },
  { name: "No more red", date: "Oct 23", what: "Trevor drops red and marks it important. The poster is now out of line." },
  { name: "Promo video", date: "Oct 25", what: "Keller plans the 15-second video with Claude. The length waits for confirmation." },
  { name: "Christine catches up", date: "Oct 25", what: "The whole week is in. Christine reads it on the overview." },
] as const

const KEY = "whiskr-stage"

function read() {
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
