import { PanelLeftClose } from "lucide-react"
import { setPanelCollapsed } from "./rail-state"

// Folds a project's panel beside the rail (the Duet and Chats lists don't fold). It sits in the panel's own
// header, so it reads as closing the panel, not the rail. Clicking the open project in the rail brings it back.
export function FoldPanelButton() {
  return (
    <button onClick={() => setPanelCollapsed(true)} aria-label="Collapse sidebar" className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
      <PanelLeftClose className="size-4" />
    </button>
  )
}
