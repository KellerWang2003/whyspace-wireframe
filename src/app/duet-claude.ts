import { ARTIFACTS, ME, MY_PROJECTS, PEOPLE, STATUS_LABEL, TASKS, TASK_STATUS_LABEL, decisionById, projectName, type Decision } from "@/data"
import type { Msg } from "@/playground/reply"
import { getDuetState, patchMsg } from "./duet-state"

// Demo: the Duet chat answers with Claude (Sonnet) through the dev server's /api/chat
// (vite.config.ts), grounded in the mock project data. The key stays on the dev server, in
// .env.local. Without the dev server or a key (the static build), it falls back to the canned answer.

// The composer's model picker. Auto is Sonnet.
const MODEL_ID: Record<string, string> = {
  "Claude Opus 5.5": "claude-opus-5-5",
  "Claude Haiku 5.5": "claude-haiku-5-5",
}
const modelId = (label: string) => MODEL_ID[label] ?? "claude-sonnet-5-5"

// The Thinking loop draws itself in about a second; a fast reply still lets it finish once.
const MIN_THINKING_MS = 1200

const name = (id?: string) => (id ? PEOPLE[id]?.name ?? id : "")

function system(decisions: Decision[], confirmed: Record<string, boolean>, scopeName: string) {
  const me = ME.name.split(" ")[0]
  const status = (d: Decision) => STATUS_LABEL[confirmed[d.id] && d.status === "inf" ? "conf" : d.status]
  const projects = MY_PROJECTS.filter((p) => decisions.some((d) => d.project === p.id))
  const inProjects = (x: { project: string }) => projects.some((p) => p.id === x.project)
  const people = [...new Set(projects.flatMap((p) => p.members))].map((id) => `- ${name(id)}: ${PEOPLE[id]?.role ?? ""}`)
  const lines = decisions.map((d) => [
    `- [${d.id}] ${d.title}`,
    `  project: ${projectName(d.project)} · thread: ${d.part} · status: ${status(d)} · owner: ${name(d.owner)}${d.by && d.by !== d.owner ? ` · recorded by ${name(d.by)}` : ""}${d.when ? ` · ${d.when}` : ""}`,
    d.why && `  why: ${d.why}`,
    d.was && `  was before: ${d.was}`,
    d.replaces && `  replaces: [${d.replaces}]`,
    d.clashes && `  clashes with: [${d.clashes}]`,
    d.options?.length && `  options not picked: ${d.options.map((o) => `${o.title} (${o.why})`).join("; ")}`,
    d.evidence?.length && `  evidence: ${d.evidence.map((e) => e.label + (e.detail ? ` (${e.detail})` : "")).join("; ")}`,
  ].filter(Boolean).join("\n"))
  const tasks = TASKS.filter((t) => inProjects(t) && t.status !== "done").map((t) => `- ${t.title} · ${projectName(t.project)} · thread: ${t.part} · owner: ${name(t.owner)} · due ${t.due} · ${TASK_STATUS_LABEL[t.status]}`)
  const artifacts = ARTIFACTS.filter(inProjects).map((a) => `- ${a.name} (${a.kind}) · ${projectName(a.project)} · thread: ${a.part} · owner: ${name(a.owner)} · updated ${a.updated}`)

  return `You are ${me}'s Duet inside Whyspace. Whyspace keeps a team's decisions and the why behind each one, so the why travels with the work. You are ${me}'s own AI: you know their decisions and their team's, and you help them stay aligned. ${me} is ${PEOPLE[ME.id]?.role ?? "on the team"}. Right now you're looking at ${scopeName}.

How you answer:
- Answer from the decisions below. A Confirmed or From precedent decision is settled. An Inferred decision is a guess that nobody confirmed yet: say it's a guess and not confirmed. An Open decision isn't made yet: say who owns it. Changed and Flagged mean it moved or someone raised a problem.
- When no decision covers the question, say "No decision covers that yet." and offer to ask the person most likely to know. Never invent decisions, names, numbers or dates.
- Talk to ${me} as "you". Their own decisions are "you decided" or "your guess". Name teammates by first name, and use their name again rather than he or she.
- Write like a teammate in chat: plain, full sentences, one to three of them. No headings, no bold, no markdown. Use a short list or line breaks only when asked for a list or a draft.
- When asked for a draft, give only the draft, with no note about it before or after.
- Say "decisions", never "calls".
- After your answer, on its own last line, list the ids of the decisions you used like <cites>id1,id2</cites>. Leave it out if you used none.

People:
${people.join("\n")}

Projects:
${projects.map((p) => `- ${p.name}${p.brief ? `: ${p.brief}` : ""}`).join("\n")}

Decisions:
${lines.join("\n") || "(none yet)"}

Open tasks:
${tasks.join("\n") || "(none)"}

Artifacts:
${artifacts.join("\n") || "(none)"}`
}

// The chat so far as alternating turns, starting with yours.
function turns(msgs: Msg[]) {
  const out: { role: "user" | "assistant"; content: string }[] = []
  for (const m of msgs) {
    const role = m.who === "me" ? "user" : "assistant"
    if (!m.text.trim()) continue
    const last = out[out.length - 1]
    if (last?.role === role) last.content += `\n\n${m.text}`
    else if (out.length || role === "user") out.push({ role, content: m.text })
  }
  return out
}

// What to show while it streams: everything before the citations.
const visible = (raw: string) => {
  const cut = raw.search(/<c(i(t(e(s)?)?)?)?$|<cites>/)
  return (cut < 0 ? raw : raw.slice(0, cut)).trimEnd()
}
const citesOf = (raw: string) => (raw.match(/<cites>([^<]*)<\/cites>/)?.[1] ?? "").split(",").map((s) => s.trim()).filter(Boolean)

// Sends the open chat to Claude. The last message in it is the Duet's empty, thinking reply; it fills in as the answer streams.
export async function askDuet({ decisions, confirmed, scopeName, fallback }: { decisions: Decision[]; confirmed: Record<string, boolean>; scopeName: string; fallback: () => Msg }) {
  const { chat, msgs, model } = getDuetState()
  const at = msgs.length - 1
  const started = performance.now()
  const wait = () => new Promise((r) => setTimeout(r, Math.max(0, MIN_THINKING_MS - (performance.now() - started))))
  let raw = ""
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system: system(decisions, confirmed, scopeName), messages: turns(msgs.slice(0, at)), model: modelId(model) }),
    })
    if (!res.ok || !res.body) throw new Error(`duet ${res.status}`)
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let shown = false
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      raw += decoder.decode(value, { stream: true })
      const text = visible(raw)
      if (!text) continue
      if (!shown) { await wait(); shown = true }
      patchMsg(chat, at, { text: visible(raw), thinking: true })
    }
    if (!visible(raw)) throw new Error("empty reply")
    const refs = citesOf(raw).map((id) => decisionById(id)).filter((d): d is Decision => !!d)
    patchMsg(chat, at, { text: visible(raw), thinking: false, ...(refs.length ? { refs } : {}) })
  } catch (err) {
    console.warn("[duet] falling back to the canned answer:", err)
    await wait()
    patchMsg(chat, at, { ...fallback(), thinking: false })
  }
}
