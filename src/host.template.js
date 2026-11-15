// Host-side entry for dsh-skin-kurisu.
//
// The desktop shell builds its loading screen in the renderer BEFORE any client
// plugin activates, so a client plugin cannot reliably theme it. There are two
// seams and this build uses both of them, as ONE continuous screen:
//
//   1. resources/app.asar -> lib/web-document.js -> LOADING_STYLE
//      Inserted verbatim into <head> at the first paint (t=0). Ships the full
//      boot sequence as element #ks-loadscreen, the v4 Web Component, the
//      shared SEQUENCE_JS, and exposes window.KS_SPLASH (see research/native-splash/).
//
//   2. `webserver/index-inject`  ->  runtime.injections() -> PZ(rows)
//      At host readiness the renderer applies style / script rows while that
//      same screen is still up. This module ADOPTS the native element instead of
//      drawing a second one, keeps driving the same sequence with the shell's
//      real --dsh-boot-arc progress, then dissolves it into the app.
//
// Because it is one DOM element from first paint to app-ready, there is no
// colour jump, no duplicate board and no flash at either hand-off.

export const name = "dsh-skin-kurisu";
export const inject = ["webServer"];

// The tube stylesheet is generated from src/client.template.js by build.ps1 so
// the loading screen and the in-app boards share one source of truth.
const NIXIE_CSS = __NIXIE_CSS__;
const SG_NIXIE_JS = __SG_NIXIE_JS__;

// ---------------------------------------------------------------------------
// LOAD_CSS, SEQUENCE_JS and LOAD_SCRIPT are all read VERBATIM by
// research/native-splash/payload.mjs (extractLiteral). Keep them as plain
// template literals with NO backticks, NO ${...} and NO backslashes inside.
// ---------------------------------------------------------------------------

