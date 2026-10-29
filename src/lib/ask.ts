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
