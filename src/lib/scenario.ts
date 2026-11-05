// Prototype helper only: the quick test scenarios run on the real app, with Whiskr's data set up
// for that moment and one person pinned at the keyboard. Picked in the debug panel or the scenario
// bar; 0 is off. Like the stage, the choice is kept in localStorage and applied when data.ts loads,
// so switching reloads the page. src/scenarios/ holds each scenario's data and desktop.

export type Pins = { design: "b"; viewer: string; stage: number; today: number; time?: [number, number] }

// The scenarios that run on the real app, and what each pins: the design, who is at the keyboard,
// the Whiskr stage its data starts from, the day (counted from Oct 0, like playground/model TODAY)
// and the time of day, so greetings and the calendar's now line match the desktop clock. A scenario
// not listed here still runs on the demo page (#/demo/N) until it is ported.
export const SCENARIO_PINS: Record<number, Pins> = {
  1: { design: "b", viewer: "MC", stage: 3, today: 27, time: [9, 14] },
  2: { design: "b", viewer: "MC", stage: 5, today: 28, time: [10, 2] },
  3: { design: "b", viewer: "MC", stage: 5, today: 29, time: [9, 4] },
  4: { design: "b", viewer: "KL", stage: 5, today: 27, time: [11, 4] },
}

const KEY = "whyspace-scenario"

function read(): number {
  try {
    const n = Number(localStorage.getItem(KEY))
    return n in SCENARIO_PINS ? n : 0
  } catch {
    return 0
  }
}

export const SCENARIO = read()
export const PINS: Pins | null = SCENARIO_PINS[SCENARIO] ?? null
export const onRealApp = (n: number) => n in SCENARIO_PINS

// Minutes since midnight: the scenario's pinned time, or the real one.
export function nowMinutes() {
  if (PINS?.time) return PINS.time[0] * 60 + PINS.time[1]
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

// Switch scenario (0 = off) and reload, landing on `path` when given.
export function setScenario(n: number, path?: string) {
  try {
    if (n in SCENARIO_PINS) localStorage.setItem(KEY, String(n))
    else localStorage.removeItem(KEY)
  } catch {
    // Storage blocked: nothing to keep.
  }
  if (path) window.location.hash = `#${path}`
  window.location.reload()
}

// Open a scenario: on the real app when it runs there, otherwise on the demo page.
export const openScenario = (n: number) => (onRealApp(n) ? setScenario(n, "/today") : setScenario(0, `/demo/${n}`))
// Back to the prototype as it is.
export const exitScenario = () => setScenario(0, "/today")
