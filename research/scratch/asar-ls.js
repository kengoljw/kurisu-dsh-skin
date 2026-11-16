// Minimal asar reader (no deps). Usage:
//   node asar-ls.js <asar> list [prefixFilter]
//   node asar-ls.js <asar> cat <innerPath> [outFile]
//   node asar-ls.js <asar> save <innerPath> <outFile>
const fs = require('fs');
const path = require('path');

const asarPath = process.argv[2];
const cmd = process.argv[3] || 'list';
const arg4 = process.argv[4];
const arg5 = process.argv[5];

const fd = fs.openSync(asarPath, 'r');
const sizeBuf = Buffer.alloc(8);
fs.readSync(fd, sizeBuf, 0, 8, 0);
// asar: 4-byte uint32 = 4 (size of next pickle header), 4-byte uint32 = json byte length
const headerPickleSize = sizeBuf.readUInt32LE(0);
const jsonLen = sizeBuf.readUInt32LE(4);
const headerBuf = Buffer.alloc(jsonLen);
fs.readSync(fd, headerBuf, 0, jsonLen, 8);
const header = JSON.parse(headerBuf.toString('utf8'));
const dataOffset = 8 + headerPickleSize; // 8 + (4 + jsonLen) aligned? see note below

// Standard: 8-byte prefix, then pickle {uint32 size, uint32 jsonLen, json..., padding to 4}
// Chrome pickle aligns to 4 bytes.
const rawPickle = 8 + headerPickleSize;
const dataStart = rawPickle; // headerPickleSize includes the 4-byte length field itself

function walk(node, prefix, out) {
  if (!node) return;
  if (node.files) {
    for (const [name, child] of Object.entries(node.files)) {
      walk(child, prefix ? prefix + '/' + name : name, out);
    }
  } else {
    out.push({ p: prefix, size: node.size || 0, offset: node.offset, unpacked: !!node.unpacked, link: node.link });
  }
}

const files = [];
walk(header, '', files);

if (cmd === 'list') {
  const f = arg4 ? arg4.toLowerCase() : null;
  files
    .filter((x) => !f || x.p.toLowerCase().includes(f))
    .sort((a, b) => a.p.localeCompare(b.p))
    .forEach((x) => console.log((x.unpacked ? 'U ' : '  ') + String(x.size).padStart(9) + '  ' + x.p));
  console.log('--- total entries:', files.length, 'header jsonLen:', jsonLen, 'pickleSize:', headerPickleSize, 'dataStart:', dataStart, 'fileSize:', fs.statSync(asarPath).size);
} else if (cmd === 'cat' || cmd === 'save') {
  const target = files.find((x) => x.p === arg4);
  if (!target) { console.error('NOT FOUND: ' + arg4); process.exit(2); }
  let buf;
  if (target.unpacked) {
    buf = fs.readFileSync(path.join(asarPath + '.unpacked', arg4));
  } else {
    buf = Buffer.alloc(target.size);
    fs.readSync(fd, buf, 0, target.size, dataStart + Number(target.offset));
  }
  if (cmd === 'cat') process.stdout.write(buf);
  else { fs.mkdirSync(path.dirname(arg5), { recursive: true }); fs.writeFileSync(arg5, buf); console.log('wrote', arg5, buf.length); }
}
fs.closeSync(fd);
