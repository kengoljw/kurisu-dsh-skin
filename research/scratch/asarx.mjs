// General ESM asar tool. Commands:
//   node asarx.mjs list [substr] [max]
//   node asarx.mjs cat <innerPath>
//   node asarx.mjs save <innerPath> <outFile>
//   node asarx.mjs saveprefix <innerPrefix> <outDir>
//   node asarx.mjs grepall <needle> [extSubstr] [maxHits]   (regex? no: literal)
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
function readEntry(f) {
  if (f.unpacked) return fs.readFileSync(path.join(unpackedRoot, f.path.split('/').join(path.sep)));
  const start = dataBase + f.offset;
  return buf.subarray(start, start + f.size);
}
const cmd = (process.argv[2] || 'list').toLowerCase();
const a3 = process.argv[3], a4 = process.argv[4], a5 = process.argv[5];
if (cmd === 'list') {
  const f = a3 ? a3.toLowerCase() : null;
  const max = a4 ? parseInt(a4, 10) : 1e9;
  const rows = files.filter(x => !f || x.path.toLowerCase().includes(f)).sort((a,b)=>a.path.localeCompare(b.path));
  rows.slice(0, max).forEach(x => console.log((x.unpacked?'U ':'  ') + String(x.size).padStart(9) + '  ' + x.path));
  console.error(`--- matched=${rows.length} shown=${Math.min(rows.length,max)} total=${files.length}`);
} else if (cmd === 'cat') {
  const e = files.find(x => x.path === a3);
  if (!e) { console.error('NOT FOUND: ' + a3); process.exit(2); }
  process.stdout.write(readEntry(e));
} else if (cmd === 'save') {
  const e = files.find(x => x.path === a3);
  if (!e) { console.error('NOT FOUND: ' + a3); process.exit(2); }
  fs.mkdirSync(path.dirname(a4), { recursive: true });
  fs.writeFileSync(a4, readEntry(e));
  console.log('wrote', a4, e.size);
} else if (cmd === 'saveprefix') {
  const pref = a3; const outDir = a4; let n = 0;
  for (const f of files) {
    if (!f.path.startsWith(pref)) continue;
    const dest = path.join(outDir, f.path.split('/').join(path.sep));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, readEntry(f)); n++;
  }
  console.log('extracted', n, 'files to', outDir);
} else if (cmd === 'grepall') {
  const needle = Buffer.from(a3, 'utf8');
  const ext = a4 ? a4.toLowerCase() : null;
  const maxHits = a5 ? parseInt(a5, 10) : 200;
  let hits = 0;
  for (const f of files) {
    if (ext && !f.path.toLowerCase().endsWith(ext)) continue;
    if (!/\.(js|mjs|cjs|css|json|ya?ml|ts|html)$/i.test(f.path)) continue;
    let data;
    try { data = readEntry(f).toString('utf8'); } catch { continue; }
    const idx = data.indexOf(a3);
    if (idx >= 0) {
      console.log(`HIT ${f.path}`);
      console.log('   ...' + data.slice(Math.max(0, idx - 200), idx + needle.length + 200).replace(/\n/g, ' ') + '...');
      hits++;
      if (hits >= maxHits) { console.error('maxHits reached'); break; }
    }
  }
  console.error('--- total hits shown:', hits);
}
