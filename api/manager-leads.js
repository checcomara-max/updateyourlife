// Proxy server-side Vercel per l'invio dei soli recapiti al Google Apps Script del titolare.
// Necessario per ricevere una risposta verificabile senza problemi CORS del ContentService.
// Non salva dati, non registra il contenuto della richiesta e non inoltra nulla a Meta.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwrSn79Vrv8rxL6Mw1aymgo4FUdsRxyuYzhfdZCTSzqIRY1RSW7yM-wjaGW0KveCFRI/exec';

function originConsentita(origin) {
  return origin === 'https://www.updateyourlife.it' ||
    origin === 'https://updateyourlife.it' ||
    /^https:\/\/project-30hc5(?:-[a-z0-9-]+)?\.vercel\.app$/.test(origin);
}
function testo(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}
function send(res, code, value) {
  return res.status(code).json(value);
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  // Diagnostica pubblica senza dati personali: permette di verificare che la funzione sia raggiungibile.
  if (req.method === 'GET') return send(res, 200, { status: 'ok', service: 'manager-contact', version: '2026-11-20-2' });
  const origin = req.headers.origin || '';
  if (!originConsentita(origin)) return send(res, 403, { success: false });
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return send(res, 405, { success: false });

  try {
    if (Number(req.headers['content-length'] || '0') > 3500) return send(res, 413, { success: false });
    let d = req.body;
    if (typeof d === 'string') d = JSON.parse(d);
    if (!d || typeof d !== 'object' || Array.isArray(d)) return send(res, 400, { success: false });
    const nome = testo(d.nome, 90), cognome = testo(d.cognome, 90);
    const email = testo(d.email, 180), cellulare = testo(d.cellulare, 20);
    if (!nome || !cognome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !/^\+[1-9]\d{8,14}$/.test(cellulare) ||
        d.formType !== 'manager-call-v1' ||
        d.pagina !== '/psicologo-per-manager/' ||
        d.privacyVersion !== '2026-11-20' ||
        d.contactRequested !== true || d.sensitiveConsent !== true) {
      return send(res, 400, { success: false });
    }
    const payload = {
      formType: 'manager-call-v1', nome, cognome, email, cellulare,
      pagina: '/psicologo-per-manager/', privacyVersion: '2026-11-20',
      contactRequested: true, sensitiveConsent: true,
      startedAt: Number(d.startedAt) || 0,
      honey: testo(d.honey, 70)
    };
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: AbortSignal.timeout(18000)
    });
    if (!response.ok) return send(res, 502, { success: false });
    const text = await response.text();
    const result = JSON.parse(text);
    if (result && result.success === true) return send(res, 200, { success: true });
    return send(res, 502, { success: false });
  } catch (_) {
    // Non includere mai contenuto o dati personali in log o risposta.
    return send(res, 502, { success: false });
  }
}
