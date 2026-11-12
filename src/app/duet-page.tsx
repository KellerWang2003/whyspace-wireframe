import { useEffect, useRef, useState } from "react"
import { MessageCircleCheck, MoreHorizontal, Plus, Smile } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar"
import { AppShell } from "@/components/app/app-shell"
import { Composer, Greeting, Jumpstarts, Messages } from "@/components/app/ask-whyspace"
import { useAskEvents, useConversation, type Conversation } from "@/components/app/conversation"
import { PersonAvatar } from "@/components/app/person"
import { ME } from "@/data"
import { useHifi } from "@/lib/hifi"
import { navigate, useRoute } from "@/lib/router"
import { cn } from "@/lib/utils"
import { DuetFaceMaker } from "./duet-avatar"
import { PIGMENT_HEX, useDuetFace } from "./duet-face"
import { DuetDecided } from "./duet-lines"
import { newChat, openChat, titleOf, useDuetState } from "./duet-state"
import { Illo } from "@/components/brand/illo/pieces"

// The Duet tab, a tab of its own: your chats with your Duet, listed beside the rail with Decided for
// you (#/duet/decided) pinned on top. The settings sit at the bottom of the list. Questions your Duet
// couldn't answer wait in Today, the one place for what needs you, so #/duet/waiting goes there.
export function DuetPage() {
  const [, view] = useRoute()
  const convo = useConversation()
  // A question asked from a decision opened here goes to the chat, in a new one if it asks for that.
  useAskEvents((q, askId, fresh) => {
    if (fresh) newChat()
    convo.send(q, askId)
    if (view) navigate("/duet")
  })
  useEffect(() => { if (view === "waiting") navigate("/today") }, [view])
  return (
    <AppShell crumbs={[{ label: "Duet" }]}>
      {view === "decided" ? <DuetDecided /> : <DuetChat convo={convo} />}
    </AppShell>
  )
}

// The open chat. A new one has no header: just the greeting and a few ways in.
function DuetChat({ convo }: { convo: Conversation }) {
  const { chats, chat } = useDuetState()
  const scrollRef = useRef<HTMLDivElement>(null)
  // Follow the newest message.
  useEffect(() => { if (convo.msgs.length) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }) }, [convo.msgs.length])
  // An answer streaming in keeps its end in view.
  const streamed = convo.msgs.at(-1)?.text.length ?? 0
  useEffect(() => { if (streamed) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }) }, [streamed])
  // Opening another chat lands on its newest message at once.
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }) }, [chat])
  const open = chats.find((c) => c.id === chat)
  // Every new chat opens on your Duet, wearing its face color.
  const face = useDuetFace(ME.id)
  const hifi = useHifi()
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {convo.hasMsgs && open && (
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
          <PersonAvatar id={ME.id} agent className="size-8" />
          <h1 className="min-w-0 flex-1 truncate text-sm font-medium">{titleOf(open)}</h1>
        </header>
      )}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col p-6 sm:p-8">
          {convo.hasMsgs ? (
            <div className="space-y-5" aria-live="polite"><Messages msgs={convo.msgs} /></div>
          ) : (
            <>
              <Illo name="meet-duet" duet={PIGMENT_HEX[face.pigment]} className="mx-auto mt-auto h-40" />
              <Greeting className={hifi ? "mb-auto pt-4 pb-16" : "my-auto py-16"} />
              <Jumpstarts jumpstarts={convo.jumpstarts} onSend={convo.send} className="-mx-2.5" />
            </>
          )}
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-6 pb-6 sm:px-8">
        <Composer key={chat} placeholder={convo.hasMsgs ? "Reply…" : "How can I help?"} onSend={convo.send} controls={convo.controls} />
      </div>
    </div>
  )
}

// The list beside the rail: Decided for you pinned on top, then your chats, latest first.
export function DuetPanel({ route }: { route: string[] }) {
  const { chats, chat } = useDuetState()
  const pinned = route[1] === "decided"
  const past = chats.filter((c) => c.msgs.length)
  const hifi = useHifi()
  return (
    <div className="p-2">
      {/* Your Duet's face sits on the rail's Duet tab, so the title here is just the word. */}
      <div className={cn("mb-3 flex h-9 items-center gap-1 pr-1", hifi ? "pl-3" : "pl-2")}>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">Duet</span>
        <button onClick={() => { newChat(); navigate("/duet") }} aria-label="New chat" className="flex size-6 items-center justify-center rounded-md hover:bg-sidebar-accent"><Plus className="size-4" /></button>
        <DuetMenu />
      </div>
      <SidebarMenuSub className="mx-0 translate-x-0 border-l-0 px-0">
        <SidebarMenuSubItem>
          <SidebarMenuSubButton asChild isActive={route[1] === "decided"} className="h-8">
            <a href="#/duet/decided">
              <MessageCircleCheck />
              <span className="min-w-0 flex-1 truncate">Decided for you</span>
            </a>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      </SidebarMenuSub>
      {past.length > 0 && <div className="mx-2 my-2 h-px bg-sidebar-border" />}
      <SidebarMenuSub aria-label="Chats" className="mx-0 translate-x-0 border-l-0 px-0">
        {past.map((c) => (
          <SidebarMenuSubItem key={c.id}>
            <SidebarMenuSubButton asChild isActive={!pinned && c.id === chat} className="h-8">
              <a href="#/duet" onClick={() => openChat(c.id)}><span className="min-w-0 flex-1 truncate">{titleOf(c)}</span></a>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        ))}
      </SidebarMenuSub>
    </div>
  )
}

// There's no corner panel: "Ask your Duet" anywhere else (a decision's Ask Duet, Slack's Whyspace DM)
// lands in your Duet chat and opens the Duet tab. Ask Duet on a decision starts a new chat.
export function DuetListener() {
  const convo = useConversation()
  useAskEvents((q, askId, fresh) => {
    if (fresh) newChat()
    convo.send(q, askId)
    navigate("/duet")
  })
  return null
}

// The Duet's ⋯ menu (High-fi): change your Duet's face, in the "Your Duet" face maker.
function DuetMenu() {
  const hifi = useHifi()
  const [faceOpen, setFaceOpen] = useState(false)
  if (!hifi) return null
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button aria-label="Duet options" className="flex size-6 items-center justify-center rounded-md hover:bg-sidebar-accent"><MoreHorizontal className="size-4" /></button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-48">
          <DropdownMenuItem onSelect={() => setFaceOpen(true)}><Smile />Change face</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={faceOpen} onOpenChange={setFaceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Your Duet</DialogTitle></DialogHeader>
          <DuetFaceMaker className="pt-2" />
        </DialogContent>
      </Dialog>
    </>
  )
}
