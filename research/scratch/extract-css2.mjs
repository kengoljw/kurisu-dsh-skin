// Reliable extraction: emit exactly the `const css… = "...";` CSS-module injection
// strings from one bundle, formatted one declaration block per line.
// node extract-css2.mjs <bundle.js> <out.css>
import fs from 'node:fs';
const src = process.argv[2], out = process.argv[3];
const txt = fs.readFileSync(src, 'utf8');
const re = /\bconst (css[\w$]*) = ("(?:[^"\\]|\\.)*")\s*;/g;
let m, n = 0;
const parts = [];
while ((m = re.exec(txt))) {
  let css;
  try { css = JSON.parse(m[2]); } catch { continue; }
  const line = txt.slice(0, m.index).split('\n').length;
  parts.push(`/* === ${m[1]} @ source line ${line} === */\n` + css.replace(/\}/g, '}\n'));
  n++;
}
fs.writeFileSync(out, parts.join('\n\n'));
console.log(`wrote ${n} css strings -> ${out}`);
