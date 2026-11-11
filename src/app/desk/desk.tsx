import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { PEOPLE } from "@/data"
import { OverlayPill } from "@/screens/desktop-overlay"
import { checkRows, useCaught } from "@/screens/overlay-model"
import { ClaudeWin, DocsWin, FigmaWin, SlackWin } from "./apps"
import { SCENES, type Scene } from "./data"

// The Desk: three days of one piece of work on three people's desktops, one scene at a time. Claude,
// Docs, Slack and Figma are stand-ins; the Whyspace pieces are real: the pill (the overlay itself), the
// check that follows a share, and the card where the work lands. ← → step through the days.

const KEY = "whyspace.b.desk-scene"
const APP_NAME = { claude: "Claude", docs: "Google Docs", slack: "Slack", figma: "Figma" }

function readScene() {
  try {
    const n = Number(localStorage.getItem(KEY))
    return n >= 1 && n <= SCENES.length ? n : 1
  } catch {
    return 1
  }
}

export function Desk({ onExit }: { onExit?: () => void }) {
  const [id, setId] = useState(readScene)
  const scene = SCENES[id - 1] ?? SCENES[0]
  const go = (n: number) => {
    const next = Math.min(SCENES.length, Math.max(1, n))
    setId(next)
    try { localStorage.setItem(KEY, String(next)) } catch { /* storage blocked */ }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return
      if (e.key === "ArrowRight") { e.preventDefault(); go(id + 1) }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(id - 1) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  return (
    <div className="relative h-svh w-full overflow-hidden bg-[linear-gradient(160deg,#d9dde3_0%,#c9ced6_55%,#b9bfc9_100%)] text-[13px] text-neutral-900 select-none">
      <MenuBar scene={scene} onExit={onExit} />
      {/* Keyed by scene: each scene starts from what its person had decided by then. */}
      <SceneView key={scene.id} scene={scene} onExit={onExit} />
      <Stepper scene={scene} onStep={go} />
    </div>
  )
}

// One scene: the app window(s) and the pill, sharing what the person at the keyboard has decided.
function SceneView({ scene, onExit }: { scene: Scene; onExit?: () => void }) {
  const [all, act] = useCaught(scene.mine)
  const [expanded, setExpanded] = useState(!!scene.share)
  // The check when you share: open on arrival when the scene is the share itself.
  const [check, setCheck] = useState<string[] | null>(() => (scene.share ? checkRows(scene.mine, scene.where).map((c) => c.id) : null))
  const share = () => {
    setCheck(checkRows(all, scene.where).map((c) => c.id))
    setExpanded(true)
  }
  // The card where the work lands: teammates' decisions, then yours, live.
  const items = [...(scene.others ?? []), ...all]
  return (
    <>
      {scene.app === "claude" && <ClaudeWin scene={scene} mine={all} items={items} onShare={share} />}
      {scene.app === "docs" && <DocsWin scene={scene} items={items} onShare={share} />}
      {scene.app === "slack" && <SlackWin scene={scene} items={items} />}
      {scene.app === "figma" && <FigmaWin scene={scene} items={items} onShare={share} />}
      <OverlayPill all={all} act={act} where={scene.where} expanded={expanded} onExpanded={setExpanded} check={check} onCheck={setCheck} onOpenApp={onExit} />
    </>
  )
}

function MenuBar({ scene, onExit }: { scene: Scene; onExit?: () => void }) {
  const who = PEOPLE[scene.viewer]
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex h-7 items-center gap-4 bg-white/55 px-4 text-[12px] backdrop-blur">
      <span className="size-3 rounded-full bg-neutral-800" aria-hidden />
      <span className="font-semibold">{APP_NAME[scene.app]}</span>
      <span className="text-neutral-600">File</span>
      <span className="text-neutral-600">Edit</span>
      <span className="text-neutral-600">View</span>
      <span className="ml-auto text-neutral-700">{who?.name} · {who?.role}</span>
      <span className="text-neutral-700 tabular-nums">{scene.day} {scene.time}</span>
      {onExit && <button type="button" onClick={onExit} className="rounded px-1.5 py-0.5 text-neutral-700 hover:bg-black/5">Open Whyspace</button>}
    </div>
  )
}

// The scene bar: a fixed width, so it never jumps between scenes; a long title truncates.
function Stepper({ scene, onStep }: { scene: Scene; onStep: (n: number) => void }) {
  return (
    <div className="absolute bottom-3 left-1/2 z-20 flex w-[460px] max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-1 rounded-full bg-neutral-900/85 p-1 text-[12px] text-white shadow-lg backdrop-blur">
      <button type="button" aria-label="Previous scene" disabled={scene.id === 1} onClick={() => onStep(scene.id - 1)} className="flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent"><ChevronLeft className="size-4" /></button>
      <span className="w-8 shrink-0 text-center tabular-nums text-white/60">{scene.id}/{SCENES.length}</span>
      <span className="min-w-0 flex-1 truncate px-1" title={`${scene.day} ${scene.time} · ${scene.title}`}><span className="text-white/60">{scene.day} {scene.time} · </span>{scene.title}</span>
      <button type="button" aria-label="Next scene" disabled={scene.id === SCENES.length} onClick={() => onStep(scene.id + 1)} className="flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent"><ChevronRight className="size-4" /></button>
      <select aria-label="Scene" value={scene.id} onChange={(e) => onStep(Number(e.target.value))} className="sr-only">
        {SCENES.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
      </select>
    </div>
  )
}
