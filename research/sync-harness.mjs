import fs from 'node:fs';
const f = '<workspace>\\kurisu-skin\\preview\\make-dom-harness.mjs';
let t = fs.readFileSync(f, 'utf8');
const pairs = [
  ["bgBase: 'rgba(7,10,18,0.52)', layer1: 'rgba(14,19,30,0.76)', layer2: 'rgba(19,25,38,0.84)'",
   "bgBase: 'rgba(7,10,18,0.46)', layer1: 'rgba(14,19,30,0.50)', layer2: 'rgba(19,25,38,0.58)'"],
  ["sidebar: 'rgba(8,11,19,0.80)'", "sidebar: 'rgba(8,11,19,0.44)'"],
  ["bubble: 'rgba(44,36,50,0.84)'", "bubble: 'rgba(44,36,50,0.58)'"],
  ["code: 'rgba(10,14,24,0.78)'", "code: 'rgba(10,14,24,0.48)'"],
  ["inputMajor: 'rgba(19,25,38,0.84)'", "inputMajor: 'rgba(12,17,27,0.54)'"],
  ["centerScrim: 'rgba(7,10,18,.46)'", "centerScrim: 'rgba(7,10,18,.38)'"],
  ["bgBase: 'rgba(250,246,241,0.46)', layer1: 'rgba(255,252,248,0.82)', layer2: 'rgba(255,253,250,0.88)'",
   "bgBase: 'rgba(250,246,241,0.40)', layer1: 'rgba(255,252,248,0.56)', layer2: 'rgba(255,253,250,0.64)'"],
  ["sidebar: 'rgba(246,240,234,0.82)'", "sidebar: 'rgba(246,240,234,0.50)'"],
  ["bubble: '#f6e5e2'", "bubble: 'rgba(255,238,236,0.62)'"],
  ["code: 'rgba(246,240,234,0.9)'", "code: 'rgba(246,240,234,0.54)'"],
  ["inputMajor: 'rgba(255,253,250,0.88)'", "inputMajor: 'rgba(255,252,248,0.60)'"],
  ["centerScrim: 'rgba(250,246,241,.28)'", "centerScrim: 'rgba(250,246,241,.20)'"]
];
let hit = 0;
const miss = [];
for (const [a, b] of pairs) {
  if (t.includes(a)) { t = t.split(a).join(b); hit++; } else miss.push(a.slice(0, 46));
}
fs.writeFileSync(f, t, 'utf8');
console.log(`replaced ${hit}/${pairs.length}`);
if (miss.length) console.log('MISSING:', miss);
