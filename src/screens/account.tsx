import { toast } from "sonner"
import { Bot } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldSeparator, FieldSet, FieldLegend } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppShell, PageHeader } from "@/components/app/app-shell"
import { AI_TOOLS, ME } from "@/data"
import { navigate } from "@/lib/router"

// The profile menu's pages: Profile, My AI tools, Notifications.
export function Account({ tab }: { tab: string }) {
  return (
    <AppShell crumbs={[{ label: "Account" }]}>
      <div className="flex flex-col gap-6 p-8">
        <PageHeader title="Account" description="Settings that follow you across workspaces." />
        <Tabs value={tab} onValueChange={(v) => navigate(`/account/${v}`)}>
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="ai-tools">My AI tools</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
        </Tabs>
        {tab === "profile" && <Profile />}
        {tab === "ai-tools" && <AiTools />}
        {tab === "notifications" && <Notifications />}
      </div>
    </AppShell>
  )
}

function Profile() {
  return (
    <FieldSet className="max-w-xl">
      <FieldGroup>
        <div className="flex items-center gap-4">
          <Avatar className="size-14"><AvatarFallback>MC</AvatarFallback></Avatar>
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

function AiTools() {
  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-muted-foreground">Connected tools log decisions as inferred. Nothing counts until a person confirms it.</p>
      <ItemGroup className="gap-3">
        {AI_TOOLS.map((t) => (
          <Item key={t.id} variant="outline">
            <ItemMedia variant="icon"><Bot /></ItemMedia>
            <ItemContent>
              <ItemTitle>{t.name}</ItemTitle>
              <ItemDescription>{t.desc}{t.connected && " · Connected"}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size="sm" variant={t.connected ? "outline" : "default"} onClick={() => toast(t.connected ? "Manage" : `Connect ${t.name}`)}>
                {t.connected ? "Manage" : "Connect"}
              </Button>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </div>
  )
}

function Notifications() {
  const rows = [
    ["Decisions to review", "When your AI tool logs a decision you need to confirm.", true],
    ["Changes for you", "When a decision you build on changes.", true],
    ["Misalignment alerts", "When someone's work may conflict with a decision.", true],
    ["Live session invites", "When someone asks you to join a session.", true],
    ["Mentions", "When someone mentions you.", false],
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
