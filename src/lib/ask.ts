// Send a question to the Ask Whyspace assistant from anywhere on the page.
// The assistant opens docked and answers it in the same conversation.
const EVENT = "ask-whyspace"

export function askWhyspace(question: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: question }))
}

export function onAskWhyspace(handler: (question: string) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<string>).detail)
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
