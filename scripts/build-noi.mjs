#!/usr/bin/env node
// NOI: libreria dei testi del percorso di coppia → file cifrati pubblicati.
// Stesso schema di scripts/build-uno-di-uno.mjs (leggi lì i dettagli). I testi in chiaro stanno SOLO in locale,
// in noi/_sorgenti/contenuti/*.md (cartella esclusa da git). Nel repository finiscono due file cifrati con la password
// dell'area riservata /noi/ (PBKDF2-SHA256 310.000 iterazioni → AES-256-GCM, dati compressi con gzip):
//   noi/assets/content.js        → la libreria pronta (la usa lo studio di Francesco dopo la password)
//   noi/_sorgenti/contenuti.enc  → i file .md originali, per poterli riaprire e modificare
//
// Uso (la password non va mai scritta nei file né committata):
//   NOI_PASSWORD='...' node scripts/build-noi.mjs --apri    # decifra contenuti.enc → _sorgenti/contenuti/*.md
//   NOI_PASSWORD='...' node scripts/build-noi.mjs           # valida i .md e riscrive i due file cifrati
//   node scripts/build-noi.mjs --check                      # CI: file cifrati presenti e coerenti tra loro
//   NOI_PASSWORD='...' node scripts/build-noi.mjs --imposta-password   # nuova password: aggiorna l'impronta in gate.js
//   NOI_PASSWORD='...' node scripts/build-noi.mjs --chiaro FILE        # solo test: libreria in chiaro in FILE (fuori dal repo)
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { webcrypto as crypto } from 'node:crypto';
import { ROOT } from './lib.mjs';

