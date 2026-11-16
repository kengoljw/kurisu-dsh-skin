const r=require("<workspace>\\kurisu-skin\\research\\asar-extract\\tokens.json");
const dp=r.bySheet.design_platform;
const names=Object.keys(dp.light).filter(n=>n.startsWith("--dsw-alias-")||n.startsWith("--dsw-specific-")).sort();
for(const n of names){ console.log(n+"  |  L="+(dp.light[n]??"-")+"  |  D="+(dp.dark[n]??"(inherit)")); }
console.log("count",names.length);
