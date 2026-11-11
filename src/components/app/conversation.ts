import { useEffect, useRef, useState } from "react"
import { CircleCheck, FileText, History, ListTodo, MessageCircle, PenLine } from "lucide-react"
import { ARTIFACTS, CANVAS_EXTRAS, DECISIONS, ME, PROJECTS, TASKS, decisionById, partsOf, projectName, type Artifact, type Decision } from "@/data"
import { filterDecisions, onAskWhyspace } from "@/lib/ask"
import { useRoute } from "@/lib/router"
import { DESIGN } from "@/lib/design"
import { useStore } from "@/lib/store"
import { DUET_LOG } from "@/app/duet"
import { askDuet } from "@/app/duet-claude"
import { answerAsk, first, getDuetState, pushMsgs, setModel, setPendingAsk, useConversationFor, useDuetState } from "@/app/duet-state"
import { reply, type Msg } from "@/playground/reply"
import { PRESET } from "@/scenarios/data"

// The conversation behind the corner panel (ask-whyspace.tsx) and, in the main design, the Duet page.
// No components here, so both can import it.

export type Attachment = { id: string; name: string }
export type Jumpstart = { icon: React.ElementType; label: string }

export const MODELS = ["Auto", "Claude Opus 5.5", "Claude Sonnet 5.5", "Claude Haiku 5.5"]
export const ALL = "all"
// Main design: the one AI is your Duet. Archived Design A keeps Ask Whyspace.
export const NAME = DESIGN === "b" ? "Duet" : "Ask Whyspace"

export type ComposerControls = {
  attachments: Attachment[]
  onAttach: (a: Attachment) => void
  onRemove: (id: string) => void
  artifacts: Artifact[]
  scopes: string[]
  scopeAll: string
  scope: string
  setScope: (scope: string) => void
  model: string
  setModel: (model: string) => void
}

export type Conversation = {
  msgs: Msg[]
  hasMsgs: boolean
  send: (q: string, askId?: string) => void
  controls: ComposerControls
  jumpstarts: Jumpstart[]
  projectId?: string
}

