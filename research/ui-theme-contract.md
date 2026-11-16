# UI theme contract — DSH Desktop NEXT (`dsh-desktop-next 2.0.19-next`)

Investigation date: 2026-11-07. Read-only; all scratch/extract files are under
`<workspace>\kurisu-skin\research\`. Everything below is
**observed in shipped source** unless explicitly marked `[inference]`.

Source archive:
`<install>\AppData\Local\Programs\DSH NEXT\resources\app.asar`
(180,923,876 bytes). Extracted copies live in
`<workspace>\kurisu-skin\research\asar-extract\`; the same path
prefix is abbreviated below as **`$X`**. Inside paths written as
`app.asar!/path` mean "the file inside the asar".

---

## 0. How the asar was parsed (no external packages)

Naive "8-byte size prefix then JSON" fails on this build. The first 16 bytes are
four little-endian `uint32`s:

```
04 00 00 00  a4 e7 50 00  a0 e7 50 00  9a e7 50 00   {"files": ...
^ 4          ^ outer payload ^ inner pickle  ^ jsonLen   ^ JSON starts at 16
```

Working reader (Node `fs` + `Buffer` only):
`<workspace>\kurisu-skin\research\scratch\asar.js`

```js
const head = Buffer.alloc(16); fs.readSync(fd, head, 0, 16, 0);
const jsonLen = head.readUInt32LE(12);          // 5,302,170
const headerBuf = Buffer.alloc(jsonLen);
fs.readSync(fd, headerBuf, 0, jsonLen, 16);
const header = JSON.parse(headerBuf.toString('utf8'));
const pad = (4 - (jsonLen % 4)) % 4;            // 2
const dataStart = 16 + jsonLen + pad;           // 5,302,188
// entry.offset is relative to dataStart; entry.unpacked => app.asar.unpacked/<path>
```

It reported `entries=20286`. Helpers `asar-ls.js`, `asar-grep.js`,
`extract-tokens.js`, `dump14.js` are in the same scratch dir; full file list is
`scratch/all-entries.txt`.

### Extracted packages (`$X` = `...\research\asar-extract`)

| Role | Extracted path | Inner asar path |
|---|---|---|
| Theme plugin (service + all 8 token sheets) | `$X\node_modules\@deepseek-ai\dsh-client-ui-theme\` | `node_modules/@deepseek-ai/dsh-client-ui-theme/` |
| Theme snapshot → DOM (CSS-variable writer, dark attribute) | `$X\node_modules\@deepseek-ai\dsh-client-ui-layout\lib\client.js` | `node_modules/@deepseek-ai/dsh-client-ui-layout/lib/client.js` |
| Client module loader (host graph + browser lazy-CJS) | `$X\node_modules\@deepseek-ai\dsh-client-modules\lib\{index,client}.js` | same |
| Web boot kernel / shared-module seed table | `$X\web-frontend\index-shell.js` | `node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-CN7NIWNw.js` |
| Dynamic-plugin façade (pinned `overrideTokens` source, `styles.insert`) | `$X\node_modules\@deepseek-ai\dsh-cordis-client-runner\lib\client.js` | same |
| App's own client plugin | `$X\app-shell\lib\client.js` | `lib/client.js` |
| App manifest / app bundle patch | `$X\app-package.json`, `$X\app-shell\cordis.patch.yml` | `package.json`, `cordis.patch.yml` |
| Web composition (loader entry ids) | `$X\web-app\cordis.patch.yml` | `node_modules/@deepseek-ai/dsh-web-app/cordis.patch.yml` |
| Slots contract | `$X\node_modules\@deepseek-ai\dsh-client-ui-slots\README.md` | same |
| Cordis sources (plugin shape, inject) | `$X\cordis\src\*.ts`, `$X\cordis-plugin-loader\src\*.ts` | `node_modules/@deepseek-ai/cordis/src/…` |
| Third-party examples | `$X\node_modules\dshmarket\`, `$X\node_modules\dshmarket\client\client.js` | same |

---

## 1. Theme plugin: identity, service contract, token application

### 1.1 Package and versions

`app.asar!/node_modules/@deepseek-ai/dsh-client-ui-theme/package.json` (lines 1–47):

```json
{
  "name": "@deepseek-ai/dsh-client-ui-theme",
  "version": "0.2.1-rc.2",
  "type": "module",
  "main": "lib/index.js",
  "exports": { ".": {"default":"./lib/index.js"}, "./client": {"default":"./lib/client.js"}, ... },
  "dsh": {
    "client": {
      "inject": ["@deepseek-ai/dsh-client-connection", "@deepseek-ai/dsh-client-locale",
                 "@deepseek-ai/dsh-client-shortcuts", "@deepseek-ai/dsh-client-ui-renderer",
                 "@deepseek-ai/dsh-client-ui-settings", "@deepseek-ai/dsh-api-remotes"],
      "platform": "web",
      "immediately": true
    }
  },
  "peerDependencies": { "@deepseek-ai/cordis": "~4.0.5" }
}
```

It is a **web client plugin**. Its host half
`app.asar!/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/index.js`
only embeds a pre-plugin palette bootstrap into the served HTML
(`ctx.on("webserver/index-inject", …)` with `bootThemeStyle()`:
`:root{color-scheme:light}body{background-color:#fff;--dsh-boot-bg:#fff}` vs dark
`#151517`, and `document.body.toggleAttribute('data-ds-dark-theme', dark)`).

Its loader entry id (from `$X\web-app\cordis.patch.yml:254`):

```yaml
- id: ui-theme
  name: '@deepseek-ai/dsh-client-ui-theme'
```

### 1.2 Exact service type (authoritative declarations)

`app.asar!/node_modules/@deepseek-ai/dsh-cordis-client-runner/lib/client.js`
lines 2309–2331 (the Client inspect type closure, i.e. the shipped `.d.ts`
equivalent):

```ts
export interface ThemeDefinition {
    id: string;
    colorScheme: 'light' | 'dark';
    tokens: ThemeTokens;
}
export type ThemeTokens = Record<string, string>;
export interface ThemeTokenModes { light: string; dark: string; }
export type ThemeTokenOverrides = Record<string, ThemeTokenModes>;
export interface ThemeSnapshot {
    preference: ThemePreference; fontSizes: FontSizes; fontFamilies: FontFamilies;
    active: ThemeDefinition; themes: readonly ThemeDefinition[]; revision: number;
}
```

Method signatures in the same file (lines 1404–1448):

```ts
getTheme(): ThemeSnapshot
setTheme(id: string): void
setFontSize(role: FontRole, px: number): void
register(definition: ThemeDefinition): () => void
overrideTokens(source: string, tokens: ThemeTokenOverrides): () => void
```

Implementation: `$X\node_modules\@deepseek-ai\dsh-client-ui-theme\lib\client.js`
(quoted with its line numbers). Provided as `ctx.provide("theme", theme)` at
line 2029; required services at lines 2009–2014:

```js
const inject = ["slots", "locale", "remote", "configForms"];
function apply(ctx) {
  installThemeStyles(ctx);
  ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), "ui-theme: settings row dictionaries");
  const theme = new ThemeRuntime(ctx, ctx.configForms.get(THEME_SETTINGS_NAMESPACE));
  ctx.provide("theme", theme);
  ...
}
```

`register(definition)` — **no validation of tokens at all** (lines 1807–1817):

```js
register(definition) {
  if (definition.id === "system") throw new Error('"system" is a preference, not a registrable theme id');
  if (this.themes.some((t) => t.id === definition.id)) throw new Error(`theme "${definition.id}" is already registered`);
  this.themes = [...this.themes, definition];
  this.publish();
  return () => { /* removes it; resets preference to DEFAULT_PREFERENCE ("system") if active */ };
}
```

`overrideTokens(source, tokens)` — **only shape validation**, no name whitelist
(lines 1835–1847 and `validateOverrides` 1931–1943):

```js
overrideTokens(source, tokens) {
  const layer = { seq: this.overrideSeq++, tokens: validateOverrides(source, tokens) };
  this.overrides.set(source, layer);
  this.publish();
  return () => { if (this.overrides.get(source) !== layer) return;
                 this.overrides.delete(source); this.publish(); };
}
function validateOverrides(source, tokens) {
  const validated = {};
  for (const [name, value] of Object.entries(tokens)) {
    if (typeof value === "string")
      throw new TypeError(`theme override "${name}" from "${source}" is a bare string — pass { light: …, dark: … } …`);
    if (typeof value !== "object" || value === null ||
        typeof value.light !== "string" || typeof value.dark !== "string")
      throw new TypeError(`theme override "${name}" from "${source}" must map to a { light, dark } pair of strings — one value per color scheme`);
    validated[name] = { light: value.light, dark: value.dark };
  }
  return validated;
}
```

> **Important correction to the working assumption**: `overrideTokens` expects
> `Record<string, {light, dark}>`, **not** `Record<string, string>`. A bare string
> throws. `ThemeDefinition.tokens` (from `register`) *is* `Record<string,string>` —
> one flat value set for the single `colorScheme` declared by that definition.

Layers stack in `seq` order; later wins per token; `composeActive()` picks
`modes[active.colorScheme]` (lines 1868–1875):

```js
composeActive(active) {
  if (this.overrides.size === 0) return active;
  const tokens = { ...active.tokens };
  for (const layer of [...this.overrides.values()].sort((a,b) => a.seq - b.seq))
    for (const [name, modes] of Object.entries(layer.tokens))
      tokens[name] = modes[active.colorScheme];
  return Object.freeze({ ...active, tokens: Object.freeze(tokens) });
}
```

Built-ins (lines 1522–1530) have **empty** token maps — all real colors come from
stylesheets:

```js
const BUILTIN_THEMES = Object.freeze([
  Object.freeze({ id: "light", colorScheme: "light", tokens: Object.freeze({}) }),
  Object.freeze({ id: "dark",  colorScheme: "dark",  tokens: Object.freeze({}) })
]);
```

### 1.3 COMPLETE token inventory

There is **no accepted-token whitelist**. Every key in `definition.tokens` or in an
override layer is accepted verbatim (any string key, any string value). The
inspect provider's 14 names are just a *documentation baseline*:
`BUILTIN_INSPECT_TOKENS` at `$X\…\ui-theme\lib\client.js:1531–1630`. Unknown names
registered by plugins are added by `exportInspectTokens()` (lines 1700–1705) via
`dynamicToken(name)` (1944–1951):

```js
const tokens = new Map(BUILTIN_INSPECT_TOKENS.map((t) => [t.name, t]));
for (const theme of this.themes) for (const name of Object.keys(theme.tokens))
  if (!tokens.has(name)) tokens.set(name, dynamicToken(name));
for (const layer of this.overrides.values()) for (const name of Object.keys(layer.tokens))
  if (!tokens.has(name)) tokens.set(name, dynamicToken(name));
function dynamicToken(name) { return {
  name, description: "Theme token registered by the current Client composition.",
  valueType: "CSS value", requiresLightAndDark: true,
  ...(name.startsWith("--") ? { cssVariable: name } : {}) }; }
```

The **effective** token surface is the set declared by the 8 inlined CSS sheets
in `lib/client.js` (`installThemeStyles`, lines 1431–1458): `base.css`,
`corner-shape.css`, `design-platform.css`, `focus.css`, `onboarding.css`,
`scrollbar.css`, `gradient-shadow-text.css`, `shiki.css`. I parsed all
`body{…}`, `body[data-ds-dark-theme]{…}` and `:root{…}` declarations from those
sheets (`scratch/extract-tokens.js` → `$X\tokens.json`):

| family | count |
|---|---|
| **total distinct custom properties** | **425** |
| `--dsw-alias-*` | 107 |
| `--dsw-specific-*` | 11 |
| `--dsw-static-*` (raw palette) | 77 |
| `--dsw-font*` (typography ladder) | 182 |
| `--dsh-*` (font-size/-family boot vars) | 11 |
| `--shiki-*` | 11 |

The 14 advertised inspect tokens (`valueType: "CSS color"`,
`requiresLightAndDark: true`, `cssVariable` = same name) with their shipped
light/dark defaults from `design-platform.css`:

| token | light | dark |
|---|---|---|
| `--dsw-alias-bg-base` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-950)` |
| `--dsw-alias-bg-layer-1` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-875)` |
| `--dsw-alias-bg-layer-2` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-850)` |
| `--dsw-alias-bg-overlay` | `var(--dsw-static-neutral-bluish-150)` | `var(--dsw-static-neutral-bluish-700)` |
| `--dsw-alias-border-l1` | `#0000000a` | `#ffffff0f` |
| `--dsw-alias-border-l2` | `#0000001a` | `#ffffff1f` |
| `--dsw-alias-brand-primary` | `var(--dsw-static-neutral-bluish-1000)` | `var(--dsw-static-neutral-bluish-50)` |
| `--dsw-alias-label-primary` | `var(--dsw-static-neutral-bluish-1000)` | `var(--dsw-static-neutral-bluish-50)` |
| `--dsw-alias-label-secondary` | `var(--dsw-static-neutral-bluish-700)` | `var(--dsw-static-neutral-bluish-300)` |
| `--dsw-alias-state-error-primary` | `var(--dsw-static-red-600)` | `var(--dsw-static-red-400)` |
| `--dsw-alias-state-idle-primary` | `var(--dsw-static-neutral-300)` | `var(--dsw-static-neutral-600)` |
| `--dsw-alias-state-success-primary` | `var(--dsw-static-green-500)` | `var(--dsw-static-green-500)` |
| `--dsw-alias-state-warn-primary` | `var(--dsw-static-amber-500)` | `var(--dsw-static-amber-500)` |
| `--dsw-specific-sidebar-fill` | `var(--dsw-static-neutral-bluish-50)` | `var(--dsw-static-neutral-bluish-900)` |

