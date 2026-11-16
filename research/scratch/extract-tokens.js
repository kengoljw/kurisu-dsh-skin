// Extract CSS custom-property declarations from the ui-theme token sheets.
// Reads the compiled client.js (esbuild/rolldown inlined CSS strings) and splits
// each sheet's `body{...}` (light) and `body[data-ds-dark-theme]{...}` (dark) blocks.
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(process.argv[2], 'utf8');

// Grab `var <name>_css_default = "<css>";` assignments.
const re = /var\s+([a-z0-9_]+)_css_default\s*=\s*"((?:[^"\\]|\\.)*)";/gi;
const sheets = {};
let m;
while ((m = re.exec(src)) !== null) {
  const name = m[1];
  // unescape the JS string literal
  const css = m[2]
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\');
  sheets[name] = css;
}

function declsIn(css, selector) {
  // find all `<selector>{...}` blocks, flat (no nesting in these sheets)
  const out = {};
  const blockRe = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{([^{}]*)\\}', 'g');
  let b;
  while ((b = blockRe.exec(css)) !== null) {
    for (const decl of b[1].split(';')) {
      const idx = decl.indexOf(':');
      if (idx < 0) continue;
      const k = decl.slice(0, idx).trim();
      const v = decl.slice(idx + 1).trim();
      if (k.startsWith('--')) out[k] = v;
    }
  }
  return out;
}

const report = { sheets: Object.keys(sheets), bySheet: {} };
for (const [name, css] of Object.entries(sheets)) {
  const light = declsIn(css, 'body');
  const dark = declsIn(css, 'body[data-ds-dark-theme]');
  const root = declsIn(css, ':root');
  report.bySheet[name] = {
    lightCount: Object.keys(light).length,
    darkCount: Object.keys(dark).length,
    rootCount: Object.keys(root).length,
    light,
    dark,
    root,
  };
}

// Union of every token name declared anywhere (accepted surface).
const all = new Set();
for (const s of Object.values(report.bySheet)) {
  for (const k of Object.keys(s.light)) all.add(k);
  for (const k of Object.keys(s.dark)) all.add(k);
  for (const k of Object.keys(s.root)) all.add(k);
}
report.allTokens = [...all].sort();
report.counts = {
  total: all.size,
  alias: report.allTokens.filter((t) => t.startsWith('--dsw-alias-')).length,
  specific: report.allTokens.filter((t) => t.startsWith('--dsw-specific-')).length,
  static: report.allTokens.filter((t) => t.startsWith('--dsw-static-')).length,
  dsh: report.allTokens.filter((t) => t.startsWith('--dsh-')).length,
  font: report.allTokens.filter((t) => t.startsWith('--dsw-font')).length,
  shiki: report.allTokens.filter((t) => t.startsWith('--shiki-')).length,
};

fs.mkdirSync(path.dirname(process.argv[3]), { recursive: true });
fs.writeFileSync(process.argv[3], JSON.stringify(report, null, 2));
console.log('sheets:', report.sheets.join(', '));
console.log('counts:', JSON.stringify(report.counts));
