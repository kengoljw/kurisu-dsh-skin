import fs from 'node:fs';
import path from 'node:path';

const asar = '<install>\AppData\\Local\\Programs\\DSH NEXT\\resources\\app.asar';
const out = '<workspace>\\kurisu-skin\\research\\frontend-css';
const buf = fs.readFileSync(asar);
const headerLen = buf.readUInt32LE(12);
const header = JSON.parse(buf.subarray(16, 16 + headerLen).toString('utf8').replace(/\0+$/, ''));
const dataBase = 16 + headerLen + ((4 - (headerLen % 4)) % 4);

const files = [];
function walk(node, prefix) {
  for (const [name, child] of Object.entries(node.files ?? {})) {
    const full = prefix ? `${prefix}/${name}` : name;
    if (child.files) walk(child, full);
    else if (/\.css$/i.test(name)) files.push({ path: full, size: child.size, offset: Number(child.offset ?? 0) });
  }
}
walk(header, '');
fs.mkdirSync(out, { recursive: true });
console.log('css files:', files.length);
for (const f of files) {
  const start = dataBase + f.offset;
  const text = buf.subarray(start, start + f.size).toString('utf8');
  const rel = f.path.replace(/[\\/]/g, '__');
  fs.writeFileSync(path.join(out, rel), text);
  const hasBg = /--dsw-alias-bg-base/.test(text);
  const hasBody = /(^|\})\s*(html|body)\s*\{/.test(text);
  console.log(`${hasBg ? 'BG ' : '   '}${hasBody ? 'BODY ' : '     '}${f.size.toString().padStart(9)}  ${f.path}`);
}
