# Kurisu skin — live DOM contract (DSH Desktop NEXT)

Investigation date: 2026-11-08. Read-only. Source archive:
`<install>\AppData\Local\Programs\DSH NEXT\resources\app.asar`
(`app.asar!/…` below = a path inside that archive). Extracted copies live under
`<workspace>\kurisu-skin\research\`; abbreviations:

* **`$X`** = `…\research\asar-extract\node_modules\@deepseek-ai\`
* **`$E`** = `…\research\embedded-css\` (shipped CSS de-embedded from the JS bundles; one rule per line so line numbers are quotable)
* **`$F`** = `…\research\frontend-css\` (raw `.css` files pulled from the asar by `extract-css.mjs`)
* **`$P`** = `<home>\.dsh\profiles\desktop\node_modules\` (installed profile plugins — read only)

Everything is **observed in shipped source** unless marked `[inference]`.
Build: `dsh-desktop-next 2.0.19-next` / `@deepseek-ai/dsh-*` `0.2.1-rc.2`
(see `research\ui-theme-contract.md`).

> **HASH CLASS NAMES**: the UI is CSS-modules with **build-local hashes**
> (`MnhYfG_frame`, `bJOniG_root`, `VERcba_root`, `fDq-QG_bubble`, `_pill_1bqmh_1`, …).
> These are stable for THIS build but change on any rebuild. Prefer `data-*` /
> structural selectors where possible; the hashes are quoted because they are
> exactly what this build renders.

---

## 0. TL;DR — paste-ready selectors

```css
/* ★ WALLPAPER TARGET (fills window; React parent of BOTH sidebar + chat) */
div.MnhYfG_frame { background-image:url("data:…"); background-size:cover;
                   background-position:center; }
/* opaque by default -> a body::before wallpaper is hidden behind it; see §2.2 */

/* sidebar shell + brand mark (mounted twice: expanded + rail) */
div.bJOniG_root { }
div.bJOniG_logoRow { }
span.bJOniG_brandMark > svg, span.bJOniG_railMark > svg { }

/* icons: inline svg, no data-attr; target via parent control */
button.bJOniG_iconButton > svg, button.Fqqb4W_iconButton > svg { color:… }
/* they use stroke="currentColor" (FishLogo/brand/send use fill="currentColor") */

/* composer (conversation/InputBar) */
div.VERcba_card { }                 /* the input card */
div.VERcba_tools, div.VERcba_modes, div.VERcba_trailing { }  /* toolbar rows */
button.VERcba_add { }               /* round "+" 28px */
button.VERcba_primary { }           /* ★ round SEND/STOP 34px, bottom-right */
._pill_1bqmh_1 { }                  /* ★ composer toolbar pills (runtime hash) */
/* source-only name: .pill  ($F\…Pill.module.css:1) */

/* message bubbles */
.fDq-QG_bubble { }                  /* ★ USER bubble (--dsw-specific-bubble) */
._9ibABa_flowItem[data-chat-group-part="response"] { }  /* assistant: NO bubble */
[data-slot="conversation.chat.flow"] { }
```

---

## 1. Which of the requested packages actually exist

Extracted into `research\asar-extract\` with the existing 16-byte-preamble
reader (pattern from `find-browser-check.mjs` / `extract-css.mjs`; helper
`research\scratch\extract-packages.mjs`). All are scoped under
`node_modules/@deepseek-ai/`.

| Requested package | Exists? | Key files (bytes) |
|---|---|---|
| `@deepseek-ai/dsh-client-ui-layout` | **YES** | `lib/client.js` 32,883 (AppFrame — the root shell) |
| `dsh-client-ui-dockkit` | **NO** (no files / no package.json) | see note |
| `@deepseek-ai/dsh-client-ui-conversation` | **YES** | `lib/client.js` 774,824 (composer, header, slots) |
| `@deepseek-ai/dsh-client-ui-session` | **YES** | `lib/client.js` 39,988 |
| `@deepseek-ai/dsh-client-ui-renderer` | **YES** | `lib/client.js` 78,299 (slot renderer) |
| `@deepseek-ai/dsh-client-ui-primitives` | **YES** | `lib/index.js` 536,910 (icons, Pill) + 41 `.module.css` |
| `@deepseek-ai/dsh-client-ui-slots` | **YES** | `lib/index.js` 23,461 (slot core) |
| `@deepseek-ai/dsh-client-ui-sidebar` | **YES** | `lib/client.js` 32,151 (brand row, rail) |
| `@deepseek-ai/dsh-client-ui-settings` | **YES** | `lib/client.js` 57,756 |
| `dsh-client-ui-components` | **NO** | — |

**`dsh-client-ui-dockkit`** exists only as a **seed module** in the web boot
kernel, not an installable package. Shell static-module table
(`app.asar!/…/dsh-web-frontend/dist/assets/index-CN7NIWNw.js:190`, saved to
`research\web-frontend\index-CN7NIWNw.js`):

```js
…,"@deepseek-ai/dsh-client-ui-slots":SI,"@deepseek-ai/dsh-client-ui-primitives":zU,"@deepseek-ai/dsh-client-ui-dockkit":xZ}}
```

Its DOM hooks are `data-dockkit-pane` / `data-dockkit-tab` (same bundle, :188):

```js
function ax(e){const t=[];for(const r of e.querySelectorAll("[data-dockkit-pane]")){const i=r.dataset.dockkitPane;i!==void 0&&t.push([i,r])}return t}
```

There are ~45 `dsh-client-ui-*` packages total; notably
`dsh-client-ui-brand-official` (§3), `dsh-client-ui-chat` (§4.4),
`dsh-client-ui-goal`, `dsh-client-ui-user-questions`.

---

## 2. ROOT CONTAINER — the wallpaper element  ★PRIORITY★

**Answer: `div.MnhYfG_frame`** (the `AppFrame` component, registered as the
built-in `root` slot). It fills the window behind the sidebar and **is** the
React parent of BOTH the sidebar and the chat area.

### 2.1 Shipped CSS module class + full rule

Source `$X\dsh-client-ui-layout\lib\client.js:72–91` (injected CSS string
`AppFrame.module.css`); de-embedded with line numbers at
`$E\dsh-client-ui-layout__lib__client.css:2–85`. Class map
(`ui-layout/lib/client.js:82–91`):

```js
var AppFrame_module_css_default = {
  "bottomRow":"MnhYfG_bottomRow", "centerCol":"MnhYfG_centerCol",
  "frame":"MnhYfG_frame", "handle":"MnhYfG_handle",
  "leadingSeat":"MnhYfG_leadingSeat", "overlayLayer":"MnhYfG_overlayLayer",
  "rightbarCol":"MnhYfG_rightbarCol", "sidebarCol":"MnhYfG_sidebarCol"
};
```

Root rule (`$E\dsh-client-ui-layout__lib__client.css:2–13`, trimmed):

```css
.MnhYfG_frame{background:var(--dsw-alias-bg-base);
  grid-template-rows:minmax(0,1fr) auto; height:100%; display:grid;
  position:relative; overflow:hidden}
