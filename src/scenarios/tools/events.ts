import type { Decision } from "@/data"
import type { Item } from "@/design-b/work"

// What a tool on the scenario desktop writes to Whyspace over MCP, in the app's own types. The
// desktop hands each event to the bridge, which puts it in the app's store.
export type ToolEvent =
  // Decisions the tool recorded, with the decisions they follow as LINKS edges ([followed, new]).
  // A guess has no edge; a line that follows a settled decision reads ◉ from precedent.
  | { type: "record"; decisions: Decision[]; links: [string, string][] }
  // The work was shared to its thread: the artifact to add, and the guesses in it to check.
  | { type: "share"; artifact: Item; check: string[] }
  // The task the work was for is done.
  | { type: "done"; task: string }
  // A note from Whyspace, shown by the desktop (not by the tool).
  | { type: "toast"; text: string }