The full 118 alias/specific names are listed in **Appendix A**; the complete
425-name union with per-sheet light/dark values is in `$X\tokens.json` and
`scratch\alias-tokens.txt`.

The shipped README (`$X\…\ui-theme\README.md:131–132`) states the explicit
design constraint: *"Third-party themes are an extension point, not a product —
registering one means overriding same-named alias variables; no validation exists
that an override set is complete."*

### 1.4 How tokens reach CSS — and light/dark handling

The **presenter** is not in ui-theme; it is in
`app.asar!/node_modules/@deepseek-ai/dsh-client-ui-layout/lib/client.js:503–585`:

```js
const DARK_ATTRIBUTE = "data-ds-dark-theme";
const THEME_SOURCE_ATTRIBUTE = "data-ds-theme-source";
apply(snapshot) {
  const scheme = snapshot.active.colorScheme;
  document.documentElement.style.colorScheme = scheme;
  document.documentElement.setAttribute(THEME_SOURCE_ATTRIBUTE,
      snapshot.preference === "system" ? "system" : scheme);
  const body = document.body;
  if (scheme === "dark") body.setAttribute(DARK_ATTRIBUTE, "");
  else body.removeAttribute(DARK_ATTRIBUTE);
  ... font variables ...
  for (const name of this.appliedTokens) body.style.removeProperty(name);
  this.appliedTokens = [];
  for (const [name, value] of Object.entries(snapshot.active.tokens)) {
    body.style.setProperty(name, value);
    this.appliedTokens.push(name);
  }
  this.themeColorMeta.content = getComputedStyle(body).backgroundColor;
  ...
}
```

