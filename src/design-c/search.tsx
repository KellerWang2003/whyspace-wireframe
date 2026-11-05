import { useEffect } from "react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { navigate } from "@/lib/router"
import { useStore } from "@/lib/store"
import { HANDOFFS, PEOPLE_C, TALKS, THREADS_C, nameOf, threadOf } from "./data"
import { effective, handoffsBy, talkPhase } from "./model"
import { useC } from "./state"
import { Dot, Face, ThreadDotC, WhereLabel } from "./ui"

// ⌘K in Design C: calls first, since that is what people go looking for ("what did we say about the trial?").
export function SearchC() {
  const { searchOpen, setSearchOpen } = useStore()
  const s = useC()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen(!searchOpen)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [searchOpen, setSearchOpen])

  const go = (path: string) => { setSearchOpen(false); navigate(path) }
  const handoffs = handoffsBy(s.scene)
  const calls = handoffs.flatMap((h) => effective(h, s).map((e) => ({ e, h })))

  return (
    <CommandDialog open={searchOpen} onOpenChange={setSearchOpen} title="Search" description="Search calls, work, threads, talks and people" className="sm:max-w-2xl">
      <CommandInput placeholder="Search…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>Nothing matches that.</CommandEmpty>
        <CommandGroup heading="Calls">
          {calls.map(({ e, h }) => (
            <CommandItem key={e.call.id} value={`${e.text} ${e.why ?? ""} ${nameOf(h.from)} ${h.title}`} onSelect={() => go(`/p/${h.project}/t/${h.thread}/h/${h.id}`)}>
              <Dot state={e.state} />
              <span className="min-w-0 flex-1 truncate">{e.text}{e.why && <span className="text-muted-foreground"> · {e.why}</span>}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{nameOf(h.from)} · {h.day}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Shared">
          {handoffs.map((h) => (
            <CommandItem key={h.id} value={`${h.title} ${nameOf(h.from)} ${threadOf(h.thread)?.name ?? ""}`} onSelect={() => go(`/p/${h.project}/t/${h.thread}/h/${h.id}`)}>
              <Face id={h.from} className="size-5" />
              <span className="min-w-0 flex-1 truncate">{h.title}</span>
              <WhereLabel where={h.where} className="text-xs" />
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Threads">
          {THREADS_C.map((t) => (
            <CommandItem key={t.id} value={`${t.name} ${t.intent}`} onSelect={() => go(`/p/${t.project}/t/${t.id}`)}>
              <ThreadDotC thread={t.id} />
              <span className="min-w-0 flex-1 truncate">{t.name}<span className="text-muted-foreground"> · {t.intent}</span></span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Talks">
          {TALKS.filter((t) => talkPhase(t, s) !== null).map((t) => (
            <CommandItem key={t.id} value={`${t.title} ${t.outcome?.text ?? ""}`} onSelect={() => go(`/p/${t.project}/talks/${t.id}`)}>
              <span className="size-2 rounded-full border border-foreground" />
              <span className="min-w-0 flex-1 truncate">{t.title}{t.outcome && <span className="text-muted-foreground"> · {t.outcome.text}</span>}</span>
              <span className="text-xs text-muted-foreground">{t.day} {t.time}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="People">
          {Object.values(PEOPLE_C).map((p) => (
            <CommandItem key={p.id} value={`${p.name} ${p.role} ${p.ai}`} onSelect={() => go(`/p/launch`)}>
              <Face id={p.id} className="size-5" />
              <span className="min-w-0 flex-1 truncate">{p.name}<span className="text-muted-foreground"> · {p.role} · {p.ai}</span></span>
              <span className="text-xs text-muted-foreground">{HANDOFFS.filter((h) => h.from === p.id && h.at <= s.scene).length} shared</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
