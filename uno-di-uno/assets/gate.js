/* Uno di Uno — controllo d'accesso dell'anteprima riservata.
   Caricato nel <head> di ogni pagina, PRIMA del CSS. Sulle sottopagine, se l'accesso non è stato
   sbloccato su /uno-di-uno/ con la password, rimanda lì.
   La password non è nel codice. Da password + salt si ricavano (PBKDF2-SHA256) 512 bit: i primi 256 sono la
   chiave AES che decifra la libreria (assets/content.js), gli altri 256 sono l'impronta qui sotto, che serve
   solo a riconoscere la password giusta. Per cambiarla: scripts/build-uno-di-uno.mjs --imposta-password. */
window.UDU_KEYCFG = { salt: 'lb5cheojVLLztyHAtcC5vQ==', iter: 310000, token: '9fd6b40d9994d7c2812359f5d855a90aac6f009d11056ea00a57fcb9e49d833a' };
(function () {
  if (/^\/uno-di-uno\/(index\.html)?$/.test(location.pathname)) return;
  var ok = false;
  try { ok = localStorage.getItem('udu-accesso') === window.UDU_KEYCFG.token && !!localStorage.getItem('udu-chiave'); } catch (e) {}
  if (!ok) {
    location.replace('/uno-di-uno/?da=' + encodeURIComponent(location.pathname));
    document.documentElement.className += ' udu-lock';
  }
})();