Wired at lines 700–710: `presenter.apply(ctx.theme.getTheme())` and
`ctx.on("theme/change", s => presenter.apply(s))` inside a `ctx.effect`.

So:

* CSS variable naming = **the key is used verbatim** as a custom property on
  `document.body.style` (`--dsw-alias-…` etc.). No prefixing, no `--dsw-theme-*`
  translation, no validation, no per-key light/dark split at write time.
* Light/dark base palettes come from the two stylesheet blocks
  `body{…}` and `body[data-ds-dark-theme]{…}`; the presenter toggles the
  `data-ds-dark-theme` **body attribute** from `active.colorScheme` (never from
  the theme id; `system` is resolved upstream via
  `matchMedia("(prefers-color-scheme: dark)")` in `ThemeRuntime`).
* Token values are **inline styles on `<body>`**, which outrank the authored
  `body{…}` / `body[data-ds-dark-theme]{…}` rules — that is the override mechanism.
* `document.documentElement.style.colorScheme = scheme` and
  `data-ds-theme-source` are also set (the Electron preload forwards the latter
  to `nativeTheme.themeSource`).

**Can a single `ThemeDefinition` with `colorScheme: 'dark'` override only the dark
palette while inheriting base variables?** Yes, in the sense that matters:

* registering `{ id: 'kurisu', colorScheme: 'dark', tokens: { '--dsw-alias-bg-base': '#101018', … } }`
  and then `setTheme('kurisu')` makes the presenter set `data-ds-dark-theme`, so all
  **dark** sheet values apply; only the keys you listed are replaced with your
  inline values on `body`, and every unlisted token keeps its shipped dark value.
* `buildSnapshot()` resolves `resolvedId` from the preference, so while the user
  preference is `light` / `dark` / `system`, your theme is *not active at all*.
  You must call `ctx.theme.setTheme('kurisu')` (or use `overrideTokens`, which
  applies to whichever theme is active).
* A definition with `colorScheme: 'light'` and only light overrides is the mirror
  case; there is no "dark-only partial override" that also works when the user is
  in light mode. Use `overrideTokens('…', { name: { light, dark } })` for
  scheme-aware two-palette overrides — that API explicitly selects
  `modes[active.colorScheme]`.
* **Persistence gotcha** (lines 1712–1717): `setTheme(id)` only writes the durable
  `ui-theme.preference` setting when `isThemePreference(id)` is true; that helper
  (line 1128) accepts only `light | dark | system` (schema in `lib/index.js:5–9`).
  A third-party theme id therefore does **not survive a restart / reconnect**;
  your plugin must re-register and re-call `setTheme` on each activation. This
  matches the README note *"Third-party theme ids remain an in-process extension
  and do not cross the built-in settings schema."* (`README.md:42`)

### 1.5 Appearance settings: registered themes are **not** listed

`lib/client.js:53–95` — the General → Appearance row is three **hardcoded** cubes:

```js
const CUBES = [
  { id: "light",  labelKey: "appearance.light",  Icon: IconLightOutlineMedium },
  { id: "dark",   labelKey: "appearance.dark",   Icon: IconDarkOutlineMedium },
  { id: "system", labelKey: "appearance.system", Icon: IconFollowsystemOutlineMedium }
];
function AppearanceRow({ t, setTheme, useStore }) {
  const preference = useStore((s) => s.preference);
  return ... CUBES.map(({id,labelKey,Icon}) => button onClick={() => setTheme(id)} ... t(labelKey))
}
```

The store (`createAppearanceRowStore`) holds only `{preference, revision}`. The
plugin registers exactly two slots at lines 2046 and 2054:
`settings.general.item` ids `appearance` (order 10) and `font-size` (order 11).
**No label, no id, no list of registered themes anywhere in Appearance.** Labels
used are localized strings (`appearance.light/dark/system`) from the `settings.theme`
dictionary (lines 1463–1517).

A third-party UI *can* enumerate them. Shipped example `dshmarket`
(`$X\node_modules\dshmarket\client\client.js`):

```js
// 13353-13356: Themes tab, uses the theme id AS the displayed label
const extra = themeSnap.themes.filter((def) => def.id !== "light" && def.id !== "dark");
children: extra.map((def) => themeCard(def.id, def.id, themeSwatch(def)))
// 12147-12180: card active-state + Apply button
const active = themeSnap !== null && themeSnap.preference === id;
onClick: () => { try { props.theme.setTheme(id); } catch (error) { setInstallError(String(error)); } }
// 2385-2397: swatch reads def.tokens as flat strings, def.colorScheme === "dark"
// 15918-15921: ctx.theme and ctx.on("theme/change", cb) / ctx.theme.getTheme()
```

`themeSwatch()` uses exactly 4 of the 14 advertised tokens
(`bg-base`, `bg-layer-2`, `brand-primary`, `label-primary`) with hardcoded
fallbacks. So: **label = `def.id`**; there is no `label`/`name` field in
`ThemeDefinition`. If you want a human label you must build your own settings UI
or a `settings.general.item` slot.

### 1.6 Token values: arbitrary CSS strings are allowed

