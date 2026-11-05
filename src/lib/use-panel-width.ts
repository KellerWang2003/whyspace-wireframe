import { useCallback, useState } from "react"

const PREFIX = "whyspace.panel-width."

function read(key: string | undefined, fallback: number) {
  if (!key) return fallback
  try {
    const v = Number(localStorage.getItem(PREFIX + key))
    return Number.isFinite(v) && v > 0 ? v : fallback
  } catch {
    return fallback
  }
}

/** A panel width in px, remembered per key in localStorage. */
export function usePanelWidth(key: string | undefined, initial: number) {
  const [width, setWidthState] = useState(() => read(key, initial))
  const setWidth = useCallback(
    (w: number) => {
      setWidthState(w)
      if (key) try { localStorage.setItem(PREFIX + key, String(Math.round(w))) } catch { /* ignore */ }
    },
    [key]
  )
  return [width, setWidth] as const
}