.MnhYfG_frame[data-animating]{transition:grid-template-columns var(--ds-transition-duration-slow) var(--ds-ease-in-out)}
.MnhYfG_frame[data-dragging]{transition:none}
[data-windows-titlebar] .MnhYfG_frame{--dsh-windows-content-radius:16px;
  box-sizing:border-box; padding-top:var(--dsh-windows-titlebar-height);
  background:var(--dsw-specific-sidebar-fill)}
[data-platform=darwin] .MnhYfG_frame{background:0 0}   /* transparent on macOS */
```

### 2.2 YES — it paints its own background

* **Default**: `background:var(--dsw-alias-bg-base)` (shorthand ⇒ a color).
* **Windows Electron** (`html[data-windows-titlebar]`): overridden to
  `background:var(--dsw-specific-sidebar-fill)`.
* **macOS** (`html[data-platform=darwin]`): `background:0 0` (transparent) —
  the per-column fills then show through.
* **No** `background-image` / `url(...)` on `.MnhYfG_frame`.

> `[inference]` Consequence: `.MnhYfG_frame` is opaque on default/Windows, so a
> `body::before` wallpaper is HIDDEN behind it. Put the image on
> `.MnhYfG_frame` itself (layers over its `background-color`), or make it
> translucent via `--dsw-alias-bg-base` / `--dsw-specific-sidebar-fill` and
> also neutralize `.MnhYfG_sidebarCol`, `.MnhYfG_bottomRow`, `.bJOniG_root`.
> Keep color tokens as COLORS (a gradient is invalid in `background-color:` —
> `research\ui-theme-contract.md:414–421`).

### 2.3 Semantic DOM structure (tag / data-* / nesting)

`ui-layout/lib/client.js:316–374` (trimmed):

```jsx
jsxs("div", {
  ref: frameRef,
  className: AppFrame_module_css_default.frame,        // "MnhYfG_frame"
  style: { gridTemplateColumns: `${cols.sidebar}px minmax(…) …` },
  "data-sidebar-collapsed":   sidebarCollapsed || void 0,
  "data-rightbar-collapsed":  cols.rightbar === 0 || void 0,
  "data-rightbar-fullscreen": layoutInfo.rightbarFullscreen || void 0,
  "data-rightbar-instant":    layoutInfo.rightbarInstant || void 0,
  "data-dragging":            dragging || void 0,
  "data-animating":           animating > 0 || void 0,
  children: [
    <DocumentTitle/>,                                        // renders null
    <div className="MnhYfG_sidebarCol">{sidebar}</div>,        // ← SIDEBAR
    <Fragment>
      <CenterColumn/> → <div className="MnhYfG_centerCol">    // ← CHAT (main)
      <RightbarColumn/> → <div className="MnhYfG_rightbarCol" data-rightbar-col>
    </Fragment>,
    <div className="MnhYfG_bottomRow"    data-shell-bottom>,
    <div className="MnhYfG_overlayLayer" data-shell-overlay>,
    leadingMounted && <div className="MnhYfG_leadingSeat" data-shell-leading>,
    <DragHandle data-side="sidebar"/>  (className MnhYfG_handle),
    <DragHandle data-side="rightbar"/>
  ]
});
```

`data-*` on the frame: `data-sidebar-collapsed`, `data-rightbar-collapsed`,
`data-rightbar-fullscreen`, `data-rightbar-instant`, `data-dragging`,
`data-animating` (absent when falsy). Child wrappers carry `data-shell-bottom`,
`data-shell-overlay`, `data-shell-leading`, `data-rightbar-col`; drag handles
carry `data-side` and `data-dragging`.

**React parent of BOTH sidebar and chat = `div.MnhYfG_frame`.** The sidebar is
`renderSlot("sidebar", {collapsed, width})` placed inside `.MnhYfG_sidebarCol`
(`client.js:301–308, 335–338`); the chat is `renderSlot("main", {}, {entryKey:
activePanelId ?? "conversation"})` inside `.MnhYfG_centerCol`
(`client.js:118–120, 309–312, 339`). Both columns are direct grid children.

### 2.4 The element ABOVE it (mount chain)

Web app mounts into a bare `<div id="root">`:
`research\web-frontend\index-CN7NIWNw.js:190` —

```js
const e=document.getElementById("root");if(e===null)throw new Error("web app: missing #root");const t=new TZ(e);
```

The `root` slot is the only thing the web shell renders
(`ui-layout/lib/client.js:95–96`: *"Three-column shell frame, registered into
the built-in 'root' slot (the web shell renders only 'root')"*). No extra
styled wrapper exists between `#root` and `.MnhYfG_frame` in shipped CSS.
Full chain: `#root > div.MnhYfG_frame > (.MnhYfG_sidebarCol | .MnhYfG_centerCol | …)`.
`body` also carries `[data-ds-dark-theme]` and inline `--dsw-alias-*` token
styles written by `ThemePresenter` (`ui-layout/lib/client.js:548–569`); the
`._root_<hash>_<n>` names the brief mentions (e.g. `._root_1rdzk_1`,
`._root_74oxc_1`) are **web-frontend dist component roots**, not the app shell
(`index-CN7NIWNw.js:120,129` + `$F\…index-BxpfOGf3.css`); the actual app root
is `.MnhYfG_frame`.