// This stylesheet is mirrored VERBATIM in the asar payload. It uses the SAME
// wallpaper stack as buildWallCss() in client.template.js, plus one extra
// dark veil as the top layer: dissolving the veil reveals exactly the picture
// already painted behind it on AppFrame. The wallpaper itself is selected at
// runtime from dsh-skin-kurisu:wallpaper so the boot screen always matches the
// skin's current choice (night / day / dusk / library).
const LOAD_CSS = `
#ks-loadscreen {
  position: fixed;
  inset: 0;
  z-index: 2147483600;
  display: block;
  overflow: hidden;
  font-family: "Cascadia Code", Consolas, monospace;
  color-scheme: dark;
  pointer-events: none;
  background-color: #06080f;
  /* defaults = night; overridden per saved wallpaper id below */
  --ks-wall: url("{{WALL_NIGHT}}");
  --ks-wall-light: url("{{WALL_DAY}}");
  --ks-wall-pos: 76% 42%;
  --phos: #3ed9c5;
  --phos-dim: #1c6e66;
  --phos-glow: rgba(62,217,197,.30);
  --amber: #ff6a00;
  --core: #ffd7a0;
  --warm: rgba(255,178,113,.74);
  --mono: "Cascadia Code", Consolas, "Yu Gothic UI", monospace;
  background-image:
    linear-gradient(rgba(3,5,10,.66), rgba(3,5,10,.66)),
    radial-gradient(120% 92% at 52% 42%, transparent 54%, rgba(2,4,8,.42) 100%),
    linear-gradient(101deg, rgba(4,6,12,.94) 0%, rgba(6,9,16,.88) 30%, rgba(8,11,20,.70) 52%, rgba(10,13,22,.30) 74%, rgba(7,10,17,.52) 100%),
    radial-gradient(78rem 48rem at 84% 38%, rgba(133,48,64,.24), transparent 62%),
    var(--ks-wall);
  background-size: cover, cover, cover, cover, cover;
  background-position: center, center, center, center, var(--ks-wall-pos);
  background-repeat: no-repeat;
  opacity: 1;
  /* The dissolve fades the ENTIRE fixed layer. Without its own compositing
     layer the browser repaints the full screen (multi-layer background + CRT
     scanlines) on every frame of that 700ms transition — measured 33/50/67/83ms
     frames, i.e. 2-5 dropped vsyncs in a row, which is exactly the "世界线收敛
     后卡顿" report. Promoting once keeps the fade on the GPU. */
  transform: translateZ(0);
  will-change: opacity;
  backface-visibility: hidden;
  transition: opacity .7s ease;
}
#ks-loadscreen[data-ks-wall="day"] {
  --ks-wall: url("{{WALL_DAY}}"); --ks-wall-light: url("{{WALL_DAY}}"); --ks-wall-pos: 72% 38%;
}
#ks-loadscreen[data-ks-wall="dusk"] {
  --ks-wall: url("{{WALL_DUSK}}"); --ks-wall-light: url("{{WALL_DUSK}}"); --ks-wall-pos: 70% 44%;
}
#ks-loadscreen[data-ks-wall="library"] {
  --ks-wall: url("{{WALL_LIBRARY}}"); --ks-wall-light: url("{{WALL_LIBRARY}}"); --ks-wall-pos: 62% 42%;
}
#ks-loadscreen[data-ks-wall="none"] { background-image: none !important; }
#ks-loadscreen[data-ks-wall="none"][data-ks-light="1"] { background-image: none !important; }
/* Light theme. The client plugin's syncSplashTheme() sets this attribute from
   the theme presenter, so OS preference and an explicit dark flip both work. */
#ks-loadscreen[data-ks-light="1"] {
  background-color: #f4eee6;
  background-image:
    linear-gradient(rgba(3,5,10,.66), rgba(3,5,10,.66)),
    radial-gradient(120% 92% at 52% 42%, transparent 70%, rgba(120,86,74,.10) 100%),
    linear-gradient(101deg, rgba(253,250,246,.74) 0%, rgba(252,248,243,.60) 30%, rgba(250,245,239,.34) 52%, rgba(250,245,239,.08) 74%, rgba(252,248,243,.30) 100%),
    radial-gradient(70rem 44rem at 86% 36%, rgba(196,110,104,.14), transparent 60%),
    var(--ks-wall-light);
  background-position: center, center, center, center, var(--ks-wall-pos);
  color-scheme: light;
}
#ks-loadscreen[data-out="true"] { opacity: 0; }
/* While dissolving, nothing inside the layer needs to keep painting: the CRT
   scanline overlay and every looping animation are inside a layer that is on its
   way out. Disabling them removes per-frame rasterisation work from exactly the
   window where the reviewer sees a hitch. */
#ks-loadscreen[data-out="true"] .ks-seq-crt { display: none; }
#ks-loadscreen[data-out="true"] .ks-seq-cur,
#ks-loadscreen[data-out="true"] .ks-seq-k.jit,
#ks-loadscreen[data-out="true"] .ks-seq-ring.on,
#ks-loadscreen[data-out="true"] .ks-seq-snow { animation: none !important; }
[data-ks-boot="true"] [class*="_card"] { visibility: hidden !important; }
[data-ks-boot="true"] [data-dsh-boot-spinner] { visibility: hidden !important; }

/* ---- shared CRT grain ---- */
#ks-loadscreen .ks-seq-crt { position:absolute; inset:0; z-index:40; pointer-events:none; opacity:.30;
  background:repeating-linear-gradient(to bottom, rgba(0,0,0,.55) 0 1px, transparent 1px 3px); }
/* Snow is a real CRT startup: low-frequency 12fps jitter + slow horizontal
   drift, never a single blown-out white frame. Opacity is driven by JS on the
   element; the CSS animation only touches transform/filter so they never
   fight. Reduced motion removes it entirely (no white flash at startup). */
#ks-loadscreen .ks-seq-snow { position:absolute; inset:0; z-index:38; pointer-events:none; opacity:0;
  width:116%; height:100%; image-rendering:pixelated; transition:opacity .35s ease;
  animation:ks-snow-drift 1.6s linear infinite, ks-snow-jitter .17s steps(2) infinite; }
@keyframes ks-snow-drift { from{transform:translateX(0)} to{transform:translateX(-13%)} }
@keyframes ks-snow-jitter {
  0%{filter:brightness(.88) contrast(1.10)}
  100%{filter:brightness(1.12) contrast(.92)} }

/* ---- beat 1-2: PHONEWAVE terminal ---- */
#ks-loadscreen .ks-seq-boot { position:absolute; inset:0; z-index:5; display:flex;
  align-items:center; justify-content:center; }
#ks-loadscreen .ks-seq-wrap { width:min(1080px,88vw); transform:translateY(-1.5vh); }
#ks-loadscreen .ks-seq-head { display:flex; align-items:center; gap:12px; margin:0 0 14px 2px; color:var(--phos); }
#ks-loadscreen .ks-seq-head .badge { width:19px; height:19px; border-radius:6px;
  background:linear-gradient(135deg,#e0919c,var(--phos)); display:grid; place-items:center;
  font:700 12px/1 var(--mono); color:#fff; box-shadow:0 0 16px var(--phos-glow); }
#ks-loadscreen .ks-seq-head .word { font-size:16px; letter-spacing:.30em; color:#e6fbf6;
  text-shadow:0 0 14px var(--phos-glow); }
#ks-loadscreen .ks-seq-head .right { margin-left:auto; font:9px/1 var(--mono);
  letter-spacing:.24em; color:var(--phos-dim); }
#ks-loadscreen .ks-seq-win { position:relative; border:1px solid rgba(62,217,197,.24); border-radius:3px;
  background:linear-gradient(180deg,rgba(5,14,15,.94),rgba(3,9,11,.96));
  box-shadow:0 0 0 1px rgba(0,0,0,.6),0 34px 90px rgba(0,0,0,.72),0 0 90px var(--phos-glow); overflow:hidden; }
#ks-loadscreen .ks-seq-win::before { content:""; position:absolute; inset:0; pointer-events:none; z-index:4;
  opacity:.30; background:repeating-linear-gradient(to bottom,rgba(0,0,0,.55) 0 1px,transparent 1px 3px); }
#ks-loadscreen .ks-seq-win::after { content:""; position:absolute; inset:0; pointer-events:none; z-index:5;
  box-shadow:inset 0 0 70px rgba(0,0,0,.72); }
#ks-loadscreen .ks-seq-title { display:flex; align-items:center; gap:10px; padding:9px 14px;
  border-bottom:1px solid rgba(62,217,197,.18); background:rgba(62,217,197,.055);
  font:9px/1 var(--mono); letter-spacing:.20em; color:var(--phos); }
#ks-loadscreen .ks-seq-title .sq { display:flex; gap:4px; }
#ks-loadscreen .ks-seq-title .sq i { width:6px; height:6px; border:1px solid var(--phos-dim); display:block; }
#ks-loadscreen .ks-seq-title .sq i:first-child { background:var(--phos-dim); }
#ks-loadscreen .ks-seq-title .id { margin-left:auto; color:var(--phos-dim); font-size:8px; }
#ks-loadscreen .ks-seq-tabs { display:flex; padding:0 14px; border-bottom:1px solid rgba(62,217,197,.14);
  font:9px/1 var(--mono); letter-spacing:.18em; color:var(--phos-dim); }
#ks-loadscreen .ks-seq-tabs span { padding:9px 15px 9px 0; margin-right:15px;
  border-right:1px solid rgba(62,217,197,.10); white-space:nowrap; }
#ks-loadscreen .ks-seq-tabs span.on { color:var(--phos); border-bottom:1px solid var(--phos);
  margin-bottom:-1px; text-shadow:0 0 9px var(--phos-glow); }
#ks-loadscreen .ks-seq-log { padding:14px 18px 12px; font:12px/1.9 var(--mono);
  color:#9fd8cf; min-height:196px; letter-spacing:.02em; }
#ks-loadscreen .ks-seq-row { display:flex; gap:14px; align-items:baseline; }
#ks-loadscreen .ks-seq-t { color:var(--phos-dim); flex:none; width:58px; font-size:10px; }
#ks-loadscreen .ks-seq-k { color:#bfe9e1; flex:1; min-width:0; }
#ks-loadscreen .ks-seq-v { flex:none; color:var(--core); text-shadow:0 0 10px rgba(255,122,0,.42);
  opacity:0; transition:opacity .2s ease; }
#ks-loadscreen .ks-seq-v.show { opacity:1; }
#ks-loadscreen .ks-seq-v.ok { color:var(--phos); text-shadow:0 0 9px var(--phos-glow); }
#ks-loadscreen .ks-seq-v.wait { color:var(--phos-dim); text-shadow:none; }
#ks-loadscreen .ks-seq-cur { color:var(--phos); animation:ks-blink .75s steps(1) infinite; }
@keyframes ks-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
#ks-loadscreen .ks-seq-k.jit { animation:ks-jit .16s steps(2) infinite; }
@keyframes ks-jit {
  0%{transform:translate(0,0);filter:none}
  33%{transform:translate(-1.5px,1px);filter:drop-shadow(1.5px 0 rgba(255,60,90,.55))}
  66%{transform:translate(1.5px,-1px);filter:drop-shadow(-1.5px 0 rgba(60,255,180,.45))}
  100%{transform:translate(0,0);filter:none} }
#ks-loadscreen .ks-seq-foot { display:flex; align-items:center; gap:16px; padding:9px 18px 11px;
  border-top:1px solid rgba(62,217,197,.14); }
#ks-loadscreen .ks-seq-bar { position:relative; flex:1; height:2px; background:rgba(62,217,197,.16); overflow:hidden; }
#ks-loadscreen .ks-seq-bar > i { display:block; height:100%; width:0;
  background:linear-gradient(90deg,var(--phos-dim),var(--phos)); box-shadow:0 0 12px var(--phos-glow); }
#ks-loadscreen .ks-seq-pct { font:9px/1 var(--mono); color:var(--phos); letter-spacing:.14em; }
#ks-loadscreen .ks-seq-tail { margin:13px 2px 0; display:flex; justify-content:space-between;
  color:var(--phos-dim); font:8px/1 var(--mono); letter-spacing:.24em; }

/* ---- beat 3: white caption ---- */
#ks-loadscreen .ks-seq-caption { position:absolute; inset:0; z-index:30; display:flex;
  align-items:center; justify-content:center; pointer-events:none; opacity:0; }
#ks-loadscreen .ks-seq-big { position:relative; text-align:center; transform:scale(1.08);
  filter:blur(10px) brightness(2.6); opacity:0; }
#ks-loadscreen .ks-seq-big .w1 { font-size:clamp(30px,6.4vw,88px); letter-spacing:.16em; color:#fff;
  line-height:1.05; text-shadow:0 0 22px rgba(255,255,255,.85),0 0 60px rgba(255,122,0,.45); }
/* The line carrying the actual world line is the one that must be readable at
   normal viewing distance: 14px, near-white, not 9px dim green. The 9px log
   rows are deliberately atmosphere and stay small. */
#ks-loadscreen .ks-seq-big .w2 { display:block; margin-top:18px; font:14px/1.35 var(--mono);
  letter-spacing:.34em; color:#fff; text-shadow:0 0 20px rgba(255,255,255,.9),0 0 40px rgba(255,122,0,.4); }
#ks-loadscreen .ks-seq-big::before, #ks-loadscreen .ks-seq-big::after {
  content:""; position:absolute; left:-8%; right:-8%; height:2px;
  background:linear-gradient(90deg,transparent,#fff,transparent); opacity:0; }

/* ---- beat 4: nixie convergence ---- */
#ks-loadscreen .ks-seq-meter { position:absolute; left:50%; top:50%; z-index:22;
  transform:translate(-50%,-50%) scale(.94); display:flex; flex-direction:column;
  align-items:center; gap:12px; opacity:0; }
#ks-loadscreen .ks-seq-ring { position:absolute; left:50%; top:calc(50% - 6px);
  width:min(760px,88vw); height:2px; transform:translate(-50%,-50%) scaleX(.1);
  background:linear-gradient(90deg,transparent,rgba(255,106,0,.85),transparent);
  opacity:0; box-shadow:0 0 18px rgba(255,106,0,.55); }
#ks-loadscreen .ks-seq-ring.on { animation:ks-ring 1.1s cubic-bezier(.2,.8,.2,1) both; }
@keyframes ks-ring { 0%{opacity:0;transform:translate(-50%,-50%) scaleX(.1)}
  45%{opacity:1} 100%{opacity:0;transform:translate(-50%,-50%) scaleX(1)} }
/* Waveform-fit foreground: a translucent phosphor-green oscilloscope trace that
   sits IN FRONT of the nixie panel (z 24 > 22) and fits itself through 8 sample
   points as the digits lock. Full-screen canvas; all geometry is JS-driven. The
   caption (z 30) still sits above it, so EL PSY KONGROO is never obscured. */
#ks-loadscreen .ks-seq-wave { position:absolute; inset:0; z-index:24;
  pointer-events:none; opacity:0; transition:opacity .32s ease; }
#ks-loadscreen[data-out="true"] .ks-seq-wave { opacity:0 !important; transition:none; }
#ks-loadscreen .ks-seq-meter sg-nixie { --nx-span:min(680px,82vw); --nx-gr:.12; }
#ks-loadscreen .ks-seq-meter sg-nixie::part(panel) { padding:8px 12px 3px; border-radius:6px;
  background:rgba(4,7,12,.52); box-shadow:inset 0 0 0 1px rgba(255,178,113,.13),0 10px 34px rgba(0,0,0,.6); cursor:default; }
#ks-loadscreen .ks-seq-meter sg-nixie::part(panel)::before,
#ks-loadscreen .ks-seq-meter sg-nixie::part(panel)::after { display:none; }
#ks-loadscreen .ks-seq-cap,#ks-loadscreen .ks-seq-val { opacity:0; transition:opacity .4s ease; }
#ks-loadscreen .ks-seq-cap { font:9px/1 var(--mono); letter-spacing:.30em; color:var(--warm); text-transform:uppercase; }
#ks-loadscreen .ks-seq-val { font:11px/1 var(--mono); letter-spacing:.18em; color:var(--warm); }
#ks-loadscreen .ks-seq-meter[data-lit="1"] .ks-seq-cap,
#ks-loadscreen .ks-seq-meter[data-lit="1"] .ks-seq-val { opacity:1; }

/* ---- beat 5: hand-off into the sidebar ---- */
#ks-loadscreen .ks-seq-fly { position:absolute; left:50%; top:58%; z-index:34; pointer-events:none;
  font:13px/1 var(--mono); letter-spacing:.10em; color:var(--core);
  text-shadow:0 0 14px rgba(255,122,0,.7); opacity:0;
  /* Animated by transform only: writing left/top/font-size from rAF forced a
     layout on every frame of the hand-off. */
  transform: translate(-50%,-50%) scale(1); will-change: transform, opacity; }

@media (max-width:820px) { #ks-loadscreen .ks-seq-log { font-size:10px }
  #ks-loadscreen .ks-seq-head .right { display:none }
  #ks-loadscreen .ks-seq-big .w2 { font-size:12px; letter-spacing:.22em } }
/* Reduced motion: this screen plays on EVERY startup, so a photosensitive
   user must never get a full-white static flash, typing jitter, blinking
   cursor or sweeping ring. The sequence still runs (progress + caption +
   nixie) but every animated/photometric layer is neutralised. */
@media (prefers-reduced-motion:reduce) {
  #ks-loadscreen .ks-seq-cur, #ks-loadscreen .ks-seq-k.jit,
  #ks-loadscreen .ks-seq-ring.on, #ks-loadscreen .ks-seq-snow { animation:none !important }
  #ks-loadscreen .ks-seq-snow { display:none !important }
  #ks-loadscreen .ks-seq-cur { opacity:1 }
  #ks-loadscreen .ks-seq-big { filter:none !important; transform:none !important }
  #ks-loadscreen .ks-seq-cap, #ks-loadscreen .ks-seq-val { transition:none }
  #ks-loadscreen[data-out="true"] { transition:opacity .15s linear }
}
`;

