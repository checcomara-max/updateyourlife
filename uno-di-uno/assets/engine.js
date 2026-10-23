/* =====================================================================
   UNO DI UNO — Motore v2 (questionario, punteggi, codice profilo)
   Impianto teorico: vedi /uno-di-uno/metodo/ e uno-di-uno/LEGGIMI.md.
   Se cambi domande, ordine o punteggi: cambia VERSION e la regex in decode().
   Gira nel browser (window.UDU) e in Node (module.exports) per i test.
   ===================================================================== */
const UDU = (() => {
  const VERSION = 'U2';

  // Scala unica per tutte le affermazioni (formato IPIP, 5 punti)
  const SCALE = [
    { v: 1, t: 'Per niente vero per me' }, { v: 2, t: 'Poco vero' }, { v: 3, t: 'In parte sì, in parte no' },
    { v: 4, t: 'Abbastanza vero' }, { v: 5, t: 'Del tutto vero per me' },
  ];

  // --- Affermazioni in ordine CANONICO (l'ordine del codice). key: +1 diretto, -1 invertito ---
  const ITEMS = [
    // A. Cinque grandi tratti: 4 affermazioni per tratto, 2 dirette e 2 invertite.
    //    Adattate liberamente dal Mini-IPIP (Donnellan et al., 2006), item IPIP di pubblico dominio.
    { id: 'E1', sc: 'E', key: 1, t: 'In un gruppo nuovo mi viene naturale attaccare discorso.' },
    { id: 'E2', sc: 'E', key: -1, t: 'In compagnia tendo a restare in disparte.' },
    { id: 'E3', sc: 'E', key: 1, t: 'Mi trovo a mio agio quando l’attenzione è su di me.' },
    { id: 'E4', sc: 'E', key: -1, t: 'Di solito parlo poco.' },
    { id: 'A1', sc: 'A', key: 1, t: 'Mi immedesimo facilmente in quello che provano gli altri.' },
    { id: 'A2', sc: 'A', key: -1, t: 'I problemi degli altri, in genere, mi interessano poco.' },
    { id: 'A3', sc: 'A', key: 1, t: 'Mi accorgo di come sta una persona anche quando non lo dice.' },
    { id: 'A4', sc: 'A', key: -1, t: 'Le vicende personali di chi mi sta intorno spesso mi lasciano indifferente.' },
    { id: 'C1', sc: 'C', key: 1, t: 'Sbrigo subito le cose da fare, invece di rimandarle.' },
    { id: 'C2', sc: 'C', key: -1, t: 'Spesso dimentico di rimettere le cose al loro posto.' },
    { id: 'C3', sc: 'C', key: 1, t: 'Mi piacciono l’ordine e l’organizzazione.' },
    { id: 'C4', sc: 'C', key: -1, t: 'Mi capita di fare le cose in modo approssimativo.' },
    { id: 'N1', sc: 'N', key: 1, t: 'Il mio umore cambia spesso.' },
    { id: 'N2', sc: 'N', key: -1, t: 'Il più delle volte vivo le giornate con calma.' },
    { id: 'N3', sc: 'N', key: 1, t: 'Mi agito o mi innervosisco facilmente.' },
    { id: 'N4', sc: 'N', key: -1, t: 'Raramente mi sento giù di morale.' },
    { id: 'O1', sc: 'O', key: 1, t: 'Ho un’immaginazione vivace.' },
    { id: 'O2', sc: 'O', key: -1, t: 'Le idee astratte mi interessano poco.' },
    { id: 'O3', sc: 'O', key: 1, t: 'Mi piace esplorare idee, punti di vista e modi di fare nuovi.' },
    { id: 'O4', sc: 'O', key: -1, t: 'Preferisco le strade conosciute alle novità.' },
    // B. Ricarica (esperienze di recupero, Sonnentag e Fritz, 2007): completano l'Estroversione per il cap. 2
    { id: 'RS', sc: 'REC', key: 1, t: 'Dopo una settimana pesante mi ricarico stando con altre persone.' },
    { id: 'RQ', sc: 'REC', key: -1, t: 'Dopo una giornata piena di persone ho bisogno di tempo per conto mio per recuperare.' },
    // C. Sotto pressione: quattro modi ricorrenti di fronteggiare il carico (coping), 3 affermazioni ciascuno
    { id: 'R1', sc: 'R', key: 1, t: 'Quando la pressione sale, tendo a fare le cose io, per avere la certezza che vengano fatte bene.' },
    { id: 'R2', sc: 'R', key: 1, t: 'Sotto pressione faccio fatica a delegare, anche quando so che dovrei.' },
    { id: 'R3', sc: 'R', key: 1, t: 'Nei periodi intensi controllo e ricontrollo i dettagli più del necessario.' },
    { id: 'K1', sc: 'K', key: 1, t: 'Sotto pressione mi capita di dire sì a richieste a cui avrei voluto dire no.' },
    { id: 'K2', sc: 'K', key: 1, t: 'Quando il clima è teso mi preoccupo più del malumore degli altri che del mio.' },
    { id: 'K3', sc: 'K', key: 1, t: 'Faccio fatica a chiedere aiuto, mentre offrirlo mi viene naturale.' },
    { id: 'P1', sc: 'C_', key: 1, t: 'Quando qualcosa mi preoccupa, ci penso anche di notte o nel tempo libero.' },
    { id: 'P2', sc: 'C_', key: 1, t: 'Prima di una situazione difficile immagino tutti gli scenari possibili, soprattutto quelli negativi.' },
    { id: 'P3', sc: 'C_', key: 1, t: 'Mi capita di ripassare mentalmente conversazioni già finite, chiedendomi cosa avrei dovuto dire.' },
    { id: 'S1', sc: 'S', key: 1, t: 'Quando sono sotto pressione parlo meno e tendo a chiudermi.' },
    { id: 'S2', sc: 'S', key: 1, t: 'Nei periodi difficili rimando le cose che mi pesano, anche quando sono importanti.' },
    { id: 'S3', sc: 'S', key: 1, t: 'Quando il carico diventa troppo, faccio il minimo indispensabile e aspetto che passi.' },
    // D. Decidere: stile razionale e stile intuitivo, misurati come due dimensioni distinte (Scott e Bruce, 1995)
    { id: 'DR1', sc: 'DR', key: 1, t: 'Prima di una decisione importante raccolgo tutte le informazioni che posso.' },
    { id: 'DR2', sc: 'DR', key: 1, t: 'Nelle scelte importanti confronto le alternative in modo ordinato, pro e contro.' },
    { id: 'DR3', sc: 'DR', key: 1, t: 'Nelle scelte importanti mi fido più dei numeri che delle sensazioni.' },
    { id: 'DI1', sc: 'DI', key: 1, t: 'Spesso so cosa fare prima ancora di saperlo spiegare.' },
    { id: 'DI2', sc: 'DI', key: 1, t: 'Quando decido, conta molto la sensazione che mi dà una scelta.' },
    { id: 'DI3', sc: 'DI', key: 1, t: 'Preferisco una decisione rapida e imperfetta a una perfetta ma tardiva.' },
    // E. Disaccordi: assertività e attenzione alla relazione, due dimensioni distinte (modello del doppio interesse)
    { id: 'CD1', sc: 'CD', key: 1, t: 'Se non sono d’accordo lo dico subito, anche davanti ad altri.' },
    { id: 'CD2', sc: 'CD', key: 1, t: 'Preferisco un confronto acceso oggi a un malinteso che dura mesi.' },
    { id: 'CD3', sc: 'CD', key: 1, t: 'In una discussione tengo la mia posizione finché non mi portano buone ragioni per cambiarla.' },
    { id: 'CP1', sc: 'CP', key: 1, t: 'Prima di affrontare un disaccordo cerco il momento e le parole giuste, a volte troppo a lungo.' },
    { id: 'CP2', sc: 'CP', key: 1, t: 'In un gruppo, mantenere un buon clima per me conta più che avere ragione.' },
    { id: 'CP3', sc: 'CP', key: 1, t: 'Pur di evitare tensioni, a volte lascio correre su cose che per me contano.' },
  ];
  const byId = Object.fromEntries(ITEMS.map((x) => [x.id, x]));

  // Ordine di presentazione dentro ogni parte (mescolato, fisso: le dimensioni non si riconoscono)
  const ORDER = {
    tratti: ['E1', 'A1', 'C1', 'N1', 'O1', 'RS', 'E2', 'A2', 'C2', 'N2', 'O2', 'E3', 'A3', 'C3', 'N3', 'O3', 'RQ', 'E4', 'A4', 'C4', 'N4', 'O4'],
    pressione: ['R1', 'P1', 'S1', 'K1', 'R2', 'P2', 'S2', 'K2', 'R3', 'P3', 'S3', 'K3'],
    relazioni: ['DR1', 'CD1', 'DI1', 'CP1', 'DR2', 'CD2', 'DI2', 'CP2', 'DR3', 'CD3', 'DI3', 'CP3'],
  };

  const CHOICE = {
    missione: { t: 'Quale frase descrive meglio il momento che stai vivendo?', opts: [
      { v: '1', t: 'Ho appena iniziato un nuovo ruolo o una nuova responsabilità, o sta per succedere.' },
      { v: '2', t: 'Ho troppo da fare e sento che le energie stanno finendo.' },
      { v: '3', t: 'Sto valutando un cambiamento importante: lavoro, carriera, direzione.' },
      { v: '4', t: 'Guido un team, o sto per farlo, e voglio farlo meglio.' },
      { v: '5', t: 'Sto ripartendo dopo un periodo difficile, professionale o personale.' } ] },
    ruolo: { t: 'Qual è la tua situazione professionale?', opts: [
      { v: 'C', t: 'Lavoro in un’organizzazione, senza responsabilità dirette su persone.' },
      { v: 'M', t: 'Guido persone: manager, responsabile, coordinatore.' },
      { v: 'L', t: 'Lavoro in proprio: imprenditore, libero professionista, consulente.' } ] },
    carico: { t: 'In questo periodo, quanto senti pesante il carico che porti?', opts: [
      { v: '1', t: 'Leggero: ho margine.' },
      { v: '2', t: 'Normale: impegnativo ma sostenibile.' },
      { v: '3', t: 'Pesante: faccio fatica a recuperare.' },
      { v: '4', t: 'Molto pesante: mi sento vicino al limite.' } ] },
    fc: { t: 'Pensa all’ultima settimana davvero difficile. Quale frase la descrive meglio?', opts: [
      { v: 'R', t: 'Ho preso in mano tutto io.' },
      { v: 'C', t: 'Non riuscivo a smettere di pensarci.' },
      { v: 'S', t: 'Ho tirato i remi in barca e ho rimandato.' },
      { v: 'K', t: 'Ho cercato di tenere tutti tranquilli, tranne me.' } ] },
    m1: { t: 'A fine anno, cosa ti farebbe dire: «È stato un anno riuscito»?', opts: [
      { v: 'G', t: 'Ho imparato a fare qualcosa che prima non sapevo fare.' },
      { v: 'R', t: 'Il mio lavoro è stato visto e riconosciuto.' },
      { v: 'A', t: 'Ho potuto decidere io come e quando lavorare.' },
      { v: 'S', t: 'Ho contribuito a qualcosa che conta davvero.' } ] },
    m2: { t: 'Cosa ti spegne più in fretta?', opts: [
      { v: 'A', t: 'Avere qualcuno che controlla ogni mio passo.' },
      { v: 'S', t: 'Non capire a cosa serve quello che faccio.' },
      { v: 'G', t: 'Fare sempre le stesse cose.' },
      { v: 'R', t: 'Lavorare tanto senza che nessuno se ne accorga.' } ] },
    m3: { t: 'Due proposte di lavoro identiche, tranne un dettaglio. Cosa ti fa scegliere?', opts: [
      { v: 'S', t: 'Una missione in cui credo.' },
      { v: 'G', t: 'Un percorso di crescita, con persone più brave di me.' },
      { v: 'R', t: 'Un ruolo più visibile, con un titolo che pesa.' },
      { v: 'A', t: 'Totale flessibilità su orari e luogo di lavoro.' } ] },
    m4: { t: 'Quale frase ti piacerebbe di più sentirti dire?', opts: [
      { v: 'R', t: '«Il tuo lavoro ha fatto la differenza, e lo sanno tutti.»' },
      { v: 'A', t: '«Fai come ritieni meglio: mi fido.»' },
      { v: 'S', t: '«Grazie a te, per qualcuno le cose sono cambiate.»' },
      { v: 'G', t: '«Hai fatto un salto di qualità impressionante.»' } ] },
    frase: { t: 'Quale di queste frasi ti ripeti più spesso nei momenti difficili?', opts: [
      { v: '3', t: '«E se poi va male?»' },
      { v: '8', t: '«Prima gli altri, poi io.»' },
      { v: '1', t: '«Se non lo faccio io, non lo fa nessuno.»' },
      { v: '5', t: '«Ci penso domani.»' },
      { v: '7', t: '«Non voglio disturbare.»' },
      { v: '2', t: '«Deve venire perfetto.»' },
      { v: '6', t: '«Non ne vale la pena.»' },
      { v: '4', t: '«Avrei dovuto fare diversamente.»' } ] },
  };

  // Le cinque parti del questionario, con la consegna specifica di ciascuna
  const PARTS = [
    { id: 'momento', titolo: 'Il tuo momento', intro: 'Tre domande sulla fase che stai vivendo. Servono a scegliere il capitolo sul piano dei 90 giorni.',
      ids: ['missione', 'ruolo', 'carico'] },
    { id: 'tratti', titolo: 'Come sei di solito', intro: 'Descriviti come sei in genere, al lavoro e fuori, negli ultimi mesi. Non come vorresti essere: come sei. Non ci sono risposte giuste.',
      stem: 'Come sei di solito', ids: ORDER.tratti },
    { id: 'pressione', titolo: 'Quando la pressione sale', intro: 'Pensa ai periodi di carico alto degli ultimi sei mesi: scadenze, imprevisti, tensioni.',
      stem: 'Quando la pressione sale', ids: [...ORDER.pressione, 'fc'] },
    { id: 'relazioni', titolo: 'Decisioni e disaccordi', intro: 'Come scegli quando la scelta conta, e come ti muovi quando non sei d’accordo con qualcuno.',
      stem: 'Decisioni e disaccordi', ids: ORDER.relazioni },
    { id: 'motori', titolo: 'Cosa ti muove', intro: 'Quattro scelte secche su cosa ti accende e cosa ti spegne, e una frase da portare nella lettera iniziale.',
      ids: ['m1', 'm2', 'm3', 'm4', 'frase'] },
  ];

  const QUESTIONS = PARTS.flatMap((p, pi) => p.ids.map((id) => (byId[id]
    ? { id, part: pi, type: 'likert', stem: p.stem, t: byId[id].t, opts: SCALE }
    : { id, part: pi, type: 'choice', ...CHOICE[id] })));

  // --- Codice profilo (contiene solo risposte, niente nome né email) ---
  const CK = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const checksum = (s) => { let n = 0; for (let i = 0; i < s.length; i++) n += s.charCodeAt(i) * (i + 1); return CK.charAt(n % CK.length); };
  function encode(a) {
    const lik = ITEMS.map((x) => String(a[x.id])).join('');
    const body = `${VERSION}-${a.genere}${a.ruolo}${a.missione}${a.carico}-${lik}-${a.fc}${a.m1}${a.m2}${a.m3}${a.m4}${a.frase}`;
    return `${body}-${checksum(body.replace(/-/g, ''))}`;
  }
  function decode(code) {
    const c = String(code || '').toUpperCase().replace(/[^0-9A-Z-]/g, '');
    const re = new RegExp(`^U2-([FMN])([CML])([1-5])([1-4])-([1-5]{${ITEMS.length}})-([RCSK])([GRAS])([GRAS])([GRAS])([GRAS])([1-8])-([0-9A-Z])$`);
    const m = c.match(re);
    if (!m) throw new Error('Codice non valido: controlla di averlo copiato per intero.');
    const body = c.slice(0, c.lastIndexOf('-'));
    if (checksum(body.replace(/-/g, '')) !== m[12]) throw new Error('Codice non valido: il carattere di controllo non corrisponde.');
    const a = { genere: m[1], ruolo: m[2], missione: m[3], carico: m[4], fc: m[6], m1: m[7], m2: m[8], m3: m[9], m4: m[10], frase: m[11] };
    ITEMS.forEach((x, i) => { a[x.id] = Number(m[5].charAt(i)); });
    return a;
  }

  function complete(a) {
    return ['genere', ...QUESTIONS.map((q) => q.id)].every((k) => a[k] !== undefined && a[k] !== null && a[k] !== '');
  }

  // --- Punteggi ---
  const val = (a, id) => (byId[id].key > 0 ? a[id] : 6 - a[id]); // 1..5, già girato per gli invertiti
  const mean = (a, ids) => ids.reduce((s, id) => s + val(a, id), 0) / ids.length;
  const ofScale = (sc) => ITEMS.filter((x) => x.sc === sc).map((x) => x.id);
  const round1 = (x) => Math.round(x * 10) / 10;
  // Fasce descrittive rispetto al punto medio della scala (NON confronti con la popolazione)
  const band = (m) => (m >= 3.75 ? 'alto' : m <= 2.25 ? 'basso' : 'medio');
  const intensity = (d, strong, mild) => (Math.abs(d) >= strong ? 'marcato' : Math.abs(d) >= mild ? 'moderato' : 'bilanciato');

  function score(a) {
    // 1. Cinque grandi tratti. N è presentato come "reattività emotiva".
    const tratti = {};
    for (const k of ['E', 'A', 'C', 'N', 'O']) { const m = mean(a, ofScale(k)); tratti[k] = { media: round1(m), fascia: band(m) }; }

    // 2. Energia (cap. 2): 4 item di Estroversione + 2 di ricarica, centrati su 3. Indice da -1 a +1.
    const eIds = [...ofScale('E'), 'RS', 'RQ'];
    const eSum = eIds.reduce((s, id) => s + (val(a, id) - 3), 0);
    const en = eSum / (2 * eIds.length);
    const energia = { pole: en > 0 ? 'E' : en < 0 ? 'I' : (a.RS >= a.RQ ? 'E' : 'I'), n: en, intensita: intensity(eSum, 5, 1) };

    // 3. Sotto pressione (cap. 3): somma dei 3 item + 2 punti al modo scelto nella domanda situazionale
    const order = ['R', 'C', 'S', 'K'];
    const ids = { R: ofScale('R'), C: ofScale('C_'), S: ofScale('S'), K: ofScale('K') };
    const sc = {};
    order.forEach((p) => { sc[p] = ids[p].reduce((s, id) => s + a[id], 0) + (a.fc === p ? 2 : 0); });
    const max = Math.max(...order.map((p) => sc[p]));
    const tied = order.filter((p) => sc[p] === max);
    const primary = tied.includes(a.fc) ? a.fc : tied[0];
    const rest = order.filter((p) => p !== primary);
    const max2 = Math.max(...rest.map((p) => sc[p]));
    const cand2 = rest.filter((p) => sc[p] === max2);
    const secondary = max2 >= 10 ? (cand2.includes(a.fc) ? a.fc : cand2[0]) : null;

    // 4. Decidere (cap. 4): razionale e intuitivo sono due scale separate; il polo è quella prevalente.
    const dR = mean(a, ofScale('DR')), dI = mean(a, ofScale('DI'));
    const dd = dR - dI;
    const decisione = { pole: dd > 0 ? 'A' : dd < 0 ? 'N' : (tratti.C.media >= tratti.O.media ? 'A' : 'N'), n: dd / 4,
      intensita: intensity(dd, 1, 0.3), razionale: round1(dR), intuitivo: round1(dI), entrambi: dR >= 3.67 && dI >= 3.67 };

    // 5. Disaccordi (cap. 5): assertività e attenzione alla relazione, scale separate.
    const cD = mean(a, ofScale('CD')), cP = mean(a, ofScale('CP'));
    const cd = cD - cP;
    const conflitto = { pole: cd > 0 ? 'D' : cd < 0 ? 'P' : (tratti.A.media >= 3 ? 'P' : 'D'), n: cd / 4,
      intensita: intensity(cd, 1, 0.3), assertivita: round1(cD), relazione: round1(cP) };

    // 6. Carburante (cap. 6): scelte forzate (ipsative); parità → ultima domanda, poi la prima.
    const mots = ['G', 'R', 'A', 'S'];
    const cnt = { G: 0, R: 0, A: 0, S: 0 };
    ['m1', 'm2', 'm3', 'm4'].forEach((k) => { cnt[a[k]]++; });
    const mmax = Math.max(...mots.map((k) => cnt[k]));
    const mt = mots.filter((k) => cnt[k] === mmax);
    const top = mt.includes(a.m4) ? a.m4 : mt.includes(a.m1) ? a.m1 : mt[0];

    // 7. Qualità delle risposte: coerenza tra affermazioni dirette e invertite dello stesso tratto,
    //    e risposte tutte uguali. Non è un giudizio: serve a dire quanto è nitida la fotografia.
    let incoerenze = 0;
    for (const k of ['E', 'A', 'C', 'N', 'O']) {
      const pos = ITEMS.filter((x) => x.sc === k && x.key > 0).map((x) => a[x.id]);
      const neg = ITEMS.filter((x) => x.sc === k && x.key < 0).map((x) => a[x.id]);
      pos.forEach((p, i) => { const q = neg[i]; if ((p >= 4 && q >= 4) || (p <= 2 && q <= 2)) incoerenze++; });
    }
    const likVals = ITEMS.map((x) => a[x.id]);
    const uguali = likVals.every((v) => v === likVals[0]);
    const qualita = { incoerenze, uguali, nitida: incoerenze <= 3 && !uguali };

    const carico = Number(a.carico);
    return {
      genere: a.genere, ruolo: a.ruolo, missione: a.missione, frase: a.frase, carico,
      attenzione: carico >= 4 || (carico >= 3 && tratti.N.fascia === 'alto'),
      tratti, energia, decisione, conflitto, qualita,
      stress: { primary, secondary, scores: sc },
      motivazione: { top, counts: cnt },
      moduli: {
        energia: 'energia-' + energia.pole,
        stress: 'stress-' + primary,
        decisione: 'decisione-' + decisione.pole,
        conflitto: 'conflitto-' + conflitto.pole,
        motivazione: 'motivazione-' + top,
        missione: 'missione-' + a.missione,
        comboSD: 'combo-SD-' + primary + decisione.pole,
        comboSC: 'combo-SC-' + primary + conflitto.pole,
        secondario: secondary ? 'stress-' + secondary : null,
      },
    };
  }

  // --- Concordanze: [[maschile|femminile|neutro]] ---
  function gender(str, g) {
    return String(str).replace(/\[\[([^\]|]*)\|([^\]|]*)(?:\|([^\]]*))?\]\]/g, (_, m, f, n) => {
      if (g === 'F') return f;
      if (g === 'M') return m;
      if (n !== undefined) return n;
      let p = 0; while (p < m.length && p < f.length && m.charAt(p) === f.charAt(p)) p++;
      return m + '/' + f.slice(p);
    });
  }

  function random() {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const a = { genere: pick(['F', 'M', 'N']) };
    for (const q of QUESTIONS) a[q.id] = q.type === 'likert' ? 1 + Math.floor(Math.random() * 5) : pick(q.opts).v;
    return a;
  }

  return { VERSION, ITEMS, PARTS, QUESTIONS, SCALE, CHOICE, encode, decode, score, gender, complete, random };
})();
if (typeof module !== 'undefined') module.exports = UDU;
if (typeof window !== 'undefined') window.UDU = UDU;
