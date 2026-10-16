#!/usr/bin/env node
// Controllo del sito PUBBLICATO: ogni URL della sitemap deve rispondere 200 senza redirect e
// title / H1 / canonical online devono coincidere con quelli nel repo. Uso: BASE=https://www.updateyourlife.it node scripts/live-check.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ORIGIN, read, decode, resolveLocal, canonicalFor, meta } from './lib.mjs';

const BASE = (process.env.BASE || ORIGIN).replace(/\/$/, '');
const errors = [];
const get = (url) => fetch(url, { redirect: 'manual', headers: { 'user-agent': 'uyl-live-check/1.0' } });

const sitemap = await (await get(`${BASE}/sitemap.xml`)).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)/g)].map((m) => m[1]);
const local = [...fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)/g)].map((m) => m[1]);
for (const u of local) if (!urls.includes(u)) errors.push(`sitemap online senza ${u} (sitemap online: ${urls.length} URL, repo: ${local.length})`);

const pick = (html, re) => decode(html.match(re)?.[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || '');
for (const u of local) {
  const url = BASE + u.slice(ORIGIN.length);
  let res;
  try { res = await get(url); } catch (e) { errors.push(`${url}: errore di rete (${e.message})`); continue; }
  if (res.status >= 300 && res.status < 400) { errors.push(`${url}: redirect ${res.status} → ${res.headers.get('location')} (le URL in sitemap devono rispondere 200)`); continue; }
  if (res.status !== 200) { errors.push(`${url}: HTTP ${res.status}`); continue; }
  const html = await res.text();
  const file = resolveLocal(u.slice(ORIGIN.length));
  const src = read(file);
  const t = pick(html, /<title>([\s\S]*?)<\/title>/i);
  const h = pick(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (t !== pick(src, /<title>([\s\S]*?)<\/title>/i)) errors.push(`${url}: title online diverso dal repo ("${t}")`);
  if (h !== pick(src, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i)) errors.push(`${url}: H1 online diverso dal repo`);
  if (!html.includes(`href="${canonicalFor(file)}"`)) errors.push(`${url}: canonical online mancante o diverso`);
  if (/noindex/i.test(meta(html, 'name', 'robots') || '') || /noindex/i.test(res.headers.get('x-robots-tag') || '')) errors.push(`${url}: noindex online!`);
}
const robots = await (await get(`${BASE}/robots.txt`)).text();
if (!/Sitemap:\s*\S+\/sitemap\.xml/i.test(robots)) errors.push('robots.txt online senza riga Sitemap');

console.log(`Controllate ${local.length} URL su ${BASE}`);
if (errors.length) { console.log(errors.map((e) => '✖ ' + e).join('\n')); process.exit(1); }
console.log('✔ Sito online coerente con il repo.');