// ---------------------------------------------------------------------------
// SEQUENCE_JS is the ONE source of truth for the boot sequence. It is injected
// into <head> by the asar payload at t=0 AND again by the host injection rows
// (guarded, so the second copy is a no-op). Both the native builder and the
// host script drive it through render(p) with the shell's real boot arc.
//
// Plain ES5, no template literals, no backticks, no backslashes. Japanese text
// in the caption is UTF-8 (the payload assertions were widened to UTF-8).
// ---------------------------------------------------------------------------
const SEQUENCE_JS = `
(function () {
  "use strict";
  if (window.KS_SEQ) return;
  var WIN = window;
  var BETA = "1130205";
  var KEY = "dsh-skin-kurisu:wallpaper";
  var ROWS = [
    ["00:00.00", "HARNESS boot monitor", "2.0.19-next", "wait"],
    ["00:00.12", "reading steiner", "ACTIVE", "ok"],
    ["00:03.41", "plugin  dsh-client-ui-theme", "OK", "ok"],
    ["00:08.07", "plugin  dsh-skin-kurisu", "OK", "ok"],
    ["00:12.90", "world line  beta", "LOCKED", "ok"]
  ];
  // Beats run on ABSOLUTE comfortable timings (machine-independent), and
// beat 5 is an ASYMPTOTIC creep that never reaches its own ceiling. Measured
// reason: pacing everything against a guessed/learned total boot duration
// fails when the real boot is 34s but the guess is 18.6s — the sequence used
// to slam into HOLD at 18s and then sit frozen for 16 SECONDS.
  //   snow   0     - 1.2s    (p 0    -> snowEnd .05)
  //   typing 1.2   - 1.2+TOTAL_T      (p .05 -> typeEnd .42)
  //   DWELL  typing end - +1.5s  (p .42 -> capStart .52)  <- static beat, no text
  //   caption dwell end  - +2.7s (p .52 -> capEnd .66)
  //   converge caption end +   (p .66 -> HOLD_P, asymptotic)
  // TOTAL_T is derived from the ROW schedule below, so the typing beat lasts
  // exactly as long as the declared per-row timings actually take to play.
  var PH = { snowEnd:0.05, typeEnd:0.42, capStart:0.52, capEnd:0.66 };
  var HOLD_P = 0.97;
  // Absolute front timings in SECONDS. These are the "comfortable" pace and
  // do not depend on how long the app takes. T_TYPE is derived below from the
  // row schedule (see the CHAR_T/ROW_PAUSE block) — it is not an independent
  // knob, so the declared rhythm and the played rhythm cannot drift apart.
  // Convergence tail: exponential approach to HOLD_P. It keeps moving forever
  // (never saturates) so the last tube stays visibly hunting no matter how
  // long the app takes — the wait reads as progress, not as a freeze. Only
  // real readiness can push past HOLD (see rush()).
  // 8.5s time-constant: by ~20s into the tail the reading is visually almost
  // locked (last tube still hunting), and it keeps inching forever instead of
  // freezing. Measured failure of the previous "hold at 0.97 + sine wobble":
  // it parked for 22 SECONDS with a static-looking readout.
  var TAIL_TAU = 8.5;
  function wallProgress(tSec) {
    if (tSec <= 0) return 0;
    if (tSec < T_SNOW) return (tSec / T_SNOW) * PH.snowEnd;
    if (tSec < T_TYPE) return PH.snowEnd + ((tSec - T_SNOW) / (T_TYPE - T_SNOW)) * (PH.typeEnd - PH.snowEnd);
    var t2 = T_TYPE + T_DWELL;
    if (tSec < t2) return PH.typeEnd + ((tSec - T_TYPE) / T_DWELL) * (PH.capStart - PH.typeEnd);
    var t3 = t2 + T_CAP;
    if (tSec < t3) return PH.capStart + ((tSec - t2) / T_CAP) * (PH.capEnd - PH.capStart);
    var d = tSec - t3;
    return PH.capEnd + (HOLD_P - PH.capEnd) * (1 - Math.exp(-d / TAIL_TAU));
  }
  var rushing = false, rushAt = 0, rushFrom = 0, rushDur = 300, lastArcVal = null;
  var rushCut = false, rushCutP2s = 0;
  function rush() {
    if (rushing || lastP >= 1) return;
    rushing = true;
    rushAt = now();
    // CUT, never fast-forward. The app is ready, so the remaining schedule has
    // no remaining purpose — but compressing 8s of typing into ~1.1s is a blur,
    // not an outro (reviewer P0-2: the old rushDur formula did exactly that on
    // a fast boot). If the story has not yet reached the caption beat, jump
    // straight to the settle beat and play ONLY the lock: short snow -> hard cut
    // -> nixie locks. If we are already past typing, play what is on screen out.
    if (lastP < PH.capStart) {
      // Freeze the row schedule where it stood BEFORE the jump. Without this,
      // landing on capEnd+0.02 makes p2s == TOTAL_T, so the cut frame writes
      // all five results at once and the footer bar snaps to BOOT 100% — the
      // exact "whole film in one frame" artefact this fix exists to remove.
      // The cut must carry the screen it leaves, not the screen it skipped.
      rushCutP2s = clamp((lastP - PH.snowEnd) / (PH.typeEnd - PH.snowEnd), 0, 1) * TOTAL_T;
      lastP = PH.capEnd + 0.02;
      rushFrom = lastP;
      rushDur = 300;
      rushCut = true;
      PROBE.mark("rush-cut", "from=" + rushFrom.toFixed(3) + " rows=" + rushCutP2s.toFixed(2) + "s");
    } else {
      rushFrom = lastP;
      rushDur = clamp((1 - rushFrom) * 1600, 240, 900);
      rushCut = false;
    }
    // The host polls every 70ms: a 266ms lock would get only ~4 frames, which
    // reads as a STUTTER at the single most important beat. Drive the lock at
    // display refresh rate instead (an rAF chain that stops at v=1). While
    // rushing, render() ignores host-driven input entirely (single clock: the
    // rush rAF); the host's step() keeps polling only for readiness bookkeeping.
    if (WIN.requestAnimationFrame) {
      var tick = function () {
        if (!rushing || !built || lastP >= 1) return;
        render(0, lastArcVal);
        WIN.requestAnimationFrame(tick);
      };
      WIN.requestAnimationFrame(tick);
    }
  }
  var CHAR_T = 0.030, ROW_PAUSE = 0.42, RESULT_DELAY = 0.55;
  var SCHED = [], TOTAL_T = 0;
  var i, typeT;
  for (i = 0; i < ROWS.length; i++) {
    typeT = ROWS[i][1].length * CHAR_T;
    SCHED.push({ t0: TOTAL_T, typeEnd: TOTAL_T + typeT,
      result: TOTAL_T + typeT + ROW_PAUSE + RESULT_DELAY });
    TOTAL_T += typeT + ROW_PAUSE + RESULT_DELAY + 0.30;
  }
  // The declared per-character/pause timings are the REAL playback pace now.
  // v1.12.4 hardcoded T_TYPE=8.6s and squeezed the 14.96s schedule into it,
  // multiplying every constant by 0.4947 (a "30ms" char played at 14.8ms; a
  // "420ms" row pause at 208ms — a fast stock-ticker crawl, reviewer P1-1).
  // The type window is now DERIVED from the schedule itself, so what the
  // constants say is what plays. With 5 rows this lands at ~9.7s.
  var T_SNOW = 1.2, T_DWELL = 1.5, T_CAP = 2.7;
  var T_TYPE = T_SNOW + TOTAL_T;
  // P1-3: ONE clock. All relative time in the sequence flows through this
  // monotonic wrapper. (v1.12.3 mixed performance.now() with Date.now() and
  // reported boot=1794587828.8s; keeping a single accessor makes that class of
  // bug structurally hard to reintroduce.)
  function now() { try { return WIN.performance && performance.now ? performance.now() : Date.now(); } catch (e) { return Date.now(); } }
  function clamp(v,a,b) { return Math.max(a,Math.min(b,v)); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function wallId() {
    try {
      var v = WIN.localStorage.getItem(KEY);
      if (v === "night" || v === "day" || v === "dusk" || v === "library" || v === "none") return v;
    } catch (e) {}
    return "night";
  }
  function lightOn() {
    try { return WIN.matchMedia("(prefers-color-scheme: light)").matches; } catch (e) { return false; }
  }
  function reducedOn() {
    try { return WIN.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }
  // Latched sticky: the native API is nulled by the host before the final
  // flush, so reading KS_SPLASH only at flush time under-reports native.
  // SEQUENCE_JS runs BEFORE the builder defines KS_SPLASH, so this starts
  // false and flips true the first time a flush sees the native API.
  var NATIVE_SEEN = false;
  var REDUCED = reducedOn();

  // Optional "lock ding". Default OFF: a boot screen plays on every startup,
  // so sound must be an explicit opt-in (localStorage dsh-skin-kurisu:lock-ding
  // = "1"). ONE lazily-created AudioContext is reused; it fires on the
  // CONVERGED event (last digit locking), not on the caption's exit.
  var dingCtx = null, dingDone = false;
  function lockDing() {
    if (dingDone || REDUCED) return;
    dingDone = true;
    try {
      if (WIN.localStorage.getItem("dsh-skin-kurisu:lock-ding") !== "1") return;
      var AC = WIN.AudioContext || WIN.webkitAudioContext;
      if (!AC) return;
      if (!dingCtx) dingCtx = new AC();
      if (dingCtx.state === "suspended" && dingCtx.resume) dingCtx.resume();
      var t = dingCtx.currentTime;
      var osc = dingCtx.createOscillator(), gain = dingCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1320, t + 0.12);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.08, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      osc.connect(gain); gain.connect(dingCtx.destination);
      osc.start(t); osc.stop(t + 0.36);
    } catch (e) {}
  }

  // ---- probe ------------------------------------------------------------
  // Structured, cumulative timeline. Every mark carries both a monotonic
  // performance.now() reading and a wall clock, plus the real boot arc value.
  // flush() mirrors into localStorage (survives a restart even when no
  // collector is running) and POSTs to the local probe collector.
  var PROBE = {
    t0: now(), events: [], lastPhase: 0, lastP: 0, lastArc: null,
    mark: function (name, extra) {
      try {
        this.events.push({ t: Math.round(now() - this.t0), at: Date.now(), p: +this.lastP.toFixed(4),
          arc: this.lastArc, phase: this.lastPhase, name: name, extra: extra || "" });
      } catch (e) {}
    },
    flush: function (tag) {
      try {
        if (!NATIVE_SEEN && WIN.KS_SPLASH && WIN.KS_SPLASH.native === true) NATIVE_SEEN = true;
        var payload = JSON.stringify({ tag: tag, wall: wallId(), light: lightOn() ? 1 : 0,
          native: NATIVE_SEEN, reduced: REDUCED ? 1 : 0,
          totalTypeSeconds: +TOTAL_T.toFixed(2), events: this.events });
        try { WIN.localStorage.setItem("ks-boot-tl", payload); } catch (e2) {}
        try { WIN.fetch("http://127.0.0.1:8791/report", { method:"POST", mode:"no-cors", body:payload }); } catch (e3) {}
        try { if (WIN.navigator.sendBeacon) WIN.navigator.sendBeacon("http://127.0.0.1:8791/report", payload); } catch (e4) {}
      } catch (e) {}
    }
  };
  WIN.KS_PROBE = PROBE;
  PROBE.mark("seq-script");

  var mount = null, refs = null, built = false;
  var handoffFilterCleared = false;
  var rowEls = [], curEl = null, snow = null, bootEl = null, logEl = null;
  // Declared in the IIFE scope (not inside build()) because render() and
  // finish() must be able to stop the ~12fps grain timer.
  var snowIv = null, snowPaint = null;
  var capEl = null, capBig = null, meterWrap = null, meter = null, fly = null;
  var barFill = null, pctEl = null, valEl = null, winEl = null;
  var lastPhase = 0, lastP = 0, seenResults = 0;
  var wave = null, waveCtx = null, waveRaf = 0, waveResizeBound = false,
      waveGeo = { W: 0, H: 0, DPR: 1, cy: 0, tubeH: 0, centers: [] },
      wavePulse = 0, waveT0 = 0, waveLast = 0, waveFit = 0, waveOn = false;

  function setWallAttr() {
    if (!mount) return;
    var id = wallId();
    mount.setAttribute("data-ks-wall", id);
    if (lightOn()) mount.setAttribute("data-ks-light", "1");
    else mount.removeAttribute("data-ks-light");
  }

  function build(m) {
    if (built) return refs;
    built = true;
    mount = m;
    setWallAttr();
    PROBE.mark("seq-build-start");

    snow = document.createElement("canvas");
    snow.className = "ks-seq-snow";
    // Size the backing store to the REAL viewport (with the 16% drift margin)
    // so pixels map 1:1 — the old 400x225 canvas was upscaled ~4x and looked
    // like blobs. Cap the area (~1440x900) to keep per-tick cost bounded.
    (function () {
      var sw = Math.max(480, Math.round((WIN.innerWidth || 1440) * 1.16));
      var sh = Math.max(270, Math.round(WIN.innerHeight || 900));
      var sc = Math.sqrt((1440 * 900) / (sw * sh));
      if (sc < 1) { sw = Math.round(sw * sc); sh = Math.round(sh * sc); }
      snow.width = Math.max(320, sw); snow.height = Math.max(180, sh);
    })();
    var snowPix = snow.width * snow.height, snowId = null;
    snowPaint = function (frac) {
      try {
        if (!snowId) snowId = snow.getContext("2d").createImageData(snow.width, snow.height);
        var d = snowId.data, n = Math.max(1, Math.round(snowPix * frac));
        var stride = frac >= 1 ? 4 : Math.max(4, Math.floor(4 * snowPix / (n * 3)));
        for (var q = (Math.random() * stride) | 0; q < d.length; q += stride) {
          var g = (Math.random() * 255) | 0;
          d[q] = g; d[q + 1] = g; d[q + 2] = g; d[q + 3] = 255;
        }
        snow.getContext("2d").putImageData(snowId, 0, 0);
      } catch (e) {}
    };
    snowPaint(1);
    // ~12fps partial refresh: only a fraction of pixels re-randomise per tick,
    // so the grain stays fine and alive without a full-buffer rewrite.
    snowIv = REDUCED ? null : setInterval(function () { if (snowPaint) snowPaint(0.22); }, 80);
    mount.appendChild(snow);

    bootEl = el("div", "ks-seq-boot");
    var wrap = el("div", "ks-seq-wrap");
    var head = el("div", "ks-seq-head");
    head.appendChild(el("div", "ks-seq-head badge", "A"));
    head.appendChild(el("div", "ks-seq-head word", "HARNESS"));
    head.appendChild(el("div", "ks-seq-head right", "FUTURE GADGET LAB / LABMEM 004"));
    wrap.appendChild(head);

    winEl = el("div", "ks-seq-win");
    var title = el("div", "ks-seq-title");
    var sq = el("div", "ks-seq-title sq");
    sq.appendChild(document.createElement("i"));
    sq.appendChild(document.createElement("i"));
    sq.appendChild(document.createElement("i"));
    title.appendChild(sq);
    title.appendChild(el("div", "", "PHONEWAVE // BOOT MONITOR"));
    title.appendChild(el("div", "ks-seq-title id", "BUILD 2.0.19-NEXT"));
    winEl.appendChild(title);
    var tabs = el("div", "ks-seq-tabs");
    tabs.appendChild(el("span", "on", "BOOT"));
    tabs.appendChild(el("span", "", "D-MAIL"));
    tabs.appendChild(el("span", "", "GADGET"));
    tabs.appendChild(el("span", "", "@CHANNEL"));
    winEl.appendChild(tabs);
    logEl = el("div", "ks-seq-log");
    for (var r = 0; r < ROWS.length; r++) {
      var row = el("div", "ks-seq-row");
      row.appendChild(el("span", "ks-seq-t", ""));
      var kEl = el("span", "ks-seq-k", "");
      // A dedicated TEXT node holds the typed characters. Writing its nodeValue
      // never destroys sibling nodes, so the caret can live inside this span
      // without being thrown away (and rebuilt) on every typed character.
      var kText = document.createTextNode("");
      kEl.appendChild(kText);
      row.appendChild(kEl);
      // Both the timestamp AND the result text used to be written at build
      // time and merely hidden with CSS opacity. That leaked every answer to
      // the a11y tree and printed a column of orphan timestamps for rows that
      // had not started yet (reviewer p=0.25 screenshot). Both are now written
      // by render() only when their row is actually due.
      var v = el("span", "ks-seq-v " + ROWS[r][3], "");
      row.appendChild(v);
      logEl.appendChild(row);
      rowEls.push({ t: row.children[0], k: kEl, kt: kText, v: row.children[2],
        n: -2, jit: null, stampShown: false, resultShown: false });
    }
    // The caret is built ONCE and MOVED into whichever row is currently being
    // typed. The old code kept a separate ninth row whose timestamp duplicated
    // the active row's stamp (two identical 00:11.62 lines in the p=0.25
    // screenshot) and rebuilt the caret with innerHTML 60 times a second.
    curEl = el("span", "ks-seq-cur", "█");
    winEl.appendChild(logEl);
    var foot = el("div", "ks-seq-foot");
    var bar = el("div", "ks-seq-bar");
    barFill = document.createElement("i");
    bar.appendChild(barFill);
    foot.appendChild(bar);
    pctEl = el("div", "ks-seq-pct", "CONVERGING 0%");
    foot.appendChild(pctEl);
    valEl = el("div", "ks-seq-val", "1.130205  BETA");
    foot.appendChild(valEl);
    winEl.appendChild(foot);
    wrap.appendChild(winEl);
    var tail = el("div", "ks-seq-tail");
    tail.appendChild(el("span", "", "D-MAIL / RECEIVED"));
    tail.appendChild(el("span", "", "SERN LINK : CLOSED"));
    wrap.appendChild(tail);
    bootEl.appendChild(wrap);
    mount.appendChild(bootEl);

    capEl = el("div", "ks-seq-caption");
    capBig = el("div", "ks-seq-big");
    // "EL PSY KONGROO" is INTENTIONAL, not a typo. Okabe's sign-off has two
    // spellings in official circulation: Spike Chunsoft's own 10th-anniversary
    // announcement and the "Steins;Gate El Psy Kongroo Edition" use the K
    // spelling, while a Wikiquote game transcription uses "Congroo". We keep
    // the publisher's K form as a deliberate nod to that split.
    capBig.appendChild(el("span", "w1", "EL PSY KONGROO"));
    // Narrative stance: this boot film starts ON the beta world line
    // (1.130205), the same value the sidebar meter shows after the hand-off.
    // It is NOT the Steins Gate line (1.048596) — the point of the sequence is
    // convergence from beta, so boot and in-app reading must be identical.
    capBig.appendChild(el("span", "w2", "世界線 1.130205 確定 / LOCKED"));
    capEl.appendChild(capBig);
    mount.appendChild(capEl);

    meterWrap = el("div", "ks-seq-meter");
    meterWrap.appendChild(el("div", "ks-seq-ring"));
    meter = document.createElement("sg-nixie");
    meter.setAttribute("tubes", "8");
    meter.setAttribute("noignite", "1");
    meter.setAttribute("value", "1.130205");
    meterWrap.appendChild(meter);
    meterWrap.appendChild(el("div", "ks-seq-cap", "WORLD LINE / DIVERGENCE"));
    meterWrap.appendChild(el("div", "ks-seq-val", ""));
    mount.appendChild(meterWrap);

    fly = el("div", "ks-seq-fly", "1.130205");
    mount.appendChild(fly);
    mount.appendChild(el("div", "ks-seq-crt"));

    // Waveform-fit foreground. Created LAST inside the layer so it paints above
    // the nixie; kept OPTIONAL (no canvas 2d ctx -> display:none, and REDUCED
    // never turns it on), so the fallback path is the old plain appearance.
    wave = el("canvas", "ks-seq-wave");
    mount.appendChild(wave);
    waveCtx = null;
    try { waveCtx = wave.getContext && wave.getContext("2d"); } catch (e) { waveCtx = null; }
    if (waveCtx) {
      waveResize();
      try { WIN.addEventListener("resize", waveResize); waveResizeBound = true; } catch (e) {}
    } else {
      wave.style.display = "none";
    }

    refs = { meter: meter, fill: barFill, val: valEl, wave: wave };
    PROBE.mark("seq-built", "rows=" + ROWS.length);
    PROBE.flush("built");
    return refs;
  }

  // ---- waveform-fit overlay ------------------------------------------------
  // A translucent phosphor-green oscilloscope trace. It sits IN FRONT of the
  // nixie (z 24) but leaves the digits readable: destination-out carves a soft
  // relief band through the centre. Three traces (carrier + two detuned
  // echoes) collapse onto one curve as fit goes 0 -> 1, and eight sample
  // points lock in step with the eight digits. All geometry is recomputed on
  // resize; no measurement of the Shadow-DOM nixie, which scales every frame
  // during the hand-off. Canvas unavailable or REDUCED -> zero cost, zero DOM.
  function waveResize() {
    if (!wave || !waveCtx) return;
    var dpr = Math.min(1.5, WIN.devicePixelRatio || 1);
    var W = WIN.innerWidth || 1440, H = WIN.innerHeight || 900;
    wave.width = Math.max(1, Math.round(W * dpr));
    wave.height = Math.max(1, Math.round(H * dpr));
    waveCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    waveGeo.W = W; waveGeo.H = H; waveGeo.DPR = dpr;
    waveGeo.cy = H * 0.5;
    // 8 sample points across the nixie panel (--nx-span: min(680px, 82vw)).
    var span = Math.min(680, W * 0.82), pad = span * 0.06;
    waveGeo.centers = [];
    for (var i = 0; i < 8; i++) {
      waveGeo.centers.push(W / 2 - span / 2 + pad + (i / 7) * (span - pad * 2));
    }
    waveGeo.tubeH = Math.min(H * 0.28, span * 0.22);
  }
  // Deterministic hash-noise: jitters the trace without allocating random
  // state per frame, so two boots at the same p look the same.
  function waveNoise(a, b) {
    var s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  }
  function wavePaint(tNow, fit) {
    if (!waveCtx || !wave) return;
    var t = (tNow - waveT0) / 1000, miss = 1 - fit;
    var W = waveGeo.W, H = waveGeo.H, cy = waveGeo.cy;
    var base = Math.min(H * 0.13, waveGeo.tubeH * 0.54);
    var ctx = waveCtx;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    // Full-screen graticule: faint phosphor grid so the trace reads as a
    // measurement instrument rather than a floating sine wave.
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(46,255,166,0.035)";
    ctx.beginPath();
    for (var gx = (W / 2) % 64; gx < W; gx += 64) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
    for (var gy = (H / 2) % 64; gy < H; gy += 64) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
    ctx.stroke();
    ctx.strokeStyle = "rgba(46,255,166,0.10)";
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();

    // Sample-point ticks at the eight digit centres.
    ctx.strokeStyle = "rgba(46,255,166,0.055)";
    ctx.beginPath();
    for (var g = 0; g < waveGeo.centers.length; g++) {
      var tx = waveGeo.centers[g];
      ctx.moveTo(tx, cy - waveGeo.tubeH * 0.40);
      ctx.lineTo(tx, cy + waveGeo.tubeH * 0.40);
    }
    ctx.stroke();

    // Three traces. Two passes each (wide dull glow + narrow bright core)
    // instead of shadowBlur, which is far too expensive full-screen.
    var TRACES = [
      { color: "46,255,168",  a: 0.42, spread: 0,     w: 1.3 },
      { color: "30,210,140",  a: 0.21, spread: 0.42,  w: 1.0 },
      { color: "130,255,214", a: 0.14, spread: -0.62, w: 0.9 }
    ];
    var sp = waveGeo.centers.length > 1
      ? (waveGeo.centers[7] - waveGeo.centers[0]) / 7 : W / 8;
    for (var k = 0; k < TRACES.length; k++) {
      var tr = TRACES[k];
      var detune = tr.spread * miss * 0.55;
      var phase = t * (0.55 + 0.95 * miss) * (1 + tr.spread * 0.75) + tr.spread * 5.2;
      var amp = base * (0.52 + 0.48 * miss) * (1 - Math.abs(tr.spread) * 0.30 * miss);
      var alpha = tr.a * (0.42 + 0.58 * (1 - miss * 0.55));
      for (var pass = 0; pass < 2; pass++) {
        ctx.beginPath();
        var first = true;
        for (var x = 0; x <= W; x += 3) {
          var u = (x - W / 2) / sp;
          var w0 = Math.sin(Math.PI * u * (1 + detune) + phase);
          var w1 = Math.sin(Math.PI * u * 2.7 * (1 + detune * 1.6) + phase * 1.7) * 0.22 * miss;
          var jit = waveNoise(u * 3.1, t * 2.3) * 0.17 * miss;
          var edge = Math.min(1, x / (W * 0.07)) * Math.min(1, (W - x) / (W * 0.07));
          var y = cy + (w0 + w1 + jit) * amp * edge;
          if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
        }
        if (pass === 0) {
          ctx.strokeStyle = "rgba(" + tr.color + "," + (alpha * 0.14).toFixed(3) + ")";
          ctx.lineWidth = tr.w * 6;
        } else {
          ctx.strokeStyle = "rgba(" + tr.color + "," + alpha.toFixed(3) + ")";
          ctx.lineWidth = tr.w;
        }
        ctx.stroke();
      }
    }

    // Eight sample points lock on the same thresholds as the eight digits.
    for (var d = 0; d < waveGeo.centers.length; d++) {
      var locked = fit >= (d + 1) / waveGeo.centers.length;
      var on = locked ? 1 : 0.28 + 0.30 * fit;
      var cx0 = waveGeo.centers[d], s2 = locked ? 5.5 : 3.5;
      ctx.strokeStyle = "rgba(200,255,240," + (0.30 + 0.55 * on).toFixed(3) + ")";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx0 - s2, cy); ctx.lineTo(cx0 + s2, cy);
      ctx.moveTo(cx0, cy - s2); ctx.lineTo(cx0, cy + s2);
      ctx.stroke();
      if (locked) {
        ctx.fillStyle = "rgba(200,255,240,0.85)";
        ctx.beginPath(); ctx.arc(cx0, cy, 1.8, 0, 6.2832); ctx.fill();
      }
    }

    // Horizontal band flash the moment the fit completes.
    if (wavePulse > 0) {
      var pa = wavePulse * wavePulse;
      ctx.fillStyle = "rgba(180,255,224," + (pa * 0.16).toFixed(3) + ")";
      ctx.fillRect(0, cy - base * 1.15 * (1 - wavePulse), W, base * 2.3 * (1 - wavePulse) + 2);
      ctx.strokeStyle = "rgba(220,255,246," + (pa * 0.55).toFixed(3) + ")";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    }

    // Central relief: the wave is a FOREGROUND layer, so carve a soft band out
    // of it to let the nixie glow read through. destination-out is cheap and
    // needs no extra compositing layer.
    ctx.globalCompositeOperation = "destination-out";
    var half = waveGeo.tubeH * 0.62;
    var m = ctx.createLinearGradient(0, cy - half * 1.5, 0, cy + half * 1.5);
    m.addColorStop(0.00, "rgba(0,0,0,0)");
    m.addColorStop(0.28, "rgba(0,0,0,0.50)");
    m.addColorStop(0.50, "rgba(0,0,0,0.62)");
    m.addColorStop(0.72, "rgba(0,0,0,0.50)");
    m.addColorStop(1.00, "rgba(0,0,0,0)");
    ctx.fillStyle = m;
    ctx.fillRect(0, cy - half * 1.5, W, half * 3);
    ctx.globalCompositeOperation = "source-over";
  }
  // Own ~30fps loop: the host only polls render() every 70ms, which would make
  // the waveform stutter at 14fps during the long convergence tail.
  function waveFrame() {
    if (!waveOn || !waveCtx) { waveRaf = 0; return; }
    var t = now();
    if (t - waveLast >= 30) {
      waveLast = t;
      wavePaint(t, waveFit);
      if (wavePulse > 0) wavePulse = Math.max(0, wavePulse - 0.045);
    }
    waveRaf = WIN.requestAnimationFrame(waveFrame);
  }
  function waveSet(on, fit) {
    if (!wave || !waveCtx) return;
    waveFit = fit;
    if (on && !waveOn) {
      waveOn = true;
      waveT0 = now(); waveLast = 0;
      // Paint IMMEDIATELY. The debug freeze (?at=) stubs rAF/setTimeout, so a
      // loop-only overlay would be an empty canvas in every frozen frame —
      // which is exactly how the effect gets reviewed.
      wavePaint(now(), fit);
      if (WIN.requestAnimationFrame && !waveRaf) waveRaf = WIN.requestAnimationFrame(waveFrame);
    } else if (!on && waveOn) {
      waveOn = false;
      if (waveRaf && WIN.cancelAnimationFrame) WIN.cancelAnimationFrame(waveRaf);
      waveRaf = 0;
      wave.style.opacity = "0";
    }
  }
  function waveStop() {
    waveSet(false, 0);
    if (waveResizeBound) { WIN.removeEventListener("resize", waveResize); waveResizeBound = false; }
    if (wave) wave.style.display = "none";
  }

  function phaseOf(v) {
    // DESIGN beat numbers: 1 snow, 2 typing (the dwell rest is part of this
    // beat's tail), 3 caption, 4 converge. Probe events (phase-1..4) now
    // line up with the four-beat design instead of drifting one beat ahead
    // (the old 1/2/3-dwell/4/5 scheme).
    return v < PH.snowEnd ? 1 : v < PH.capStart ? 2 : v < PH.capEnd ? 3 : 4;
  }

  function render(vIn, arc, explicit) {
    if (!built) return;
    // Beats 1-3 advance on ABSOLUTE comfortable timings (wallProgress), so
    // they are identical on a fast and a slow machine. Beat 4 is an
    // ASYMPTOTIC creep toward HOLD_P that never saturates — the last tube
    // keeps hunting — and the clock can never lock: only rush(), called on
    // real app readiness, pushes past HOLD (see step()).
    if (explicit && !rushing) {
      // Debug freeze (?at=) and reduced-motion request an EXACT frame, not a
      // shell-arc input. The freeze script resets PROBE.t0, so wallP is 0 and
      // the arc lead clamp below would otherwise flatten every frozen frame
      // to 0.08. Keep this branch debug/user-preference-only: production
      // always goes through the arc-clamped wall clock.
      var v = clamp(vIn, 0, 1);
    } else if (!rushing) {
      var wallP = clamp(wallProgress((now() - PROBE.t0) / 1000), 0, HOLD_P);
      // THE ARC CAN ONLY CHASE, NEVER JUMP. vIn is the shell's --dsh-boot-arc,
      // which saturates at 1 long before typing ends (the shell knows nothing
      // about our beat schedule). A raw max() let one frame at real==1 clamp
      // straight to HOLD_P=0.97 and swallow ALL beats in a single paint
      // (reviewer-reproduced with ?shell=2: eight rows + caption + ready all
      // inside 3s). Cap the arc's lead over the honest wall clock: it may pull
      // the sequence up to 0.08p AHEAD of the schedule, never beyond it. The
      // ?at= debug freeze also drives vIn, and it still works because at<0.97
      // renders exactly the requested frame (vIn==wallFloor inside the freeze
      // script), while at>=1 goes through rush() which bypasses this clamp.
      var arcLead = Math.min(clamp(vIn, 0, HOLD_P), wallP + 0.08);
      var v = Math.max(arcLead, wallP, lastP);
    } else {
      // Single-clock guarantee: while rushing, ONLY the rush rAF advances v.
      // Host-driven vIn would fight the ease-out curve (two clocks disagreeing
      // for one beat), so inputs are ignored until the lock lands.
      var k = clamp((now() - rushAt) / rushDur, 0, 1);
      var v = rushFrom + (1 - rushFrom) * (1 - Math.pow(1 - k, 2)); // ease-out
    }
    lastP = v;
    PROBE.lastP = v;
    lastArcVal = arc;
    PROBE.lastArc = arc == null ? null : +Number(arc).toFixed(2);
    var ph = phaseOf(v);
    PROBE.lastPhase = ph;
    if (ph !== lastPhase) {
      PROBE.mark("phase-" + ph, "p=" + v.toFixed(3));
      PROBE.flush("phase-" + ph);
      lastPhase = ph;
    }

    // beat 1: full-screen CRT snow opens, then clears. Dimmed to .55 (not a
    // blown-out white frame); the CSS keyframes supply jitter + drift, JS
    // supplies ~12fps fine grain. Reduced motion removes it entirely — no
    // white flash at every startup. The grain timer STOPS once the layer has
    // fully faded (snowEnd + 0.05p) so it never burns CPU through beats 2-5.
    var snowOpacity = REDUCED ? 0 :
      (v < PH.snowEnd ? 0.55 : clamp(1 - (v - PH.snowEnd) / 0.05, 0, 1) * 0.55);
    snow.style.opacity = String(snowOpacity);
    snow.style.display = REDUCED ? "none" : "";
    if (snowIv && (REDUCED || v >= PH.snowEnd + 0.05)) {
      clearInterval(snowIv); snowIv = null;
      snow.style.display = "none";
    }
    var bootReveal = REDUCED ? 1 : (v > PH.snowEnd * 0.6 ? 1 : 0);

    // beat 2: typewriter. The WHOLE row schedule is mapped onto the type
    // phase (not the whole p) so every row finishes before the caption.
    var typeP = clamp((v - PH.snowEnd) / (PH.typeEnd - PH.snowEnd), 0, 1);
    // During a hard cut the row schedule stays frozen at the frame we cut
    // away from (see rushCutP2s), so rows never "fill in" behind the cut.
    // ph===1 (snow) starts NO row: SCHED[0].t0 is 0 and p2s is also 0 there,
    // so an equality test would print the first timestamp with no typed text
    // while the screen is still pure static. -1 keeps every row unrevealed.
    var p2s = ph === 1 ? -1 : (rushCut ? rushCutP2s : typeP * TOTAL_T);
    var shown = 0;
    for (var j = 0; j < SCHED.length; j++) {
      var s = SCHED[j], e = rowEls[j];
      if (p2s < s.t0) {
        if (e.n !== -1) { e.kt.nodeValue = ""; e.n = -1; }
        if (e.stampShown) { e.t.textContent = ""; e.stampShown = false; }
        if (e.resultShown) { e.v.textContent = ""; e.resultShown = false; }
        e.v.classList.remove("show"); e.k.classList.remove("jit");
        continue;
      }
      // Stamp appears WITH its row, never before it.
      if (!e.stampShown) { e.t.textContent = ROWS[j][0]; e.stampShown = true; }
      var n = clamp(Math.floor((p2s - s.t0) / CHAR_T), 0, ROWS[j][1].length);
      // Only touch the DOM when the typed character count actually changes.
      // Writing textContent for all rows on every frame was pure churn.
      if (n !== e.n) { e.kt.nodeValue = ROWS[j][1].slice(0, n); e.n = n; }
      var jit = n > 0 && n < ROWS[j][1].length;
      if (e.jit !== jit) { e.k.classList.toggle("jit", jit); e.jit = jit; }
      if (p2s >= s.result) {
        if (!e.resultShown) { e.v.textContent = ROWS[j][2]; e.resultShown = true; }
        e.v.classList.add("show");
        if (shown <= j) { shown = j + 1; }
      } else {
        if (e.resultShown) { e.v.textContent = ""; e.resultShown = false; }
        e.v.classList.remove("show");
      }
    }
    if (shown > seenResults) {
      PROBE.mark("row-results", "count=" + shown);
      seenResults = shown;
    }
    // Caret rides the CURRENTLY TYPING row. appendChild moves the same node,
    // so there is no per-frame DOM creation; when no row is typing the caret
    // is detached entirely (no orphan row, no duplicated timestamp).
    var caretHost = null, caretFallback = null;
    if (ph === 2) {
      for (var b = 0; b < SCHED.length; b++) {
        if (p2s < SCHED[b].t0) break;
        caretFallback = rowEls[b].k;
        if (p2s < SCHED[b].typeEnd) { caretHost = rowEls[b].k; break; }
      }
      // Between rows the caret stays parked on the last started line, like a
      // real terminal, instead of vanishing for 0.4s on every row boundary.
      if (!caretHost) caretHost = caretFallback;
    }
    if (caretHost) {
      // Keep the caret LAST, after the text node. appendChild on the same
      // parent is a no-op, so this costs nothing on steady frames.
      if (curEl.parentNode !== caretHost || curEl !== caretHost.lastChild) caretHost.appendChild(curEl);
    } else if (curEl.parentNode) curEl.parentNode.removeChild(curEl);

    // The footer bar is the TYPING/BOOT progress, and it is a hard precondition
    // for the caption: it must reach exactly 100% when the last row lands, and
    // the caption may only start after that. Reviewer report: "文字输入的时候
    // 底部是有进度条的，进度需要配合达到100%后才载入字幕". The old mapping sent
    // v through a 0.56/0.44 convergence split, so at typing end (v=0.42) the
    // bar read only ~36% and then a caption appeared anyway.
    // p2s/TOTAL_T is the REAL typed-character fraction, so the number the user
    // reads is the thing actually progressing on screen.
    var bootFrac = clamp(p2s / TOTAL_T, 0, 1);
    barFill.style.width = (bootFrac * 100).toFixed(1) + "%";
    // Beyond typing the bar is full and the label switches to the settle state;
    // it never walks backwards and never re-enters a percentage.
    pctEl.textContent = v >= 1 ? "WORLD LINE LOCKED"
      : bootFrac >= 1 ? "BOOT 100% / SYNCING"
      : "BOOT " + Math.round(bootFrac * 100) + "%";
    valEl.textContent = v >= 1 ? "1.130205  BETA  LOCKED" : "1.130205  BETA";

    // the terminal stays fully readable through the DWELL and retires only as
    // the caption starts to arrive
    var termOpacity = 1;
    if (v >= PH.capStart) termOpacity = clamp(1 - (v - PH.capStart) / 0.06, 0, 1);
    // bootReveal AND terminal retirement both apply: the terminal must be
    // invisible while the full-screen snow owns the frame.
    bootEl.style.opacity = String(bootReveal * termOpacity);
    winEl.style.borderColor = "rgba(62,217,197," + (0.24 * termOpacity).toFixed(3) + ")";

    // beat 4: white caption with GLITCHED fade-in / fade-out.
    // cp is 0 during the DWELL (8.6-10.1s): all eight rows stay fully readable
    // and completely static, giving the eye a beat to take in the result before
    // the caption arrives. The old code fired the caption 139ms after the last
    // row (measured 8503 -> 8642ms), which read as a jump cut.
    var cp = v < PH.capStart ? 0 : clamp((v - PH.capStart) / (PH.capEnd - PH.capStart), 0, 1);
    var capIn = clamp(cp / 0.34, 0, 1), capOut = clamp((cp - 0.72) / 0.28, 0, 1);
    var capOn = v >= PH.capStart && v < PH.capEnd;
    // Glitch is strongest at the two edges and zero while the caption is fully
    // settled: an RGB split + stepped horizontal tear + scanline flash, driven
    // by a deterministic stepped clock (no per-frame allocation, no CSS anim
    // that would fight the inline filter/transform).
    var gAmt = Math.max(clamp((0.42 - capIn) / 0.42, 0, 1), clamp((capOut - 0.30) / 0.70, 0, 1));
    var gStep = Math.floor(now() / 55);
    var gr = ((gStep * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    var gq = ((gStep * 22695477 + 7919) & 0x7fffffff) / 0x7fffffff;
    var flash = gAmt > 0.35 && gr > 0.72;
    // Single opacity owner: capEl stays at 1 while shown, capBig owns the
    // fade. (Two multiplied opacities used to crush the glitch to ~0.145.)
    capEl.style.opacity = capOn ? "1" : "0";
    if (capOn) {
      var ce = 1 - Math.pow(1 - capIn, 3);
      var cBlur = (1 - ce) * 10 + gAmt * 2;
      // Glitch FADE: the letterforms themselves must break, not just sit behind
      // a filter. A container-level drop-shadow was measured at ~0 chromatic
      // pixels because it hides under the white glyphs; text-shadow sits ON the
      // glyph edges, so the RGB split reads at 1x. The white core is kept by
      // painting the colour pair *under* the white fill.
      var gAlpha = (0.25 + gAmt * 0.75).toFixed(2);
      var gSplit = (2 + 12 * gAmt).toFixed(2);
      var gShadow = "-" + gSplit + "px 0 rgba(255,40,80," + gAlpha + ")," + gSplit + "px 0 rgba(50,225,255," + gAlpha + ")," +
        "0 0 22px rgba(255,255,255,.85),0 0 60px rgba(255,122,0,.45)";
      var w1 = capBig.children[0], w2 = capBig.children[1];
      if (w1) w1.style.textShadow = gShadow;
      if (w2) w2.style.textShadow = "-" + gSplit + "px 0 rgba(255,40,80," + gAlpha + ")," + gSplit + "px 0 rgba(50,225,255," + gAlpha + ")," +
        "0 0 20px rgba(255,255,255,.9),0 0 40px rgba(255,122,0,.4)";
      // glitch frames PUNCH THROUGH the fade: a fault is a brightness spike by
      // definition, so it must not be suppressed by the very fade it belongs
      // to. At the two edges the caption is at least ~0.55 opaque.
      var capBase = ce * (1 - capOut);
      capBig.style.opacity = String(clamp(Math.max(capBase, gAmt * 0.72) * (flash ? 0.55 : 1), 0, 1));
      capBig.style.filter = "blur(" + cBlur.toFixed(2) + "px) brightness(" + (1 + (1 - ce) * 1.6 + gAmt * 0.35).toFixed(2) + ")";
      // Tear: a stepped horizontal displacement + skew, plus hard band cuts.
      // gAmt is 1 at both edges and 0 once settled, so the caption is clean
      // when readable and only breaks while it is arriving/leaving.
      var tearPx = (gq - 0.5) * (10 + 46 * gAmt);
      capBig.style.transform = "scale(" + (1.08 - ce * 0.08).toFixed(3) + ") translateX(" + tearPx.toFixed(2) + "px) skewX(" + (tearPx * 0.34).toFixed(2) + "deg)";
      capBig.style.letterSpacing = (0.16 + (1 - ce) * 0.26 + gAmt * 0.02).toFixed(3) + "em";
      if (gAmt > 0.42) {
        var b1 = 4 + gr * 26, b2 = 46 + gq * 26;
        capBig.style.clipPath = "polygon(0 " + b1.toFixed(1) + "%,100% " + b1.toFixed(1) + "%,100% " + b2.toFixed(1) + "%,0 " + b2.toFixed(1) + "%)";
      } else capBig.style.clipPath = "none";
    } else {
      var cw1 = capBig.children[0], cw2 = capBig.children[1];
      if (cw1) cw1.style.textShadow = "";
      if (cw2) cw2.style.textShadow = "";
      capBig.style.clipPath = "none";
    }

    // beat 4: the nixie appears ONLY after the caption is gone; lockProgress
    // walks the real digits in one at a time, ring sweeps, panel scales up.
    // v creeps ASYMPTOTICALLY toward HOLD_P and never saturates, so the last
    // tube keeps hunting for as long as the app takes — visible progress, not
    // a freeze. mp is normalised over [capEnd, 1] (NOT over HOLD_P) so it
    // reaches 1 only when v actually locks at 1, i.e. after rush(). Normalising
    // over HOLD_P made mp hit 1 the instant v reached 0.97, which fired
    // "converged" before the app was ready (measured: converged@33070 with
    // shell-gone only at 34048).
    var mp = v < PH.capEnd ? 0 : clamp((v - PH.capEnd) / (1 - PH.capEnd), 0, 1);
    meterWrap.style.opacity = v >= PH.capEnd ? String(clamp(mp * 4, 0, 1)) : "0";
    if (v >= PH.capEnd) {
      if (meter && typeof meter.lockProgress === "function") meter.lockProgress(mp, BETA);
      var me = 1 - Math.pow(1 - mp, 2);
      meterWrap.style.transform = "translate(-50%,-50%) scale(" + (0.94 + me * 0.06).toFixed(3) + ")";
      meterWrap.style.filter = "brightness(" + (1 + Math.max(0, 1 - mp * 3) * 1.5).toFixed(2) + ")";
      var ring = meterWrap.querySelector(".ks-seq-ring");
      if (ring) { if (mp > 0) ring.classList.add("on"); else ring.classList.remove("on"); }
      if (mp >= 1) {
        if (meterWrap.getAttribute("data-lit") !== "1") {
          meterWrap.setAttribute("data-lit", "1");
          PROBE.mark("converged", "1.130205");
          // Keep the LOCK FRAME paint-only. The ding creates an AudioContext
          // and the probe flush stringifies the whole timeline and fires
          // fetch + sendBeacon; doing both here blocked the same frame the
          // digits settled on, which read as a hitch right before the handoff
          // (measured in v1.12.3). Defer both to the next frame.
          if (WIN.setTimeout) {
            WIN.setTimeout(function () {
              lockDing();
              PROBE.flush("converged");
            }, 16);
          } else { lockDing(); PROBE.flush("converged"); }
        }
      } else meterWrap.removeAttribute("data-lit");
      // While still waiting, label the real state: the reading is settling,
      // not converged. The last digit is genuinely still hunting on screen.
      // Query the node by class instead of children[3] (a silent-wrong-node
      // landmine if the internal order ever changes); use the actual beta
      // glyph — "B" broke the setting (reviewer P2).
      var meterVal = meterWrap.querySelector(".ks-seq-val");
      if (meterVal) meterVal.textContent = mp >= 1 ? "1.130205 β  CONVERGED"
        : "SYNCING  1.130205 β  " + Math.round(mp * 100) + "%";
    }

    // Waveform overlay: it fades in exactly when the meter appears and is
    // painted with the SAME mp, so the traces fit through the eight sample
    // points in lock-step with the eight digits. REDUCED or no canvas -> the
    // layer stays at opacity 0 and costs nothing.
    if (wave) {
      var wShow = !REDUCED && v >= PH.capEnd && !!waveCtx;
      if (wShow) {
        if (mp >= 1 && wavePulse <= 0) wavePulse = 1;
        waveFit = mp;
        wave.style.opacity = String(clamp((v - PH.capEnd) / 0.04, 0, 1));
        if (!waveOn) waveSet(true, mp);
        // An explicit (debug freeze) render cannot rely on the rAF loop, so it
        // repaints synchronously: frozen frames must show the real effect.
        else if (explicit) wavePaint(now(), mp);
      } else if (waveOn) {
        waveSet(false, 0);
      }
    }
    return ph;
  }

  // beat 5: called by the host during its 700ms dissolve. The reading visibly
  // travels toward the sidebar while the whole layer fades out.
  function handoff(h) {
    if (!built) return;
    var k = clamp(h, 0, 1);
    if (meterWrap) {
      // Drop the filter FIRST. render() leaves a brightness() on this node, and
      // a filtered element that also gets a new transform on every frame forces
      // Chrome to re-rasterise it — measured 83ms frames during the crossfade.
      // At convergence the brightness is already exactly 1 (1 + max(0,1-3)*1.5),
      // so clearing it is visually identical and lets the meter ride the
      // compositor instead.
      if (!handoffFilterCleared) {
        meterWrap.style.filter = "none";
        meterWrap.style.willChange = "transform, opacity";
        handoffFilterCleared = true;
      }
      meterWrap.style.transform = "translate(-50%,-50%) translate(" + (-k * 34).toFixed(1) + "vw," + (k * 26).toFixed(1) + "vh) scale(" + (1 - k * 0.55).toFixed(3) + ")";
      meterWrap.style.opacity = String(1 - k * 0.35);
    }
    if (fly) {
      fly.style.opacity = String(clamp(1 - Math.abs(k - 0.45) * 3, 0, 1));
      // Transform-only: the old version wrote left/top/font-size per frame and
      // paid for a full layout on every frame of the hand-off.
      fly.style.transform = "translate(-" + (50 + k * 36).toFixed(1) + "%," + (-k * 28 - 50).toFixed(1) + "%) scale(" + (1 - k * 0.46).toFixed(3) + ")";
    }
  }

  WIN.KS_SEQ = {
    build: build, render: render, handoff: handoff, refs: function () { return refs; },
    built: function () { return built; }, mount: function () { return mount; },
    setWall: setWallAttr, progress: function () { return lastP; },
    phase: function () { return lastPhase; }, probe: PROBE, PH: PH, ROWS: ROWS,
    BETA: BETA,
    // Retiming contract consumed by the host's step(): the sequence creeps to
    // HOLD and only rush() releases the lock, so convergence coincides with
    // real app readiness instead of pre-empting it.
    rush: rush, HOLD: HOLD_P, tail: function () { return TAIL_TAU; },
    // The host calls this on finish so the waveform's rAF loop stops.
    stopWave: waveStop
  };
})();
`;

