import { DuetDecided } from "@/app/duet-lines"
import type { SureLook } from "@/app/sure-mark"

// Playground (#/playground/sure): the Duet's Decided for you page drawn with each way of showing how
// sure your Duet was, side by side, so we can pick one. The pages are the real one.
const LOOKS: [SureLook, string][] = [
  ["meter", "A · Meter"],
  ["words", "B · Words"],
  ["marks", "C · Decision marks"],
]

export function SurePlayground() {
  return (
    <div className="h-svh overflow-y-auto bg-background">
      <div className="grid min-w-[60rem] grid-cols-3 divide-x">
        {LOOKS.map(([look, name]) => (
          <section key={look} aria-label={name} className="flex flex-col">
            <h2 className="px-6 pt-6 type-label text-muted-foreground">{name}</h2>
            <DuetDecided look={look} className="max-w-none sm:p-6" />
          </section>
        ))}
      </div>
    </div>
  )
}
