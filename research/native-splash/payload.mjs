// Builds the exact LOADING_STYLE payload for the asar header-surgery patch (v2).
//
// LOADING_STYLE is inserted VERBATIM into the initial HTML <head> by
// lib/web-document.js (serveWebDocument), so it can contain <style> AND <script>
// tags; they are real HTML elements, not innerHTML text.
//
// Exports:
//   buildPayload(opts)          -> { style, scripts }   (the required contract)
//   extractLiteral(src, name)   -> raw body of "const <name> = `...`;"
//   extractLoadCss(src)         -> thin wrapper (requires NIGHT+DAY placeholders)
//   escapeScriptSource(src)     -> "</script" -> "<\/script" (case-insensitive)
//   assembleLoadingStyle(p)     -> the exact LOADING_STYLE string
//   buildLoadingStyle(opts)     -> convenience: assemble(buildPayload())
//   assertEncoding(src, label)  -> UTF-8-safe encoding check (alias assertAscii)
//   assertReplaceSafe(str, l)   -> guards String.replace substitution patterns
//   verifyPayload(p, opts)      -> full assertions + node --check per script
//
// The shared #ks-loadscreen stylesheet (LOAD_CSS) and the boot-sequence engine
// (SEQUENCE_JS) are read VERBATIM from src/host.template.js at build time, so
// the t=0 screen and the ~27s host-injected screen run identical rules/code.
// LOAD_CSS has FOUR wallpaper placeholders; SEQUENCE_JS is kept UTF-8 verbatim
// (U+2588 block cursor + Japanese caption) because the HTML is served as
// text/html; charset=utf-8 and web-document.js uses body.toString() (utf-8).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKIN = path.resolve(HERE, '..', '..');

export const PATHS = {
  component: path.join(SKIN, 'src', 'sg-nixie.inline.js'),
  hostTemplate: path.join(SKIN, 'src', 'host.template.js'),
  wallNight: path.join(SKIN, 'assets', 'wall-night.webp'),
  wallDay: path.join(SKIN, 'assets', 'wall-day.webp'),
  wallDusk: path.join(SKIN, 'assets', 'wall-dusk.webp'),
  wallLibrary: path.join(SKIN, 'assets', 'wall-library.webp')
};

export const WALL_KEYS = ['WALL_NIGHT', 'WALL_DAY', 'WALL_DUSK', 'WALL_LIBRARY'];

// ---------------------------------------------------------------- native extras
// These target the shell's own boot card, not #ks-loadscreen. The shared block
// already hides the card via [data-ks-boot="true"] once the host script runs;
// these rules extend that to t=0 and keep html/body dark as a first-paint
// fallback. All ASCII, all additive, no #ks-loadscreen rule is overridden.
const NATIVE_EXTRA_CSS = [
  '',
  '/* native-only: first-paint fallback + shell takeover (t=0) */',
  'html:has([data-dsh-boot]),body:has([data-dsh-boot]){background:#06080f!important;color-scheme:dark}',
  '@media (prefers-color-scheme: light){',
  'html:has([data-dsh-boot]),body:has([data-dsh-boot]){background:#f4eee6!important;color-scheme:light}',
  '}',
  'html:has(#ks-loadscreen) [data-dsh-boot]{background:transparent!important}',
  'html:has(#ks-loadscreen) [data-dsh-boot] [class*="_card"],',
  'html:has(#ks-loadscreen) [data-dsh-boot-spinner]{visibility:hidden!important}',
  'html:has(#ks-loadscreen) [data-dsh-boot]{color:#ffd0a4!important;',
  '--dsw-alias-label-primary:#ffd0a4;--dsw-alias-label-secondary:#e7b784;',
  '--dsw-alias-label-tertiary:#b98a5e;--dsw-alias-brand-primary:#ff7a00}',
  'html:has(#ks-loadscreen) [data-dsh-boot] *{color:#ffd0a4!important}',
  ''
].join('\n');

