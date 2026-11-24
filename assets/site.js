// Update Your Life — consenso, misurazione, menu e contatti.
(function () {
  var ANALYTICS_KEY = 'uyl_cookie_consent';
  var MARKETING_KEY = 'uyl_marketing_consent';
  var GA_ID = 'G-ZEHNGYS0Z9';
  function get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function set(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
  var isManagerLanding = document.body.classList.contains('manager-landing');
  var isProductionDomain = /^(?:www\.)?updateyourlife\.it$/.test(location.hostname);

  // Sulla landing manager usiamo solo statistiche del traffico, non dettagli dei moduli.
  // Le anteprime Vercel non devono inquinare la proprietà GA4 di produzione.
  function managerGAConfig() {
    var config = {
      page_location: 'https://www.updateyourlife.it/psicologo-per-manager/',
      page_title: 'Psicologo per manager | Update Your Life',
      // Mai inoltrare a GA4 un referrer completo, che potrebbe contenere query o identificativi.
      page_referrer: ''
    };
    try {
      if (document.referrer) {
        var ref = new URL(document.referrer);
        if (ref.protocol === 'https:' || ref.protocol === 'http:') {
          config.page_referrer = ref.origin + '/';
        }
      }
    } catch (_) {}
    var query = new URLSearchParams(location.search);
    // Solo etichette neutre, non identificativi personali o query arbitrarie.
    var source = query.get('utm_source') || '';
    var medium = query.get('utm_medium') || '';
    var campaign = query.get('utm_campaign') || '';
    var content = query.get('utm_content') || '';
    var campaignId = query.get('utm_id') || '';
    var sources = ['meta', 'facebook', 'instagram', 'google', 'newsletter'];
    var media = ['paid_social', 'cpc', 'social', 'organic', 'email'];
    if (sources.indexOf(source) !== -1 && media.indexOf(medium) !== -1) {
      config.campaign_source = source;
      config.campaign_medium = medium;
      if (/^[a-z0-9_-]{1,48}$/.test(campaign)) config.campaign_name = campaign;
      if (/^[a-z0-9_-]{1,48}$/.test(content)) config.campaign_content = content;
      if (/^\d{1,30}$/.test(campaignId)) config.campaign_id = campaignId;
    }
    return config;
  }
  function loadGA() {
    if (window._gaLoaded || (isManagerLanding && !isProductionDomain)) return;
    window._gaLoaded = true;
    window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    var config = {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    };
    if (isManagerLanding) Object.assign(config, managerGAConfig());
    gtag('config', GA_ID, config);
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  var pixelId = document.body.getAttribute('data-meta-pixel');
  window.uylMetaDebug = window.uylMetaDebug || { pixelId: pixelId || '', consent: false, scriptLoaded: false, pageViewCalled: false, leadCalled: false };
  var pixelLoading = false, pixelReady = false, pixelInitialized = false;
  var marketingAllowed = false, analyticsAllowed = false;

  function canLoadPixel() {
    var url = new URL(window.location.href);
    var allowedPixelPath = url.pathname === '/' || url.pathname === '/decisioni-manager/';
    if (!pixelId || url.origin !== 'https://www.updateyourlife.it' || !allowedPixelPath || url.hash) return false;

    // Il Pixel può includere URL e referrer nelle richieste. Limita il caricamento alle pagine abilitate e a parametri pubblicitari neutri.
    if (document.referrer &&
        !/^https:\/\/(?:[a-z0-9-]+\.)?(?:facebook\.com|instagram\.com)\/?$/.test(document.referrer)) return false;

    var allowed = new Map([
      ['fbclid', /^[A-Za-z0-9_-]+$/],
      ['utm_source', /^(meta|facebook|instagram|fb|ig)$/i],
      ['utm_medium', /^(cpc|paid|paid_social|social)$/i],
      ['utm_id', /^\d+$/],
      ['utm_campaign', /^[a-z0-9_-]{1,48}$/i],
      ['utm_content', /^[a-z0-9_-]{1,48}$/i],
      ['utm_term', /^\d+$/],
      ['debug_pixel', /^1$/]
    ]);
    return Array.from(url.searchParams).every(function (entry) {
      var pattern = allowed.get(entry[0]);
      return !!pattern && pattern.test(entry[1]);
    });
  }

  function applyPixelConsent() {
    if (!pixelReady) return;
    window.fbq('consent', marketingAllowed ? 'grant' : 'revoke');
    window.uylMetaDebug.consent = !!marketingAllowed;
    if (!marketingAllowed || pixelInitialized || !canLoadPixel()) return;

    pixelInitialized = true;
    window.fbq('set', 'autoConfig', false, pixelId);
    window.fbq.disablePushState = true;
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
    window.uylMetaDebug.pageViewCalled = true;
    window.dispatchEvent(new CustomEvent('uyl-meta-debug-update'));
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
      window.uylMetaDebug.scriptLoaded = true;
      window.dispatchEvent(new CustomEvent('uyl-meta-debug-update'));
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
    if ((source === 'chatgpt' || source === 'chatgpt_ads') && document.body.getAttribute('data-campaign-contact') === 'chatgpt') {
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
    var a = e.target.closest && e.target.closest('[data-contatto]'); if (!a || !analyticsAllowed || !window.gtag || isManagerLanding) return;
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
