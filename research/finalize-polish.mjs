// Removes the temporary DOM-diagnostic block and installs the final polish.
import fs from 'node:fs';

const f = '<workspace>\\kurisu-skin\\src\\client.template.js';
let t = fs.readFileSync(f, 'utf8');

// 1) drop the reporter calls inside apply
const calls = `\n\t\t\twindow.setTimeout(ksReport, 2200);\n\t\t\twindow.setTimeout(ksReport, 6000);\n`;
if (!t.includes(calls)) throw new Error('report calls not found');
t = t.replace(calls, '\n');

// 2) drop the whole diagnostics section (everything from its banner to exports)
const banner = '// ------------------------------------------------------------ diagnostics';
const start = t.indexOf(banner);
const end = t.indexOf('exports.apply = apply;', start);
if (start < 0 || end < 0) throw new Error('diagnostics block not found');
t = t.slice(0, start) + t.slice(end);

// 3) bot / agent row glyph: the sidebar agent entry carries data-agent-id; tint
//    only the glyph inside that row so the stock blue avatar joins the palette.
const anchor = '/* 3) Agent-team / bot glyph';
const idx = t.indexOf(anchor);
if (idx < 0) throw new Error('bot glyph anchor missing');
const insertAt = t.indexOf('}', t.indexOf('drop-shadow(0 1px 2px rgba(120, 60, 30, .18));', idx)) + 1;
const extra = `

/* Agent rows carry data-agent-id on the row itself, which is a stable semantic
   hook (the avatar classes are plugin-local). Tint only the glyph inside those
   rows: the stock blue bot avatar joins the Amadeus palette without touching any
   other icon. */
[data-ks-wall="on"] [data-agent-id] svg,
[data-ks-wall="on"] [data-agent-id] img {
  filter: grayscale(.55) sepia(.45) saturate(1.9) hue-rotate(-10deg) brightness(1.04)
    drop-shadow(0 1px 2px rgba(120, 60, 30, .18));
}`;
t = t.slice(0, insertAt) + extra + t.slice(insertAt);

fs.writeFileSync(f, t, 'utf8');
console.log('diagnostics removed, agent-row tint installed');
