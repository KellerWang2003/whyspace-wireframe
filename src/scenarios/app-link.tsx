import { useEffect, useSyncExternalStore } from "react"
import { DECISIONS, addLinks, getDataVersion, patchDecision, recordDecision, subscribeData } from "@/data"
import { useDuetState } from "@/design-b/duet-state"
import { addArtifact } from "@/design-b/work"
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
    publishApp(
      {
        decisions: DECISIONS.slice(),
        status: Object.fromEntries(DECISIONS.map((d) => [d.id, statusOf(d)])),
        confirmed: store.confirmed,
        clashes: store.clashes,
        duet: { answered: { ...duet.answered }, asks: duet.msgs.filter((m) => m.who === "me").map((m) => m.text), pending: duet.pendingAsk },
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
        addArtifact: (item) => addArtifact(copy(item)),
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
