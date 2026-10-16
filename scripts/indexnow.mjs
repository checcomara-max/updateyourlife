#!/usr/bin/env node
// Notifica a Bing/Yandex (IndexNow) le pagine HTML modificate. Uso: node scripts/indexnow.mjs <sha-base> [--all]
// Attende che la chiave sia raggiungibile online (= deploy completato) prima di inviare.
import { execFileSync } from 'node:child_process';
import { ROOT, ORIGIN, listHtml, rel, canonicalFor, read, meta } from './lib.mjs';

const KEY = 'ece76cefc93979abc3880df5cc99450c';
const base = process.argv[2];
const all = process.argv.includes('--all');

let files = listHtml();
if (!all && base && !/^0+$/.test(base)) {
  const changed = execFileSync('git', ['diff', '--name-only', base, 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).split('\n');
  files = files.filter((f) => changed.includes(rel(f)));
}
const urls = files.filter((f) => !/noindex/i.test(meta(read(f), 'name', 'robots') || '')).map(canonicalFor);
if (!urls.length) { console.log('Nessuna pagina HTML indicizzabile modificata: niente da inviare.'); process.exit(0); }

const keyUrl = `${ORIGIN}/${KEY}.txt`;
let live = false;
for (let i = 0; i < 40 && !live; i++) {
  try { live = (await (await fetch(keyUrl, { redirect: 'manual' })).text()).trim() === KEY; } catch {}
  if (!live) await new Promise((r) => setTimeout(r, 15000));
}
if (!live) { console.log('Deploy non ancora online dopo 10 minuti: IndexNow non inviato (nessun errore).'); process.exit(0); }

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(ORIGIN).host, key: KEY, keyLocation: keyUrl, urlList: urls }),
});
console.log(`IndexNow: HTTP ${res.status} per ${urls.length} URL`);
urls.forEach((u) => console.log('  ' + u));
process.exit(res.status === 200 || res.status === 202 ? 0 : 1);
