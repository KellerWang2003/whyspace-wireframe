import { LoadingRibbon, ThinkingLoop } from "@/components/brand/ribbons"
import { SpotArt } from "@/components/brand/spot-art"
import { ILLO, ILLO_COLORS, ILLO_RULES, Illo, type IlloName } from "@/components/brand/illo/pieces"
import { Group, Row, Specimen } from "./kit"

// Illustrations: the set from components/brand/illo/pieces.tsx (Keller, Nov 11). A person only when
// the moment is about you, your Duet or resting; everything else is just the ribbon, drawn in code,
// and moves in its own way. Shown here as they look in the app; the ribbon pieces loop.

const names = Object.keys(ILLO) as IlloName[]

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
      <Group title="With a person" note="Painted person with empty hands, ribbon drawn in code from the hand. Still.">
        <Row className="items-end">
          {names.filter((n) => ILLO[n].kind === "person").map((n) => (
            <Specimen key={n} name={ILLO[n].label} note={ILLO[n].where}><Illo name={n} force className="h-32" /></Specimen>
          ))}
        </Row>
      </Group>
      <Group title="Just the ribbon" note="Drawn in code. Each one plays once when it appears, then holds.">
        <Row className="items-end">
          {names.filter((n) => ILLO[n].kind === "ribbon").map((n) => (
            <Specimen key={n} name={ILLO[n].label} note={ILLO[n].where}><Illo name={n} force motion="loop" className="h-28 max-w-72" /></Specimen>
          ))}
        </Row>
      </Group>
      <Group title="Waiting" note="Loops for as long as it takes">
        <Row className="items-end">
          <Specimen name="Loading" note="Opening Whyspace"><LoadingRibbon className="w-56" /></Specimen>
          <Specimen name="Duet is working" note="While your Duet thinks"><ThinkingLoop className="h-12 w-24" /></Specimen>
        </Row>
      </Group>
      <Group title="Kept as it is">
        <Specimen name="Invite people" note="Invite dialog"><SpotArt name="invite" force className="h-32" /></Specimen>
      </Group>
    </>
  )
}
