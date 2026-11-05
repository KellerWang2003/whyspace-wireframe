import { useEffect, type ComponentType } from "react"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"
import { EditorialStyle } from "./editorial"
import { PainterlyStyle } from "./painterly"
import { BlockStyle } from "./blocks"
import { BRAND as B } from "./model"
import type { Page, StyleProps } from "./shared"

// High-fi playground (#/hifi/<style>/<page>): Today and Whiskr's Home in three brand styles,
// on the wireframe's own data. The wireframe's screens stay as they are.

const STYLES: { id: string; label: string; view: ComponentType<StyleProps> }[] = [
  { id: "editorial", label: "Editorial", view: EditorialStyle },
  { id: "painterly", label: "Painterly", view: PainterlyStyle },
  { id: "blocks", label: "Color block", view: BlockStyle },
]
const PAGES: { id: Page; label: string }[] = [{ id: "today", label: "Today" }, { id: "home", label: "Home" }]

const CSS = `
.hifi{--forest:${B.forest};--forest-deep:${B.forestDeep};--paper:${B.paper};--leaf:${B.leaf};--apricot:${B.apricot};--sky:${B.sky};--rose:${B.rose};
--leaf-wash:${B.leafWash};--apricot-wash:${B.apricotWash};--sky-wash:${B.skyWash};--rose-wash:${B.roseWash};
--leaf-ink:${B.leafInk};--apricot-ink:${B.apricotInk};--sky-ink:${B.skyInk};--rose-ink:${B.roseInk};--muted:${B.muted};--line:${B.line};--subtle:${B.subtle}}
.hifi ::selection{background:${B.apricotWash}}
.hf-note{transition:rotate .5s cubic-bezier(.2,.7,.2,1),translate .5s cubic-bezier(.2,.7,.2,1)}
.hf-note:hover{rotate:0deg!important;translate:0 -4px}
@media (prefers-reduced-motion:reduce){.hf-note{transition:none}}
`

export function HiFi({ style, page }: { style?: string; page?: string }) {
  const current = STYLES.find((s) => s.id === style) ?? STYLES[0]
  const at: Page = page === "home" ? "home" : "today"
  const go = (next: Page) => navigate(`/hifi/${current.id}/${next}`)

  // 1, 2 and 3 switch styles; T and H switch pages.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null
      if (e.metaKey || e.ctrlKey || e.altKey || el?.closest("input, textarea, [contenteditable=true]")) return
      const n = Number(e.key)
      if (n >= 1 && n <= STYLES.length) navigate(`/hifi/${STYLES[n - 1].id}/${at}`)
      else if (e.key === "t") navigate(`/hifi/${current.id}/today`)
      else if (e.key === "h") navigate(`/hifi/${current.id}/home`)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [current.id, at])

  const View = current.view
  return (
    <div className="hifi relative h-svh w-full overflow-hidden font-sans antialiased">
      <style>{CSS}</style>
      <View key={current.id} page={at} go={go} />
      <nav aria-label="High-fi playground" className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full bg-(--forest-deep)/95 p-1 text-[13px] text-(--paper) shadow-[0_8px_30px_rgba(46,57,34,0.28)] backdrop-blur">
        {STYLES.map((s) => <Seg key={s.id} on={s.id === current.id} onClick={() => navigate(`/hifi/${s.id}/${at}`)}>{s.label}</Seg>)}
        <span aria-hidden className="mx-1 h-5 w-px bg-(--paper)/20" />
        {PAGES.map((p) => <Seg key={p.id} on={p.id === at} onClick={() => go(p.id)}>{p.label}</Seg>)}
      </nav>
    </div>
  )
}

function Seg({ on, onClick, children }: { on: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={cn("h-8 rounded-full px-3.5 font-medium transition-colors", on ? "bg-(--paper) text-(--forest-deep)" : "text-(--paper)/75 hover:text-(--paper)")}>
      {children}
    </button>
  )
}
