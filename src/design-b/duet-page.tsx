import { useEffect, useRef } from "react"
import { Switch } from "@/components/ui/switch"
import { AppShell } from "@/components/app/app-shell"
import { Composer, Greeting, Jumpstarts, Messages } from "@/components/app/ask-whyspace"
import { useAskEvents, useConversation } from "@/components/app/conversation"
import { PersonAvatar } from "@/components/app/person"
import { ME } from "@/data"
import { DuetSide } from "./duet-lines"
import { setAnswersOn, useDuetState } from "./duet-state"

// The Duet page: the same conversation as the corner panel, full width, with what it handled and
// who waits on you beside it. The panel is this condensed; here is where you go to talk.
export function DuetPage() {
  const convo = useConversation()
  useAskEvents(convo.send)
  const { answersOn } = useDuetState()
  const scrollRef = useRef<HTMLDivElement>(null)
  // Follow the newest message; an empty conversation stays at the top, under the title.
  useEffect(() => { if (convo.msgs.length) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }) }, [convo.msgs.length])

  return (
    <AppShell crumbs={[{ label: "Duet" }]}>
      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col p-6 sm:p-8">
              <header className="flex items-center gap-3">
                <PersonAvatar id={ME.id} agent className="size-8" />
                <h1 className="type-title">Duet</h1>
              </header>
              {convo.hasMsgs ? (
                <div className="mt-8 space-y-5" aria-live="polite"><Messages msgs={convo.msgs} /></div>
              ) : (
                <>
                  <Greeting className="my-auto py-16" />
                  <Jumpstarts jumpstarts={convo.jumpstarts} onSend={convo.send} className="-mx-2.5" />
                </>
              )}
            </div>
          </div>
          <div className="mx-auto w-full max-w-3xl px-6 pb-6 sm:px-8">
            <Composer placeholder={convo.hasMsgs ? "Reply…" : "How can I help?"} onSend={convo.send} controls={convo.controls} />
          </div>
        </div>
        <aside className="flex shrink-0 flex-col gap-8 border-t p-6 xl:w-96 xl:overflow-y-auto xl:border-t-0 xl:border-l">
          <div className="flex flex-col gap-2">
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>Answers teammates from my decisions</span>
              <Switch checked={answersOn} onCheckedChange={setAnswersOn} />
            </label>
          </div>
          <DuetSide />
        </aside>
      </div>
    </AppShell>
  )
}