* Validation checks **only `typeof === "string"`** (both `validateOverrides` and
  the absence of any check in `register`). There is no color parser, no
  allowlist, no `CSS.supports()` call.
* `exportInspectTokens()` calls override-only names `"CSS value"` (not
  `"CSS color"`), i.e. the runtime itself describes arbitrary names as arbitrary
  CSS values.
* The shipped sheets already use compound values as tokens, e.g.
  `design-platform.css`:
  `--dsw-alias-bg-document-selection:color-mix(in srgb, var(--dsw-static-blue-500) 40%, transparent);`
  and `--dsw-alias-label-shimmer:color-mix(in srgb, var(--dsw-static-neutral-1000) 30%, transparent);`
  `gradient-shadow-text.css`:
  `--dsw-linear-gradient-think:linear-gradient(180deg, #fff 20.19%, #fff0 100%);`
  and nearly all tokens are `var(--dsw-static-…)`.
* Therefore `linear-gradient(...)`, `color-mix(...)`, `var(...)`, `rgba(...)`,
  `url(...)` are all accepted as token values.

**Caveat (observed, not speculation)** — the same token is consumed in different
CSS positions. `design-platform.css` has `body{…;background-color:var(--dsw-alias-bg-base)}`
whereas `$X\…\ui-layout\lib\client.js:73` has
`.MnhYfG_frame{background:var(--dsw-alias-bg-base);…}` and
`.MnhYfG_bottomRow{background:var(--dsw-alias-bg-base)}`. A gradient assigned to
`--dsw-alias-bg-base` is valid in the `background:` shorthand but **invalid** in
`background-color:` (the declaration is dropped → transparent). For a wallpaper,
do not hijack a color token with an image value; use a dedicated rule (§3).

---

## 2. Background image / wallpaper: no theme mechanism exists

### 2.1 Negative evidence (exhaustive for the shipped client)

* `ui-theme/lib/client.js` contains **0** occurrences of `background-image`,
  `url(`, `wallpaper` (measured). Its 8 token sheets contain only colors,
  gradients-as-*colors*, fonts, shadows.
* `--dsw-alias-bg-mask-photo` is a plain color `#000000e0` (photo mask), not an
  image.
* Full-asar grep (`scratch/asar-grep.js`, needle `wallpaper`, 16,114 JS/JSON/YML
  files scanned) found only the **lucide-react icon** named `Wallpaper` inside
  `@agents-anywhere/dsh-bridge-next`. No app wallpaper feature.
* Grep of all `@deepseek-ai/dsh-client*` bundles for `background-image` found only
  2 hits: a select-chevron SVG in `dsh-client-ui-conversation` and one in
  `dsh-client-ui-settings-models`.
* `ThemeDefinition` has no image/asset field; the theme registry, snapshot,
  settings schema (`lib/index.js:87–95`: `preference`, `fontSize`,
  `codeFontSize`, `terminalFontSize`, `textFontFamily`, `codeFontFamily`,
  `terminalFontFamily`) and `AppearanceRow` have no image concept.
* `dshmarket/lib/themes.js` treats "theme" as **a whole plugin bundle** (market
  category `theme`) that is enabled/disabled as a Loader entry, with exactly one
  active theme (`activateTheme(name)`); that is the product-level "theme" concept,
  and it still carries no image asset — a theme bundle must inject its own CSS.

**Conclusion**: a registered `ThemeDefinition` cannot carry a wallpaper. A plugin
must inject a global stylesheet (or mount an overlay component). Both supported
paths are below.

### 2.2 Supported path A — static client plugin: `ctx.effect` + `<style>`

Exact pattern used by the shipped theme plugin itself
(`ui-theme/lib/client.js:1446–1458`, verbatim):

```js
function installThemeStyles(ctx) {
  if (typeof document === "undefined") return;
  for (const [name, css] of STYLES) ctx.effect(() => {
    const tag = document.createElement("style");
    tag.dataset.plugin = PLUGIN_ID;                 // "@deepseek-ai/dsh-client-ui-theme"
    tag.dataset.pluginCss = `${PLUGIN_ID}/${name}`;
    tag.textContent = css;
    document.head.appendChild(tag);
    return () => { tag.remove(); };
  }, `ui-theme: ${name} stylesheet`);
}
```

`ctx.effect(callback, label?)` is the Cordis effect primitive; the callback's
returned function is the disposer (also documented for dynamic plugins at
`dsh-cordis-client-runner/lib/client.js:6890`:
`ctx.effect(callback: Function, label?: string): () => void`).

Safe wallpaper stylesheet shape (add as a plugin-owned tag, do **not** touch
`--dsw-alias-bg-base` with an image value):

```css
body::before {
  content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image: url("data:image/png;base64,…");  /* or an app-served /plugins/… URL */
  background-size: cover; background-position: center;
}
/* Make the surfaces sitting above it translucent via the supported color tokens: */
body { --dsw-alias-bg-base: #101018b8; --dsw-alias-bg-layer-1: #101018cc; … }
```

Note `.MnhYfG_overlayLayer{z-index:20;pointer-events:none;position:absolute;inset:0}`
and `.MnhYfG_overlayLayer>*{pointer-events:auto}` in ui-layout CSS — a DOM overlay
child needs its own `pointer-events:none` if it must not intercept clicks.

### 2.3 Supported path B — `shell.overlay` slot / root replacement

`app.asar!/node_modules/@deepseek-ai/dsh-client-ui-layout/lib/client.js:623–653`
declares the root's child slots when it registers the `root` slot:

```js
const disposeRegistration = ctx.slots.register({
  name: "root", locale: "common",
  children: {
    "sidebar":       { kind: "single", scope: "root" },
    "main":          { kind: "keyed",  scope: "root" },
    "rightbar":      { kind: "single", scope: "root" },
    "shell.bottom":  { kind: "single", scope: "root" },
    "shell.overlay": { kind: "list",   scope: "root" },
    "shell.leading": { kind: "single", scope: "root" }
  },
  store
}, AppFrame);
```

`shell.overlay` is a **`list`** slot. A real installed plugin registers into it
(`<home>\.dsh\profiles\desktop\node_modules\dsh-workspace-scope\lib\client.js`,
tail):

```js
ctx.slots.inject("shell.overlay", () => ctx.slots.register({
  name: "shell.overlay", id: "workspace-scope-modal", order: 50
}, (props) => React.createElement(ScopeModalSeat, props)));
```

`dshmarket/client/client.js:16052` does the same. `ctx.slots.register` returns a
disposer; `ctx.slots.inject(name, factory)` waits for the declaring owner and its
disposer collapses contributions on unload (`ui-slots/README.md:48`). Slot rules:
`SlotCore` seeds `'root'`, a slot must be **declared** by its parent before anyone
can register, kinds are `single | list | keyed | chain`. A `root` *replacement* is
not needed and would conflict: ui-layout is the sole registrant allowed to render
`root` (`README.md:48` "Declaring a slot is claiming it").

