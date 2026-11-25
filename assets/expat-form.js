/* Modulo manager: non inviare dati personali a servizi analitici o URL. */
(function () {
  'use strict';
  var path = location.pathname.replace(/\/?$/, '/');
  if (!["/psicologo-online-italiani-estero/","/psicologo-online-italiani-estero/spagna/","/psicologo-online-italiani-estero/germania/","/psicologo-online-italiani-estero/parigi/"].includes(path)) return;
  var mount = document.querySelector('#inizia .contact-list');
  if (!mount) return;
  var panel = document.createElement('div');
  panel.className = 'expat-form-panel';
  panel.innerHTML = `<form id="expat-lead-form" novalidate aria-labelledby="expat-form-title">
    <h3 id="expat-form-title">Preferisci che sia io a ricontattarti?</h3>
    <p>Lascia i recapiti per concordare la call gratuita di 20 minuti. Non inserire informazioni cliniche.</p>
    <div class="expat-fields">
    <label>Nome <input name="nome" required autocomplete="given-name" maxlength="90"></label>
    <label>Cognome <input name="cognome" required autocomplete="family-name" maxlength="90"></label>
    <label>Email <input name="email" type="email" required autocomplete="email" maxlength="180"></label>
    <label>WhatsApp con prefisso <input name="cellulare" type="tel" required autocomplete="tel" maxlength="23" placeholder="+39…"></label>
    <label>Paese in cui ti trovi <select name="paese" required><option value="">Seleziona</option><option>Spagna</option><option>Germania</option><option>Francia</option><option>Altro</option></select></label>
    </div>
    <label class="expat-consent"><input name="privacy" type="checkbox" required><span>Ho letto l’<a href="/privacy-policy.html#call-estero" target="_blank" rel="noopener">informativa privacy</a> e acconsento esplicitamente al trattamento dei dati, anche eventualmente relativi alla salute, esclusivamente per organizzare la call conoscitiva.</span></label>
    <div hidden aria-hidden="true"><label>Lascia vuoto <input name="website" tabindex="-1" autocomplete="off"></label></div>
    <p id="expat-form-error" role="alert" hidden></p>
    <button class="btn btn-wa" id="expat-form-submit" type="submit"><span>Chiedi di essere ricontattato</span></button>
  </form>
  <div id="expat-form-success" role="status" tabindex="-1" hidden><h3>Grazie, <span id="expat-success-name"></span>. Ho ricevuto la richiesta.</h3><p>Ti ricontatterò personalmente su WhatsApp per concordare la call, dopo aver verificato la disponibilità del servizio.</p></div>
  <p class="note">In alternativa, scrivimi direttamente su WhatsApp qui sotto.</p>`;
  mount.prepend(panel);
  var f = document.getElementById('expat-lead-form');
  // Invio attraverso la funzione Vercel: questa conferma che Google Apps Script abbia risposto.
  // Le pagine GitHub Pages usano il dominio di produzione Vercel per la sola API.
  // Vercel usa trailingSlash:true: usare direttamente la rotta canonica con / finale.
  // Sull'anteprima Vercel chiamiamo la stessa origin; sul dominio pubblico l'API Vercel.
  var ENDPOINT = /\.vercel\.app$/.test(location.hostname) ? '/api/expat-leads/' : 'https://project-30hc5.vercel.app/api/expat-leads/';
  var err = document.getElementById('expat-form-error');
  var done = document.getElementById('expat-form-success');
  var btn = document.getElementById('expat-form-submit');
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
    if (!['Spagna','Germania','Francia','Altro'].includes(val('paese'))) return fail('Seleziona il Paese in cui ti trovi.', fields.namedItem('paese'));
    if (!fields.namedItem('privacy').checked) return fail("Per inviare la richiesta, leggi l'informativa ed esprimi il consenso al trattamento dei dati per il ricontatto.", fields.namedItem('privacy'));
    if (!ENDPOINT) return fail('Il modulo non è ancora attivo. Usa il pulsante WhatsApp subito sotto per organizzare la call.');

    var payload = {
      formType: 'expat-call-v1',
      nome: nome, cognome: cognome, email: email, cellulare: tel,
      pagina: path,
      paese: val('paese'),
      provenienza: new URLSearchParams(location.search).get('utm_source') === 'google' && new URLSearchParams(location.search).get('utm_medium') === 'cpc' ? 'google_ads' : 'non_specificata',
      privacyVersion: '2026-11-25',
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
    .then(function(r) {
      if (!r.ok) throw Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(reply) {
      if (!reply || reply.success !== true) throw Error('server');
      f.hidden = true;
      document.getElementById('expat-success-name').textContent = nome;
      done.hidden = false; done.focus();
      // Nessun evento pubblicitario o analitico associato al contatto.
    })
    .catch(function(error) {
      var reason = error && /^HTTP [0-9]{3}$/.test(error.message || '') ? ' (' + error.message + ')' : '';
      fail("Non posso confermare che la richiesta sia stata ricevuta" + reason + ". Puoi scrivermi direttamente su WhatsApp usando il pulsante qui sotto.");
    })
    .finally(function() { btn.disabled = false; label.textContent = 'Chiedi di essere ricontattato'; });
  });
})();