import { useState } from "react"
import { LogIn as JoinIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { AuthLayout } from "@/screens/auth"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"

// Onboarding step after sign up: create your workspace (starts on Free) before
// you see the app, or accept a pending invite instead.
export function CreateWorkspaceStep() {
  const { createWorkspace, joinWorkspace } = useStore()
  const [name, setName] = useState("")
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "your-team"

  return (
    <AuthLayout>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your workspace</CardTitle>
          <CardDescription>This is where your team's projects and decisions live. It starts on the free plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createWorkspace(name.trim() || "My workspace")
              navigate("/projects")
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="ob-name">Workspace name</FieldLabel>
                <Input id="ob-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your team or company" />
                <FieldDescription>whyspace.app/{slug}</FieldDescription>
              </Field>
              <Field>
                <Button type="submit">Create workspace</Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">Or join your team</FieldSeparator>
              <Item variant="outline" size="sm">
                <ItemMedia variant="icon"><JoinIcon /></ItemMedia>
                <ItemContent>
                  <ItemTitle>Keller’s workspace</ItemTitle>
                  <ItemDescription>Invited by Christine</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button type="button" size="sm" variant="outline" onClick={() => { joinWorkspace(); navigate("/inbox") }}>Join</Button>
                </ItemActions>
              </Item>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

// Create or join, opened from the empty state or from the workspace menu.
export function WorkspaceDialog() {
  const { workspaceOpen, setWorkspaceOpen, createWorkspace, joinWorkspace } = useStore()
  const [name, setName] = useState("")
  const close = () => setWorkspaceOpen(null)

  return (
    <Dialog open={workspaceOpen !== null} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        {workspaceOpen === "create" ? (
          <>
            <DialogHeader>
              <DialogTitle>Create a workspace</DialogTitle>
              <DialogDescription>New workspaces start free. You can upgrade later in Workspace settings.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="ws-name">Workspace name</FieldLabel>
                <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your team or company" />
                <FieldDescription>Usually your company or team name.</FieldDescription>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="link" className="mr-auto px-0" onClick={() => setWorkspaceOpen("join")}>Join one instead</Button>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button
                onClick={() => {
                  createWorkspace(name.trim() || "My workspace")
                  setName("")
                  close()
                  navigate("/projects")
                }}
              >
                Create workspace
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Join a workspace</DialogTitle>
              <DialogDescription>Accept an invite, or paste a join link from a teammate.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Item variant="outline">
                <ItemMedia variant="icon"><JoinIcon /></ItemMedia>
                <ItemContent>
                  <ItemTitle>Keller’s workspace</ItemTitle>
                  <ItemDescription>Invited by Christine · 4 members</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button size="sm" onClick={() => { joinWorkspace(); close(); navigate("/inbox") }}>Accept</Button>
                </ItemActions>
              </Item>
              <Field>
                <FieldLabel htmlFor="join-link">Join link</FieldLabel>
                <Input id="join-link" placeholder="whyspace.app/join/…" />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="link" className="mr-auto px-0" onClick={() => setWorkspaceOpen("create")}>Create one instead</Button>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={() => { joinWorkspace(); close(); navigate("/inbox") }}>Join with link</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