### 2.4 Supported path C — dynamic client plugin `styles.insert(css)`

If the skin is authored as a **dynamic** plugin (`@deepseek-ai/dsh-cordis-client-runner`
evaluated client half), you get a purpose-built API —
`app.asar!/node_modules/@deepseek-ai/dsh-cordis-client-runner/lib/client.js:71–105`:

```js
var DynamicCordisStyles = class {
  pluginId; tags = new Set();
  insert(css) {
    if (typeof css !== "string") throw new Error("styles.insert(css) needs a CSS string");
    const tag = document.createElement("style");
    tag.dataset.dyn = this.pluginId;
    tag.textContent = css;
    document.head.append(tag);
    this.tags.add(tag);
    return () => { this.tags.delete(tag); tag.remove(); };
  }
  dispose() { for (const tag of this.tags) tag.remove(); this.tags.clear(); }
};
```

Inspect contract (same file, lines 6907–6911):
`styles` — *"Package-owned stylesheet insertion cleaned up with the Client run"*,
signature `styles.insert(css: string): () => void`.
Dynamic `ctx.theme.overrideTokens(source, tokens)` (lines 300–318) **forces**
`source` to `` `${pluginId}.${packageId}` `` and hangs the layer disposer on the
calling fiber, and rejects the one-argument form with a teaching error:

```js
if (tokens === void 0 && typeof source === "object" && source !== null)
  return rejectGuard(env, "theme.overrideTokens(source, tokens) takes two arguments; source is replaced with your package id, so pass any string first and the token map second: overrideTokens('mine', { '--dsw-alias-…': { light: '…', dark: '…' } })");
const dispose = Reflect.apply(method, target, [`${env.pkg.pluginId}.${env.pkg.packageId}`, tokens]);
ctx.effect(() => dispose, "cordis-client-runner: dynamic theme override layer");
```

### 2.5 HMR / dispose semantics (exact)

From `$X\node_modules\@deepseek-ai\dsh-client-modules\lib\client.js` and
`dsh-client-hmr\README.md`:

* Executing a bundle only **registers** a factory; side effects run at
  `factory(require)` materialization (lines 16–31).
* Styles injected during materialization are auto-claimed (lines 617–631):

```js
const untaggedStyles = () => new Set(document.querySelectorAll("style:not([data-plugin])"));
const claimStyles = (id, before) => {
  for (const el of untaggedStyles()) if (!before.has(el)) el.setAttribute("data-plugin", id);
  return [...document.querySelectorAll(`style[data-plugin=${JSON.stringify(id)}]`)]
    .map(el => el.getAttribute("data-plugin-css") ?? id);
};
```

* Styles created later inside `apply()` are not claimed; they must be removed by
  the `ctx.effect` disposer, and should carry `data-plugin = <package id>` so
  `removeOwnedStyles(id)` (lines 312–315) also clears them on code replacement:

```js
function removeOwnedStyles(id) {
  for (const el of document.querySelectorAll("style[data-plugin]"))
    if (el.getAttribute("data-plugin") === id) el.remove();
}
```

* `ClientEntries.replace()` (lines 492–505): `invalidateForReplacement` →
  `prefetch` → `tearDownEntryFiber` (**drains the old fiber**, so effect disposers
  run) → `removeOwnedStyles(id)` → `import` new exports → `entry.refresh()`.
  HMR README line 66: *"deletes the registry runtime, drains the old fiber,
  clears its entry reference and removes owned styles … CSS is injected after old
  effects have finished."*
* Revisions are derived from `mtimeMs`, `ctimeMs`, `size` of `lib/client.js`;
  HMR polls every `pollIntervalMs` (default 500) and emits a `rebuilt` frame;
  a successful swap **re-executes the bundle and remounts the plugin with fresh
  state**; React state inside the plugin is lost, session state survives
  (`dsh-client-hmr/README.md:32–48, 62–67`). A plugin that depends on the reloaded
  one reloads with it automatically.
* Enabling/disabling a plugin adds/removes its Loader entry; *"disabling it removes
  the entry and waits for its asynchronous effects before evicting unused modules
  and styles"* (`dsh-client-modules/README.md:42`).

**Therefore**: for a static plugin, always do BOTH — set
`tag.dataset.plugin = '<your package name>'` and return `() => tag.remove()` from
`ctx.effect`. For a dynamic plugin, `styles.insert(css)` handles both
(`data-dyn` + `DynamicCordisStyles.dispose()` on teardown, line 641).

---

## 3. Minimal working web-platform client plugin (this build)

### 3.1 File layout (minimal, verified against shipped packages)

```
<profile>/node_modules/kurisu-skin/
├── package.json          # REQUIRED: dsh.client + exports["./client"] + main
├── cordis.patch.yml      # REQUIRED when installed via `dsh plugin add`
├── lib/
│   ├── index.js          # REQUIRED host half, may be a no-op
│   └── client.js         # REQUIRED client bundle (the __ModuleLoader__.load wrapper)
└── (optional) assets, README
```

And an `- insert:` row in the **profile** patch layer
`<home>\.dsh\profiles\desktop\cordis.patch.yml` (see §3.4).

### 3.2 `package.json` — exact fields

Modeled on the two live examples
`app.asar!/node_modules/dshmarket/package.json:23–49` and
`<home>\.dsh\profiles\desktop\node_modules\dsh-workspace-scope\package.json:28–59`:

```json
{
  "name": "kurisu-skin",
  "version": "0.1.0",
  "type": "module",
  "main": "lib/index.js",
  "exports": {
    ".": "./lib/index.js",
    "./client": "./lib/client.js",
    "./cordis.patch.yml": "./cordis.patch.yml",
    "./package.json": "./package.json"
  },
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "inject": ["@deepseek-ai/dsh-client-ui-theme"]
    }
  },
  "peerDependencies": { "@deepseek-ai/cordis": "~4.0.5" }
}
```

Field semantics (verified in `dsh-client-modules/lib/index.js:61–75, 171–181,
720–750, 402–410`):

| field | meaning |
|---|---|
| `dsh.client.platform` | **required string**; must be `"web"` for the row to be scanned (`platform !== "web"` ⇒ row skipped). |
| `exports["./client"]` | **required**; string, or object with a string `default`. Resolved relative to the package root → `clientPath`. Missing ⇒ hard error `"declares dsh.client but exports no \"./client\" bundle"`. |
| `dsh.client.inject` | optional `string[]` of **package ids**: those graph rows must *arrive* before this one (`client-modules/lib/client.js:789–792`). Also copied onto the boot plugin row. It is **not** the Cordis service injection list. |
| `dsh.client.external` | optional `string[]`: extra `require()` specifiers resolved against another dynamic graph row or a static-table key. Used by `orderByModuleGraph()`; self-requests, missing suppliers and cycles are rejected (`lib/index.js:422–444`). |
| `dsh.client.immediately` | optional boolean; prefetch this row at boot (`index-shell.js` `prefetchImmediateTier`). |
| `dsh.bundle.patch` | path to the package's own `cordis.patch.yml` for `dsh plugin add`. |
| `main` / `exports["."]` | **required** host half module (see §3.5). |

