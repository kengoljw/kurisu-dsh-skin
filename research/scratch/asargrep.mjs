// Search text files INSIDE the asar for a literal needle (tolerates NUL bytes).
// node asargrep.mjs <needle> [caseInsensitive=i] [maxHits=40] [extFilter=.js|.css|.json|...|*]
import fs from 'node:fs';
import path from 'node:path';
const asar = '<install>\AppData\\Local\\Programs\\DSH NEXT\\resources\\app.asar';
const unpackedRoot = asar + '.unpacked';
const buf = fs.readFileSync(asar);
const headerLen = buf.readUInt32LE(12);
const header = JSON.parse(buf.subarray(16, 16 + headerLen).toString('utf8').replace(/\0+$/, ''));
const dataBase = 16 + headerLen + ((4 - (headerLen % 4)) % 4);
const files = [];
function walk(node, prefix) {
  for (const [name, child] of Object.entries(node.files ?? {})) {
    const full = prefix ? `${prefix}/${name}` : name;
    if (child.files) walk(child, full);
    else files.push({ path: full, size: child.size, offset: Number(child.offset ?? 0), unpacked: !!child.unpacked });
  }
}
walk(header, '');
const needle = process.argv[2];
const ci = process.argv[3] === 'i';
const maxHits = parseInt(process.argv[4] || '40', 10);
const extFilter = process.argv[5] || '';
const nLow = needle.toLowerCase();
let hits = 0, fileHits = 0;
for (const f of files) {
  if (f.size > 8_000_000) continue;
  if (extFilter && extFilter !== '*' && !f.path.toLowerCase().endsWith(extFilter.toLowerCase())) continue;
  if (!extFilter && !/\.(js|mjs|cjs|css|json|ya?ml|ts|html|md|txt)$/i.test(f.path)) continue;
  let txt;
  try {
    const raw = f.unpacked ? fs.readFileSync(path.join(unpackedRoot, f.path.split('/').join(path.sep))) : buf.subarray(dataBase + f.offset, dataBase + f.offset + f.size);
    txt = raw.toString('utf8');
  } catch { continue; }
  const lines = txt.split('\n');
  let fh = 0;
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i].replace(/\0/g, '');
    const idx = ci ? L.toLowerCase().indexOf(nLow) : L.indexOf(needle);
    if (idx >= 0) {
      const s = Math.max(0, idx - 110), e = Math.min(L.length, idx + needle.length + 110);
      console.log(`${f.path}:${i + 1}: ${L.slice(s, e)}`);
      hits++; fh++;
      if (hits >= maxHits) break;
    }
  }
  if (fh) fileHits++;
  if (hits >= maxHits) { console.error(`MAX HITS ${maxHits} (files hit=${fileHits})`); break; }
}
console.error(`--- hits=${hits} filesHit=${fileHits} scannedEntries=${files.length}`);
