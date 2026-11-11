import { useEffect, useSyncExternalStore } from "react"
import { DECISIONS, addLinks, getDataVersion, patchDecision, recordDecision, subscribeData } from "@/data"
import { DUET_LOG } from "@/app/duet"
import { answerAsk, useDuetState } from "@/app/duet-state"
import { askOfTopic, saveAnswer, saveMessage, sendTogether, settleTogether, topicOf } from "@/app/together"
import { addArtifact } from "@/app/work"
import { askWhyspace } from "@/lib/ask"
import { navigate, useRoute } from "@/lib/router"
import { useStore } from "@/lib/store"
import { useStatusOf } from "@/lib/work"
import { deskApi, publishApp } from "./frame"

// Inside the app frame: publish the app's state and API to the scenario desktop after every
// change, bring the Whyspace window forward when it is clicked, and keep the desktop's address on
// the app's page. Objects from the desktop are copied in, so nothing here belongs to the other frame.

const copy = <T,>(x: T): T => structuredClone(x)

export function AppLink() {
  const store = useStore()
  const version = useSyncExternalStore(subscribeData, getDataVersion)
  const statusOf = useStatusOf()
  const duet = useDuetState()
  const path = `/${useRoute().join("/")}`

  useEffect(() => {
    // Slack's Whyspace DM is one conversation: it shows every Duet chat, oldest chat first.
    const everything = [...duet.chats].reverse().flatMap((c) => c.msgs)
    publishApp(
      {
        decisions: DECISIONS.slice(),
        status: Object.fromEntries(DECISIONS.map((d) => [d.id, statusOf(d)])),
        confirmed: store.confirmed,
        clashes: store.clashes,
        duet: {
          answered: { ...duet.answered },
          asks: everything.filter((m) => m.who === "me").map((m) => m.text),
          // The question open in the reply window: a conversation the Duet started counts as the question it started from.
          pending: ((r) => (r && !duet.answered[r] ? r : null))(duet.reply?.open ? askOfTopic(duet.reply.id) ?? duet.reply.id : null) ?? duet.pendingAsk,
          saved: { ...duet.saved },
          together: copy(duet.together),
          posted: duet.posted.slice(),
          chat: everything.map((m) => ({ who: m.who, text: m.text, refs: m.refs?.map((d) => d.id), caught: !!m.caught })),
        },
      },
      {
        record: (decisions, links) => {
          addLinks(copy(links))
          for (const d of decisions) recordDecision(copy(d))
        },
        settleClash: (id, choice) => store.settleClash(id, choice),
        confirm: (id, why) => {
          if (why) patchDecision(id, { why })
          store.confirmDecision(id)
        },
        unconfirm: (id, why) => {
          patchDecision(id, { why })
          store.unconfirmDecision(id)
        },
        addArtifact: (item) => addArtifact(copy(item)),
        answer: (id, text) => answerAsk(id, text),
        saveAnswer: (id, title) => { const l = DUET_LOG.find((x) => x.id === id); if (l) saveAnswer(l, title, "Slack") },
        saveMessage: (m) => saveMessage(copy(m)),
        sendTogether: (id, text) => { const t = topicOf(id); if (t) sendTogether(t, text) },
        settleTogether: (id, title) => { const t = topicOf(id); if (t) settleTogether(t, title, store.settleClash, "Slack") },
        ask: (q) => askWhyspace(q),
        openDecision: (id) => store.openDecision(id),
        patchTask: (id, patch) => store.patchTask(id, copy(patch)),
        navigate: (to) => navigate(to),
      },
    )
  }, [version, statusOf, store, duet])

  useEffect(() => { deskApi()?.route(path) }, [path])

  useEffect(() => {
    const onDown = () => deskApi()?.focus("whyspace")
    document.addEventListener("pointerdown", onDown, true)
    return () => document.removeEventListener("pointerdown", onDown, true)
  }, [])

  return null
}
