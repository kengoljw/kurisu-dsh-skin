import fs from "node:fs";
const p = "<workspace>\\kurisu-skin\\research\\asar-extract\\node_modules\\@deepseek-ai\\dsh-client-ui-slots\\lib\\index.js";
const src = fs.readFileSync(p, "utf8");
const out = src + "\nglobalThis.__SlotCore = SlotCore;\n";
const t = "<workspace>\\kurisu-skin\\research\\scratch\\slots.test.mjs";
fs.writeFileSync(t, out);
await import("file:///<workspace>/kurisu-skin/research/scratch/slots.test.mjs");
const Core = globalThis.__SlotCore;
console.log("SlotCore:", typeof Core);
const core = new Core();
core.register({ name: "root", children: { "conversation.hero.brand.mark": { kind: "single", scope: "root" } } }, () => null);
core.register({ name: "conversation.hero.brand.mark", id: "official", priority: 0 }, () => "FISH");
core.register({ name: "conversation.hero.brand.mark", id: "kurisu-hero-brand-mark", priority: -10 }, () => "AMADEUS");
console.log("winners:", core.entriesOfSlot("conversation.hero.brand.mark").map(h => h.options.id + "@" + h.options.priority));
try { core.register({ name: "conversation.hero.brand.mark", id: "dup", priority: -10 }, () => "X"); console.log("dup: NO THROW"); }
catch (e) { console.log("dup throws (guarded by try/catch):", String(e.message).slice(0, 70)); }