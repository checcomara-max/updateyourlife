// Update Your Life — script condiviso: consenso cookie + Google Analytics, misura contatti, menu mobile, barra WhatsApp mobile.
(function () {
  var KEY = 'uyl_cookie_consent';
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function loadGA() {
    if (window._gaLoaded) return; window._gaLoaded = true;
    window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', 'G-ZEHNGYS0Z9', { anonymize_ip: true });
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=G-ZEHNGYS0Z9'; document.head.appendChild(s);
  }

  // Cookie
  var banner = document.getElementById('cookie'), c = get();
  if (c === 'all') loadGA();
  else if (!c && banner) banner.classList.add('show');
  var ok = document.getElementById('cookie-ok'), no = document.getElementById('cookie-no');
  if (ok) ok.onclick = function () { set('all'); banner.classList.remove('show'); loadGA(); };
  if (no) no.onclick = function () { set('necessary'); banner.classList.remove('show'); };

  // Contatti: evento generate_lead (solo con consenso analitico)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-contatto]'); if (!a || !window.gtag) return;
    var m = a.getAttribute('data-contatto');
    gtag('event', 'generate_lead', { metodo: m.split('-')[0], posizione: m });
  });

  // Menu mobile
  var top = document.querySelector('.top'), burger = document.getElementById('burger');
  if (top && burger) {
    burger.onclick = function () {
      var open = top.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    };
    top.querySelectorAll('.menu a').forEach(function (a) {
      a.addEventListener('click', function () { top.classList.remove('open'); burger.setAttribute('aria-expanded', false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && top.classList.contains('open')) { top.classList.remove('open'); burger.setAttribute('aria-expanded', false); burger.focus(); }
    });
  }

  // Barra WhatsApp su mobile: compare dopo l'apertura della pagina, sparisce sulla fascia contatti
  var sticky = document.getElementById('sticky'), hero = document.querySelector('[data-hero]'), contact = document.querySelector('[data-contact]');
  if (sticky && hero && 'IntersectionObserver' in window) {
    var heroOut = false, contactIn = false;
    var upd = function () { sticky.classList.toggle('on', heroOut && !contactIn); };
    new IntersectionObserver(function (e) { heroOut = !e[0].isIntersecting; upd(); }).observe(hero);
    if (contact) new IntersectionObserver(function (e) { contactIn = e[0].isIntersecting; upd(); }).observe(contact);
  }
})();
