/* NOI — controllo d'accesso dell'area riservata.
   Caricato nel <head> di ogni pagina, PRIMA del CSS. Sulle sottopagine, se l'accesso non è stato sbloccato su /noi/
   con la password, rimanda lì (conservando l'eventuale invito personale nell'indirizzo, dopo il #).
   La password non è nel codice. Da password + salt si ricavano (PBKDF2-SHA256) 512 bit: i primi 256 sono la chiave AES
   che decifra la libreria dei testi (assets/content.js), gli altri 256 sono l'impronta qui sotto, che serve solo a
   riconoscere la password giusta. Per cambiarla: scripts/build-noi.mjs --imposta-password.
   ATTENZIONE: è una tenda, non una cassaforte. Le risposte delle coppie sono protette da un'altra chiave (assets/chiave.js). */
window.NOI_KEYCFG = { salt: 'qeF2ybEFjBq7SV2UFzRBpg==', iter: 310000, token: '340e9af695cfa7cc087542f8363fdb321be827dfb07981daeb81634f4c1310d7' };
(function () {
  if (/^\/noi\/(index\.html)?$/.test(location.pathname)) return;
  var ok = false;
  try { ok = localStorage.getItem('noi-accesso') === window.NOI_KEYCFG.token && !!localStorage.getItem('noi-chiave'); } catch (e) {}
  if (!ok) {
    try { if (location.hash) sessionStorage.setItem('noi-hash', location.hash); } catch (e) {}
    location.replace('/noi/?da=' + encodeURIComponent(location.pathname));
    document.documentElement.className += ' noi-lock';
  }
})();
