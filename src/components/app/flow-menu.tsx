import { Route } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { STAGE, STAGES, setStage } from "@/lib/stage"

// Prototype helper only, not part of the app: jump to any screen while reviewing the flow.
const SCREENS: [string, [string, string][]][] = [
  ["Getting in", [["Sign up", "/signup"], ["Log in", "/login"], ["Create workspace", "/new"]]],
  ["Workspace", [["All projects", "/projects"], ["Inbox", "/inbox"], ["My tasks", "/my-tasks"]]],
  ["Project", [["Overview", "/p/whiskr/overview"], ["Tasks", "/p/whiskr/tasks"], ["Decisions", "/p/whiskr/decisions"], ["Decision detail", "/p/whiskr/decisions/nored"], ["Meetings", "/p/whiskr/sessions"], ["Live canvas", "/p/whiskr/sessions/s1"], ["Project settings", "/p/whiskr/settings/general"]]],
  ["Playground", [["Decision display states", "/playground/decisions/states"], ["Section map & outline", "/playground/whiskr/canvas"], ["Earlier decision views", "/playground/whiskr/board"]]],
  ["Settings", [["Workspace settings", "/settings/general"], ["Plan and billing", "/settings/billing"], ["Profile", "/account/profile"], ["My AI tools", "/account/ai-tools"], ["Notifications", "/account/notifications"]]],
]

export function FlowMenu({ desktop, onDesktop }: { desktop: boolean; onDesktop: (on: boolean) => void }) {
  const { joinWorkspace, startFresh, setUpgradeOpen } = useStore()
  return (
    <div className="fixed bottom-20 left-4 z-50 flex flex-col items-start gap-2">
      <div className="w-64 space-y-1.5 rounded-md border bg-background p-2.5 shadow-md">
        <div className="text-xs font-medium">Whiskr stage</div>
        <Select value={String(STAGE)} onValueChange={(v) => setStage(Number(v))}>
          <SelectTrigger size="sm" className="w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAGES.map((stage, i) => (
              <SelectItem key={stage.name} value={String(i + 1)} className="text-xs">
                {i + 1}. {stage.name} · {stage.date}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] leading-snug text-muted-foreground">{STAGES[STAGE - 1].what}</p>
      </div>
      <Label className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-xs font-normal shadow-md">
        <Switch checked={desktop} onCheckedChange={onDesktop} />
        Outside the app (desktop overlay)
      </Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="shadow-md"><Route />Screens</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="max-h-[80vh] w-60 overflow-y-auto">
          {SCREENS.map(([group, items], gi) => (
            <div key={group}>
              {gi > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-muted-foreground">{group}</DropdownMenuLabel>
              {items.map(([label, path]) => (
                <DropdownMenuItem
                  key={path}
                  onSelect={() => {
                    if (path === "/new") {
                      startFresh()
                      navigate("/onboarding")
                      return
                    }
                    onDesktop(false)
                    if (!["/signup", "/login"].includes(path)) joinWorkspace()
                    navigate(path)
                  }}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </div>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setUpgradeOpen(true)}>Upgrade dialog</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
