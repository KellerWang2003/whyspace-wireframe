// Prototype helper only: see the workspace as one of the Whiskr team.
// Pick a person in the debug panel. Like the stage, the choice is kept in localStorage
// and applied when data.ts loads, so switching reloads the page.

export const VIEWERS = ["MC", "CH", "TR", "KL"] as const

const KEY = "whiskr-viewer"

function read(): string {
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
