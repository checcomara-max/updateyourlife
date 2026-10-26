/* =====================================================================
   NOI — Composizione dei documenti di coppia
   istruzioni(lettore, descritto) → «{{Y}}. Istruzioni per stare bene insieme», per chi legge
   scheda(A, B)                   → «A e B. Istruzioni per noi», per entrambi
   toHTML(doc) → anteprima a schermo · toPDF(doc) → pdfmake (A5, font incorporati)
   Persona = { nome, g: 'F'|'M'|'N', p: NOI.score(...), share: { area: 'I'|'S'|'N' }, msg, grazie }
   Regola di riservatezza: nelle istruzioni si usano solo le aree che il descritto NON ha escluso ('N');
   nella scheda di coppia solo le aree che ciascuno ha segnato 'S'.
   Richiede: engine.js (NOI) e la libreria decifrata (window.NOI_CONTENT).
   ===================================================================== */
const NOIBook = (() => {
  const CONFIG = {
    AUTORE: 'Francesco',
    AUTORE_ESTESO: 'Francesco Maragliulo, psicologo (Ordine degli Psicologi della Lombardia, n. 27664)',
    BRAND: 'NOI',
    SITO: 'updateyourlife.it',
    PIEDE: 'NOI · Francesco Maragliulo, psicologo · ',
    PIEDE_SITO: 'www.updateyourlife.it',
  };
  const M = () => (typeof window !== 'undefined' ? window.NOI_CONTENT : globalThis.NOI_CONTENT).moduli;
  const G = () => (typeof window !== 'undefined' ? window.NOI : globalThis.NOI);
  const pad = (n) => String(n).padStart(2, '0');
  const itDate = (d) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  const clean = (s, max) => String(s || '').replace(/[*_[\]{}<>\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
  const okShare = (p, area) => (p.share || {})[area] !== 'N';
  const inScheda = (p, area) => (p.share || {})[area] === 'S';

  function serial(seed, d) {
    let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const ck = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; let r = '';
    for (let i = 0; i < 3; i++) { r += ck.charAt(h % ck.length); h = Math.floor(h / ck.length); }
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${r}`;
  }

  // ---------- Testo: variabili, concordanze, markdown minimo ----------
  let CTX = null;
  const PRON = { F: { lui: 'lei', lo: 'la', gli: 'le' }, M: { lui: 'lui', lo: 'lo', gli: 'gli' }, N: { lui: null, lo: 'lo/la', gli: 'gli/le' } };
  function setCtx(names, g) {
    const py = PRON[g[''] || 'N'];
    CTX = { names, g, vars: { autore: CONFIG.AUTORE, lui: py.lui || names.Y || '', lo: py.lo, gli: py.gli } };
  }
  function prep(src) {
    let s = String(src || '');
    s = s.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, k, inner) => (CTX.vars[k] ? inner : ''));
    s = s.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, k, inner) => (CTX.vars[k] ? '' : inner));
    s = s.replace(/\{\{(\w+)\}\}/g, (all, k) => (k in CTX.names ? CTX.names[k] : k in CTX.vars ? CTX.vars[k] : all));
    s = G().gender(s, CTX.g);
    return s.replace(/(^|[.!?]\s+|\n)(lei|lui|la|lo|le|gli)\b/g, (m, a, b) => a + b.charAt(0).toUpperCase() + b.slice(1));
  }
  function runs(s) {
    const out = [];
    String(s).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).forEach((part) => {
      if (!part) return;
      if (/^\*\*[^*]+\*\*$/.test(part)) out.push({ text: part.slice(2, -2), b: true });
      else if (/^\*[^*]+\*$/.test(part)) out.push({ text: part.slice(1, -1), i: true });
      else out.push({ text: part });
    });
    return out;
  }
  const T = (s) => runs(prep(s));
  function md(src) {
    const blocks = []; let para = [], list = null;
    const fp = () => { if (para.length) { blocks.push({ t: 'p', r: runs(para.join(' ')) }); para = []; } };
    const fl = () => { if (list) { blocks.push({ t: list.t, items: list.items.map(runs) }); list = null; } };
    for (const raw of prep(src).split('\n')) {
      const line = raw.replace(/\s+$/, ''); let m;
      if (!line.trim()) { fp(); fl(); continue; }
      if ((m = line.match(/^#{2,4}\s+(.*)$/))) { fp(); fl(); blocks.push({ t: 'h3', r: runs(m[1]) }); continue; }
      if ((m = line.match(/^\s*[-*]\s+(.*)$/))) { fp(); if (!list || list.t !== 'ul') { fl(); list = { t: 'ul', items: [] }; } list.items.push(m[1]); continue; }
      if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) { fp(); if (!list || list.t !== 'ol') { fl(); list = { t: 'ol', items: [] }; } list.items.push(m[1]); continue; }
      if (list) { list.items[list.items.length - 1] += ' ' + line.trim(); continue; }
      para.push(line.trim());
    }
    fp(); fl(); return blocks;
  }
  const plain = (r) => r.map((x) => x.text).join('');

  // ---------- Scelte dei moduli ----------
  const ORD_VIC = 'TCSE', ORD_DIS = 'IRB';
  // coppia di tipi in ordine canonico; p = chi ha il primo tipo
  function pairOf(order, tx, ty) {
    const ix = order.indexOf(tx), iy = order.indexOf(ty);
    return ix <= iy ? { key: tx + ty, xFirst: true } : { key: ty + tx, xFirst: false };
  }
  const QUO_ORDER = ['carico', 'apprezzamento', 'notizie', 'insieme', 'perse', 'rituali', 'novita'];
  function quoMods(p) { const l = QUO_ORDER.filter((k) => p.quo[k]).slice(0, 3); return (l.length ? l : ['base']).map((k) => 'quo-' + k); }

  // ---------- Costruttori di documento ----------
  function mkDoc(kind) {
    const sections = []; const fonti = [];
    const sec = (type, blocks, extra = {}) => sections.push({ type, blocks, ...extra });
    const addFonte = (cap, titolo, fonte) => fonte.split(/;\s+(?=[A-ZÀ-Ý][\p{L}'-]+,)/u).forEach((f) => { if (!fonti.some((x) => x.f === f)) fonti.push({ cap, t: titolo, f }); });
    const curios = (m, cap) => (m && m.curiosita || []).map((c) => { addFonte(cap, plain(T(c.titolo)), c.fonte); return { k: 'curio', title: T(c.titolo), b: md(c.testo), fonte: c.fonte }; });
    return { kind, sections, fonti, sec, curios };
  }
  const bodyWithQuote = (m) => {
    const bs = md(m.body);
    if (!m.citazione) return [{ k: 'md', b: bs }];
    let n = 0, at = bs.length;
    for (let i = 0; i < bs.length; i++) if (bs[i].t === 'p' && ++n === 2) { at = i + 1; break; }
    return [{ k: 'md', b: bs.slice(0, at) }, { k: 'quote', r: T(m.citazione) }, { k: 'md', b: bs.slice(at) }];
  };
  const chHead = (n, kicker, title, sintesi) => ({ k: 'chhead', n: pad(n), kicker: plain(T(kicker)), title: T(title), sintesi: sintesi ? T(sintesi) : null });
  const letter = (m) => { const b = md(m.body); const last = b.pop(); return [{ k: 'title', r: T(m.titolo) }, { k: 'md', b, letter: true }, { k: 'sign', r: last.r }]; };
  const list = (title, items) => ({ k: 'list', title, items: items.map(T) });

  // ---------- Istruzioni per chi legge (x), su chi è descritto (y) ----------
  function istruzioni(xIn, yIn, opt = {}) {
    const lib = M();
    const mod = (id) => { if (!lib[id]) throw new Error('Modulo mancante nella libreria: ' + id); return lib[id]; };
    const x = { ...xIn, nome: clean(xIn.nome, 30) || 'Tu' }, y = { ...yIn, nome: clean(yIn.nome, 30) || 'L’altra persona' };
    const now = opt.now || new Date();
    const serie = opt.serie || serial(x.nome + '>' + y.nome + (opt.seed || ''), now);
    const baseNames = { X: x.nome, Y: y.nome };
    const baseG = { '': y.g, tu: x.g };
    setCtx(baseNames, baseG);
    const D = mkDoc('istruzioni');
    const { sec, curios } = D;
    const P = y.p, Px = x.p;

    sec('cover', [{ k: 'cover', nome: y.nome, title: 'Istruzioni per stare bene insieme', per: `Per ${x.nome}`, data: itDate(now), serie }]);
    const toc = [];
    const tocAt = D.sections.length; sec('page', []);
    sec('page', [{ k: 'title', r: T(mod('come-leggere').titolo) }, { k: 'md', b: md(mod('come-leggere').body) }]);
    sec('page', letter(mod('lettera-apertura')));

    let n = 0;
    const chosen = [];
    const practices = [];
    const problems = [];
    // 1. Che cosa fa sentire importante
    if (okShare(y, 'importante')) {
      n++;
      const V1 = mod('via-' + P.imp.via1), V2 = P.imp.via2 !== P.imp.via1 ? mod('via-' + P.imp.via2) : null, F = mod('ferita-' + P.imp.ferita), I = mod('importante-intro');
      chosen.push(V1); practices.push(V1);
      problems.push(['Che cosa fa sentire importante ' + y.nome, [...(V1.problemi || []), ...(F.problemi || [])]]);
      toc.push([plain(T(I.titolo)), plain(T(V1.etichetta)) + (V2 ? ' · ' + plain(T(V2.etichetta)) : '')]);
      sec('chapter', [chHead(n, I.titolo, V1.titolo, V1.sintesi), { k: 'md', b: md(I.body) }, { k: 'inbreve', items: V1.inbreve.map(T) },
        ...bodyWithQuote(V1), list('Gesti che arrivano', V1.gesti),
        ...(V2 ? [{ k: 'box', label: 'E poi: ' + plain(T(V2.etichetta)).toLowerCase(), b: md(V2.breve) }] : []),
        { k: 'h3', r: T(F.titolo) }, { k: 'md', b: md(F.body) }, { k: 'box', label: 'Se succede, come riparare', b: md(F.riparare) },
        ...curios(I, n), ...curios(V1, n), ...curios(F, n)]);
    }
    // 2. Vicinanza e spazio
    if (okShare(y, 'vicinanza')) {
      n++;
      const V = mod('vic-' + P.vic.tipo), I = mod('vic-intro');
      const pr = pairOf(ORD_VIC, Px.vic.tipo, P.vic.tipo), C = mod('coppia-vic-' + pr.key);
      chosen.push(V); practices.push(V); problems.push(['Vicinanza e spazio', V.problemi || []]);
      toc.push(['Vicinanza e spazio', plain(T(V.etichetta))]);
      const cblocks = combo(C, pr, x, y, ORD_VIC, 'vic');
      sec('chapter', [chHead(n, 'Vicinanza e spazio', V.titolo, V.sintesi), { k: 'md', b: md(I.body) }, { k: 'inbreve', items: V.inbreve.map(T) },
        ...bodyWithQuote(V), list('Che cosa aiuta', V.aiuta), list('Che cosa evitare', V.evita), ...curios(I, n), ...curios(V, n), ...cblocks]);
    }
    // 3. Disaccordi
    if (okShare(y, 'disaccordi')) {
      n++;
      const Dm = mod('dis-' + P.dis.stile), I = mod('dis-intro'), Do = mod('dopo-' + P.dis.dopo);
      const pr = pairOf(ORD_DIS, Px.dis.stile, P.dis.stile), C = mod('coppia-dis-' + pr.key);
      const AL = P.dis.allaga ? mod('allagamento') : null;
      chosen.push(Dm); practices.push(AL || Dm);
      problems.push(['Quando non siete d’accordo', [...(Dm.problemi || []), ...(AL ? AL.problemi || [] : [])]]);
      toc.push([plain(T(I.titolo)), plain(T(Dm.etichetta))]);
      const tema = P.dis.tema && P.dis.tema !== 'altro' ? mod('tema-' + P.dis.tema) : null;
      sec('chapter', [chHead(n, I.titolo, Dm.titolo, Dm.sintesi), { k: 'md', b: md(I.body) }, { k: 'inbreve', items: Dm.inbreve.map(T) },
        ...bodyWithQuote(Dm), list('Che cosa aiuta', Dm.aiuta), list('Che cosa evitare', Dm.evita),
        ...(AL ? [{ k: 'h3', r: T(AL.titolo) }, { k: 'md', b: md(AL.body) }] : []),
        ...(P.dis.duro ? [{ k: 'h3', r: T(mod('duro').titolo) }, { k: 'md', b: md(mod('duro').body) }] : []),
        ...(P.dis.ripara ? [{ k: 'h3', r: T(mod('ripara').titolo) }, { k: 'md', b: md(mod('ripara').body) }] : []),
        { k: 'h3', r: T(Do.titolo) }, { k: 'md', b: md(Do.body) },
        ...(tema ? [{ k: 'box', label: plain(T(tema.titolo)), b: md(tema.body) }] : []),
        ...curios(I, n), ...curios(Dm, n), ...(AL ? curios(AL, n) : []), ...curios(Do, n), ...combo(C, pr, x, y, ORD_DIS, 'dis')]);
    }
    // 4. Sotto pressione
    if (okShare(y, 'pressione')) {
      n++;
      const B = mod('bisogno-' + P.pres.bisogno), S = mod('segnale-' + P.pres.segnale), I = mod('pres-intro');
      chosen.push(B); practices.push(B); problems.push(['Quando la pressione arriva da fuori', B.problemi || []]);
      toc.push([plain(T(I.titolo)), plain(T(B.etichetta))]);
      sec('chapter', [chHead(n, I.titolo, B.titolo, B.sintesi), { k: 'md', b: md(I.body) },
        { k: 'h3', r: T(S.titolo) }, { k: 'md', b: md(S.body) },
        { k: 'h3', r: T('Che cosa {{lo}} aiuta') }, { k: 'inbreve', items: B.inbreve.map(T) }, ...bodyWithQuote(B),
        { k: 'box', label: 'E tu?', b: md(B.reazione[Px.pres.reazione]) }, ...curios(I, n), ...curios(S, n), ...curios(B, n)]);
    }
    // 5. Quotidiano
    if (okShare(y, 'quotidiano')) {
      n++;
      const I = mod('quo-intro'); const Q = quoMods(P).map(mod);
      Q.forEach((q) => { chosen.push(q); practices.push(q); });
      problems.push(['Il quotidiano', Q.flatMap((q) => q.problemi || [])]);
      toc.push([plain(T(I.titolo)), Q.map((q) => plain(T(q.titolo))).join(' · ')]);
      sec('chapter', [chHead(n, I.titolo, 'Le cose che contano ogni giorno', ''), { k: 'md', b: md(I.body) },
        ...Q.flatMap((q) => [{ k: 'h2', r: T(q.titolo) }, { k: 'md', b: md(q.body) }, ...curios(q, n)])]);
    }
    // 6. Le parole di Y
    const msg = clean(y.msg, 400);
    if (msg) {
      n++;
      const I = mod('messaggio-intro');
      toc.push([plain(T(I.titolo)), 'Una frase per te']);
      sec('chapter', [chHead(n, 'Un messaggio', I.titolo, ''), { k: 'md', b: md(I.body) }, { k: 'msg', text: msg, from: y.nome }]);
    }
    // 7. Quattro settimane, 8. Se succede questo, 9. Domande
    const four = practices.filter((m) => m.pratica).slice(0, 4);
    if (four.length) {
      n++;
      const I = mod('settimane-intro');
      toc.push([plain(T(I.titolo)), 'Una pratica a settimana']);
      sec('chapter', [chHead(n, 'Da provare', I.titolo, ''), { k: 'md', b: md(I.body) },
        { k: 'prac', items: four.map((m, i) => ({ f: `Settimana ${i + 1}`, title: T(m.pratica.titolo), text: T(m.pratica.testo), from: m.pratica.freq })) }]);
    }
    const pg = problems.filter(([, l]) => l.length);
    if (pg.length) {
      n++;
      const I = mod('problemi-intro');
      toc.push([plain(T(I.titolo)), `${pg.reduce((s, [, l]) => s + l.length, 0)} situazioni`]);
      sec('chapter', [chHead(n, 'Risoluzione dei problemi', I.titolo, ''), { k: 'md', b: md(I.body) },
        { k: 'probs', groups: pg.map(([g, l]) => ({ g, items: l.map((p) => ({ q: T(p.titolo), a: T(p.testo) })) })) }]);
    }
    const qs = chosen.flatMap((m) => m.domande || []);
    if (qs.length) {
      n++;
      const I = mod('domande-intro');
      toc.push([plain(T(I.titolo)), `${qs.length} domande`]);
      sec('chapter', [chHead(n, 'Per parlarne', I.titolo, ''), { k: 'md', b: md(I.body) }, { k: 'work', items: qs.map((q, i) => ({ n: i + 1, q: T(q) })) }]);
    }
    if (!n) sec('page', [{ k: 'box', b: md('{{Y}} ha scelto di non condividere nessuna area: in queste pagine trovi solo la cornice. Parlatene direttamente.') }]);

    sec('page', letter(mod('lettera-chiusura')));
    D.sections[tocAt].blocks = [{ k: 'toc', forName: `Per ${x.nome}`, items: toc.map((t, i) => ({ n: pad(i + 1), t: t[0], s: [{ text: t[1] }] })) }];
    D.sections[tocAt].nonum = true;
    closing(D, mod, [`«${y.nome}. Istruzioni per stare bene insieme» · per ${x.nome} · N. ${serie}`, `Composto il ${itDate(now)} a partire dalle risposte di ${y.nome} e di ${x.nome}.`]);
    return { kind: 'istruzioni', sections: D.sections, title: `${y.nome}. Istruzioni per stare bene insieme`, per: x.nome, serie,
      filename: `NOI_Istruzioni_${y.nome.replace(/[^\p{L}\p{N}]+/gu, '')}_per_${x.nome.replace(/[^\p{L}\p{N}]+/gu, '')}_${serie}.pdf` };
  }

  // Combinazione di coppia: corpo con {{P}}/{{Q}} + nota per chi legge
  function combo(C, pr, x, y, order, kind) {
    const pP = pr.xFirst ? x : y, pQ = pr.xFirst ? y : x;
    const saved = CTX;
    setCtx({ ...saved.names, P: pP.nome, Q: pQ.nome }, { ...saved.g, p: pP.g, q: pQ.g });
    const body = md(C.body), title = T(C.titolo);
    CTX = saved;
    const xt = kind === 'vic' ? x.p.vic.tipo : x.p.dis.stile;
    const lab = (p) => plain(T(M()[(kind === 'vic' ? 'vic-' + p.p.vic.tipo : 'dis-' + p.p.dis.stile)].etichetta));
    return [{ k: 'combo', title, cx: `${x.nome}: ${lab(x)} · ${y.nome}: ${lab(y)}`, b: body }, { k: 'box', label: 'E tu?', b: md(C.tu[xt]) }];
  }

  function closing(D, mod, lines) {
    D.sec('page', [{ k: 'title', r: T(mod('fonti-intro').titolo) }, { k: 'small', b: md(mod('fonti-intro').body) }, { k: 'fonti', items: D.fonti }]);
    D.sec('page', [{ k: 'title', r: T(mod('nota-metodo').titolo) }, { k: 'small', b: md(mod('nota-metodo').body) }]);
    D.sec('page', [{ k: 'title', r: T(mod('avvertenze').titolo) }, { k: 'small', b: md(mod('avvertenze').body) },
      { k: 'colophon', lines: [...lines, `Testi di ${CONFIG.AUTORE_ESTESO}.`, `${CONFIG.BRAND} · ${CONFIG.SITO}`,
        'Documento personale e riservato: non è un test né una valutazione psicologica.', 'Caratteri Fraunces, Literata e Inter, con licenza SIL Open Font License.'] }]);
  }

  // ---------- Scheda di coppia ----------
  function scheda(aIn, bIn, opt = {}) {
    const lib = M();
    const mod = (id) => { if (!lib[id]) throw new Error('Modulo mancante nella libreria: ' + id); return lib[id]; };
    const a = { ...aIn, nome: clean(aIn.nome, 30) || 'A' }, b = { ...bIn, nome: clean(bIn.nome, 30) || 'B' };
    const now = opt.now || new Date();
    const serie = opt.serie || serial(a.nome + '+' + b.nome + (opt.seed || ''), now);
    const D = mkDoc('scheda');
    const { sec, curios } = D;
    const names = { A: a.nome, B: b.nome };
    const as = (p) => setCtx({ ...names, Y: p.nome }, { '': p.g });
    as(a);
    sec('cover', [{ k: 'cover', nome: `${a.nome} e ${b.nome}`, title: 'Istruzioni per noi', per: 'Scheda di coppia', data: itDate(now), serie }]);
    setCtx(names, {});
    sec('page', [{ k: 'title', r: T(mod('scheda-intro').titolo) }, { k: 'md', b: md(mod('scheda-intro').body) }]);

    const people = [a, b];
    const lines = (p, ids) => { as(p); return ids.map((id) => T(mod(id).scheda)); };
    const blocks = [];
    let cap = 0;
    const area = (titolo, key, idsOf, comboOf) => {
      const who = people.filter((p) => inScheda(p, key));
      if (!who.length) return;
      cap++;
      const out = [{ k: 'h2', r: [{ text: titolo }] }];
      if (who.length === 2 && comboOf) {
        const { C, pr } = comboOf();
        const pP = pr.xFirst ? a : b, pQ = pr.xFirst ? b : a;
        setCtx({ ...names, P: pP.nome, Q: pQ.nome }, { p: pP.g, q: pQ.g });
        out.push({ k: 'combo', title: T(C.titolo), cx: 'La vostra combinazione', b: md(C.body) });
      }
      who.forEach((p) => out.push({ k: 'person', nome: p.nome, items: lines(p, idsOf(p)) }));
      blocks.push(...out);
    };
    area('Che cosa vi fa sentire importanti', 'importante', (p) => [...new Set(['via-' + p.p.imp.via1, 'via-' + p.p.imp.via2])]);
    area('Vicinanza e spazio', 'vicinanza', (p) => ['vic-' + p.p.vic.tipo], () => {
      const pr = pairOf(ORD_VIC, a.p.vic.tipo, b.p.vic.tipo); return { C: mod('coppia-vic-' + pr.key), pr };
    });
    area('Quando non siete d’accordo', 'disaccordi', (p) => ['dis-' + p.p.dis.stile, 'dopo-' + p.p.dis.dopo], () => {
      const pr = pairOf(ORD_DIS, a.p.dis.stile, b.p.dis.stile); return { C: mod('coppia-dis-' + pr.key), pr };
    });
    area('Quando la pressione arriva da fuori', 'pressione', (p) => ['segnale-' + p.p.pres.segnale, 'bisogno-' + p.p.pres.bisogno]);
    area('Il quotidiano', 'quotidiano', (p) => quoMods(p.p));
    setCtx(names, {});
    if (!cap) blocks.push({ k: 'box', b: md('Avete scelto di non condividere nessuna area nella scheda di coppia. Restano gli accordi e le domande qui sotto, che valgono per tutte le coppie.') });
    sec('chapter', [{ k: 'chhead', n: '01', kicker: 'Quello che avete scelto di condividere', title: [{ text: 'Come siete' }], sintesi: null }, ...blocks]);

    // Che cosa apprezzate (testi liberi)
    const gr = people.filter((p) => clean(p.grazie, 300));
    if (gr.length) {
      const G0 = mod('scheda-grazie');
      sec('chapter', [{ k: 'chhead', n: '02', kicker: 'Con parole vostre', title: T(G0.titolo), sintesi: null }, { k: 'md', b: md(G0.body) },
        ...gr.map((p) => ({ k: 'msg', text: clean(p.grazie, 300), from: `${p.nome}, su ${p === a ? b.nome : a.nome}` }))]);
    }

    // Accordi
    const AC = mod('scheda-accordi');
    const keys = [];
    const add = (k, cond) => { if (cond && !keys.includes(k)) keys.push(k); };
    const sh = (k) => people.filter((p) => inScheda(p, k));
    add('pausa', sh('disaccordi').some((p) => p.p.dis.allaga));
    add('avvio', sh('disaccordi').some((p) => p.p.dis.duro));
    add('quando', sh('disaccordi').some((p) => p.p.dis.stile === 'I'));
    add('avvisare', sh('vicinanza').some((p) => 'CE'.includes(p.p.vic.tipo)));
    add('spazio', sh('vicinanza').some((p) => 'SE'.includes(p.p.vic.tipo)));
    add('domanda', sh('pressione').length > 0);
    add('notizie', sh('quotidiano').some((p) => p.p.quo.notizie));
    add('lista', sh('quotidiano').some((p) => p.p.quo.carico));
    add('schermi', sh('importante').some((p) => p.p.imp.via1 === 'T' || p.p.imp.via2 === 'T'));
    add('novita', sh('quotidiano').some((p) => p.p.quo.novita));
    add('rituale', sh('quotidiano').some((p) => p.p.quo.rituali || p.p.quo.insieme));
    add('grazie', sh('quotidiano').some((p) => p.p.quo.apprezzamento));
    add('saluto', sh('vicinanza').some((p) => 'CE'.includes(p.p.vic.tipo)) || sh('quotidiano').some((p) => p.p.quo.perse));
    add('riparare', sh('disaccordi').length > 0);
    add('riunione', sh('disaccordi').length > 0);
    ['grazie', 'riunione', 'rituale', 'domanda', 'saluto'].forEach((k) => { if (keys.length < 5) add(k, true); });
    sec('chapter', [{ k: 'chhead', n: gr.length ? '03' : '02', kicker: 'Da scegliere insieme', title: T(AC.titolo), sintesi: null }, { k: 'md', b: md(AC.body) },
      { k: 'accordi', items: keys.slice(0, 7).map((k) => T(AC.accordo[k])) }, { k: 'plan', items: [{ q: 'I nostri tre accordi, con parole nostre:', h: 6 }] }]);

    const R = mod('scheda-rituale'), S = mod('scheda-sera'), RP = mod('scheda-riparare'), PC = mod('scheda-percorso');
    const nFare = gr.length ? 4 : 3;
    const numbered = (m) => ({ k: 'work', items: m.domande.map((q, i) => ({ n: i + 1, q: T(q) })), nolines: true });
    sec('chapter', [{ k: 'chhead', n: '0' + nFare, kicker: 'Da fare insieme', title: T(S.titolo), sintesi: null }, { k: 'md', b: md(S.body) },
      numbered(S), ...curios(S, nFare),
      { k: 'h2', r: T(R.titolo) }, { k: 'md', b: md(R.body) },
      { k: 'h2', r: T(RP.titolo) }, { k: 'md', b: md(RP.body) }, numbered(RP), ...curios(RP, nFare)]);
    sec('page', [{ k: 'title', r: T(mod('scheda-chiusura').titolo) }, { k: 'md', b: md(mod('scheda-chiusura').body) },
      { k: 'h2', r: T(PC.titolo) }, { k: 'md', b: md(PC.body) }, numbered(PC), { k: 'md', b: md(PC.breve) }]);
    closing(D, mod, [`«${a.nome} e ${b.nome}. Istruzioni per noi» · N. ${serie}`, `Composto il ${itDate(now)} a partire da quello che ciascuno ha scelto di condividere.`]);
    return { kind: 'scheda', sections: D.sections, title: `${a.nome} e ${b.nome}. Istruzioni per noi`, per: `${a.nome} e ${b.nome}`, serie,
      filename: `NOI_Scheda_${a.nome.replace(/[^\p{L}\p{N}]+/gu, '')}_${b.nome.replace(/[^\p{L}\p{N}]+/gu, '')}_${serie}.pdf` };
  }

  // ---------- HTML ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hr = (r) => r.map((x) => (x.b ? `<strong>${esc(x.text)}</strong>` : x.i ? `<em>${esc(x.text)}</em>` : esc(x.text))).join('');
  const hblocks = (bs) => bs.map((b) => (b.t === 'p' ? `<p>${hr(b.r)}</p>` : b.t === 'h3' ? `<h3>${hr(b.r)}</h3>`
    : `<${b.t}>${b.items.map((i) => `<li>${hr(i)}</li>`).join('')}</${b.t}>`)).join('');
  function hblock(b) {
    switch (b.k) {
      case 'cover': return `<div class="cover"><div class="brand"><span>${esc(CONFIG.BRAND)}</span><span>${esc(b.per)}</span></div><div class="c1"></div><div class="c2"></div>
        <div class="nm"><div class="name">${esc(b.nome)}</div><div class="title">${esc(b.title)}</div></div>
        <div class="foot"><span class="ed">Edizione 1 di 1</span><span>${esc(b.data)} · N. ${esc(b.serie)}</span></div></div>`;
      case 'toc': return `<p class="toc-for">${esc(b.forName)}</p><h2 class="toc-h">Indice</h2><ol class="toc">${b.items.map((i) => `<li><span class="n">${i.n}</span><span class="t">${esc(i.t)}<span class="s">${hr(i.s)}</span></span></li>`).join('')}</ol>`;
      case 'title': return `<h2 class="pre-h">${hr(b.r)}</h2>`;
      case 'h2': return `<h2 class="h2">${hr(b.r)}</h2>`;
      case 'h3': return `<h3>${hr(b.r)}</h3>`;
      case 'md': return hblocks(b.b);
      case 'sign': return `<p class="sign">${hr(b.r)}</p>`;
      case 'small': return `<div class="small">${hblocks(b.b)}</div>`;
      case 'box': return `<div class="box">${b.label ? `<div class="k">${esc(b.label)}</div>` : ''}${hblocks(b.b)}</div>`;
      case 'chhead': return `<div class="ch-head"><div class="ch-num">${b.n}</div><div class="ch-kicker">${esc(b.kicker)}</div><h2 class="ch-title">${hr(b.title)}</h2>${b.sintesi ? `<p class="ch-sintesi">${hr(b.sintesi)}</p>` : ''}</div>`;
      case 'combo': return `<div class="combo"><div class="k">La vostra combinazione</div><div class="ct">${hr(b.title)}</div><div class="cx">${esc(b.cx)}</div>${hblocks(b.b)}</div>`;
      case 'list': return `<div class="lst"><div class="k">${esc(b.title)}</div><ul>${b.items.map((i) => `<li>${hr(i)}</li>`).join('')}</ul></div>`;
      case 'msg': return `<figure class="msg"><blockquote>${esc(b.text)}</blockquote><figcaption>${esc(b.from)}</figcaption></figure>`;
      case 'person': return `<div class="person"><div class="pn">${esc(b.nome)}</div><ul>${b.items.map((i) => `<li>${hr(i)}</li>`).join('')}</ul></div>`;
      case 'accordi': return `<ul class="accordi">${b.items.map((i) => `<li><span class="sq" aria-hidden="true"></span><span>${hr(i)}</span></li>`).join('')}</ul>`;
      case 'prac': return b.items.map((i) => `<div class="prac"><div class="f">${esc(i.f)}</div><div><div class="pt">${hr(i.title)}</div><p>${hr(i.text)}</p><div class="pr">${esc(i.from)}</div></div></div>`).join('');
      case 'probs': return b.groups.map((g) => `<div class="pgroup">${esc(g.g)}</div>${g.items.map((i) => `<div class="prob"><p class="q">${hr(i.q)}</p><p class="a">${hr(i.a)}</p></div>`).join('')}`).join('');
      case 'work': return b.items.map((i) => `<div class="wq"><p class="qq">${i.n}. ${hr(i.q)}</p>${b.nolines ? '' : '<div class="lines" style="--n:3"></div>'}</div>`).join('');
      case 'plan': return b.items.map((i) => `<div class="wq"><p class="qq">${esc(i.q)}</p><div class="lines" style="--n:${i.h}"></div></div>`).join('');
      case 'colophon': return `<div class="colophon">${b.lines.map(esc).join('<br>')}</div>`;
      case 'inbreve': return `<div class="inbreve"><div class="k">In breve</div><ol>${b.items.map((i) => `<li>${hr(i)}</li>`).join('')}</ol></div>`;
      case 'quote': return `<blockquote class="quote">${hr(b.r)}</blockquote>`;
      case 'curio': return `<aside class="curio"><div class="k">Dalla ricerca</div><div class="ct">${hr(b.title)}</div>${hblocks(b.b)}<div class="src">${esc(b.fonte)}</div></aside>`;
      case 'fonti': return `<ol class="fonti">${b.items.map((i) => `<li><span class="ft">Cap. ${i.cap} · ${esc(i.t)}</span>${esc(i.f)}</li>`).join('')}</ol>`;
      default: return '';
    }
  }
  const toHTML = (doc) => doc.sections.map((s) => `<section class="bk-${s.type}">${s.blocks.map(hblock).join('')}</section>`).join('');

  // ---------- PDF (pdfmake) ----------
  const COL = { ink: '#2A2224', plum: '#4A2F45', accent: '#C0674A', muted: '#75696D', rule: '#DDD3CC', cream: '#F6EEE6', tint: '#F8F1EC', sage: '#EEF2EC', num: '#8F8487' };
  const MM = 2.83465;
  const PAGE_W = 148 * MM, MARG_X = 15 * MM, W = PAGE_W - 2 * MARG_X;
  function fonts(base) {
    const f = (n) => `${base}${n}.ttf`;
    return {
      Literata: { normal: f('literata-latin-400-normal'), bold: f('literata-latin-600-normal'), italics: f('literata-latin-400-italic'), bolditalics: f('literata-latin-600-italic') },
      Fraunces: { normal: f('fraunces-latin-300-normal'), bold: f('fraunces-latin-600-normal'), italics: f('fraunces-latin-300-italic'), bolditalics: f('fraunces-latin-300-italic') },
      FrauncesMid: { normal: f('fraunces-latin-500-normal'), bold: f('fraunces-latin-600-normal'), italics: f('fraunces-latin-300-italic'), bolditalics: f('fraunces-latin-300-italic') },
      Inter: { normal: f('inter-latin-400-normal'), bold: f('inter-latin-600-normal'), italics: f('inter-latin-400-normal'), bolditalics: f('inter-latin-600-normal') },
      InterMid: { normal: f('inter-latin-500-normal'), bold: f('inter-latin-600-normal'), italics: f('inter-latin-500-normal'), bolditalics: f('inter-latin-600-normal') },
    };
  }
  const pr = (r) => r.map((x) => ({ text: x.text, ...(x.b ? { bold: true } : {}), ...(x.i ? { italics: true } : {}) }));
  const up = (s) => String(s).toUpperCase();
  const kick = (s, color = COL.muted, size = 7, extra = {}) => ({ text: up(s), font: 'Inter', bold: true, fontSize: size, characterSpacing: 1.1, color, ...extra });
  const rule = (w = W, m = [0, 4, 0, 4], color = COL.rule) => ({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: w, y2: 0, lineWidth: 0.5, lineColor: color }], margin: m });
  function pblocks(bs, size = 10) {
    return bs.map((b) => {
      if (b.t === 'p') return { text: pr(b.r), fontSize: size, margin: [0, 0, 0, size * 0.62] };
      if (b.t === 'h3') return { text: pr(b.r), font: 'Fraunces', bold: true, fontSize: 12, color: COL.plum, margin: [0, 9, 0, 4], headlineLevel: 1 };
      return { [b.t]: b.items.map((i) => ({ text: pr(i), fontSize: size, margin: [0, 0, 0, 3] })), margin: [0, 0, 0, 7], markerColor: COL.accent };
    });
  }
  const boxTable = (content, { fill = COL.tint, left = COL.accent, pad = 10, margin = [0, 7, 0, 7] } = {}) => ({
    table: { widths: ['*'], body: [[{ stack: content, fillColor: fill }]] },
    layout: { hLineWidth: () => 0, vLineWidth: (i) => (i === 0 ? 2.4 : 0), vLineColor: () => left, paddingLeft: () => pad + 2, paddingRight: () => pad, paddingTop: () => pad - 1, paddingBottom: () => pad - 4 },
    margin,
  });
  const linesCanvas = (n) => ({ canvas: Array.from({ length: n }, (_, j) => ({ type: 'line', x1: 0, y1: 19.8 * (j + 1), x2: W, y2: 19.8 * (j + 1), lineWidth: 0.5, lineColor: '#CFC3BA' })), margin: [0, 0, 0, 6] });
  function pblock(b) {
    switch (b.k) {
      case 'cover': return [{ text: ' ' }];
      case 'toc': return [kick(b.forName, COL.accent, 7.5, { margin: [0, 0, 0, 8] }), { text: 'Indice', font: 'Fraunces', fontSize: 24, color: COL.plum, margin: [0, 0, 0, 12] },
        ...b.items.flatMap((i) => [{ columns: [{ width: 28, text: i.n, font: 'Fraunces', fontSize: 14, lineHeight: 1, color: COL.accent }, { stack: [{ text: i.t, bold: true, fontSize: 9.6, lineHeight: 1.15 }, { text: pr(i.s), italics: true, fontSize: 8.2, lineHeight: 1.15, color: COL.muted }] }], margin: [0, 3.5, 0, 0] }, rule(W, [0, 3.5, 0, 0])])];
      case 'title': return [{ text: pr(b.r), font: 'Fraunces', fontSize: 20, color: COL.plum, margin: [0, 0, 0, 16] }];
      case 'h2': return [{ text: pr(b.r), font: 'Fraunces', fontSize: 17, color: COL.plum, margin: [0, 12, 0, 6], headlineLevel: 1 }];
      case 'h3': return [{ text: pr(b.r), font: 'Fraunces', bold: true, fontSize: 12, color: COL.plum, margin: [0, 10, 0, 4], headlineLevel: 1 }];
      case 'md': return pblocks(b.b, b.letter ? 10.2 : 10);
      case 'sign': return [{ text: pr(b.r), font: 'Fraunces', italics: true, fontSize: 15, color: COL.plum, margin: [0, 8, 0, 0] }];
      case 'small': return [{ stack: pblocks(b.b, 8.4), color: COL.ink }];
      case 'box': return [boxTable([...(b.label ? [kick(b.label, COL.accent, 6.6, { margin: [0, 0, 0, 4] })] : []), ...pblocks(b.b, 9.6)])];
      case 'chhead': return [{ stack: [
        { text: b.n, font: 'Fraunces', fontSize: 46, color: COL.accent, lineHeight: 0.9, margin: [0, 0, 0, 10] },
        kick(b.kicker, COL.muted, 7.5, { margin: [0, 0, 0, 4] }),
        { text: pr(b.title), font: 'Fraunces', fontSize: 23, lineHeight: 1.05, color: COL.plum, margin: [0, 0, 0, 7] },
        ...(b.sintesi ? [{ text: pr(b.sintesi), italics: true, color: COL.muted, fontSize: 10 }] : []),
        rule(W, [0, 12, 0, 16])], unbreakable: true }];
      case 'combo': {
        const [first, ...rest] = pblocks(b.b);
        return [{ stack: [rule(W, [0, 14, 0, 14]), kick('La vostra combinazione', COL.accent, 7, { margin: [0, 0, 0, 3] }),
          { text: pr(b.title), font: 'FrauncesMid', fontSize: 16, color: COL.plum, margin: [0, 0, 0, 3] },
          { text: b.cx, font: 'InterMid', fontSize: 8, color: COL.muted, margin: [0, 0, 0, 10] }, first].filter(Boolean), unbreakable: true }, ...rest];
      }
      case 'list': return [{ stack: [kick(b.title, COL.accent, 7, { margin: [0, 6, 0, 4] }), { ul: b.items.map((i) => ({ text: pr(i), fontSize: 9.6, margin: [0, 0, 0, 3] })), markerColor: COL.accent, margin: [0, 0, 0, 8] }] }];
      case 'msg': return [{ stack: [{ text: '«' + b.text + '»', font: 'Fraunces', italics: true, fontSize: 15, lineHeight: 1.25, color: COL.plum }, { text: b.from, font: 'InterMid', fontSize: 8, color: COL.muted, margin: [0, 6, 0, 0] }], margin: [16, 8, 16, 14], unbreakable: true }];
      case 'person': return [{ stack: [kick(b.nome, COL.plum, 7.2, { margin: [0, 6, 0, 3] }), { ul: b.items.map((i) => ({ text: pr(i), fontSize: 9.6, margin: [0, 0, 0, 3] })), markerColor: COL.accent }], margin: [0, 0, 0, 6], unbreakable: true }];
      case 'accordi': return b.items.map((i) => ({ columns: [{ width: 14, canvas: [{ type: 'rect', x: 0, y: 2, w: 8, h: 8, lineWidth: 0.7, lineColor: COL.plum }] }, { text: pr(i), fontSize: 9.6 }], margin: [0, 0, 0, 7], unbreakable: true }));
      case 'prac': return b.items.map((i) => ({ stack: [{ columns: [
        { width: 70, text: up(i.f), font: 'Inter', bold: true, fontSize: 6.6, characterSpacing: 0.8, color: COL.accent, margin: [0, 2, 0, 0] },
        { stack: [{ text: pr(i.title), font: 'Fraunces', bold: true, fontSize: 10.5, color: COL.plum, margin: [0, 0, 0, 3] }, { text: pr(i.text), fontSize: 9.4 }, { text: i.from, font: 'InterMid', fontSize: 7, color: COL.muted, margin: [0, 3, 0, 0] }] }], columnGap: 10 },
        rule(W, [0, 10, 0, 10])], unbreakable: true }));
      case 'probs': return b.groups.flatMap((g) => g.items.map((i, j) => ({ stack: [
        ...(j === 0 ? [kick(g.g, COL.muted, 7.2, { margin: [0, 12, 0, 6] })] : []),
        { table: { widths: ['*'], body: [[{ stack: [{ text: pr(i.q), bold: true, fontSize: 9.8, margin: [0, 0, 0, 2] }, { text: pr(i.a), fontSize: 9.3 }] }]] },
          layout: { hLineWidth: () => 0, vLineWidth: (k) => (k === 0 ? 0.6 : 0), vLineColor: () => COL.rule, paddingLeft: () => 10, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 }, margin: [0, 0, 0, 10] }],
        unbreakable: true })));
      case 'work': return b.items.map((i) => ({ stack: [{ text: [`${i.n}. `, ...pr(i.q)], bold: !b.nolines, fontSize: 9.8, margin: [0, 0, 0, b.nolines ? 5 : 2] }, ...(b.nolines ? [] : [linesCanvas(3)])], unbreakable: true }));
      case 'plan': return b.items.map((i) => ({ stack: [{ text: i.q, bold: true, fontSize: 9.6, margin: [0, 6, 0, 2] }, linesCanvas(i.h)], unbreakable: true }));
      case 'colophon': return [rule(W, [0, 24, 0, 8]), { text: b.lines.join('\n'), font: 'Inter', fontSize: 7, lineHeight: 1.45, color: COL.muted }];
      case 'inbreve': return [{ stack: [rule(W, [0, 0, 0, 7], COL.accent), kick('In breve', COL.accent, 7, { margin: [0, 0, 0, 5] }),
        ...b.items.map((r, i) => ({ columns: [{ width: 16, text: String(i + 1), font: 'Fraunces', fontSize: 12, color: COL.accent, lineHeight: 1 }, { text: pr(r), fontSize: 9.4, lineHeight: 1.25 }], margin: [0, 0, 0, 4] })),
        rule(W, [0, 4, 0, 14])], unbreakable: true }];
      case 'quote': return [{ stack: [
        { canvas: [{ type: 'line', x1: (W - 60) / 2 - 20, y1: 0, x2: (W - 60) / 2 + 20, y2: 0, lineWidth: 1, lineColor: COL.accent }], margin: [30, 0, 30, 8] },
        { text: pr(b.r).map((x) => ({ ...x, italics: true })), font: 'Fraunces', fontSize: 15, lineHeight: 1.2, color: COL.plum, alignment: 'center' }], margin: [30, 10, 30, 16], unbreakable: true }];
      case 'curio': return [{ table: { widths: ['*'], body: [[{ stack: [
        kick('Dalla ricerca', COL.plum, 6.4, { margin: [0, 0, 0, 3] }),
        { text: pr(b.title), font: 'Fraunces', bold: true, fontSize: 11, color: COL.plum, lineHeight: 1.15, margin: [0, 0, 0, 4] },
        ...pblocks(b.b, 9).map((x) => ({ ...x, lineHeight: 1.28 })),
        { text: b.fonte, font: 'Inter', fontSize: 6.4, lineHeight: 1.3, color: COL.muted, margin: [0, 1, 0, 0] }], fillColor: COL.sage }]] },
        layout: { hLineWidth: () => 0, vLineWidth: (i) => (i === 0 ? 2.4 : 0), vLineColor: () => COL.plum, paddingLeft: () => 12, paddingRight: () => 10, paddingTop: () => 9, paddingBottom: () => 8 },
        margin: [0, 8, 0, 8], unbreakable: true }];
      case 'fonti': return b.items.map((i, n) => ({ stack: [
        { text: `${n + 1}. Cap. ${i.cap} · ${i.t}`, font: 'Inter', bold: true, fontSize: 7, color: COL.ink },
        { text: i.f, font: 'Inter', fontSize: 7, lineHeight: 1.3, color: COL.muted, margin: [0, 1, 0, 6] }], unbreakable: true }));
      default: return [];
    }
  }
  function coverLayer(b, size) {
    const nsize = b.nome.length > 22 ? 26 : b.nome.length > 14 ? 30 : b.nome.length > 9 ? 36 : 42;
    return [
      { canvas: [
        { type: 'rect', x: 0, y: 0, w: size.width, h: size.height, color: COL.plum },
        { type: 'ellipse', x: 98 * MM, y: 72 * MM, r1: 30 * MM, r2: 30 * MM, lineColor: '#8A6A82', lineWidth: 0.8 },
        { type: 'ellipse', x: 120 * MM, y: 72 * MM, r1: 30 * MM, r2: 30 * MM, lineColor: '#C9A08F', lineWidth: 0.8 },
        { type: 'ellipse', x: 109 * MM, y: 72 * MM, r1: 2.6 * MM, r2: 2.6 * MM, color: COL.accent }], absolutePosition: { x: 0, y: 0 } },
      { columns: [{ width: W * 0.35, text: up(CONFIG.BRAND) }, { width: W * 0.65, text: up(b.per), alignment: 'right' }], font: 'InterMid', fontSize: 7, characterSpacing: 2, color: COL.cream, absolutePosition: { x: MARG_X, y: 16 * MM } },
      { width: W, stack: [{ text: b.nome, font: 'Fraunces', fontSize: nsize, lineHeight: 0.98, color: COL.cream }, { text: b.title, font: 'Fraunces', italics: true, fontSize: 16, color: COL.cream, margin: [0, 6 * MM - 4, 0, 0] }],
        absolutePosition: { x: MARG_X, y: 116 * MM } },
      { columns: [{ width: W * 0.4, text: 'Edizione 1 di 1', font: 'Fraunces', italics: true, fontSize: 11 }, { width: W * 0.6, text: `${b.data} · N. ${b.serie}`, font: 'Inter', fontSize: 7.5, alignment: 'right', margin: [0, 3, 0, 0] }],
        color: COL.cream, absolutePosition: { x: MARG_X, y: 190 * MM } },
    ];
  }
  function toPDF(doc, fontBase) {
    const cover = doc.sections[0].blocks.find((b) => b.k === 'cover');
    const content = [];
    doc.sections.forEach((s, si) => {
      const nodes = s.blocks.flatMap(pblock);
      if (si > 0 && nodes.length) nodes[0] = { stack: [nodes[0]], pageBreak: 'before' };
      content.push(...nodes);
    });
    return {
      pageSize: 'A5',
      pageMargins: [MARG_X, 17 * MM, MARG_X, 19 * MM],
      info: { title: doc.title, author: 'Francesco Maragliulo', subject: 'NOI · documento riservato', creator: 'NOI' },
      defaultStyle: { font: 'Literata', fontSize: 10, lineHeight: 1.32, color: COL.ink },
      background: (page, size) => (page === 1 && cover ? coverLayer(cover, size) : null),
      footer: (page) => {
        const c = page === 1 ? '#B9A3B3' : COL.num;
        return { columns: [
          { text: [CONFIG.PIEDE, { text: CONFIG.PIEDE_SITO, link: 'https://' + CONFIG.PIEDE_SITO, color: c }], font: 'Inter', fontSize: 6.6, color: c, characterSpacing: 0.2 },
          { width: 24, text: page <= 2 ? '' : String(page), alignment: 'right', font: 'Inter', fontSize: 7.5, color: c }],
          margin: [MARG_X, 8 * MM, MARG_X, 0] };
      },
      pageBreakBefore: (node, following) => node.headlineLevel === 1 && following.length === 0,
      content,
      _fonts: fonts(fontBase),
    };
  }
  async function downloadPDF(doc, fontBase) {
    const dd = toPDF(doc, fontBase); const f = dd._fonts; delete dd._fonts;
    await new Promise((resolve) => window.pdfMake.createPdf(dd, null, f).download(doc.filename, resolve));
  }
  // Testo breve per le pagine (studio): concordanze + grassetto/corsivo in HTML sicuro
  function inline(s, names, g) { setCtx(names, g); return hr(runs(prep(s))); }

  return { CONFIG, istruzioni, scheda, toHTML, toPDF, downloadPDF, inline };
})();
if (typeof module !== 'undefined') module.exports = NOIBook;
if (typeof window !== 'undefined') window.NOIBook = NOIBook;
