import type { Activity, Artifact, ArtifactSource, Decision, InboxItem, Task } from "@/data"
import type { DuetLine, TogetherScript } from "@/app/duet"
import type { Plan } from "@/lib/store"
import { SCENARIO } from "@/lib/scenario"
import { S1 } from "./s1/data"
import { S2 } from "./s2/data"
import { S3 } from "./s3/data"
import { S4 } from "./s4/data"

// What a test scenario changes in Whiskr's data at its moment, on top of the stage it pins
// (lib/scenario.ts). data.ts and app/duet.ts apply it as they load. Only type imports from
// those, so loading has no cycle. Each scenario has its entry in PRESETS.

type Lists = { decisions: Decision; tasks: Task; inbox: InboxItem; artifacts: Artifact; duet: DuetLine }

export type Preset = {
  // New items, ahead of the stage's. A decision added here and hidden is still found by
  // decisionById when a shown decision replaces it ("What it replaced").
  add?: {
    decisions?: Decision[]
    tasks?: Task[]
    inbox?: InboxItem[]
    // An artifact can say where it lives; otherwise ARTIFACT_SOURCE has no entry for it.
    artifacts?: (Artifact & { source?: ArtifactSource; where?: string; url?: string })[]
    duet?: DuetLine[]
  }
  // Changes to items as the stage has them, by id.
  patch?: { [K in keyof Lists]?: Record<string, Partial<Lists[K]>> }
  // Ids to leave out of every list, of any kind: decisions, tasks, inbox items, artifacts, Duet lines.
  hide?: string[]
  // Duet lines to show before their stage.
  showDuet?: string[]
  // LINKS edges [followed, follower]: an inferred follower of a confirmed decision reads ◉.
  links?: [string, string][]
  // Where decisions reach, added to their own entries.
  reach?: Record<string, { artifact: string; task?: string; seen: string[] }[]>
  // Whiskr's "Working now", in place of the stage's.
  activity?: Activity[]
  // One-line summaries: by project id (Today's "Across your projects") and by thread name.
  week?: Record<string, string>
  part?: Record<string, string>
  // What the Duet says to a question with all these words, in place of its usual answer, with the decisions it cites.
  answers?: { words: string[]; text: string; refs: string[] }[]
  // An artifact whose "Open in …" shows the brand deck (scenarios/artifacts/brand-deck.tsx) in place of a link.
  deck?: string
  // A scenario about one task: Today lists only these ids as yours (Needs you and My tasks), plus
  // what its flow records. Other work stays in the projects. Unset: Today lists everything.
  today?: string[]
  // Conversations the Duet starts between two owners, by id (see app/together.ts).
  together?: Record<string, TogetherScript>
  // The workspace's plan. Unset: Free.
  plan?: Plan
}

const PRESETS: Record<number, Preset> = { 1: S1, 2: S2, 3: S3, 4: S4 }

export const PRESET: Preset = PRESETS[SCENARIO] ?? {}
