// Extract requested dsh-client-ui* packages from app.asar into research\asar-extract\.
// Reuses the 16-byte preamble parsing pattern from find-browser-check.mjs / extract-css.mjs.
// Usage: node extract-packages.mjs [--extract]
import fs from 'node:fs';
import path from 'node:path';

const asar = '<install>\AppData\\Local\\Programs\\DSH NEXT\\resources\\app.asar';
const unpackedRoot = asar + '.unpacked';
const out = '<workspace>\\kurisu-skin\\research\\asar-extract';
const doExtract = process.argv.includes('--extract');

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

const wanted = [
  'dsh-client-ui-layout',
  'dsh-client-ui-dockkit',
  'dsh-client-ui-conversation',
  'dsh-client-ui-session',
  'dsh-client-ui-renderer',
  'dsh-client-ui-primitives',
  'dsh-client-ui-slots',
  'dsh-client-ui-sidebar',
  'dsh-client-ui-settings',
  'dsh-client-ui-components',
];

console.log('total entries:', files.length, 'dataBase:', dataBase);

const report = {};
for (const pkg of wanted) {
  // match an inner path that contains a node_modules/<pkg>/ or node_modules/@deepseek-ai/<pkg>/ segment
  const re = new RegExp(`(^|/)node_modules/(?:@deepseek-ai/)?${pkg}/`);
  const matches = files.filter(f => re.test(f.path));
  const hasPkgJson = matches.some(f => f.path.endsWith(`/${pkg}/package.json`));
  report[pkg] = { exists: matches.length > 0, hasPkgJson, count: matches.length };
  console.log(`\n### ${pkg}: ${matches.length > 0 ? 'EXISTS' : 'MISSING'} (files=${matches.length}, package.json=${hasPkgJson})`);
  // show the distinct top-level inner roots
  const roots = [...new Set(matches.map(f => {
    const i = f.path.indexOf('node_modules/');
    const parts = f.path.slice(i).split('/');
    return parts.slice(0, parts[0] === '@deepseek-ai' ? 3 : 2).join('/');
  }))];
  roots.forEach(r => console.log('   root:', r));
  // show js/css files (names only) up to 60
  matches.filter(f => /\.(js|mjs|cjs|css|json)$/i.test(f.path)).slice(0, 60).forEach(f => console.log('   ', String(f.size).padStart(9), f.path.replace(/^.*node_modules\//, '')));
  if (matches.length > 60) console.log('    ... and', matches.length - 60, 'more');

  if (doExtract && matches.length) {
    for (const f of matches) {
      const dest = path.join(out, f.path.split('/').join(path.sep));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      let data;
      if (f.unpacked) {
        const up = path.join(unpackedRoot, f.path.split('/').join(path.sep));
        data = fs.readFileSync(up);
      } else {
        const start = dataBase + f.offset;
        data = buf.subarray(start, start + f.size);
      }
      fs.writeFileSync(dest, data);
    }
  }
}
console.log('\n=== SUMMARY ===');
console.log(JSON.stringify(report, null, 2));
