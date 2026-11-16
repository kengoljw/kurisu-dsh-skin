// Tiny asar reader: list / read / grep entries inside the shipped app.asar so a
// skin can be matched against the classes the running build actually uses.
// Read-only: never writes to the archive.
import fs from 'node:fs';

const ASAR = '<install>\AppData\\Local\\Programs\\DSH NEXT\\resources\\app.asar';

function open() {
  const fd = fs.openSync(ASAR, 'r');
  const head = Buffer.alloc(16);
  fs.readSync(fd, head, 0, 16, 0);
  const headerSize = head.readUInt32LE(4);
  const jsonSize = head.readUInt32LE(12);
  const buf = Buffer.alloc(jsonSize);
  fs.readSync(fd, buf, 0, jsonSize, 16);
  return { fd, header: JSON.parse(buf.toString('utf8')), base: 8 + headerSize };
}

const { fd, header, base } = open();

function walk(node, prefix, out) {
  for (const [name, v] of Object.entries(node.files || {})) {
    const full = prefix ? prefix + '/' + name : name;
    if (v.files) walk(v, full, out);
    else out.push({ path: full, size: v.size, offset: Number(v.offset) });
  }
  return out;
}
const entries = walk(header, '', []);
const byPath = new Map(entries.map((e) => [e.path, e]));

function readText(p) {
  const e = byPath.get(p);
  if (!e || Number.isNaN(e.offset)) return null;
  const b = Buffer.alloc(e.size);
  fs.readSync(fd, b, 0, e.size, base + e.offset);
  return b.toString('utf8');
}

const mode = process.argv[2];
if (mode === 'list') {
  const pat = new RegExp(process.argv[3] || '.', 'i');
  entries.filter((e) => pat.test(e.path)).forEach((e) => console.log(e.size + '\t' + e.path));
} else if (mode === 'grep') {
  const filePat = new RegExp(process.argv[3], 'i');
  const textPat = new RegExp(process.argv[4], 'g');
  let hits = 0;
  for (const e of entries.filter((x) => filePat.test(x.path))) {
    const text = readText(e.path);
    if (!text) continue;
    const found = text.match(textPat);
    if (found) {
      const uniq = [...new Set(found)].slice(0, 12);
      console.log(e.path + '  ->  ' + uniq.join(' | '));
      hits += 1;
    }
  }
  if (!hits) console.log('(no match)');
} else if (mode === 'read') {
  const text = readText(process.argv[3]);
  if (text === null) { console.log('(missing) ' + process.argv[3]); process.exit(1); }
  const max = Number(process.argv[4] || 4000);
  console.log(text.slice(0, max));
}
fs.closeSync(fd);
