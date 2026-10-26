#!/usr/bin/env node
// Audit statico del sito secondo le regole di CLAUDE.md. Esce con 1 se ci sono errori (i warning non bloccano).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, ORIGIN, listHtml, read, rel, canonicalFor, meta, stripTags, decode, resolveLocal } from './lib.mjs';

const errors = [];
const warnings = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warnings.push(`${f}: ${m}`);

const files = listHtml();
const sitemapXml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)/g)].map((m) => m[1]);

// Pagine servizio: devono comparire in nav.topics e nei footer di home + pagine servizio
const SERVICE_DIRS = [
  'psicologo-online', 'ansia-online', 'relazioni-coppia-online', 'autostima-online', 'momenti-di-cambiamento-online',
  'stress-lavoro-burnout-online', 'psicologo-per-manager', 'azienda-di-famiglia-online', 'coaching', 'coaching-online-crescita-personale', 'psicologo-online-italiani-estero', 'psicologo-online-milano',
];
const serviceFiles = new Set(SERVICE_DIRS.map((d) => `${d}/index.html`));

// Frasi vietate dalla deontologia / dal profilo (CLAUDE.md). Solo warning: serve occhio umano sul contesto.
const FORBIDDEN = [
  [/\bfattura\b|detraibil/i, 'P.IVA non aperta: niente "fattura"/"detraibile"'],
  [/€|\beuro\b|\btariff/i, 'niente tariffe/prezzi (si comunicano nella call)'],
  [/\bguarigion|\bguarire\b|\bti guarisc/i, 'nessuna promessa di guarigione'],
  [/risultati garantit|garantiamo|garantisco/i, 'nessuna promessa di risultato'],
  [/\bpsicoterap/i, 'non offrire psicoterapia (ok solo nelle FAQ "non sono psicoterapeuta")'],
  [/\bterapia\b/i, 'evita "terapia" come servizio'],
  [/Prenota la call|Call gratuita su WhatsApp/i, 'etichetta CTA superata: usa "Scrivimi su WhatsApp"'],
  [/ti ascolto in italiano/i, 'frase sulla lingua: solo nelle pagine italiani all\'estero'],
];

const ALLOWED = /\b0 €|terapia farmacologica|in psicoterapia, coaching|non è terapia/gi;

