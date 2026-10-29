import { toast } from "sonner"
import { Check, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppShell, PageHeader } from "@/components/app/app-shell"
import { PersonAvatar } from "@/components/app/person"
import { ME, PEOPLE, PLANS } from "@/data"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

// Workspace settings: general, members, and plan and billing (new workspaces start free).
export function WorkspaceSettings({ tab }: { tab: string }) {
  const { current } = useStore()
  return (
    <AppShell crumbs={[{ label: current?.name ?? "" }, { label: "Workspace settings" }]}>
      <div className="flex flex-col gap-6 p-8">
        <PageHeader title="Workspace settings" description={`Settings for everyone in ${current?.name}.`} />
        <Tabs value={tab} onValueChange={(v) => navigate(`/settings/${v}`)}>
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="billing">Plan and billing</TabsTrigger>
          </TabsList>
        </Tabs>
        {tab === "general" && <General />}
        {tab === "members" && <Members />}
        {tab === "billing" && <Billing />}
      </div>
    </AppShell>
  )
}

function General() {
  const { current } = useStore()
  return (
    <FieldSet className="max-w-xl">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="wg-name">Workspace name</FieldLabel>
          <Input id="wg-name" defaultValue={current?.name} />
        </Field>
        <Field>
          <FieldLabel htmlFor="wg-url">Join link</FieldLabel>
          <Input id="wg-url" readOnly defaultValue="whyspace.app/join/design-studio-8f2k" className="font-mono text-xs" />
          <FieldDescription>Anyone with this link can ask to join.</FieldDescription>
        </Field>
        <Field orientation="horizontal">
          <Button onClick={() => toast("Saved")}>Save changes</Button>
          <Button variant="outline" onClick={() => toast("Leave workspace")}>Leave workspace</Button>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}

function Members() {
  const { current, setInviteOpen } = useStore()
  const people = current?.example ? Object.values(PEOPLE) : [ME]
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <span className="text-sm text-muted-foreground">{people.length} members</span>
        <Button size="sm" className="ml-auto" onClick={() => setInviteOpen(true)}><Plus />Invite people</Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-40">Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((p) => (
              <TableRow key={p.id}>
                <TableCell><div className="flex items-center gap-2"><PersonAvatar id={p.id} />{p.name}</div></TableCell>
                <TableCell className="text-muted-foreground">{p.email}</TableCell>
                <TableCell>
                  <Select defaultValue={p.id === "MC" ? "owner" : "member"}>
                    <SelectTrigger size="sm" className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function Billing() {
  const { current, setUpgradeOpen } = useStore()
  const seats = current?.example ? 5 : 1
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Current plan: {current?.plan}</CardTitle>
          <CardDescription>{current?.plan === "Free" ? "Every new workspace starts here." : "Billed monthly."}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span>Seats</span><span className="text-muted-foreground">{seats} of 5</span></div>
            <Progress value={seats * 20} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span>Projects</span><span className="text-muted-foreground">{current?.example ? 4 : 0} of 5</span></div>
            <Progress value={current?.example ? 80 : 0} />
          </div>
        </CardContent>
        {current?.plan === "Free" && (
          <CardFooter><Button onClick={() => setUpgradeOpen(true)}>Upgrade</Button></CardFooter>
        )}
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.name} className={cn(current?.plan === p.name && "border-foreground")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">{p.name}{current?.plan === p.name && <Badge variant="secondary">Current</Badge>}</CardTitle>
              <CardDescription><span className="text-2xl font-semibold text-foreground">{p.price}</span> {p.blurb.toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm">
                {p.features.map((f) => <li key={f} className="flex items-center gap-2"><Check className="size-4 text-muted-foreground" />{f}</li>)}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
          <CardDescription>{current?.plan === "Free" ? "No card on file. You'll add one when you upgrade." : "Visa ending 4242 · next bill Nov 24"}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
