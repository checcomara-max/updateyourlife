#!/usr/bin/env node
// Uno di Uno: libreria dei testi → file cifrati pubblicati.
//
// I testi in chiaro stanno SOLO sul computer di chi li modifica, in uno-di-uno/_sorgenti/contenuti/*.md
// (cartella esclusa da git). Nel repository finiscono due file cifrati con la password dell'anteprima:
//   uno-di-uno/assets/content.js        → la libreria pronta per il libro (la usa il browser dopo la password)
//   uno-di-uno/_sorgenti/contenuti.enc  → i file .md originali, per poterli riaprire e modificare
// Cifratura: PBKDF2-SHA256 (310.000 iterazioni) → AES-256-GCM, dati compressi con gzip.
//
// Uso (la password non va mai scritta nei file né committata):
//   UDU_PASSWORD='...' node scripts/build-uno-di-uno.mjs --apri    # decifra contenuti.enc → _sorgenti/contenuti/*.md
//   UDU_PASSWORD='...' node scripts/build-uno-di-uno.mjs           # valida i .md e riscrive i due file cifrati
//   node scripts/build-uno-di-uno.mjs --check                      # CI: file cifrati presenti e coerenti tra loro
//   UDU_PASSWORD='...' node scripts/build-uno-di-uno.mjs --imposta-password   # nuova password: aggiorna l'impronta in gate.js
//   UDU_PASSWORD='...' node scripts/build-uno-di-uno.mjs --chiaro FILE        # solo test: libreria in chiaro in FILE (fuori dal repo)
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { webcrypto as crypto } from 'node:crypto';
import { ROOT } from './lib.mjs';

const SRC = path.join(ROOT, 'uno-di-uno/_sorgenti/contenuti');
const ENC_SRC = path.join(ROOT, 'uno-di-uno/_sorgenti/contenuti.enc');
const OUT = path.join(ROOT, 'uno-di-uno/assets/content.js');
const GATE = path.join(ROOT, 'uno-di-uno/assets/gate.js');
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const die = (m) => { console.error(m); process.exit(1); };

