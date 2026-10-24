/* =====================================================================
   UNO DI UNO — Composizione del libro
   compose(profilo, utente, opzioni) → modello a blocchi (indipendente dal formato)
   toHTML(modello)  → anteprima a schermo
   toPDF(modello)   → documento pdfmake (A5, font incorporati), scaricabile
   Richiede: engine.js (UDU) e content.js (UDU_CONTENT).
   ===================================================================== */
const UDUBook = (() => {
  const CONFIG = {
    AUTORE: 'Francesco',
    AUTORE_ESTESO: 'Francesco Maragliulo, psicologo (Ordine degli Psicologi della Lombardia, n. 27664) e coach',
    BRAND: 'Uno di Uno',
    SITO: 'updateyourlife.it/uno-di-uno',
    PIEDE: 'Francesco Maragliulo - Psicologo e Coach - ',
    PIEDE_SITO: 'www.updateyourlife.it',
    MESI_REVISIONE: 6,
  };
  const M = () => window.UDU_CONTENT.moduli;
  const pad = (n) => String(n).padStart(2, '0');
  const itDate = (d) => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
  // I testi scritti dall'utente non devono poter attivare la sintassi dei contenuti
  const clean = (s, max) => String(s || '').replace(/[*_[\]{}<>\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

  function serial(code, nome, d) {
    let h = 0; const s = code + '|' + nome; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    const ck = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; let r = '';
    for (let i = 0; i < 3; i++) { r += ck.charAt(h % ck.length); h = Math.floor(h / ck.length); }
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${r}`;
  }

  // ---------- Testo: variabili, concordanze, markdown minimo ----------
  let CTX = null;
  function prep(src) {
    let s = String(src || '');
    s = s.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, k, inner) => (CTX.user[k] ? inner : ''));
    s = s.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, k, inner) => (CTX.user[k] ? '' : inner));
    s = s.replace(/\{\{(\w+)\}\}/g, (all, k) => (k in CTX.vars ? CTX.vars[k] : k in CTX.user ? CTX.user[k] : all));
    return UDU.gender(s, CTX.g);
  }
  // runs: [{text, b, i}]
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

  // ---------- Composizione ----------
  const INT = { marcato: 'Tendenza marcata', moderato: 'Tendenza moderata', bilanciato: 'Profilo bilanciato' };
  const FASCIA = { basso: 'Fascia bassa', medio: 'Fascia centrale', alto: 'Fascia alta' };

  function compose(p, userIn, optsIn = {}) {
    const lib = M();
    const mod = (id) => { if (!lib[id]) throw new Error('Modulo mancante nella libreria: ' + id); return lib[id]; };
    const E = mod(p.moduli.energia), S = mod(p.moduli.stress), D = mod(p.moduli.decisione), C = mod(p.moduli.conflitto),
      MO = mod(p.moduli.motivazione), MI = mod(p.moduli.missione), SD = mod(p.moduli.comboSD), SC = mod(p.moduli.comboSC);
    const S2 = p.moduli.secondario ? mod(p.moduli.secondario) : null;
    const F = mod;
    const now = optsIn.now || new Date();
    const user = { nome: clean(userIn.nome, 40) || 'Lettore', obiettivo: clean(userIn.obiettivo, 255) };
    const code = optsIn.code || '';
    const opts = {
      code, data: itDate(now), serie: optsIn.serie || serial(code, user.nome, now),
      autore: CONFIG.AUTORE, revisione: itDate(addMonths(now, CONFIG.MESI_REVISIONE)),
    };
    CTX = { g: p.genere, user, vars: { autore: opts.autore, data: opts.data, revisione: opts.revisione,
      missione_titolo: MI.etichetta, stress_nome: S.etichetta, frase_commento: F('frasi').frase[p.frase] } };
    const L = (id) => plain(T(mod(id).etichetta));
    const sections = [];
    const sec = (type, blocks, extra = {}) => sections.push({ type, blocks, ...extra });
    const fonti = [];
    const addFonte = (cap, titolo, fonte) => fonte.split(/;\s+(?=[A-ZÀ-Ý][\p{L}'-]+,)/u).forEach((f) => { if (!fonti.some((x) => x.f === f)) fonti.push({ cap, t: titolo, f }); });
    const curios = (M0, cap) => (M0.curiosita || []).map((c) => { addFonte(cap, plain(T(c.titolo)), c.fonte); return { k: 'curio', title: T(c.titolo), b: md(c.testo), fonte: c.fonte }; });
    // la citazione del capitolo va dopo il secondo paragrafo del testo
    const bodyWithQuote = (M0) => {
      const bs = md(M0.body);
      if (!M0.citazione) return [{ k: 'md', b: bs }];
      let n = 0, at = bs.length;
      for (let i = 0; i < bs.length; i++) if (bs[i].t === 'p' && ++n === 2) { at = i + 1; break; }
      return [{ k: 'md', b: bs.slice(0, at) }, { k: 'quote', r: T(M0.citazione) }, { k: 'md', b: bs.slice(at) }];
    };

    // Copertina
    sec('cover', [{ k: 'cover', nome: user.nome, line: [S, D, C, MO].map((m) => plain(T(m.etichetta))).join(' · '), data: opts.data, serie: opts.serie }]);

    // Indice
    const chosen = [E, S, D, SD, C, SC, MO, MI];
    const probCount = chosen.reduce((n, m) => n + (m.problemi || []).length, 0);
    const qCount = chosen.reduce((n, m) => n + (m.domande || []).length, 0);
    const toc = [
      ['Scheda tecnica', 'Il tuo profilo in sintesi e i cinque grandi tratti'], ['Alimentazione', E.titolo], ['Comportamento sotto carico', S.titolo],
      ['Sistema decisionale', `${D.titolo} · ${SD.titolo}`], ['Interfacce', `${C.titolo} · ${SC.titolo}`], ['Carburante', MO.etichetta],
      ['Missione in corso', MI.etichetta], ['Protocollo di manutenzione', 'Cinque pratiche per il tuo profilo'],
      ['Risoluzione dei problemi', `${probCount} situazioni e cosa fare`], ['Istruzioni per gli altri', 'Una pagina da condividere'],
      ['Pagine di lavoro', `${qCount} domande per te`],
    ];
    sec('page', [{ k: 'toc', forName: `Composto per ${user.nome}`, items: toc.map((t, i) => ({ n: pad(i + 1), t: t[0], s: T(t[1]) })) }], { nonum: true });

    // Come leggere, nota sul carico, lettera
    sec('page', [{ k: 'title', r: T(F('come-leggere').titolo) }, { k: 'md', b: md(F('come-leggere').body) }]);
    if (p.carico >= 4) sec('page', [{ k: 'title', r: T(F('nota-carico').titolo) }, { k: 'box', b: md(F('nota-carico').body) }]);
    const letter = (id) => { const b = md(F(id).body); const last = b.pop(); return [{ k: 'title', r: T(F(id).titolo) }, { k: 'md', b, letter: true }, { k: 'sign', r: last.r }]; };
    sec('page', letter('lettera-apertura'));

    // 1. Scheda tecnica + cinque tratti
    const st = p.stress.scores;
    const bars4 = ['R', 'C', 'S', 'K'].map((k) => ({ label: L('stress-' + k), pct: Math.max(0, Math.min(1, (st[k] - 3) / 14)), on: k === p.stress.primary }));
    const dots = ['G', 'R', 'A', 'S'].map((k) => ({ label: L('motivazione-' + k), count: p.motivazione.counts[k], on: k === p.motivazione.top }));
    const bip = (dim, left, right) => ({ type: 'bipolar', n: dim.n, l: L(left), r: L(right), int: INT[dim.intensita] });
    const bil = F('scheda').bilanciato || {};
    const bilNotes = [['energia', p.energia], ['decisione', p.decisione], ['conflitto', p.conflitto]]
      .filter(([, d]) => d.intensita === 'bilanciato').map(([k]) => ({ k: 'box', b: md(bil[k]) }));
    const rows = [
      { lab: 'Alimentazione', val: T(E.etichetta), syn: T(E.sintesi), ref: 'cap. 2', viz: bip(p.energia, 'energia-E', 'energia-I') },
      { lab: 'Sotto carico', val: T(S.etichetta), syn: T(S.sintesi), ref: 'cap. 3', viz: { type: 'bars4', items: bars4, note: S2 ? 'Pattern secondario · ' + plain(T(S2.etichetta)) : '' } },
      { lab: 'Sistema decisionale', val: T(D.etichetta), syn: T(D.sintesi), ref: 'cap. 4', viz: bip(p.decisione, 'decisione-A', 'decisione-N') },
      { lab: 'Interfacce', val: T(C.etichetta), syn: T(C.sintesi), ref: 'cap. 5', viz: bip(p.conflitto, 'conflitto-D', 'conflitto-P') },
      { lab: 'Carburante', val: T(MO.etichetta), syn: T(MO.sintesi), ref: 'cap. 6', viz: { type: 'dots', items: dots } },
      { lab: 'Missione in corso', val: T(MI.etichetta), syn: T(MI.sintesi), ref: 'cap. 7', viz: null },
    ];
    const traits = ['E', 'A', 'C', 'N', 'O'].map((t) => {
      const m = mod('tratto-' + t), tr = p.tratti[t];
      return { name: plain(T(m.titolo)), def: T(m.body), low: plain(T(m.basso)), high: plain(T(m.alto)), x: (tr.media - 1) / 4, band: FASCIA[tr.fascia], text: T(m.fascia[tr.fascia]),
        lavoro: T(m.lavoro[tr.fascia]), idea: T(m.idea[tr.fascia]) };
    });
    sec('chapter', [chHead(1, 'Il tuo profilo in sintesi', 'Scheda tecnica', ''), { k: 'md', b: md(F('scheda').body) }, { k: 'spec', rows }, ...bilNotes,
      { k: 'newpage' }, { k: 'h2', r: T(F('tratti-intro').titolo) }, { k: 'md', b: md(F('tratti-intro').body) }, { k: 'traits', rows: traits }, ...curios(F('tratti-intro'), 1)]);

    // 2-6: ogni capitolo ha In breve, il testo con una citazione, le curiosità dalla ricerca
    const open = (n, kicker, M0, title, sintesi) => [chHead(n, kicker, title, sintesi), ...(M0.inbreve ? [{ k: 'inbreve', items: M0.inbreve.map(T) }] : [])];
    const diagram = (id, svg, cap) => { addFonte(cap, plain(T(F(id).titolo)), F(id).fonte); return { k: 'diagram', title: T(F(id).titolo), b: md(F(id).body), svg, fonte: F(id).fonte }; };
    sec('chapter', [...open(2, 'Alimentazione', E, E.titolo, E.sintesi), ...bodyWithQuote(E), ...curios(E, 2)]);
    sec('chapter', [...open(3, 'Comportamento sotto carico', S, S.titolo, S.sintesi), ...bodyWithQuote(S),
      diagram('curva-pressione', svgCurve(plain(T(S.etichetta))), 3), { k: 'box', b: md(S.ruolo[p.ruolo]) },
      ...(S2 ? [{ k: 'box', b: md(S2.secondario) }] : []), ...curios(S, 3)]);
    const combo = (X, a, b) => ({ k: 'combo', title: T(X.titolo), cx: `${plain(T(a))} × ${plain(T(b))}`, b: md(X.body) });
    sec('chapter', [...open(4, 'Sistema decisionale', D, D.titolo, D.sintesi), ...bodyWithQuote(D),
      diagram('matrice-decisione', svgMatrix('decisione', p.decisione.intuitivo, p.decisione.razionale), 4),
      ...(p.decisione.entrambi && bil['decisione-entrambi'] ? [{ k: 'box', b: md(bil['decisione-entrambi']) }] : []), ...curios(D, 4), combo(SD, S.etichetta, D.etichetta)]);
    sec('chapter', [...open(5, 'Interfacce: relazioni e disaccordi', C, C.titolo, C.sintesi), ...bodyWithQuote(C),
      diagram('matrice-conflitto', svgMatrix('conflitto', p.conflitto.relazione, p.conflitto.assertivita), 5), ...curios(C, 5), combo(SC, S.etichetta, C.etichetta)]);
    sec('chapter', [...open(6, 'Carburante', MO, MO.titolo.replace('Carburante: ', ''), MO.sintesi), ...bodyWithQuote(MO), ...curios(MO, 6)]);

    // 7. Missione + piano personale
    const PP = F('piano-personale');
    sec('chapter', [...open(7, 'Missione in corso', MI, MI.etichetta, MI.sintesi), { k: 'md', b: md(MI.body) }, { k: 'box', b: md(MI.rischio[p.stress.primary]) }, ...curios(MI, 7),
      { k: 'newpage' }, { k: 'h3', r: T(PP.titolo) }, { k: 'md', b: md(PP.body.split('\n1.')[0]) },
      { k: 'plan', items: [
        { q: '1. Tra 90 giorni, da che cosa capirai di aver raggiunto il risultato?', h: 4 },
        { q: '2. Quale segnale controllerai ogni due settimane?', h: 2 },
        { q: '3. Qual è la prima cosa che farai nei prossimi sette giorni?', h: 2 },
        { q: '4. Completa la frase. Se succede ______, allora io ______.', h: 3 }] }, ...curios(PP, 7)]);

    // 8. Protocollo
    const prac = [[S, 3], [E, 2], [D, 4], [C, 5], [MO, 6]];
    sec('chapter', [chHead(8, 'Protocollo di manutenzione', 'Cinque pratiche per te', ''), { k: 'md', b: md(F('protocollo-intro').body) },
      { k: 'prac', items: prac.map(([m, n]) => ({ f: m.pratica.freq, title: T(m.pratica.titolo), text: T(m.pratica.testo), from: `Dal capitolo ${n}` })) }]);

    // 9. Problemi
    const groups = [['Energia', [E]], ['Sotto carico', [S]], ['Decisioni', [D, SD]], ['Disaccordi', [C, SC]], ['Motivazione', [MO]], ['Missione in corso', [MI]]];
    sec('chapter', [chHead(9, 'Risoluzione dei problemi', 'Se succede questo, fai così', ''), { k: 'md', b: md(F('problemi-intro').body) },
      { k: 'probs', groups: groups.map(([g, ms]) => ({ g, items: ms.flatMap((m) => m.problemi || []).map((pr) => ({ q: T(pr.titolo), a: T(pr.testo) })) })) }]);

    // 10. Istruzioni per gli altri
    const secs = [['La mia energia', E], ['Sotto pressione', S], ['Quando decidiamo', D], ['Quando non siamo d’accordo', C], ['Cosa mi motiva', MO]];
    sec('chapter', [chHead(10, 'Istruzioni per gli altri', 'Una pagina da condividere', ''), { k: 'md', b: md(F('altri-intro').body) }]);
    sec('page', [{ k: 'card', title: `Come lavorare con ${user.nome}`, sub: 'Manuale d’uso in una pagina',
      secs: secs.map(([t, m]) => ({ t, items: m.altri.map(T) })), foot: `Dal manuale «${user.nome}. Istruzioni per l’uso» · ${CONFIG.BRAND} · ${opts.data}` }]);

    // 11. Pagine di lavoro
    const qs = chosen.flatMap((m) => m.domande || []);
    sec('chapter', [chHead(11, 'Pagine di lavoro', 'Domande scelte per te', ''), { k: 'md', b: md(F('pagine-lavoro-intro').body) },
      { k: 'work', items: qs.map((q, i) => ({ n: i + 1, q: T(q) })) }]);

    // Chiusura, metodo, avvertenze
    sec('page', letter('lettera-chiusura'));
    sec('page', [{ k: 'title', r: T(F('fonti-intro').titolo) }, { k: 'small', b: md(F('fonti-intro').body) }, { k: 'fonti', items: fonti }]);
    sec('page', [{ k: 'title', r: T(F('nota-metodo').titolo) }, { k: 'small', b: md(F('nota-metodo').body) }]);
    sec('page', [{ k: 'title', r: T(F('avvertenze').titolo) }, { k: 'small', b: md(F('avvertenze').body) },
      { k: 'colophon', lines: [
        `«${user.nome}. Istruzioni per l’uso» · Edizione 1 di 1 · N. ${opts.serie}`,
        `Composto il ${opts.data} a partire dal profilo ${code}.`,
        `Testi di ${CONFIG.AUTORE_ESTESO}.`,
        `${CONFIG.BRAND} · ${CONFIG.SITO}`,
        `Ti consiglio di rileggerlo e di rifare il percorso intorno al ${opts.revisione}.`,
        'Caratteri Fraunces, Literata e Inter, distribuiti con licenza SIL Open Font License.'] }]);

    return { sections, user, opts, filename: `UnodiUno_${user.nome.replace(/[^\p{L}\p{N}]+/gu, '')}_${opts.serie}.pdf` };
  }
  function chHead(n, kicker, title, sintesi) { return { k: 'chhead', n: pad(n), kicker, title: T(title), sintesi: sintesi ? T(sintesi) : null }; }

  // ---------- Diagrammi (SVG unico per schermo e PDF) ----------
  const xesc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SV = { teal: '#17404A', acc: '#B4603A', muted: '#6C7478', rule: '#D8D2C8', tint: '#EAF1F0', paper: '#F7F2EB' };
  const txt = (x, y, t, o = {}) => `<text x="${x}" y="${y}" font-family="${o.f || 'Inter'}" font-size="${o.s || 8}"${o.i ? ' font-style="italic"' : ''}${o.w ? ` font-weight="${o.w}"` : ''} fill="${o.c || SV.muted}"${o.a ? ` text-anchor="${o.a}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${xesc(t)}</text>`;
  // Curva di Yerkes-Dodson con il punto in cui si accende il pattern del lettore
  function svgCurve(pattern) {
    const name = pattern.length > 16 ? pattern.slice(0, 16) + '…' : pattern;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 196" width="320" height="196">
<rect x="118" y="16" width="104" height="144" fill="${SV.tint}"/>
<line x1="30" y1="160" x2="308" y2="160" stroke="${SV.muted}" stroke-width="0.8"/>
<line x1="30" y1="160" x2="30" y2="14" stroke="${SV.muted}" stroke-width="0.8"/>
<path d="M40 155 C110 -5 230 -5 300 155" fill="none" stroke="${SV.teal}" stroke-width="2"/>
<circle cx="240" cy="65" r="5" fill="${SV.acc}"/>
<line x1="242" y1="60" x2="258" y2="48" stroke="${SV.acc}" stroke-width="0.8"/>
${txt(316, 31, 'Qui si accende', { s: 7.5, c: SV.acc, a: 'end' })}
${txt(316, 44, name, { f: 'Fraunces', s: 10, i: 1, c: SV.acc, a: 'end' })}
${txt(36, 12, 'PRESTAZIONE', { s: 6.5, ls: 1 })}
${txt(308, 186, 'PRESSIONE', { s: 6.5, ls: 1, a: 'end' })}
${txt(74, 173, 'Troppo poca', { s: 7.5, a: 'middle' })}
${txt(170, 173, 'Zona utile', { f: 'Fraunces', s: 10, i: 1, c: SV.teal, a: 'middle' })}
${txt(266, 173, 'Oltre il picco', { s: 7.5, a: 'middle' })}
</svg>`;
  }
  // Matrice a due assi (scala 1-5 su entrambi) con il punto del lettore
  function svgMatrix(kind, xv, yv) {
    const L = kind === 'decisione'
      ? { x: 'INTUITO', y: 'ANALISI', q: ['Analisi', 'Doppio motore', 'Cerca conferme', 'Intuito'], c: null }
      : { x: 'ATTENZIONE ALLA RELAZIONE', y: 'ASSERTIVITÀ', q: ['Competere', 'Collaborare', 'Evitare', 'Accomodare'], c: 'Compromesso' };
    const x0 = 46, x1 = 290, y0 = 12, y1 = 212, W = x1 - x0, H = y1 - y0;
    const cx = x0 + W / 2, cy = y0 + H / 2;
    const px = x0 + Math.max(0.04, Math.min(0.96, (xv - 1) / 4)) * W, py = y1 - Math.max(0.04, Math.min(0.96, (yv - 1) / 4)) * H;
    const q = (t, x, y, a) => txt(x, y, t, { f: 'Fraunces', s: 11, i: 1, c: SV.teal, a });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 240" width="300" height="240">
<rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="${SV.paper}" stroke="${SV.rule}" stroke-width="0.8"/>
<line x1="${cx}" y1="${y0}" x2="${cx}" y2="${y1}" stroke="${SV.rule}" stroke-width="0.8" stroke-dasharray="3 3"/>
<line x1="${x0}" y1="${cy}" x2="${x1}" y2="${cy}" stroke="${SV.rule}" stroke-width="0.8" stroke-dasharray="3 3"/>
${q(L.q[0], x0 + 8, y0 + 18)}${q(L.q[1], x1 - 8, y0 + 18, 'end')}${q(L.q[2], x0 + 8, y1 - 9)}${q(L.q[3], x1 - 8, y1 - 9, 'end')}
${L.c ? `<circle cx="${cx}" cy="${cy}" r="24" fill="none" stroke="${SV.rule}" stroke-width="0.8"/>${txt(cx, cy - 28, L.c, { f: 'Fraunces', s: 9, i: 1, c: SV.teal, a: 'middle' })}` : ''}
<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="6.5" fill="${SV.acc}"/>
${txt(px.toFixed(1), (py + 3).toFixed(1), 'tu', { s: 7, w: 'bold', c: '#FFFFFF', a: 'middle' })}
${txt(x0, 228, 'poco', { s: 7 })}${txt(x1, 228, 'molto', { s: 7, a: 'end' })}${txt(cx, 228, L.x, { s: 6.5, ls: 1, a: 'middle' })}
${txt(36, y1, 'poco', { s: 7, a: 'end' })}${txt(36, y0 + 7, 'molto', { s: 7, a: 'end' })}
<g transform="rotate(-90 26 ${cy})">${txt(26, cy, L.y, { s: 6.5, ls: 1, a: 'middle' })}</g>
</svg>`;
  }

  // ---------- HTML ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hr = (r) => r.map((x) => (x.b ? `<strong>${esc(x.text)}</strong>` : x.i ? `<em>${esc(x.text)}</em>` : esc(x.text))).join('');
  const hblocks = (bs) => bs.map((b) => (b.t === 'p' ? `<p>${hr(b.r)}</p>` : b.t === 'h3' ? `<h3>${hr(b.r)}</h3>`
    : `<${b.t}>${b.items.map((i) => `<li>${hr(i)}</li>`).join('')}</${b.t}>`)).join('');
  const pct = (x) => (Math.max(0, Math.min(1, x)) * 100).toFixed(1) + '%';

  function hviz(v) {
    if (!v) return '';
    if (v.type === 'bipolar') return `<div class="bar"><span class="line"></span><span class="mk" style="left:${pct((1 - v.n) / 2)}"></span></div><div class="bar-l"><span>${esc(v.l)}</span><span>${esc(v.r)}</span></div><div class="int">${esc(v.int)}</div>`;
    if (v.type === 'bars4') return `<div class="bars4">${v.items.map((i) => `<div class="b${i.on ? ' on' : ''}"><span>${esc(i.label)}</span><span class="tr"><span class="fl" style="width:${pct(i.pct)}"></span></span></div>`).join('')}</div>${v.note ? `<div class="int">${esc(v.note)}</div>` : ''}`;
    if (v.type === 'dots') return `<div class="dots">${v.items.map((i) => `<span class="${i.on ? 'on' : ''}">${esc(i.label)} ${'●'.repeat(i.count)}${'○'.repeat(4 - i.count)}</span>`).join('')}</div>`;
    return '';
  }
  function hblock(b) {
    switch (b.k) {
      case 'cover': return `<div class="cover"><div class="brand"><span>${esc(CONFIG.BRAND)}</span><span>Libri scritti per una persona</span></div><div class="ring"></div><div class="ring r2"></div><div class="dot"></div>
        <div class="nm"><div class="name">${esc(b.nome)}</div><div class="title">Istruzioni per l’uso</div></div><div class="pl">${esc(b.line)}</div>
        <div class="foot"><span class="ed">Edizione 1 di 1</span><span>${esc(b.data)} · N. ${esc(b.serie)}</span></div></div>`;
      case 'toc': return `<p class="toc-for">${esc(b.forName)}</p><h2 class="toc-h">Indice</h2><ol class="toc">${b.items.map((i) => `<li><span class="n">${i.n}</span><span class="t">${esc(i.t)}<span class="s">${hr(i.s)}</span></span></li>`).join('')}</ol>`;
      case 'title': return `<h2 class="pre-h">${hr(b.r)}</h2>`;
      case 'h2': return `<h2 class="h2">${hr(b.r)}</h2>`;
      case 'h3': return `<h3>${hr(b.r)}</h3>`;
      case 'md': return hblocks(b.b);
      case 'sign': return `<p class="sign">${hr(b.r)}</p>`;
      case 'small': return `<div class="small">${hblocks(b.b)}</div>`;
      case 'box': return `<div class="box">${hblocks(b.b)}</div>`;
      case 'newpage': return '<div class="newpage"></div>';
      case 'chhead': return `<div class="ch-head"><div class="ch-num">${b.n}</div><div class="ch-kicker">${esc(b.kicker)}</div><h2 class="ch-title">${hr(b.title)}</h2>${b.sintesi ? `<p class="ch-sintesi">${hr(b.sintesi)}</p>` : ''}</div>`;
      case 'combo': return `<div class="combo"><div class="k">La tua combinazione</div><div class="ct">${hr(b.title)}</div><div class="cx">${esc(b.cx)}</div>${hblocks(b.b)}</div>`;
      case 'spec': return `<div class="spec">${b.rows.map((r) => `<div class="row"><div class="lab">${esc(r.lab)}</div><div><div class="val">${hr(r.val)}</div><div class="syn">${hr(r.syn)}</div>${hviz(r.viz)}</div><div class="ref">${esc(r.ref)}</div></div>`).join('')}</div>`;
      case 'traits': return `<div class="traits">${b.rows.map((r) => `<div class="trait"><div class="tn">${esc(r.name)}</div><div class="td">${hr(r.def)}</div>
        <div class="bar"><span class="line"></span><span class="mk" style="left:${pct(r.x)}"></span></div><div class="bar-l"><span>${esc(r.low)}</span><span>${esc(r.high)}</span></div>
        <div class="int">${esc(r.band)}</div><p>${hr(r.text)}</p><p class="tl">${hr(r.lavoro)}</p><p class="ti">${hr(ideaRuns(r.idea))}</p></div>`).join('')}</div>`;
      case 'prac': return b.items.map((i) => `<div class="prac"><div class="f">${esc(i.f)}</div><div><div class="pt">${hr(i.title)}</div><p>${hr(i.text)}</p><div class="pr">${esc(i.from)}</div></div></div>`).join('');
      case 'probs': return b.groups.map((g) => `<div class="pgroup">${esc(g.g)}</div>${g.items.map((i) => `<div class="prob"><p class="q">${hr(i.q)}</p><p class="a">${hr(i.a)}</p></div>`).join('')}`).join('');
      case 'card': return `<div class="card"><div class="ch">${esc(b.title)}</div><div class="cs">${esc(b.sub)}</div>${b.secs.map((s) => `<div class="sec">${esc(s.t)}</div><ul>${s.items.map((i) => `<li>${hr(i)}</li>`).join('')}</ul>`).join('')}<div class="cf">${esc(b.foot)}</div></div>`;
      case 'work': return b.items.map((i) => `<div class="wq"><p class="qq">${i.n}. ${hr(i.q)}</p><div class="lines"></div></div>`).join('');
      case 'plan': return b.items.map((i) => `<div class="wq"><p class="qq">${esc(i.q)}</p><div class="lines" style="--n:${i.h}"></div></div>`).join('');
      case 'colophon': return `<div class="colophon">${b.lines.map(esc).join('<br>')}</div>`;
      case 'inbreve': return `<div class="inbreve"><div class="k">In breve</div><ol>${b.items.map((i) => `<li>${hr(i)}</li>`).join('')}</ol></div>`;
      case 'quote': return `<blockquote class="quote">${hr(b.r)}</blockquote>`;
      case 'curio': return `<aside class="curio"><div class="k">Dalla ricerca</div><div class="ct">${hr(b.title)}</div>${hblocks(b.b)}<div class="src">${esc(b.fonte)}</div></aside>`;
      case 'diagram': return `<figure class="diagram"><h3>${hr(b.title)}</h3>${hblocks(b.b)}<div class="svg">${b.svg}</div><figcaption>${esc(b.fonte)}</figcaption></figure>`;
      case 'fonti': return `<ol class="fonti">${b.items.map((i) => `<li><span class="ft">Cap. ${i.cap} · ${esc(i.t)}</span>${esc(i.f)}</li>`).join('')}</ol>`;
      default: return '';
    }
  }
  // etichetta in grassetto davanti al suggerimento del tratto
  const ideaRuns = (r) => [{ text: 'Da provare. ', b: true }, ...r];
  const toHTML = (book) => book.sections.map((s) => `<section class="bk-${s.type}">${s.blocks.map(hblock).join('')}</section>`).join('');

  // ---------- PDF (pdfmake) ----------
  const COL = { ink: '#1F2A2E', teal: '#17404A', accent: '#B4603A', muted: '#6C7478', rule: '#D8D2C8', cream: '#F4EDE3', tint: '#F7F2EB', track: '#EFE9E0', num: '#8B9195' };
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
      if (b.t === 'h3') return { text: pr(b.r), font: 'Fraunces', bold: true, fontSize: 12, color: COL.teal, margin: [0, 9, 0, 4], headlineLevel: 1 };
      return { [b.t]: b.items.map((i) => ({ text: pr(i), fontSize: size, margin: [0, 0, 0, 3] })), margin: [0, 0, 0, 7], markerColor: COL.accent };
    });
  }
  function pbar(x, l, r, w) {
    return [{ canvas: [{ type: 'line', x1: 0, y1: 4, x2: w, y2: 4, lineWidth: 0.6, lineColor: COL.rule },
      { type: 'ellipse', x: Math.max(4, Math.min(w - 4, x * w)), y: 4, r1: 3.6, r2: 3.6, color: COL.accent }], margin: [0, 5, 0, 1] },
    { columns: [{ text: l, alignment: 'left' }, { text: r, alignment: 'right' }], font: 'InterMid', fontSize: 6.3, color: COL.muted }];
  }
  function pviz(v, w) {
    if (!v) return [];
    if (v.type === 'bipolar') return [...pbar((1 - v.n) / 2, v.l, v.r, w), { text: v.int, font: 'InterMid', fontSize: 6.8, color: COL.muted, margin: [0, 2, 0, 0] }];
    if (v.type === 'bars4') {
      const tw = w - 68;
      return [...v.items.map((i) => ({ columns: [
        { width: 66, text: i.label, font: 'InterMid', fontSize: 6.6, color: i.on ? COL.ink : COL.muted },
        { width: tw, canvas: [{ type: 'rect', x: 0, y: 2.5, w: tw, h: 4.5, r: 2, color: COL.track },
          ...(i.pct > 0 ? [{ type: 'rect', x: 0, y: 2.5, w: Math.max(4, tw * i.pct), h: 4.5, r: 2, color: i.on ? COL.accent : '#B9B5AE' }] : [])] }],
        columnGap: 2, margin: [0, i === v.items[0] ? 5 : 1.5, 0, 0] })),
        ...(v.note ? [{ text: v.note, font: 'InterMid', fontSize: 6.8, color: COL.muted, margin: [0, 3, 0, 0] }] : [])];
    }
    if (v.type === 'dots') {
      return [{ columns: v.items.map((i) => ({ width: 'auto', stack: [
        { text: i.label, font: 'InterMid', fontSize: 6.6, color: i.on ? COL.accent : COL.muted },
        { canvas: [0, 1, 2, 3].map((j) => ({ type: 'ellipse', x: 3 + j * 8, y: 4, r1: 2.6, r2: 2.6, ...(j < i.count ? { color: i.on ? COL.accent : COL.muted } : { lineColor: COL.muted, lineWidth: 0.5 }) })) }] })),
        columnGap: 10, margin: [0, 5, 0, 0] }];
    }
    return [];
  }
  const boxTable = (content, { fill = COL.tint, left = COL.accent, pad = 10, margin = [0, 7, 0, 7] } = {}) => ({
    table: { widths: ['*'], body: [[{ stack: content, fillColor: fill }]] },
    layout: { hLineWidth: () => 0, vLineWidth: (i) => (i === 0 ? 2.4 : 0), vLineColor: () => left, paddingLeft: () => pad + 2, paddingRight: () => pad, paddingTop: () => pad - 1, paddingBottom: () => pad - 4 },
    margin,
  });
  const linesCanvas = (n) => ({ canvas: Array.from({ length: n }, (_, j) => ({ type: 'line', x1: 0, y1: 19.8 * (j + 1), x2: W, y2: 19.8 * (j + 1), lineWidth: 0.5, lineColor: '#C9C1B4' })), margin: [0, 0, 0, 6] });

  function pblock(b) {
    switch (b.k) {
      case 'cover': return [{ text: ' ' }]; // la copertina è disegnata nello sfondo della pagina 1 (coverLayer)
      case 'toc': return [
        kick(b.forName, COL.accent, 7.5, { margin: [0, 0, 0, 8] }),
        { text: 'Indice', font: 'Fraunces', fontSize: 24, color: COL.teal, margin: [0, 0, 0, 12] },
        ...b.items.flatMap((i) => [{ columns: [{ width: 28, text: i.n, font: 'Fraunces', fontSize: 14, lineHeight: 1, color: COL.accent }, { stack: [{ text: i.t, bold: true, fontSize: 9.6, lineHeight: 1.15 }, { text: pr(i.s), italics: true, fontSize: 8.2, lineHeight: 1.15, color: COL.muted }] }], margin: [0, 3.5, 0, 0] }, rule(W, [0, 3.5, 0, 0])]),
      ];
      case 'title': return [{ text: pr(b.r), font: 'Fraunces', fontSize: 20, color: COL.teal, margin: [0, 0, 0, 16] }];
      case 'h2': return [{ text: pr(b.r), font: 'Fraunces', fontSize: 18, color: COL.teal, margin: [0, 0, 0, 8] }];
      case 'h3': return [{ text: pr(b.r), font: 'Fraunces', bold: true, fontSize: 12, color: COL.teal, margin: [0, 10, 0, 4] }];
      case 'md': return pblocks(b.b, b.letter ? 10.2 : 10);
      case 'sign': return [{ text: pr(b.r), font: 'Fraunces', italics: true, fontSize: 15, color: COL.teal, margin: [0, 8, 0, 0] }];
      case 'small': return [{ stack: pblocks(b.b, 8.4), color: COL.ink }];
      case 'box': return [boxTable(pblocks(b.b, 9.6))];
      case 'newpage': return [{ text: '', pageBreak: 'after' }];
      case 'chhead': return [{ stack: [
        { text: b.n, font: 'Fraunces', fontSize: 46, color: COL.accent, lineHeight: 0.9, margin: [0, 0, 0, 10] },
        kick(b.kicker, COL.muted, 7.5, { margin: [0, 0, 0, 4] }),
        { text: pr(b.title), font: 'Fraunces', fontSize: 24, lineHeight: 1.05, color: COL.teal, margin: [0, 0, 0, 7] },
        ...(b.sintesi ? [{ text: pr(b.sintesi), italics: true, color: COL.muted, fontSize: 10 }] : []),
        rule(W, [0, 12, 0, 16])], unbreakable: true }];
      case 'combo': {
        const [first, ...rest] = pblocks(b.b);
        return [{ stack: [rule(W, [0, 14, 0, 14]), kick('La tua combinazione', COL.accent, 7, { margin: [0, 0, 0, 3] }),
          { text: pr(b.title), font: 'FrauncesMid', fontSize: 16, color: COL.teal, margin: [0, 0, 0, 3] },
          { text: b.cx, font: 'InterMid', fontSize: 8, color: COL.muted, margin: [0, 0, 0, 10] }, first].filter(Boolean), unbreakable: true }, ...rest];
      }
      case 'spec': {
        const vw = W - 76 - 32 - 8;
        return [{ table: { widths: [76, '*', 32], dontBreakRows: true, body: b.rows.map((r) => [
          { text: up(r.lab), font: 'Inter', bold: true, fontSize: 6.6, characterSpacing: 0.9, color: COL.muted, margin: [0, 3, 0, 0] },
          { stack: [{ text: pr(r.val), font: 'FrauncesMid', fontSize: 13, color: COL.teal }, { text: pr(r.syn), fontSize: 8.6, margin: [0, 3, 0, 0] }, ...pviz(r.viz, vw)] },
          { text: r.ref, font: 'InterMid', fontSize: 7, color: COL.accent, alignment: 'right', margin: [0, 3, 0, 0] }]) },
          layout: { hLineWidth: (i) => (i === 0 ? 0 : 0.5), vLineWidth: () => 0, hLineColor: () => COL.rule, paddingLeft: (i) => (i === 1 ? 4 : 0), paddingRight: (i) => (i === 1 ? 4 : 0), paddingTop: () => 9, paddingBottom: () => 9 },
          margin: [0, 4, 0, 8] }];
      }
      case 'traits': return b.rows.map((r) => ({ stack: [
        { text: r.name, font: 'FrauncesMid', fontSize: 13, color: COL.teal },
        { text: pr(r.def), italics: true, fontSize: 8, lineHeight: 1.2, color: COL.muted, margin: [0, 1, 0, 0] },
        ...pbar(r.x, r.low, r.high, W),
        { text: r.band, font: 'InterMid', fontSize: 6.8, color: COL.accent, margin: [0, 2, 0, 3] },
        { text: pr(r.text), fontSize: 9, lineHeight: 1.25 },
        { text: pr(r.lavoro), fontSize: 8.6, lineHeight: 1.25, color: COL.ink, margin: [0, 3, 0, 0] },
        { text: pr(ideaRuns(r.idea)), fontSize: 8.6, lineHeight: 1.25, color: COL.teal, margin: [0, 3, 0, 0] }, rule(W, [0, 7, 0, 7])], unbreakable: true }));
      case 'prac': return b.items.map((i) => ({ stack: [{ columns: [
        { width: 70, text: up(i.f), font: 'Inter', bold: true, fontSize: 6.6, characterSpacing: 0.8, color: COL.accent, margin: [0, 2, 0, 0] },
        { stack: [{ text: pr(i.title), font: 'Fraunces', bold: true, fontSize: 10.5, color: COL.teal, margin: [0, 0, 0, 3] }, { text: pr(i.text), fontSize: 9.4 }, { text: i.from, font: 'InterMid', fontSize: 7, color: COL.muted, margin: [0, 3, 0, 0] }] }], columnGap: 10 },
        rule(W, [0, 10, 0, 10])], unbreakable: true }));
      case 'probs': return b.groups.flatMap((g) => g.items.map((i, j) => ({ stack: [
        ...(j === 0 ? [kick(g.g, COL.muted, 7.2, { margin: [0, 12, 0, 6] })] : []),
        { table: { widths: ['*'], body: [[{ stack: [{ text: pr(i.q), bold: true, fontSize: 9.8, margin: [0, 0, 0, 2] }, { text: pr(i.a), fontSize: 9.3 }] }]] },
          layout: { hLineWidth: () => 0, vLineWidth: (k) => (k === 0 ? 0.6 : 0), vLineColor: () => COL.rule, paddingLeft: () => 10, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 }, margin: [0, 0, 0, 10] }],
        unbreakable: true })));
      case 'card': return [{ table: { widths: ['*'], body: [[{ stack: [
        { text: b.title, font: 'Fraunces', fontSize: 15, lineHeight: 1.1, color: COL.teal },
        kick(b.sub, COL.accent, 7, { margin: [0, 2, 0, 6] }),
        ...b.secs.flatMap((s) => [kick(s.t, COL.muted, 6.4, { margin: [0, 5, 0, 1.5] }), { ul: s.items.map((i) => ({ text: pr(i), fontSize: 7.7, lineHeight: 1.22, margin: [0, 0, 0, 1] })), markerColor: COL.accent }]),
        rule(W - 28, [0, 8, 0, 4]), { text: b.foot, font: 'Inter', fontSize: 6.6, color: COL.muted }] }]] },
        layout: { hLineWidth: () => 0.8, vLineWidth: () => 0.8, hLineColor: () => COL.teal, vLineColor: () => COL.teal, paddingLeft: () => 13, paddingRight: () => 13, paddingTop: () => 12, paddingBottom: () => 10 }, unbreakable: true }];
      case 'work': return b.items.map((i) => ({ stack: [{ text: [`${i.n}. `, ...pr(i.q)], bold: true, fontSize: 9.8, margin: [0, 0, 0, 2] }, linesCanvas(5)], unbreakable: true }));
      case 'plan': return b.items.map((i) => ({ stack: [{ text: i.q, bold: true, fontSize: 9.6, margin: [0, 0, 0, 2] }, linesCanvas(i.h)], unbreakable: true }));
      case 'colophon': return [rule(W, [0, 24, 0, 8]), { text: b.lines.join('\n'), font: 'Inter', fontSize: 7, lineHeight: 1.45, color: COL.muted }];
      case 'inbreve': return [{ stack: [
        rule(W, [0, 0, 0, 7], COL.accent), kick('In breve', COL.accent, 7, { margin: [0, 0, 0, 5] }),
        ...b.items.map((r, i) => ({ columns: [{ width: 16, text: String(i + 1), font: 'Fraunces', fontSize: 12, color: COL.accent, lineHeight: 1 }, { text: pr(r), fontSize: 9.4, lineHeight: 1.25 }], margin: [0, 0, 0, 4] })),
        rule(W, [0, 4, 0, 14])], unbreakable: true }];
      case 'quote': return [{ stack: [
        { canvas: [{ type: 'line', x1: (W - 60) / 2 - 20, y1: 0, x2: (W - 60) / 2 + 20, y2: 0, lineWidth: 1, lineColor: COL.accent }], margin: [30, 0, 30, 8] },
        { text: pr(b.r).map((x) => ({ ...x, italics: true })), font: 'Fraunces', fontSize: 15, lineHeight: 1.2, color: COL.teal, alignment: 'center' }],
        margin: [30, 10, 30, 16], unbreakable: true }];
      case 'curio': return [{ table: { widths: ['*'], body: [[{ stack: [
        kick('Dalla ricerca', COL.teal, 6.4, { margin: [0, 0, 0, 3] }),
        { text: pr(b.title), font: 'Fraunces', bold: true, fontSize: 11, color: COL.teal, lineHeight: 1.15, margin: [0, 0, 0, 4] },
        ...pblocks(b.b, 9).map((x) => ({ ...x, lineHeight: 1.28 })),
        { text: b.fonte, font: 'Inter', fontSize: 6.4, lineHeight: 1.3, color: COL.muted, margin: [0, 1, 0, 0] }], fillColor: '#EAF1F0' }]] },
        layout: { hLineWidth: () => 0, vLineWidth: (i) => (i === 0 ? 2.4 : 0), vLineColor: () => COL.teal, paddingLeft: () => 12, paddingRight: () => 10, paddingTop: () => 9, paddingBottom: () => 8 },
        margin: [0, 8, 0, 8], unbreakable: true }];
      case 'diagram': {
        // titolo e testo scorrono; solo il disegno con la sua fonte resta intero sulla stessa pagina
        const [first, ...rest] = pblocks(b.b, 9.4);
        return [{ stack: [{ text: pr(b.title), font: 'Fraunces', bold: true, fontSize: 12, color: COL.teal, margin: [0, 10, 0, 4] }, first], unbreakable: true }, ...rest,
          { stack: [{ svg: b.svg, width: Math.min(W, 290), alignment: 'center', margin: [0, 4, 0, 4] },
            { text: b.fonte, font: 'Inter', fontSize: 6.4, color: COL.muted, lineHeight: 1.3 }, rule(W, [0, 10, 0, 6])], unbreakable: true }];
      }
      case 'fonti': return b.items.map((i, n) => ({ stack: [
        { text: `${n + 1}. Cap. ${i.cap} · ${i.t}`, font: 'Inter', bold: true, fontSize: 7, color: COL.ink },
        { text: i.f, font: 'Inter', fontSize: 7, lineHeight: 1.3, color: COL.muted, margin: [0, 1, 0, 6] }], unbreakable: true }));
      default: return [];
    }
  }

  function coverLayer(b, size) {
    const nsize = b.nome.length > 14 ? 30 : b.nome.length > 9 ? 36 : 42;
    return [
      { canvas: [
        { type: 'rect', x: 0, y: 0, w: size.width, h: size.height, color: COL.teal },
        { type: 'ellipse', x: 126 * MM, y: 94 * MM, r1: 60 * MM, r2: 60 * MM, lineColor: '#557074', lineWidth: 0.6 },
        { type: 'ellipse', x: 126 * MM, y: 94 * MM, r1: 46 * MM, r2: 46 * MM, lineColor: '#3F5F66', lineWidth: 0.6 },
        { type: 'ellipse', x: 115 * MM, y: 95 * MM, r1: 3 * MM, r2: 3 * MM, color: COL.accent }], absolutePosition: { x: 0, y: 0 } },
      { columns: [{ width: W * 0.35, text: up(CONFIG.BRAND) }, { width: W * 0.65, text: up('Libri scritti per una persona'), alignment: 'right' }], font: 'InterMid', fontSize: 7, characterSpacing: 2, color: COL.cream, absolutePosition: { x: MARG_X, y: 16 * MM } },
      { width: W, stack: [{ text: b.nome, font: 'Fraunces', fontSize: nsize, lineHeight: 0.98, color: COL.cream }, { text: 'Istruzioni per l’uso', font: 'Fraunces', italics: true, fontSize: 17, color: COL.cream, margin: [0, 6 * MM - 4, 0, 0] }],
        absolutePosition: { x: MARG_X, y: 102 * MM } },
      { columns: [{ width: W, text: up(b.line) }], font: 'InterMid', fontSize: 6.6, characterSpacing: 1, color: '#B9C3C2', absolutePosition: { x: MARG_X, y: 180 * MM } },
      { columns: [{ width: W * 0.4, text: 'Edizione 1 di 1', font: 'Fraunces', italics: true, fontSize: 11 }, { width: W * 0.6, text: `${b.data} · N. ${b.serie}`, font: 'Inter', fontSize: 7.5, alignment: 'right', margin: [0, 3, 0, 0] }],
        color: COL.cream, absolutePosition: { x: MARG_X, y: 190 * MM } },
    ];
  }

  function toPDF(book, fontBase) {
    const cover = book.sections[0].blocks.find((b) => b.k === 'cover');
    const content = [];
    book.sections.forEach((s, si) => {
      const nodes = s.blocks.flatMap(pblock);
      if (si > 0 && nodes.length) nodes[0] = { stack: [nodes[0]], pageBreak: 'before' };
      content.push(...nodes);
    });
    return {
      pageSize: 'A5',
      pageMargins: [MARG_X, 17 * MM, MARG_X, 19 * MM],
      info: { title: `${book.user.nome}. Istruzioni per l’uso`, author: 'Francesco Maragliulo', subject: 'Uno di Uno · Edizione 1 di 1', creator: 'Uno di Uno' },
      defaultStyle: { font: 'Literata', fontSize: 10, lineHeight: 1.32, color: COL.ink },
      background: (page, size) => (page === 1 && cover ? coverLayer(cover, size) : null),
      // Piè di pagina su TUTTE le pagine (copertina compresa): firma dell'autore + numero di pagina dalla 3
      footer: (page) => {
        const c = page === 1 ? '#A9BDBE' : COL.num;
        return { columns: [
          { text: [CONFIG.PIEDE, { text: CONFIG.PIEDE_SITO, link: 'https://' + CONFIG.PIEDE_SITO, color: c }], font: 'Inter', fontSize: 6.6, color: c, characterSpacing: 0.2 },
          { width: 24, text: page <= 2 ? '' : String(page), alignment: 'right', font: 'Inter', fontSize: 7.5, color: c }],
          margin: [MARG_X, 8 * MM, MARG_X, 0] };
      },
      content,
      _fonts: fonts(fontBase),
    };
  }

  async function downloadPDF(book, fontBase) {
    const dd = toPDF(book, fontBase);
    const f = dd._fonts; delete dd._fonts;
    const doc = window.pdfMake.createPdf(dd, null, f);
    await new Promise((resolve) => doc.download(book.filename, resolve));
  }
  function pdfBlob(book, fontBase) {
    const dd = toPDF(book, fontBase);
    const f = dd._fonts; delete dd._fonts;
    return new Promise((resolve) => window.pdfMake.createPdf(dd, null, f).getBlob(resolve));
  }

  // Testo breve per le pagine (anteprima del profilo): concordanze + grassetto/corsivo, in HTML sicuro
  function inline(s, g, user = {}) { CTX = { g, user, vars: {} }; return hr(runs(prep(s))); }

  return { CONFIG, compose, toHTML, toPDF, downloadPDF, pdfBlob, inline };
})();
if (typeof window !== 'undefined') window.UDUBook = UDUBook;