`react` and `react-dom` are **not** npm dependencies you need to install for the
browser half — they come from the shell's seed table (§3.6). Third-party plugins
still declare them as `peerDependencies`/`devDependencies` for typechecking
(e.g. `dsh-workspace-scope` declares `react: "^18.2.0"`, `dshmarket` `^18.3.1`).

### 3.3 `cordis.patch.yml` (bundle patch, inside the package)

Exact minimal form from `app.asar!/node_modules/dshmarket/cordis.patch.yml`
(4 lines) and `dsh-workspace-scope/cordis.patch.yml`:

```yaml
- insert:
    - id: kurisu-skin
      name: 'kurisu-skin'
```

`id` is the Loader entry id (may differ from the package name — `dshmarket` uses
`id: dsh-market`, `name: 'dshmarket'`); `name` is the **module specifier** the
Loader imports on the host side and the key used to locate `package.json`.
You may also need `- insert:` at the bottom of the *profile* patch itself
(`cordis.patch.yml` — the same `- insert:` shape is used for staged local plugins,
e.g. lines 113–115 `- id: dsh-any-skills / name: dsh-any-skills`).

### 3.4 `lib/index.js` — host half is MANDATORY but may be empty

A Loader row imports its host module to resolve the package root:
`dsh-client-modules/lib/index.js:762–786` (`locatePkgJson()` →
`internal.resolveSync(baseUrl, { specifier: loaderName })` → nearest
`package.json`). If that resolution fails, `resolveMeta()` returns `null` and the
package never becomes a boot-graph row, so its client bundle is never served.
A real example (`dshmarket`) uses `id: dsh-market`, `name: 'dshmarket'` — the
`name` is the imported module specifier. The shipped browser-only plugin
`app.asar!/node_modules/@deepseek-ai/dsh-client-ui-layout/lib/index.js`
is exactly this (6 lines):

```js
/** Host loader entry for the browser-only layout plugin. */
/** Provides no host-side behavior. */
function apply() {}
export { apply };
```

Plugin shape is enforced by Cordis
(`app.asar!/node_modules/@deepseek-ai/cordis/src/registry.ts:8–9, 222–227,
316–336`):

```ts
function isApplicable(object) { return object && typeof object === 'object' && typeof object.apply === 'function' }
resolve(plugin) { if (typeof plugin === 'function') return plugin; if (isApplicable(plugin)) return plugin.apply; }
plugin(plugin, config) {
  const callback = this.resolve(plugin);
  if (!callback) throw new Error('invalid plugin, expect function or object with an "apply" method …');
  let name = plugin.name; if (name === 'apply') name = undefined;
  runtime = { name, callback, fibers: …, Config: plugin.Config };
  new Fiber(this.ctx, config, Inject.resolve(plugin.inject), runtime, …);
}
```

So: **`exports.apply` (named export) is the canonical shape**. `exports.inject`
(service names), `exports.name`, `exports.Config` are read from the same object.
A `default` export also works *in principle* because the Loader unwraps it
(`cordis-plugin-loader/src/index.ts:201–208`):

```ts
unwrapExports(exports) {
  if (isNullable(exports)) return exports;
  exports = exports.default ?? exports;
  if (!exports.__esModule) return exports;
  return exports.default ?? exports;
}
```

…but **`exports.default` takes precedence over the object's own `apply`**, and no
shipped client plugin uses default. Use named `exports.apply` — all shipped
bundles end with `exports.apply = apply; exports.inject = inject; …; return module.exports;`.

### 3.5 `lib/client.js` — exact bundle wrapper

Verbatim head of every shipped bundle, e.g.
`app.asar!/node_modules/@deepseek-ai/dsh-client-ui-layout/lib/client.js:1–6`
and the tail at 713–718; also
`<home>\.dsh\profiles\desktop\node_modules\dsh-workspace-scope\lib\client.js`:

```js
window.__ModuleLoader__.load({
  id: "kurisu-skin",                        // must equal the package name / graph row id
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    // ...your code; side effects here run at materialization, not at script execution...

    const inject = ["theme"];              // Cordis SERVICE names (not package ids)
    function apply(ctx) {
      ctx.effect(() => {
        const tag = document.createElement("style");
        tag.dataset.plugin = "kurisu-skin";
        tag.dataset.pluginCss = "kurisu-skin/wallpaper.css";
        tag.textContent = `body::before{content:"";position:fixed;inset:0;pointer-events:none;background-image:url("data:…");background-size:cover}`;
        document.head.appendChild(tag);
        return () => tag.remove();
      }, "kurisu-skin: wallpaper stylesheet");

      // Option 1 — scheme-aware token override (applies to whatever theme is active):
      const offTokens = ctx.theme.overrideTokens("kurisu-skin", {
        "--dsw-alias-bg-base":          { light: "#f4efffb8", dark: "#101018b8" },
        "--dsw-alias-bg-layer-1":      { light: "#ffffffcc", dark: "#1b1b24cc" },
        "--dsw-specific-sidebar-fill": { light: "#eae4f5cc", dark: "#15151fcc" }
      });
      ctx.effect(() => offTokens, "kurisu-skin: token layer");

      // Option 2 — a selectable registered theme (must re-apply on every activation):
      const offTheme = ctx.theme.register({
        id: "kurisu", colorScheme: "dark", tokens: { "--dsw-alias-bg-base": "#101018" }
      });
      ctx.effect(() => offTheme, "kurisu-skin: theme registration");
      ctx.theme.setTheme("kurisu");
    }
    exports.apply = apply;
    exports.inject = inject;
    exports.name = "kurisu-skin";
    return module.exports;
  }
});
// optional: //# sourceMappingURL=client.js.map
```

Wrapper contract (verified `$X\…\dsh-client-modules\lib\client.js:696–714`):
`load({ id, factory, chunk? })`; `id` is normalized by stripping a trailing
`/client`; duplicate registration throws; `factory(require)` is memoized in
`loadCache`, require cycles throw. Bundles are served as classic scripts from
`plugins/??<id>/client.js&rev=<rev>` (document-relative) — the host composes the
URLs, you do not write them. The host snapshots the file's `mtimeMs/ctimeMs/size`
to make `rev` (`README.md:78, 134`).

Note `require` must be **self-contained**: no top-level DOM writes outside the
factory (CSS injected during factory materialization is claimed, but everything
is cleaner inside `apply` + `ctx.effect`).

### 3.6 What `require()` can resolve

The shell seeds a frozen static module table (`SZ()`) in
`app.asar!/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-CN7NIWNw.js`
(located near the end, invoked as `staticModules: SZ()` in `TZ.run`):

