import { useState } from "react"
import { Copy, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { PersonAvatar } from "@/components/app/person"
import { StatusIcon } from "@/components/app/status-badge"
import { PEOPLE, type Decision } from "@/data"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { decisionsFor, useConfirmed, useStatusOf } from "@/lib/work"

// Trevor's brand guidelines v3 as the deck they are (scenario 2 opens it from Artifacts and from
// the task), page by page, with the decisions on it beside the pages. The decisions are the app's
// own: whatever reaches the artifact, in the order the deck tells them.

const PAGES = ["Cover", "Color", "Logo", "Motion", "Type"] as const
const ORDER = ["nored", "dart", "dotbrand"]
const rank = (d: Decision) => { const i = ORDER.indexOf(d.id); return i < 0 ? ORDER.length : i }

export function BrandDeckDialog({ open, onOpenChange, artifact = "w1" }: { open: boolean; onOpenChange: (o: boolean) => void; artifact?: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[82vh] max-w-6xl gap-0 overflow-hidden p-0 sm:max-w-6xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogTitle className="sr-only">Brand guidelines v3</DialogTitle>
        <DialogDescription className="sr-only">Trevor’s brand guidelines, page by page, with the decisions on them.</DialogDescription>
        <BrandDeck artifact={artifact} />
      </DialogContent>
    </Dialog>
  )
}

export function BrandDeck({ artifact = "w1" }: { artifact?: string }) {
  const [page, setPage] = useState(0)
  const { openDecision } = useStore()
  const statusOf = useStatusOf()
  const decisions = [...decisionsFor(artifact)].sort((a, b) => rank(a) - rank(b))
  const { n, m } = useConfirmed(decisions)
  const text = [`Brand guidelines v3 · ${n} of ${m} confirmed`, ...decisions.map((d) => `${d.title} (${first(d.owner)}, ${d.when ?? ""}): ${d.why ?? ""}`)].join("\n")
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard?.writeText(text).catch(() => { /* clipboard blocked: the card is on screen */ })
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <div className="grid h-full min-h-0 w-full grid-cols-[112px_1fr_300px] bg-background text-foreground">
      <nav aria-label="Pages" className="flex min-h-0 flex-col gap-1 overflow-y-auto border-r bg-muted/30 p-3">
        {PAGES.map((p, i) => (
          <button key={p} type="button" onClick={() => setPage(i)} aria-current={i === page ? "page" : undefined} className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted", i === page && "bg-muted font-medium")}>
            <span className="w-3 text-muted-foreground tabular-nums">{i + 1}</span>
            <span className={cn("flex h-10 w-16 shrink-0 items-center justify-center rounded border bg-background text-[10px] text-muted-foreground", i === page && "border-foreground/40 text-foreground")}>{p}</span>
          </button>
        ))}
      </nav>
      <div className="flex min-h-0 min-w-0 flex-col items-center justify-center gap-4 overflow-y-auto bg-neutral-100 p-8 dark:bg-neutral-900">
        <DeckPage page={page} />
        <p className="text-xs text-muted-foreground tabular-nums">{page + 1} of {PAGES.length}</p>
      </div>
      <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto border-l p-5">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-medium"><Layers className="size-4 text-muted-foreground" />Brand guidelines v3</h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><PersonAvatar id="TR" className="size-4" />Trevor · updated Monday · Brand</p>
        </div>
        <section aria-label="Decisions on it" className="rounded-xl border bg-card">
          <header className="flex items-center gap-2 border-b px-3 py-2 text-xs">
            <span className="flex-1 font-medium">Decisions on it</span>
            <span className="text-muted-foreground tabular-nums">{n} of {m} confirmed</span>
          </header>
          <ul className="flex flex-col gap-1 p-1.5">
            {decisions.map((d) => (
              <li key={d.id}>
                <button type="button" onClick={() => openDecision(d.id)} className="flex w-full items-start gap-2 rounded-md px-1.5 py-1.5 text-left hover:bg-muted/60">
                  <StatusIcon status={statusOf(d)} className="mt-[3px] size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs leading-snug font-medium">{d.title}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground"><PersonAvatar id={d.owner} className="size-3.5" />{first(d.owner)}{d.when && ` · ${d.when}`}</span>
                    {d.why && <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">{d.why}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <footer className="border-t px-1.5 py-1.5">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={copy}><Copy />{copied ? "Copied" : "Copy as text"}</Button>
          </footer>
        </section>
      </aside>
    </div>
  )
}

const first = (id: string) => PEOPLE[id]?.name.split(" ")[0] ?? id

function DeckPage({ page }: { page: number }) {
  return (
    <div className="flex aspect-video w-full max-w-[720px] flex-col rounded-lg bg-white p-10 text-neutral-900 shadow-sm ring-1 ring-black/5">
      {page === 0 && (
        <>
          <p className="font-serif text-4xl">Whiskr brand guidelines</p>
          <p className="mt-2 text-sm text-neutral-500">v3 · Trevor · Monday</p>
          <p className="mt-auto max-w-md text-sm leading-6">Changed on Monday, after the second cat test: the brand is blue, not red, and the dot darts like prey.</p>
        </>
      )}
      {page === 1 && (
        <>
          <p className="font-serif text-2xl">Color</p>
          <div className="mt-6 grid flex-1 grid-cols-3 gap-4">
            <Swatch tone="bg-neutral-800" label="Blue" note="The brand color" />
            <Swatch tone="bg-white ring-1 ring-black/10" label="White" note="Type on blue" />
            <Swatch tone="bg-neutral-200" label="Red" note="Retired on Monday" retired />
          </div>
          <p className="mt-6 text-sm text-neutral-600">Cats can’t see red. Blue is the color they see best.</p>
        </>
      )}
      {page === 2 && (
        <>
          <p className="font-serif text-2xl">Logo</p>
          <div className="flex flex-1 items-center justify-center"><CatMark className="h-32 w-auto" /></div>
          <p className="text-sm text-neutral-600">The swipe dot is part of the logo. Cats already know it from the app.</p>
        </>
      )}
      {page === 3 && (
        <>
          <p className="font-serif text-2xl">Motion</p>
          <div className="mt-4 grid flex-1 grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <svg viewBox="0 0 240 100" className="h-28 w-full text-neutral-400" aria-hidden><path d="M12 70 C 70 10, 150 10, 228 60" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" /><circle cx="12" cy="70" r="5" fill="currentColor" /></svg>
              <p className="text-sm text-neutral-500 line-through">A smooth glide</p>
            </div>
            <div className="flex flex-col gap-2">
              <svg viewBox="0 0 240 100" className="h-28 w-full text-neutral-900" aria-hidden><path d="M12 70 L 62 30 L 110 64 L 170 22 L 228 58" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="62" cy="30" r="4" fill="currentColor" /><circle cx="110" cy="64" r="4" fill="currentColor" /><circle cx="170" cy="22" r="4" fill="currentColor" /><circle cx="228" cy="58" r="7" fill="currentColor" /></svg>
              <p className="text-sm font-medium">Short darts, with stops</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-neutral-600">In the second cat test, all three cats pounced on the darting dot and ignored the gliding one.</p>
        </>
      )}
      {page === 4 && (
        <>
          <p className="font-serif text-2xl">Type</p>
          <p className="mt-8 font-serif text-5xl">Whiskr</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-neutral-600">Serif for names and headlines, the sans for everything else. Owners read the posters; cats don’t.</p>
        </>
      )}
    </div>
  )
}

function Swatch({ tone, label, note, retired }: { tone: string; label: string; note: string; retired?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={cn("relative flex-1 rounded-md", tone)}>{retired && <span className="absolute inset-0 m-auto h-px w-full rotate-[-20deg] bg-neutral-500" aria-hidden />}</div>
      <p className={cn("text-sm font-medium", retired && "text-neutral-500 line-through")}>{label}</p>
      <p className="-mt-1.5 text-xs text-neutral-500">{note}</p>
    </div>
  )
}

export function CatMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-label="Whiskr logo" role="img">
      <path d="M22 70 C 10 50, 14 30, 26 14 L 42 32 L 78 32 L 94 14 C 106 30, 110 50, 98 70 C 88 84, 32 84, 22 70 Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="46" cy="52" r="3" fill="currentColor" />
      <circle cx="74" cy="52" r="3" fill="currentColor" />
      <circle cx="104" cy="68" r="9" fill="currentColor" />
    </svg>
  )
}