### 2.5 Concrete selectors

```css
div.MnhYfG_frame { }                         /* ★ wallpaper target */
#root > div.MnhYfG_frame { }                 /* tighter */
#root > div[data-sidebar-collapsed],
#root > div[data-animating] { }              /* hash-free structural alt */
div.MnhYfG_sidebarCol { }                    /* sidebar column (opaque fill) */
div.MnhYfG_centerCol  { }                    /* chat column */
div.MnhYfG_overlayLayer { }                  /* z-index:20, children pointer-events:auto */
```

---

## 3. SIDEBAR — brand row / logo  ★PRIORITY★

### 3.1 Brand mark element: DOM + CSS class + contents

`$X\dsh-client-ui-sidebar\lib\client.js:307–346`; class map `:100–137`:

```js
"brand":"bJOniG_brand", "brandIdentity":"bJOniG_brandIdentity",
"brandMark":"bJOniG_brandMark", "brandName":"bJOniG_brandName",
```

DOM (expanded / `wide`, `client.js:307–346`, trimmed):

```jsx
<div className="bJOniG_logoRow" data-window-drag>
  <button type="button" className="bJOniG_brand bJOniG_wide" aria-label=… onClick={startSession}>
    <span className="bJOniG_brandIdentity" aria-hidden="true">
      <span className="bJOniG_brandMark">
        {renderSlot("sidebar.brand.mark", { size: 24 }, { fallback: <FishLogo size={24}/> })}
      </span>
      <span className="bJOniG_brandName">
        {renderSlot("sidebar.brand.name", {}, { fallback: <span className="bJOniG_fallbackBrandName">…</span> })}
      </span>
    </span>
  </button>
  …toggle…
</div>
```

* macOS desktop: outer `<button>` → `<span>` (no click shortcut), `client.js:334–336`.
* Collapsed rail: the **same** slot renders again inside `span.bJOniG_railMark`
  (`client.js:277–281`):

  ```jsx
  <span className="bJOniG_railMark" aria-hidden="true">
    {renderSlot("sidebar.brand.mark", { size: 24 }, { fallback: <FishLogo size={24}/> })}
  </span>
  ```

  ⇒ an occupant is mounted **twice** (expanded + rail); must honor `size: 24`.

* **Default content** = `FishLogo` (`$X\dsh-client-ui-primitives\lib\index.js:5258–5271`),
  an inline SVG drawing the fish path with `fill="currentColor"`:

  ```jsx
  function FishLogo({ size = 24, className }) {
    return jsx("svg", { width:size, height:size*17.04/23.16, className,
      viewBox:"0 0 23.16 17.04", fill:"none", "aria-hidden":"true",
      children: jsx("path", { d:FISH_LOGO_PATH, fill:"currentColor" }) });
  }
  ```

  `bJOniG_brandMark` CSS (`$E\dsh-client-ui-sidebar__lib__client.css:121–124`):
  `flex:none; justify-content:center; align-items:center; display:inline-flex`
  — wrapper only centers; SVG `width/height` set the size.

### 3.2 `sidebar.brand.mark` slot — registration, props, default  ★PRIORITY★

**Declaration** (`$X\dsh-client-ui-sidebar\lib\client.js:488–522`, trimmed):

```js
ctx.slots.inject("sidebar", () => ctx.slots.register({
  name: "sidebar", locale: NS,
  children: {
    "sidebar.brand.mark":  { kind: "single", scope: "root" },
    "sidebar.brand.name":  { kind: "single", scope: "root" },
    "sidebar.toggle.badge":{ kind: "single", scope: "root" },
    "sidebar.panellist":   { kind: "list",   scope: "root" },
    "sidebar.workspaces":  { kind: "single", scope: "root" },
    "sidebar.settings":    { kind: "single", scope: "root" },
    "sidebar.footer.action":{kind: "list",   scope: "root" }
  },
  inject: injectProps
}, SidebarRoot));
```

