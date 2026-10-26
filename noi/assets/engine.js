/* =====================================================================
   NOI — Motore del questionario di coppia (domande, punteggi, codifica)
   Impianto teorico: /noi/metodo/ e noi/_sorgenti/LEGGIMI.md.
   Ogni persona compila il proprio questionario pensando a questa relazione.
   Se cambi domande, ordine o punteggi: cambia VERSION.
   Gira nel browser (window.NOI) e in Node (module.exports) per i test.
   ===================================================================== */
const NOI = (() => {
  const VERSION = 'N1';

  const SCALE = [
    { v: 1, t: 'Per niente vero per me' }, { v: 2, t: 'Poco vero' }, { v: 3, t: 'In parte sì, in parte no' },
    { v: 4, t: 'Abbastanza vero' }, { v: 5, t: 'Del tutto vero per me' },
  ];

  // Affermazioni in ordine CANONICO. key: +1 diretta, -1 invertita. {{altro}} = nome del partner.
  // [[m|f|n]] = concordanza di chi risponde. Item originali, ispirati ai costrutti citati (nessuno strumento protetto).
  const ITEMS = [
    // Vicinanza e spazio: le due dimensioni dell'attaccamento adulto nella relazione specifica
    // (Brennan, Clark e Shaver, 1998; Fraley et al., 2011). AN = bisogno di conferme, AV = bisogno di spazio.
    { id: 'AN1', sc: 'AN', key: 1, t: 'Quando {{altro}} è distante o di poche parole, mi chiedo se è successo qualcosa tra noi.' },
    { id: 'AN2', sc: 'AN', key: 1, t: 'Ho bisogno che {{altro}} mi dica o mi mostri spesso che ci tiene.' },
    { id: 'AN3', sc: 'AN', key: 1, t: 'A volte temo di tenere a questa relazione più di quanto ci tenga {{altro}}.' },
    { id: 'AN4', sc: 'AN', key: -1, t: 'Anche quando per un po’ ci sentiamo poco, mi sento in pace su di noi.' },
    { id: 'AV1', sc: 'AV', key: 1, t: 'Quando {{altro}} cerca molta vicinanza, a un certo punto sento il bisogno di spazio.' },
    { id: 'AV2', sc: 'AV', key: 1, t: 'Mi viene più facile mostrare affetto con i fatti che parlare di quello che provo.' },
    { id: 'AV3', sc: 'AV', key: 1, t: 'Quando sto male, prima di parlarne con {{altro}} provo a cavarmela per conto mio.' },
    { id: 'AV4', sc: 'AV', key: -1, t: 'Mi viene facile appoggiarmi a {{altro}} quando ne ho bisogno.' },
    // Disaccordi: inseguire e ritirarsi (Christensen e Heavey, 1990), sovraccarico emotivo (Gottman e Levenson, 1992),
    // avvio duro e tentativi di riparazione (Gottman et al., 1998).
    { id: 'IN1', sc: 'IN', key: 1, t: 'Quando c’è un problema tra noi, voglio parlarne subito.' },
    { id: 'IN2', sc: 'IN', key: 1, t: 'Se {{altro}} si chiude o rimanda, insisto per avere una risposta.' },
    { id: 'RI1', sc: 'RI', key: 1, t: 'Nelle discussioni accese tendo a chiudermi o ad allontanarmi.' },
    { id: 'RI2', sc: 'RI', key: 1, t: 'Ho bisogno di tempo per capire cosa provo, prima di riuscire a parlarne.' },
    { id: 'FL1', sc: 'FL', key: 1, t: 'Quando la discussione si scalda, mi sale tutto e non riesco più a ragionare.' },
    { id: 'FL2', sc: 'FL', key: 1, t: 'Dopo un litigio mi servono ore per ritrovare la calma.' },
    { id: 'AP1', sc: 'AP', key: 1, t: 'Quando qualcosa non mi va, a volte lo dico in un modo che poi rimpiango.' },
    { id: 'RP1', sc: 'RP', key: 1, t: 'Dopo un litigio sono spesso io a fare il primo passo.' },
    // Le cose belle e il quotidiano: buone notizie (Gable et al., 2004), novità (Aron et al., 2000), sentirsi apprezzati
    // (Gordon et al., 2012), rituali (Fiese et al., 2002), equità e carico mentale (Frisco e Williams, 2003; Daminger, 2019),
    // equilibrio tra sé e coppia (Kumashiro et al., 2008).
    { id: 'CB1', sc: 'CB1', key: 1, t: 'Quando racconto a {{altro}} una bella notizia, ho bisogno che se ne entusiasmi e mi faccia domande.' },
    { id: 'CB2', sc: 'CB2', key: 1, t: 'Mi manca fare con {{altro}} cose nuove, che non abbiamo mai fatto insieme.' },
    { id: 'CB3', sc: 'CB3', key: 1, t: 'Sento che {{altro}} nota e apprezza quello che faccio per noi.' },
    { id: 'CB4', sc: 'CB4', key: 1, t: 'Abbiamo piccoli momenti solo nostri che proteggiamo: un caffè, una passeggiata, una serie.' },
    { id: 'QU1', sc: 'QU1', key: 1, t: 'Le cose da fare (casa, organizzazione, impegni) sono divise tra noi in modo giusto.' },
    { id: 'QU2', sc: 'QU2', key: 1, t: 'Tocca spesso a me ricordare, pianificare e tenere a mente le cose per entrambi.' },
    { id: 'TS1', sc: 'TS1', key: 1, t: 'Mi serve del tempo tutto per me, anche quando tra noi va bene.' },
    { id: 'TS2', sc: 'TS2', key: 1, t: 'Vorrei passare con {{altro}} più tempo di quanto ne passiamo.' },
  ];
  const byId = Object.fromEntries(ITEMS.map((x) => [x.id, x]));

  // Ordine di presentazione dentro ogni parte (mescolato, fisso)
  const ORDER = {
    vicinanza: ['AN1', 'AV1', 'AN2', 'AV2', 'AN4', 'AV3', 'AN3', 'AV4'],
    disaccordi: ['IN1', 'RI1', 'FL1', 'AP1', 'IN2', 'RI2', 'FL2', 'RP1'],
    quotidiano: ['CB1', 'QU1', 'TS1', 'CB2', 'CB3', 'QU2', 'TS2', 'CB4'],
  };

  // Le sei vie con cui ci si sente importanti per l'altro (stesse lettere in imp1 e imp2)
  const VIE = {
    P: 'Le parole', T: 'Il tempo dedicato', G: 'I gesti pratici', F: 'Il contatto', A: 'L’attenzione ai dettagli', S: 'Il sostegno ai progetti',
  };
  const CHOICE = {
    durata: { t: 'Da quanto tempo state insieme?', opts: [
      { v: '1', t: 'Meno di un anno.' }, { v: '2', t: 'Da uno a tre anni.' }, { v: '3', t: 'Da tre a dieci anni.' }, { v: '4', t: 'Da più di dieci anni.' } ] },
    fase: { t: 'Quale frase descrive meglio questo periodo per voi due?', opts: [
      { v: '1', t: 'Stiamo bene e vogliamo conoscerci ancora meglio.' },
      { v: '2', t: 'Litighiamo più di prima, o peggio di prima.' },
      { v: '3', t: 'Ci sentiamo un po’ lontani, più coinquilini che coppia.' },
      { v: '4', t: 'Stiamo attraversando un cambiamento: figli, casa, lavoro, distanza, famiglie.' },
      { v: '5', t: 'Uno di noi, o entrambi, sta passando un periodo pesante e la coppia ne risente.' } ] },
    carico: { t: 'E tu, personalmente, quanto senti pesante il carico che porti in questo periodo?', opts: [
      { v: '1', t: 'Leggero: ho margine.' }, { v: '2', t: 'Normale: impegnativo ma sostenibile.' },
      { v: '3', t: 'Pesante: faccio fatica a recuperare.' }, { v: '4', t: 'Molto pesante: mi sento vicino al limite.' } ] },
    imp1: { t: 'Pensa a un momento in cui ti sei [[sentito|sentita|sentito/a]] davvero importante per {{altro}}. Che cosa era successo, più di tutto?', opts: [
      { v: 'P', t: 'Mi ha detto o scritto qualcosa di sentito su di me, o su di noi.' },
      { v: 'T', t: 'Ha messo da parte il resto per stare con me, con la testa e non solo con il corpo.' },
      { v: 'G', t: 'Ha fatto qualcosa di concreto per alleggerirmi, senza che lo chiedessi.' },
      { v: 'F', t: 'Un abbraccio, una mano, una vicinanza fisica che mi ha fatto sentire a casa.' },
      { v: 'A', t: 'Si è [[ricordato|ricordata|ricordato/a]] di un dettaglio che per me contava.' },
      { v: 'S', t: 'Ha creduto in un mio progetto, o mi ha [[difeso|difesa|difeso/a]] davanti agli altri.' } ] },
    imp2: { t: 'E quando ti manca qualcosa da {{altro}}, che cosa ti manca di più?', opts: [
      { v: 'P', t: 'Sentirmi dire cosa prova, o cosa apprezza di me.' },
      { v: 'T', t: 'Del tempo insieme senza telefono, impegni, distrazioni.' },
      { v: 'G', t: 'Un aiuto pratico, una mano con le cose da fare.' },
      { v: 'F', t: 'Il contatto fisico, la tenerezza.' },
      { v: 'A', t: 'Sentire che si ricorda di quello che mi sta a cuore.' },
      { v: 'S', t: 'Sentire che fa il tifo per me e per quello che desidero.' } ] },
    ferita: { t: 'Quale di queste cose ti ferisce di più, quando succede?', opts: [
      { v: '1', t: 'Una critica o un’ironia su di me, soprattutto davanti ad altri.' },
      { v: '2', t: 'Sentirmi [[ignorato|ignorata|ignorato/a]]: lo sguardo sul telefono, la testa altrove.' },
      { v: '3', t: 'Una promessa dimenticata, anche piccola.' },
      { v: '4', t: 'Il silenzio o la freddezza dopo un litigio.' },
      { v: '5', t: 'Non essere [[preso|presa|preso/a]] sul serio quando racconto qualcosa che mi preoccupa.' },
      { v: '6', t: 'Avere la sensazione di fare tutto io.' } ] },
    dopo: { t: 'Dopo un litigio, che cosa ti aiuta di più a riavvicinarti?', opts: [
      { v: 'A', t: 'Una parola o un gesto leggero: una battuta, un caffè portato senza dire niente.' },
      { v: 'B', t: 'Parlarne con calma e capire cosa è successo.' },
      { v: 'C', t: 'Un abbraccio, il contatto.' },
      { v: 'D', t: 'Un po’ di tempo per conto mio. Poi torno io.' },
      { v: 'E', t: 'Sentire che {{altro}} riconosce la sua parte.' } ] },
    tema: { t: 'Su che cosa vi capita più spesso di discutere?', opts: [
      { v: 'casa', t: 'Casa, organizzazione, cose da fare.' },
      { v: 'tempo', t: 'Il tempo: quanto stare insieme e quanto per sé.' },
      { v: 'soldi', t: 'I soldi.' },
      { v: 'famiglie', t: 'Le famiglie d’origine.' },
      { v: 'figli', t: 'I figli, o il desiderio di averne.' },
      { v: 'lavoro', t: 'Il lavoro e quanto spazio si prende.' },
      { v: 'intimita', t: 'La vicinanza e l’intimità.' },
      { v: 'altro', t: 'Altro, o preferisco non dirlo.' } ] },
    segnale: { t: 'Quando sei sotto pressione per qualcosa che non riguarda la coppia (lavoro, famiglia, salute), come se ne accorge {{altro}}?', opts: [
      { v: 'D', t: 'Lo dico chiaramente.' },
      { v: 'V', t: 'Si vede, ma non lo dico.' },
      { v: 'C', t: 'Parlo meno e mi chiudo.' },
      { v: 'I', t: 'Divento più irritabile, rispondo male.' },
      { v: 'N', t: 'Non se ne accorge: lo tengo per me.' } ] },
    bisogno: { t: 'In quei momenti, che cosa ti aiuta di più da parte di {{altro}}?', opts: [
      { v: 'A', t: 'Che mi ascolti, senza darmi subito soluzioni.' },
      { v: 'P', t: 'Che mi aiuti a trovare una soluzione concreta.' },
      { v: 'L', t: 'Che mi distragga, mi faccia ridere, mi porti fuori.' },
      { v: 'C', t: 'Che si prenda in carico qualcosa al posto mio.' },
      { v: 'S', t: 'Che mi lasci un po’ di spazio, facendomi sapere che c’è.' } ] },
    reazione: { t: 'Quando è {{altro}} a essere sotto pressione, che cosa ti viene più spontaneo?', opts: [
      { v: 'A', t: 'Ascoltare.' },
      { v: 'P', t: 'Proporre soluzioni.' },
      { v: 'L', t: 'Sdrammatizzare, alleggerire.' },
      { v: 'C', t: 'Fare io qualcosa al posto suo.' },
      { v: 'S', t: 'Lasciare spazio.' },
      { v: 'W', t: 'Preoccuparmi, al punto di agitarmi anch’io.' } ] },
    sicurezza: { t: 'Negli ultimi dodici mesi ti è capitato di avere paura di {{altro}}, di sentirti [[controllato|controllata|controllato/a]] (soldi, telefono, amicizie, spostamenti) o di subire spinte, minacce o umiliazioni?', opts: [
      { v: 'N', t: 'No.' },
      { v: 'S', t: 'Sì.' },
      { v: 'X', t: 'Preferisco parlarne direttamente con Francesco.' } ] },
  };

  const PARTS = [
    { id: 'momento', titolo: 'Il vostro momento', intro: 'Tre domande per inquadrare il periodo che state vivendo. Le legge solo Francesco: servono a lui per accompagnarvi meglio.',
      ids: ['durata', 'fase', 'carico'] },
    { id: 'vicinanza', titolo: 'Vicinanza e spazio', intro: 'Come vivi la vicinanza in questa relazione: quanto ti servono conferme, quanto ti serve spazio. Pensa agli ultimi mesi con {{altro}}, non alle relazioni passate.',
      stem: 'Vicinanza e spazio', ids: ORDER.vicinanza },
    { id: 'importante', titolo: 'Che cosa ti fa sentire importante', intro: 'Tre scelte secche. Se più risposte ti somigliano, scegli quella che senti più vera adesso.',
      ids: ['imp1', 'imp2', 'ferita'] },
    { id: 'disaccordi', titolo: 'Quando non siete d’accordo', intro: 'Come ti muovi nelle discussioni con {{altro}}, cosa ti succede dentro e cosa ti aiuta a ritrovarvi. Nessuna risposta è giusta: ogni coppia litiga, conta come.',
      stem: 'Quando non siete d’accordo', ids: [...ORDER.disaccordi, 'dopo', 'tema'] },
    { id: 'pressione', titolo: 'Quando la pressione arriva da fuori', intro: 'Lavoro, famiglia, salute, imprevisti: come lo mostri e di che cosa hai bisogno da {{altro}} quando il peso viene da fuori.',
      ids: ['segnale', 'bisogno', 'reazione'] },
    { id: 'quotidiano', titolo: 'Le cose belle e il quotidiano', intro: 'Le buone notizie, il tempo, le cose da fare. È qui che si gioca gran parte della vita di coppia.',
      stem: 'Le cose belle e il quotidiano', ids: ORDER.quotidiano },
    { id: 'riservata', titolo: 'Una domanda solo per Francesco', intro: 'L’ultima domanda è riservata: la risposta non finisce in nessun documento e non arriva a {{altro}}. La legge solo Francesco, per capire se questo percorso è adatto a voi in questo momento.',
      ids: ['sicurezza'] },
  ];

  const QUESTIONS = PARTS.flatMap((p, pi) => p.ids.map((id) => (byId[id]
    ? { id, part: pi, type: 'likert', stem: p.stem, t: byId[id].t, opts: SCALE }
    : { id, part: pi, type: 'choice', ...CHOICE[id] })));

  // Aree che ciascuno sceglie se e come condividere
  const AREE = [
    { id: 'vicinanza', t: 'Vicinanza e spazio', d: 'Quanto ti servono conferme e quanto spazio.' },
    { id: 'importante', t: 'Che cosa ti fa sentire importante', d: 'I gesti che contano per te e quello che ti ferisce.' },
    { id: 'disaccordi', t: 'Quando non siete d’accordo', d: 'Come ti muovi nelle discussioni e cosa ti aiuta dopo.' },
    { id: 'pressione', t: 'Quando la pressione arriva da fuori', d: 'Come lo mostri e di che cosa hai bisogno.' },
    { id: 'quotidiano', t: 'Le cose belle e il quotidiano', d: 'Buone notizie, novità, tempo, divisione dei compiti.' },
  ];
  // I = solo nelle istruzioni per l'altra persona (tradotte in indicazioni), S = anche nella scheda di coppia, N = non usare
  const LIVELLI = ['I', 'S', 'N'];

  // ---------- Codifica compatta delle risposte (per la busta cifrata) ----------
  const CHOICE_IDS = ['durata', 'fase', 'carico', 'imp1', 'imp2', 'ferita', 'dopo', 'tema', 'segnale', 'bisogno', 'reazione', 'sicurezza'];
  function pack(a) {
    return { l: ITEMS.map((x) => String(a[x.id])).join(''), c: CHOICE_IDS.map((k) => a[k]).join('.') };
  }
  function unpack(p) {
    const a = {};
    if (!p || typeof p.l !== 'string' || p.l.length !== ITEMS.length || !/^[1-5]+$/.test(p.l)) throw new Error('Risposte non valide.');
    ITEMS.forEach((x, i) => { a[x.id] = Number(p.l.charAt(i)); });
    const c = String(p.c || '').split('.');
    if (c.length !== CHOICE_IDS.length) throw new Error('Risposte non valide.');
    CHOICE_IDS.forEach((k, i) => {
      if (!CHOICE[k].opts.some((o) => o.v === c[i])) throw new Error('Risposta non valida: ' + k);
      a[k] = c[i];
    });
    return a;
  }
  function complete(a) { return QUESTIONS.every((q) => a[q.id] !== undefined && a[q.id] !== null && a[q.id] !== ''); }

  // ---------- Punteggi ----------
  const val = (a, id) => (byId[id].key > 0 ? a[id] : 6 - a[id]);
  const mean = (a, ids) => ids.reduce((s, id) => s + val(a, id), 0) / ids.length;
  const ofScale = (sc) => ITEMS.filter((x) => x.sc === sc).map((x) => x.id);
  const r1 = (x) => Math.round(x * 10) / 10;
  const band = (m) => (m >= 3.75 ? 'alto' : m <= 2.25 ? 'basso' : 'medio');

  function score(a) {
    // Vicinanza: due dimensioni separate. Soglia 3,25 = la media delle risposte pende verso "abbastanza vero".
    const conferme = mean(a, ofScale('AN')), spazio = mean(a, ofScale('AV'));
    const hiC = conferme >= 3.25, hiS = spazio >= 3.25;
    const vic = { conferme: r1(conferme), spazio: r1(spazio), tipo: hiC && hiS ? 'E' : hiC ? 'C' : hiS ? 'S' : 'T' };

    // Disaccordi: inseguire vs ritirarsi (differenza tra le medie), più tre segnali specifici
    const ins = mean(a, ofScale('IN')), rit = mean(a, ofScale('RI'));
    const d = ins - rit;
    const dis = {
      insegue: r1(ins), ritira: r1(rit), stile: d >= 0.75 ? 'I' : d <= -0.75 ? 'R' : 'B',
      allaga: mean(a, ofScale('FL')) >= 3.5, duro: a.AP1 >= 4, ripara: a.RP1 >= 4, dopo: a.dopo, tema: a.tema,
    };

    const imp = { via1: a.imp1, via2: a.imp2, ferita: a.ferita };
    const pres = { segnale: a.segnale, bisogno: a.bisogno, reazione: a.reazione };

    // Quotidiano: attivazioni dei moduli (sempre almeno uno)
    const quo = {
      notizie: a.CB1 >= 4, novita: a.CB2 >= 4, apprezzamento: a.CB3 <= 2, rituali: a.CB4 <= 2,
      carico: a.QU1 <= 2 || a.QU2 >= 4, perse: a.TS1 >= 4 && a.TS1 > a.TS2, insieme: a.TS2 >= 4 && a.TS2 > a.TS1,
    };

    const carico = Number(a.carico);
    return {
      durata: a.durata, fase: a.fase, carico,
      vic, dis, imp, pres, quo,
      attenzione: { sicurezza: a.sicurezza !== 'N', sicurezzaRisposta: a.sicurezza, carico: carico >= 4 },
      likert: ITEMS.map((x) => a[x.id]),
    };
  }

  // ---------- Concordanze ----------
  // [[m|f|n]] → persona principale (chiave ''), [[k:m|f|n]] → persona k. g = { '': 'F', tu: 'M', ... }
  function gender(str, g) {
    const pick = (k, m, f, n) => {
      const x = g[k || ''];
      if (x === 'F') return f;
      if (x === 'M') return m;
      if (n !== undefined) return n;
      let p = 0; while (p < m.length && p < f.length && m.charAt(p) === f.charAt(p)) p++;
      return m + '/' + f.slice(p);
    };
    return String(str).replace(/\[\[(?:([a-z]+):)?([^\]|]*)\|([^\]|]*)(?:\|([^\]]*))?\]\]/g, (_, k, m, f, n) => pick(k, m, f, n));
  }
  // Testo delle domande per chi risponde: {{altro}} = nome del partner, concordanze di chi risponde
  function text(s, me) { return gender(String(s).replace(/\{\{altro\}\}/g, me.altro || 'l’altra persona'), { '': me.g }); }

  function random() {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const a = {};
    for (const q of QUESTIONS) a[q.id] = q.type === 'likert' ? 1 + Math.floor(Math.random() * 5) : pick(q.opts).v;
    return a;
  }

  return { VERSION, ITEMS, PARTS, QUESTIONS, SCALE, CHOICE, VIE, AREE, LIVELLI, pack, unpack, complete, score, gender, text, random, band };
})();
if (typeof module !== 'undefined') module.exports = NOI;
if (typeof window !== 'undefined') window.NOI = NOI;
