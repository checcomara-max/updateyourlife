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

  // Compone il libro dalle risposte salvate (richiede engine.js, book.js e la libreria decifrata).
  // La data di composizione resta quella del primo libro composto con le stesse risposte.
  function composeBook() {
    var s = get();
    var a = Object.assign({ genere: s.genere }, s.risposte || {});
    var code = s.codice || window.UDU.encode(a);
    var when = s.composto && s.composto.codice === code ? new Date(s.composto.data) : new Date();
    if (!s.composto || s.composto.codice !== code) set({ composto: { codice: code, data: when.toISOString() } });
    return window.UDUBook.compose(window.UDU.score(a), { nome: s.nome, obiettivo: s.obiettivo }, { code: code, now: when });
  }
  var pdfLoading = null;
  function loadPdfmake() {
    if (window.pdfMake) return Promise.resolve();
    if (pdfLoading) return pdfLoading;
    pdfLoading = new Promise(function (res, rej) {
      var sc = document.createElement('script');
      sc.src = '/uno-di-uno/assets/vendor/pdfmake.min.js';
      sc.onload = res;
      sc.onerror = function () { pdfLoading = null; rej(new Error('impossibile caricare il generatore PDF')); };
      document.head.appendChild(sc);
    });
    return pdfLoading;
  }
  async function downloadBook(book) {
    await loadPdfmake();
    await window.UDUBook.downloadPDF(book, location.origin + '/uno-di-uno/assets/fonts/');
  }
  window.UDUFlow = { composeBook: composeBook, downloadBook: downloadBook };
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
