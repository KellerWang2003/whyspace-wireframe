import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { ArrowRight, Check, ChevronRight } from "lucide-react"
import { navigate } from "@/lib/router"
import { ToolLogo } from "@/components/app/tool-logo"
import { cn } from "@/lib/utils"
import { PaintSurface, Strands } from "@/components/brand/paint"
import { WhyspaceLockup, WhyspaceMark, WhyspaceThread } from "@/components/brand/logo"
import thread from "@/assets/landing/thread.webp"
import face1 from "@/assets/landing/face-1.webp"
import face2 from "@/assets/landing/face-2.webp"
import illPeople from "@/assets/landing/ill-people.webp"

// Marketing landing page.
// Mostly calm and technical, like the product (crisp type, hairlines, mono labels, real UI).
// The brand shows up in a few places only: the painted thread up top, painted washes under small
// vignettes, and side pieces in just two sections, on opposite sides, so they never cluster.
const C = {
  forest: "#40542E",
  forestDeep: "#2E3922",
  paper: "#FDFDFC",
  leaf: "#6A854C",
  apricot: "#F19D57",
  sky: "#75A6C4",
  rose: "#E97EA1",
  leafWash: "#EAF5DF",
  apricotWash: "#FFE9D2",
  skyWash: "#E2F3FE",
  roseWash: "#FFE4EF",
  leafInk: "#5A753C",
  apricotInk: "#A25600",
  skyInk: "#42718D",
  roseInk: "#A8486A",
  muted: "#676F5D",
  line: "#E0E5DC",
  subtle: "#F3F6F0",
}

const CSS = `
.lp-rise{animation:lp-rise .9s cubic-bezier(.2,.7,.2,1) both}
@keyframes lp-rise{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
.lp-reveal{opacity:0;transform:translateY(24px);transition:opacity .8s ease,transform .8s cubic-bezier(.2,.7,.2,1)}
.lp-reveal.lp-in{opacity:1;transform:none}
.lp-pop{opacity:0;transform:translateY(30px) scale(.92);transition:opacity .7s ease,transform 1s cubic-bezier(.3,1.4,.5,1)}
.lp-in .lp-pop,.lp-pop.lp-in{opacity:1;transform:none}
.lp-bob{animation:lp-bob 7s ease-in-out infinite alternate}
@keyframes lp-bob{from{translate:0 0;rotate:0deg}to{translate:0 -10px;rotate:2deg}}
.lp-note{transition:transform .5s cubic-bezier(.2,.7,.2,1)}
.lp-note:hover{transform:rotate(0deg) translateY(-6px) scale(1.03)!important}
.lp-toast{animation:lp-toast .6s cubic-bezier(.2,.7,.2,1) 2.2s both}
@keyframes lp-toast{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.ws-strand{opacity:0;transform:translateY(-40px) rotate(-10deg);transform-box:fill-box;transform-origin:center;transition:opacity .6s ease,transform .9s cubic-bezier(.3,1.5,.5,1)}
.lp-in .ws-strand{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.lp-rise,.lp-bob,.lp-toast{animation:none}.lp-reveal,.lp-pop,.ws-strand{opacity:1;transform:none;transition:none}}
`

export function Landing() {
  const scroller = useRef<HTMLDivElement>(null)
  const go = (id: string) => scroller.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
  return (
    <div ref={scroller} className="h-svh overflow-x-hidden overflow-y-auto" style={{ background: C.paper, color: C.forest }}>
      <style>{CSS}</style>
      <Nav go={go} />
      <Hero go={go} />
      <Problem />
      <HowItWorks />
      <Record />
      <Together />
      <Pricing />
      <Closing />
    </div>
  )
}

/* ---------- shared ---------- */

function useInView<T extends Element>() {
  const ref = useRef<T>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setShown(true)
        io.disconnect()
      }
    }, { threshold: 0.12 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, shown] as const
}

function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [ref, shown] = useInView<HTMLDivElement>()
  return <div ref={ref} className={cn("lp-reveal", shown && "lp-in", className)} style={{ transitionDelay: `${delay}ms` }}>{children}</div>
}