// ---------------------------------------------------------------- builder (ES5)
// Script #3. Plain ES5: no template literals, no backticks, no </script, ASCII
// only. It creates ONE #ks-loadscreen at t=0 and delegates ALL beat DOM to the
// shared window.KS_SEQ (SEQUENCE_JS is script #2). Contract with the host:
//   KS_SEQ.build(mount)  -> { meter, fill, val } (single source of DOM truth)
//   KS_SEQ.render(p, arc)-> drives all five beats from real --dsh-boot-arc
//   adopt()              -> stops ticker+ceiling, returns KS_SEQ.refs()
//   host sets KS_SPLASH.adopted = true; native ticker/ceiling/finish then no-op.
const BUILDER_JS = [
  '(function () {',
  '  "use strict";',
  '  var WIN = window;',
  '  if (WIN.KS_SPLASH) return;',
  '  if (document.getElementById("ks-loadscreen")) return;',
  '  var SEQ = WIN.KS_SEQ || null;',
  '  var probe = WIN.KS_PROBE || null;',
  '  try { if (probe && typeof probe.mark === "function") probe.mark("native-script-start"); } catch (e) {}',
  '',
  '  var el = document.createElement("div");',
  '  el.id = "ks-loadscreen";',
  '  el.setAttribute("aria-hidden", "true");',
  '',
  '  // Seed the saved wallpaper and OS light mode BEFORE first paint.',
  '  // KS_SEQ.build() calls setWall() with the same values; we only seed here',
  '  // and never replace a value the shared builder wrote.',
  '  var wall = "night";',
  '  try {',
  '    var saved = WIN.localStorage.getItem("dsh-skin-kurisu:wallpaper");',
  '    if (saved === "night" || saved === "day" || saved === "dusk" || saved === "library" || saved === "none") wall = saved;',
  '  } catch (e2) {}',
  '  el.setAttribute("data-ks-wall", wall);',
  '  var light = false;',
  '  try { light = WIN.matchMedia("(prefers-color-scheme: light)").matches; } catch (e3) {}',
  '  if (light) el.setAttribute("data-ks-light", "1"); else el.removeAttribute("data-ks-light");',
  '',
  '  // ONE shared DOM builder for all five beats (snow / PHONEWAVE terminal /',
  '  // white caption / nixie convergence / fly-out). Nothing is recreated here.',
  '  var refs = null;',
  '  try { if (SEQ && typeof SEQ.build === "function") refs = SEQ.build(el); } catch (e4) {}',
  '  if (!refs && SEQ && typeof SEQ.refs === "function") { try { refs = SEQ.refs(); } catch (e5) {} }',
  '  var meter = refs ? refs.meter : null;',
  '  var fill = refs ? refs.fill : null;',
  '  var val = refs ? refs.val : null;',
  '',
  '  // Paint at the earliest moment: attach to <html> while <head> is still',
  '  // being parsed, then move into <body> once it exists.',
  '  (document.documentElement || document.body).appendChild(el);',
  '  function move() {',
  '    if (document.body && el.parentNode !== document.body) document.body.appendChild(el);',
  '  }',
  '  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", move);',
  '  else move();',
  '',
  '  var shell0 = document.querySelector("[data-dsh-boot]");',
  '  if (shell0) shell0.setAttribute("data-ks-boot", "true");',
  '',
  '  var started = Date.now();',
  '  var lastProgress = 0, finished = false, ticker = 0, ceiling = 0;',
  '  var API = {',
  '    el: el, meter: meter, adopt: adopt, setProgress: setProgress,',
  '    finish: finish, native: true, adopted: false',
  '  };',
  '  WIN.KS_SPLASH = API;',
  '',
  '  // Real boot progress: 72deg..288deg -> 0..1. When the shell spinner is',
  '  // absent, fall back to wall clock over ~9000ms (NOT 2600ms) so the whole',
  '  // 5-beat sequence has time to be seen. The arc passed to KS_SEQ.render is',
  '  // the RAW degree value (or null): diagnostic-only, matching the host',
  '  // LOAD_SCRIPT so KS_PROBE.lastArc keeps one unit in its timeline column.',
  '  function readArcDeg() {',
  '    var arcEl = document.querySelector("[data-dsh-boot-spinner]");',
  '    if (!arcEl) return null;',
  '    var deg = NaN;',
  '    try { deg = parseFloat(arcEl.style.getPropertyValue("--dsh-boot-arc")); } catch (e6) {}',
  '    if (!isFinite(deg)) {',
  '      try { deg = parseFloat(WIN.getComputedStyle(arcEl).getPropertyValue("--dsh-boot-arc")); } catch (e7) {}',
  '    }',
  '    return isFinite(deg) ? deg : null;',
  '  }',
  '  function progressFromDeg(deg) {',
  '    if (deg !== null) return Math.max(0, Math.min(1, (deg - 72) / 216));',
  '    return Math.min(1, (Date.now() - started) / 9000);',
  '  }',
  '  function pad3(n) { var s = String(n); while (s.length < 3) s = " " + s; return s; }',
  '  function setProgress(p, digits) {',
  '    if (finished || API.adopted) return;',
  '    var n = Number(p);',
  '    if (!isFinite(n)) n = 0;',
  '    n = Math.max(0, Math.min(1, n));',
  '    var deg = readArcDeg();',
  '    var floor = progressFromDeg(deg);',
  '    if (n < floor) n = floor;',
  '    if (n < lastProgress) n = lastProgress;',
  '    lastProgress = n;',
  '    if (SEQ && typeof SEQ.render === "function") {',
  '      try { SEQ.render(n, deg); } catch (e8) {}',
  '    } else {',
  '      // Defensive fallback if SEQUENCE_JS did not evaluate.',
  '      if (meter && typeof meter.lockProgress === "function") meter.lockProgress(n, digits || "1130205");',
  '      if (fill) fill.style.width = (n * 100).toFixed(1) + "%";',
  '      if (val) val.textContent = n >= 1 ? "BETA 1.130205" : "CONVERGING " + pad3(Math.round(n * 100)) + "%";',
  '    }',
  '  }',
  '  function adopt() {',
  '    API.adopted = true;',
  '    if (ticker) { clearInterval(ticker); ticker = 0; }',
  '    if (ceiling) { clearTimeout(ceiling); ceiling = 0; }',
  '    if (SEQ && typeof SEQ.refs === "function") { try { return SEQ.refs(); } catch (e9) {} }',
  '    return { meter: meter, fill: fill, val: val };',
  '  }',
  '  function finish() {',
  '    if (finished || API.adopted) return;',
  '    finished = true;',
  '    if (ticker) clearInterval(ticker);',
  '    if (ceiling) clearTimeout(ceiling);',
  '    el.setAttribute("data-out", "true");',
  '    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 760);',
  '  }',
  '  function step() {',
  '    if (finished || API.adopted) return;',
  '    setProgress(progressFromDeg(readArcDeg()));',
  '  }',
  '  ticker = setInterval(step, 70);',
  '  step();',
  '  ceiling = setTimeout(function () { if (!API.adopted) finish(); }, 60000);',
  '})();'
].join('\n');

