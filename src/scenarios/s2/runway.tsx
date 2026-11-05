import { TesterCard } from "../tester"
import { RunwayApp } from "../tools/runway"
import { LABEL, LINES } from "../tools/runway-script"
import { useSent } from "../tools/sent"
import type { ToolEvent } from "../tools/events"

// Scenario 2's windows: Keller's Runway, and the tester's card with the next line to say.

export function S2Runway({ onEvent }: { onEvent: (e: ToolEvent) => void }) {
  return <RunwayApp onEvent={onEvent} person="Keller" />
}

export function S2Overlay() {
  const n = useSent("runway")
  return <TesterCard label={LABEL} lines={LINES} n={n} />
}