// The conversation behind the corner panel and, in the main design, the Duet page: scoped to the project
// you are in (or a thread of it), answering from its decisions. Messages live in a shared store so
// the panel and the page are one conversation.
export function useConversation(): Conversation {
  const [first_, second, third] = useRoute()
  const { current, confirmed } = useStore()
  const { msgs, model } = useDuetState()
  useConversationFor(current?.id, current?.example)
  const project = ["p", "playground"].includes(first_) ? PROJECTS.find((item) => item.id === second) : undefined
  const projectDecisions = current?.example ? DECISIONS.filter((item) => !project || item.project === project.id) : []
  const projectArtifacts = current?.example ? ARTIFACTS.filter((item) => !project || item.project === project.id) : []
  // Scope: a thread inside a project, or a project from anywhere else.
  const scopes = project ? partsOf(projectDecisions).map((p) => p.name) : current?.example ? PROJECTS.map((p) => p.name) : []
  const [scope, setScope] = useState(ALL)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const scoped = scope !== ALL && scopes.includes(scope) ? scope : ALL
  const inScope = <T extends { part: string; project: string }>(item: T) => scoped === ALL || (project ? item.part === scoped : projectName(item.project) === scoped)
  const context = {
    scopeName: scoped !== ALL ? scoped : project?.name ?? current?.name ?? "your workspace",
    decisions: projectDecisions.filter(inScope),
    artifacts: projectArtifacts.filter(inScope),
  }
  const decisionsTab = first_ === "p" && third === "decisions"
  const jumpstarts = jumpstartsFor({ inProject: !!project, section: first_ === "p" ? third ?? "home" : first_, scope: scoped, projectId: project?.id, decisions: context.decisions })

  function send(q: string, askId?: string) {
    if (!q.trim()) return
    if (DESIGN === "b") {
      // Read now, not at render: a new chat may have just been opened for this question.
      const { pendingAsk } = getDuetState()
      // A teammate's question nothing of yours covers: you answer it here, the Duet passes it on.
      // The Duet is the one asking, so the question sits on its side of the conversation.
      const ask = DUET_LOG.find((l) => l.id === (askId ?? pendingAsk))
      if (askId && ask) {
        setPendingAsk(askId)
        pushMsgs({ who: "ai", text: `${first(ask.who)} asked ${ask.text}. No decision of yours covers it. What should I tell ${first(ask.who)}?` })
        return
      }
      if (pendingAsk && ask) {
        answerAsk(pendingAsk, q)
        pushMsgs({ who: "me", text: q }, { who: "ai", text: `Told ${first(ask.who)}: “${q.trim()}”` })
        return
      }
    }
    // A test scenario can script the answer to its question.
    const canned = PRESET.answers?.find((a) => a.words.every((w) => q.toLowerCase().includes(w)))
    // Main design: what it caught while you were away, the same list as While you were away on Home.
    if (DESIGN === "b" && !canned && CAUGHT.test(q)) {
      pushMsgs({ who: "me", text: q }, { who: "ai", text: `Here’s what happened${project ? ` in ${project.name.replace(/\s*\(.*\)$/, "")}` : ""} while you were away.`, caught: { project: project?.id } })
      setAttachments([])
      return
    }
    // Main design: Claude answers (demo, dev server only), with the canned answer as its fallback.
    if (DESIGN === "b" && !canned) {
      pushMsgs({ who: "me", text: q }, { who: "ai", text: "", thinking: true })
      setAttachments([])
      void askDuet({ decisions: context.decisions, confirmed, scopeName: context.scopeName, fallback: () => reply(q, context, "No decision covers that yet.") })
      return
    }
    const answer: Msg = canned
      ? { who: "ai", text: canned.text, refs: canned.refs.map((id) => decisionById(id)).filter((d): d is Decision => !!d) }
      : reply(q, context, DESIGN === "b" ? "No decision covers that yet." : undefined)
    pushMsgs({ who: "me", text: q }, answer)
    setAttachments([])
    if (decisionsTab && answer.refs?.length) filterDecisions(answer.refs.map((d) => d.id), q)
  }

  const controls: ComposerControls = {
    attachments,
    onAttach: (a) => setAttachments((all) => (all.some((x) => x.id === a.id) ? all : [...all, a])),
    onRemove: (id) => setAttachments((all) => all.filter((a) => a.id !== id)),
    artifacts: context.artifacts,
    scopes,
    scopeAll: project ? "All threads" : "All projects",
    scope: scoped,
    setScope,
    model,
    setModel,
  }
  return { msgs, hasMsgs: msgs.length > 0, send, controls, jumpstarts, projectId: project?.id }
}

// "Ask about this" on a page sends into whichever surface is mounted: the panel, or the Duet page.
// `fresh`: the question asks for a new chat (Ask Duet on a decision).
export function useAskEvents(send: (q: string, askId?: string, fresh?: boolean) => void) {
  const latest = useRef(send)
  useEffect(() => { latest.current = send })
  useEffect(() => onAskWhyspace((q, askId, fresh) => latest.current(q, askId, fresh)), [])
}

const CAUGHT = /\b(catch|caught|missed|away)\b/i

// Starting points for what you're looking at: the page, the scope, and what needs you.
function jumpstartsFor({ inProject, section, scope, projectId, decisions }: { inProject: boolean; section: string; scope: string; projectId?: string; decisions: typeof DECISIONS }): Jumpstart[] {
  const needsMe = decisions.filter((d) => d.status === "open" || (d.status === "inf" && d.owner === ME.id)).length
  const myTasks = TASKS.filter((t) => t.owner === ME.id && t.status !== "done" && (!projectId || t.project === projectId)).length
  const list: Jumpstart[] = []
  list.push({ icon: History, label: DESIGN === "b" ? "What happened while I was away?" : scope !== ALL ? `Catch me up on ${scope}` : inProject ? "What changed since I was here?" : "Catch me up on everything" })
  if (section === "decisions" || needsMe) list.push({ icon: CircleCheck, label: needsMe ? "Which decisions need me?" : "Which decisions need confirmation?" })
  if (section === "tasks" || section === "my-tasks" || myTasks) list.push({ icon: ListTodo, label: "What should I work on next?" })
  if (section === "artifacts") list.push({ icon: FileText, label: "Show me the latest design work" })
  const extra = projectId && CANVAS_EXTRAS[projectId]?.ask[0]
  if (extra) list.push({ icon: MessageCircle, label: extra })
  list.push({ icon: PenLine, label: "Draft a status update" })
  return list.slice(0, 4)
}
