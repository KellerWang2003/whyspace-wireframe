import { TesterCard } from "../tester"
import { ClaudeCodeApp } from "../tools/claude-code"
import { LABEL, LINES } from "../tools/claude-code-script"
import { useSent } from "../tools/sent"
import type { ToolEvent } from "../tools/events"

// Scenario 4's windows: Kelly's Claude Code, and the tester's card with the line to paste.

export function S4ClaudeCode({ onEvent }: { onEvent: (e: ToolEvent) => void }) {
  return <ClaudeCodeApp onEvent={onEvent} person="Kelly" repo="whiskr-app" />
}

export function S4Overlay() {
  const n = useSent("claude-code")
  return <TesterCard label={LABEL} lines={LINES} n={n} />
}
