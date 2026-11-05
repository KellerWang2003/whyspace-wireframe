import { useEffect, useState } from "react"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"
import { CheckPanel } from "../check"
import { HANDOFFS, PEOPLE_C, SCENES, TALKS, threadOf, type Handoff, type Scene } from "../data"
import { counts, effective, isLive, needsYou } from "../model"
import { setScene, setViewerC, stepScene, useC } from "../state"
import { Count, Faces, WhereLabel } from "../ui"
import { ClaudeWin, DocsWin, FigmaWin, GitHubWin, SheetsWin, SlackWin } from "./apps"
import { MeetWin } from "./meet"

// The Desk: a week on one person's desktop, one scene at a time. Docs, Sheets, Slack, Claude, GitHub,
// Figma and Meet are stand-ins; the Whyspace pieces are real: the pill, the check that follows a share,
// and the card receivers see where the share landed. ← → step through the week. Shares state with the app.
export function DeskC({ onExit }: { onExit?: () => void }) {
  const s = useC()
  const scene = SCENES[s.scene - 1] ?? SCENES[0]

  // Whoever is at the keyboard in this scene is who you are.
  useEffect(() => { if (s.viewer !== scene.viewer) setViewerC(scene.viewer) }, [scene, s.viewer])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return
      if (e.key === "ArrowRight") { e.preventDefault(); stepScene(1) }
      if (e.key === "ArrowLeft") { e.preventDefault(); stepScene(-1) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const handoff = HANDOFFS.find((h) => h.id === scene.handoff)
  const talk = TALKS.find((t) => t.id === scene.talk)
  const live = !!handoff && isLive(handoff, s)

  return (
    <div className="relative h-svh w-full overflow-hidden bg-[linear-gradient(160deg,#d9dde3_0%,#c9ced6_55%,#b9bfc9_100%)] text-[13px] text-neutral-900 select-none">
      <MenuBar scene={scene} />
      {scene.app === "docs" && handoff && <DocsWin handoff={handoff} live={live} />}
      {scene.app === "sheets" && handoff && <SheetsWin handoff={handoff} live={live} />}
      {scene.app === "slack" && handoff && <SlackWin handoff={handoff} live={live} />}
      {scene.app === "claude" && handoff && <ClaudeWin handoff={handoff} />}
      {scene.app === "github" && handoff && <GitHubWin handoff={handoff} live={live} />}
      {scene.app === "figma" && handoff && <FigmaWin handoff={handoff} live={live} />}
      {scene.app === "meet" && talk && <MeetWin talk={talk} />}
      <Pill handoff={live ? handoff : undefined} onExit={onExit} />
      <Stepper scene={scene} />
    </div>
  )
}

function MenuBar({ scene }: { scene: Scene }) {
  const app = { meet: "Google Meet", docs: "Google Docs", sheets: "Google Sheets", slack: "Slack", claude: "Claude", github: "GitHub", figma: "Figma" }[scene.app]
  const who = PEOPLE_C[scene.viewer]
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex h-7 items-center gap-4 bg-white/55 px-4 text-[12px] backdrop-blur">
      <span className="size-3 rounded-full bg-neutral-800" aria-hidden />
      <span className="font-semibold">{app}</span>
      <span className="text-neutral-600">File</span>
      <span className="text-neutral-600">Edit</span>
      <span className="text-neutral-600">View</span>
      <span className="ml-auto text-neutral-700">{who?.name} · {who?.role}</span>
      <span className="text-neutral-700 tabular-nums">{scene.day} {scene.time}</span>
    </div>
  )
}

