import { PanelLeftClose } from "lucide-react"
import { setPanelCollapsed } from "./rail-state"

// Folds a project's panel beside the rail (the Duet and Chats lists don't fold). It sits at the panel's bottom
// left, on your photo's line, so it reads as part of the sidebar's footer. When folded, the expand button takes
// the same spot just right of the rail (app-shell.tsx), and clicking the open project in the rail also brings it back.
export function FoldPanelButton() {
  return (
    <button onClick={() => setPanelCollapsed(true)} aria-label="Collapse sidebar" className="flex size-7 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent">
      <PanelLeftClose className="size-4" strokeWidth={1.5} />
    </button>
  )
}