for (const file of files) {
  const r = rel(file);
  const html = read(file);
  const robots = meta(html, 'name', 'robots') || '';
  const noindex = /noindex/i.test(robots);
  const isLegal = /^(privacy-policy|cookie-policy|note-legali)\.html$/.test(r);
  // pagine città sotto l'hub italiani all'estero: stesse regole delle pagine servizio
  const isService = serviceFiles.has(r) || /^psicologo-online-italiani-estero\/[^/]+\/index\.html$/.test(r);
  const isArticle = /^approfondimenti\/(?!index)/.test(r);
  const expectedCanonical = canonicalFor(file);

  // --- Head
  const title = decode(html.match(/<title>([^<]*)<\/title>/i)?.[1] || '');
  if (!title) err(r, 'manca <title>');
  else if (title.length > 65) err(r, `title troppo lungo (${title.length} > 65): "${title}"`);
  else if (title.length > 60 && !noindex) warn(r, `title al limite (${title.length}): "${title}"`);

  const desc = decode(meta(html, 'name', 'description') || '');
  if (!desc) err(r, 'manca meta description');
  else if (desc.length > 160) err(r, `meta description troppo lunga (${desc.length} > 160)`);
  else if (desc.length < 70 && !noindex) warn(r, `meta description corta (${desc.length})`);

  const canonical = html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i)?.[0]?.match(/href=["']([^"']+)/)?.[1];
  if (!noindex) {
    if (!canonical) err(r, 'manca canonical');
    else if (canonical !== expectedCanonical) err(r, `canonical ${canonical} ≠ atteso ${expectedCanonical}`);
    if (!/index/i.test(robots) && robots) err(r, `robots anomalo: ${robots}`);
    if (!meta(html, 'property', 'og:title')) err(r, 'manca og:title');
    if (!meta(html, 'property', 'og:description')) warn(r, 'manca og:description');
    if (!meta(html, 'property', 'og:image')) warn(r, 'manca og:image');
    if (!/<html[^>]*lang=["']it/i.test(html)) err(r, 'manca <html lang="it">');
    if (!/name=["']viewport["']/i.test(html)) err(r, 'manca meta viewport');
  }

  // --- H1 singolo
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1s.length !== 1) err(r, `H1 trovati: ${h1s.length} (deve essere 1)`);

  // --- JSON-LD valido
  const ld = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (!ld.length && !noindex && !isLegal) err(r, 'manca JSON-LD');
  const ldTypes = [];
  const ldQuestions = [];
  for (const m of ld) {
    try {
      const data = JSON.parse(m[1]);
      const nodes = Array.isArray(data) ? data : data['@graph'] || [data];
      for (const n of nodes) {
        const t = [].concat(n['@type'] || []);
        ldTypes.push(...t);
        if (t.includes('FAQPage')) for (const q of n.mainEntity || []) ldQuestions.push(q.name);
      }
    } catch (e) {
      err(r, `JSON-LD non valido: ${e.message}`);
    }
  }
  if ((isService || isArticle || r === 'index.html') && !ldTypes.includes('BreadcrumbList') && r !== 'index.html')
    warn(r, 'JSON-LD senza BreadcrumbList');
  if (isService && !ldTypes.includes('FAQPage')) warn(r, 'JSON-LD senza FAQPage');

  // FAQPage coerente con le FAQ visibili: ogni domanda JSON-LD deve comparire nel testo della pagina
  if (ldQuestions.length) {
    const norm = (t) => t.replace(/[\u2018\u2019\u201c\u201d"']/g, '').replace(/\s+/g, ' ');
    const body = norm(stripTags(html.replace(/<script[\s\S]*?<\/script>/gi, '')));
    for (const q of ldQuestions) if (!body.includes(norm(decode(q)))) err(r, `domanda FAQPage non visibile nella pagina: "${q}"`);
  }

  // --- Immagini
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const src = tag.match(/src=["']([^"']+)/)?.[1] || '';
    if (!/\salt=/.test(tag)) err(r, `img senza alt: ${src}`);
    if (!/\swidth=/.test(tag) || !/\sheight=/.test(tag)) err(r, `img senza width/height: ${src}`);
    if (!src.startsWith('data:') && !/loading=["']lazy/.test(tag) && !/fetchpriority=["']high/.test(tag))
      warn(r, `img senza loading="lazy" (ok solo se above the fold): ${src}`);
  }

  // --- Link interni
  const internal = new Set();
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    let href = decode(m[1]);
    if (/^(mailto:|tel:|javascript:|https?:\/\/(?!(www\.)?updateyourlife\.it))/i.test(href)) continue;
    href = href.replace(/^https?:\/\/(www\.)?updateyourlife\.it/, '');
    if (href.startsWith('#') || href === '') continue;
    let f;
    if (!href.startsWith('/')) {
      // link relativo: ok solo per pagine in root; altrimenti va reso assoluto
      if (r.includes('/')) warn(r, `link relativo (meglio assoluto): ${href}`);
      href = '/' + href;
    }
    f = resolveLocal(href);
    if (!f) err(r, `link interno rotto: ${href}`);
    else if (href.includes('#')) {
      const id = href.split('#')[1];
      if (id && !new RegExp(`id=["']${id}["']`).test(read(f))) err(r, `ancora non trovata: ${href}`);
    }
    internal.add(href.split('#')[0]);
  }
  // ancore interne alla pagina
  for (const m of html.matchAll(/href=["']#([^"']+)["']/g)) {
    if (m[1] === 'top') continue;
    if (!new RegExp(`id=["']${m[1]}["']`).test(html)) err(r, `ancora interna senza target: #${m[1]}`);
  }
  if ((isService || isArticle) && [...internal].filter((h) => h !== '/' && !/privacy|cookie|note-legali/.test(h)).length < 2)
    err(r, 'meno di 2 link interni verso altre pagine del sito');

  // --- Footer temi
  if (isService || r === 'index.html') {
    const topics = html.match(/<nav class="topics"[\s\S]*?<\/nav>/i)?.[0];
    if (!topics) err(r, 'manca nav.topics nel footer');
    else for (const d of SERVICE_DIRS) if (!topics.includes(`href="/${d}/"`)) err(r, `nav.topics senza /${d}/`);
  }

  // --- Contatti: ogni link wa.me / tel / mailto con data-contatto
  for (const m of html.matchAll(/<a\b[^>]*href=["'](https:\/\/wa\.me\/[^"']*|tel:[^"']*|mailto:[^"']*)["'][^>]*>/gi)) {
    if (!noindex && !isLegal && m[1] !== 'tel:112' && !/data-contatto=/.test(m[0])) warn(r, `link contatto senza data-contatto: ${m[1].slice(0, 40)}`);
    if (m[1].startsWith('https://wa.me/') && !m[1].startsWith('https://wa.me/393314980002')) err(r, `numero WhatsApp diverso: ${m[1].slice(0, 40)}`);
  }

  // --- Sitemap
  if (!noindex) {
    if (!sitemapUrls.includes(expectedCanonical)) err(r, `non presente in sitemap.xml (${expectedCanonical})`);
  } else if (sitemapUrls.includes(expectedCanonical)) err(r, 'noindex ma presente in sitemap.xml');

  // --- Contenuti vietati (solo pagine indicizzabili, non legali)
  if (!noindex && !isLegal) {
    // FAQ (<details>) e frasi note e legittime sono escluse dal controllo
    const text = stripTags(html.replace(/<details[\s\S]*?<\/details>/gi, ' ')).replace(ALLOWED, ' ');
    const isEstero = r.startsWith('psicologo-online-italiani-estero/');
    for (const [re, why] of FORBIDDEN) {
      if (isEstero && /lingua/.test(why)) continue;
      const m = text.match(re);
      if (m) warn(r, `"${m[0]}" — ${why}`);
    }
  }
}

// --- Sitemap → file su disco
for (const u of sitemapUrls) {
  if (!u.startsWith(ORIGIN + '/')) { err('sitemap.xml', `host inatteso: ${u}`); continue; }
  const p = u.slice(ORIGIN.length);
  const f = resolveLocal(p);
  if (!f) err('sitemap.xml', `URL senza file: ${u}`);
  else if (canonicalFor(f) !== u) err('sitemap.xml', `URL non canonico: ${u} (atteso ${canonicalFor(f)})`);
}
if (new Set(sitemapUrls).size !== sitemapUrls.length) err('sitemap.xml', 'URL duplicati');
if (!/Sitemap:\s*https:\/\/www\.updateyourlife\.it\/sitemap\.xml/.test(fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8')))
  err('robots.txt', 'non punta alla sitemap');

// --- Roadmap articoli: ogni articolo deve essere nella card list di approfondimenti/index.html
const idx = read(path.join(ROOT, 'approfondimenti/index.html'));
for (const f of files.filter((f) => /^approfondimenti\/(?!index)/.test(rel(f)))) {
  const name = path.basename(f);
  if (!idx.includes(`/approfondimenti/${name}`)) err('approfondimenti/index.html', `articolo senza card/ItemList: ${name}`);
}

// --- Peso immagini e formati
const imgDir = path.join(ROOT, 'img');
for (const n of fs.readdirSync(imgDir)) {
  const size = fs.statSync(path.join(imgDir, n)).size;
  if (/\.png$/i.test(n)) err(`img/${n}`, 'PNG vietato: usa WebP');
  if (size > 200 * 1024) err(`img/${n}`, `${Math.round(size / 1024)} KB > 200 KB`);
}
for (const n of ['color-splash.jpg', 'scalini.jpg']) {
  const f = path.join(ROOT, n);
  if (fs.existsSync(f) && fs.statSync(f).size > 200 * 1024) warn(n, `${Math.round(fs.statSync(f).size / 1024)} KB: immagine pesante in root (usata?)`);
}

console.log(`Pagine controllate: ${files.length} · URL in sitemap: ${sitemapUrls.length}`);
if (warnings.length) console.log(`\n⚠ ${warnings.length} warning\n` + warnings.map((w) => '  - ' + w).join('\n'));
if (errors.length) console.log(`\n✖ ${errors.length} errori\n` + errors.map((e) => '  - ' + e).join('\n'));
else console.log('\n✔ Nessun errore.');
process.exit(errors.length ? 1 : 0);