// A section: the calm center column, with room for painted pieces in the margins.
function Section({ id, children, art, className }: { id?: string; children: ReactNode; art?: ReactNode; className?: string }) {
  const [ref, shown] = useInView<HTMLElement>()
  return (
    <section id={id} ref={ref} className={cn("relative scroll-mt-16", shown && "lp-in", className)}>
      {art}
      <div className="relative mx-auto max-w-[1040px] px-6">{children}</div>
    </section>
  )
}

// A painted piece in the left or right margin, outside the center column. Hidden on small screens.
function Side({ side, top, width, rotate = 0, delay = 0, bob = true, children }: { side: "left" | "right"; top: number; width: number; rotate?: number; delay?: number; bob?: boolean; children: ReactNode }) {
  const pos: CSSProperties = side === "left" ? { right: "calc(50% + 535px)" } : { left: "calc(50% + 535px)" }
  return (
    <div aria-hidden className="pointer-events-none absolute hidden min-[1360px]:block" style={{ top, width, ...pos }}>
      <div className="lp-pop" style={{ transitionDelay: `${delay}ms` }}>
        <div style={{ transform: `rotate(${rotate}deg)` }}>
          <div className={bob ? "lp-bob" : undefined} style={{ animationDelay: `${-delay / 300}s` }}>{children}</div>
        </div>
      </div>
    </div>
  )
}

function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("font-mono text-[12px] tracking-[0.08em] uppercase", className)} style={{ color: C.muted }}>{children}</div>
}

function H2({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("font-serif text-[clamp(2rem,4vw,3.25rem)] leading-[1.06] tracking-[-0.02em]", className)}>{children}</h2>
}

function Button({ children, onClick, variant = "solid", className }: { children: ReactNode; onClick?: () => void; variant?: "solid" | "ghost" | "paper"; className?: string }) {
  const style: CSSProperties =
    variant === "solid" ? { background: C.forest, color: C.paper } :
    variant === "paper" ? { background: C.paper, color: C.forest } :
    { boxShadow: `inset 0 0 0 1px ${C.line}`, color: C.forest, background: "white" }
  return (
    <button onClick={onClick} style={style} className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-[15px] font-medium transition-opacity hover:opacity-85", className)}>
      {children}
    </button>
  )
}

function Avatar({ who }: { who: string }) {
  const tone: Record<string, [string, string]> = { KL: [C.leafWash, C.leafInk], TR: [C.skyWash, C.skyInk], MC: [C.apricotWash, C.apricotInk], CH: [C.roseWash, C.roseInk] }
  const [bg, ink] = tone[who] ?? [C.subtle, C.muted]
  return <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-white" style={{ background: bg, color: ink }}>{who}</span>
}

/* ---------- painted pieces ---------- */

function Note({ text, color, ink, seed, width = 200 }: { text: string; color: string; ink: string; seed: number; width?: number }) {
  return (
    <div className="lp-note pointer-events-auto" style={{ width }}>
      <PaintSurface color={color} opacity={0.5} seed={seed} radius={8}>
        <p className="flex aspect-square items-end p-5 font-serif text-[22px] leading-[1.15]" style={{ color: ink }}>{text}</p>
      </PaintSurface>
    </div>
  )
}

/* ---------- sections ---------- */

function Nav({ go }: { go: (id: string) => void }) {
  return (
    <header className="sticky top-0 z-30 border-b backdrop-blur-md" style={{ background: `${C.paper}e6`, borderColor: C.line }}>
      <div className="mx-auto flex h-16 max-w-[1040px] items-center gap-8 px-6">
        <button onClick={() => go("top")} className="flex items-center gap-2">
          <WhyspaceLockup variant="beside" className="w-[124px]" />
        </button>
        <nav className="hidden items-center gap-6 text-[14px] md:flex" style={{ color: C.muted }}>
          <button onClick={() => go("how")} className="hover:opacity-70">How it works</button>
          <button onClick={() => go("pricing")} className="hover:opacity-70">Pricing</button>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => navigate("/today")} className="hidden h-9 px-3 text-[14px] hover:opacity-70 sm:block">Open app</button>
          <Button onClick={() => navigate("/signup")} className="h-9 px-4 text-[14px]">Start free</Button>
        </div>
      </div>
    </header>
  )
}

