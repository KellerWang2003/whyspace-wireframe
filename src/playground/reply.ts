import type { Artifact, Decision } from "@/data"
import { isAI, isNew, type Model } from "@/playground/model"

// Canned answers for the mock chats (Ask Whyspace and a project's Ask page).
export type Msg = { who: "me" | "ai"; text: string; refs?: Decision[]; arts?: Artifact[] }

export type ChatContext = Pick<Model, "decisions" | "artifacts"> & { scopeName: string }

const STOP = new Set(["why", "what", "the", "and", "for", "how", "who", "are", "was", "there", "this", "that", "with", "about"])

export function reply(q: string, m: ChatContext): Msg {
  const t = q.toLowerCase()
  if (t.includes("open")) {
    const ds = m.decisions.filter((d) => d.status === "open")
    return { who: "ai", text: `${ds.length} decisions are still open.`, refs: ds }
  }
  if (t.includes("changed") || t.includes("new")) {
    const ds = m.decisions.filter(isNew)
    return { who: "ai", text: `${ds.length} decisions came in since your last visit on Oct 20.`, refs: ds }
  }
  if (t.includes("ai") || t.includes("confirm")) {
    const ds = m.decisions.filter(isAI)
    return { who: "ai", text: `${ds.length} decisions were inferred by AI tools and need a person to confirm.`, refs: ds }
  }
  if (t.includes("prototype") || t.includes("show")) {
    const as = m.artifacts.filter((a) => a.kind === "Prototype" || a.kind === "Figma")
    return { who: "ai", text: "Here's the design work for this project.", arts: as }
  }
  const words = t.split(/\W+/).filter((w) => w.length > 2 && !STOP.has(w))
  const hit = m.decisions.filter((d) => words.some((w) => new RegExp(`\\b${w}`).test(`${d.title} ${d.why ?? ""}`.toLowerCase())))
  if (hit.length) return { who: "ai", text: hit[0].why ? `${hit[0].title}: ${hit[0].why}` : `Here's what I found.`, refs: hit.slice(0, 4) }
  return { who: "ai", text: "I couldn't find a decision about that. Try asking what's open or what changed." }
}
