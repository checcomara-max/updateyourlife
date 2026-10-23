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
