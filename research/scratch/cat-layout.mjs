import fs from 'node:fs';
const file='<install>\AppData\\Local\\Programs\\DSH NEXT\\resources\\app.asar';
const buf=fs.readFileSync(file);
const sz=buf.readUInt32LE(12); const hdr=JSON.parse(buf.subarray(16,16+sz).toString('utf8'));
const base=16+sz;
function get(p){ let n=hdr; for(const part of p.split('/')){ n=n.files[part]; if(!n) return null; } if(n.files) return null; return buf.subarray(base+Number(n.offset), base+Number(n.offset)+n.size).toString('utf8'); }
const src=get('node_modules/@deepseek-ai/dsh-client-ui-layout/lib/client.js');
const i=src.indexOf('centerCol');
console.log(src.slice(i-2600, i+1400));