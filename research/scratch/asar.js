// Minimal asar reader (no external deps). Node >= 14.
// Layout detected on this build:
//   [0..3]  uint32 = 4
//   [4..7]  uint32 = outer payload size
//   [8..11] uint32 = inner pickle payload size (= 4 + jsonLen + pad)
//   [12..15] uint32 = jsonLen
//   [16..]  UTF-8 JSON header (padded to 4 bytes)
//   dataStart = 16 + jsonLen + pad
// Modes:
//   node asar.js <asar> list  [substringFilter] [maxRows]
//   node asar.js <asar> cat   <innerPath>
//   node asar.js <asar> save  <innerPath> <outFile>
//   node asar.js <asar> saveall <outDir> [substringFilter]
const fs = require('fs');
const path = require('path');

const asarPath = process.argv[2];
const cmd = (process.argv[3] || 'list').toLowerCase();
const a4 = process.argv[4];
const a5 = process.argv[5];

const fd = fs.openSync(asarPath, 'r');
const head = Buffer.alloc(16);
fs.readSync(fd, head, 0, 16, 0);
const jsonLen = head.readUInt32LE(12);
const headerBuf = Buffer.alloc(jsonLen);
fs.readSync(fd, headerBuf, 0, jsonLen, 16);
const header = JSON.parse(headerBuf.toString('utf8'));
const pad = (4 - (jsonLen % 4)) % 4;
const dataStart = 16 + jsonLen + pad;

function walk(node, prefix, out) {
  if (!node || !node.files) return;
  for (const [name, child] of Object.entries(node.files)) {
    const p = prefix ? prefix + '/' + name : name;
    if (child.files) walk(child, p, out);
    else out.push({ p, size: child.size || 0, offset: child.offset, unpacked: !!child.unpacked, link: child.link });
  }
}
const files = [];
walk(header, '', files);

function readEntry(e) {
  if (e.unpacked) return fs.readFileSync(path.join(asarPath + '.unpacked', e.p));
  const b = Buffer.alloc(e.size);
  if (e.size) fs.readSync(fd, b, 0, e.size, dataStart + Number(e.offset));
  return b;
}

if (cmd === 'list') {
  const f = a4 ? a4.toLowerCase() : null;
  const max = a5 ? parseInt(a5, 10) : 1e9;
  const rows = files.filter((x) => !f || x.p.toLowerCase().includes(f)).sort((a, b) => a.p.localeCompare(b.p));
  rows.slice(0, max).forEach((x) => console.log((x.unpacked ? 'U ' : '  ') + String(x.size).padStart(9) + '  ' + x.p));
  console.error(`--- entries=${files.length} shown=${Math.min(rows.length, max)} jsonLen=${jsonLen} dataStart=${dataStart}`);
} else if (cmd === 'cat') {
  const e = files.find((x) => x.p === a4);
  if (!e) { console.error('NOT FOUND: ' + a4); process.exit(2); }
  process.stdout.write(readEntry(e));
} else if (cmd === 'save') {
  const e = files.find((x) => x.p === a4);
  if (!e) { console.error('NOT FOUND: ' + a4); process.exit(2); }
  fs.mkdirSync(path.dirname(a5), { recursive: true });
  fs.writeFileSync(a5, readEntry(e));
  console.log('wrote ' + a5 + ' (' + e.size + ' bytes)');
} else if (cmd === 'saveall') {
  const outDir = a4;
  const f = a5 ? a5.toLowerCase() : null;
  let n = 0;
  for (const e of files) {
    if (f && !e.p.toLowerCase().includes(f)) continue;
    const dest = path.join(outDir, e.p);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, readEntry(e));
    n++;
  }
  console.log('extracted ' + n + ' files to ' + outDir);
}
fs.closeSync(fd);
