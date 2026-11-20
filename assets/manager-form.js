/* Modulo manager: non inviare dati personali a servizi analitici o URL. */
(function () {
  'use strict';
  var f = document.getElementById('manager-lead-form');
  if (!f) return;
  // Inserire qui l'URL /exec della Web App dedicata solo dopo il test del backend.
  var ENDPOINT = '';
  var err = document.getElementById('manager-form-error');
  var done = document.getElementById('manager-form-success');
  var btn = document.getElementById('manager-form-submit');
  var label = btn.querySelector('span');
  var startedAt = Date.now();
  var fields = f.elements;

  function val(name) { return String(fields.namedItem(name).value || '').trim(); }
  function fail(msg, el) {
    err.textContent = msg; err.hidden = false;
    if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
  }
  function clear(e) {
    err.hidden = true;
    if (e.target && e.target.removeAttribute) e.target.removeAttribute('aria-invalid');
  }
  function phone(raw) {
    var s = raw.replace(/[\s().-]/g, '');
    if (/^00/.test(s)) s = '+' + s.slice(2);
    if (/^3\d{8,9}$/.test(s)) s = '+39' + s;
    return s;
  }
  f.addEventListener('input', clear);
  f.addEventListener('change', clear);
  f.addEventListener('submit', function(e) {
    e.preventDefault(); clear(e);
    var nome = val('nome'), cognome = val('cognome'), email = val('email');
    var tel = phone(val('cellulare'));
    if (!nome || nome.length > 90) return fail('Inserisci un nome valido.', fields.namedItem('nome'));
    if (!cognome || cognome.length > 90) return fail('Inserisci un cognome valido.', fields.namedItem('cognome'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 180) return fail("Controlla l'indirizzo email.", fields.namedItem('email'));
    if (!/^\+[1-9]\d{8,14}$/.test(tel)) return fail('Inserisci un numero WhatsApp valido con prefisso internazionale (es. +39).', fields.namedItem('cellulare'));
    if (!fields.namedItem('privacy').checked) return fail("Conferma di aver letto l'informativa e di richiedere il ricontatto.", fields.namedItem('privacy'));
    if (!fields.namedItem('sensitive').checked) return fail('Per inviare il modulo è necessario il consenso esplicito indicato.', fields.namedItem('sensitive'));
    if (!ENDPOINT) return fail('Il modulo non è ancora attivo. Usa il pulsante WhatsApp subito sotto per organizzare la call.');

    var payload = {
      formType: 'manager-call-v1',
      nome: nome, cognome: cognome, email: email, cellulare: tel,
      pagina: '/psicologo-per-manager/',
      privacyVersion: '2026-11-20',
      contactRequested: true,
      sensitiveConsent: true,
      startedAt: startedAt,
      honey: val('website')
    };
    btn.disabled = true; label.textContent = 'Invio in corso…';
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    })
    .then(function(r) { if (!r.ok) throw Error('network'); return r.json(); })
    .then(function(reply) {
      if (!reply || reply.success !== true) throw Error('server');
      f.hidden = true;
      document.getElementById('manager-success-name').textContent = nome;
      done.hidden = false; done.focus();
    })
    .catch(function() {
      fail("Non posso confermare che la richiesta sia stata ricevuta. Puoi scrivermi direttamente su WhatsApp usando il pulsante qui sotto.");
    })
    .finally(function() { btn.disabled = false; label.textContent = 'Chiedi di essere ricontattato'; });
  });
})();