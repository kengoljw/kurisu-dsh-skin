// Independent post-apply check: the LOADING_STYLE bytes now inside app.asar
// must be byte-identical to the payload that passed the browser E2E harness.
import fs from 'node:fs';
import { buildLoadingStyle } from './payload.mjs';

const ASAR = '<install>\AppData\\Local\\Programs\\DSH NEXT\\resources\\app.asar';
const fd = fs.openSync(ASAR, 'r');
const h = Buffer.alloc(16);
fs.readSync(fd, h, 0, 16, 0);
const headerSize = h.readUInt32LE(4);
const jsonSize = h.readUInt32LE(12);
const hb = Buffer.alloc(jsonSize);
fs.readSync(fd, hb, 0, jsonSize, 16);
const hdr = JSON.parse(hb.toString('utf8'));
const e = hdr.files.lib.files['web-document.js'];
const base = 8 + headerSize;
const buf = Buffer.alloc(Number(e.size));
fs.readSync(fd, buf, 0, buf.length, base + Number(e.offset));
const stat = fs.fstatSync(fd);
fs.closeSync(fd);

const src = buf.toString('utf8');
const marker = 'const LOADING_STYLE = ';
const i = src.indexOf(marker);
const start = i + marker.length;
let j = start + 1;
for (; j < src.length; j++) {
  if (src[j] === '\\') { j++; continue; }
  if (src[j] === '"') { j++; break; }
}
const applied = JSON.parse(src.slice(start, j));
const expected = buildLoadingStyle();
const same = applied === expected;
console.log('app.asar size          : ' + stat.size + ' (was 180923876, delta ' + (stat.size - 180923876) + ')');
console.log('entry offset / size    : ' + e.offset + ' / ' + e.size);
console.log('entry integrity        : ' + ('integrity' in e ? 'PRESENT (bad)' : 'dropped (good)'));
console.log('preamble               : ' + h.toString('hex'));
console.log('applied LOADING_STYLE  : ' + Buffer.byteLength(applied) + ' bytes');
console.log('tested  LOADING_STYLE  : ' + Buffer.byteLength(expected) + ' bytes');
console.log('BYTE-IDENTICAL         : ' + same);
if (!same) process.exitCode = 1;
