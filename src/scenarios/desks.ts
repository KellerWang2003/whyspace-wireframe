import type { ComponentType } from "react"
import type { Decision } from "@/data"
import { SCENARIO } from "@/lib/scenario"
import { S1_DESK } from "./s1/desk"
import { S2_DESK } from "./s2/desk"
import { S3_DESK } from "./s3/desk"
import { S4_DESK } from "./s4/desk"
import type { ToolEvent } from "./tools/events"

// Each scenario's desktop: who is at the keyboard, the tools beside Whyspace, the tester's card,
// and how the pill treats its decisions. src/scenarios/desktop.tsx draws it.

export type DockIcon = "whyspace" | "claude" | "runway" | "terminal" | "slack"

export type DeskTool = {
  id: string
  // The app's name in the menu bar and the dock, and what a task's "Start with" tool must match.
  name: string
  // The window's title bar.
  title: string
  icon: DockIcon
  dark?: boolean
  // Only the window's inside: the desktop draws the frame. What the tool writes to Whyspace goes through onEvent.
  App: ComponentType<{ onEvent: (e: ToolEvent) => void }>
}

export type DeskConfig = {
  // Who is at the keyboard (a PEOPLE id) and the menu bar's clock.
  person: string
  clock: string
  // The window on top at the start; Whyspace when unset.
  front?: string
  tools: DeskTool[]
  // Floats on the desktop: the tester's card with the next line to say, anything else the scenario needs.
  Overlay?: ComponentType
  // Taking the other side of a clash (in the pill or on Today) also records this, following theirs.
  takes?: Record<string, { decision: Decision; link: [string, string] }>
  // The tester's own words, offered as chips for a one-tap why when confirming a guess.
  hints?: Record<string, string[]>
  // The question the pill asks when that guess arrives without a reason ("Why Luna?"). Unset: "Why?".
  asks?: Record<string, string>
}

const DESKS: Record<number, DeskConfig> = { 1: S1_DESK, 2: S2_DESK, 3: S3_DESK, 4: S4_DESK }

export const DESK: DeskConfig | undefined = DESKS[SCENARIO]
