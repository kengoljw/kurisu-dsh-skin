// Replaces the .ks-nixie block with the 10-layer cathode implementation drawn
// from the supplied Steins;Gate asset pack (refined palette, elliptical glass,
// wider socket, depth-scaled cathodes, per-tube flicker phase).
import fs from 'node:fs';

const f = '<workspace>\\kurisu-skin\\src\\client.template.js';
let t = fs.readFileSync(f, 'utf8');

const START = '/* ===== nixie tubes ======================================================= */';
const END = '/* the sidebar footer readout: same tubes, compact */';
const s = t.indexOf(START);
const e = t.indexOf(END, s);
if (s < 0 || e < 0) throw new Error('markers not found');

const block = `/* ===== nixie tubes ======================================================= */
/* Structure per tube (all cathodes present, exactly one lit) — this is what
   makes it read as a real nixie rather than "a glowing digit":
     .ks-nixie
       .ks-nixie-glass      elliptical glass envelope + specular highlight
       .ks-nixie-cathodes   10 stacked digit cathodes, grid-area 1/1
       .ks-nixie-socket     metal base, slightly wider than the glass
   Palette taken from the Steins;Gate reference pack:
   core #ffe9c4 · main #ffa028 · halo #ff7a00 · unlit cathode rgba(70,42,16,.55) */
.ks-nixie {
  --ks-nx-w: 34px;
  --ks-nx-h: 86px;
  --ks-nx-core: #ffe9c4;
  --ks-nx-main: #ffa028;
  --ks-nx-halo: #ff7a00;
  --ks-nx-off: rgba(70, 42, 16, .55);
  position: relative;
  display: inline-block;
  flex: none;
  width: var(--ks-nx-w);
  height: var(--ks-nx-h);
  font-size: 0;
  line-height: 0;
}
.ks-nixie-glass {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: calc(var(--ks-nx-w) * .78);
  height: calc(var(--ks-nx-h) * .80);
  border-radius: calc(var(--ks-nx-w) * .34) / calc(var(--ks-nx-w) * .40);
  background: linear-gradient(100deg,
    rgba(255, 255, 255, .10) 0%,
    rgba(255, 255, 255, .02) 18%,
    transparent 40%,
    transparent 70%,
    rgba(255, 160, 60, .05) 100%);
  box-shadow:
    inset 0 0 14px rgba(0, 0, 0, .55),
    inset 2px 0 4px rgba(255, 255, 255, .06),
    inset -3px 0 8px rgba(255, 122, 0, .10),
    0 0 26px rgba(255, 122, 0, .05);
  border: 1px solid rgba(255, 255, 255, .07);
  overflow: hidden;
}
.ks-nixie-glass::before {
  content: "";
  position: absolute;
  top: 6%;
  left: 12%;
  width: 30%;
  height: 10%;
  border-radius: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, .22), transparent);
  filter: blur(1px);
}
.ks-nixie-cathodes {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: calc(var(--ks-nx-w) * .78);
  height: calc(var(--ks-nx-h) * .80);
  display: grid;
  place-items: center;
  overflow: hidden;
}
.ks-nixie-cathodes > span {
  grid-area: 1 / 1;
  font-family: "Cascadia Code", "JetBrains Mono", Consolas, monospace;
  font-weight: 500;
  font-size: calc(var(--ks-nx-w) * 1.14);
  line-height: 1;
  color: var(--ks-nx-off);
  -webkit-text-stroke: .4px rgba(70, 42, 16, .32);
  transform: translateY(1%);
  transition: color .1s linear;
}
.ks-nixie-cathodes > span.lit {
  color: var(--ks-nx-core);
  -webkit-text-stroke: 0;
  text-shadow:
    0 0 2px #ffd28f,
    0 0 8px var(--ks-nx-main),
    0 0 18px var(--ks-nx-halo),
    0 0 42px rgba(255, 122, 0, .55);
  animation: ks-nx-flicker 7s infinite;
}
/* deeper cathodes sit marginally smaller, faking the stack depth */
.ks-nixie-cathodes > span:nth-child(1) { transform: translateY(1%) scale(1); }
.ks-nixie-cathodes > span:nth-child(2) { transform: translateY(1%) scale(.995); }
.ks-nixie-cathodes > span:nth-child(3) { transform: translateY(1%) scale(.99); }
.ks-nixie-cathodes > span:nth-child(4) { transform: translateY(1%) scale(.985); }
.ks-nixie-cathodes > span:nth-child(5) { transform: translateY(1%) scale(.98); }
.ks-nixie-cathodes > span:nth-child(6) { transform: translateY(1%) scale(.975); }
.ks-nixie-cathodes > span:nth-child(7) { transform: translateY(1%) scale(.97); }
.ks-nixie-cathodes > span:nth-child(8) { transform: translateY(1%) scale(.965); }
.ks-nixie-cathodes > span:nth-child(9) { transform: translateY(1%) scale(.96); }
.ks-nixie-cathodes > span:nth-child(10) { transform: translateY(1%) scale(.955); }
@keyframes ks-nx-flicker {
  0%, 91%, 93%, 96%, 100% { opacity: 1; }
  92% { opacity: .78; }
  95% { opacity: .88; }
}
.ks-nixie-socket {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: var(--ks-nx-w);
  height: calc(var(--ks-nx-h) * .20);
  border-radius: 2px;
  background: linear-gradient(180deg, #39424d, #1a1f26 70%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .12),
    0 3px 6px rgba(0, 0, 0, .6);
}

`;

t = t.slice(0, s) + block + t.slice(e);
fs.writeFileSync(f, t, 'utf8');
console.log('nixie block replaced;', block.length, 'chars');
