import { AppShell, PageHeader } from "@/components/app/app-shell"
import { SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar"
import { DuetSettings } from "@/app/duet-settings"
import { useHifi } from "@/lib/hifi"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { AiTools, Notifications, Profile } from "@/screens/account"
import { Billing, General, Members } from "@/screens/settings"

// One Settings page for everything (Keller, Nov 11): your account (profile, connectors, Duet,
// notifications) and the workspace you're in. Connectors are yours, so they reach every workspace
// and project. Its sections sit in the rail's side panel, the same way a project's pages do.
// Opens from Settings in the account menu. Archived Designs A and C keep the old split.
const SECTIONS: { group: "account" | "workspace"; id: string; label: string }[] = [
  { group: "account", id: "profile", label: "Profile" },
  { group: "account", id: "connectors", label: "Connectors" },
  { group: "account", id: "duet", label: "Duet" },
  { group: "account", id: "notifications", label: "Notifications" },
  { group: "workspace", id: "workspace", label: "General" },
  { group: "workspace", id: "members", label: "Members" },
  { group: "workspace", id: "billing", label: "Plan and billing" },
]

// Old links (/account/ai-tools, /settings/general) land on the matching section.
const ALIAS: Record<string, string> = { "ai-tools": "connectors", general: "workspace" }
const sectionOf = (tab?: string) => SECTIONS.find((s) => s.id === (ALIAS[tab ?? ""] ?? tab)) ?? SECTIONS[0]
export const settingsPath = (tab?: string) => `/settings/${sectionOf(tab).id}`

// The side panel beside the rail while Settings is open.
export function SettingsPanel({ route }: { route: string[] }) {
  const { current } = useStore()
  const hifi = useHifi()
  const open = sectionOf(route[1]).id
  const groups = [["account", "Account"], ["workspace", current?.name ?? "Workspace"]] as const
  return (
    <div className="p-2">
      <div className={cn("mb-3 flex h-9 items-center pr-1", hifi ? "pl-3" : "pl-2")}>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">Settings</span>
      </div>
      <SidebarMenuSub className="mx-0 mr-0 translate-x-0 border-l-0 px-0 pr-0">
        {groups.map(([g, label], i) => (
          <div key={g} className="contents">
            <li className={cn("flex h-7 items-center truncate pr-1 text-xs text-muted-foreground", hifi ? "pl-3" : "pl-2", i > 0 && "mt-4")}>{label}</li>
            {SECTIONS.filter((s) => s.group === g).map((s) => (
              <SidebarMenuSubItem key={s.id}>
                <SidebarMenuSubButton asChild isActive={s.id === open}>
                  <a href={`#/settings/${s.id}`}>{s.label}</a>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </div>
        ))}
      </SidebarMenuSub>
    </div>
  )
}

export function SettingsPage({ tab, none }: { tab?: string; none?: boolean }) {
  const section = sectionOf(tab)
  return (
    <AppShell crumbs={[{ label: "Settings" }, { label: section.label }]}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 sm:p-8">
        <PageHeader title={section.label} />
        {section.id === "profile" && <Profile />}
        {section.id === "connectors" && <AiTools none={none} />}
        {section.id === "duet" && <DuetSettings />}
        {section.id === "notifications" && <Notifications />}
        {section.id === "workspace" && <General />}
        {section.id === "members" && <Members />}
        {section.id === "billing" && <Billing />}
      </div>
    </AppShell>
  )
}
