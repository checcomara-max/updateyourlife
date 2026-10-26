/* NOI — utilità condivise dalle pagine dell'area riservata.
   - Stato locale (localStorage): le risposte restano in questo browser finché non vengono sigillate e inviate.
   - Inviti: dati minimi (codice coppia, nomi, forma grammaticale) codificati nell'indirizzo DOPO il #, che non arriva al server.
   - Busta: le risposte sono cifrate con la chiave pubblica di Francesco (ECDH P-256 + HKDF + AES-256-GCM).
     Solo la sua chiave privata, che non è nel sito né nel repository, può aprirle.
   - Libreria dei testi: cifrata con la password dell'area, decifrata solo nello studio. */
(function () {
  var W = window;
  // ---------- base64url ----------
  function b64u(u8) { var s = ''; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64u(s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); }
  var enc = new TextEncoder(), dec = new TextDecoder();

  // ---------- stato locale ----------
  function get(key) { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; } }
  function set(key, patch) { var s = Object.assign(get(key), patch); try { localStorage.setItem(key, JSON.stringify(s)); } catch (e) {} return s; }
  function del(key) { try { localStorage.removeItem(key); } catch (e) {} }
  function exit() { try { localStorage.removeItem('noi-accesso'); localStorage.removeItem('noi-chiave'); } catch (e) {} location.href = '/noi/'; }
  W.NOIStore = { get: get, set: set, del: del, exit: exit };

  // ---------- inviti ----------
  var ALF = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  function coupleId() { var r = crypto.getRandomValues(new Uint8Array(6)), s = ''; for (var i = 0; i < 6; i++) s += ALF.charAt(r[i] % 32); return s; }
  // r = 'A' | 'B'; n/g = chi riceve; an/ag = l'altra persona
  function encodeInvite(o) { return b64u(enc.encode(JSON.stringify({ v: 1, c: o.c, r: o.r, n: o.n, g: o.g, an: o.an, ag: o.ag }))); }
  function decodeInvite(s) {
    try {
      var o = JSON.parse(dec.decode(unb64u(s)));
      if (o.v !== 1 || !/^[2-9A-HJ-NP-Z]{6}$/.test(o.c) || !/^[AB]$/.test(o.r) || !o.n || !o.an || !/^[FMN]$/.test(o.g) || !/^[FMN]$/.test(o.ag)) return null;
      o.n = String(o.n).slice(0, 30); o.an = String(o.an).slice(0, 30);
      return o;
    } catch (e) { return null; }
  }
  W.NOIInvite = { id: coupleId, encode: encodeInvite, decode: decodeInvite };

  // ---------- contatti ----------
  function phone(s) {
    var d = String(s || '').replace(/[^\d+]/g, '');
    if (!d) return '';
    if (d.indexOf('+') === 0) d = d.slice(1); else if (d.indexOf('00') === 0) d = d.slice(2); else if (/^3\d{8,9}$/.test(d)) d = '39' + d;
    return /^\d{8,15}$/.test(d) ? d : '';
  }
  function wa(num, text) { return 'https://wa.me/' + (num || '') + '?text=' + encodeURIComponent(text); }
  function mail(to, subject, body) { return 'mailto:' + encodeURIComponent(to || '') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body); }
  W.NOIContact = { phone: phone, wa: wa, mail: mail, FRANCESCO_WA: '393314980002', FRANCESCO_MAIL: 'francescomaragliulo@gmail.com' };

  // ---------- busta cifrata (risposte → Francesco) ----------
  async function compress(u8) {
    if (typeof CompressionStream === 'undefined') return { flag: 0, data: u8 };
    var s = new Blob([u8]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return { flag: 1, data: new Uint8Array(await new Response(s).arrayBuffer()) };
  }
  async function decompress(flag, u8) {
    if (flag === 0) return u8;
    var s = new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  async function aesKey(shared, epkRaw, usage) {
    var hk = await crypto.subtle.importKey('raw', shared, 'HKDF', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: epkRaw, info: enc.encode('NOI1') }, hk, { name: 'AES-GCM', length: 256 }, false, [usage]);
  }
  async function seal(obj) {
    var PK = W.NOI_PUBKEY;
    var pub = await crypto.subtle.importKey('jwk', PK.jwk, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    var eph = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    var epkRaw = new Uint8Array(await crypto.subtle.exportKey('raw', eph.publicKey));
    var shared = await crypto.subtle.deriveBits({ name: 'ECDH', public: pub }, eph.privateKey, 256);
    var key = await aesKey(shared, epkRaw, 'encrypt');
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var c = await compress(enc.encode(JSON.stringify(obj)));
    var ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, c.data));
    var out = new Uint8Array(1 + 65 + 12 + ct.length);
    out[0] = c.flag; out.set(epkRaw, 1); out.set(iv, 66); out.set(ct, 78);
    return 'NOI1.' + PK.id + '.' + b64u(out);
  }
  // Estrae tutte le buste da un testo incollato (messaggio WhatsApp o email)
  function findEnvelopes(text) { return (String(text).match(/NOI1\.[0-9a-f]{8}\.[A-Za-z0-9_-]{60,}/g) || []); }
  async function open(envelope, privateKey, keyId) {
    var parts = String(envelope).trim().split('.');
    if (parts.length !== 3 || parts[0] !== 'NOI1') throw new Error('Busta non riconosciuta.');
    if (keyId && parts[1] !== keyId) throw new Error('Questa busta è stata cifrata per un’altra chiave (' + parts[1] + ').');
    var raw = unb64u(parts[2]);
    var epkRaw = raw.slice(1, 66), iv = raw.slice(66, 78), ct = raw.slice(78);
    var epk = await crypto.subtle.importKey('raw', epkRaw, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    var shared = await crypto.subtle.deriveBits({ name: 'ECDH', public: epk }, privateKey, 256);
    var key = await aesKey(shared, epkRaw, 'decrypt');
    var pt;
    try { pt = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ct)); }
    catch (e) { throw new Error('Busta danneggiata o incompleta: chiedi di inviarla di nuovo.'); }
    return JSON.parse(dec.decode(await decompress(raw[0], pt)));
  }
  W.NOISeal = { seal: seal, open: open, find: findEnvelopes };

  // ---------- libreria cifrata (solo studio) ----------
  var loading = null;
  function loadContent() {
    if (W.NOI_CONTENT) return Promise.resolve(W.NOI_CONTENT);
    if (loading) return loading;
    loading = (async function () {
      var e = W.NOI_ENC, k = null;
      try { k = localStorage.getItem('noi-chiave'); } catch (x) {}
      if (!e) throw new Error('libreria non caricata');
      if (!k) { exit(); throw new Error('accesso scaduto'); }
      var unb64 = function (s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); };
      var key = await crypto.subtle.importKey('raw', unb64(k), 'AES-GCM', false, ['decrypt']);
      var pt;
      try { pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(e.iv) }, key, unb64(e.data)); }
      catch (x) { exit(); throw new Error('chiave non valida'); }
      var s = new Blob([pt]).stream().pipeThrough(new DecompressionStream('gzip'));
      W.NOI_CONTENT = JSON.parse(await new Response(s).text());
      return W.NOI_CONTENT;
    })();
    return loading;
  }
  var pdfLoading = null;
  function loadPdfmake() {
    if (W.pdfMake) return Promise.resolve();
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
  W.NOIContent = { load: loadContent, pdf: loadPdfmake, FONTS: '/uno-di-uno/assets/fonts/' };

  // Testo sicuro per l'HTML + concordanze di chi risponde
  W.NOIesc = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-esci]');
    if (t) { e.preventDefault(); exit(); }
  });
})();
