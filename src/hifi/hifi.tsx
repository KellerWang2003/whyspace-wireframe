import { useEffect } from "react"
import "@fontsource-variable/inter-tight"
import "@fontsource-variable/bricolage-grotesque"
import "@fontsource-variable/figtree"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"
import { STYLES, type Page } from "./model"
import { Screens } from "./screens"

// High-fi playground (#/hifi/<style>/<page>): Keller's Today and empty Decisions screens from Figma,
// in the three style tiles from Figma. The work stays plain and fast to scan in every style; each
// style's fun visuals appear only in empty states, the title's corner and the quiet rail bottom.

const PAGES: { id: Page; label: string }[] = [{ id: "today", label: "Today" }, { id: "decisions", label: "Decisions" }]

const CSS = `
/* Shared gesture: Style tile 02. Warm cream, heavy grotesque, olive, ribbons passed between hands. */
.hf[data-style=gesture]{--bg:#FAF7EF;--surface:#FCFBF8;--raised:#FFFFFF;--text:#303A2C;--muted:#71766A;--faint:#A7A99D;--line:#E9E3D6;--line-strong:#D8CFBD;
--accent:#657D3C;--dark:#3B4B2D;--primary:#657D3C;--primary-ink:#FCFBF8;--primary-hover:#566B32;
--rail:#F4F0E5;--rail-ink:#303A2C;--rail-active:#E6E9D7;--rail-line:#E5DFD1;--side:#F6F2E8;--side-ink:#303A2C;--side-muted:#7C7F72;--side-active:#FCFBF8;
--badge:#E575A0;--badge-ink:#FFFFFF;--pill:#303A2C;--pill-ink:#FAF7EF;--thread:#657D3C;--status:#DDA064;
--av-a:#F3DFC3;--av-a-ink:#7A4E1D;--av-b:#DCE7EE;--av-b-ink:#2F5870;
--font-display:"Inter Tight Variable",ui-sans-serif,system-ui,sans-serif;--font-body:"Inter Tight Variable",ui-sans-serif,system-ui,sans-serif;
--title-weight:800;--title-track:-0.035em;--h2-weight:700;--radius:14px;--radius-btn:10px;--radius-input:10px}
/* Open weave: the Common ground tile. Riso cream, forest, vermilion, mustard, lavender, woven tape. */
.hf[data-style=weave]{--bg:#F7ECD9;--surface:#FBF4E6;--raised:#FFF9EF;--text:#1F3324;--muted:#6C6756;--faint:#A39C86;--line:#E4D6BC;--line-strong:#C9B795;
--accent:#D9552B;--dark:#24402B;--vermilion:#D9552B;--mustard:#EBA53C;--lavender:#B38BD3;--primary:#D9552B;--primary-ink:#FFF6E8;--primary-hover:#C64A23;
--rail:#24402B;--rail-ink:#F7ECD9;--rail-active:rgba(247,236,217,.13);--rail-line:rgba(247,236,217,.2);--side:#2D4C33;--side-ink:#F7ECD9;--side-muted:rgba(247,236,217,.6);--side-active:rgba(247,236,217,.1);
--badge:#EBA53C;--badge-ink:#1F3324;--pill:#D9552B;--pill-ink:#FFF6E8;--thread:#D9552B;--status:#EBA53C;
--av-a:#EBA53C;--av-a-ink:#1F3324;--av-b:#B38BD3;--av-b-ink:#1F3324;
--font-display:"Bricolage Grotesque Variable",ui-sans-serif,system-ui,sans-serif;--font-body:"Instrument Sans Variable",ui-sans-serif,system-ui,sans-serif;
--title-weight:800;--title-track:-0.03em;--h2-weight:700;--radius:4px;--radius-btn:3px;--radius-input:3px}
/* Studio: Style tile 01. Near white, mint, deep green Figtree, photos under green glass. */
.hf[data-style=studio]{--bg:#FAFAFA;--surface:#FFFFFF;--raised:#FFFFFF;--text:#216247;--muted:#5F7D73;--faint:#9DB2AB;--line:#D5E4E0;--line-strong:#BFD4CE;
--accent:#366A62;--dark:#216247;--mint:#EDF3F1;--primary:#35926B;--primary-ink:#101812;--primary-hover:#2F8460;
--rail:#FFFFFF;--rail-ink:#216247;--rail-active:#EDF3F1;--rail-line:#D5E4E0;--side:#FFFFFF;--side-ink:#216247;--side-muted:#7F9A91;--side-active:#EDF3F1;
--badge:#B64A4B;--badge-ink:#FFFFFF;--pill:#216247;--pill-ink:#FFFFFF;--thread:#35926B;--status:#35926B;
--av-a:#EDF3F1;--av-a-ink:#216247;--av-b:#F2DDDF;--av-b-ink:#6C303C;
--font-display:"Figtree Variable",ui-sans-serif,system-ui,sans-serif;--font-body:"Figtree Variable",ui-sans-serif,system-ui,sans-serif;
--title-weight:700;--title-track:-0.04em;--h2-weight:700;--radius:12px;--radius-btn:12px;--radius-input:12px}

.hf{background:var(--bg);color:var(--text);font-family:var(--font-body);-webkit-font-smoothing:antialiased}
.hf ::selection{background:color-mix(in srgb,var(--accent) 22%,transparent)}
.hf-title{font-family:var(--font-display);font-size:38px;font-weight:var(--title-weight);letter-spacing:var(--title-track);line-height:1}
.hf-h2{font-family:var(--font-display);font-size:16px;font-weight:var(--h2-weight);letter-spacing:-0.01em}
.hf-date{color:var(--muted);font-size:14px}
.hf-muted{color:var(--muted)}
.hf-count{font-family:var(--font-body);font-size:14px;font-weight:500;letter-spacing:0;color:var(--muted)}
.hf-empty{font-family:var(--font-display);font-size:20px;font-weight:var(--h2-weight);letter-spacing:-0.015em}
.hf-empty-lg{font-family:var(--font-display);font-size:30px;font-weight:var(--title-weight);letter-spacing:var(--title-track);line-height:1.1}
.hf-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius)}
.hf-row{border-radius:calc(var(--radius) - 4px);transition:background .15s}
.hf-row:hover{background:color-mix(in srgb,var(--text) 5%,transparent)}
.hf-pill{background:var(--pill);color:var(--pill-ink);font-size:11px;font-weight:600;line-height:18px;padding:0 7px;border-radius:999px;white-space:nowrap}
.hf-btn{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 14px;font-size:13.5px;font-weight:600;border-radius:var(--radius-btn);white-space:nowrap;transition:background .15s,transform .1s,box-shadow .1s}
.hf-btn-primary{background:var(--primary);color:var(--primary-ink)}
.hf-btn-primary:hover{background:var(--primary-hover)}
.hf-btn-secondary{border:1.5px solid var(--text);color:var(--text)}
.hf-btn-secondary:hover{background:color-mix(in srgb,var(--text) 6%,transparent)}
.hf-btn-ghost{height:28px;padding:0 8px;font-size:12.5px;font-weight:500;color:var(--muted)}
.hf-input{background:var(--surface);border:1px solid var(--line-strong);border-radius:var(--radius-input);font-size:13.5px}
.hf-input input::placeholder{color:var(--faint)}
.hf-badge{background:var(--badge);color:var(--badge-ink);border-radius:999px}
.hf-avatar-a{background:var(--av-a);color:var(--av-a-ink)}
.hf-avatar-b{background:var(--av-b);color:var(--av-b-ink)}
.hf-avatar-ring{box-shadow:0 0 0 2px var(--bg)}
.hf-project-tile{border-radius:calc(var(--radius-btn) - 2px);background:color-mix(in srgb,var(--text) 6%,transparent);color:var(--text)}
.hf-tile-whiskr{background:var(--primary);color:var(--primary-ink)}
.hf-thread-dot{background:var(--thread)}
.hf-status-prog{color:var(--status)}
.hf-check{border:1.5px solid var(--line-strong);border-radius:4px}
.hf-tab{position:relative;display:inline-flex;align-items:center;height:36px;padding:0 10px;font-size:13.5px;color:var(--muted)}
.hf-tab[aria-selected=true]{color:var(--text);font-weight:600}
.hf-seg{gap:2px;padding:3px;border-radius:var(--radius-btn);background:color-mix(in srgb,var(--text) 6%,transparent)}
.hf-seg button{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border-radius:calc(var(--radius-btn) - 3px);font-size:13px;color:var(--muted)}
.hf-seg button[aria-pressed=true]{background:var(--surface);color:var(--text);font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.hf-table th{padding:10px 8px;font-size:12.5px;font-weight:500;color:var(--muted);border-bottom:1px solid var(--line)}
.hf-table td{padding:12px 8px;border-bottom:1px solid var(--line)}
.hf-board-col{background:color-mix(in srgb,var(--text) 4%,transparent);border-radius:var(--radius)}
.hf-rail{background:var(--rail);color:var(--rail-ink);border-right:1px solid var(--rail-line)}
.hf-rail-btn{position:relative;display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:calc(var(--radius) - 3px);color:var(--rail-ink)}
.hf-rail-btn:hover,.hf-rail-btn[aria-current=page]{background:var(--rail-active)}
.hf-rail-btn .hf-badge{position:absolute;top:1px;right:1px}
.hf-rail-muted{opacity:.6}
.hf-rail-rule{background:var(--rail-line)}
.hf-rail-tile{display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:calc(var(--radius-btn) - 3px)}
.hf-rail-tile svg{width:16px!important;height:16px!important}
.hf-me{border-radius:999px;background:var(--rail-ink);color:var(--rail)}
.hf-side{background:var(--side);color:var(--side-ink);border-right:1px solid var(--rail-line)}
.hf-side-title{font-family:var(--font-display);font-size:15px;font-weight:700;letter-spacing:-0.01em}
.hf-side-item{border-radius:calc(var(--radius) - 4px);font-size:14px}
.hf-side-item:hover{background:var(--side-active)}
.hf-side-item[aria-current=page]{background:var(--side-active);font-weight:600}
.hf-side-label{font-size:12px;color:var(--side-muted)}
.hf-icon-btn{border-radius:calc(var(--radius-btn) - 3px);color:var(--side-muted)}
.hf-icon-btn:hover{background:var(--side-active)}
.hf-coming{background:var(--surface);border-left:1px solid var(--line)}
.hf-day{font-size:12.5px;font-weight:500;color:var(--muted)}
.hf-time{font-size:13px;color:var(--muted)}
.hf-ask{border-radius:999px;background:var(--surface);border:1px solid var(--line-strong);color:var(--text);box-shadow:0 4px 14px rgba(0,0,0,.06)}

/* Shared gesture */
.hf[data-style=gesture] .hf-coming{background:var(--bg)}
.hf[data-style=gesture] .hf-side-item[aria-current=page]{box-shadow:inset 0 0 0 1.5px var(--line-strong)}

/* Open weave */
.hf[data-style=weave] .hf-rail,.hf[data-style=weave] .hf-side{border-right:0}
.hf[data-style=weave] .hf-rail-btn[aria-current=page]::before{content:"";position:absolute;left:-9px;top:8px;bottom:8px;width:4px;background:var(--mustard)}
.hf[data-style=weave] .hf-side-item[aria-current=page]{position:relative;box-shadow:inset 4px 0 0 var(--mustard)}
.hf[data-style=weave] .hf-side-label,.hf[data-style=weave] .hf-day{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.hf[data-style=weave] .hf-icon-btn{color:var(--side-muted)}
.hf[data-style=weave] .hf-me{background:var(--mustard);color:var(--dark);border-radius:3px}
.hf[data-style=weave] .hf-tile-whiskr{background:var(--mustard);color:var(--dark)}
.hf[data-style=weave] .hf-project-tile{background:transparent;box-shadow:inset 0 0 0 1.5px var(--text)}
.hf[data-style=weave] .hf-project-tile.hf-tile-whiskr{background:var(--vermilion);color:var(--primary-ink);box-shadow:none}
.hf[data-style=weave] .hf-h2{font-size:18px}
.hf[data-style=weave] .hf-card{border:1.5px solid var(--line-strong)}
.hf[data-style=weave] .hf-btn-primary{box-shadow:3px 3px 0 var(--dark)}
.hf[data-style=weave] .hf-btn-primary:active{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--dark)}
.hf[data-style=weave] .hf-btn-secondary{background:var(--raised)}
.hf[data-style=weave] .hf-tab[aria-selected=true]::after{content:"";position:absolute;left:10px;right:10px;bottom:2px;height:4px;background:var(--mustard)}
.hf[data-style=weave] .hf-seg{gap:0;padding:0;background:transparent;box-shadow:inset 0 0 0 1.5px var(--text)}
.hf[data-style=weave] .hf-seg button{height:34px;border-radius:0;padding:0 12px}
.hf[data-style=weave] .hf-seg button[aria-pressed=true]{background:var(--text);color:var(--bg);box-shadow:none}
.hf[data-style=weave] .hf-table th,.hf[data-style=weave] .hf-table td{border-bottom:1.5px dashed var(--line-strong)}
.hf[data-style=weave] .hf-coming{background:var(--surface);border-left:1.5px dashed var(--line-strong)}
.hf[data-style=weave] .hf-ask{border-radius:3px;background:var(--mustard);border:1.5px solid var(--dark);box-shadow:3px 3px 0 var(--dark)}

/* Studio */
.hf[data-style=studio] .hf-tabs{gap:2px;padding:3px;border-radius:12px;background:var(--mint)}
.hf[data-style=studio] .hf-tab{height:30px;padding:0 12px;border-radius:9px}
.hf[data-style=studio] .hf-tab[aria-selected=true]{background:var(--primary);color:#FFFFFF}
.hf[data-style=studio] .hf-seg{background:var(--mint)}
.hf[data-style=studio] .hf-seg button[aria-pressed=true]{background:var(--primary);color:#FFFFFF;box-shadow:none}
.hf[data-style=studio] .hf-project-tile{background:var(--mint);color:var(--text)}
.hf[data-style=studio] .hf-tile-whiskr{background:var(--text);color:#FFFFFF}
.hf[data-style=studio] .hf-me{background:var(--text);color:#FFFFFF}
.hf[data-style=studio] .hf-ask{background:var(--mint);border-color:var(--line)}
`

