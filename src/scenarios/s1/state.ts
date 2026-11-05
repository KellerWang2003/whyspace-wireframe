import { useSyncExternalStore } from "react"

// Scenario 1's conversation with Claude. Module state: the Claude window stays open on the
// desktop, and a reload starts the scenario over. What Claude records lives in the app, not here.

export type Exchange = { me: string; blue: boolean }
type Chat = { exchanges: Exchange[]; pending: boolean }

let chat: Chat = { exchanges: [], pending: false }
const listeners = new Set<() => void>()
export const useChat = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => chat)
export const getChat = () => chat
export function setChat(patch: Partial<Chat>) {
  chat = { ...chat, ...patch }
  listeners.forEach((l) => l())
}
