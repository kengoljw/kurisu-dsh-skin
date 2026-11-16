# Native splash (asar header surgery, v2 / 5-beat sequence)

Paints the **Kurisu 5-beat boot sequence from t=0** instead of only the last ~4s
of host startup, and hands the *same* DOM element to the host injection at
readiness so there is no colour jump, duplicate board or flash.

The seam is `resources/app.asar -> lib/web-document.js -> LOADING_STYLE`:
`serveWebDocument()` does `body.toString().replace("<head>", "<head>" + LOADING_STYLE + APP_BOOT_SCRIPT)`,
so `LOADING_STYLE` is inserted **verbatim** into the first `<head>`. It can
therefore contain real `<style>` and `<script>` tags — this is HTML, not
`innerHTML`. The document is `text/html; charset=utf-8`, so the payload is
**UTF-8** (U+2588 block cursor and the Japanese caption `世界線 1.130205 確定`
are kept verbatim).

## What the payload does

`payload.mjs` builds `{ style, scripts }`:

* `style` = `LOAD_CSS` extracted **verbatim** from `src/host.template.js`
  (`extractLiteral(host, "LOAD_CSS")`), with **four** wallpaper placeholders
  `{{WALL_NIGHT}}` / `{{WALL_DAY}}` / `{{WALL_DUSK}}` / `{{WALL_LIBRARY}}`
  replaced by base64 data URIs built from `assets/wall-{night,day,dusk,library}.webp`.
  The saved choice is applied at runtime with
  `#ks-loadscreen[data-ks-wall="…"]`; `data-ks-light="1"` selects the light
  stack. All stacks start with the `linear-gradient(rgba(3,5,10,.66), …)` veil
  that keeps the instrument legible on the bright day wallpaper. A small
  additive native-only CSS block (first-paint `html/body` dark base, shell
  card/spinner `visibility:hidden`, amber wordmark) is appended after the shared
  block; it never overrides a `#ks-loadscreen` rule.
* `scripts[0]` = `src/sg-nixie.inline.js` (v4 zero-dependency `<sg-nixie>` Web
  Component), non-ASCII stripped (Chinese comments only), `<\/script` escaped.
* `scripts[1]` = `SEQUENCE_JS` extracted **verbatim** from
  `src/host.template.js` (`extractLiteral(host, "SEQUENCE_JS")`), UTF-8 intact.
  It defines `window.KS_SEQ` = `{ build, render, handoff, refs, built, mount,
  setWall, progress, phase, probe, PH, ROWS, BETA }` and `window.KS_PROBE`, and
  builds the entire boot DOM (snow canvas, PHONEWAVE terminal with 8 typewriter
  rows, white caption, nixie convergence panel, fly-out). It is guarded by
  `if (window.KS_SEQ) return;`, so the host's second copy is a no-op.
* `scripts[2]` = an ES5 builder that creates **one** `#ks-loadscreen`
  (`aria-hidden="true"`), attaches it to `document.documentElement` at t=0 and
  moves it into `document.body` on `DOMContentLoaded`. It seeds
  `data-ks-wall` from `localStorage["dsh-skin-kurisu:wallpaper"]` and
  `data-ks-light` from `prefers-color-scheme`, then calls `KS_SEQ.build(el)` —
  it does **not** recreate any beat DOM. It exposes `window.KS_SPLASH`, drives
  `KS_SEQ.render(p, arc)` with `p` from the shell's real `--dsh-boot-arc`
  (72deg..288deg -> 0..1, monotonic clamp; `elapsed/9000` wall-clock fallback
  when the spinner is absent so all 5 beats are visible) and passes the **raw
  degree value** as `arc` (or `null` with no spinner) — diagnostic-only and the
  same unit the host `LOAD_SCRIPT` uses, so `KS_PROBE.lastArc` never mixes units.
  It marks `KS_PROBE.mark("native-script-start")` and has a 60s safety ceiling
  that only fires if the host never adopts.

`verifyPayload()` asserts the encoding (no NUL / stray C0 / lone surrogates /
U+FFFD), `String.replace` safety, `</style>` safety, `<!--`/`-->` balance and
script-data double-escape safety, then runs `node --check` on all three escaped
script sources and reports per-script escaped byte counts. `node --check` also
runs on the reconstructed ESM `web-document.mjs` (see `fixture-test.mjs`).

## KS_SEQ / KS_PROBE contract

The overlay id is **`ks-loadscreen`**. Both the asar payload at t=0 and the host
injection at readiness use the **same** `SEQUENCE_JS`; the guarded second copy
is a no-op, so there is one DOM builder and one probe.

* `window.KS_SEQ.build(mount)` -> `{ meter, fill, val }`, builds all five beats.
* `window.KS_SEQ.render(p, arc)` -> phase number; drives snow, typewriter,
  caption, convergence (8 tubes, `1.130205`, digits `1130205`) and `handoff(h)`.
* `window.KS_SPLASH.adopt()` -> `KS_SEQ.refs()` (`{ meter, fill, val }`), stops
  the native 70ms ticker and 60s ceiling. The host sets
  `KS_SPLASH.adopted = true`; native ticker / ceiling / `finish()` then no-op.
* The host owns the `data-out="true"` 700ms cross-fade, `KS_SEQ.handoff(h)`,
  removal, and `document.documentElement.setAttribute("data-ks-ready","1")`,
  which the client plugin watches to ignite the sidebar meter.
