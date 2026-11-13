import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { WhyspaceIcon, WhyspaceLockup, WhyspaceMark, WhyspaceThread } from "@/components/brand/logo"
import { Group, Row, Specimen } from "./kit"

// Logo (#/design-system/logo): the final mark (Nov 12 2026), from components/brand/logo.tsx, the one
// component every place in the app draws it with.

const USES: [string, string][] = [
  ["Rail and overlays", "the bare mark in forest"],
  ["Among other apps", "the app icon tile"],
  ["Sign-in and brand pages", "the stacked lockup, app icon over the name"],
  ["Site header and footer", "the lockup beside the name"],
  ["Launch and landing", "the hand-written appear; the run-on thread in the landing hero"],
]

// The appear at 0.3s steps of its 1.5s, for the stills row (and the Figma plate, where motion can't play).
const STILLS = [0.2, 0.4, 0.6, 0.8, 1]

export function LogoSection() {
  // Replay remounts the marks so they start over together.
  const [run, setRun] = useState(0)
  return (
    <>
      <Group title="Mark" note="The W in one stroke">
        <Row className="items-center">
          <Specimen name="96px"><WhyspaceMark className="w-24" /></Specimen>
          <Specimen name="48px"><WhyspaceMark className="w-12" /></Specimen>
          <Specimen name="22px · rail"><WhyspaceMark className="w-[22px]" /></Specimen>
        </Row>
      </Group>
      <Group title="App icon" note="Dock, browser tab, Slack, connectors">
        <Row className="items-end">
          <Specimen name="92px"><WhyspaceIcon className="size-[92px]" /></Specimen>
          <Specimen name="34px"><WhyspaceIcon className="size-[34px]" /></Specimen>
          <Specimen name="16px · favicon"><WhyspaceIcon className="size-4" /></Specimen>
        </Row>
      </Group>
      <Group title="Lockup" note="App icon and name. Stacked is the main one">
        <Row className="items-end">
          <Specimen name="Stacked"><WhyspaceLockup className="w-[170px]" /></Specimen>
          <Specimen name="Beside the name"><WhyspaceLockup variant="beside" className="w-[180px]" /></Specimen>
        </Row>
      </Group>
      <Group title="Motion" note="Write, hold, unwrite">
        <Row className="items-end">
          <Specimen name="Mark"><WhyspaceMark key={`m${run}`} appear loop className="w-24" /></Specimen>
          <Specimen name="App icon"><WhyspaceIcon key={`i${run}`} appear loop className="size-[92px]" /></Specimen>
          <Specimen name="Run-on thread · landing only"><WhyspaceThread key={`t${run}`} loop delay={0} className="w-[300px]" /></Specimen>
          <button type="button" onClick={() => setRun((r) => r + 1)} className="flex items-center gap-1.5 self-center type-caption text-muted-foreground hover:text-foreground">
            <RotateCcw className="size-3.5" />Replay
          </button>
        </Row>
      </Group>
      <Group title="Stills" note="The appear, every 0.3s">
        <Row className="items-end gap-x-8">
          {STILLS.map((k) => <Specimen key={k} name={`${(k * 1.5).toFixed(1)}s`}><WhyspaceMark still={k} title={null} className="w-20" /></Specimen>)}
        </Row>
      </Group>
      <Group title="Where it goes">
        <ul className="flex flex-col gap-1.5 type-body">
          {USES.map(([where, what]) => <li key={where}>{where}: {what}.</li>)}
        </ul>
      </Group>
    </>
  )
}
