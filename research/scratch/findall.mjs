// Global context search in a single (possibly minified one-line) file.
// node findall.mjs <file> <needle> [ctx=90] [max=40]
import fs from 'node:fs';
const file = process.argv[2], needle = process.argv[3];
const ctx = parseInt(process.argv[4] || '90', 10), max = parseInt(process.argv[5] || '40', 10);
const txt = fs.readFileSync(file, 'utf8');
let i = 0, n = 0;
while ((i = txt.indexOf(needle, i)) >= 0 && n < max) {
  console.log(`@${i}: …${txt.slice(Math.max(0, i - ctx), i + needle.length + ctx).replace(/\n/g, ' ')}…`);
  i += needle.length; n++;
}
console.error(`--- ${n} occurrences`);
