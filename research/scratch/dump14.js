const r = require('<workspace>\\kurisu-skin\\research\\asar-extract\\tokens.json');
const dp = r.bySheet.design_platform;
const names = ["--dsw-alias-bg-base","--dsw-alias-bg-layer-1","--dsw-alias-bg-layer-2","--dsw-alias-bg-overlay","--dsw-alias-border-l1","--dsw-alias-border-l2","--dsw-alias-brand-primary","--dsw-alias-label-primary","--dsw-alias-label-secondary","--dsw-alias-state-error-primary","--dsw-alias-state-idle-primary","--dsw-alias-state-success-primary","--dsw-alias-state-warn-primary","--dsw-specific-sidebar-fill"];
for (const n of names) console.log(`${n}\n   light: ${dp.light[n]}\n   dark : ${dp.dark[n]}`);
const all = r.allTokens.filter(t => t.startsWith('--dsw-alias-') || t.startsWith('--dsw-specific-'));
console.log('\nALIAS/SPECIFIC (' + all.length + '):');
console.log(all.join('\n'));
