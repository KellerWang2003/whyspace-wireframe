import type { DeskConfig } from "../desks"
import { TITLE } from "../tools/claude-code-script"
import { S4ClaudeCode, S4Overlay } from "./claude-code"

// Scenario 4's desktop: Kelly on Tuesday at 11:04, Whyspace open on Today, Claude Code behind it.
// The update records a decision that follows Trevor's (◉, nothing to confirm) and finishes the task.
export const S4_DESK: DeskConfig = {
  person: "KL",
  clock: "Tue 11:04",
  front: "whyspace",
  tools: [{ id: "claude-code", name: "Claude Code", title: TITLE, icon: "terminal", dark: true, App: S4ClaudeCode }],
  Overlay: S4Overlay,
}