export function HiFi({ style, page }: { style?: string; page?: string }) {
  const current = STYLES.find((s) => s.id === style) ?? STYLES[0]
  const at: Page = page === "decisions" ? "decisions" : "today"
  const go = (next: Page) => navigate(`/hifi/${current.id}/${next}`)

  // 1, 2 and 3 switch styles; T and D switch screens.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null
      if (e.metaKey || e.ctrlKey || e.altKey || el?.closest("input, textarea, [contenteditable=true]")) return
      const n = Number(e.key)
      if (n >= 1 && n <= STYLES.length) navigate(`/hifi/${STYLES[n - 1].id}/${at}`)
      else if (e.key === "t") navigate(`/hifi/${current.id}/today`)
      else if (e.key === "d") navigate(`/hifi/${current.id}/decisions`)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [current.id, at])

  return (
    <div className="hf relative h-svh w-full overflow-hidden" data-style={current.id}>
      <style>{CSS}</style>
      <Screens style={current.id} page={at} go={go} />
      <nav aria-label="High-fi playground" className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#1d1f1c]/92 p-1 font-sans text-[13px] text-white shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur">
        {STYLES.map((s) => <Seg key={s.id} on={s.id === current.id} onClick={() => navigate(`/hifi/${s.id}/${at}`)}>{s.label}</Seg>)}
        <span aria-hidden className="mx-1 h-5 w-px bg-white/20" />
        {PAGES.map((p) => <Seg key={p.id} on={p.id === at} onClick={() => go(p.id)}>{p.label}</Seg>)}
      </nav>
    </div>
  )
}

function Seg({ on, onClick, children }: { on: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={cn("h-8 rounded-full px-3.5 font-medium transition-colors", on ? "bg-white text-[#1d1f1c]" : "text-white/70 hover:text-white")}>
      {children}
    </button>
  )
}
