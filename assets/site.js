// Update Your Life — consenso, misurazione, menu e contatti.
(function () {
  var ANALYTICS_KEY = 'uyl_cookie_consent';
  var MARKETING_KEY = 'uyl_marketing_consent';
  var GA_ID = 'G-ZEHNGYS0Z9';
  function get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function set(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
  function loadGA() {
    if (window._gaLoaded) return; window._gaLoaded = true;
    window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID; document.head.appendChild(s);
  }

  var pixelId = document.body.getAttribute('data-meta-pixel');
  var pixelLoading = false, pixelReady = false, pixelInitialized = false;
  var marketingAllowed = false, analyticsAllowed = false;

  function canLoadPixel() {
    var url = new URL(window.location.href);
    if (!pixelId || url.origin !== 'https://www.updateyourlife.it' || url.pathname !== '/' || url.hash) return false;

    // Il Pixel può includere URL e referrer nelle richieste. Limita i dati ai riferimenti pubblicitari neutri.
    if (document.referrer &&
        !/^https:\/\/(?:[a-z0-9-]+\.)?(?:facebook\.com|instagram\.com)\/?$/.test(document.referrer)) return false;

    var allowed = new Map([
      ['fbclid', /^[A-Za-z0-9_-]+$/],
      ['utm_source', /^(meta|facebook|instagram|fb|ig)$/i],
      ['utm_medium', /^(cpc|paid|paid_social|social)$/i],
      ['utm_id', /^\d+$/],
      ['utm_campaign', /^\d+$/],
      ['utm_content', /^\d+$/],
      ['utm_term', /^\d+$/]
    ]);
    return Array.from(url.searchParams).every(function (entry) {
      var pattern = allowed.get(entry[0]);
      return !!pattern && pattern.test(entry[1]);
    });
  }

  function applyPixelConsent() {
    if (!pixelReady) return;
    window.fbq('consent', marketingAllowed ? 'grant' : 'revoke');
    if (!marketingAllowed || pixelInitialized || !canLoadPixel()) return;

    pixelInitialized = true;
    window.fbq('set', 'autoConfig', false, pixelId);
    window.fbq.disablePushState = true;
    window.fbq('init', pixelId);
    window.fbq('trackSingle', pixelId, 'PageView');
  }

  function loadPixel() {
    if (pixelLoading || pixelReady || !canLoadPixel()) return;
    pixelLoading = true;
    var fbq = function () {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
      else fbq.queue.push(arguments);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = window._fbq = fbq;

    var script = document.createElement('script');
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.onload = function () {
      pixelLoading = false;
      pixelReady = true;
      applyPixelConsent();
    };
    script.onerror = function () {
      pixelLoading = false;
      script.remove();
    };
    document.head.appendChild(script);
  }

  function clearFirstPartyCookies(names) {
    names.forEach(function (name) {
      var expired = name + '=; Max-Age=0; Path=/; Secure';
      document.cookie = expired;
      document.cookie = expired + '; Domain=' + window.location.hostname;
      document.cookie = expired + '; Domain=updateyourlife.it';
    });
  }

  var banner = document.getElementById('cookie');
  var form = document.getElementById('cookie-options');
  var analyticsOption = document.getElementById('cookie-analytics');
  var marketingOption = document.getElementById('cookie-marketing');
  var ok = document.getElementById('cookie-ok'), no = document.getElementById('cookie-no');
  var status = document.getElementById('cookie-status');

  function applyPreferences(analytics, marketing) {
    analyticsAllowed = analytics === 'all';
    marketingAllowed = marketing === 'granted';
    window['ga-disable-' + GA_ID] = !analyticsAllowed;
    if (analyticsAllowed) loadGA();
    if (marketingAllowed) loadPixel();
    applyPixelConsent();
  }

  function syncPreferences() {
    var analytics = get(ANALYTICS_KEY);
    var marketing = get(MARKETING_KEY);
    applyPreferences(analytics, marketing);
    if (banner) {
      // Un vecchio consenso alle sole statistiche non autorizza Meta.
      var needsChoice = !analytics || (pixelId && analytics === 'all' && !marketing);
      banner.hidden = !needsChoice || (form && window.location.hash === '#preferenze-cookie');
    }
    if (form) {
      analyticsOption.checked = analyticsAllowed;
      marketingOption.checked = marketingAllowed;
      form.hidden = false;
    }
  }

  function savePreferences(analytics, marketing) {
    set(ANALYTICS_KEY, analytics);
    set(MARKETING_KEY, marketing);
    applyPreferences(analytics, marketing);
    if (analytics === 'necessary') clearFirstPartyCookies(['_ga', '_ga_' + GA_ID.slice(2)]);
    if (marketing === 'denied') clearFirstPartyCookies(['_fbp', '_fbc']);
    if (banner) banner.hidden = true;
    if (form) {
      analyticsOption.checked = analyticsAllowed;
      marketingOption.checked = marketingAllowed;
      status.textContent = 'Preferenze salvate.';
    }
  }

  syncPreferences();
  if (ok) ok.onclick = function () { savePreferences('all', 'granted'); };
  if (no) no.onclick = function () { savePreferences('necessary', 'denied'); };
  if (form) {
    window.addEventListener('hashchange', syncPreferences);
    form.addEventListener('change', function () { status.textContent = ''; });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      savePreferences(analyticsOption.checked ? 'all' : 'necessary', marketingOption.checked ? 'granted' : 'denied');
    });
  }
  window.addEventListener('storage', function (event) {
    if (event.key === ANALYTICS_KEY || event.key === MARKETING_KEY || event.key === null) syncPreferences();
  });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) syncPreferences();
  });

  // Indica la provenienza nel contatto che il visitatore può modificare prima dell’invio.
  if (document.body.hasAttribute('data-campaign-contact')) {
    var campaign = new URLSearchParams(window.location.search);
    var source = campaign.get('utm_source');
    var platform = source === 'google' ? 'Google' : '';
    if (source === 'chatgpt' && document.body.getAttribute('data-campaign-contact') === 'chatgpt') {
      platform = 'ChatGPT';
    }
    if (platform && campaign.get('utm_medium') === 'cpc') {
      document.querySelectorAll('a[data-contatto^="whatsapp-"][href^="https://wa.me/"]').forEach(function (link) {
        var url = new URL(link.href);
        var message = url.searchParams.get('text');
        if (!message) return;
        url.searchParams.set('text', message + ' Ho visto il tuo annuncio su ' + platform + '.');
        link.href = url.href;
      });
      if (platform === 'ChatGPT') {
        var email = document.querySelector('a[data-contatto^="email-"][href^="mailto:"]');
        if (email) {
          var mailUrl = new URL(email.href);
          var subject = mailUrl.searchParams.get('subject');
          if (subject) {
            // I client di posta si aspettano spazi percent-encoded nel mailto.
            email.href = 'mailto:' + mailUrl.pathname + '?subject=' + encodeURIComponent(subject + ' (ChatGPT Ads)');
          }
        }
      }
    }
  }

  // Contatti: traccia solo il clic, non una richiesta realmente ricevuta.
  // L'evento viene inviato solo dopo il consenso ai cookie analitici.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-contatto]'); if (!a || !analyticsAllowed || !window.gtag) return;
    var m = a.getAttribute('data-contatto');
    gtag('event', 'contact_click', { metodo: m.split('-')[0], posizione: m });
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
