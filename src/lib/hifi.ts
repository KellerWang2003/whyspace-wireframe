import { useSyncExternalStore } from "react"

// High-fi look: the brand colors on the app's tokens (index.css, :root[data-hifi]), on top of the wireframe grays.
// It starts on. The debug panel switches it live, and this browser remembers the choice.
const KEY = "whyspace-hifi"
const listeners = new Set<() => void>()

function read() {
  try {
    return localStorage.getItem(KEY) !== "off"
  } catch {
    return true
  }
}

let on = read()
// Set before the first render (main.tsx imports this file), so the page never flashes gray.
document.documentElement.toggleAttribute("data-hifi", on)

export function setHifi(next: boolean) {
  on = next
  document.documentElement.toggleAttribute("data-hifi", on)
  try {
    localStorage.setItem(KEY, on ? "on" : "off")
  } catch {
    // Storage blocked: the choice lasts for this visit.
  }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useHifi() {
  return useSyncExternalStore(subscribe, () => on)
}