// Plain ES5, no template literals: this text is injected into the page as an
// inline classic script, evaluated long before any module system exists.
const LOAD_SCRIPT = `
(function () {
  "use strict";
  var BETA = "1130205";
  var SEQ = window.KS_SEQ;
  var probe = window.KS_PROBE;
  var nativeApi = (window.KS_SPLASH && window.KS_SPLASH.native === true) ? window.KS_SPLASH : null;
  // ONE clock for the host script too. The sequence has its own now() wrapper
  // (same idea); the host cannot reach it across script scopes, so it defines
  // the identical accessor. Elapsed math MUST use it — the v1.12.3
  // boot=1794587828.8s bug was exactly this mixup.
  function now() { try { return window.performance && performance.now ? performance.now() : Date.now(); } catch (e) { return Date.now(); } }
  var mount = document.getElementById("ks-loadscreen");
  var meter = null, fill = null, val = null;
  var lastProgress = 0, finished = false, ticker = 0, ceiling = 0, handoffTicker = 0;

  function rec(name, extra) { try { if (probe) probe.mark(name, extra); } catch (e) {} }
  function flush(tag) { try { if (probe) probe.flush(tag); } catch (e) {} }
  rec("host-script-start");

  if (!mount) {
    mount = document.createElement("div");
    mount.id = "ks-loadscreen";
    mount.setAttribute("aria-hidden", "true");
    (document.body || document.documentElement).appendChild(mount);
    rec("host-created-mount");
  }
  try { document.documentElement.setAttribute("data-ks-loadscreen", "1"); } catch (e) {}

  var reduced = false;
  try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  // Adopt the element the asar painted at t=0. adopt() stops the native ticker
  // and hands us its live meter / bar / value nodes; nothing is recreated, so
  // the screen does not blink at the host hand-off.
  if (nativeApi && typeof nativeApi.adopt === "function") {
    try {
      var refs = nativeApi.adopt();
      if (refs) { meter = refs.meter || null; fill = refs.fill || null; val = refs.val || null; }
      window.KS_SPLASH.adopted = true;
      rec("adopted-native", refs ? "ok" : "no-refs");
    } catch (e) { rec("adopt-failed", String(e && e.message ? e.message : e)); }
  }

  // The asar payload normally already built the sequence. If it did not (a DSH
  // upgrade overwrote app.asar), build the identical DOM here from the same
  // shared script so the two paths are visually indistinguishable.
  if (SEQ && typeof SEQ.build === "function" && !SEQ.built()) {
    try {
      var r2 = SEQ.build(mount);
      if (r2) { meter = r2.meter; fill = r2.fill; val = r2.val; }
      rec("host-built-sequence");
    } catch (e) { rec("host-build-failed", String(e && e.message ? e.message : e)); }
  } else if (SEQ && typeof SEQ.refs === "function") {
    var r3 = SEQ.refs();
    if (r3) { meter = r3.meter; fill = r3.fill; val = r3.val; }
  }
  try { if (SEQ) SEQ.setWall(); } catch (e) {}

  var shell = document.querySelector("[data-dsh-boot]");
  if (shell) shell.setAttribute("data-ks-boot", "true");
  rec("host-built", "native=" + (nativeApi ? 1 : 0));
  flush("host-built");

  // ONE clock, same wrapper the sequence uses (performance.now). Mixing this
  // with Date.now() for elapsed math produced the 1794587828.8s bug once.
  var started = now();
  var shellGoneAt = null;
  // MINIMUM FILM RUNTIME. On a fast boot the app is ready long before the
  // sequence has played its story, and the hard cut would swallow snow, typing
  // and the caption in one frame (reviewer: "启动画面播放得不完全").
  // This is a FLOOR, not a delay: the film may play longer, never shorter.
  // The floor covers the beats a viewer must see — snow, the full typing
  // beat, the dwell rest and the caption — and stops just before the
  // convergence beat, which the hard cut then plays out as the lock.
  // 0 disables the floor (the old behaviour) for anyone who prefers it.
  var MIN_FILM_MS = 16000;
  var filmFloorReached = false;
  if (SEQ && typeof SEQ.progress === "function") {
    try { lastProgress = Math.max(0, Math.min(1, SEQ.progress())); } catch (e) {}
  }

  function finish() {
    if (finished) return;
    finished = true;
    if (ticker) clearInterval(ticker);
    if (ceiling) clearTimeout(ceiling);
    if (handoffTicker) clearInterval(handoffTicker);
    try { if (snowIv) { clearInterval(snowIv); snowIv = null; } } catch (e) {}
    // Stop the waveform's own rAF loop. It is a full-screen canvas repainting
    // at ~30fps; leaving it alive after the layer is removed would burn the
    // CPU for the rest of the session.
    try { if (typeof SEQ === "object" && SEQ && typeof SEQ.stopWave === "function") SEQ.stopWave(); } catch (e) {}
    try { document.documentElement.setAttribute("data-ks-ready", "1"); } catch (e) {}
    rec("finish", "p=" + lastProgress.toFixed(3));
    flush("finish");
    var dissolve = function () {
      mount.setAttribute("data-out", "true");
      // One rAF clock drives both the layer fade (CSS opacity) and the meter
      // travel, so they cannot drift apart. The locked reading is held for only
      // 80ms: the previous 90ms setTimeout + 180ms hold put ~320ms of dead
      // stillness between the digits locking and anything moving, which reads
      // as a hitch at the exact moment the reviewer is watching.
      var hStart = 0;
      var hDelay = 80;
      var hDur = 700;
      var handoffStep = function (ts) {
        if (hStart === 0) hStart = ts;
        var t = ts - hStart - hDelay;
        var h = t <= 0 ? 0 : Math.min(1, t / hDur);
        try { if (SEQ) SEQ.handoff(h); } catch (e) {}
        if (h < 1 && window.requestAnimationFrame) {
          window.requestAnimationFrame(handoffStep);
        }
      };
      if (window.requestAnimationFrame) window.requestAnimationFrame(handoffStep);
      else { var hi = 0; var iv = setInterval(function () { hi += 33; SEQ.handoff(Math.min(1, hi / hDur)); if (hi >= hDur) clearInterval(iv); }, 33); }
      // Remove the layer once the fade has actually finished (hDelay + hDur),
      // not 260ms later: a transparent full-screen fixed layer has no business
      // sitting on top of the freshly painted app.
      setTimeout(function () {
        if (mount.parentNode) mount.parentNode.removeChild(mount);
        try { window.KS_SPLASH = null; } catch (e) {}
        rec("disposed");
        flush("disposed");
      }, hDelay + hDur + 90);
    };
    // ONE frame: React has already painted the app (with the SAME wallpaper)
    // under our still-opaque layer. The old code waited two rAFs plus a 90ms
    // timer before starting the fade.
    if (window.requestAnimationFrame) window.requestAnimationFrame(dissolve);
    else setTimeout(dissolve, 40);
    // Hard ceiling: a cosmetic layer can never outlive the app.
    setTimeout(function () { if (mount.parentNode) mount.parentNode.removeChild(mount); }, 2600);
  }

  function step() {
    if (finished) return;
    var elapsed = now() - started;
    // Elapsed time on the SEQUENCE's clock, for anything that must line up
    // with the film (the minimum-runtime floor). The host's own "elapsed"
    // starts when this script was injected, which can be seconds after the
    // asar's first paint; using it for the floor would shorten the film by
    // exactly that delay. The sequence's own wall clock already drives the
    // beats, so this is the same quantity the film sees.
    var filmMs = (function () {
      try {
        var t0 = (SEQ && SEQ.probe && isFinite(SEQ.probe.t0)) ? SEQ.probe.t0 : null;
        if (t0 === null) return elapsed;
        var pn = (window.performance && performance.now) ? performance.now() : null;
        return pn === null ? elapsed : (pn - t0);
      } catch (e) { return elapsed; }
    })();
    var shellNow = document.querySelector("[data-dsh-boot]");
    if (shellNow && shellNow.getAttribute("data-ks-boot") !== "true") shellNow.setAttribute("data-ks-boot", "true");

    // The shell publishes real load progress on the spinner as a conic angle.
    var arcEl = document.querySelector("[data-dsh-boot-spinner]");
    var arc = null, real = null;
    if (arcEl) {
      try {
        arc = parseFloat(arcEl.style.getPropertyValue("--dsh-boot-arc"));
        if (!isFinite(arc)) arc = parseFloat(window.getComputedStyle(arcEl).getPropertyValue("--dsh-boot-arc"));
      } catch (e) {}
      if (isFinite(arc)) real = Math.max(0, Math.min(1, (arc - 72) / 216));
    }
    var raw = real === null ? Math.min(1, elapsed / 2600) : real;
    // The shell restarts its arc for a second loading wave (measured: 1.00 then
    // 0.70), so clamp instead of animating backwards.
    var progress = Math.max(raw, lastProgress);
    if (Math.abs(progress - lastProgress) > 0.25) rec("progress", progress.toFixed(2));
    lastProgress = progress;
    // reduced-motion asks for the FINAL static frame directly (explicit=true
    // bypasses the arc clamp); normal boots let the wall clock pace the film
    // and let the shell arc only chase it. The arc is NEVER a pacemaker.
    try {
      if (SEQ) SEQ.render(reduced ? 1 : progress, arc, !!reduced);
    } catch (e) { rec("render-failed", String(e && e.message ? e.message : e)); }
    // DO NOT write the footer bar / readout here. The fill and val nodes ARE
    // the very nodes SEQ.render() owns (refs.fill === barFill, refs.val ===
    // valEl), and the shell's arc is not the boot progress — it saturates at 1
    // long before typing ends. Writing them from this loop overwrote the
    // sequence's own numbers every 70ms, so the bar showed the shell's arc
    // instead of the real typed-character fraction. The sequence is the single
    // writer.

    // Hand over only when BOTH conditions hold: the shell has torn its own
    // screen down AND the sequence has converged. Real boots vary wildly
    // (measured: shell gone at 1.6s on one run, host inject at 27s on another),
    // so finishing on the shell alone used to cut beat 1 off at p=0.857.
    var seqP = SEQ && typeof SEQ.progress === "function" ? SEQ.progress() : lastProgress;
    var holdP = (SEQ && SEQ.HOLD) || 0.97;
    // THE FIX for the dead tail: app readiness (shell gone) no longer WAITS
    // for the clock to finish convergence. The moment the shell is torn down
    // the sequence RUSHES whatever is left of p in ~0.3-1.4s and locks — so
    // the world line settles exactly when the app is ready, never after.
    if (!shellNow && shellGoneAt === null) {
      shellGoneAt = elapsed;
      // Measure the REAL boot duration for telemetry only (baseline = the
      // sequence's own t0, i.e. the asar's first paint, NOT "started" = when
      // this host script was injected). Pacing no longer depends on it: beats
      // 1-3 use absolute timings and beat 4 creeps asymptotically, so a wrong
      // estimate can no longer freeze the screen (measured v1.12.2 bug: host
      // injected at 32.6s, shell gone at 34.0s, and the learned 1.3s would
      // have compressed the whole sequence into a blink on the next boot).
      var bootSec = (function () {
        try {
          // PROBE.t0 is a performance.now() reading, so it must be subtracted
          // from performance.now() — NOT Date.now(). v1.12.3 mixed the two
          // clocks and reported "boot=1794587828.8s".
          var t = (SEQ && SEQ.probe && isFinite(SEQ.probe.t0)) ? SEQ.probe.t0 : null;
          if (t === null) return elapsed / 1000;
          var pn = (window.performance && performance.now) ? performance.now() : null;
          return pn === null ? elapsed / 1000 : (pn - t) / 1000;
        } catch (e) { return elapsed / 1000; }
      })();
      rec("shell-gone", "p=" + seqP.toFixed(3) + " boot=" + bootSec.toFixed(1) + "s");
      flush("shell-gone");
      if (seqP < holdP + 0.001) {
        if (filmMs < MIN_FILM_MS) {
          // The app is ready but the FILM is not finished. Hold the cut: the
          // sequence keeps playing on its own wall clock (beats snow / typing /
          // dwell / caption), and the lock is played at the floor. This is the
          // difference between "the boot was fast" and "the boot was cut off".
          rec("film-floor-hold", "at=" + filmMs.toFixed(0) + "ms floor=" + MIN_FILM_MS);
          flush("film-floor-hold");
        } else {
          filmFloorReached = true;
          rec("rush-start", "p=" + seqP.toFixed(3));
          try { if (SEQ && typeof SEQ.rush === "function") SEQ.rush(); } catch (e) {}
        }
      }
    }
    // The floor elapsed while the app was already gone: play the lock now.
    // filmFloorReached is set by the shell-gone branch above when the shell
    // tears down after the floor, so this fires exactly ONCE per boot.
    if (!shellNow && !filmFloorReached && filmMs >= MIN_FILM_MS) {
      filmFloorReached = true;
      if (seqP < holdP + 0.001) {
        rec("rush-start", "p=" + seqP.toFixed(3) + " (floor)");
        try { if (SEQ && typeof SEQ.rush === "function") SEQ.rush(); } catch (e) {}
      }
    }
    // Reduced-motion users see a static LOCKED readout immediately (p=1), so
    // waiting for the shell would leave them staring at a frozen splash if the
    // shell is slow: hand over as soon as the sequence reports convergence.
    if (reduced && seqP >= 1) { finish(); return; }
    if (!shellNow && elapsed > 900 && seqP >= 1) finish();
  }

  ticker = setInterval(step, 70);
  step();
  rec("ticker-armed");
  flush("ticker-armed");
  // Hard ceiling, as a last-resort safety net ONLY. With the learn/rush model
  // the finish is gated on the shell's own teardown plus a sub-second outro;
  // but if the shell never tears down (a pathological boot), a cosmetic layer
  // still must not own the screen forever. Telemetry records WHY it fired and
  // what the sequence was showing, so a run of ceiling-forced events is the
  // signal to retune T_SNOW/T_CAP instead of guessing.
  ceiling = setTimeout(function () {
    rec("ceiling-forced", "p=" + (SEQ && SEQ.progress ? SEQ.progress().toFixed(3) : "?") +
      " phase=" + (SEQ && SEQ.phase ? SEQ.phase() : "?"));
    finish();
  }, 45000);
})();
`;

