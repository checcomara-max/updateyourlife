/* Uno di Uno — controllo d'accesso dell'anteprima riservata.
   Va caricato nel <head> di ogni pagina protetta, PRIMA del CSS: se l'accesso non è stato sbloccato
   su /uno-di-uno/ con la password, rimanda lì. È una "tenda" per tenere fuori visitatori e motori
   di ricerca durante i lavori, non una protezione crittografica: il codice del sito è pubblico.
   Nel repository c'è solo l'impronta SHA-256 della password, mai la password in chiaro. */
(function () {
  var TOKEN = '3229c601a46ada7237481d94fe4bcf0ec856cdd5070db332e5577f84561eed3b';
  var ok = false;
  try { ok = localStorage.getItem('udu-accesso') === TOKEN; } catch (e) {}
  if (!ok) {
    location.replace('/uno-di-uno/?da=' + encodeURIComponent(location.pathname));
    document.documentElement.className += ' udu-lock';
  }
})();
