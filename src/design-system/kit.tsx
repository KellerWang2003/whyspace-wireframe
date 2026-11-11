import type { ReactNode } from "react"
import { MarkIcon } from "@/components/app/status-badge"
import { cn } from "@/lib/utils"
import { STATE, type State } from "./model"

// The page's own pieces. They are drawn with the app's tokens and type roles, so the page itself
// changes when the system does. Type and hairlines carry the layout; nothing here is decoration.

// Where a part stands, as the product's mark with its word.
export function StateMark({ state, word = true, className }: { state: State; word?: boolean; className?: string }) {
  const s = STATE[state]
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 type-caption text-muted-foreground", className)}>
      <MarkIcon mark={s.mark} className="size-3.5" />
      <span className={word ? undefined : "sr-only"}>{s.label}</span>
    </span>
  )
}

export function Section({ id, title, state, children }: { id: string; title: string; state?: State; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 border-t border-foreground/80 pt-5 pb-20">
      <header className="mb-10 flex items-baseline justify-between gap-4">
        <h2 id={`${id}-title`} className="type-title">{title}</h2>
        {state && <StateMark state={state} />}
      </header>
      <div className="flex flex-col divide-y">{children}</div>
    </section>
  )
}

// One kind of thing inside a section: its name in the margin, the specimens beside it.
export function Group({ title, note, children, className }: { title: string; note?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className="grid gap-4 py-8 first:pt-0 last:pb-0 lg:grid-cols-[140px_minmax(0,1fr)] lg:gap-10">
      <div className="flex flex-col gap-1">
        <h3 className="type-label">{title}</h3>
        {note && <div className="type-caption text-muted-foreground">{note}</div>}
      </div>
      <div className={cn("min-w-0", className)}>{children}</div>
    </div>
  )
}

// A token or class name, as you would type it.
export function Code({ children, className }: { children: ReactNode; className?: string }) {
  return <code className={cn("font-mono text-[11px] leading-4 text-muted-foreground", className)}>{children}</code>
}

// One specimen with its name under it, and an optional measurement.
export function Specimen({ name, note, children, className }: { name: ReactNode; note?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <figure className="flex min-w-0 flex-col items-start gap-3">
      <div className={cn("flex min-h-10 items-center", className)}>{children}</div>
      <figcaption className="flex flex-col gap-0.5">
        <Code className="text-foreground">{name}</Code>
        {note && <span className="type-caption text-muted-foreground tabular-nums">{note}</span>}
      </figcaption>
    </figure>
  )
}

// Specimens side by side, wrapping on narrow screens.
export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-start gap-x-10 gap-y-8", className)}>{children}</div>
}