const SRC = path.join(ROOT, 'noi/_sorgenti/contenuti');
const ENC_SRC = path.join(ROOT, 'noi/_sorgenti/contenuti.enc');
const OUT = path.join(ROOT, 'noi/assets/content.js');
const GATE = path.join(ROOT, 'noi/assets/gate.js');
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
  const pw = process.env.NOI_PASSWORD;
  if (!pw) die('Serve la password dell\'area NOI: NOI_PASSWORD=\'...\' node scripts/build-noi.mjs');
  const cfg = keyCfg();
  const k = await derive(pw, cfg);
  return { ...k, cfg };
}
const readEnc = (f) => { if (!fs.existsSync(f)) return null; const t = fs.readFileSync(f, 'utf8'); const m = t.match(/\{"v":1[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; };

// ---------- parser dei .md ----------
// Sintassi: === modulo: id === / intestazione chiave: valore / --- / testo / @@ sezione | argomenti
const MOD_RE = /^=== modulo: (\S+) ===\s*$/;
const LISTS = ['inbreve', 'gesti', 'domande', 'aiuta', 'evita'];
const TEXTS = ['citazione', 'breve', 'scheda', 'riparare', 'fonte'];
const KEYED = ['tu', 'reazione', 'accordo'];
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
      if (LISTS.includes(typ)) cur[typ] = items();
      else if (TEXTS.includes(typ)) cur[typ] = text;
      else if (typ === 'pratica') cur.pratica = { freq: a[0], titolo: a[1], testo: text };
      else if (typ === 'problema') (cur.problemi ||= []).push({ titolo: a[0], testo: text });
      else if (typ === 'curiosita') {
        const lines = text.split('\n');
        const fi = lines.findIndex((l) => l.startsWith('Fonte:'));
        if (fi < 0) throw new Error(`${name}: curiosità "${a[0]}" senza riga "Fonte:"`);
        (cur.curiosita ||= []).push({ titolo: a[0], testo: lines.slice(0, fi).join('\n').trim(), fonte: lines.slice(fi).join(' ').replace(/^Fonte:\s*/, '').trim() });
      } else if (KEYED.includes(typ)) (cur[typ] ||= {})[a[0]] = text;
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

// ---------- che cosa deve esserci (lo usa noi/assets/book.js) ----------
const L = (s) => s.split('');
const pairs = (letters) => letters.flatMap((a, i) => letters.slice(i).map((b) => a + b));
const VIE = L('PTGFAS'), VIC = L('TCSE'), DIS = L('IRB'), DOPO = L('ABCDE'), SEGN = L('DVCIN'), BIS = L('APLCS'), REAZ = L('APLCSW');
const TEMI = ['casa', 'tempo', 'soldi', 'famiglie', 'figli', 'lavoro', 'intimita'];
const QUO = ['notizie', 'novita', 'apprezzamento', 'rituali', 'carico', 'perse', 'insieme', 'base'];
const ACCORDI = ['pausa', 'quando', 'avvisare', 'spazio', 'domanda', 'notizie', 'lista', 'schermi', 'novita', 'grazie', 'rituale', 'riparare', 'avvio', 'riunione', 'saluto'];
const FRAMES = ['come-leggere', 'lettera-apertura', 'importante-intro', 'vic-intro', 'dis-intro', 'pres-intro', 'quo-intro', 'messaggio-intro',
  'settimane-intro', 'problemi-intro', 'domande-intro', 'lettera-chiusura', 'fonti-intro', 'nota-metodo', 'avvertenze',
  'scheda-intro', 'scheda-grazie', 'scheda-accordi', 'scheda-sera', 'scheda-rituale', 'scheda-riparare', 'scheda-percorso', 'scheda-chiusura', 'allagamento', 'duro', 'ripara'];
const FULL = ['titolo', 'etichetta', 'sintesi', 'body', 'inbreve', 'citazione', 'curiosita', 'pratica', 'problemi', 'domande', 'scheda'];
const RULES = [
  ...VIE.map((k) => [`via-${k}`, [...FULL, 'gesti', 'breve']]),
  ...L('123456').map((k) => [`ferita-${k}`, ['titolo', 'body', 'riparare', 'curiosita', 'problemi']]),
  ...VIC.map((k) => [`vic-${k}`, [...FULL, 'aiuta', 'evita']]),
  ...DIS.map((k) => [`dis-${k}`, [...FULL, 'aiuta', 'evita']]),
  ...pairs(VIC).map((k) => [`coppia-vic-${k}`, ['titolo', 'body', 'tu']]),
  ...pairs(DIS).map((k) => [`coppia-dis-${k}`, ['titolo', 'body', 'tu']]),
  ...DOPO.map((k) => [`dopo-${k}`, ['titolo', 'body', 'scheda']]),
  ...TEMI.map((k) => [`tema-${k}`, ['titolo', 'body']]),
  ...SEGN.map((k) => [`segnale-${k}`, ['titolo', 'body', 'scheda']]),
  ...BIS.map((k) => [`bisogno-${k}`, [...FULL, 'reazione']]),
  ...QUO.map((k) => [`quo-${k}`, ['titolo', 'body', 'curiosita', 'pratica', 'problemi', 'domande', 'scheda']]),
  ...FRAMES.map((k) => [k, ['titolo', 'body']]),
  ['scheda-percorso', ['titolo', 'body', 'domande', 'breve']],
  ['scheda-riparare', ['titolo', 'body', 'domande', 'curiosita']],
];
const VARS = new Set(['X', 'Y', 'P', 'Q', 'A', 'B', 'lui', 'lo', 'gli', 'autore']);
const GKEYS = new Set(['tu', 'p', 'q']);

function buildLibrary(files) {
  const mods = {};
  for (const name of Object.keys(files).sort()) {
    for (const [k, v] of Object.entries(parseText(name, files[name]))) {
      if (mods[k]) throw new Error(`Modulo duplicato tra file: ${k}`);
      mods[k] = v;
    }
  }
  const e = [];
  for (const [id, fields] of RULES) {
    const m = mods[id];
    if (!m) { e.push(`manca il modulo ${id}`); continue; }
    for (const f of fields) if (!m[f] || (Array.isArray(m[f]) && !m[f].length)) e.push(`${id}: manca ${f}`);
    if (m.inbreve && m.inbreve.length !== 3) e.push(`${id}: @@ inbreve deve avere 3 righe`);
  }
  for (const k of [...pairs(VIC).map((p) => ['vic', p]), ...pairs(DIS).map((p) => ['dis', p])]) {
    const m = mods[`coppia-${k[0]}-${k[1]}`];
    if (m) for (const c of new Set(k[1])) if (!m.tu?.[c]) e.push(`coppia-${k[0]}-${k[1]}: manca @@ tu | ${c}`);
  }
  for (const b of BIS) for (const r of REAZ) if (mods[`bisogno-${b}`] && !mods[`bisogno-${b}`].reazione?.[r]) e.push(`bisogno-${b}: manca @@ reazione | ${r}`);
  for (const a of ACCORDI) if (!mods['scheda-accordi']?.accordo?.[a]) e.push(`scheda-accordi: manca @@ accordo | ${a}`);
  for (const id of ['scheda-sera', 'scheda-riparare', 'scheda-percorso']) if (!mods[id]?.domande?.length) e.push(`${id}: mancano le domande`);
  for (const [k, m] of Object.entries(mods)) {
    const blob = JSON.stringify(m);
    if ((blob.match(/\[\[/g) || []).length !== (blob.match(/\]\]/g) || []).length) e.push(`${k}: parentesi [[ ]] non bilanciate`);
    if ((blob.match(/\{\{#/g) || []).length + (blob.match(/\{\{\^/g) || []).length !== (blob.match(/\{\{\//g) || []).length) e.push(`${k}: blocchi {{#}} / {{/}} non bilanciati`);
    for (const v of blob.matchAll(/\{\{([#^/]?)(\w+)\}\}/g)) if (!v[1] && !VARS.has(v[2])) e.push(`${k}: variabile sconosciuta {{${v[2]}}}`);
    for (const g of blob.matchAll(/\[\[([a-z]+):/g)) if (!GKEYS.has(g[1])) e.push(`${k}: concordanza sconosciuta [[${g[1]}:`);
    for (const g of blob.matchAll(/\[\[([^\]]*)\]\]/g)) if (!g[1].includes('|')) e.push(`${k}: concordanza senza | in [[${g[1]}]]`);
    if (/\.\.\. /.test(blob)) e.push(`${k}: puntini di sospensione sospetti (bozza non ripulita?)`);
    for (const c of m.curiosita || []) if (!/\(\d{4}\)/.test(c.fonte)) e.push(`${k}: fonte senza anno tra parentesi: ${c.fonte.slice(0, 50)}`);
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
  if (!c) die('noi/assets/content.js mancante o non cifrato: lancia lo script con NOI_PASSWORD.');
  if (!s) die('noi/_sorgenti/contenuti.enc mancante: lancia lo script con NOI_PASSWORD.');
  if (c.hash !== s.hash) die('content.js e contenuti.enc vengono da versioni diverse dei testi: rilancia lo script con NOI_PASSWORD.');
  const cfg = keyCfg();
  if (!/^[0-9a-f]{64}$/.test(cfg.token)) die('assets/gate.js: impronta della password mancante.');
  if (fs.existsSync(path.join(ROOT, 'noi/_sorgenti/contenuti'))) {
    const plain = readPlain();
    if (plain && Object.keys(plain).length) {
      buildLibrary(plain);
      if ((await filesHash(plain)) !== c.hash) die('I testi in _sorgenti/contenuti/ sono cambiati: rilancia lo script con NOI_PASSWORD per aggiornare i file cifrati.');
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
if (k.token !== k.cfg.token) die('La password non corrisponde a quella dell\'area NOI (noi/assets/gate.js). Per cambiarla usa --imposta-password.');

if (has('--apri')) {
  const s = readEnc(ENC_SRC);
  if (!s) die('contenuti.enc non trovato.');
  const files = await decrypt(k.raw, s);
  if (fs.existsSync(SRC) && fs.readdirSync(SRC).some((n) => n.endsWith('.md')) && !has('--forza')) die('_sorgenti/contenuti/ contiene già dei testi: usa --forza per sovrascriverli.');
  fs.mkdirSync(SRC, { recursive: true });
  for (const [n, t] of Object.entries(files)) fs.writeFileSync(path.join(SRC, n), t);
  console.log(`Aperti ${Object.keys(files).length} file in noi/_sorgenti/contenuti/ (esclusi da git). Dopo le modifiche rilancia lo script senza --apri.`);
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
  if (path.resolve(ci).startsWith(path.join(ROOT, 'noi'))) die('--chiaro: scrivi il file fuori dalla cartella pubblicata.');
  fs.writeFileSync(ci, `window.NOI_CONTENT = ${JSON.stringify({ moduli: mods })};\n`);
  console.log('Libreria in chiaro (solo per test) → ' + ci);
  process.exit(0);
}

const prev = readEnc(OUT), prevSrc = readEnc(ENC_SRC);
if (prev?.hash === hash && prevSrc?.hash === hash && !has('--forza')) {
  console.log(`Nessuna modifica ai testi (${Object.keys(mods).length} moduli): file cifrati invariati.`);
  process.exit(0);
}
const c = await encrypt(k.raw, { moduli: mods });
fs.writeFileSync(OUT, `/* NOI — libreria CIFRATA (AES-GCM). FILE GENERATO da scripts/build-noi.mjs: non modificarlo a mano.\n   Si decifra nel browser solo con la password dell'area NOI. */\nwindow.NOI_ENC = ${JSON.stringify({ v: 1, ...c, hash })};\n`);
const s = await encrypt(k.raw, files);
fs.writeFileSync(ENC_SRC, JSON.stringify({ v: 1, ...s, hash }) + '\n');
console.log(`OK: ${Object.keys(mods).length} moduli, circa ${words(mods).toLocaleString('it-IT')} parole → content.js e contenuti.enc cifrati.`);