```js
function SZ(){return{
  react:sC, "react/jsx-runtime":uC, "react-dom":mC, "react-dom/client":yC,
  "@deepseek-ai/cordis":Fb, zod:Zj, "@tanstack/react-virtual":Yj,
  "@deepseek-ai/dsh-client-store":wI,
  "@deepseek-ai/dsh-client-ui-slots":SI,
  "@deepseek-ai/dsh-client-ui-primitives":zU,
  "@deepseek-ai/dsh-client-ui-dockkit":xZ
}}
```

Exact `require` resolution (`dsh-client-modules/lib/client.js:832–849`):

```js
const require = (spec) => {
  edges.add(spec);
  if (this.seed.has(spec)) return this.seed.get(spec);
  const id = stripClientSuffix(spec);
  const record = this.loadCache.get(id);
  if (record !== void 0) return record.exports;
  if (this.factories.has(id)) return this.materialize(id).exports;
  throw new Error(`client-modules: require("${spec}") missed the module table — …`);
};
require.async = async (spec) => { /* ./client.<name>.js chunks, or import(spec) */ };
```

So:

* **Seed words** (no declaration needed): the 11 keys above — `react`,
  `react/jsx-runtime`, `react-dom`, `react-dom/client`, `@deepseek-ai/cordis`,
  `zod`, `@tanstack/react-virtual`, `@deepseek-ai/dsh-client-store`,
  `@deepseek-ai/dsh-client-ui-slots`, `@deepseek-ai/dsh-client-ui-primitives`,
  `@deepseek-ai/dsh-client-ui-dockkit`.
* **Any other `@deepseek-ai/*` package** (including
  `@deepseek-ai/dsh-client-ui-theme`) is **not** in the seed table. `require()`
  of it succeeds only if that package is a boot-graph row whose factory has
  arrived, and it must be named in `dsh.client.external` so the host orders/validates
  the graph (`orderByModuleGraph`, `lib/index.js:422–444`). `<id>/client` and
  the bare `<id>` resolve to the same exports (`stripClientSuffix`,
  `lib/client.js:98–100`).
* **You usually do not need to `require` the theme package at all**: the theme is
  a Cordis **service** reached by declaring `exports.inject = ["theme"]` and
  reading `ctx.theme`. `dsh.client.inject` can additionally list the package id
  to force bundle arrival order (`dshmarket` does exactly this).
* `require.async("./client.<name>.js")` loads a package-local chunk; entry and
  chunk outputs cannot synchronously require another relative `client*.js`
  (`README.md:72`).

### 3.7 End-to-end load chain (verified)

1. Profile patch `- insert: {id, name}` → Loader entry (host + browser graph).
2. `@deepseek-ai/dsh-client-modules` host half `ClientModuleRegistry.resolveMeta()`
   (`lib/index.js:720–750`) reads the Loader row's nearest `package.json`,
   validates `dsh.client.platform === "web"`, resolves `exports["./client"]`.
3. It composes `window.__DSH_BOOT__` (`entries`, `batches`, `rev`, `release`) and
   injects head rows: the `window.__ModuleLoader__` queue facade, combo preloads,
   blocking bootstrap scripts (`lib/index.js:449–479`).
4. Web shell `TZ.run()` (`web-frontend/index-shell.js`):
   `r.create({boot: __DSH_BOOT__, staticModules: SZ(), …})` →
   `loader.internal = modules` → `entries.start(loader, manifest)` →
   `ClientEntries.create(loader, id)` uses `{name: id}` (`lib/client.js:483–490`).
5. `arriveGraphRow()` loads the combo script → the bundle executes
   `window.__ModuleLoader__.load({id, factory})` → `register()` only stores the
   factory (`lib/client.js:702–714`).
6. `materialize()` calls `factory(require)` and claims styles
   (`817–830`); `loader.unwrapExports()` → `registry.plugin()` → `apply(ctx, config)`.
   `apply` registers `ctx.effect`s, slot contributions, theme overrides, etc.
7. `ctx.theme` is available to your plugin because ui-theme calls
   `ctx.provide("theme", theme)` (`ui-theme/lib/client.js:2029`) and your plugin
   declares `exports.inject = ["theme"]`, which parks your Cordis fiber until that
   service exists. ui-theme's own `dsh.client.immediately: true` makes the shell
   prefetch its bundle at boot.

---

## 4. Versions to match (from `app.asar!/package.json`)

| package | shipped version | source |
|---|---|---|
| app (`dsh-desktop-next`) | **`2.0.19-next`** | `app.asar!/package.json:3` |
| `@deepseek-ai/dsh` and **all** `@deepseek-ai/dsh-*` incl. `dsh-client-ui-theme`, `dsh-client-modules`, `dsh-client-ui-layout`, `dsh-cordis-client-runner`, `dsh-web`, `dsh-web-app`, `dsh-web-frontend`, `dsh-client-hmr`, `dsh-client-ui-slots`, `dsh-plugin-manager` | **`0.2.1-rc.2`** | `app.asar!/package.json:19–198`; each package's own `package.json` |
| `@deepseek-ai/cordis` | **`4.0.5`** | `app.asar!/package.json:14`; `node_modules/@deepseek-ai/cordis/package.json` |
| `@deepseek-ai/cordis-plugin-loader` | `1.0.6` | `app.asar!/package.json:17` |
| `@deepseek-ai/schemastery` | `^3.18.5` | `app.asar!/package.json:188`; ui-theme `dependencies: ~3.18.5` |
| `react` | **`18.3.1`** | `app.asar!/package.json:196` |
| `pnpm` | `11.8.0` | `app.asar!/package.json:195` |
| `dshmarket` | `1.66.36` | `app.asar!/package.json:190` |
| `dsh-community-market` | `0.1.0-dev.0` | `app.asar!/package.json:189` |

Peer ranges that shipped first-party theme packages declare:
`"@deepseek-ai/cordis": "~4.0.5"`. Working third-party plugins in this profile
use `"@deepseek-ai/cordis": "^4.0.1"` (`dshmarket`, `dsh-workspace-scope`) and
`"react": "^18.2.0"`. For a new skin, `"@deepseek-ai/cordis": "~4.0.5"` and
`"react": "^18.3.1"` are the exact matches; nothing else is needed at runtime.

---

## 5. Practical recommendations for the skin (marked `[inference]`)

1. `[inference]` Use **`overrideTokens`** as the primary mechanism, not
   `register` + `setTheme`: it is scheme-aware (`{light,dark}` pairs), stacks on
   whatever preference the user chose, needs no persistence workaround, and is
   automatically cleaned up on plugin unload.
2. `[inference]` For the wallpaper, inject one `data-plugin`-tagged stylesheet
   through `ctx.effect` (§2.2) or `styles.insert` for a dynamic plugin (§2.4).
   Keep color tokens as **colors** (use `rgba()`/`color-mix()` for translucency)
   and put the image in a dedicated `body::before` / overlay rule.
