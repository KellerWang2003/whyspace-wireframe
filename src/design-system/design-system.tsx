import { useEffect, useRef, useState, type MouseEvent, type ReactNode, type RefObject } from "react"
import { MarkIcon } from "@/components/app/status-badge"
import { cn } from "@/lib/utils"
import { ButtonsSection, BadgesSection, CardSection, ChoicesSection, EmptySection, InputsSection, OverlaysSection, PeopleSection, PlacesSection, RowsSection, TableSection, TabsSection } from "./components"
import { ColorSection, ElevationSection, IconsSection, MarksSection, RadiusSection, SpacingSection, TypeSection } from "./foundations"
import { MessagesSection, NeedsSection, RailSection } from "./app-parts"
import { IllustrationsSection } from "./illustrations"
import { LogoSection } from "./logo"
import { ExplorationsSection } from "./explorations"
import { Section, StateMark } from "./kit"
import { SECTIONS, STATE, type SectionId, type State } from "./model"
import { useHifi } from "@/lib/hifi"

// Design system (#/design-system, #/design-system/<section>): the home for the high-fi foundations and
// components. Everything on it is the real thing: tokens read from index.css, components imported
// from the app. Each part carries where it stands, so the page doubles as the high-fi checklist.

// Color reads the live tokens as it renders, so it remounts when the High-fi switch flips.
const RENDER: Record<SectionId, (hifi: boolean) => ReactNode> = {
  logo: () => <LogoSection />,
  type: () => <TypeSection />,
  color: (hifi) => <ColorSection key={hifi ? "hifi" : "wire"} />,
  marks: () => <MarksSection />,
  icons: () => <IconsSection />,
  illustrations: () => <IllustrationsSection />,
  spacing: () => <SpacingSection />,
  radius: () => <RadiusSection />,
  elevation: () => <ElevationSection />,
  buttons: () => <ButtonsSection />,
  badges: () => <BadgesSection />,
  inputs: () => <InputsSection />,
  choices: () => <ChoicesSection />,
  tabs: () => <TabsSection />,
  overlays: () => <OverlaysSection />,
  people: () => <PeopleSection />,
  places: () => <PlacesSection />,
  rail: () => <RailSection />,
  rows: () => <RowsSection />,
  card: () => <CardSection />,
  needs: () => <NeedsSection />,
  messages: () => <MessagesSection />,
  table: () => <TableSection />,
  empty: () => <EmptySection />,
}

const GROUPS = ["Foundations", "Components"] as const
// Explorations sits after the system itself: the options we tried, kept for the record, not part of the high-fi count.
type NavId = SectionId | "explorations"
const IDS: NavId[] = [...SECTIONS.map((s) => s.id), "explorations"]
const HIGH_FI = SECTIONS.filter((s) => s.state === "hifi").length

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

// The section whose top has passed the upper quarter of the page.
function useCurrent(root: RefObject<HTMLElement | null>) {
  const [current, setCurrent] = useState<NavId>(IDS[0])
  useEffect(() => {
    const el = root.current
    if (!el) return
    const inView = new Map<string, boolean>()
    const watch = new IntersectionObserver((entries) => {
      for (const e of entries) inView.set(e.target.id, e.isIntersecting)
      // The lowest section in the band: the one whose top just came up, not the tail of the one before.
      const top = IDS.findLast((id) => inView.get(id))
      if (top) setCurrent(top)
    }, { root: el, rootMargin: "0px 0px -75% 0px" })
    for (const id of IDS) {
      const s = document.getElementById(id)
      if (s) watch.observe(s)
    }
    return () => watch.disconnect()
  }, [root])
  return current
}

export function DesignSystem({ section }: { section?: string }) {
  const scroller = useRef<HTMLDivElement>(null)
  const current = useCurrent(scroller)
  const hifi = useHifi()

  // A link that names a section opens on it.
  useEffect(() => {
    if (section) document.getElementById(section)?.scrollIntoView()
  }, [section])

  const go = (e: MouseEvent<HTMLAnchorElement>, id: NavId) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" })
    history.replaceState(null, "", `#/design-system/${id}`)
  }

  const nav = (className: string, itemClass: string) => (
    <nav aria-label="Design system" className={className}>
      {GROUPS.map((g) => (
        <div key={g} className="flex flex-col gap-1">
          <h2 className="mb-1 type-label text-muted-foreground">{g}</h2>
          <ul className={itemClass}>
            {SECTIONS.filter((s) => s.group === g).map((s) => (
              <li key={s.id}>
                <a href={`#/design-system/${s.id}`} onClick={(e) => go(e, s.id)} aria-current={current === s.id ? "location" : undefined}
                  className={cn("flex items-center gap-2 rounded-sm py-1 type-body whitespace-nowrap transition-colors hover:text-foreground", current === s.id ? "text-foreground" : "text-muted-foreground")}>
                  <MarkIcon mark={STATE[s.state].mark} className="size-3" />
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="flex flex-col gap-1">
        <h2 className="mb-1 type-label text-muted-foreground">Explorations</h2>
        <ul className={itemClass}>
          <li>
            <a href="#/design-system/explorations" onClick={(e) => go(e, "explorations")} aria-current={current === "explorations" ? "location" : undefined}
              className={cn("flex items-center gap-2 rounded-sm py-1 type-body whitespace-nowrap transition-colors hover:text-foreground", current === "explorations" ? "text-foreground" : "text-muted-foreground")}>
              What we tried
            </a>
          </li>
        </ul>
      </div>
    </nav>
  )

  return (
    <div ref={scroller} className="h-svh overflow-y-auto bg-background text-foreground">
      <div className="mx-auto grid max-w-[1240px] gap-x-14 px-5 sm:px-8 md:grid-cols-[176px_minmax(0,1fr)] lg:px-12">
        <aside className="sticky top-0 hidden h-svh overflow-y-auto pt-14 pb-10 md:block">
          {nav("flex flex-col gap-7", "flex flex-col")}
        </aside>
        <main className="min-w-0 pt-14 pb-32">
          <header className="flex flex-col gap-5 pb-16">
            <h1 className="type-display">Design system</h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="type-body tabular-nums">{HIGH_FI} of {SECTIONS.length} high-fi</span>
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {(Object.keys(STATE) as State[]).map((s) => <StateMark key={s} state={s} />)}
              </span>
            </div>
          </header>
          {nav("mb-12 flex gap-8 overflow-x-auto pb-2 md:hidden [scrollbar-width:none]", "flex flex-col")}
          {SECTIONS.map((s) => (
            <Section key={s.id} id={s.id} title={s.label} state={s.state}>{RENDER[s.id](hifi)}</Section>
          ))}
          <Section id="explorations" title="Explorations"><ExplorationsSection /></Section>
        </main>
      </div>
    </div>
  )
}