function Hero({ go }: { go: (id: string) => void }) {
  return (
    <Section id="top" className="pt-20 pb-24 md:pt-28">
      <div className="text-center">
        {/* The mark writes itself and runs on into a thread: the logo's own animation, only here. */}
        <WhyspaceThread className="mx-auto mb-8 w-[min(360px,72%)]" />
        <h1 className="lp-rise font-serif text-[clamp(3rem,7vw,5.5rem)] leading-[0.98] tracking-[-0.025em]">Where the why lives.</h1>
        <p className="lp-rise mx-auto mt-6 max-w-xl text-[18px] leading-relaxed md:text-[20px]" style={{ color: C.muted, animationDelay: "100ms" }}>
          Keep the why with the work, from teammate to teammate and tool to tool.
        </p>
        <div className="lp-rise mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "200ms" }}>
          <Button onClick={() => navigate("/signup")}>Start free <ArrowRight className="size-4" /></Button>
          <Button variant="ghost" onClick={() => go("how")}>See how it works</Button>
        </div>
      </div>
      {/* the one big brand moment up top: the team as a painted thread, then the calm product under it */}
      <img src={thread} alt="" className="lp-rise relative mx-auto mt-10 w-full max-w-[920px] mix-blend-multiply" style={{ animationDelay: "300ms" }} />
      <div className="lp-rise relative mt-4" style={{ animationDelay: "450ms" }}>
        <ProductWindow />
      </div>
    </Section>
  )
}

const THREADS: [string, string][] = [["Research", C.sky], ["App", C.leaf], ["Brand", C.rose], ["Marketing", C.apricot]]
const ROWS = [
  { thread: 1, state: "Decided", title: "A moving dot shows cats where to swipe", why: "Works on the app, billboard and video", who: ["KL", "TR"], when: "Oct 22" },
  { thread: 1, state: "Decided", title: "The swipe dot vibrates like a purr", why: "Cats feel a 25 Hz buzz through their paws", who: ["TR"], when: "Oct 22" },
  { thread: 2, state: "Changed", title: "Swap brand red for blue and yellow", why: "Cats can't see red", who: ["TR", "MC"], when: "Oct 24" },
  { thread: 0, state: "Decided", title: "Use motion to catch a cat's attention", why: "Luna only pounced on what moved", who: ["TR"], when: "Oct 22" },
  { thread: 3, state: "Open", title: "Keep the promo video to 15 seconds", why: "Waiting on the first cut", who: ["MC", "CH"], when: "Oct 28" },
]
const STATE_TONE: Record<string, [string, string]> = { Decided: [C.leafWash, C.leafInk], Changed: [C.apricotWash, C.apricotInk], Open: [C.subtle, C.muted] }

