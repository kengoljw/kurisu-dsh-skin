import fs from 'node:fs';
const file='<install>\AppData\\Local\\Programs\\DSH NEXT\\resources\\app.asar';
const buf=fs.readFileSync(file);
function findAll(needle){
  const b=Buffer.from(needle,'utf8'); const out=[]; let at=buf.indexOf(b);
  while(at>=0 && out.length<12){ out.push(at); at=buf.indexOf(b, at+1); }
  return out;
}
for(const n of ['dsh-client-ui-brand-official','brand-official']){
  const hits=findAll(n); console.log('==',n,hits.length);
  for(const h of hits.slice(0,4)){
    const s=Math.max(0,h-260), e=Math.min(buf.length,h+n.length+260);
    console.log('---@'+h+'---'); console.log(buf.subarray(s,e).toString('utf8').replace(/\n/g,' '));
  }
}