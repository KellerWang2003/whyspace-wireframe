import { createContext, useContext, useState, type ReactNode } from "react"
import type { Reply, Task } from "@/data"

export type Plan = "Free" | "Pro" | "Business"
export type Workspace = { id: string; name: string; plan: Plan; example: boolean }

type InboxState = Record<string, { read?: boolean; done?: boolean; response?: "accepted" | "declined" }>

type Store = {
  // Work state shared by every screen, so finishing a task in My tasks clears it from
  // Catch up and the Inbox and marks the artifact updated on the decision sheet.
  taskPatches: Record<string, Partial<Task>>
  patchTask: (id: string, patch: Partial<Task>) => void
  confirmed: Record<string, boolean>
  confirmDecision: (id: string) => void
  replies: Record<string, Reply[]>
  addReply: (decisionId: string, reply: Reply) => void
  // Inbox items to bring back in the overlay when you open the file they touch.
  reminders: Record<string, boolean>
  setReminder: (id: string, on: boolean) => void
  // The decision sheet, opened from any touch point (the Decisions tab uses its route instead).
  sheet: string | null
  openDecision: (id: string | null) => void
  inboxState: InboxState
  setInboxRead: (id: string, read: boolean) => void
  setInboxDone: (id: string, done: boolean) => void
  setInviteResponse: (id: string, response: "accepted" | "declined") => void
  workspaces: Workspace[]
  current: Workspace | null
  startFresh: () => void
  createWorkspace: (name: string) => void
  joinWorkspace: () => void
  switchWorkspace: (id: string) => void
  setPlan: (plan: Plan) => void
  upgradeOpen: boolean
  setUpgradeOpen: (open: boolean) => void
  inviteOpen: boolean
  setInviteOpen: (open: boolean) => void
  newProjectOpen: boolean
  setNewProjectOpen: (open: boolean) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  workspaceOpen: "create" | "join" | null
  setWorkspaceOpen: (mode: "create" | "join" | null) => void
}

const DESIGN_WORKSPACE: Workspace = { id: "design-studio", name: "Keller’s workspace", plan: "Free", example: true }

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  // Start inside Keller’s workspace so deep links work; sign up resets to no workspace.
  const [workspaces, setWorkspaces] = useState<Workspace[]>([DESIGN_WORKSPACE])
  const [currentId, setCurrentId] = useState<string | null>("design-studio")
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState<"create" | "join" | null>(null)

  const [workspaceInbox, setWorkspaceInbox] = useState<Record<string, InboxState>>({})
  const [taskPatches, setTaskPatches] = useState<Record<string, Partial<Task>>>({})
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({})
  const [replies, setReplies] = useState<Record<string, Reply[]>>({})
  const [reminders, setReminders] = useState<Record<string, boolean>>({})
  const [sheet, setSheet] = useState<string | null>(null)

  function updateInbox(id: string, patch: { read?: boolean; done?: boolean; response?: "accepted" | "declined" }) {
    if (!currentId) return
    setWorkspaceInbox((all) => ({ ...all, [currentId]: { ...all[currentId], [id]: { ...all[currentId]?.[id], ...patch } } }))
  }

  const current = workspaces.find((w) => w.id === currentId) ?? null

  const store: Store = {
    taskPatches,
    patchTask: (id, patch) => setTaskPatches((all) => ({ ...all, [id]: { ...all[id], ...patch } })),
    confirmed,
    confirmDecision: (id) => setConfirmed((all) => ({ ...all, [id]: true })),
    replies,
    addReply: (id, reply) => setReplies((all) => ({ ...all, [id]: [...(all[id] ?? []), reply] })),
    reminders,
    setReminder: (id, on) => setReminders((all) => ({ ...all, [id]: on })),
    sheet,
    openDecision: setSheet,
    inboxState: workspaceInbox[currentId ?? ""] ?? {},
    setInboxRead: (id, read) => updateInbox(id, { read }),
    setInboxDone: (id, done) => updateInbox(id, { done }),
    setInviteResponse: (id, response) => updateInbox(id, { response }),
    workspaces,
    current,
    // A brand new account has no workspace yet, so it lands on the empty state.
    startFresh() {
      setWorkspaces([])
      setCurrentId(null)
    },
    createWorkspace(name) {
      // New workspaces come with mock content so the prototype never looks empty.
      const ws: Workspace = { id: `ws-${Date.now()}`, name, plan: "Free", example: true }
      setWorkspaces((all) => [...all, ws])
      setCurrentId(ws.id)
    },
    joinWorkspace() {
      setWorkspaces((all) => (all.some((w) => w.id === "design-studio") ? all : [...all, DESIGN_WORKSPACE]))
      setCurrentId("design-studio")
    },
    switchWorkspace: setCurrentId,
    setPlan(plan) {
      setWorkspaces((all) => all.map((w) => (w.id === currentId ? { ...w, plan } : w)))
    },
    upgradeOpen,
    setUpgradeOpen,
    inviteOpen,
    setInviteOpen,
    newProjectOpen,
    setNewProjectOpen,
    searchOpen,
    setSearchOpen,
    workspaceOpen,
    setWorkspaceOpen,
  }

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error("useStore must be used inside StoreProvider")
  return store
}
