import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { WhyspaceIcon, WhyspaceLockup, WhyspaceMark } from "@/components/brand/logo"
import { Group, Row, Specimen } from "./kit"

// Logo (#/design-system/logo): the final mark (Nov 12 2026), from components/brand/logo.tsx, the one
// component every place in the app draws it with.

const USES: [string, string][] = [
  ["Rail and overlays", "the bare mark in forest"],
  ["Among other apps", "the app icon tile"],
  ["Sign-in and brand pages", "the stacked lockup"],
  ["Launch and landing", "the hand-written appear"],
]

export function LogoSection() {
  // Replay remounts the marks so they write themselves again.
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
      <Group title="Lockup" note="Stacked is the main one; beside the name is secondary">
        <Row className="items-end">
          <Specimen name="Stacked"><WhyspaceLockup className="w-[170px]" /></Specimen>
          <Specimen name="Beside the name"><WhyspaceLockup variant="beside" className="w-[180px]" /></Specimen>
        </Row>
      </Group>
      <Group title="Appear" note="Written by hand, then held">
        <div className="flex items-center gap-10">
          <WhyspaceMark key={`m${run}`} appear className="w-24" />
          <WhyspaceIcon key={`i${run}`} appear className="size-[92px]" />
          <button type="button" onClick={() => setRun((r) => r + 1)} className="flex items-center gap-1.5 type-caption text-muted-foreground hover:text-foreground">
            <RotateCcw className="size-3.5" />Replay
          </button>
        </div>
      </Group>
      <Group title="Where it goes">
        <ul className="flex flex-col gap-1.5 type-body">
          {USES.map(([where, what]) => <li key={where}>{where}: {what}.</li>)}
        </ul>
      </Group>
    </>
  )
}
