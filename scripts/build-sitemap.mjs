#!/usr/bin/env node
// Rigenera sitemap.xml da tutte le pagine indicizzabili. lastmod = data dell'ultimo commit che ha toccato il file.
// Uso: node scripts/build-sitemap.mjs [--check]   (--check: non scrive, esce con 1 se la sitemap non è allineata)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, listHtml, read, rel, canonicalFor, meta } from './lib.mjs';

function lastmod(file) {
  try {
    const d = execFileSync('git', ['log', '-1', '--format=%cs', '--', rel(file)], { cwd: ROOT, encoding: 'utf8' }).trim();
    if (d) return d;
  } catch {}
  return new Date().toISOString().slice(0, 10);
}

const pages = listHtml().filter((f) => !/noindex/i.test(meta(read(f), 'name', 'robots') || ''));
const weight = (u) => {
  if (u === 'https://www.updateyourlife.it/') return 0;
  if (/privacy|cookie|note-legali/.test(u)) return 9;
  if (u.includes('/approfondimenti/')) return u.endsWith('/approfondimenti/') ? 5 : 6;
  if (u.endsWith('/supervisione')) return 7;
  return 1;
};
const entries = pages
  .map((f) => ({ url: canonicalFor(f), mod: lastmod(f) }))
  .sort((a, b) => weight(a.url) - weight(b.url) || a.url.localeCompare(b.url));

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  entries.map((e) => `  <url><loc>${e.url}</loc><lastmod>${e.mod}</lastmod></url>\n`).join('') +
  '</urlset>\n';

const target = path.join(ROOT, 'sitemap.xml');
if (process.argv.includes('--check')) {
  const urls = (s) => [...s.matchAll(/<loc>([^<]+)/g)].map((m) => m[1]).sort().join('\n');
  const same = urls(xml) === urls(fs.readFileSync(target, 'utf8'));
  console.log(same ? 'sitemap.xml allineata alle pagine.' : 'sitemap.xml NON allineata: esegui node scripts/build-sitemap.mjs');
  process.exit(same ? 0 : 1);
}
if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== xml) {
  fs.writeFileSync(target, xml);
  console.log(`sitemap.xml aggiornata (${entries.length} URL).`);
} else console.log('sitemap.xml già aggiornata.');
