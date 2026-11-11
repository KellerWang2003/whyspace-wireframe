import { DESIGN } from "@/lib/design"

// Send a question to the assistant from anywhere on the page. In the main design that is your Duet:
// the Duet tab opens and answers in the chat that's open, or in a new chat when `fresh` is set.
// `askId` names a teammate's question (a DuetLine) you are about to answer, so the next message you
// type is passed on to them.
const EVENT = "ask-whyspace"

export const ASK_LABEL = DESIGN === "b" ? "Ask your Duet" : "Ask Whyspace"

export function askWhyspace(question: string, askId?: string, fresh?: boolean) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { question, askId, fresh } }))
}

export function onAskWhyspace(handler: (question: string, askId?: string, fresh?: boolean) => void) {
  const listener = (e: Event) => {
    const { question, askId, fresh } = (e as CustomEvent<{ question: string; askId?: string; fresh?: boolean }>).detail
    handler(question, askId, fresh)
  }
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}

// On the Decisions tab, Ask's answers filter the table to the decisions it cited.
const FILTER = "ask-whyspace-filter"

export function filterDecisions(ids: string[], question: string) {
  window.dispatchEvent(new CustomEvent(FILTER, { detail: { ids, question } }))
}

export function onFilterDecisions(handler: (ids: string[], question: string) => void) {
  const listener = (e: Event) => {
    const { ids, question } = (e as CustomEvent<{ ids: string[]; question: string }>).detail
    handler(ids, question)
  }
  window.addEventListener(FILTER, listener)
  return () => window.removeEventListener(FILTER, listener)
}
