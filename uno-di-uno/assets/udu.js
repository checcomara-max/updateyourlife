/* Uno di Uno — utilità condivise dalle pagine del percorso.
   Le risposte restano SOLO in questo browser (localStorage), non vengono inviate a nessun server. */
(function () {
  var KEY = 'udu-v2-stato';
  function get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function set(patch) {
    var s = Object.assign(get(), patch);
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    return s;
  }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) {} }
  function exit() { try { localStorage.removeItem('udu-accesso'); } catch (e) {} location.href = '/uno-di-uno/'; }
  window.UDUStore = { get: get, set: set, clear: clear, exit: exit };

  // Decifra la libreria (assets/content.js → window.UDU_ENC) con la chiave salvata dopo la password.
  var loading = null;
  function loadContent() {
    if (window.UDU_CONTENT) return Promise.resolve(window.UDU_CONTENT);
    if (loading) return loading;
    loading = (async function () {
      var enc = window.UDU_ENC, k = null;
      try { k = localStorage.getItem('udu-chiave'); } catch (e) {}
      if (!enc) throw new Error('libreria non caricata');
      if (!k) { exit(); throw new Error('accesso scaduto'); }
      var unb64 = function (s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); };
      var key = await crypto.subtle.importKey('raw', unb64(k), 'AES-GCM', false, ['decrypt']);
      var pt;
      try { pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(enc.iv) }, key, unb64(enc.data)); }
      catch (e) { exit(); throw new Error('chiave non valida'); }
      var stream = new Blob([pt]).stream().pipeThrough(new DecompressionStream('gzip'));
      window.UDU_CONTENT = JSON.parse(await new Response(stream).text());
      return window.UDU_CONTENT;
    })();
    return loading;
  }
  window.UDUContent = { load: loadContent };
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-esci]');
    if (t) { e.preventDefault(); exit(); }
    var c = e.target.closest('[data-cancella]');
    if (c) {
      e.preventDefault();
      if (confirm('Vuoi cancellare da questo browser le risposte, il nome e l’obiettivo? Non si possono recuperare.')) { clear(); location.href = '/uno-di-uno/scopri/'; }
    }
  });
})();
