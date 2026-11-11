import { createContext, useContext, type ReactNode } from "react"
import { createPortal } from "react-dom"

// A thread page's tab row has room on the right, so the open tab's own controls (⋯, New task, Add) sit there
// instead of on a row of their own. Elsewhere the controls keep their own row.
export const ThreadToolbarSlot = createContext<HTMLElement | null>(null)

export function ThreadToolbar({ children }: { children: ReactNode }) {
  const slot = useContext(ThreadToolbarSlot)
  if (slot) return createPortal(children, slot)
  return <div className="flex flex-wrap items-center gap-2">{children}</div>
}
