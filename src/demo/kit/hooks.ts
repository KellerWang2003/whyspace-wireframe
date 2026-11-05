import { useEffect, useRef, useState } from "react"

// Hooks the scenarios' screens share. Kept apart from the components so fast refresh keeps working.

// Copy a text to the clipboard, and say so for a moment.
export function useCopy(text: string) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])
  const copy = () => {
    void navigator.clipboard?.writeText(text).catch(() => { /* clipboard blocked: the text is on screen to retype */ })
    setCopied(true)
  }
  return [copied, copy] as const
}

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
