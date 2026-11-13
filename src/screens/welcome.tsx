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
import { Field, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { AuthSplit, WorkspaceArt } from "@/screens/auth"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { Illo } from "@/components/brand/illo/pieces"

// Onboarding step after sign up: name your workspace (starts on Free) before you see the app, or accept a
// pending invite instead. Same layout as signing in, with the tied cards in the panel.
export function CreateWorkspaceStep() {
  const { createWorkspace, joinWorkspace } = useStore()
  const [name, setName] = useState("")
  return (
    <div className="h-svh">
      <AuthSplit art={<WorkspaceArt />}>
        <form
          className="flex w-full max-w-[340px] flex-col gap-8"
          onSubmit={(e) => {
            e.preventDefault()
            createWorkspace(name.trim() || "My workspace")
            navigate("/today")
          }}
        >
          <h1 className="type-display">Your workspace</h1>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel htmlFor="ob-name">Workspace name</FieldLabel>
              <Input id="ob-name" autoFocus autoComplete="organization" className="h-10" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Button type="submit" className="h-10">Create workspace</Button>
            <FieldSeparator className="my-0 *:data-[slot=field-separator-content]:bg-transparent">or join your team</FieldSeparator>
            <Item variant="outline" size="sm">
              <ItemMedia variant="icon"><JoinIcon /></ItemMedia>
              <ItemContent>
                <ItemTitle>Litterbox Labs</ItemTitle>
                <ItemDescription>Invited by Christine</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button type="button" size="sm" variant="outline" onClick={() => { joinWorkspace(); navigate("/today") }}>Join</Button>
              </ItemActions>
            </Item>
          </FieldGroup>
        </form>
      </AuthSplit>
    </div>
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
              <DialogDescription>Starts on the free plan.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="ws-name">Workspace name</FieldLabel>
                <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your team or company" />
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
                  navigate("/today")
                }}
              >
                Create workspace
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <Illo name="join" className="-ml-1 mb-1 h-28 self-start" />
              <DialogTitle>Join a workspace</DialogTitle>
              <DialogDescription>Accept an invite or paste a link.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Item variant="outline">
                <ItemMedia variant="icon"><JoinIcon /></ItemMedia>
                <ItemContent>
                  <ItemTitle>Litterbox Labs</ItemTitle>
                  <ItemDescription>Invited by Christine · 4 members</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button size="sm" onClick={() => { joinWorkspace(); close(); navigate("/today") }}>Accept</Button>
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
              <Button onClick={() => { joinWorkspace(); close(); navigate("/today") }}>Join with link</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