function Stepper({ scene }: { scene: Scene }) {
  return (
    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-neutral-900/85 py-1 pr-1 pl-1 text-[12px] text-white shadow-lg backdrop-blur">
      <button type="button" aria-label="Previous scene" onClick={() => stepScene(-1)} className="flex size-7 items-center justify-center rounded-full hover:bg-white/15"><ChevronLeft className="size-4" /></button>
      <span className="tabular-nums text-white/60">{scene.id}/{SCENES.length}</span>
      <span className="px-2 whitespace-nowrap"><span className="text-white/60">{scene.day} {scene.time} · </span>{scene.title}</span>
      <button type="button" aria-label="Next scene" onClick={() => stepScene(1)} className="flex size-7 items-center justify-center rounded-full hover:bg-white/15"><ChevronRight className="size-4" /></button>
      <select aria-label="Scene" value={scene.id} onChange={(e) => setScene(Number(e.target.value))} className="sr-only">
        {SCENES.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
      </select>
    </div>
  )
}

// The pill: Whyspace on the desktop. Quiet unless something needs you. Right after a share, it opens
// into the check on its own; Done folds it back.
function Pill({ handoff, onExit }: { handoff?: Handoff; onExit?: () => void }) {
  const s = useC()
  const [open, setOpen] = useState(false)
  const rows = needsYou(s).filter((r) => r.kind !== "check")
  const effs = handoff ? effective(handoff, s) : []
  const n = counts(effs)

  if (handoff) return <CheckCard handoff={handoff} />

  return (
    <div className="absolute right-4 bottom-4 z-20 flex flex-col items-end gap-2">
      {open && (
        <div className="w-80 rounded-xl border border-black/10 bg-white p-3 text-foreground shadow-xl">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Needs you</span>
            <span>{SCENES[s.scene - 1]?.day}</span>
          </div>
          {rows.length === 0 && <p className="py-2 text-sm text-muted-foreground">Nothing. Keep working.</p>}
          <ul className="flex flex-col gap-1.5">
            {rows.map((r) => (
              <li key={r.kind === "talk" || r.kind === "stance" ? r.talk.id : r.kind === "built" ? `built-${r.eff.call.id}` : r.handoff.id} className="flex items-center gap-2 text-sm">
                {r.kind === "talk" ? (
                  <><Faces ids={r.talk.people} max={3} size="size-5" /><span className="min-w-0 flex-1 truncate">{r.talk.title}</span><span className="text-xs text-muted-foreground">{r.phase === "live" ? "Live" : `${r.talk.day} ${r.talk.time}`}</span></>
                ) : r.kind === "stance" ? (
                  <><Faces ids={r.talk.people} max={3} size="size-5" /><span className="min-w-0 flex-1 truncate">{r.talk.title} · your stance</span><span className="text-xs text-muted-foreground">by {r.talk.window}</span></>
                ) : r.kind === "built" ? (
                  <><span className="min-w-0 flex-1 truncate">{r.by.length} built on your guess · {r.handoff.title}</span></>
                ) : (
                  <><span className="min-w-0 flex-1 truncate">{r.handoff.title} ships with {r.guesses.length} guesses</span></>
                )}
              </li>
            ))}
          </ul>
          <Button size="sm" variant="outline" className="mt-3 w-full text-xs" onClick={() => { onExit?.(); navigate("/today") }}>Open Whyspace</Button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn("flex h-9 items-center gap-2 rounded-full border border-black/10 bg-white pr-3 pl-1.5 text-foreground shadow-lg", open && "ring-2 ring-foreground/20")}
        aria-label="Whyspace"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-foreground font-serif text-[13px] text-background">Y</span>
        {handoff ? <Count backed={n.backed} total={n.total} className="text-xs" /> : rows.length > 0 ? <span className="text-xs tabular-nums">{rows.length}</span> : <span className="size-1.5 rounded-full bg-muted-foreground/50" />}
      </button>
    </div>
  )
}

// The check, opened from the pill the moment work reaches a shared place.
function CheckCard({ handoff }: { handoff: Handoff }) {
  const s = useC()
  const effs = effective(handoff, s)
  const thread = threadOf(handoff.thread)
  return (
    <div className="absolute right-4 bottom-4 z-20 flex w-[440px] max-w-[calc(100vw-2rem)] flex-col rounded-xl border border-black/10 bg-white text-foreground shadow-2xl">
      <div className="flex items-center gap-2 border-b px-4 py-2.5 text-xs text-muted-foreground">
        <span className="flex size-5 items-center justify-center rounded-full bg-foreground font-serif text-[11px] text-background">Y</span>
        <span className="truncate"><span className="text-foreground">{handoff.title}</span> reached {thread?.name}</span>
        <ArrowRight className="size-3" />
        <Faces ids={handoff.to} size="size-5" />
        <WhereLabel where={handoff.where} className="ml-auto" />
      </div>
      <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
        <CheckPanel handoff={handoff} effs={effs} compact />
      </div>
    </div>
  )
}
