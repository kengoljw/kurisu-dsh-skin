/* ============================================================
 * sg-nixie.js — 辉光管数字组件（Web Component，零依赖，单文件）
 * ============================================================
 * 用法（HTML）：
 *   <script src="./sg-nixie.js"></script>
 *   <sg-nixie value="1.048596"></sg-nixie>            <!-- 分歧计模式 -->
 *   <sg-nixie mode="clock"></sg-nixie>                <!-- 时钟模式 -->
 *
 * 用法（JS）：
 *   const m = document.querySelector('sg-nixie');
 *   m.value  = '0.571024';   // 属性驱动，滚动切换
 *   m.shiftTo('0.571024');   // 同上（方法）
 *   m.ignite('1.048596');    // 点火：从全暗依次点亮
 *   m.fail();                // 故障态：循环 ?.?????? 后停格 -.-
 *   m.reread();              // 同值重读（点击仪表也会触发）
 *
 * 属性：
 *   value  "X.XXXXXX" 分歧计读数（meter 模式生效）
 *   mode   "meter"（默认）| "clock"
 *
 * 事件（bubbles + composed，可穿透 Shadow DOM）：
 *   meter:shift  { detail: { to } }
 *   meter:lock   { detail: { index, char } }
 *   meter:locked { detail: { value } }   // 滚动结束
 *   meter:fail   { detail: { value } }
 *
 * 还原度要点（五层结构 / 双层描边 / 物理时序 / 电流声）见 README.md 第 5 节。
 * 字形源自 owenisas/steins-gate-world-line 的 nixie.svg（MIT）。
 * ============================================================ */
