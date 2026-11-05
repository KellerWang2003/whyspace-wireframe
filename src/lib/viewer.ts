// Prototype helper only: see the workspace as one of the Whiskr team.
// Pick a person in the debug panel. Like the stage, the choice is kept in localStorage
// and applied when data.ts loads, so switching reloads the page. A test scenario pins the viewer.
import { PINS } from "@/lib/scenario"

export const VIEWERS = ["MC", "CH", "TR", "KL"] as const

const KEY = "whiskr-viewer"

function read(): string {
  if (PINS) return PINS.viewer
  try {
    const id = localStorage.getItem(KEY)
    return VIEWERS.find((v) => v === id) ?? "MC"
  } catch {
    return "MC"
  }
}

export const VIEWER = read()

export function setViewer(id: string) {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    // Storage blocked: nothing to keep.
  }
  location.reload()
}