// ---------------------------------------------------------------- helpers
export function stripNonAscii(src) {
  // Chinese glyphs only occur inside comments in sg-nixie.inline.js; removing
  // them keeps the source valid JS (verified with node --check).
  return src.replace(/[^\x00-\x7F]/g, '');
}

// UTF-8-safe encoding check. The payload is served as text/html; charset=utf-8
// and round-tripped through Buffer/JSON.stringify, so non-ASCII (U+2588, the
// Japanese caption) is fine. Reject anything that would corrupt that trip:
// U+0000, stray C0 controls, lone surrogates and replacement characters.
export function assertEncoding(src, label) {
  for (let i = 0; i < src.length; i++) {
    const c = src.charCodeAt(i);
    if (c === 0) throw new Error(label + ' contains U+0000');
    if (c < 0x20 && c !== 9 && c !== 10 && c !== 13) {
      throw new Error(label + ' contains C0 control U+' + c.toString(16).padStart(4, '0'));
    }
    if (c >= 0xD800 && c <= 0xDBFF) {
      const n = src.charCodeAt(i + 1);
      if (!(n >= 0xDC00 && n <= 0xDFFF)) throw new Error(label + ' contains a lone high surrogate');
      i++;
    } else if (c >= 0xDC00 && c <= 0xDFFF) {
      throw new Error(label + ' contains a lone low surrogate');
    }
    if (c === 0xFFFD) throw new Error(label + ' contains U+FFFD replacement character');
  }
  if (Buffer.from(src, 'utf8').toString('utf8') !== src) {
    throw new Error(label + ' does not survive a UTF-8 round trip');
  }
  return src;
}

