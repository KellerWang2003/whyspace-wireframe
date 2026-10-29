import { useSyncExternalStore } from "react"

// Tiny hash router so every screen has a link you can paste: #/inbox, #/p/whiskr/decisions
function getPath() {
  return window.location.hash.replace(/^#/, "") || "/signup"
}

function subscribe(cb: () => void) {
  window.addEventListener("hashchange", cb)
  return () => window.removeEventListener("hashchange", cb)
}

export function useRoute() {
  const path = useSyncExternalStore(subscribe, getPath)
  return path.split("/").filter(Boolean)
}

export function navigate(path: string) {
  window.location.hash = path
}