3. `[inference]` If you want a user-visible picker, register your own
   `settings.general.item` slot or a `shell.overlay` component; Appearance will
   never show your id.
4. `[inference]` Use `dsh.client.inject: ["@deepseek-ai/dsh-client-ui-theme"]`
   and `exports.inject: ["theme"]` (service) together; do **not** `require()` the
   theme package.
5. `[inference]` Touch `lib/client.js` (mtime/size) to trigger HMR; the page's
   existing Web GUI will swap the plugin without a full reload while
   `pnpm run dev:web` is running (per the runtime context note). Plain static
   file edits on a packaged profile do not have that watcher.

---

## Appendix A — all 118 `--dsw-alias-*` / `--dsw-specific-*` token names declared by ui-theme's 8 sheets

(The other 307 names are `--dsw-static-*`, `--dsw-font*`, `--dsh-*`, `--shiki-*`;
full union with light/dark values: `$X\tokens.json`.)

```
--dsw-alias-bg-base
--dsw-alias-bg-document-preview
--dsw-alias-bg-document-selection
--dsw-alias-bg-layer-1
--dsw-alias-bg-layer-2
--dsw-alias-bg-layer-3
--dsw-alias-bg-mask-1
--dsw-alias-bg-mask-2
--dsw-alias-bg-mask-3
--dsw-alias-bg-mask-drop
--dsw-alias-bg-mask-photo
--dsw-alias-bg-module-platform
--dsw-alias-bg-multi-select
--dsw-alias-bg-overlay
--dsw-alias-bg-skeleton
--dsw-alias-border-inverted
--dsw-alias-border-inverted2
--dsw-alias-border-l1
--dsw-alias-border-l2
--dsw-alias-border-l2-darkmode-thin
--dsw-alias-border-l3
--dsw-alias-border-l4
--dsw-alias-brand-primary
--dsw-alias-brand-primary-invert
--dsw-alias-brand-primary-new-colorprimary-new-color
--dsw-alias-brand-text
--dsw-alias-button-contrast-fill
--dsw-alias-button-elevated-fill
--dsw-alias-button-floating-fill
--dsw-alias-button-floating-hover
--dsw-alias-button-ghost-active-border
--dsw-alias-button-ghost-active-fill
--dsw-alias-button-ghost-active-hover
--dsw-alias-button-info-fill
--dsw-alias-button-info-hover
--dsw-alias-button-primary-dimmed
--dsw-alias-button-primary-fill
--dsw-alias-button-primary-hover
--dsw-alias-button-tool-bar-fill
--dsw-alias-button-tool-bar-fill-invisible
--dsw-alias-button-tool-bar-hover
--dsw-alias-code-diff-added
--dsw-alias-code-diff-deleted
--dsw-alias-file-diff-added-bg
--dsw-alias-file-diff-added-gutter
--dsw-alias-file-diff-added-marker
--dsw-alias-file-diff-deleted-bg
--dsw-alias-file-diff-deleted-gutter
--dsw-alias-file-diff-deleted-marker
--dsw-alias-interactive-bg-active
--dsw-alias-interactive-bg-hover
--dsw-alias-interactive-bg-hover-accent
--dsw-alias-interactive-bg-hover-danger
--dsw-alias-interactive-bg-hover-solid
--dsw-alias-label-caption
--dsw-alias-label-deep-diving
--dsw-alias-label-deep-diving-shimmer
--dsw-alias-label-dimmed
--dsw-alias-label-document-preview
--dsw-alias-label-primary
--dsw-alias-label-primary-bluish
--dsw-alias-label-primary-dimmed
--dsw-alias-label-primary-foreground
--dsw-alias-label-primary-inverted
--dsw-alias-label-secondary
--dsw-alias-label-shimmer
--dsw-alias-label-tertiary
--dsw-alias-link
--dsw-alias-markdown-citation
--dsw-alias-markdown-code-block
--dsw-alias-markdown-code-block-banner
--dsw-alias-markdown-code-segment-selected
--dsw-alias-markdown-code-segment-unselected
--dsw-alias-markdown-inline-code
--dsw-alias-markdown-placeholder
--dsw-alias-markdown-tag
--dsw-alias-menu-group-header-fill
--dsw-alias-menu-icon
--dsw-alias-onboarding-accent
--dsw-alias-onboarding-card-fill
--dsw-alias-onboarding-checkbox-border
--dsw-alias-onboarding-secondary-fill
--dsw-alias-scrollbar-bg-l1
--dsw-alias-scrollbar-bg-l2
--dsw-alias-scrollbar-hover-l1
--dsw-alias-scrollbar-hover-l2
--dsw-alias-settings-card-fill
--dsw-alias-settings-card-stroke
--dsw-alias-state-business-primary
--dsw-alias-state-business-tertiary
--dsw-alias-state-error-primary
--dsw-alias-state-error-secondary
--dsw-alias-state-idle-primary
--dsw-alias-state-success-primary
--dsw-alias-state-success-secondary
--dsw-alias-state-success-tertiary
--dsw-alias-state-warn-label
--dsw-alias-state-warn-primary
--dsw-alias-state-warn-secondary
--dsw-alias-state-warn-tertiary
--dsw-alias-switch-thumb
--dsw-alias-toast-bg
--dsw-alias-toast-label
--dsw-alias-tooltip-bg
--dsw-alias-tooltip-key-bg
--dsw-alias-turn-trigger-bg
--dsw-alias-turn-trigger-bg-hover
--dsw-specific-bubble
--dsw-specific-bubble-highlight
--dsw-specific-input-major
--dsw-specific-login-input
--dsw-specific-menu
--dsw-specific-selector
--dsw-specific-sidebar-fill
--dsw-specific-sidebar-nav-item-active
--dsw-specific-sidebar-nav-item-active-accent
--dsw-specific-sidebar-nav-item-hover
--dsw-specific-tip
```

## Appendix B — scratch files written

Under `<workspace>\kurisu-skin\research\`:

* `ui-theme-contract.md` — this report (the only deliverable).
* `scratch\asar.js`, `asar-ls.js`, `asar-grep.js`, `extract-tokens.js`,
  `dump14.js`, `dump-alias.js`, `all-entries.txt`, `list-ds.txt`,
  `list-theme.txt`, `alias-tokens.txt`, `token-summary.txt`,
  `grep-override.txt`, `grep-wallpaper.txt`, `grep-bgimage.txt`.
* `asar-extract\` — extracted asar files incl. `tokens.json`,
  `app-package.json`, `app-shell\`, `web-app\`, `web-frontend\`, `cordis\`,
  `cordis-plugin-loader\`, and the `@deepseek-ai` / `dshmarket` packages listed
  in §0.

No file outside that directory was modified; no npm installs, no network calls.