function ProductWindow() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white text-left" style={{ boxShadow: `0 0 0 1px ${C.line}, 0 30px 60px -36px rgba(46,57,34,.35)` }}>
      <div className="flex h-10 items-center gap-1.5 border-b px-4" style={{ borderColor: C.line }}>
        {[0, 1, 2].map((i) => <span key={i} className="size-2.5 rounded-full" style={{ background: C.line }} />)}
        <span className="mx-auto font-mono text-[11px]" style={{ color: C.muted }}>whyspace.app/whiskr</span>
      </div>
      <div className="grid md:grid-cols-[200px_1fr]">
        <aside className="hidden border-r p-3 text-[13px] md:block" style={{ borderColor: C.line, background: C.subtle }}>
          <div className="flex items-center gap-2 px-2 py-1.5 font-medium"><WhyspaceMark title={null} className="w-4" />Whiskr</div>
          <div className="mt-2 space-y-0.5">
            <div className="rounded-md bg-white px-2 py-1.5 font-medium" style={{ boxShadow: `0 0 0 1px ${C.line}` }}>Home</div>
            <div className="px-2 py-1.5" style={{ color: C.muted }}>Tasks</div>
          </div>
          <Label className="mt-5 mb-1.5 px-2 text-[10px]">Threads</Label>
          {THREADS.map(([name, color]) => (
            <div key={name} className="flex items-center gap-2 px-2 py-1.5"><span className="size-2 rounded-full" style={{ background: color }} />{name}</div>
          ))}
        </aside>
        <div className="relative p-5 md:p-6">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-b pb-3" style={{ borderColor: C.line }}>
            <div className="font-serif text-[24px] leading-none">Home</div>
            <div className="flex gap-5 text-[13px]" style={{ color: C.muted }}>
              {["Overview", "Tasks", "Decisions", "Artifacts"].map((t) => (
                <span key={t} className={cn("pb-0.5", t === "Decisions" && "font-medium")} style={t === "Decisions" ? { color: C.forest, boxShadow: `0 2px 0 ${C.forest}` } : undefined}>{t}</span>
              ))}
            </div>
          </div>
          <table className="mt-2 w-full text-[13px]">
            <thead>
              <tr className="text-left">
                {["Thread", "Decision", "Why", "Who", ""].map((h, i) => (
                  <th key={i} className={cn("py-2.5 pr-4 font-mono text-[10px] font-normal tracking-[0.08em] uppercase", (i === 2 || i === 3) && "hidden lg:table-cell", i === 0 && "hidden sm:table-cell")} style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => {
                const [bg, ink] = STATE_TONE[r.state]
                return (
                  <tr key={r.title} className="border-t" style={{ borderColor: C.line }}>
                    <td className="hidden py-3 pr-4 whitespace-nowrap sm:table-cell"><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: THREADS[r.thread][1] }} />{THREADS[r.thread][0]}</span></td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium" style={{ background: bg, color: ink }}>{r.state}</span>
                        <span className="font-medium">{r.title}</span>
                      </div>
                    </td>
                    <td className="hidden py-3 pr-4 lg:table-cell" style={{ color: C.muted }}>{r.why}</td>
                    <td className="hidden py-3 pr-4 lg:table-cell"><div className="flex -space-x-1.5">{r.who.map((w) => <Avatar key={w} who={w} />)}</div></td>
                    <td className="py-3 text-right font-mono text-[11px] whitespace-nowrap" style={{ color: C.muted }}>{r.when}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="lp-toast absolute top-4 right-5 hidden items-center gap-2.5 rounded-lg bg-white px-3.5 py-2.5 text-[13px] sm:flex" style={{ boxShadow: `0 0 0 1px ${C.line}, 0 12px 30px -16px rgba(46,57,34,.4)` }}>
            <span className="size-2 rounded-full" style={{ background: C.leaf }} />
            <span className="font-medium">Decision caught</span>
            <span style={{ color: C.muted }}>Footage review · just now</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const HOPS: { who: ReactNode; left: number }[] = [
  { who: "Meeting", left: 100 },
  { who: "Designer", left: 65 },
  { who: "Engineer", left: 30 },
  { who: <span className="inline-flex items-center gap-1.5"><ToolLogo tool="Claude Code" className="size-3.5" />Claude Code</span>, left: 5 },
]

function Problem() {
  return (
    <Section
      className="py-24"
      art={
        <>
          <Side side="right" top={10} width={155} rotate={4} delay={150}><Note text="Why did we pick this?" color={C.rose} ink={C.roseInk} seed={3} width={155} /></Side>
          <Side side="right" top={230} width={150} rotate={-4} delay={400}><Note text="Who decided that?" color={C.apricot} ink={C.apricotInk} seed={9} width={150} /></Side>
        </>
      }
    >
      <Reveal>
        <Label>The problem</Label>
        <H2 className="mt-4">Work moves on. <span style={{ color: C.muted }}>The why stays behind.</span></H2>
      </Reveal>
      <Reveal delay={120} className="mt-12">
        <div className="grid rounded-2xl sm:grid-cols-4" style={{ boxShadow: `inset 0 0 0 1px ${C.line}` }}>
          {HOPS.map((h, i) => (
            <div key={i} className={cn("relative p-5", i > 0 && "border-t sm:border-t-0 sm:border-l")} style={{ borderColor: C.line }}>
              <Label className="text-[11px]">0{i + 1}</Label>
              <div className="mt-2 text-[15px] font-medium">{h.who}</div>
              <div className="mt-6 flex items-center justify-between font-mono text-[11px]" style={{ color: C.muted }}>
                <span>Why left</span>
                <span>{h.left}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: C.subtle }}>
                <div className="h-full rounded-full" style={{ width: `${h.left}%`, background: C.forest, opacity: 0.35 + h.left / 160 }} />
              </div>
              {i < HOPS.length - 1 && <ChevronRight className="absolute top-1/2 -right-2.5 z-10 hidden size-5 -translate-y-1/2 rounded-full bg-white sm:block" style={{ color: C.muted }} />}
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  )
}

function HowItWorks() {
  return (
    <Section id="how" className="py-24">
      <Reveal>
        <Label>How it works</Label>
        <H2 className="mt-4">Catch it. Keep it. Carry it.</H2>
      </Reveal>
      <Reveal delay={120} className="mt-12">
        <div className="grid overflow-hidden rounded-2xl md:grid-cols-3" style={{ boxShadow: `inset 0 0 0 1px ${C.line}` }}>
          <Step n="01" title="Catch" line="Whyspace catches decisions as they happen." first wash={C.skyWash} seed={11}>
            <div className="space-y-2.5">
              <Line who="KL" t="12:04" text="What if the dot works on the billboard too?" />
              <Line who="TR" t="12:05" text="Then it's one system. Let's do it." mark />
              <span className="inline-flex items-center gap-1.5 rounded bg-white px-2 py-1 text-[11px] font-medium" style={{ color: C.leafInk }}><Check className="size-3" />Decision caught</span>
            </div>
          </Step>
          <Step n="02" title="Keep" line="Each decision lands in its thread, with the why, the options and the proof." wash={C.apricotWash} seed={17}>
            <div className="text-[12.5px] font-medium">A moving dot shows cats where to swipe</div>
            <dl className="mt-3 grid grid-cols-[72px_1fr] gap-x-2 gap-y-2 text-[12px]">
              {[["Why", "Works on app, billboard, video"], ["Ruled out", "Wiggling card, feather"], ["Proof", "Clip · Luna at 5:55"], ["Thread", "App"]].map(([k, v]) => (
                <div key={k} className="contents"><dt className="font-mono text-[10px] tracking-[0.06em] uppercase" style={{ color: C.muted }}>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </Step>
          <Step n="03" title="Carry" line="Hand work to a teammate or an AI tool, and the why goes with it." dark>
            <div className="font-mono text-[11.5px] leading-[1.8]" style={{ color: "#E8EEDF" }}>
              <div><span style={{ color: C.apricot }}>›</span> why does the dot move?</div>
              <div className="opacity-60">whyspace · App thread</div>
              <div><span style={{ color: "#9CC27A" }}>✓</span> 3 decisions, 1 clip</div>
            </div>
          </Step>
        </div>
      </Reveal>
    </Section>
  )
}

function Step({ n, title, line, first, dark, wash, seed, children }: { n: string; title: string; line: string; first?: boolean; dark?: boolean; wash?: string; seed?: number; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col p-6", !first && "border-t md:border-t-0 md:border-l")} style={{ borderColor: C.line }}>
      <Label className="text-[11px]">{n}</Label>
      <h3 className="mt-3 font-serif text-[30px] leading-none">{title}</h3>
      <p className="mt-3 text-[15px] leading-relaxed" style={{ color: C.muted }}>{line}</p>
      <div className="mt-auto pt-6">
        {wash ? (
          <PaintSurface color={wash} seed={seed} level="soft" radius={14}><div className="p-4">{children}</div></PaintSurface>
        ) : (
          <div className="rounded-xl p-4" style={{ background: dark ? C.forestDeep : C.subtle }}>{children}</div>
        )}
      </div>
    </div>
  )
}

function Line({ who, t, text, mark }: { who: string; t: string; text: string; mark?: boolean }) {
  return (
    <div className="flex gap-2 text-[12.5px]">
      <Avatar who={who} />
      <div>
        <span className="font-mono text-[10px]" style={{ color: C.muted }}>{t}</span>
        <div style={mark ? { background: `linear-gradient(transparent 55%, ${C.leafWash} 55%)` } : undefined}>{text}</div>
      </div>
    </div>
  )
}

function Record() {
  return (
    <Section className="py-24">
      <div className="grid items-center gap-12 md:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <Label>The record</Label>
          <H2 className="mt-4">Every decision, with its why.</H2>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed" style={{ color: C.muted }}>Who decided, what was ruled out, and the proof behind it. Readable by your team and your AI tools.</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {["Claude", "Cursor", "Figma", "Perplexity"].map((t) => (
              <span key={t} className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-[13px]" style={{ boxShadow: `inset 0 0 0 1px ${C.line}` }}>
                <ToolLogo tool={t} className="size-3.5" />{t}
              </span>
            ))}
          </div>
        </Reveal>
        <Reveal delay={150}><DecisionCard /></Reveal>
      </div>
    </Section>
  )
}

function DecisionCard() {
  return (
    <div className="rounded-2xl bg-white p-6 md:p-7" style={{ boxShadow: `0 0 0 1px ${C.line}, 0 30px 60px -40px rgba(46,57,34,.35)` }}>
      <div className="flex items-center gap-2 text-[12px] font-medium">
        <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5" style={{ background: C.subtle }}><span className="size-2 rounded-full" style={{ background: C.leaf }} />App</span>
        <span className="rounded px-2 py-0.5" style={{ background: C.leafWash, color: C.leafInk }}>Decided</span>
      </div>
      <h3 className="mt-4 font-serif text-[26px] leading-[1.15]">A moving dot shows cats where to swipe</h3>
      <PaintSurface color={C.apricotWash} seed={27} level="soft" radius={14} className="mt-5">
        <div className="p-4">
          <Label className="text-[10px]">Why</Label>
          <p className="mt-1 text-[15px]">It works on the app, the billboard and the video.</p>
        </div>
      </PaintSurface>
      <Label className="mt-5 text-[10px]">Ruled out</Label>
      <ul className="mt-2 space-y-1.5 text-[14px]">
        <li className="flex flex-col sm:flex-row sm:justify-between sm:gap-4"><span className="line-through" style={{ textDecorationColor: C.rose }}>A wiggling card</span><span style={{ color: C.muted }}>Hard for a paw to hit</span></li>
        <li className="flex flex-col sm:flex-row sm:justify-between sm:gap-4"><span className="line-through" style={{ textDecorationColor: C.rose }}>A dangling feather</span><span style={{ color: C.muted }}>Covered the photo</span></li>
      </ul>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: C.line }}>
        <div className="flex items-center gap-2.5">
          <div className="flex -space-x-2">{[face1, face2].map((f) => <img key={f} src={f} alt="" className="size-7 rounded-full object-cover ring-2 ring-white" />)}</div>
          <span className="font-mono text-[11px]" style={{ color: C.muted }}>Oct 22</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px]" style={{ background: C.subtle }}><ToolLogo tool="Claude Code" className="size-3.5" />Sent to Claude Code</span>
      </div>
    </div>
  )
}

function Together() {
  return (
    <Section
      className="py-28"
      art={
        <>
          <Side side="left" top={40} width={175} rotate={-3} delay={100}><img src={illPeople} alt="" className="w-full" /></Side>
        </>
      }
    >
      <Reveal className="text-center">
        <Label>Why it matters</Label>
        <H2 className="mx-auto mt-4 max-w-2xl">Collaboration, not alignment.</H2>
        <p className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed" style={{ color: C.muted }}>
          Less time re-explaining, more time making things together. Over time, Whyspace learns how your team decides.
        </p>
      </Reveal>
    </Section>
  )
}

const PLANS = [
  { name: "Free", price: "$0", per: "", points: ["Up to 5 people", "5 projects", "Decisions and threads"], cta: "Start free", featured: false },
  { name: "Pro", price: "$12", per: "per person / month", points: ["Unlimited projects", "Misalignment alerts", "Hand off to AI tools"], cta: "Start Pro", featured: true },
  { name: "Business", price: "$24", per: "per person / month", points: ["Everything in Pro", "Admin and SSO", "Priority support"], cta: "Talk to us", featured: false },
]

function Pricing() {
  return (
    <Section id="pricing" className="py-24">
      <Reveal>
        <Label>Pricing</Label>
        <H2 className="mt-4">Start alone. Bring your team.</H2>
      </Reveal>
      <Reveal delay={120} className="mt-12">
        <div className="grid overflow-hidden rounded-2xl md:grid-cols-3" style={{ boxShadow: `inset 0 0 0 1px ${C.line}` }}>
          {PLANS.map((p, i) => (
            <div key={p.name} className={cn("flex flex-col p-7", i > 0 && "border-t md:border-t-0 md:border-l")} style={p.featured ? { background: C.forest, color: C.paper, borderColor: C.forest } : { borderColor: C.line, background: "white" }}>
              <div className="font-mono text-[12px] tracking-[0.08em] uppercase" style={{ opacity: 0.7 }}>{p.name}</div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-serif text-[48px] leading-none">{p.price}</span>
                {p.per && <span className="text-[13px]" style={{ opacity: 0.7 }}>{p.per}</span>}
              </div>
              <ul className="mt-7 mb-9 space-y-2.5 text-[15px]">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-2.5"><Check className="size-4 shrink-0" style={{ color: p.featured ? C.apricot : C.leaf }} />{pt}</li>
                ))}
              </ul>
              <Button variant={p.featured ? "paper" : "ghost"} className="mt-auto w-full" onClick={() => navigate("/signup")}>{p.cta}</Button>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  )
}

const STRANDS = [{ w: 70, color: C.rose }, { w: 50, color: C.leaf }, { w: 130, color: C.apricot }, { w: 50, color: C.sky }]

function Closing() {
  const [ref, shown] = useInView<HTMLElement>()
  return (
    <footer ref={ref} className={cn("relative overflow-hidden pt-20", shown && "lp-in")} style={{ background: C.forest, color: C.paper }}>
      <div aria-hidden className="pointer-events-none mx-auto mb-12 w-[min(420px,80%)]">
        <Strands strands={STRANDS} seed={12} animate height={110} />
      </div>
      <div className="relative mx-auto max-w-[640px] px-6 text-center">
        <h2 className="font-serif text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.02] tracking-[-0.025em]">Keep the why with the work.</h2>
        <div className="mt-9 flex justify-center">
          <Button variant="paper" onClick={() => navigate("/signup")}>Start free <ArrowRight className="size-4" /></Button>
        </div>
      </div>
      <div className="mx-auto mt-24 flex max-w-[1040px] flex-wrap items-center gap-x-8 gap-y-3 border-t px-6 py-7 text-[13px]" style={{ borderColor: "#ffffff22" }}>
        <div className="flex items-center gap-2">
          <WhyspaceLockup variant="beside" tone="paper" className="w-[104px]" />
        </div>
        <span className="font-mono text-[11px]" style={{ opacity: 0.6 }}>whyspace.app</span>
        <span className="ml-auto font-mono text-[11px]" style={{ opacity: 0.6 }}>© 2026 Whyspace</span>
      </div>
    </footer>
  )
}
