import { createContext, useContext, useState, type ReactNode } from "react"

export type Plan = "Free" | "Pro" | "Business"
export type Workspace = { id: string; name: string; plan: Plan; example: boolean }

type Store = {
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

const TIDEPOOL: Workspace = { id: "tidepool", name: "Tidepool", plan: "Free", example: true }

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  // Start inside Tidepool so deep links work; sign up resets to no workspace.
  const [workspaces, setWorkspaces] = useState<Workspace[]>([TIDEPOOL])
  const [currentId, setCurrentId] = useState<string | null>("tidepool")
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState<"create" | "join" | null>(null)

  const current = workspaces.find((w) => w.id === currentId) ?? null

  const store: Store = {
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
      setWorkspaces((all) => (all.some((w) => w.id === "tidepool") ? all : [...all, TIDEPOOL]))
      setCurrentId("tidepool")
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
