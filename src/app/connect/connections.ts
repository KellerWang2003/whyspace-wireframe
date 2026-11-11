import { useSyncExternalStore } from "react"

// Connecting an AI tool to Whyspace, the way connectors work today: Whyspace runs a remote MCP server.
// You start in Whyspace (or in the tool's own directory), the tool sends you to Whyspace's sign-in and
// consent page (OAuth), you allow it, and you land back in the tool with Whyspace connected.
// Claude and ChatGPT go through it here; the other tools in My AI tools stay mock "Connected" rows.

export type ProviderId = "claude" | "chatgpt"

export const MCP_URL = "https://mcp.whyspace.app"

export const PROVIDERS: Record<ProviderId, {
  name: string
  // Where the tool's own page for Whyspace lives (its connector directory), and its settings page.
  listing: string
  settings: string
  // Where to paste the server URL when Whyspace isn't listed (or you'd rather add it yourself).
  custom: string
}> = {
  claude: {
    name: "Claude",
    listing: "claude.ai/directory/whyspace",
    settings: "claude.ai/settings/connectors",
    custom: "Settings › Connectors › Add custom connector",
  },
  chatgpt: {
    name: "ChatGPT",
    listing: "chatgpt.com/apps/whyspace",
    settings: "chatgpt.com/settings/apps",
    custom: "Settings › Apps › Create",
  },
}

export const isProvider = (id?: string): id is ProviderId => id === "claude" || id === "chatgpt"

const KEY = "whyspace-connections"
type State = Partial<Record<ProviderId, { at: number }>>
const listeners = new Set<() => void>()

function read(): State {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as State
  } catch {
    return {}
  }
}

let state = read()
// The tool just connected: My AI tools says so once when you come back to the Whyspace tab.
let fresh: ProviderId | null = null

function write(next: State) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Storage blocked: the connection lasts for this visit.
  }
  for (const l of listeners) l()
}

export function connect(id: ProviderId) {
  fresh = id
  write({ ...state, [id]: { at: Date.now() } })
}

export function disconnect(id: ProviderId) {
  const next = { ...state }
  delete next[id]
  write(next)
}

export function takeFresh() {
  const id = fresh
  fresh = null
  return id
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useConnections() {
  return useSyncExternalStore(subscribe, () => state)
}