// ---------- crypto ----------
const b64 = (u8) => Buffer.from(u8).toString('base64');
const unb64 = (s) => new Uint8Array(Buffer.from(s, 'base64'));
const hex = (u8) => Buffer.from(u8).toString('hex');
const sha256 = async (s) => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))));
function keyCfg() {
  const g = fs.readFileSync(GATE, 'utf8');
  const m = g.match(/salt:\s*'([^']+)',\s*iter:\s*(\d+),\s*token:\s*'([0-9a-f]*)'/);
  if (!m) die('assets/gate.js: configurazione chiave (salt/iter/token) non trovata');
  return { salt: m[1], iter: Number(m[2]), token: m[3], src: g };
}
async function derive(password, cfg) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(cfg.salt), iterations: cfg.iter }, base, 512));
  return { raw: bits.slice(0, 32), token: hex(bits.slice(32)) };
}
async function encrypt(rawKey, obj) {
  const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, zlib.gzipSync(Buffer.from(JSON.stringify(obj)), { level: 9 })));
  return { iv: b64(iv), data: b64(data) };
}
async function decrypt(rawKey, { iv, data }) {
  const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt']);
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(data));
    return JSON.parse(zlib.gunzipSync(Buffer.from(pt)).toString('utf8'));
  } catch { die('Decifratura non riuscita: password sbagliata o file danneggiato.'); }
}
async function passwordKey() {
  const pw = process.env.UDU_PASSWORD;
  if (!pw) die('Serve la password dell\'anteprima: UDU_PASSWORD=\'...\' node scripts/build-uno-di-uno.mjs');
  const cfg = keyCfg();
  const k = await derive(pw, cfg);
  return { ...k, cfg };
}
const readEnc = (f) => { if (!fs.existsSync(f)) return null; const t = fs.readFileSync(f, 'utf8'); const m = t.match(/\{"v":1[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; };

// ---------- parser dei .md ----------
const MOD_RE = /^=== modulo: (\S+) ===\s*$/;
const KEYED = ['ruolo', 'rischio', 'frase', 'bilanciato', 'fascia', 'lavoro', 'idea'];
function parseText(name, txt) {
  const mods = {};
  let cur = null, state = null, buf = [];
  const close = () => {
    if (!cur || !state) { buf = []; return; }
    const text = buf.join('\n').trim();
    if (state === 'body') cur.body = text;
    else if (state.sec) {
      const [typ, ...a] = state.sec;
      const items = () => text.split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2).trim());
      if (typ === 'pratica') cur.pratica = { freq: a[0], titolo: a[1], testo: text };
      else if (typ === 'altri') cur.altri = items();
      else if (typ === 'domande') cur.domande = items();
      else if (typ === 'inbreve') cur.inbreve = items();
      else if (typ === 'citazione') cur.citazione = text;
      else if (typ === 'fonte') cur.fonte = text;
      else if (typ === 'problema') (cur.problemi ||= []).push({ titolo: a[0], testo: text });
      else if (typ === 'curiosita') {
        const lines = text.split('\n');
        const fi = lines.findIndex((l) => l.startsWith('Fonte:'));
        if (fi < 0) throw new Error(`${name}: curiosità "${a[0]}" senza riga "Fonte:"`);
        (cur.curiosita ||= []).push({ titolo: a[0], testo: lines.slice(0, fi).join('\n').trim(), fonte: lines.slice(fi).join(' ').replace(/^Fonte:\s*/, '').trim() });
      } else if (KEYED.includes(typ)) (cur[typ] ||= {})[a[0]] = text;
      else if (typ === 'secondario') cur.secondario = text;
      else throw new Error(`${name}: sezione sconosciuta @@ ${typ}`);
    }
    buf = [];
  };
  for (const raw of txt.split('\n')) {
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
const MISSIONI = [1, 2, 3, 4, 5].map((i) => `missione-${i}`);
const EXPECTED = [...POLE, ...MISSIONI,
  ...'RCSK'.split('').flatMap((p) => ['A', 'N'].map((d) => `combo-SD-${p}${d}`)),
  ...'RCSK'.split('').flatMap((p) => ['D', 'P'].map((c) => `combo-SC-${p}${c}`)),
  'come-leggere', 'lettera-apertura', 'frasi', 'scheda', 'altri-intro', 'protocollo-intro', 'problemi-intro',
  'pagine-lavoro-intro', 'lettera-chiusura', 'avvertenze', 'piano-personale', 'nota-carico', 'nota-metodo', 'tratti-intro',
  'curva-pressione', 'matrice-decisione', 'matrice-conflitto', 'fonti-intro',
  ...'EACNO'.split('').map((t) => `tratto-${t}`)];

function buildLibrary(files) {
  const mods = {};
  for (const name of Object.keys(files).sort()) {
    for (const [k, v] of Object.entries(parseText(name, files[name]))) {
      if (mods[k]) throw new Error(`Modulo duplicato tra file: ${k}`);
      mods[k] = v;
    }
  }
  const e = [];
  for (const k of EXPECTED) if (!mods[k]) e.push(`manca il modulo ${k}`);
  for (const k of POLE) for (const f of ['pratica', 'altri', 'problemi', 'domande', 'sintesi', 'etichetta', 'inbreve', 'citazione', 'curiosita']) if (mods[k] && !mods[k][f]) e.push(`${k}: manca ${f}`);
  for (const k of MISSIONI) for (const f of ['inbreve', 'curiosita']) if (mods[k] && !mods[k][f]) e.push(`${k}: manca ${f}`);
  for (const k of [...POLE, ...MISSIONI]) if (mods[k]?.inbreve && mods[k].inbreve.length !== 3) e.push(`${k}: @@ inbreve deve avere 3 righe`);
  for (const p of 'RCSK') {
    for (const r of 'CML') if (!mods[`stress-${p}`]?.ruolo?.[r]) e.push(`stress-${p}: manca @@ ruolo | ${r}`);
    if (!mods[`stress-${p}`]?.secondario) e.push(`stress-${p}: manca @@ secondario`);
  }
  for (const k of MISSIONI) for (const p of 'RCSK') if (!mods[k]?.rischio?.[p]) e.push(`${k}: manca @@ rischio | ${p}`);
  for (let i = 1; i <= 8; i++) if (!mods.frasi?.frase?.[i]) e.push(`frasi: manca @@ frase | ${i}`);
  for (const k of ['energia', 'decisione', 'conflitto']) if (!mods.scheda?.bilanciato?.[k]) e.push(`scheda: manca @@ bilanciato | ${k}`);
  for (const k of ['curva-pressione', 'matrice-decisione', 'matrice-conflitto']) if (mods[k] && !mods[k].fonte) e.push(`${k}: manca @@ fonte`);
  for (const t of 'EACNO') {
    const m = mods[`tratto-${t}`];
    if (!m) continue;
    for (const f of ['titolo', 'basso', 'alto', 'body']) if (!m[f]) e.push(`tratto-${t}: manca ${f}`);
    for (const s of ['fascia', 'lavoro', 'idea']) for (const b of ['basso', 'medio', 'alto']) if (!m[s]?.[b]) e.push(`tratto-${t}: manca @@ ${s} | ${b}`);
  }
  for (const [k, m] of Object.entries(mods)) {
    const blob = JSON.stringify(m);
    if ((blob.match(/\[\[/g) || []).length !== (blob.match(/\]\]/g) || []).length) e.push(`${k}: parentesi [[ ]] non bilanciate`);
    if ((blob.match(/\{\{#/g) || []).length + (blob.match(/\{\{\^/g) || []).length !== (blob.match(/\{\{\//g) || []).length) e.push(`${k}: blocchi {{#}} / {{/}} non bilanciati`);
  }
  if (e.length) die('ERRORI NEI CONTENUTI:\n - ' + e.join('\n - '));
  return mods;
}

const readPlain = () => (fs.existsSync(SRC) ? Object.fromEntries(fs.readdirSync(SRC).filter((n) => n.endsWith('.md')).sort().map((n) => [n, fs.readFileSync(path.join(SRC, n), 'utf8')])) : null);
const filesHash = (files) => sha256(Object.keys(files).sort().map((n) => n + '\n' + files[n]).join('\n\u0000\n'));
const words = (mods) => Object.values(mods).reduce((n, m) => n + (JSON.stringify(m).match(/[\p{L}']+/gu) || []).length, 0);

// ---------- comandi ----------
if (has('--check')) {
  const c = readEnc(OUT), s = readEnc(ENC_SRC);
  if (!c) die('uno-di-uno/assets/content.js mancante o non cifrato: lancia lo script con UDU_PASSWORD.');
  if (!s) die('uno-di-uno/_sorgenti/contenuti.enc mancante: lancia lo script con UDU_PASSWORD.');
  if (c.hash !== s.hash) die('content.js e contenuti.enc vengono da versioni diverse dei testi: rilancia lo script con UDU_PASSWORD.');
  const cfg = keyCfg();
  if (!/^[0-9a-f]{64}$/.test(cfg.token)) die('assets/gate.js: impronta della password mancante.');
  if (fs.existsSync(path.join(ROOT, 'uno-di-uno/_sorgenti/contenuti'))) {
    const plain = readPlain();
    if (plain && Object.keys(plain).length) {
      buildLibrary(plain);
      if ((await filesHash(plain)) !== c.hash) die('I testi in _sorgenti/contenuti/ sono cambiati: rilancia lo script con UDU_PASSWORD per aggiornare i file cifrati.');
    }
  }
  console.log('✔ Libreria cifrata presente e coerente.');
  process.exit(0);
}

if (has('--imposta-password')) {
  const { token, cfg } = await passwordKey();
  const g = cfg.src.replace(/token:\s*'[0-9a-f]*'/, `token: '${token}'`);
  fs.writeFileSync(GATE, g);
  console.log('Impronta della password aggiornata in assets/gate.js. Ora rilancia lo script per ricifrare la libreria.');
  process.exit(0);
}

const k = await passwordKey();
if (k.token !== k.cfg.token) die('La password non corrisponde a quella dell\'anteprima (assets/gate.js). Per cambiarla usa --imposta-password.');

if (has('--apri')) {
  const s = readEnc(ENC_SRC);
  if (!s) die('contenuti.enc non trovato.');
  const files = await decrypt(k.raw, s);
  if (fs.existsSync(SRC) && fs.readdirSync(SRC).some((n) => n.endsWith('.md')) && !has('--forza')) die('_sorgenti/contenuti/ contiene già dei testi: usa --forza per sovrascriverli.');
  fs.mkdirSync(SRC, { recursive: true });
  for (const [n, t] of Object.entries(files)) fs.writeFileSync(path.join(SRC, n), t);
  console.log(`Aperti ${Object.keys(files).length} file in uno-di-uno/_sorgenti/contenuti/ (esclusi da git). Dopo le modifiche rilancia lo script senza --apri.`);
  process.exit(0);
}

let files = readPlain();
if (!files || !Object.keys(files).length) {
  const s = readEnc(ENC_SRC);
  if (!s) die('Nessun testo trovato: né _sorgenti/contenuti/*.md né contenuti.enc.');
  files = await decrypt(k.raw, s);
}
const mods = buildLibrary(files);
const hash = await filesHash(files);

const ci = has('--chiaro') ? args[args.indexOf('--chiaro') + 1] : null;
if (ci) {
  if (path.resolve(ci).startsWith(path.join(ROOT, 'uno-di-uno'))) die('--chiaro: scrivi il file fuori dalla cartella pubblicata.');
  fs.writeFileSync(ci, `window.UDU_CONTENT = ${JSON.stringify({ moduli: mods })};\n`);
  console.log('Libreria in chiaro (solo per test) → ' + ci);
  process.exit(0);
}

const prev = readEnc(OUT), prevSrc = readEnc(ENC_SRC);
if (prev?.hash === hash && prevSrc?.hash === hash && !has('--forza')) {
  console.log(`Nessuna modifica ai testi (${Object.keys(mods).length} moduli): file cifrati invariati.`);
  process.exit(0);
}
const c = await encrypt(k.raw, { moduli: mods });
fs.writeFileSync(OUT, `/* Uno di Uno — libreria CIFRATA (AES-GCM). FILE GENERATO da scripts/build-uno-di-uno.mjs: non modificarlo a mano.\n   Si decifra nel browser solo con la password dell'anteprima. */\nwindow.UDU_ENC = ${JSON.stringify({ v: 1, ...c, hash })};\n`);
const s = await encrypt(k.raw, files);
fs.writeFileSync(ENC_SRC, JSON.stringify({ v: 1, ...s, hash }) + '\n');
console.log(`OK: ${Object.keys(mods).length} moduli, circa ${words(mods).toLocaleString('it-IT')} parole → content.js e contenuti.enc cifrati.`);
