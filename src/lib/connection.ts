import { useSyncExternalStore } from "react"

// Whether Whyspace has lost its connection. Follows the browser's own online/offline events,
// and the debug panel can fake it ("Lost connection") to show the banner.
const listeners = new Set<() => void>()
let offline = typeof navigator !== "undefined" && navigator.onLine === false

export function setOffline(next: boolean) {
  offline = next
  listeners.forEach((l) => l())
}

if (typeof window !== "undefined") {
  window.addEventListener("offline", () => setOffline(true))
  window.addEventListener("online", () => setOffline(false))
}

export function useOffline() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => offline)
}