(() => {
  'use strict';

  /* ---- 阴极物理顺序（前→后）与层号 ---- */
  const LAYER = { '1':0, '7':1, '4':2, '2':3, '5':4, '3':5, '9':6, '6':7, '0':8, '8':9 };
  const ORDER = ['1','7','4','2','5','3','9','6','0','8'];
  const DIGITS = '0123456789';
  const SYMBOL_MAP = {
    '0':'nx-0','1':'nx-1','2':'nx-2','3':'nx-3','4':'nx-4','5':'nx-5','6':'nx-6','7':'nx-7','8':'nx-8','9':'nx-9',
    '.':'nx-dot','?':'nx-q','-':'nx-dash',' ':'nx-blank'
  };
  const DOT_INDEX = 1;

  /* ---- 调色板（与 owenisas 的 DOM 实现一致） ---- */
  const CSS = `
  :host {
    display: inline-block;
    --nx-core: #FFD7A0; --nx-glow: #FF6A00; --nx-halo: #FF3D00;
    --nx-wire: #5E5A52; --nx-c-body: #121310;
    --nx-gr: .16; --nx-span: min(900px, 86vw, calc(100vw - 32px));
    --nx-tw: calc(var(--nx-span) / (8 + 7 * var(--nx-gr)));
    --nx-dome: calc(var(--nx-tw) * .34);
    --nx-sw-sheath: 2.9; --nx-sw-core: 1.15; --nx-sw-wire: 1;
    --nx-stack-alpha: .3; --nx-front-alpha: .9; --nx-mesh-alpha: .5;
    --nx-g1: calc(var(--nx-tw) * .010); --nx-g2: calc(var(--nx-tw) * .040); --nx-g3: calc(var(--nx-tw) * .110);
    font-family: "Share Tech Mono", monospace;
    color: #D6D9CF;
  }
  .nx {
    display: flex; align-items: flex-end; gap: calc(var(--nx-tw) * var(--nx-gr));
    width: 100%; max-width: var(--nx-span); position: relative; line-height: 0;
    -webkit-user-select: none; user-select: none;
    padding: 30px 36px 22px; border-radius: 14px;
    background: linear-gradient(180deg, #1b2027 0%, #12161c 60%, #0b0e12 100%);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / .09), inset 0 -3px 10px rgb(0 0 0 / .7),
      0 28px 70px rgb(0 0 0 / .8), 0 0 120px rgb(255 106 0 / .05);
    cursor: pointer; isolation: isolate;
  }
  .nx::before, .nx::after {
    content: ""; position: absolute; top: 10px; width: 10px; height: 10px; border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #566372, #0f1318 75%);
    box-shadow: inset 0 -1px 2px rgb(0 0 0 / .9), 0 1px 0 rgb(255 255 255 / .07);
  }
  .nx::before { left: 14px; } .nx::after { right: 14px; }

  .nx__tube {
    position: relative; flex: none; width: var(--nx-tw); aspect-ratio: 10 / 22; isolation: isolate;
    border-radius: 50% 50% calc(var(--nx-tw) * .07) calc(var(--nx-tw) * .07) /
                   var(--nx-dome) var(--nx-dome) calc(var(--nx-tw) * .07) calc(var(--nx-tw) * .07);
    background:
      linear-gradient(to top, #0a0a09 0%, #171814 5.5%, #22221e 7.4%, #3a3933 8.1%, #121311 8.7%, rgb(18 19 16 / 0) 9.4%),
      linear-gradient(90deg, rgb(0 0 0 / .55) 0%, rgb(0 0 0 / .18) 9%, rgb(255 255 255 / .035) 26%,
        rgb(255 255 255 / .012) 52%, rgb(0 0 0 / .14) 78%, rgb(0 0 0 / .5) 100%),
      radial-gradient(46% 11% at 50% 3%, rgb(58 55 49 / .55), rgb(58 55 49 / 0) 100%),
      var(--nx-c-body);
    box-shadow: 0 10px 16px rgb(0 0 0 / .55);
  }
  .nx__tube:not(.is-off) { box-shadow: 0 10px 16px rgb(0 0 0 / .55), 0 0 34px rgb(255 90 10 / .18), 0 0 90px rgb(255 80 0 / .10); }

  .nx__stack, .nx__lit, .nx__front {
    position: absolute; left: -4%; width: 108%; top: 7.4%; height: auto; aspect-ratio: 60 / 100;
    overflow: visible; pointer-events: none;
  }
  .nx__stack { z-index: 1; color: var(--nx-wire); stroke-width: var(--nx-sw-wire); opacity: var(--nx-stack-alpha);
    background: radial-gradient(60% 46% at 50% 50%, rgb(255 92 16 / .55), rgb(255 70 10 / .22) 50%, rgb(255 61 0 / .06) 75%, rgb(255 61 0 / 0) 100%); }
  .nx__halo {
    position: absolute; inset: -16% -28%; z-index: 0; pointer-events: none;
    background: radial-gradient(50% 50% at 50% 50%, rgb(255 120 30 / var(--nx-halo-alpha, .30)), rgb(255 80 0 / .12) 45%, rgb(255 61 0 / 0) 75%);
    filter: blur(calc(var(--nx-tw) * .05)); mix-blend-mode: screen;
    opacity: 0; transition: opacity .3s;
  }
  .nx__tube:not(.is-off) .nx__halo { opacity: 1; }
  .nx__lit { z-index: 2;
    filter: drop-shadow(0 0 var(--nx-g1) rgb(255 120 30 / .95))
           drop-shadow(0 0 var(--nx-g2) rgb(255 106 0 / .6))
           drop-shadow(0 0 var(--nx-g3) rgb(255 61 0 / .32))
           drop-shadow(0 0 calc(var(--nx-tw) * .22) rgb(255 61 0 / .18))
           drop-shadow(0 0 calc(var(--nx-tw) * .40) rgb(255 50 0 / .10)); }
  .nx__sheath { color: var(--nx-glow); stroke-width: var(--nx-sw-sheath); }
  .nx__core   { color: var(--nx-core); stroke-width: var(--nx-sw-core); }
  .nx__front  { z-index: 3; color: #6a4630; stroke-width: var(--nx-sw-wire); opacity: var(--nx-front-alpha); mix-blend-mode: multiply; }
  .is-hidden { visibility: hidden; }

  .nx__tube::before {
    content: ""; position: absolute; z-index: 4; left: 5%; right: 5%; top: 16.5%; bottom: 20.5%;
    pointer-events: none; opacity: var(--nx-mesh-alpha); mix-blend-mode: multiply;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6.928' height='12' viewBox='0 0 6.928 12'%3E%3Cpath d='M3.464 0L6.928 2L6.928 6L3.464 8L0 6L0 2Z M3.464 8L3.464 12' fill='none' stroke='%232a2019' stroke-width='.5'/%3E%3C/svg%3E");
    background-size: calc(var(--nx-tw) * .082) auto; background-position: center;
    -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 22%, #000 78%, transparent 100%),
                        linear-gradient(to bottom, transparent 0%, #000 12%, #000 88%, transparent 100%);
    -webkit-mask-composite: source-in; mask-image: inherit; mask-composite: intersect;
  }
  .nx__tube::after {
    content: ""; position: absolute; z-index: 5; inset: 0 0 9.4% 0; pointer-events: none;
    border-radius: 50% 50% 0 0 / var(--nx-dome) var(--nx-dome) 0 0;
    background:
      linear-gradient(90deg, rgb(222 230 236 / 0) 12%, rgb(222 230 236 / .17) 16.5%, rgb(222 230 236 / .05) 20%, rgb(222 230 236 / 0) 25%),
      linear-gradient(90deg, rgb(222 230 236 / 0) 79%, rgb(222 230 236 / .055) 85%, rgb(222 230 236 / 0) 90%),
      radial-gradient(26% 6% at 34% 5%, rgb(236 240 243 / .30), rgb(236 240 243 / 0) 100%);
    box-shadow: inset 0 0 0 1px rgb(216 224 230 / .06), inset 1px 0 0 rgb(216 224 230 / .08), inset 0 1px 1px rgb(216 224 230 / .14);
  }

  .nx__tube.is-off .nx__lit { visibility: hidden; }
  .nx__tube.is-off .nx__stack { background: none; }
  .nx__tube.is-dim .nx__lit { opacity: .38 !important; }
  .nx__tube[data-char="blank"] .nx__stack { background: none; }
  .nx__tube[data-char="dot"] .nx__stack, .nx__tube[data-char="dot"] .nx__front { display: none; }
  .nx__tube.is-pulse .nx__lit {
    filter: drop-shadow(0 0 var(--nx-g1) rgb(255 120 30 / .95))
           drop-shadow(0 0 var(--nx-g2) rgb(255 106 0 / .6))
           drop-shadow(0 0 var(--nx-g3) rgb(255 61 0 / .32))
           drop-shadow(0 0 calc(var(--nx-tw) * .22) rgb(255 61 0 / .18))
           drop-shadow(0 0 calc(var(--nx-tw) * .40) rgb(255 50 0 / .10))
           brightness(2.1) saturate(1.1);
  }

  @media (prefers-reduced-motion: no-preference) {
    .nx__lit { animation: nx-hum var(--nx-hum, 9.7s) linear var(--nx-hum-delay, 0s) infinite; }
    .nx.is-fail .nx__lit { animation-name: nx-hum-unstable; }
  }
  .nx__tube:nth-child(1) { --nx-hum: 9.7s;  --nx-hum-delay: -1.3s; }
  .nx__tube:nth-child(2) { --nx-hum: 12.1s; --nx-hum-delay: -7.9s; }
  .nx__tube:nth-child(3) { --nx-hum: 8.3s;  --nx-hum-delay: -4.2s; }
  .nx__tube:nth-child(4) { --nx-hum: 10.9s; --nx-hum-delay: -0.6s; }
  .nx__tube:nth-child(5) { --nx-hum: 7.6s;  --nx-hum-delay: -5.5s; }
  .nx__tube:nth-child(6) { --nx-hum: 11.4s; --nx-hum-delay: -2.8s; }
  .nx__tube:nth-child(7) { --nx-hum: 9.1s;  --nx-hum-delay: -6.4s; }
  .nx__tube:nth-child(8) { --nx-hum: 8.8s;  --nx-hum-delay: -3.7s; }
  @keyframes nx-hum {
    0%, 100% { opacity: 1; } 11% { opacity: .965; } 12.5% { opacity: 1; }
    38% { opacity: .975; } 40% { opacity: 1; } 71% { opacity: 1; }
    71.3% { opacity: .62; } 71.7% { opacity: 1; } 88% { opacity: .97; } 89% { opacity: 1; }
  }
  @keyframes nx-hum-unstable {
    0%, 100% { opacity: 1; } 17% { opacity: 1; } 17.4% { opacity: .3; } 17.9% { opacity: .95; }
    44% { opacity: .9; } 46% { opacity: 1; } 63% { opacity: 1; } 63.3% { opacity: .5; } 63.8% { opacity: 1; } 90% { opacity: .92; }
  }
  @media (max-width: 700px) {
    :host { --nx-sw-sheath: 3.8; --nx-sw-core: 1.6; --nx-sw-wire: 1.5; }
    .nx__front, .nx__tube::before { display: none; }
  }
  .sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; clip-path: inset(50%); overflow: hidden; white-space: nowrap; }
  `;

  const SPRITE = `
  <svg xmlns="http://www.w3.org/2000/svg" style="display:none">
    <symbol id="nx-0" viewBox="0 0 60 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(30 50) scale(0.952) translate(-30 -50)" data-layer="8"><path d="M11 36 A19 19 0 0 1 49 36 L49 64 A19 19 0 0 1 11 64 Z"/></g></symbol>
    <symbol id="nx-1" viewBox="0 0 60 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g data-layer="0"><path d="M19.5 28.5 L30 17 L30 83"/></g></symbol>
    <symbol id="nx-2" viewBox="0 0 60 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(30 50) scale(0.982) translate(-30 -50)" data-layer="3"><path d="M11 36 A19 19 0 1 1 43.66 49.2 L11 83 L49 83"/></g></symbol>
    <symbol id="nx-3" viewBox="0 0 60 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(30 50) scale(0.970) translate(-30 -50)" data-layer="5"><path d="M16.84 26.21 A14 14 0 1 1 30 45 A19 19 0 1 1 12.15 70.5"/></g></symbol>
    <symbol id="nx-4" viewBox="0 0 60 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(30 50) scale(0.988) translate(-30 -50)" data-layer="2"><path d="M39 83 L39 17 L11 63 L49 63"/></g></symbol>
    <symbol id="nx-5" viewBox="0 0 60 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(30 50) scale(0.976) translate(-30 -50)" data-layer="4"><path d="M47 17 L16 17 L14.44 53.1 A19 19 0 1 1 13.55 73.5"/></g></symbol>
    <symbol id="nx-6" viewBox="0 0 60 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(30 50) scale(0.958) translate(-30 -50)" data-layer="7"><path d="M43.86 17.18 A36 47 0 0 0 11 64 A19 19 0 1 0 49 64 A19 19 0 1 0 11 64"/></g></symbol>
    <symbol id="nx-7" viewBox="0 0 60 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(30 50) scale(0.994) translate(-30 -50)" data-layer="1"><path d="M11 17 L49 17 Q33 42 28 83"/></g></symbol>
    <symbol id="nx-8" viewBox="0 0 60 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(30 50) scale(0.946) translate(-30 -50)" data-layer="9"><path d="M15 31.5 A15 14.5 0 0 1 45 31.5 A15 14.5 0 0 1 15 31.5 Z"/><path d="M11.5 64.5 A18.5 18.5 0 0 1 48.5 64.5 A18.5 18.5 0 0 1 11.5 64.5 Z"/></g></symbol>
    <symbol id="nx-9" viewBox="0 0 60 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(30 50) scale(0.964) translate(-30 -50)" data-layer="6"><path d="M16.14 82.82 A36 47 0 0 0 49 36 A19 19 0 1 0 11 36 A19 19 0 1 0 49 36"/></g></symbol>
    <symbol id="nx-dot" viewBox="0 0 60 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g data-layer="-1"><circle cx="30" cy="80" r="2" fill="currentColor"/></g></symbol>
    <symbol id="nx-q" viewBox="0 0 60 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g data-layer="-1"><path d="M15.9 26.87 A15 15 0 1 1 41.71 41.38 L30 56 L30 63"/><circle cx="30" cy="80" r="2" fill="currentColor"/></g></symbol>
    <symbol id="nx-dash" viewBox="0 0 60 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g data-layer="-1"><path d="M18 50 L42 50"/></g></symbol>
    <symbol id="nx-blank" viewBox="0 0 60 100"></symbol>
  </svg>`;

  class SgNixie extends HTMLElement {
    static get observedAttributes() { return ['value', 'mode']; }

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.innerHTML = `<style>${CSS}</style>${SPRITE}<div class="nx" part="panel"></div><div class="sr-only" aria-live="polite"></div>`;
      this._panel = shadow.querySelector('.nx');
      this._live  = shadow.querySelector('.sr-only');
      this._timers = [];
      this._clockTimer = null;
      this._rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._value = '1.048596';

      this._tubes = [];
      for (let i = 0; i < 8; i++) {
        const tube = document.createElement('div');
        tube.className = 'nx__tube';
        let stack = '', front = '';
        ORDER.forEach(c => { stack += `<use href="#nx-${c}" data-ch="${c}"/>`; front += `<use href="#nx-${c}" data-ch="${c}"/>`; });
        tube.innerHTML =
          `<div class="nx__halo"></div>` +
          `<svg class="nx__stack" viewBox="0 0 60 100">${stack}</svg>` +
          `<svg class="nx__lit" viewBox="0 0 60 100"><use class="nx__sheath" href="#nx-blank"/><use class="nx__core" href="#nx-blank"/></svg>` +
          `<svg class="nx__front" viewBox="0 0 60 100">${front}</svg>`;
        this._panel.appendChild(tube);
        this._tubes.push(tube);
      }
      this._panel.addEventListener('click', () => this.reread());
    }

    connectedCallback() {
      if (!this.hasAttribute('value')) this.setAttribute('value', this._value);
      this._applyMode(this.getAttribute('mode'));
      if (this._mode !== 'clock') this._ignite(this._value);
    }

    disconnectedCallback() { this._clearAll(); this._stopClock(); }

    attributeChangedCallback(name, oldV, newV) {
      if (oldV === newV) return;
      if (name === 'value') { this._value = newV; if (this._mode !== 'clock') this._shiftTo(newV); }
      if (name === 'mode')  this._applyMode(newV);
    }

    get value() { return this._value; }
    set value(v) { this.setAttribute('value', v); }
    get mode() { return this._mode || 'meter'; }
    set mode(m) { this.setAttribute('mode', m); }

    /* ---------- 公共 API ---------- */
    shiftTo(v) { this._shiftTo(v); }
    ignite(v)  { this._ignite(v); }
    reread()   { if (this._mode !== 'clock') this._shiftTo(this._value); }
    fail()     { this._fail(); }

    /* ---------- 内部 ---------- */
    _applyMode(m) {
      this._mode = m === 'clock' ? 'clock' : 'meter';
      if (this._mode === 'clock') this._startClock();
      else { this._stopClock(); if (this.isConnected) this._shiftTo(this._value); }
    }

    _setTube(tube, char) {
      tube.dataset.char = char;
      const L = char in LAYER ? LAYER[char] : -1;
      tube.classList.toggle('is-off', char === ' ');
      tube.querySelectorAll('.nx__stack use').forEach(u => u.classList.toggle('is-hidden', LAYER[u.dataset.ch] <= L));
      tube.querySelectorAll('.nx__front use').forEach(u => u.classList.toggle('is-hidden', LAYER[u.dataset.ch] >= L));
      tube.querySelectorAll('.nx__lit use').forEach(u => u.setAttribute('href', '#' + SYMBOL_MAP[char]));
    }

    _normalize(value) {
      const v = String(value ?? '');
      let first, right;
      if (v.includes('.')) { const i = v.indexOf('.'); first = v.slice(0, i).slice(-1) || ' '; right = v.slice(i + 1); }
      else { first = v.slice(0, 1) || ' '; right = v.slice(1); }
      return [first, '.', ...((right + '      ').slice(0, 6))].map(c => c in SYMBOL_MAP ? c : ' ');
    }

    _announce(v) { this._live.textContent = `World line reading ${v.replace(/ /g, '')}`; }
    _emit(name, detail) { this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true })); }

    _clearAll() { this._timers.forEach(id => typeof id === 'number' ? clearTimeout(id) : clearInterval(id)); this._timers.length = 0; }

    _shiftTo(value, { ignite } = {}) {
      this._clearAll();
      this._value = value;
      const chars = this._normalize(value);
      this._emit('meter:shift', { to: value });
      if (this._rm) { chars.forEach((c, i) => this._setTube(this._tubes[i], c)); this._announce(value); return; }
      let acc = 0;
      this._tubes.forEach((tube, i) => {
        const target = chars[i];
        if (i === DOT_INDEX) { this._timers.push(setTimeout(() => this._setTube(tube, '.'), 30)); return; }
        const lockAt = (ignite ? 560 : 340) + acc;
        acc += 40 + Math.random() * 50;
        const stepMs = 45 + Math.random() * 25;
        const iv = setInterval(() => this._setTube(tube, DIGITS[Math.floor(Math.random() * 10)]), stepMs);
        this._timers.push(iv);
        const t = setTimeout(() => {
          clearInterval(iv);
          this._setTube(tube, target);
          tube.classList.add('is-pulse');
          this._timers.push(setTimeout(() => tube.classList.remove('is-pulse'), 120));
          if (i === this._tubes.length - 1) { this._announce(value); this._emit('meter:locked', { value }); }
        }, lockAt);
        this._timers.push(t);
      });
    }

    _ignite(value) {
      this._clearAll();
      this._tubes.forEach(t => t.classList.add('is-off'));
      this._timers.push(setTimeout(() => this._shiftTo(value, { ignite: true }), 120));
    }

    _fail() {
      this._clearAll();
      this._panel.classList.add('is-fail');
      this._tubes.forEach((tube, i) => {
        if (i === DOT_INDEX) { this._setTube(tube, '.'); return; }
        const iv = setInterval(() => this._setTube(tube, Math.random() < .5 ? '?' : DIGITS[Math.floor(Math.random() * 10)]), 60);
        this._timers.push(iv);
      });
      this._timers.push(setTimeout(() => {
        this._clearAll();
        this._panel.classList.remove('is-fail');
        this._normalize('-.------').forEach((c, i) => this._setTube(this._tubes[i], c));
        this._value = '-.------';
        this._emit('meter:fail', { value: '-.------' });
      }, 4000));
    }

    _clockChars() {
      const d = new Date(), p = n => String(n).padStart(2, '0');
      return [p(d.getHours())[0], '.', p(d.getHours())[1], p(d.getMinutes())[0], p(d.getMinutes())[1], p(d.getSeconds())[0], p(d.getSeconds())[1], ' '];
    }
    _startClock() {
      this._stopClock();
      const tick = () => this._clockChars().forEach((ch, i) => this._setTube(this._tubes[i], ch));
      tick();
      this._clockTimer = setInterval(tick, 1000);
    }
    _stopClock() { clearInterval(this._clockTimer); this._clockTimer = null; }
  }

  customElements.define('sg-nixie', SgNixie);
})();