* **Props the renderer receives**: exactly `{ size: 24 }` at BOTH render sites
  (`client.js:280` rail, `:316` expanded), plus the five framework shares
  (`dsh-client-ui-slots/README.md:36–38`) and `scope:"root"`. The 3rd
  `renderSlot(name, props, {fallback})` argument is **NOT a prop** — it is the
  built-in default shown only when no occupant is registered.
* **Default renderer output (fallback)**: `<FishLogo size={24}/>` (§3.1); on the
  name side a `<span className="bJOniG_fallbackBrandName">` with localized
  `brand.localBuild` and, for complete builds, a `bJOniG_buildVersion` badge
  (`client.js:319–331`).
* Shipped README (`app.asar!/…/dsh-client-ui-sidebar/README.md:14,34`):
  > "Deployments can **replace the brand mark or name** while retaining the
  > navigation controls and rail geometry." … "renders `sidebar.brand.mark`
  > and `sidebar.brand.name` as independent **single** slots; the collapsed rail
  > renders the same mark slot. … Without occupants, the shell uses the fish
  > mark and a localized local-build label."

**Can you safely replace it?** YES — it is an explicit extension point — BUT it
is a **`single`** slot: registering your component **shadows** the shipped
`FishLogo` (you become the sole occupant; it does NOT add a second mark).
Pattern: `ctx.slots.inject("sidebar.brand.mark", () => ctx.slots.register({name:"sidebar.brand.mark", …}, YourMark))`.
`[inference]` render a component honoring `props.size` and `currentColor` so it
works in both mount points. To ADD without removing shipped UI, use a `list`
slot (`sidebar.panellist`, `sidebar.footer.action`, `shell.overlay`).

The official occupant (if enabled) is
`app.asar!/node_modules/@deepseek-ai/dsh-client-ui-brand-official/lib/client.js`
(1,863 B), a plugin registering into `sidebar.brand.mark` / `.name`; a full
build therefore already shadows `FishLogo`.

### 3.3 Sidebar container class + `--dsw-specific-sidebar-fill`

Sidebar root = **`div.bJOniG_root`**. CSS
(`$E\dsh-client-ui-sidebar__lib__client.css:21–32`):

```css
.bJOniG_root{--dsh-sidebar-inline-padding:12px; height:100%;
  padding:6px var(--dsh-sidebar-inline-padding); box-sizing:border-box;
  background:var(--dsw-specific-sidebar-fill);
  color:var(--dsw-alias-label-primary); display:flex; flex-direction:column; font-size:14px}
[data-platform=darwin] .bJOniG_root{background:0 0}
```

`--dsw-specific-sidebar-fill` is applied in **two** places (neutralize both for
a translucent sidebar):

1. AppFrame sidebar column — `$E\dsh-client-ui-layout__lib__client.css:26–29`:
   ```css
   .MnhYfG_sidebarCol{background:var(--dsw-specific-sidebar-fill);
     border-right:.5px solid var(--dsw-alias-border-l3); min-width:0; overflow:hidden}
   ```
   (macOS blue-gradient override `:41–43`; `[data-windows-titlebar]
   .MnhYfG_sidebarCol{border-right:none}` `:23`.)
2. SidebarRoot itself — `.bJOniG_root{background:var(--dsw-specific-sidebar-fill)}`.

Also on the Windows caption strip: `[data-windows-titlebar]
.MnhYfG_frame{background:var(--dsw-specific-sidebar-fill)}` and its `::before`
drag strip (`layout CSS :17–22`). Token light default
`var(--dsw-static-neutral-bluish-50)`, dark
`var(--dsw-static-neutral-bluish-900)` (`research\ui-theme-contract.md:271`).

```css
div.bJOniG_root { }               /* sidebar shell */
div.bJOniG_logoRow { }            /* brand row (data-window-drag) */
span.bJOniG_brandMark, span.bJOniG_railMark { }  /* two mark mount points */
span.bJOniG_brandMark > svg, span.bJOniG_railMark > svg { }  /* logo SVG */
button.bJOniG_brand { }           /* NEW SESSION click target (expanded) */
```

---

## 4. ICONS, SEND BUTTON, PILLS, BUBBLES

### 4.1 How icons are rendered — NOT lucide-react in the app UI

Grep of `$X\dsh-client-ui-primitives\lib\index.js` for `lucide` → **0 hits**.
Icons are **first-party inline SVG artwork components**
(`IconPanelLeftOutlineRegular`, `IconNewChatOutlineRegular`, `IconSendOutlineRegular`,
`FishLogo`, `BrandWordmark`, …). Base artwork
(`$X\dsh-client-ui-primitives\lib\index.js:75–98`):

```jsx
const NewChatOutlineArtwork = ({ size = 16, className, strokeWidth }) => jsxs("svg", {
  width:size, height:size, className,
  viewBox:"0 0 16 16", fill:"none", xmlns:"http://www.w3.org/2000/svg",
  "aria-hidden":"true", strokeWidth,
  children:[ jsx("path",{ d:"M2.37091 11.2501C…", stroke:"currentColor" }), … ]
});
```

