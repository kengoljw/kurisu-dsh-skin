// Relocate the nixie / brand-row CSS out of buildWallCss (where it only existed
// when a wallpaper was applied) into the always-on CSS template.
import fs from 'node:fs';

const f = '<workspace>\\kurisu-skin\\src\\client.template.js';
let t = fs.readFileSync(f, 'utf8');

const START = '/* ===== nixie tubes ======================================================= */';
const END = '@media (max-width: 900px) {';

const s = t.indexOf(START);
const e = t.indexOf(END, s);
if (s < 0 || e < 0) throw new Error('markers not found');
const block = t.slice(s, e);
t = t.slice(0, s) + t.slice(e);

// insert into the CSS template: right before its closing backtick
const cssStart = t.indexOf('const CSS = `');
const cssEnd = t.indexOf('`;', cssStart);
if (cssStart < 0 || cssEnd < 0) throw new Error('css bounds not found');
t = t.slice(0, cssEnd) + '\n' + block + t.slice(cssEnd);

fs.writeFileSync(f, t, 'utf8');
console.log('moved', block.length, 'chars into CSS');