// Permissive alias kept for any older importer: the payload is no longer ASCII.
export const assertAscii = assertEncoding;

export function extractLiteral(hostSource, name) {
  const marker = 'const ' + name + ' = `';
  const start = hostSource.indexOf(marker);
  if (start < 0) throw new Error('const ' + name + ' = `...`; not found in src/host.template.js');
  let p = start + marker.length;
  let esc = false;
  for (; p < hostSource.length; p++) {
    const c = hostSource[p];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '`') break;
  }
  if (p >= hostSource.length || hostSource[p + 1] !== ';') {
    throw new Error(name + ' template literal is not terminated by `;');
  }
  const body = hostSource.slice(start + marker.length, p);
  if (body.indexOf('`') >= 0) throw new Error(name + ' contains a backtick');
  if (body.indexOf('${') >= 0) throw new Error(name + ' contains ${...} interpolation');
  return body;
}

export function extractLoadCss(hostSource) {
  const css = extractLiteral(hostSource, 'LOAD_CSS');
  if (css.indexOf('{{WALL_NIGHT}}') < 0 || css.indexOf('{{WALL_DAY}}') < 0) {
    throw new Error('LOAD_CSS is missing the NIGHT/DAY wallpaper placeholders');
  }
  return css;
}

export function escapeScriptSource(src) {
  // Only inside <script> SOURCES. "<\/script" is still valid JS: \/ is a
  // redundant escape inside strings and a plain backslash inside comments.
  return src.replace(/<\/script/gi, '<\\/script');
}

export function assembleLoadingStyle(payload) {
  const parts = ['<style id="dsh-next-loading-style">', payload.style, '</style>'];
  for (const src of payload.scripts) {
    const escaped = escapeScriptSource(src);
    // The HTML parser ends a <script> element at the FIRST "</script". Nothing
    // inside a script source may contain that sequence after escaping.
    if (/<\/script/i.test(escaped)) throw new Error('script source still contains a </script sequence');
    parts.push('<script>', escaped, '</script>');
  }
  const html = parts.join('');
  const opens = (html.match(/<script>/g) || []).length;
  const closes = (html.match(/<\/script>/g) || []).length;
  if (opens !== payload.scripts.length || closes !== payload.scripts.length) {
    throw new Error('assembled LOADING_STYLE has unbalanced script tags');
  }
  return html;
}

