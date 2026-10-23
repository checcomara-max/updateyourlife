#!/usr/bin/env node
// Uno di Uno: legge la libreria in uno-di-uno/_sorgenti/contenuti/*.md e scrive uno-di-uno/assets/content.js.
// Controlla che non manchi nessun modulo, che ogni modulo abbia le sezioni richieste e che le [[ ]] siano bilanciate.
// Uso: node scripts/build-uno-di-uno.mjs            (scrive content.js)
//      node scripts/build-uno-di-uno.mjs --check    (esce con 1 se content.js non è allineato ai sorgenti)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const SRC = path.join(ROOT, 'uno-di-uno/_sorgenti/contenuti');
const OUT = path.join(ROOT, 'uno-di-uno/assets/content.js');
const MOD_RE = /^=== modulo: (\S+) ===\s*$/;

function parseFile(file) {
  const mods = {};
  let cur = null, state = null, buf = [];
  const close = () => {
    if (!cur || !state) { buf = []; return; }
    const text = buf.join('\n').trim();
    if (state === 'body') cur.body = text;
    else if (state.sec) {
      const [typ, ...args] = state.sec;
      const items = () => text.split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2).trim());
      if (typ === 'pratica') cur.pratica = { freq: args[0], titolo: args[1], testo: text };
      else if (typ === 'altri') cur.altri = items();
      else if (typ === 'domande') cur.domande = items();
      else if (typ === 'problema') (cur.problemi ||= []).push({ titolo: args[0], testo: text });
      else if (['ruolo', 'rischio', 'frase', 'bilanciato', 'fascia'].includes(typ)) (cur[typ] ||= {})[args[0]] = text;
      else if (typ === 'secondario') cur.secondario = text;
      else throw new Error(`${path.basename(file)}: sezione sconosciuta @@ ${typ}`);
    }
    buf = [];
  };
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = raw.match(MOD_RE);
    if (m) {
      close();
      if (mods[m[1]]) throw new Error(`Modulo duplicato: ${m[1]}`);
      cur = mods[m[1]] = { id: m[1] };
      state = 'head';
      continue;
    }
    if (!cur) continue;
    if (state === 'head') {
      if (raw.trim() === '---') { state = 'body'; buf = []; }
      else if (raw.includes(':')) { const i = raw.indexOf(':'); cur[raw.slice(0, i).trim()] = raw.slice(i + 1).trim(); }
      continue;
    }
    if (raw.startsWith('@@ ')) { close(); state = { sec: raw.slice(3).split(' | ').map((s) => s.trim()) }; continue; }
    buf.push(raw);
  }
  close();
  return mods;
}

const POLE = ['energia-E', 'energia-I', 'decisione-A', 'decisione-N', 'conflitto-D', 'conflitto-P',
  ...'RCSK'.split('').map((p) => `stress-${p}`), ...'GRAS'.split('').map((p) => `motivazione-${p}`)];
const EXPECTED = [...POLE,
  ...[1, 2, 3, 4, 5].map((i) => `missione-${i}`),
  ...'RCSK'.split('').flatMap((p) => ['A', 'N'].map((d) => `combo-SD-${p}${d}`)),
  ...'RCSK'.split('').flatMap((p) => ['D', 'P'].map((c) => `combo-SC-${p}${c}`)),
  'come-leggere', 'lettera-apertura', 'frasi', 'scheda', 'altri-intro', 'protocollo-intro', 'problemi-intro',
  'pagine-lavoro-intro', 'lettera-chiusura', 'avvertenze', 'piano-personale', 'nota-carico', 'nota-metodo', 'tratti-intro',
  ...'EACNO'.split('').map((t) => `tratto-${t}`)];

const mods = {};
for (const f of fs.readdirSync(SRC).filter((n) => n.endsWith('.md')).sort()) {
  for (const [k, v] of Object.entries(parseFile(path.join(SRC, f)))) {
    if (mods[k]) throw new Error(`Modulo duplicato tra file: ${k}`);
    mods[k] = v;
  }
}

const errors = [];
for (const k of EXPECTED) if (!mods[k]) errors.push(`manca il modulo ${k}`);
for (const k of POLE) for (const f of ['pratica', 'altri', 'problemi', 'domande', 'sintesi', 'etichetta']) if (mods[k] && !mods[k][f]) errors.push(`${k}: manca ${f}`);
for (const p of 'RCSK') {
  for (const r of 'CML') if (!mods[`stress-${p}`]?.ruolo?.[r]) errors.push(`stress-${p}: manca @@ ruolo | ${r}`);
  if (!mods[`stress-${p}`]?.secondario) errors.push(`stress-${p}: manca @@ secondario`);
}
for (let i = 1; i <= 5; i++) for (const p of 'RCSK') if (!mods[`missione-${i}`]?.rischio?.[p]) errors.push(`missione-${i}: manca @@ rischio | ${p}`);
for (let i = 1; i <= 8; i++) if (!mods.frasi?.frase?.[i]) errors.push(`frasi: manca @@ frase | ${i}`);
for (const k of ['energia', 'decisione', 'conflitto']) if (!mods.scheda?.bilanciato?.[k]) errors.push(`scheda: manca @@ bilanciato | ${k}`);
for (const t of 'EACNO') {
  const m = mods[`tratto-${t}`];
  if (!m) continue;
  for (const f of ['titolo', 'basso', 'alto', 'body']) if (!m[f]) errors.push(`tratto-${t}: manca ${f}`);
  for (const b of ['basso', 'medio', 'alto']) if (!m.fascia?.[b]) errors.push(`tratto-${t}: manca @@ fascia | ${b}`);
}
for (const [k, m] of Object.entries(mods)) {
  const blob = JSON.stringify(m);
  if ((blob.match(/\[\[/g) || []).length !== (blob.match(/\]\]/g) || []).length) errors.push(`${k}: parentesi [[ ]] non bilanciate`);
  if ((blob.match(/\{\{#/g) || []).length + (blob.match(/\{\{\^/g) || []).length !== (blob.match(/\{\{\//g) || []).length) errors.push(`${k}: blocchi {{#}} / {{/}} non bilanciati`);
}
if (errors.length) { console.error('ERRORI NEI CONTENUTI:\n - ' + errors.join('\n - ')); process.exit(1); }

const words = Object.values(mods).reduce((n, m) => n + (JSON.stringify(m).match(/[\p{L}']+/gu) || []).length, 0);
const out = `/* Uno di Uno — libreria dei contenuti. FILE GENERATO da scripts/build-uno-di-uno.mjs: non modificarlo a mano,\n   modifica uno-di-uno/_sorgenti/contenuti/*.md e rilancia lo script. */\nwindow.UDU_CONTENT = ${JSON.stringify({ moduli: mods }).replace(/<\//g, '<\\/')};\n`;

if (process.argv.includes('--check')) {
  const now = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (now !== out) { console.error('uno-di-uno/assets/content.js non è allineato ai sorgenti: lancia node scripts/build-uno-di-uno.mjs'); process.exit(1); }
  console.log(`✔ content.js allineato (${Object.keys(mods).length} moduli).`);
} else {
  fs.writeFileSync(OUT, out);
  console.log(`OK: ${Object.keys(mods).length} moduli, circa ${words.toLocaleString('it-IT')} parole → ${path.relative(ROOT, OUT)}`);
}
