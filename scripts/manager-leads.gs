/**
 * Backend separato per le richieste manager, da distribuire come Web App.
 * Google Apps Script -> Esegui come ME -> accesso CHIUNQUE.
 * Nessun foglio Google. Nessun dato clinico chiesto.
 */
const DESTINATARIO = 'francescomaragliulo@gmail.com';
const VERSIONE_PRIVACY = '2026-11-20';

function doGet() {
  return jsonResponse({ ready: true });
}

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) || '';
    if (!raw || raw.length > 6000) return jsonResponse({ success: false });
    const d = JSON.parse(raw);
    if (d.honey) return jsonResponse({ success: true }); // honeypot antispam
    if (d.formType !== 'manager-call-v1' ||
        d.privacyVersion !== VERSIONE_PRIVACY ||
        d.contactRequested !== true || d.sensitiveConsent !== true ||
        d.pagina !== '/psicologo-per-manager/') return jsonResponse({ success: false });

    const first = clean(d.nome, 90), last = clean(d.cognome, 90);
    const email = clean(d.email, 180), tel = clean(d.cellulare, 20);
    if (!first || !last ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !/^\+[1-9]\d{8,14}$/.test(tel)) return jsonResponse({ success: false });
    if (Date.now() - Number(d.startedAt) < 1000) return jsonResponse({ success: false });

    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, (email + '|' + tel).toLowerCase());
    const key = 'manager-' + digest.map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('').slice(0, 40);
    const cache = CacheService.getScriptCache();
    const lock = LockService.getScriptLock();
    lock.waitLock(5000);
    try {
      if (cache.get(key)) return jsonResponse({ success: true });
      const received = Utilities.formatDate(new Date(), 'Europe/Rome', 'yyyy-MM-dd HH:mm:ss');
      const body = [
        'Nuova richiesta: call conoscitiva manager (20 minuti).', '',
        'Nome: ' + first,
        'Cognome: ' + last,
        'Email: ' + email,
        'Numero WhatsApp: ' + tel, '',
        'Ricontattare personalmente via WhatsApp per concordare la call.',
        'Ricevuta il: ' + received + ' (Europe/Rome)',
        'Origine: /psicologo-per-manager/',
        'Versione informativa: ' + VERSIONE_PRIVACY,
        'Richiesta espressa di ricontatto WhatsApp: sì',
        'Consenso esplicito per eventuali dati indirettamente sensibili: sì'
      ].join('\n');
      MailApp.sendEmail({
        to: DESTINATARIO, subject: 'Nuova richiesta di contatto dal sito',
        body: body, replyTo: email, name: 'Update Your Life – Modulo web'
      });
      cache.put(key, '1', 90);
    } finally {
      lock.releaseLock();
    }
    return jsonResponse({ success: true });
  } catch (ex) {
    // Non scrivere payload o dati personali nei log.
    return jsonResponse({ success: false });
  }
}
function clean(value, max) {
  return String(value || '').replace(/[\r\n\t\u0000-\u001f]/g, ' ').trim().slice(0, max);
}
function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}