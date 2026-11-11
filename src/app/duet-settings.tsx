import { Settings2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { LEVELS, setLevel, setSlack, useDuetState, type Level } from "./duet-state"

// Duet settings: how your Duet treats a teammate's question, and whether it answers in Slack too
// (Pro). The same settings show in Account › Duet and open from the bottom of the Duet tab's list.
export function DuetSettings() {
  return (
    <div className="flex flex-col gap-6">
      <LevelSetting />
      <SlackSetting />
    </div>
  )
}

function LevelSetting() {
  const { level } = useDuetState()
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-sm font-medium">When teammates ask your Duet</legend>
      <RadioGroup value={level} onValueChange={(v) => setLevel(v as Level)} className="gap-2">
        {LEVELS.map((l) => (
          <label
            key={l.value}
            htmlFor={`duet-level-${l.value}`}
            className="flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 transition-colors hover:bg-muted/40 has-[[data-state=checked]]:border-foreground/40 has-[[data-state=checked]]:bg-muted/40"
          >
            <RadioGroupItem id={`duet-level-${l.value}`} value={l.value} className="mt-0.5" />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium">{l.label}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">{l.detail}</span>
            </span>
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  )
}

// The chat plan's row 1: on Pro your Duet also answers in Slack while you're away. On Free, the upgrade.
function SlackSetting() {
  const { level, slack } = useDuetState()
  const { current, setUpgradeOpen } = useStore()
  const pro = !!current && current.plan !== "Free"
  return (
    <div className="flex items-start gap-3 rounded-lg border px-3.5 py-3">
      <label htmlFor="duet-slack" className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-sm font-medium">Answer in Slack<Badge variant="secondary">Pro</Badge></span>
        <span className="text-xs leading-relaxed text-muted-foreground">While you’re away, in your DMs and linked channels.</span>
      </label>
      {pro
        ? <Switch id="duet-slack" checked={slack && level !== "off"} disabled={level === "off"} onCheckedChange={setSlack} className="mt-0.5" />
        : <Button id="duet-slack" variant="outline" size="sm" onClick={() => setUpgradeOpen(true)}>Upgrade</Button>}
    </div>
  )
}

// The setting at the bottom of the Duet tab's list: what it's set to now. The whole row opens the settings.
export function DuetSettingsRow({ className }: { className?: string }) {
  const { level } = useDuetState()
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className={cn("flex flex-col gap-0.5 rounded-lg border px-2.5 py-1.5 text-left outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring", className)}>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="min-w-0 flex-1 truncate">When teammates ask</span>
            <Settings2 className="size-3.5 shrink-0" />
          </span>
          <span className="truncate text-sm">{LEVELS.find((l) => l.value === level)?.label}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Duet settings</DialogTitle>
          <DialogDescription className="sr-only">Choose how your Duet answers teammates.</DialogDescription>
        </DialogHeader>
        <DuetSettings />
      </DialogContent>
    </Dialog>
  )
}
