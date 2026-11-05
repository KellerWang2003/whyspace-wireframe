// The quick test scenarios, in order. demo.tsx renders them; the debug panel lists them so a
// tester can be dropped straight into one.
export type Scenario = { n: number; title: string; who: string; built: boolean }
export const SCENARIOS: Scenario[] = [
  { n: 1, title: "Keller plans the promo video", who: "Keller · Tuesday", built: true },
  { n: 2, title: "Keller makes the video in Runway", who: "Keller · Wednesday", built: true },
  { n: 3, title: "Keller’s Duet needs him", who: "Keller · Thursday", built: true },
  { n: 4, title: "Trevor’s change reaches Kelly’s app", who: "Kelly · Tuesday", built: true },
]