Convention:
* `<svg>`: `width/height = size` (default 16), `viewBox="0 0 16 16"`,
  `fill="none"`, `xmlns`, `aria-hidden="true"`, `strokeWidth` (Regular/Medium
  preset, e.g. `ICON_REGULAR_STROKE`).
* **YES `stroke="currentColor"`** on paths (`:87,91,95,117,121,125,146,150…`);
  `FishLogo` and the send/stop glyphs use **`fill="currentColor"`**. Color is
  inherited from the parent `color` — e.g. `.bJOniG_iconButton{color:var(--dsw-alias-label-secondary)}`
  (`$E\dsh-client-ui-sidebar__lib__client.css:148–161`).
* **Class**: the `<svg>` has **no class by default** (`className` undefined
  unless a caller passes one). Sidebar does, e.g.
  `ui-sidebar/lib/client.js:282–285`: `<IconPanelLeftOutlineRegular
  className={…panelIcon} size={wide?16:18}/>` → class `bJOniG_panelIcon`.
  Header chrome buttons use `Fqqb4W_iconButton`; CSS also targets
  `.bJOniG_newSessionContent>svg{flex:none}` (sidebar CSS `:234`),
  `.lk5Nnq_leading svg{…}`, `._9ibABa_runningIcon`.
* **NO `data-icon` / `data-lucide`**: grep `data-icon|data-lucide` across all
  `@deepseek-ai` JS → **0 hits**. Icons rely on **parent sizing** (inline
  width/height from `size`) + `currentColor`. Target them via
  `button.<controlClass> > svg`, `.<class> > svg`, or an explicitly-passed
  `className`. There is no per-icon CSS hook.

> A bundled `lucide-react` exists only under
> `app.asar!/node_modules/@agents-anywhere/dsh-bridge-next/node_modules/lucide-react/`
> (`icons/dock.mjs`) — a different bridge package, **not** app icons.

### 4.2 Round send/stop button (bottom-right of composer)

JSX `$X\dsh-client-ui-conversation\lib\client.js:19089–19154`: **two**
`<button className={InputBar_module_css_default.primary}>` — an interruptible
STOP (`:19095–19116`) and the primary SEND/STOP (`:19124–19153`). Both contain
an inline `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">`:

```jsx
// STOP
<button type="button" className={InputBar_module_css_default.primary} aria-label={t("input.stop")} onClick={stop}>
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
    <rect x="3" y="3" width="10" height="10" rx="3" fill="currentColor"/>
  </svg>
</button>
// SEND  (primaryStops ? <rect …/> : <path d="M8.3125 0.980183C…" fill="currentColor"/>)
```

CSS `$E\dsh-client-ui-conversation.css:221–223`:

```css
.VERcba_primary{corner-shape:round;background:var(--dsw-alias-button-info-fill);
  color:#fff;cursor:pointer;border:none;border-radius:999px;flex:none;
  place-items:center;width:34px;height:34px;transition:background-color .1s;
  display:grid;transform:translateY(-2px)}
.VERcba_primary:hover:not(:disabled){background:var(--dsw-alias-button-info-hover)}
.VERcba_primary:disabled{opacity:.4;cursor:default}
```

Selectors: `button.VERcba_primary`, `button.VERcba_primary > svg`,
`button.VERcba_primary[disabled]`. It sits in `.VERcba_trailing`
(`margin-left:auto`, `:212`), inside `.VERcba_row` / `.VERcba_card`.

### 4.3 Composer toolbar pills ("视觉", "+PDF", "任务路由")

The **shipped** composer toolbar rows are
(`$E\dsh-client-ui-conversation.css:208–227`):

```css
.VERcba_row{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;
  min-width:0;padding:2px 8px 6px;display:flex;container-type:inline-size}
.VERcba_tools,.VERcba_modes,.VERcba_trailing{align-items:center;min-width:0;display:flex}
.VERcba_tools,.VERcba_modes{gap:12px}
.VERcba_trailing{flex:none;gap:12px;margin-left:auto}
.VERcba_add{corner-shape:round;background:var(--dsw-specific-selector);width:28px;height:28px;
  color:var(--dsw-alias-label-primary);cursor:pointer;border:none;border-radius:999px;
  flex:none;place-items:center;display:grid}
```

The shared chip primitive is **`Pill`**:
source `$F\…dsh-client-ui-primitives__lib__Pill.module.css:1–28`
(`.pill`, `.interactive`, `.active`); **runtime hashed class** in
`$F\…dsh-web-frontend__dist__assets__index-BxpfOGf3.css` (offset 8636):

```css
._pill_1bqmh_1{display:inline-flex;align-items:center;gap:4px;height:24px;
  padding:0 8px;border:none;border-radius:999px;corner-shape:round;font-size:12px;
  line-height:18px;color:var(--dsw-alias-label-secondary);
  background:var(--dsw-alias-bg-layer-2)}
._interactive_1bqmh_16{cursor:pointer}
._interactive_1bqmh_16:hover{background:var(--dsw-alias-interactive-bg-hover)}
._active_1bqmh_24{color:var(--dsw-alias-label-primary);
  background:var(--dsw-alias-button-ghost-active-fill);
  box-shadow:inset 0 0 0 1px var(--dsw-alias-button-ghost-active-border)}
```

**The specific labels are NOT in the asar**: whole-asar search found `任务路由`
= **0 hits**; `视觉` only in README.zh.md prose; `+PDF` nowhere. They come from
**profile plugins**, into the composer **list** slot `conversation.input.right`:

