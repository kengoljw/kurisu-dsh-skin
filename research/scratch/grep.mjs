// Line-number grep that tolerates NUL bytes / very long lines (ripgrep skips these).
// Usage: node grep.mjs <rootDir> <needle|regex> [ext=.js] [regex|literal] [ctx=160] [maxLines=400]
import fs from 'node:fs';
import path from 'node:path';
const root = process.argv[2];
const needle = process.argv[3];
const ext = process.argv[4] || '.js';
const isRegex = process.argv[5] === 'regex';
const ctx = parseInt(process.argv[6] || '160', 10);
const maxLines = parseInt(process.argv[7] || '400', 10);
const re = isRegex ? new RegExp(needle, 'g') : null;
function walk(d, cb) {
  const st = fs.statSync(d);
  if (st.isFile()) { cb(d); return; }
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, cb); else cb(p);
  }
}
let total = 0, files = 0;
walk(root, (p) => {
  const isDir = fs.existsSync(p) && fs.statSync(p).isDirectory();
  if (isDir) return;
  const eff = ext === '.*' ? true : p.endsWith(ext);
  if (!eff) return;
  let txt;
  try { txt = fs.readFileSync(p, 'utf8'); } catch { return; }
  const lines = txt.split('\n');
  let fileHits = 0;
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i].replace(/\0/g, '');
    let idx = -1, matchLen = needle.length;
    if (re) { re.lastIndex = 0; const m = re.exec(L); if (m) { idx = m.index; matchLen = m[0].length; } }
    else idx = L.indexOf(needle);
    if (idx >= 0) {
      const s = Math.max(0, idx - ctx), e = Math.min(L.length, idx + matchLen + ctx);
      console.log(`${p}:${i + 1}: ${L.slice(s, e)}`);
      total++; fileHits++;
      if (total >= maxLines) { console.error('MAX LINES REACHED'); return; }
    }
  }
  if (fileHits) files++;
});
console.error(`--- matching lines=${total} files=${files}`);
