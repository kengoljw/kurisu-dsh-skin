// Global @keyframes inventory + motion-convention counters across all CSS.
import fs from 'node:fs';
import path from 'node:path';
const dirs = [
  '<workspace>\\kurisu-skin\\research\\frontend-css',
  '<workspace>\\kurisu-skin\\research\\embedded-css',
];
function walk(d, cb) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, cb); else if (p.endsWith('.css')) cb(p);
  }
}
const names = new Map();
for (const d of dirs) walk(d, (p) => {
  const txt = fs.readFileSync(p, 'utf8');
  const re = /@(?:-webkit-)?keyframes\s+([\w-]+)/g;
  let m;
  while ((m = re.exec(txt))) {
    const before = txt.slice(0, m.index);
    const line = before.split('\n').length;
    const key = m[1];
    if (!names.has(key)) names.set(key, []);
    names.get(key).push(`${path.basename(p)}:${line}`);
  }
});
console.log('=== ALL @keyframes names (' + names.size + ' distinct) ===');
for (const [name, locs] of [...names].sort((a,b)=>a[0].localeCompare(b[0]))) {
  console.log(`${name.padEnd(34)} ${locs.join(', ')}`);
}
console.log('\n=== motion token usage counts per file ===');
for (const d of dirs) walk(d, (p) => {
  const txt = fs.readFileSync(p, 'utf8');
  const c = (re) => (txt.match(re) || []).length;
  const dur = c(/--ds-transition-duration\b/g);
  const durs = c(/--ds-transition-duration-slow\b/g);
  const ease = c(/--ds-ease-in-out\b/g);
  const trans = c(/transition\s*:/g);
  const hover = c(/:hover\b/g);
  if (dur + durs + ease + trans + hover > 0)
    console.log(`${path.basename(p)}  dur=${dur} durSlow=${durs} easeInOut=${ease} transition=${trans} hover=${hover}`);
});
