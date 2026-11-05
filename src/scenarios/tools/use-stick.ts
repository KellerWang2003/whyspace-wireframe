import { useEffect, useRef } from "react"

// Keeps a scrolling column at its end as it grows.
export function useStickToEnd(deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}
