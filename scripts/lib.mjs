// Utilità condivise da audit.mjs, build-sitemap.mjs e live-check.mjs (solo Node, nessuna dipendenza).
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const ORIGIN = 'https://www.updateyourlife.it';

const SKIP_DIRS = new Set(['.git', '.github', 'node_modules', 'scripts', 'img']);

export function listHtml(dir = ROOT) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) out.push(...listHtml(path.join(dir, e.name)));
    } else if (e.name.endsWith('.html')) out.push(path.join(dir, e.name));
  }
  return out.sort();
}

export const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

// URL canonico atteso per un file (dir/index.html -> /dir/, supervisione.html -> /supervisione)
export function canonicalFor(file) {
  const r = rel(file);
  if (r === 'index.html') return ORIGIN + '/';
  if (r.endsWith('/index.html')) return ORIGIN + '/' + r.slice(0, -'index.html'.length);
  if (r === 'supervisione.html') return ORIGIN + '/supervisione';
  return ORIGIN + '/' + r;
}

export const read = (f) => fs.readFileSync(f, 'utf8');

export function meta(html, attr, name) {
  const re = new RegExp(`<meta[^>]*${attr}=["']${name}["'][^>]*>`, 'i');
  const tag = html.match(re)?.[0];
  return tag?.match(/content="([^"]*)"/i)?.[1] ?? tag?.match(/content='([^']*)'/i)?.[1];
}

export const decode = (s = '') =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

export const stripTags = (s) => decode(s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// Mappa URL del sito (path) -> file su disco, accettando le forme servite da Vercel/Pages.
export function resolveLocal(urlPath) {
  const p = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  const base = p.replace(/^\//, '');
  const candidates = [base, base + '.html', path.posix.join(base, 'index.html')];
  for (const c of candidates) {
    const f = path.join(ROOT, c);
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  }
  return null;
}
