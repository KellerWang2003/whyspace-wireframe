import { useEffect, useState } from "react"
import { toast } from "sonner"
import { PersonAvatar } from "@/components/app/person"
import { ToolLogo } from "@/components/app/tool-logo"
import { ConnectDialog, ManageDialog } from "@/app/connect/connect-dialog"
import { PROVIDERS, isProvider, takeFresh, useConnections, type ProviderId } from "@/app/connect/connections"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldSeparator, FieldSet, FieldLegend } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppShell, PageHeader } from "@/components/app/app-shell"
import { AI_TOOLS, ME } from "@/data"
import { navigate } from "@/lib/router"
import { DESIGN } from "@/lib/design"
import { DuetTab } from "@/design-c/duet"
import { DuetSettings } from "@/app/duet-settings"
import { Illo } from "@/components/brand/illo/pieces"

// The profile menu's pages: Profile, Duet (main design and C), My AI tools, Notifications.
export function Account({ tab, none }: { tab: string; none?: boolean }) {
  return (
    <AppShell crumbs={[{ label: "Account" }]}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 sm:p-8">
        <PageHeader title="Account" />
        <Tabs value={tab} onValueChange={(v) => navigate(`/account/${v}`)}>
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            {DESIGN !== "a" && <TabsTrigger value="duet">Duet</TabsTrigger>}
            <TabsTrigger value="ai-tools">My AI tools</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
        </Tabs>
        {tab === "profile" && <Profile />}
        {tab === "duet" && DESIGN === "c" && <DuetTab />}
        {tab === "duet" && DESIGN === "b" && <DuetSettings />}
        {tab === "ai-tools" && <AiTools none={none} />}
        {tab === "notifications" && <Notifications />}
      </div>
    </AppShell>
  )
}

export function Profile() {
  return (
    <FieldSet className="max-w-xl">
      <FieldGroup>
        <div className="flex items-center gap-4">
          <PersonAvatar id={ME.id} className="size-14 [&_[data-slot=avatar-fallback]]:text-base" />
          <Button variant="outline" size="sm">Change photo</Button>
        </div>
        <Field>
          <FieldLabel htmlFor="pf-name">Full name</FieldLabel>
          <Input id="pf-name" defaultValue={ME.name} />
        </Field>
        <Field>
          <FieldLabel htmlFor="pf-email">Email</FieldLabel>
          <Input id="pf-email" defaultValue={ME.email} />
        </Field>
        <Field orientation="horizontal">
          <Button onClick={() => toast("Saved")}>Save changes</Button>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}

// A new account has nothing connected yet: the tools strung on one ribbon sit above the list.
// My AI tools. Claude and ChatGPT go through the real connect flow (src/app/connect); the others are mock rows.
export function AiTools({ none }: { none?: boolean }) {
  const conns = useConnections()
  const [connecting, setConnecting] = useState<ProviderId | null>(null)
  const [managing, setManaging] = useState<ProviderId | null>(null)
  // Back from the tool's tab: say once that it connected.
  useEffect(() => { const id = takeFresh(); if (id) toast(`${PROVIDERS[id].name} connected`) }, [])
  const tools = AI_TOOLS.map((t) => none ? { ...t, connected: false } : isProvider(t.id) ? { ...t, connected: !!conns[t.id] } : t)
  return (
    <div className="max-w-2xl space-y-4">
      {tools.every((t) => !t.connected) && <Illo name="connect-tools" className="mx-auto my-4 h-24" />}
      <ItemGroup className="gap-3">
        {tools.map((t) => (
          <Item key={t.id} variant="outline">
            <ItemMedia variant="icon"><ToolLogo tool={t.name} className="size-4" /></ItemMedia>
            <ItemContent>
              <ItemTitle>{t.name}</ItemTitle>
              {t.connected && <ItemDescription>Connected</ItemDescription>}
            </ItemContent>
            <ItemActions>
              <Button size="sm" variant={t.connected ? "outline" : "default"} onClick={() => {
                if (isProvider(t.id)) return t.connected ? setManaging(t.id) : setConnecting(t.id)
                toast(t.connected ? "Manage" : `Connect ${t.name}`)
              }}>
                {t.connected ? "Manage" : "Connect"}
              </Button>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
      <ConnectDialog id={connecting} onOpenChange={(o) => !o && setConnecting(null)} />
      <ManageDialog id={managing} onOpenChange={(o) => !o && setManaging(null)} />
    </div>
  )
}

export function Notifications() {
  const rows = [
    ["Decisions to confirm", "Your AI tool logged one", true],
    ["Updates to make", "A decision changed your work", true],
    ["Conflicts", "Work breaks a decision", true],
    ["Meeting invites", "Someone invites you", true],
    ["Mentions", "Someone mentions you", false],
  ] as const
  return (
    <FieldSet className="max-w-2xl">
      <FieldLegend>Email me about</FieldLegend>
      <FieldGroup>
        {rows.map(([label, desc, on], i) => (
          <div key={label} className="space-y-6">
            {i > 0 && <FieldSeparator />}
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor={`n-${i}`}>{label}</FieldLabel>
                <FieldDescription>{desc}</FieldDescription>
              </FieldContent>
              <Switch id={`n-${i}`} defaultChecked={on} />
            </Field>
          </div>
        ))}
      </FieldGroup>
    </FieldSet>
  )
}
