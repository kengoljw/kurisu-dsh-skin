// Boot-sequence probe collector.
//
// The asar-native + host-injected boot scripts POST a cumulative JSON timeline
// to http://127.0.0.1:8791/report . This listener appends each report as one
// JSON line to kurisu-skin/preview/boot-probe.jsonl, and additionally writes a
// compact human-readable summary (boot-probe-summary.txt) on every flush so the
// actual per-phase wall-clock timings are readable without parsing JSON.
//
// Start with:  node tools/boot-probe-server.mjs
// It binds ONLY 127.0.0.1 and writes only inside this workspace.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..', 'preview', 'boot-probe.jsonl');
const SUMMARY = path.resolve(HERE, '..', 'preview', 'boot-probe-summary.txt');
const PORT = 8791;

function summarise(rep) {
  const ev = Array.isArray(rep.events) ? rep.events : [];
  const lines = [];
  lines.push('=== boot probe ' + new Date().toISOString() + ' ===');
  lines.push('tag=' + (rep.tag || '?') + '  wallpaper=' + (rep.wall || '?') +
    '  light=' + (rep.light || 0) + '  native=' + (rep.native ? 1 : 0) +
    '  typeTimeline=' + (rep.totalTypeSeconds || '?') + 's');
  let prev = null;
  for (const e of ev) {
    const dt = prev === null ? 0 : e.t - prev;
    lines.push('  +' + String(e.t).padStart(7) + 'ms  (+' + String(dt).padStart(5) + 'ms)  ' +
      'p=' + String(e.p).padEnd(6) + ' arc=' + String(e.arc == null ? '-' : e.arc).padEnd(7) +
      ' phase=' + e.phase + '  ' + e.name + (e.extra ? '  [' + e.extra + ']' : ''));
    prev = e.t;
  }
  lines.push('events=' + ev.length + '  total=' + (ev.length ? ev[ev.length - 1].t : 0) + 'ms');
  lines.push('');
  return lines.join('\n');
}

const server = http.createServer((req, res) => {
  // CORS is irrelevant for no-cors POST / sendBeacon, but answering OPTIONS
  // keeps a plain fetch() probe from being rejected outright.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST' || req.url !== '/report') { res.writeHead(404); res.end('not found'); return; }
  const chunks = [];
  let size = 0;
  req.on('data', (c) => { size += c.length; if (size <= 2 * 1024 * 1024) chunks.push(c); });
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');
    try {
      const rep = JSON.parse(body);
      fs.appendFileSync(OUT, JSON.stringify({ receivedAt: Date.now(), ...rep }) + '\n', 'utf8');
      fs.appendFileSync(SUMMARY, summarise(rep), 'utf8');
      console.log('[probe] ' + (rep.tag || '?') + ' events=' + (rep.events || []).length +
        ' wall=' + (rep.wall || '?'));
      res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('ok');
    } catch (e) {
      // Legacy string payload from an older build: keep it, do not lose data.
      fs.appendFileSync(OUT, JSON.stringify({ receivedAt: Date.now(), legacy: body }) + '\n', 'utf8');
      console.log('[probe] legacy payload (' + body.length + ' chars)');
      res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('ok');
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('boot-probe listening on http://127.0.0.1:' + PORT + '/report');
  console.log('jsonl   -> ' + OUT);
  console.log('summary -> ' + SUMMARY);
});
