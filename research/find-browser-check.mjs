import fs from 'node:fs';

const file = '<install>\AppData\\Local\\Programs\\DSH NEXT\\resources\\app.asar';
const buf = fs.readFileSync(file);
const needles = ['Browser access is disabled', 'browserAccess', 'browser-access'];
for (const needle of needles) {
  let at = buf.indexOf(Buffer.from(needle, 'utf8'));
  let n = 0;
  while (at >= 0 && n < 4) {
    const start = Math.max(0, at - 600);
    const end = Math.min(buf.length, at + needle.length + 600);
    console.log(`\n=== ${needle} @ ${at} ===\n` + buf.subarray(start, end).toString('utf8'));
    at = buf.indexOf(Buffer.from(needle, 'utf8'), at + 1);
    n += 1;
  }
}
