import { useEffect, useState } from "react"
import { Bug, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Kbd } from "@/components/ui/kbd"
import { navigate, useRoute } from "@/lib/router"
import { useStore } from "@/lib/store"
import { STAGE, STAGES, setStage } from "@/lib/stage"
import { cn } from "@/lib/utils"

// Prototype helper only, not part of the app: a debug drawer on the left edge for reviewing the flow.
const SCREENS: [string, [string, string][]][] = [
  ["Getting in", [["Sign up", "/signup"], ["Log in", "/login"], ["Create workspace", "/new"]]],
  ["Workspace", [["All projects", "/projects"], ["Inbox", "/inbox"], ["My tasks", "/my-tasks"]]],
  ["Project", [["Overview", "/p/whiskr/overview"], ["Tasks", "/p/whiskr/tasks"], ["Decisions", "/p/whiskr/decisions"], ["Decision detail", "/p/whiskr/decisions/nored"], ["Meetings", "/p/whiskr/sessions"], ["Live canvas", "/p/whiskr/sessions/s1"], ["Project settings", "/p/whiskr/settings/general"]]],
  ["Playground", [["Decision display states", "/playground/decisions/states"], ["Section map & outline", "/playground/whiskr/canvas"], ["Earlier decision views", "/playground/whiskr/board"]]],
  ["Settings", [["Workspace settings", "/settings/general"], ["Plan and billing", "/settings/billing"], ["Profile", "/account/profile"], ["My AI tools", "/account/ai-tools"], ["Notifications", "/account/notifications"]]],
]

const OPEN_KEY = "debug-panel-open"

function readOpen() {
  try {
    return localStorage.getItem(OPEN_KEY) === "1"
  } catch {
    return false
  }
}

function typing(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 border-b px-3 py-3 last:border-b-0">
      <h3 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

export function FlowMenu({ desktop, onDesktop }: { desktop: boolean; onDesktop: (on: boolean) => void }) {
  const { joinWorkspace, startFresh, setUpgradeOpen } = useStore()
  const [open, setOpenNow] = useState(readOpen)
  const here = "/" + useRoute().join("/")

  function setOpen(on: boolean) {
    setOpenNow(on)
    try {
      localStorage.setItem(OPEN_KEY, on ? "1" : "0")
    } catch {
      // Storage blocked: the panel just won't remember.
    }
  }

  // ` toggles the panel, Escape closes it. Skipped while typing so it never eats a keystroke.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === "`") {
        e.preventDefault()
        setOpen(!open)
      } else if (e.key === "Escape" && open) {
        setOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  function go(path: string) {
    if (path === "/new") {
      startFresh()
      navigate("/onboarding")
      return
    }
    onDesktop(false)
    if (!["/signup", "/login"].includes(path)) joinWorkspace()
    navigate(path)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Open debug panel (`)"
        className="fixed top-1/2 left-0 z-[60] flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-r-md border border-l-0 bg-background px-1 py-2.5 text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bug className="size-3.5" />
        <span className="text-[10px] font-medium tracking-wide [writing-mode:vertical-rl]">Debug · {STAGE}</span>
      </button>
    )
  }

  return (
    <aside
      aria-label="Prototype debug panel"
      className="fixed inset-y-0 left-0 z-[60] flex w-72 flex-col border-r bg-background text-sm shadow-xl"
    >
      <header className="flex items-start gap-2 border-b px-3 py-2.5">
        <Bug className="mt-0.5 size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium leading-tight">Debug</div>
          <div className="text-[11px] text-muted-foreground">Prototype tool · not part of the app</div>
        </div>
        <Button variant="ghost" size="icon-sm" className="-mr-1" onClick={() => setOpen(false)} aria-label="Close debug panel">
          <ChevronLeft />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section title="Whiskr stage">
          <Select value={String(STAGE)} onValueChange={(v) => setStage(Number(v))}>
            <SelectTrigger size="sm" className="w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[70]">
              {STAGES.map((stage, i) => (
                <SelectItem key={stage.name} value={String(i + 1)} className="text-xs">
                  {i + 1}. {stage.name} · {stage.date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] leading-snug text-muted-foreground">{STAGES[STAGE - 1].what}</p>
        </Section>

        <Section title="View">
          <Label className="flex items-center justify-between gap-2 text-xs font-normal">
            Outside the app (desktop overlay)
            <Switch checked={desktop} onCheckedChange={onDesktop} />
          </Label>
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setUpgradeOpen(true)}>
            Open upgrade dialog
          </Button>
        </Section>

        <Section title="Jump to screen">
          <div className="space-y-3">
            {SCREENS.map(([group, items]) => (
              <div key={group}>
                <div className="mb-0.5 px-1.5 text-[11px] text-muted-foreground">{group}</div>
                <ul>
                  {items.map(([label, path]) => {
                    const current = !desktop && here === path
                    return (
                      <li key={path}>
                        <button
                          type="button"
                          onClick={() => go(path)}
                          aria-current={current ? "page" : undefined}
                          className={cn(
                            "w-full rounded-sm px-1.5 py-1 text-left text-xs transition-colors hover:bg-muted",
                            current && "bg-muted font-medium",
                          )}
                        >
                          {label}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <footer className="flex items-center gap-1.5 border-t px-3 py-2 text-[11px] text-muted-foreground">
        <Kbd>`</Kbd> toggle · <Kbd>Esc</Kbd> close
      </footer>
    </aside>
  )
}
