import { useEffect, useState } from "react"
import { Check, Copy } from "lucide-react"

// The tester's next line, ready to copy: one quiet line in the middle of the desktop's menu bar.
// Part of the test harness, not of the product. Hover shows the whole line; a click copies it.
export function TesterCard({ label, lines, n }: { label: string; lines: string[]; n: number }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])
  const line = lines[n]
  if (!line) return null
  const copy = () => {
    void navigator.clipboard?.writeText(line).catch(() => { /* clipboard blocked: the line is on screen to retype */ })
    setCopied(true)
  }
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-neutral-500 transition-colors hover:text-neutral-800">
      <span className="shrink-0 text-neutral-500/80">{label} · {n + 1} of {lines.length}</span>
      <button type="button" onClick={copy} title={line} className="min-w-0 truncate">“{line}”</button>
      <button type="button" onClick={copy} aria-label={copied ? "Copied" : "Copy line"} title="Copy" className="flex size-5 shrink-0 items-center justify-center rounded hover:bg-black/5">
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      </button>
    </div>
  )
}
