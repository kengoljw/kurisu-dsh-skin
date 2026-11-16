import fs from 'node:fs';

const file = '<install>\AppData\\Local\\Programs\\DSH NEXT\\resources\\app.asar';
const buf = fs.readFileSync(file);
for (const needle of ['role: "reload"', "role: 'reload'", '重新加载', 'Reload Window', 'reload-window']) {
  let at = buf.indexOf(Buffer.from(needle, 'utf8'));
  let n = 0;
  while (at >= 0 && n < 3) {
    const start = Math.max(0, at - 260);
    const end = Math.min(buf.length, at + needle.length + 260);
    console.log(`\n=== ${needle} @ ${at} ===\n` + buf.subarray(start, end).toString('utf8').replace(/\n/g, ' '));
    at = buf.indexOf(Buffer.from(needle, 'utf8'), at + 1);
    n += 1;
  }
}
