import { useEffect, useRef, useState, type ReactNode } from "react"
import { ArrowUp, ChevronDown, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

// The pieces an AI tool's chat is made of, for the tools on the scenario desktop. Not Whyspace UI.

export function Me({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mt-5 max-w-[80%] self-end rounded-2xl bg-[#ebe8df] px-4 py-2 whitespace-pre-wrap first:mt-0", className)}>{children}</div>
}

export function Ai({ glyph, children }: { glyph?: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-5 flex items-start gap-2 animate-in duration-200 fade-in-0">
      <span className="mt-1 shrink-0" aria-hidden>{glyph ?? <span className="text-[#c96442]">✳</span>}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

// An MCP tool call, the way a chat app shows one.
export function Tool({ name, app = "whyspace", meta, open, onToggle, dark, children }: { name: string; app?: string; meta?: string; open?: boolean; onToggle?: () => void; dark?: boolean; children?: ReactNode }) {
  const head = (
    <>
      <Sparkles className="size-3 shrink-0" />
      <span className="shrink-0">{app} · {name}</span>
      {meta && <span className="ml-auto truncate">{meta}</span>}
      {onToggle && <ChevronDown className={cn("size-3 shrink-0 transition-transform", open && "rotate-180")} />}
    </>
  )
  const tone = dark ? "border-white/10 bg-white/5 text-neutral-200" : "border-black/10 bg-white"
  const headTone = dark ? "text-neutral-400" : "text-neutral-500"
  return (
    <div className={cn("mt-3 rounded-lg border px-3 py-2 text-[12px] leading-5 first:mt-0", tone)}>
      {onToggle ? (
        <button type="button" aria-expanded={open} onClick={onToggle} className={cn("flex w-full min-w-0 items-center gap-2 text-left text-[11px]", headTone)}>{head}</button>
      ) : (
        <div className={cn("flex min-w-0 items-center gap-2 text-[11px]", headTone)}>{head}</div>
      )}
      {children && (!onToggle || open) && <div className="mt-1.5">{children}</div>}
    </div>
  )
}

// Type or paste, Enter sends. Shift+Enter for a new line.
export function Composer({ disabled, onSend, placeholder, footer, label = "Message", dark, mono }: { disabled: boolean; onSend: (text: string) => void; placeholder: string; footer: string; label?: string; dark?: boolean; mono?: boolean }) {
  const [text, setText] = useState("")
  const ref = useRef<HTMLTextAreaElement>(null)
  const send = () => {
    const t = text.trim()
    if (!t || disabled) return
    onSend(t)
    setText("")
  }
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "0px"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [text])
  return (
    <div className={cn("mx-auto w-full max-w-[680px] shrink-0 px-4 pb-4", mono && "font-mono")}>
      <form className={cn("flex items-end gap-2 rounded-xl border px-4 py-3 shadow-sm", dark ? "border-white/15 bg-white/5 focus-within:border-white/40" : "border-black/10 bg-white focus-within:border-black/30")} onSubmit={(e) => { e.preventDefault(); send() }}>
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder={placeholder}
          aria-label={label}
          rows={1}
          className={cn("max-h-40 min-h-6 flex-1 resize-none bg-transparent text-[13px] leading-6 outline-none", dark ? "text-neutral-100 placeholder:text-neutral-500" : "text-[#1f1e1b] placeholder:text-neutral-400")}
        />
        <button type="submit" disabled={disabled || !text.trim()} aria-label="Send" className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg disabled:opacity-30", dark ? "bg-white text-neutral-900" : "bg-[#c96442] text-white")}><ArrowUp className="size-4" /></button>
      </form>
      <p className={cn("mt-2 truncate text-[11px]", dark ? "text-neutral-500" : "text-neutral-400")}>{footer}</p>
    </div>
  )
}