* `$P\@goodandready\dsh-vision-bridge\lib\client.js:1680–1695` registers
  `slots.inject("conversation.input.right", () => slots.register({ name:
  "conversation.input.right", id:"@goodandready/dsh-vision-bridge-mode",
  order:7, label:()=>"Vision Mode" }, … VisionInputControls …))` — comment
  `:1433`: *"Renders the mode toggle (👁️ Vision: hybrid) and the 📄 +PDF button
  right next to the message input."*
* locale labels: `pdf_button:'📄 +PDF'` (`:233,423`),
  `mode_hybrid_title:'视觉: 混合模式 …'` etc. (`:425–427`). Plugin CSS uses
  plain `.vbr*` classes (`:149–153`: `.vbr button`, `.vbr-btn`, `.vbr-badge`).
* `任务路由` was absent from BOTH the asar and 5,673 profile plugin files
  scanned. `[inference]` contributed by another/dynamic plugin (or a
  host-provided chip) — target it generically.

Paste-ready selectors (robust across any contributing plugin):

```css
div.VERcba_row { }                        /* toolbar container */
div.VERcba_tools, div.VERcba_modes, div.VERcba_trailing { }
div.VERcba_tools > *, div.VERcba_modes > * { }   /* each pill/chip wrapper */
._pill_1bqmh_1, ._pill_1bqmh_1:hover { }         /* primitives Pill */
button.VERcba_add { }                     /* round + */
[data-slot="conversation.input.right"] { } /* slot seat for contributed pills */
/* plugin-specific (this profile only): */
.vbr button, .vbr-badge, .vbr-btn { }
```

### 4.4 User / assistant message bubbles + alias tokens

