import { ARTIFACTS, DECISIONS, LINKS, PROJECTS, partsOf, type Artifact, type Decision } from "@/data"

// Playground only: extra structure the seven decision views need on top of data.ts.
// Kept in its own file so the main prototype data stays untouched.

// The prototype's "today" and the reader's last visit, as day numbers counted from Oct 1.
export const TODAY = 25
export const LAST_VISIT = 20

const MONTH_START: Record<string, number> = { Sep: -30, Oct: 0, Nov: 31, Dec: 61 }

// "Oct 9" → 9, "Today" → 24, "Fri Oct 30" → 30, "Mon Nov 2" → 33
export function dayOf(text?: string): number | undefined {
  if (!text) return undefined
  if (text === "Today") return TODAY
  if (text === "Yesterday") return TODAY - 1
  const m = text.match(/(Sep|Oct|Nov|Dec) (\d+)/)
  return m ? MONTH_START[m[1]] + Number(m[2]) : undefined
}

export function dayLabel(day: number) {
  if (day === TODAY) return "Today"
  if (day > 61) return `Dec ${day - 61}`
  if (day > 31) return `Nov ${day - 31}`
  if (day < 1) return `Sep ${day + 30}`
  return `Oct ${day}`
}

// When a decision sits in time: when it was made, or its due date if still open.
export const dayOfDecision = (d: Decision) => dayOf(d.when) ?? dayOf(d.due) ?? TODAY

export const isNew = (d: Decision) => (dayOf(d.when) ?? 0) > LAST_VISIT
export const isAI = (d: Decision) => d.status === "inf"

// Which artifacts each decision shaped. A decision can shape more than one.
const SHAPES: Record<string, string[]> = {
  move: ["w3", "w5"],
  dot: ["w4", "w5"],
  purr: ["w5", "w2"],
  dotbrand: ["w1"],
  nored: ["w1", "w4", "w6"],
  short: ["w7"],
  pounce: ["w7", "w8"],
  cram: ["a11", "a12"],
  slides: ["a13"],
  cite: ["a15"],
  figma: ["a15", "a16"],
  deck: ["a17"],
  presenter: ["a17"],
}

// Decisions that pull against each other (the misalignment alerts in Inbox).
export const CONFLICTS: [string, string, string][] = [
  ["nored", "w6", "The poster still uses tuna red"],
  ["figma", "a16", "Two generated questions lack a supporting source passage"],
]

export type Model = {
  project: (typeof PROJECTS)[number]
  decisions: Decision[]
  artifacts: Artifact[]
  parts: { name: string; owner: string }[]
  links: [string, string][]
  byId: (id: string) => Decision | undefined
  artifactsOf: (d: Decision) => Artifact[]
  decisionsOf: (a: Artifact) => Decision[]
  parentsOf: (d: Decision) => Decision[]
  childrenOf: (d: Decision) => Decision[]
  conflictsOf: (d: Decision) => string[]
  // Everything that builds on this decision, directly or not: what a change would ripple into.
  downstream: (id: string) => Set<string>
  upstream: (id: string) => Set<string>
}

export function buildModel(projectId: string): Model {
  const project = PROJECTS.find((p) => p.id === projectId) ?? PROJECTS[0]
  const decisions = DECISIONS.filter((d) => d.project === project.id)
  const ids = new Set(decisions.map((d) => d.id))
  const artifacts = ARTIFACTS.filter((a) => a.project === project.id)
  const links = LINKS.filter(([a, b]) => ids.has(a) && ids.has(b))
  const byId = (id: string) => decisions.find((d) => d.id === id)
  const walk = (start: string, next: (id: string) => string[]) => {
    const seen = new Set<string>()
    const stack = [start]
    while (stack.length)
      for (const n of next(stack.pop()!))
        if (!seen.has(n)) {
          seen.add(n)
          stack.push(n)
        }
    return seen
  }
  return {
    project,
    decisions,
    artifacts,
    parts: partsOf(decisions),
    links,
    byId,
    artifactsOf: (d) => (SHAPES[d.id] ?? []).map((id) => artifacts.find((a) => a.id === id)).filter((a): a is Artifact => !!a),
    decisionsOf: (a) => decisions.filter((d) => (SHAPES[d.id] ?? []).includes(a.id)),
    parentsOf: (d) => links.filter(([, b]) => b === d.id).map(([a]) => byId(a)!),
    childrenOf: (d) => links.filter(([a]) => a === d.id).map(([, b]) => byId(b)!),
    conflictsOf: (d) => CONFLICTS.filter(([a, b]) => a === d.id || b === d.id).map(([, , why]) => why),
    downstream: (id) => walk(id, (n) => links.filter(([a]) => a === n).map(([, b]) => b)),
    upstream: (id) => walk(id, (n) => links.filter(([, b]) => b === n).map(([a]) => a)),
  }
}

// How much depends on a decision, for sizing marks. 0 = nothing builds on it.
export const weightOf = (m: Model, d: Decision) => m.downstream(d.id).size

// When an artifact was last touched: "Oct 9" → 9, "40m ago" or "Today" → today.
export function updatedDay(a: Artifact) {
  if (/ago|Today/.test(a.updated)) return TODAY
  return dayOf(a.updated) ?? TODAY
}

// An artifact's life on the timeline: from its first decision (or its last update) to its last update,
// with a version at each made decision that shaped it.
export function spanOf(m: Model, a: Artifact) {
  const made = m.decisionsOf(a).filter((d) => d.when).map(dayOfDecision)
  const end = Math.max(updatedDay(a), ...made)
  const start = Math.min(updatedDay(a), ...made)
  return { start, end, versions: [...new Set(made)].sort((x, y) => x - y) }
}

// Mock subsections, to show that sections nest like Figma sections: project > part > subsection > ...
// Each lists the decisions and artifacts that live in it instead of in its parent.
export type SectionSeed = { id: string; name: string; parent: string; items: string[]; summary?: string }
const ALL_SUBSECTIONS: Record<string, SectionSeed[]> = {
  whiskr: [
    { id: "card", name: "Swipe card", parent: "part:App", items: ["d:dot", "d:purr", "a:w5"], summary: "A purring dot moves across the card and leads the swipe." },
    { id: "promo", name: "Promo video", parent: "part:Marketing", items: ["d:short", "d:pounce", "a:w7", "a:w8"], summary: "Fifteen seconds, opening on Luna's real pounce." },
  ],
  studio: [
    { id: "quiz", name: "Quiz flow", parent: "part:Prototype", items: ["d:figma", "a:a15"], summary: "Generate five practice questions from one PDF, with a supporting passage and source page." },
    { id: "react", name: "Generation and evaluation", parent: "part:Prototype", items: ["a:a16"], summary: "Build and evaluate the PDF extraction and question-generation pipeline." },
  ],
}

// Only what exists at the current Whiskr stage; a subsection with nothing in it yet is hidden.
const present = new Set([...DECISIONS.map((d) => `d:${d.id}`), ...ARTIFACTS.map((a) => `a:${a.id}`)])
export const SUBSECTIONS: Record<string, SectionSeed[]> = Object.fromEntries(
  Object.entries(ALL_SUBSECTIONS).map(([project, seeds]) => [
    project,
    seeds.map((s) => ({ ...s, items: s.items.filter((it) => present.has(it)) })).filter((s) => s.items.length > 0),
  ]),
)