// String.prototype.replace() treats $$, $&, $`, $', $1..$9 and $<name> in the
// REPLACEMENT string as substitution patterns. serveWebDocument() uses
// body.replace("<head>", "<head>" + LOADING_STYLE + APP_BOOT_SCRIPT), so any of
// those sequences inside our payload would silently corrupt the document.
export function assertReplaceSafe(str, label) {
  const m = str.match(/\$[$&'`1-9<]/);
  if (m) throw new Error(label + ' contains String.replace substitution sequence "' + m[0] + '"');
  return str;
}

export function assertScriptSources(payload) {
  assertEncoding(payload.style, 'style');
  if (/<\/style/i.test(payload.style)) {
    throw new Error('style text contains </style> and would truncate the <style> element');
  }
  payload.scripts.forEach((s, i) => {
    assertEncoding(s, 'script[' + i + ']');
    // HTML script-data double-escape hazard: "<!--" followed later by "<script"
    // would stop our closing </script> from being recognised.
    const a = s.toLowerCase().indexOf('<!--');
    const b = s.toLowerCase().indexOf('<script', a < 0 ? 0 : a + 4);
    if (a >= 0 && b > a) throw new Error('script[' + i + '] has a script-data double-escape hazard');
    const opens = (s.match(/<!--/g) || []).length;
    const closes = (s.match(/-->/g) || []).length;
    if (opens !== closes) throw new Error('script[' + i + '] has unbalanced <!--/--> sequences');
  });
  return payload;
}

function dataUri(file) {
  return 'data:image/webp;base64,' + fs.readFileSync(file).toString('base64');
}

export function buildPayload(opts = {}) {
  const paths = { ...PATHS, ...(opts.paths || {}) };
  const host = fs.readFileSync(paths.hostTemplate, 'utf8');
  let style = extractLoadCss(host);
  const sequence = extractLiteral(host, 'SEQUENCE_JS');

  const walls = {
    WALL_NIGHT: dataUri(paths.wallNight),
    WALL_DAY: dataUri(paths.wallDay),
    WALL_DUSK: dataUri(paths.wallDusk),
    WALL_LIBRARY: dataUri(paths.wallLibrary)
  };
  for (const key of WALL_KEYS) style = style.split('{{' + key + '}}').join(walls[key]);
  if (/\{\{WALL_[A-Z]+\}\}/.test(style)) throw new Error('wallpaper placeholders left unsubstituted');
  style += NATIVE_EXTRA_CSS;

  // Order matters: component first (defines <sg-nixie>), then the shared boot
  // engine (defines KS_SEQ / KS_PROBE), then the native builder (uses both).
  const scripts = [
    stripNonAscii(fs.readFileSync(paths.component, 'utf8')),
    sequence,                 // verbatim UTF-8: U+2588 + Japanese caption
    BUILDER_JS
  ];

  assertScriptSources({ style, scripts });
  return { style, scripts };
}

export function buildLoadingStyle(opts) {
  return assertReplaceSafe(assembleLoadingStyle(buildPayload(opts)), 'LOADING_STYLE');
}

// Full assertions + `node --check` on every escaped script. NOTE: stdio is
// 'ignore' on purpose -- this sandbox forbids piped stdio capture for spawned
// processes. Returns per-script escaped byte counts.
export function verifyPayload(payload, opts = {}) {
  const nodeExe = opts.nodeExe || process.execPath;
  const dir = opts.tempDir || HERE;
  assertReplaceSafe(assembleLoadingStyle(payload), 'LOADING_STYLE');
  assertScriptSources(payload);
  const results = [];
  const files = [];
  try {
    payload.scripts.forEach((src, i) => {
      const escaped = escapeScriptSource(src);
      const f = path.join(dir, '_ks-script-' + i + '.js');
      fs.writeFileSync(f, escaped, 'utf8');
      files.push(f);
      results.push({
        name: 'script[' + i + ']', file: f,
        sourceBytes: Buffer.byteLength(src, 'utf8'),
        escapedBytes: Buffer.byteLength(escaped, 'utf8')
      });
    });
    for (const r of results) {
      const cp = spawnSync(nodeExe, ['--check', r.file], { stdio: 'ignore' });
      r.nodeCheck = cp.status === 0;
      if (!r.nodeCheck) throw new Error('node --check failed for ' + r.name + ' (status=' + cp.status + ')');
    }
    return results;
  } finally {
    for (const f of files) { try { fs.unlinkSync(f); } catch (e) {} }
  }
}