Package **`dsh-client-ui-chat`** (also extracted to `$X\dsh-client-ui-chat\`;
CSS de-embedded to `$E\chat.css`; class map at
`dsh-client-ui-chat/lib/client.js:4272–4313`).

**USER bubble** (`$E\chat.css:110–112`):

```css
.fDq-QG_userRow{flex-direction:column;align-items:flex-end;gap:6px;display:flex}
.fDq-QG_userStack{min-width:0;max-width:min(calc(var(--dsh-chat-content-width,748px)*.702),82%);…}
.fDq-QG_bubble{background:var(--dsw-specific-bubble);border-radius:var(--dsw-radius-xl);
  max-width:100%;font-size:var(--dsh-content-font-size,14px);
  line-height:calc(22px + var(--dsh-content-font-delta,0px));
  color:var(--dsw-alias-label-primary);white-space:pre-wrap;word-break:break-word;
  padding:10px 16px}
```

Tokens: **`--dsw-specific-bubble`** (bg), **`--dsw-alias-label-primary`**
(text), `--dsw-radius-xl`, `--dsh-content-font-size`. Definition
(`$X\dsh-client-ui-theme\lib\client.js:1413`):
`--dsw-specific-bubble:var(--dsw-static-deepseek-50)`,
`--dsw-specific-bubble-highlight:var(--dsw-static-deepseek-200)`.

**ASSISTANT message has NO bubble.** Assistant/answer content renders as full-width
flow items (`$E\chat.css:43–56`):

```css
._9ibABa_column{max-width:var(--dsh-chat-content-width);flex-direction:column;width:100%;margin:0 auto;display:flex}
._9ibABa_flowItem{min-width:0}
._9ibABa_flowItem[data-chat-group-part=response] { …; --dsh-chat-flow-gap:12px }
[data-slot="conversation.chat.flow"] { }   /* flow container */
[data-slot="conversation.chat.node"] { }   /* each node */
._9ibABa_running{--dsw-alias-label-shimmer:var(--dsw-alias-label-deep-diving-shimmer);
  color:var(--dsw-alias-label-deep-diving); …}   /* streaming text */
```

Tokens used by assistant text: **`--dsw-alias-label-primary`** (base inherited),
`--dsw-alias-label-tertiary` (hints/metadata), `--dsw-alias-label-deep-diving`
+ `--dsw-alias-label-shimmer` (streaming), `--dsw-alias-border-l1/-l2`
(dividers). Selectors: `._9ibABa_flowItem[data-chat-group-part="response"]`,
`[data-slot="conversation.chat.flow"]`, `.fDq-QG_userRow .fDq-QG_bubble`.

> Other bubble-like elements reuse the same token: `dsh-client-ui-goal`
> `._4EQVGa_bubble`, `dsh-client-ui-user-questions` `.I3fXRW_bubble` — both
> `background:var(--dsw-specific-bubble)`.

---

## 5. MOTION — every shipped @keyframes

Computed by `research\scratch\keyframes.mjs` scanning ALL `.css` in `$F` + `$E`.
**35 distinct names.** Two naming layers: source `.module.css` (plain names)
and compiled dist CSS `$F\…index-BxpfOGf3.css` (hashed
`_<name>_<hash>_<line>`); runtime-injected `$E\dsh-client-ui-sidebar…css`
uses `bJOniG_` hashes.

| @keyframes name | where |
|---|---|
| `_dockHintIn_6nhg2_1`, `_dockScrimIn_6nhg2_1` | dist index CSS (dockkit) |
| `_dsh-row-shimmer-highlight_1rdzk_1`, `_dsh-row-shimmer-sweep_1rdzk_1` | dist index CSS |
| `_dsh-state-dot-dash_1i3xo_1`, `_dsh-state-dot-spin_1i3xo_1` | dist index CSS |
| `_dsh-toast-fade_l6cvn_1`, `_dsh-toast-in_l6cvn_1` | dist index CSS |
| `_indicator-enter_1gwo3_1`, `_reveal-second-dot_1gwo3_1`, `_reveal-third-dot_1gwo3_1` | dist index CSS |
| `_modalEnter_o6lrb_1`, `_spin_u7vgf_45`, `_tooltip-in_12mhf_1` | dist index CSS |
| `bJOniG_wide-in`, `bJOniG_rail-in`, `bJOniG_rail-fade-in` | `$E\dsh-client-ui-sidebar__lib__client.css:71,75,78` |
| `VERcba_input-pending` | `$E\dsh-client-ui-conversation.css:194` (composer pending dot) |
| `dsh-row-shimmer-highlight`, `dsh-row-shimmer-sweep` | primitives TextShimmer.module.css:74,69 |
| `dsh-state-dot-dash`, `dsh-state-dot-spin` | primitives StateDot.module.css:68,64 |
| `dsh-toast-fade`, `dsh-toast-in` | primitives Toast.module.css:88,76 |
| `indicator-enter`, `reveal-second-dot`, `reveal-third-dot` | primitives ConnectionIndicator.module.css:29,98,103 |
| `modalEnter` | primitives Modal.module.css:50 |
| `tooltip-in` | primitives Tooltip.module.css:55 |
| `enter`, `exit`, `spin` | `$F\lib__native-ui__assets__index-DZWK3_or.css:2` |
| `dshmPlug`, `dshmPlugFade`, `dshmSlide`, `sp` | dshmarket Market.module.css:494,505,506,511 |

`[inference]` Prefix your own with `kurisu-*`; also avoid the generic
`enter`, `exit`, `spin`, `sp`, `modalEnter`, `tooltip-in`.

### 5.1 Transition / hover conventions

Tokens are **`--ds-transition-duration`, `--ds-transition-duration-slow`** and
**`--ds-ease-in-out`** (note `--ds-`, not `--dsw-`).

* AppFrame: `.MnhYfG_frame[data-animating]{transition:grid-template-columns var(--ds-transition-duration-slow) var(--ds-ease-in-out)}`,
  `.MnhYfG_handle` left transition, `@media (prefers-reduced-motion:reduce){…{transition:none}}`
  (`$E\dsh-client-ui-layout__lib__client.css:8,24,69,71`).
* Sidebar: `.bJOniG_fading>*{transition:opacity .15s var(--ds-ease-in-out)}`,
  `.bJOniG_wide{animation:bJOniG_wide-in .2s var(--ds-ease-in-out)}`,
  rail-in `.15s var(--ds-ease-in-out)`, plus a reduced-motion block
  (`$E\dsh-client-ui-sidebar__lib__client.css:68–79,304–306`).
* Composer: `.VERcba_primary{transition:background-color .1s}`,
  `.VERcba_cardWorkspaceTrigger:after{transition:color .1s}`,
  `.VERcba_select` chevron. Chat flow `transition:margin-top .16s cubic-bezier(.4,0,.2,1)`.
* Hover: `:hover{background:var(--dsw-alias-interactive-bg-hover)}`
  (`.bJOniG_iconButton/.panelRow/.Fqqb4W_iconButton`), with
  `:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px}`
  (`sidebar CSS :162–163,264–265`). Most primitive hover is a straight
  background swap with NO transition.
* Always respect `@media (prefers-reduced-motion:reduce)` and
  `@media (prefers-reduced-transparency:reduce)` (layout CSS `:44`).

---

## 6. Exact slot names (shell / sidebar / top bar / composer / brand)

`dsh-client-ui-slots/README.md:28` — four kinds: `single` (one occupant ⇒
registering **shadows**), `list` (ordered ⇒ **safe to add**), `keyed`, `chain`.
`README.md:48`: *"Declaring a slot is claiming it … registering into an
undeclared slot … throws at load."* `SlotCore` seeds `'root'`.

### 6.1 Root / shell frame — `ui-layout` (`lib/client.js:623–653`)

| Slot | kind | scope | add-safe? |
|---|---|---|---|
| `root` | seeded | — | **do not replace** (AppFrame is sole registrant) |
| `sidebar` | **single** | root | replace-only |
| `main` | **keyed** | root | keyed by `activePanelId` (default `"conversation"`) |
| `rightbar` | **single** | root | replace-only |
| `shell.bottom` | **single** | root | replace-only (`data-shell-bottom`) |
| `shell.overlay` | **LIST** | root | ✅ **safe** (`data-shell-overlay`, `z-index:20`) |
| `shell.leading` | **single** | root | replace-only (macOS chrome seat) |

✅ `shell.overlay` is the recommended list slot for a skin overlay
(`research\ui-theme-contract.md:494–530`).

### 6.2 Sidebar — `ui-sidebar` (`lib/client.js:488–522`)

| Slot | kind | add-safe? |
|---|---|---|
| `sidebar.brand.mark` | **single** | replace-only (shadows FishLogo) — §3 |
| `sidebar.brand.name` | **single** | replace-only |
| `sidebar.toggle.badge` | **single** | replace-only |
| `sidebar.panellist` | **LIST** | ✅ safe |
| `sidebar.workspaces` | **single** | replace-only |
| `sidebar.settings` | **single** | replace-only |
| `sidebar.footer.action` | **LIST** | ✅ safe |

### 6.3 Top bar / composer / input — `ui-conversation` (`lib/client.js`)

Authoritative declarations (all quotable with line numbers):

* `main.conversation` → `slots.register(..., ConversationRoot)` `:19726–19732`;
  child `conversation.header` = **single**, scope `session-maybe` (`:19728–19730`).
* `conversation.content` → `slots.registerFactory(..., ConversationContent)`
  `:19733–19795`; children (`:19737–19770`):

  | Slot | kind | scope |
  |---|---|---|
  | `conversation.session` | single | session |
  | `conversation.composer` | **chain** | session |
  | `conversation.composer.bar` | single | session-maybe |
  | `conversation.input.dock` | **LIST** | session |
  | `conversation.hero.brand.mark` | single | root |
  | `conversation.hero.workspace` | single | root |
  | `conversation.hero.agentPreset` | single | session-maybe |
  | `conversation.hero.options` | **LIST** | session |

* `conversation.session` → `slots.register(..., ConversationSession)`
  `:19796–19833`; child `conversation.view` = **LIST**, scope session (`:19798–19800`).
* `conversation.header` → `slots.register(..., ConversationHeader)`
  `:19834–19846`; children `conversation.header.leading` (single, root),
  `conversation.session.header` (single, session).
* `conversation.session.header` → `slots.register(..., ConversationSessionHeader)`
  `:19847–19879`; children (top bar):

  | Slot | kind | scope |
  |---|---|---|
  | `conversation.session.header.lineage` | single | session |
  | `conversation.session.header.actions` | **LIST** | session |
  | `conversation.session.header.utilities` | **LIST** | session |
  | `conversation.session.header.corner` | single | session |

* `conversation.composer.bar` → `slots.register(..., InputBar)`
  `:19880–19920+`; children (composer/input):

  | Slot | kind | scope | add-safe? |
  |---|---|---|---|
  | `conversation.input.attachments` | single | session-maybe | replace-only |
  | `conversation.input.overlay` | **LIST** | session | ✅ safe |
  | `conversation.input.permission` | single | session | replace-only |
  | `conversation.input.left` | **LIST** | session | ✅ safe |
  | `conversation.input.plan` | single | session | replace-only |
  | **`conversation.input.right`** | **LIST** | session | ✅ safe — where 视觉/+PDF pills register |
  | `conversation.input.model` | single | session | replace-only |
  | `conversation.input.activity` | single | session | replace-only |
  | `conversation.composer.dock` | **LIST** | session | ✅ safe |

Also rendered: `conversation.user.text` / `conversation.user.text.node`
(factory-owned, `:19502–19530`, `:17147`), `conversation.session.header.lineage`
(`:18025`), `settings.general.item` (`:19543`). `renderSlot` sites:
`:17550,17713,17731,17797–17820,17842,17887,17907–17908,17946,18025–18041,
19000–19084,19164`.

Icon/brand positions: `sidebar.brand.mark` (single, root),
`sidebar.brand.name`, `conversation.hero.brand.mark` (single, root),
`sidebar.toggle.badge`, `conversation.header.leading`, `shell.leading`.

**✅ Safe-to-add (`list`) slots — full authoritative set**:
`shell.overlay`, `sidebar.panellist`, `sidebar.footer.action`,
`conversation.input.dock`, `conversation.hero.options`, `conversation.view`,
`conversation.session.header.actions`, `conversation.session.header.utilities`,
`conversation.input.overlay`, `conversation.input.left`,
`conversation.input.right`, `conversation.composer.dock`,
`settings.general.item` (list at its own declaration).

**Single slots that would SHADOW shipped UI**: `root`, `sidebar`,
`sidebar.brand.mark` / `.name` / `.toggle.badge` / `.workspaces` / `.settings`,
`main` (keyed), `rightbar`, `shell.bottom`, `shell.leading`,
`conversation.header`, `conversation.session`,
`conversation.composer.bar`, `conversation.session.header` / `.lineage` /
`.corner`, `conversation.hero.brand.mark`, `conversation.hero.workspace`,
`conversation.hero.agentPreset`, `conversation.input.attachments` /
`.permission` / `.plan` / `.model` / `.activity`.

---

## Appendix — tooling written (all under `research\`)

* `scratch\extract-packages.mjs` — reports + extracts the 10 requested packages.
* `scratch\asarx.mjs` — general ESM asar `list/cat/save/saveprefix/grepall`.
* `scratch\asargrep.mjs` — whole-asar literal search (NUL-tolerant).
* `scratch\grep.mjs` — NUL-tolerant line-number grep (ripgrep skips these bundles as "binary" because of esbuild `\0` virtual-module markers).
* `scratch\extract-embedded-css.mjs`, `extract-css2.mjs`, `findall.mjs` — de-embed shipped CSS.
* `scratch\keyframes.mjs` — global @keyframes + motion-token inventory.
* `embedded-css\` (formatted CSS + `_CLASSMAPS.txt`), `web-frontend\`,
  `asar-extract\` — extracted sources.
* `ui-theme-contract.md` — prior report (tokens, plugin API, versions).
* **`client-dom-contract.md`** — this report (the only deliverable).

No file outside `research\` was modified; no npm installs, no network.
Reading `$P` (profile plugins) was read-only, for locating the pill labels.
