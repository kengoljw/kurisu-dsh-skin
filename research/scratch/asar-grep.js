// Search a literal string in selected asar entries (no deps).
// Usage: node asar-grep.js <asar> <substring> <pathFilter> <maxHits>
const fs = require('fs');
const asarPath = process.argv[2];
const needle = process.argv[3];
const filter = (process.argv[4] || '').toLowerCase();
const maxHits = parseInt(process.argv[5] || '40', 10);
const fd = fs.openSync(asarPath, 'r');
const head = Buffer.alloc(16);
fs.readSync(fd, head, 0, 16, 0);
const jsonLen = head.readUInt32LE(12);
const hb = Buffer.alloc(jsonLen);
fs.readSync(fd, hb, 0, jsonLen, 16);
const header = JSON.parse(hb.toString('utf8'));
const pad = (4 - (jsonLen % 4)) % 4;
const dataStart = 16 + jsonLen + pad;
const files = [];
(function walk(n, p) {
  if (!n || !n.files) return;
  for (const [k, v] of Object.entries(n.files)) {
    const q = p ? p + '/' + k : k;
    if (v.files) walk(v, q);
    else files.push({ p: q, size: v.size || 0, offset: v.offset, unpacked: !!v.unpacked });
  }
})(header, '');
let hits = 0, scanned = 0;
for (const e of files) {
  if (!e.p.toLowerCase().includes(filter)) continue;
  if (!/\.(js|mjs|cjs|ts|json|yml|css|html)$/i.test(e.p)) continue;
  if (e.size > 3e6) continue;
  let buf;
  try {
    if (e.unpacked) buf = fs.readFileSync(asarPath + '.unpacked/' + e.p);
    else { buf = Buffer.alloc(e.size); fs.readSync(fd, buf, 0, e.size, dataStart + Number(e.offset)); }
  } catch { continue; }
  scanned++;
  const text = buf.toString('utf8');
  let i = text.indexOf(needle);
  while (i >= 0 && hits < maxHits) {
    const line = text.slice(0, i).split('\n').length;
    const start = Math.max(0, i - 100);
    console.log(`${e.p}:${line}: ...${text.slice(start, i + 140).replace(/\n/g, '\\n')}...`);
    hits++;
    i = text.indexOf(needle, i + needle.length);
  }
  if (hits >= maxHits) break;
}
console.error(`scanned=${scanned} hits=${hits}`);
fs.closeSync(fd);
