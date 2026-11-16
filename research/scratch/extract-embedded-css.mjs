// Extract shipped CSS that is embedded as JS string literals inside the
// dsh-client-ui-* bundles, plus the CSS-module class maps. Produces readable,
// line-numbered .css files under research\embedded-css\ so selectors can be quoted.
import fs from 'node:fs';
import path from 'node:path';
const src = '<workspace>\\kurisu-skin\\research\\asar-extract\\node_modules\\@deepseek-ai';
const out = '<workspace>\\kurisu-skin\\research\\embedded-css';
fs.mkdirSync(out, { recursive: true });

function walk(d, cb) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, cb); else cb(p);
  }
}
function fmt(css) {
  return css.replace(/\}/g, '}\n').replace(/;/g, ';\n  ').replace(/\n\s*\n/g, '\n');
}
const summary = [];
const classmaps = [];
walk(src, (p) => {
  if (!p.endsWith('.js')) return;
  let txt;
  try { txt = fs.readFileSync(p, 'utf8'); } catch { return; }
  const rel = path.relative(src, p).replace(/[\\/]/g, '__').replace(/\.js$/, '');
  // 1) CSS-module class maps:  Xxx_module_css_default = { "frame": "MnhYfG_frame", ... }
  const mapRe = /(\w+_module_css_default)\s*=\s*\{([\s\S]*?)\}/g;
  let m;
  while ((m = mapRe.exec(txt))) {
    const flat = m[2].replace(/\s+/g, ' ').trim();
    classmaps.push(`### ${rel}\n${m[1]} = { ${flat} }\n`);
  }
  // 2) All double-quoted / backtick string literals that look like CSS
  const strRe = /"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;
  let n = 0, cssChunks = [];
  while ((m = strRe.exec(txt))) {
    let val;
    try { val = JSON.parse('"' + (m[1] ?? m[2]).replace(/\n/g, '\\n') + '"'); } catch { continue; }
    if (val.length < 20 || !val.includes('{')) continue;
    const trimmed = val.trimStart();
    if (!/^[.@\[:#*a-zA-Z]/.test(trimmed)) continue;              // selector-ish start
    if (!/\}/.test(val)) continue;                                   // has a rule close
    if (/function|=>|return|className|createElement/.test(val.slice(0, 40))) continue;
    cssChunks.push(val); n++;
  }
  if (n) {
    const dest = path.join(out, rel + '.css');
    const body = cssChunks.map((c, i) => `/* === chunk ${i + 1} (JS string literal) === */\n` + fmt(c)).join('\n\n');
    fs.writeFileSync(dest, body);
    summary.push(`${rel}: ${n} css string(s) -> ${path.basename(dest)}`);
  }
});
fs.writeFileSync(path.join(out, '_CLASSMAPS.txt'), classmaps.join('\n'));
fs.writeFileSync(path.join(out, '_SUMMARY.txt'), summary.join('\n'));
console.log(summary.join('\n'));
console.log('\nclassmaps:', classmaps.length, '-> _CLASSMAPS.txt');
