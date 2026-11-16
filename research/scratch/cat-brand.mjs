import fs from 'node:fs';
const file='<install>\AppData\\Local\\Programs\\DSH NEXT\\resources\\app.asar';
const buf=fs.readFileSync(file);
const asarHeader = JSON.parse(buf.subarray(16, 16 + buf.readUInt32LE(12)).toString('utf8'));
const base = 16 + 8;
function get(p){
  let node = asarHeader;
  for(const part of p.split('/')){ node = node.files[part]; if(!node) return null; }
  if(node.files) return null;
  const off = base + Number(node.offset);
  return buf.subarray(off, off + node.size).toString('utf8');
}
const p='node_modules/@deepseek-ai/dsh-client-ui-brand-official/lib/client.js';
const src = get(p);
console.log('exists:', !!src, 'len:', src ? src.length : 0);
if(src) console.log(src.slice(0, 2600));