* `window.KS_PROBE` records a structured cumulative timeline. Its `flush(tag)`
  mirrors to **`localStorage["ks-boot-tl"]`** and POSTs to
  **`http://127.0.0.1:8791/report`** (plus `sendBeacon` to the same URL), so
  boot diagnostics survive even with no collector running.

## The surgery

The old 512-byte equal-length CSS swap cannot hold a ~1 MB payload. Instead:

1. Parse the header JSON (starts at byte 16, `jsonSize` bytes).
2. Change **only** `lib/web-document.js`'s `offset` + `size`; drop its `integrity`
   object (frees ~220 bytes; the asar-integrity fuse is disabled).
3. `JSON.stringify(payload)` replaces the whole `const LOADING_STYLE = \`...\`;`
   statement — no backtick / `${` / backslash pitfalls. Every other byte of the
   8,457-byte original file is preserved (byte-level splice).
4. Append the new file at EOF; `offset = originalLength - base`.
5. Rewrite the header JSON padded with **trailing spaces to exactly `jsonSize`**
   at offset 16. The 16-byte preamble and the 2 alignment bytes stay untouched.
   If the minified JSON is longer than `jsonSize`, the patcher refuses loudly.

All 20,286 entries keep their exact offsets/sizes: no 180 MB repack.

Verified real-archive facts (read-only `--dry-run`):

| fact | value |
| --- | --- |
| original length (manifest) | 180,923,876 bytes |
| `jsonSize` / `headerSize` / `base` | 5,302,170 / 5,302,180 / 5,302,188 |
| original entry | `size=8457`, `offset="175598547"`, `integrity` **present** |
| header slack before | 0 bytes (JSON is byte-exact) |
| new minified header JSON | 5,301,966 bytes |
| header slack used (`padBytes`) | 204 bytes of trailing spaces — **fits** `jsonSize` |
| appended entry offset | 175,621,688 = 180,923,876 - 5,302,188 |
| `LOADING_STYLE` payload | 1,066,481 bytes (UTF-8) |
| new `lib/web-document.js` | 1,076,355 bytes |

The `size` field is now 7 digits, which costs one extra header byte compared
with the previous build; there is still 204 bytes of slack. Because
`payload.mjs` extracts `LOAD_CSS` and `SEQUENCE_JS` from `src/host.template.js`
at build time, these numbers move with that file (and with any concurrent edit
to it); always re-run `--dry-run` immediately before `--apply` for the
authoritative current byte count.

## Commands

Use the bundled node explicitly (node.exe is **not** on PATH). Run from the
workspace root `<workspace>`:

```powershell
$node = '<home>\.dsh\dsh-runtimes\dsh-next-primary-runtime\dependencies\node\bin\node.exe'

# 1. End-to-end proof on a tiny synthetic asar (never touches app.asar).
#    39 checks: surgery invariants, node --check on 3 scripts, UTF-8 round trip,
#    String.replace simulation, over-long-header refusal, full CLI round trip.
& $node 'kurisu-skin\research\native-splash\fixture-test.mjs'

# 2. Read-only plan against the REAL asar (default with no flag == --dry-run)
& $node 'kurisu-skin\research\patch-asar-splash.mjs' --dry-run

# 3. APPLY (writes app.asar; requires the Lead's approval)
& $node 'kurisu-skin\research\patch-asar-splash.mjs' --apply

# 4. Verify the applied archive
& $node 'kurisu-skin\research\patch-asar-splash.mjs' --verify

# 5. Independent byte-identity check of the applied LOADING_STYLE
& $node 'kurisu-skin\research\native-splash\verify-applied-payload.mjs'

# 6. Restore
& $node 'kurisu-skin\research\patch-asar-splash.mjs' --restore
```

`--apply` is **never** the default: no flag / `--dry-run` writes nothing. The two
env vars `KS_SPLASH_ASAR` / `KS_SPLASH_BACKUP_DIR` exist only so
`fixture-test.mjs` can point the CLI at a synthetic archive; leave them unset in
normal use. The first `--apply` writes backups **once** into this directory:

* `web-document.orig.js` — the original 8,457-byte entry
* `header.orig.json` — the original `jsonSize` header JSON bytes
* `backup-manifest.json` — original length, header facts, 5 sample entry hashes

Re-running `--apply` is idempotent: it rebuilds from those backups, truncates to
the recorded original length (dropping any previously appended bytes) and
appends the current payload. The guard refuses to write if the live entry offset
no longer matches the manifest (e.g. after a DSH upgrade). `--restore` writes
the original header bytes back at offset 16 and truncates `app.asar` to its
original byte length — the appended bytes were the only new data, and the
original entry bytes were never overwritten. The root
`asar-original-loading-style.txt` (v1 backup) is **never touched** by v2.

`verify-applied-payload.mjs` compares the bytes inside `app.asar` with
`buildLoadingStyle()` from the current `payload.mjs`; it reports
`BYTE-IDENTICAL: false` until `--apply` has re-patched with the current build.

## After a DSH upgrade

An upgrade replaces `resources/app.asar`, so the patch disappears (backups here
describe the **old** build). Do **not** re-run `--apply` against a changed
archive: the patcher detects that the entry offset no longer matches the manifest
and refuses. Delete the three backup files, re-run `--dry-run` to confirm the new
header facts (offsets, `jsonSize`, whether `integrity` is present), then
`--apply` once the Lead approves. `fixture-test.mjs` can be re-run any time — it
only uses a synthetic archive.
