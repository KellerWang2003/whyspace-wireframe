import { useState, type ReactNode } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrokenThread, LoadingRibbon, ThinkingLoop } from "@/components/brand/ribbons"
import { SetArt } from "@/components/brand/set-art"
import { ACTIONS, IDEA, MOTION, PAINT, RULES, SKIN, SPOTS, WASH, illustrationPrompt, type Spot } from "@/components/brand/illustration-style"
import { cn } from "@/lib/utils"
import { Code, Group, Specimen } from "./kit"

// The whole illustration system: rules beside the pieces they come from, the motion, the prompt,
// and every spot in the app. Everything reads from components/brand/illustration-style.ts.

function Rules({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex max-w-sm flex-col gap-1.5 text-sm">
      {items.map((r) => <li key={r} className="flex gap-2"><span className="text-muted-foreground">–</span><span>{r}</span></li>)}
    </ul>
  )
}

function Beside({ art, children }: { art: ReactNode; children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-x-12 gap-y-6">{art}{children}</div>
}

function CopyButton({ text, label = "Copy prompt" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  const copy = () => {
    try { void navigator.clipboard?.writeText(text) } catch { /* clipboard blocked: the prompt is on screen */ }
    setDone(true)
    setTimeout(() => setDone(false), 1500)
  }
  return <Button size="sm" variant="outline" onClick={copy}>{done ? <Check /> : <Copy />}{done ? "Copied" : label}</Button>
}

function Swatch({ name, hex, use }: { name: string; hex: string; use?: string }) {
  return (
    <Specimen name={name} note={use ? <>{hex}<br />{use}</> : hex}>
      <span className="block size-12 rounded-[14px]" style={{ background: hex }} />
    </Specimen>
  )
}

// The piece for a spot: a painting, or the code-drawn motion, or nothing.
function SpotPiece({ spot, className }: { spot: Spot; className?: string }) {
  if (spot.id === "loading") return <div className={cn("grid place-items-center rounded-xl bg-[#EEF4E4]", className)}><LoadingRibbon className="h-full w-full" /></div>
  if (spot.id === "thinking") return <div className={cn("grid place-items-center rounded-xl bg-[#FBEFF1]", className)}><ThinkingLoop className="h-24 w-44" /></div>
  if (spot.id === "lost-connection") return <div className={cn("grid place-items-center rounded-xl bg-[#EEF4E4]", className)}><BrokenThread className="h-10 w-4/5" /></div>
  if (spot.source === "plain") return <div className={cn("grid place-items-center rounded-xl border border-dashed", className)}><span className="type-caption text-muted-foreground">Toast only</span></div>
  return <div className={cn("grid place-items-center", className)}><SetArt id={spot.id} force alt={spot.label} className="max-h-full max-w-full" /></div>
}

const byAction = (verb: string) => SPOTS.find((s) => s.action === verb && s.source !== "plain")
const SOURCE = { keller: "Your set", new: "New", code: "Code", plain: "Plain" } as const

export function IllustrationStyle() {
  const template = illustrationPrompt()
  return (
    <>
      <Group title="Idea">
        <Beside art={<SetArt id="welcome" force className="h-36" />}>
          <p className="type-title max-w-xs">{IDEA}</p>
        </Beside>
      </Group>

      <Group title="Ribbon actions" note="Every piece is one">
        <div className="grid max-w-4xl grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {ACTIONS.map((a) => {
            const s = byAction(a.verb)
            return (
              <figure key={a.verb} className="flex flex-col gap-2">
                {s ? <SpotPiece spot={s} className="aspect-square w-full overflow-hidden" /> : <div className="aspect-square" />}
                <figcaption className="flex flex-col"><span className="type-label">{a.verb}</span><span className="type-caption text-muted-foreground">{a.means}</span></figcaption>
              </figure>
            )
          })}
        </div>
      </Group>

      <Group title="Paint">
        <div className="flex flex-col gap-8">
          <Rules items={RULES.paint} />
          <div className="flex flex-wrap gap-x-6 gap-y-6">{PAINT.map((c) => <Swatch key={c.name} {...c} />)}</div>
          <div className="flex flex-wrap gap-x-6 gap-y-6">
            {SKIN.map((c) => <Swatch key={c.name} name={`Skin ${c.name.toLowerCase()}`} hex={c.hex} />)}
            {WASH.map((c) => <Swatch key={c.name} name={c.name} hex={c.hex} />)}
          </div>
        </div>
      </Group>

      <Group title="Ribbon">
        <Beside art={<SetArt id="create-project" force className="h-36" />}><Rules items={RULES.ribbon} /></Beside>
      </Group>

      <Group title="Hands">
        <Beside art={<div className="flex gap-4"><SetArt id="invite" force className="h-32" /><SetArt id="join" force className="h-32" /></div>}><Rules items={RULES.hands} /></Beside>
      </Group>

      <Group title="Figures">
        <Beside art={
          <div className="flex items-end gap-6">
            <Specimen name="Above"><SetArt id="no-chats" force className="h-28" /></Specimen>
            <Specimen name="Behind"><SetArt id="no-access" force className="h-28 rounded-xl" /></Specimen>
            <Specimen name="Side"><SetArt id="helper" force className="h-28" /></Specimen>
          </div>
        }><Rules items={RULES.figures} /></Beside>
      </Group>

      <Group title="Objects">
        <Beside art={<div className="flex items-center gap-6"><SetArt id="tools" force className="h-14" /><SetArt id="saved" force className="h-28 rounded-xl" /></div>}><Rules items={RULES.objects} /></Beside>
      </Group>

      <Group title="Composition"><Rules items={RULES.composition} /></Group>

      <Group title="Frame">
        <div className="flex flex-wrap items-end gap-10">
          <Specimen name="Float"><SetArt id="no-projects" force className="h-28" /></Specimen>
          <Specimen name="Tile"><SetArt id="went-wrong" force className="h-28 rounded-xl" /></Specimen>
          <Specimen name="Inline"><span className="flex items-center gap-2 text-sm"><ThinkingLoop className="h-6 w-11" /><span className="font-medium">Your Duet</span></span></Specimen>
          <Rules items={RULES.frame} />
        </div>
      </Group>

      <Group title="Motion">
        <div className="flex flex-col gap-8">
          <Rules items={RULES.motion} />
          <div className="grid max-w-4xl gap-x-6 gap-y-4 text-sm sm:grid-cols-[160px_100px_minmax(0,1fr)_100px]">
            {MOTION.map((m) => (
              <div key={m.state} className="contents">
                <span className="type-label">{m.state}</span>
                <span>{m.action}</span>
                <span className="text-muted-foreground">{m.how}</span>
                <Code className="pt-0.5">{m.time}</Code>
              </div>
            ))}
          </div>
        </div>
      </Group>

      <Group title="Prompt" note="Fill the slots. Each new spot below has its own">
        <div className="flex max-w-3xl flex-col items-start gap-3">
          <Code className="block whitespace-pre-wrap rounded-xl bg-muted/60 p-4 text-foreground">{template}</Code>
          <CopyButton text={template} />
        </div>
      </Group>

      <Group title="Every spot" note={`${SPOTS.length} spots`}>
        <div className="grid max-w-5xl grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {SPOTS.map((s) => (
            <figure key={s.id} className="flex flex-col gap-3">
              <SpotPiece spot={s} className="aspect-square w-full overflow-hidden" />
              <figcaption className="flex flex-col gap-2">
                <span className="flex flex-col">
                  <span className="type-label">{s.label}</span>
                  <span className="type-caption text-muted-foreground">{s.where}</span>
                  <span className="type-caption text-muted-foreground">{s.action} · {SOURCE[s.source]}</span>
                </span>
                {s.source === "new" && s.subject && <CopyButton text={illustrationPrompt(s.action, s.subject, s.colors, s.framing, s.wash)} label="Prompt" />}
              </figcaption>
            </figure>
          ))}
        </div>
      </Group>
    </>
  )
}

