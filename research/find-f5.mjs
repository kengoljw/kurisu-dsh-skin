import fs from 'node:fs';
const file = '<install>\AppData\\Local\\Programs\\DSH NEXT\\resources\\app.asar';
const buf = fs.readFileSync(file);
for (const needle of ['"F5"', "'F5'", 'F5', 'reloadIgnoringCache', '.reload()']) {
  let at = buf.indexOf(Buffer.from(needle, 'utf8'));
  let n = 0;
  while (at >= 0 && n < 6) {
    const start = Math.max(0, at - 160);
    const end = Math.min(buf.length, at + needle.length + 160);
    const s = buf.subarray(start, end).toString('utf8').replace(/\n/g, ' ');
    if (needle !== 'F5' || /reload|F5|加速|刷新/i.test(s)) console.log(`\n=== ${needle} @ ${at} ===\n${s}`);
    at = buf.indexOf(Buffer.from(needle, 'utf8'), at + 1);
    n += 1;
  }
}
