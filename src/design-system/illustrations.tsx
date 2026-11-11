import type { ReactNode } from "react"
import { LoadingRibbon, ThinkingLoop } from "@/components/brand/ribbons"
import { SpotArt } from "@/components/brand/spot-art"
import { ILLO, ILLO_COLORS, ILLO_RULES, Illo, type IlloName } from "@/components/brand/illo/pieces"
import { Group, Row, Specimen } from "./kit"

// Illustrations: the set from components/brand/illo/pieces.tsx (Keller, Nov 11). Grouped by the moment
// they belong to, each in a tile of one size so the set reads as one family. A person only when the
// moment is about you, your Duet or resting; everything else is just the ribbon, drawn in code.

// One piece in a same-size paper tile, fitted inside it, with its name and where it shows.
function Tile({ label, where, children }: { label: string; where: string; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col gap-2.5">
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-background p-5 ring-1 ring-foreground/[0.07]">
        {children}
      </div>
      <figcaption className="flex flex-col gap-0.5">
        <span className="type-label">{label}</span>
        <span className="type-caption text-muted-foreground">{where}</span>
      </figcaption>
    </figure>
  )
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3">{children}</div>
}

function Piece({ name }: { name: IlloName }) {
  return (
    <Tile label={ILLO[name].label} where={ILLO[name].where}>
      <Illo name={name} force motion="loop" className="h-full w-full" />
    </Tile>
  )
}

// The moments, in the order someone meets them.
const MOMENTS: { title: string; pieces: (IlloName | "invite")[] }[] = [
  { title: "First steps", pieces: ["welcome", "create-workspace", "join", "meet-duet", "connect-tools", "invite"] },
  { title: "Empty pages", pieces: ["nothing-today", "caught-up", "no-chats", "no-projects", "new-project"] },
  { title: "Something's wrong", pieces: ["went-wrong", "no-access", "lost-connection"] },
]

export function IllustrationsSection() {
  return (
    <>
      <Group title="Rules">
        <ul className="flex max-w-xl flex-col gap-1.5 text-sm">
          {ILLO_RULES.map((r) => <li key={r} className="flex gap-2"><span className="text-muted-foreground">–</span><span>{r}</span></li>)}
        </ul>
      </Group>
      <Group title="Color" note="One meaning per color">
        <Row>
          {ILLO_COLORS.map((c) => (
            <Specimen key={c.name} name={c.name} note={c.use}>
              <span className="block size-12 rounded-[14px]" style={{ background: c.hex }} />
            </Specimen>
          ))}
        </Row>
      </Group>
      {MOMENTS.map((m) => (
        <Group key={m.title} title={m.title}>
          <Grid>
            {m.pieces.map((n) => n === "invite"
              ? <Tile key={n} label="Invite people" where="Invite dialog"><SpotArt name="invite" force className="h-full w-full object-contain" /></Tile>
              : <Piece key={n} name={n} />)}
          </Grid>
        </Group>
      ))}
      <Group title="Waiting">
        <Grid>
          <Tile label="Loading" where="Opening Whyspace"><LoadingRibbon className="w-full" /></Tile>
          <Tile label="Duet is working" where="While your Duet thinks"><ThinkingLoop className="h-16 w-32" /></Tile>
        </Grid>
      </Group>
    </>
  )
}