export function apply(ctx) {
  // A cosmetic skin must never be able to block host startup: every step here is
  // best-effort, and any failure simply leaves the stock loading screen in place.
  try {
    const rows = [
      { kind: "style", text: NIXIE_CSS + "\n" + LOAD_CSS },
      // The native splash already defines sg-nixie; the guard inside the
      // component makes a second evaluation harmless (upgrade fallback path).
      { kind: "script", placement: "body", text: SG_NIXIE_JS },
      // Same guard as the asar copy: if KS_SEQ already exists this is a no-op.
      { kind: "script", placement: "body", text: SEQUENCE_JS },
      { kind: "script", placement: "body", text: LOAD_SCRIPT }
    ];
    const log = ctx.logger("dsh-skin-kurisu");
    log.info("boot injection registered (" + rows.length + " rows)");
    ctx.inject(["webServer"], (webCtx) => {
      webCtx.on("webserver/index-inject", (table) => {
        for (const row of rows) table.push(row);
        log.info("boot rows pushed to index-inject table (total rows=" + table.length + ")");
      });
    });
  } catch (error) {
    try {
      ctx.logger("dsh-skin-kurisu").warn("boot injection unavailable: " + String(error && error.message ? error.message : error));
    } catch (ignored) {
      /* logging is optional too */
    }
  }
}
