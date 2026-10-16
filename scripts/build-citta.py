#!/usr/bin/env python3
"""Genera le pagine città sotto /psicologo-online-italiani-estero/<slug>/ e il blocco
"Dove vivi?" dell'hub. Uso: python3 scripts/build-citta.py
CSS, nav, footer e script vengono presi dall'hub, così restano allineati al resto del sito."""
import json, html, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HUB = 'psicologo-online-italiani-estero'
ORIGIN = 'https://www.updateyourlife.it'
WA = 'https://wa.me/393314980002?text=Ciao%20Francesco%2C%20vorrei%20prenotare%20la%20call%20conoscitiva%20gratuita.'

# ---------------------------------------------------------------------------
# DATI DELLE PAGINE CITTÀ. Per aggiungere una città: aggiungi un blocco qui e
# lancia `python3 scripts/build-citta.py`. Non modificare a mano gli HTML generati.
# Ogni pagina deve avere contenuto davvero locale (fuso, servizi, numeri utili):
# pagine identiche con solo il nome cambiato sono "doorway pages" per Google.
# ---------------------------------------------------------------------------
FLEX = 'Lavoro spesso con persone in fusi orari diversi e trovo spazio anche in orari meno consueti: lo concordiamo nella call gratuita.'
SAME_TZ = 'hanno lo stesso fuso orario, quindi trovare un orario è semplice: lo concordiamo nella call gratuita.'
LANG_Q = 'Perché le emozioni hanno una lingua. Anche se {lang} ti viene naturale, spesso ciò che senti trova le parole giuste solo in italiano.'
LOCAL_A = 'Certo. {svc} Il colloquio online in italiano è un\'altra possibilità, non un\'alternativa obbligata.'
LOCAL_P = '{svc} Il colloquio online in italiano è un\'altra possibilità, per chi vuole parlare nella propria lingua e con qualcuno che conosce il contesto da cui viene.'
EMERG = 'I colloqui online non sono un servizio di emergenza. '

CITIES = [
 dict(
  slug='londra', name='Londra', prep='a Londra', place_type='City', area='Londra, Regno Unito',
  title='Psicologo italiano online a Londra | F. Maragliulo',
  desc='Psicologo italiano online per chi vive a Londra: colloqui in videochiamata in italiano, un\'ora di fuso in meno. Prima call conoscitiva gratuita.',
  h1='Psicologo italiano online a Londra',
  tag='Per italiani che vivono a Londra',
  lead='Londra ti dà tanto e ti chiede tanto: ritmi veloci, case condivise, una giornata intera in inglese. Quando qualcosa pesa, parlarne in italiano con uno psicologo italiano ti evita di dover tradurre quello che senti. Ci vediamo in videochiamata, ovunque tu sia a Londra o nel Regno Unito.',
  bullets=[
   ('Una città che corre', 'lavoro intenso, spostamenti lunghi, poco tempo per fermarti a capire come stai.'),
   ('Tanti contatti, pochi legami', 'colleghi e coinquilini che cambiano spesso, e la fatica di costruire amicizie che restano.'),
   ('Tutto in inglese', 'al lavoro funzioni, ma quando parli di emozioni le parole giuste ti vengono in italiano.'),
   ('L\'Italia a due ore di volo', 'vicina abbastanza per tornare spesso, lontana abbastanza da perdere momenti importanti.'),
   ('Restare o tornare?', 'carriera, costo della vita, famiglia: una decisione che si rimanda e intanto pesa.'),
   ('Coppia e famiglia lontano da casa', 'una relazione nata qui, figli che crescono tra due lingue, genitori in Italia che invecchiano.'),
  ],
  tz='Londra è un\'ora indietro rispetto all\'Italia per tutto l\'anno: quando da te sono le 18, in Italia sono le 19. Trovare un orario è semplice e lo concordiamo nella call gratuita.',
  tz_q='Che differenza di orario c\'è tra Londra e l\'Italia?',
  tz_a='Londra è un\'ora indietro rispetto all\'Italia per tutto l\'anno. Concordiamo l\'orario nella call gratuita.',
  lang_q='Perché un colloquio in italiano se vivo a Londra?', lang='l\'inglese',
  svc='Il servizio sanitario britannico offre anche supporto psicologico, in inglese.',
  where_q='Vivo fuori Londra: va bene lo stesso?',
  where_a='Sì. Manchester, Edimburgo, Bristol o un paese di campagna: ti servono solo una connessione stabile e un posto riservato.',
  emerg='Se sei in pericolo chiama il 999 o il 112. Per parlare subito con qualcuno puoi chiamare i Samaritans al 116 123, gratis e a qualsiasi ora.',
  near=['dublino', 'amsterdam', 'parigi'],
  related=[('/relazioni-coppia-online/', 'relazioni e coppia'), ('/stress-lavoro-burnout-online/', 'stress da lavoro e burnout')],
 ),
 dict(
  slug='germania', name='Germania', prep='in Germania', place_type='Country', area='Germania',
  title='Psicologo italiano online in Germania | F. Maragliulo',
  desc='Psicologo italiano online per chi vive in Germania, da Berlino a Monaco: colloqui in videochiamata in italiano, stesso fuso orario. Prima call gratuita.',
  h1='Psicologo italiano online in Germania',
  tag='Per italiani che vivono in Germania',
  lead='Berlino, Monaco, Francoforte, Stoccarda, Amburgo: la Germania offre lavoro e stabilità, ma la lingua, il clima e le regole non scritte possono rendere la vita di tutti i giorni più faticosa di quanto ti aspettassi. Qui puoi parlarne in italiano, in videochiamata, con lo stesso fuso orario dell\'Italia.',
  bullets=[
   ('La lingua come muro', 'anche se il tedesco lo parli, esprimere quello che senti è un\'altra cosa.'),
   ('Sentirsi ospite', 'dopo anni hai una vita avviata, ma fatichi a sentirti davvero a casa.'),
   ('Inverni lunghi', 'giornate corte e grigie che pesano sull\'umore e sull\'energia.'),
   ('Regole e codici diversi', 'al lavoro e nelle relazioni conta molto ciò che non viene detto, e a volte ti senti fuori posto.'),
   ('Restare o tornare?', 'una scelta che si ripresenta, soprattutto quando in Italia qualcuno ha bisogno di te.'),
   ('Famiglia tra due culture', 'una coppia mista, figli che crescono in tedesco, nonni lontani.'),
  ],
  tz='Germania e Italia ' + SAME_TZ,
  tz_q='C\'è differenza di fuso orario?', tz_a='No, Germania e Italia hanno lo stesso fuso orario. Concordiamo l\'orario nella call gratuita.',
  lang_q='Parlo bene tedesco: ha senso un colloquio in italiano?', lang='il tedesco',
  svc='In Germania il supporto psicologico passa di solito dal sistema sanitario e dalla cassa malattia, in tedesco e spesso con tempi di attesa.',
  where_q='In quali città lavori?',
  where_a='Ovunque in Germania: Berlino, Monaco, Francoforte, Stoccarda, Colonia, Amburgo o una città più piccola. Ti serve solo una connessione stabile.',
  emerg='Se sei in pericolo chiama il 112. Per parlare subito con qualcuno c\'è la Telefonseelsorge, gratuita e attiva a qualsiasi ora: 0800 111 0 111 oppure 0800 111 0 222.',
  near=['svizzera', 'amsterdam', 'bruxelles'],
  related=[('/momenti-di-cambiamento-online/', 'momenti di cambiamento'), ('/ansia-online/', 'ansia')],
 ),
 dict(
  slug='svizzera', name='Svizzera', prep='in Svizzera', place_type='Country', area='Svizzera',
  title='Psicologo italiano online in Svizzera | F. Maragliulo',
  desc='Psicologo italiano online per chi vive in Svizzera, da Zurigo a Ginevra: colloqui in videochiamata in italiano, stesso fuso orario. Prima call gratuita.',
  h1='Psicologo italiano online in Svizzera',
  tag='Per italiani che vivono in Svizzera',
  lead='Zurigo, Ginevra, Basilea, Losanna, Berna: la Svizzera è vicina all\'Italia, ma viverci è un\'altra cosa. Lavoro qualificato, stipendi alti, precisione ovunque, e a volte la sensazione di restare sempre un po\' ospite. Qui puoi parlare di ciò che stai vivendo in italiano, in videochiamata, con lo stesso fuso orario.',
  bullets=[
   ('Vicina ma diversa', 'l\'Italia è a poche ore di treno, eppure la vita qui segue regole e ritmi tutti suoi.'),
   ('Lavoro e aspettative alte', 'ambienti molto strutturati, precisione richiesta su tutto, poco margine per l\'errore.'),
   ('Integrarsi davvero', 'colleghi cordiali ma riservati, amicizie che richiedono anni per nascere.'),
   ('Lingue diverse', 'tedesco, svizzero tedesco o francese al lavoro, e l\'italiano solo per le cose di casa.'),
   ('Frontalieri e pendolari', 'una vita divisa tra due Paesi, ore di viaggio, un piede di qua e uno di là.'),
   ('Restare o tornare?', 'qualità della vita e sicurezza da una parte, affetti e radici dall\'altra.'),
  ],
  tz='Svizzera e Italia ' + SAME_TZ,
  tz_q='C\'è differenza di fuso orario?', tz_a='No, Svizzera e Italia hanno lo stesso fuso orario. Concordiamo l\'orario nella call gratuita.',
  lang_q='Vivo nella Svizzera tedesca o francese: perché in italiano?', lang='la lingua del posto',
  svc='In Svizzera il supporto psicologico è disponibile nella lingua del cantone: tedesco o francese, oppure italiano in Ticino.',
  where_q='In quali città lavori?',
  where_a='Ovunque in Svizzera: Zurigo, Ginevra, Basilea, Losanna, Berna, Lugano o un paese di montagna. Ti serve solo una connessione stabile.',
  emerg='Se sei in pericolo chiama il 112 o il 144. Per parlare subito con qualcuno puoi chiamare il 143 (Telefono Amico / La Main Tendue / Die Dargebotene Hand), attivo a qualsiasi ora.',
  near=['germania', 'parigi', 'bruxelles'],
  related=[('/stress-lavoro-burnout-online/', 'stress da lavoro e burnout'), ('/momenti-di-cambiamento-online/', 'momenti di cambiamento')],
 ),
 dict(
  slug='parigi', name='Parigi', prep='a Parigi', place_type='City', area='Parigi, Francia',
  title='Psicologo italiano online a Parigi | F. Maragliulo',
  desc='Psicologo italiano online per chi vive a Parigi o in Francia: colloqui in videochiamata in italiano, stesso fuso orario. Prima call conoscitiva gratuita.',
  h1='Psicologo italiano online a Parigi e in Francia',
  tag='Per italiani che vivono in Francia',
  lead='Il francese sembra vicino all\'italiano, la Francia sembra vicina all\'Italia. Poi ci vivi e scopri che le differenze stanno nei dettagli: nei modi, nei tempi, nel modo di stare con gli altri. Se vivi a Parigi o altrove in Francia, qui puoi parlare di ciò che stai vivendo in italiano, in videochiamata.',
  bullets=[
   ('Vicino ma diverso', 'la lingua la capisci, ma certi codici sociali restano difficili da leggere.'),
   ('Parigi ad alta intensità', 'lavoro, metro, appartamenti piccoli e cari, poco spazio per te.'),
   ('Solitudine in mezzo alla folla', 'una città piena di gente, e la fatica di sentirti parte di qualcosa.'),
   ('Lavoro in un\'altra cultura', 'riunioni, gerarchie e feedback che funzionano in modo diverso da come eri abituato.'),
   ('Restare o tornare?', 'una scelta che si rimanda, tra carriera, affetti e qualità della vita.'),
   ('Coppia e famiglia', 'una relazione nata qui, figli che crescono tra due lingue, genitori in Italia.'),
  ],
  tz='Francia e Italia ' + SAME_TZ,
  tz_q='C\'è differenza di fuso orario?', tz_a='No, Francia e Italia hanno lo stesso fuso orario. Concordiamo l\'orario nella call gratuita.',
  lang_q='Parlo francese: perché un colloquio in italiano?', lang='il francese',
  svc='In Francia esistono servizi di supporto psicologico, in francese.',
  where_q='Vivo fuori Parigi: va bene lo stesso?',
  where_a='Sì. Lione, Marsiglia, Nizza, Tolosa o un paese di provincia: ti servono solo una connessione stabile e un posto riservato.',
  emerg='Se sei in pericolo chiama il 112 o il 15. Il 3114 è il numero nazionale gratuito di prevenzione del suicidio, attivo a qualsiasi ora.',
  near=['bruxelles', 'svizzera', 'londra'],
  related=[('/autostima-online/', 'autostima'), ('/relazioni-coppia-online/', 'relazioni e coppia')],
 ),
 dict(
  slug='bruxelles', name='Bruxelles', prep='a Bruxelles', place_type='City', area='Bruxelles, Belgio',
  title='Psicologo italiano online a Bruxelles | F. Maragliulo',
  desc='Psicologo italiano online per chi vive a Bruxelles o in Belgio: colloqui in videochiamata in italiano, stesso fuso orario. Prima call conoscitiva gratuita.',
  h1='Psicologo italiano online a Bruxelles e in Belgio',
  tag='Per italiani che vivono in Belgio',
  lead='Istituzioni europee, organizzazioni internazionali, consulenza, ricerca: a Bruxelles molti italiani lavorano in ambienti multilingue e ad alta pressione, spesso con contratti a termine. Se vivi a Bruxelles o altrove in Belgio, qui puoi parlare di ciò che stai vivendo in italiano, in videochiamata.',
  bullets=[
   ('Una bolla internazionale', 'colleghi da tutta Europa, inglese e francese tutto il giorno, poco spazio per le tue parole.'),
   ('Contratti e incertezza', 'incarichi a termine, concorsi, rinnovi: il futuro sembra sempre provvisorio.'),
   ('Lavoro ad alta pressione', 'scadenze, negoziati, riunioni infinite e la fatica di staccare.'),
   ('Relazioni che vanno e vengono', 'amici che si trasferiscono, una comunità che cambia di continuo.'),
   ('Il cielo grigio', 'giornate corte e piovose che pesano sull\'umore.'),
   ('Restare o tornare?', 'una carriera internazionale da una parte, affetti e radici dall\'altra.'),
  ],
  tz='Belgio e Italia ' + SAME_TZ,
  tz_q='C\'è differenza di fuso orario?', tz_a='No, Belgio e Italia hanno lo stesso fuso orario. Concordiamo l\'orario nella call gratuita.',
  lang_q='Lavoro in inglese e francese: perché in italiano?', lang='l\'inglese o il francese',
  svc='In Belgio esistono servizi di supporto psicologico, in francese o in olandese.',
  where_q='Vivo fuori Bruxelles: va bene lo stesso?',
  where_a='Sì. Anversa, Gand, Liegi, Lussemburgo o un paese più piccolo: ti servono solo una connessione stabile e un posto riservato.',
  emerg='Se sei in pericolo chiama il 112. Per parlare subito con qualcuno puoi chiamare lo 0800 32 123 (Centre de Prévention du Suicide) o il 1813 (Zelfmoordlijn), gratuiti e attivi a qualsiasi ora.',
  near=['amsterdam', 'parigi', 'germania'],
  related=[('/psicologo-per-manager/', 'psicologo online per manager'), ('/stress-lavoro-burnout-online/', 'stress da lavoro e burnout')],
 ),
 dict(
  slug='amsterdam', name='Amsterdam', prep='ad Amsterdam', place_type='City', area='Amsterdam, Paesi Bassi',
  title='Psicologo italiano online ad Amsterdam | F. Maragliulo',
  desc='Psicologo italiano online per chi vive ad Amsterdam o nei Paesi Bassi: colloqui in videochiamata in italiano, stesso fuso orario. Prima call gratuita.',
  h1='Psicologo italiano online ad Amsterdam e nei Paesi Bassi',
  tag='Per italiani che vivono nei Paesi Bassi',
  lead='Amsterdam, Rotterdam, L\'Aia, Eindhoven, Utrecht: nei Paesi Bassi tanti italiani lavorano in aziende internazionali, nella tecnologia e nella ricerca. Si vive bene, ma la casa difficile da trovare, la franchezza olandese e il clima possono pesare più del previsto. Qui puoi parlarne in italiano, in videochiamata.',
  bullets=[
   ('Direttezza olandese', 'un modo di comunicare molto franco che a volte spiazza o ferisce.'),
   ('La casa', 'affitti alti, case piccole, traslochi frequenti: difficile sentirsi davvero sistemati.'),
   ('Tutto in inglese', 'al lavoro funziona, ma l\'olandese resta una barriera fuori dall\'ufficio.'),
   ('Inverni bui e piovosi', 'tante ore di buio che pesano sull\'energia e sull\'umore.'),
   ('Amicizie da costruire', 'colleghi gentili, ma legami profondi che faticano a nascere.'),
   ('Restare o tornare?', 'equilibrio tra vita e lavoro da una parte, famiglia e radici dall\'altra.'),
  ],
  tz='Paesi Bassi e Italia ' + SAME_TZ,
  tz_q='C\'è differenza di fuso orario?', tz_a='No, Paesi Bassi e Italia hanno lo stesso fuso orario. Concordiamo l\'orario nella call gratuita.',
  lang_q='Lavoro in inglese: perché un colloquio in italiano?', lang='l\'inglese',
  svc='Nei Paesi Bassi il supporto psicologico passa di solito dal medico di base, in olandese o in inglese.',
  where_q='Vivo fuori Amsterdam: va bene lo stesso?',
  where_a='Sì. Rotterdam, L\'Aia, Utrecht, Eindhoven o una città più piccola: ti servono solo una connessione stabile e un posto riservato.',
  emerg='Se sei in pericolo chiama il 112. Per parlare subito con qualcuno puoi chiamare il 113 o lo 0800 0113 (113 Zelfmoordpreventie), attivi a qualsiasi ora.',
  near=['bruxelles', 'germania', 'londra'],
  related=[('/ansia-online/', 'ansia'), ('/relazioni-coppia-online/', 'relazioni e coppia')],
 ),
 dict(
  slug='dublino', name='Dublino', prep='a Dublino', place_type='City', area='Dublino, Irlanda',
  title='Psicologo italiano online a Dublino | F. Maragliulo',
  desc='Psicologo italiano online per chi vive a Dublino o in Irlanda: colloqui in videochiamata in italiano, un\'ora di fuso in meno. Prima call gratuita.',
  h1='Psicologo italiano online a Dublino e in Irlanda',
  tag='Per italiani che vivono in Irlanda',
  lead='Dublino attira tanti italiani giovani: aziende tecnologiche, sedi europee di grandi gruppi, ristorazione, ricerca. Un ambiente accogliente, ma anche affitti altissimi, lavoro intenso e la sensazione che tutto sia provvisorio. Qui puoi parlare di ciò che stai vivendo in italiano, in videochiamata.',
  bullets=[
   ('Una vita in condivisione', 'stanze in affitto, coinquilini che cambiano, poco spazio tutto tuo.'),
   ('Lavoro nella tecnologia', 'ritmi veloci, riorganizzazioni, la pressione di dover sempre dimostrare qualcosa.'),
   ('Tante feste, pochi legami', 'una vita sociale vivace che non sempre diventa vicinanza vera.'),
   ('Tutto in inglese', 'al lavoro funzioni, ma quando parli di emozioni le parole giuste ti vengono in italiano.'),
   ('Il meteo', 'pioggia e cielo grigio per gran parte dell\'anno.'),
   ('Restare o tornare?', 'una tappa che doveva durare un anno e intanto è diventata la tua vita.'),
  ],
  tz='L\'Irlanda è un\'ora indietro rispetto all\'Italia per tutto l\'anno: quando da te sono le 18, in Italia sono le 19. Trovare un orario è semplice e lo concordiamo nella call gratuita.',
  tz_q='Che differenza di orario c\'è tra Dublino e l\'Italia?', tz_a='L\'Irlanda è un\'ora indietro rispetto all\'Italia per tutto l\'anno. Concordiamo l\'orario nella call gratuita.',
  lang_q='Perché un colloquio in italiano se vivo a Dublino?', lang='l\'inglese',
  svc='In Irlanda esistono servizi di supporto psicologico, in inglese.',
  where_q='Vivo fuori Dublino: va bene lo stesso?',
  where_a='Sì. Cork, Galway, Limerick o un paese sulla costa: ti servono solo una connessione stabile e un posto riservato.',
  emerg='Se sei in pericolo chiama il 112 o il 999. Per parlare subito con qualcuno puoi chiamare i Samaritans al 116 123, gratis e a qualsiasi ora.',
  near=['londra', 'amsterdam', 'canada'],
  related=[('/stress-lavoro-burnout-online/', 'stress da lavoro e burnout'), ('/momenti-di-cambiamento-online/', 'momenti di cambiamento')],
 ),
 dict(
  slug='spagna', name='Spagna', prep='in Spagna', place_type='Country', area='Spagna',
  title='Psicologo italiano online a Barcellona e Madrid | Maragliulo',
  desc='Psicologo italiano online per chi vive in Spagna, a Barcellona, Madrid o Valencia: colloqui in videochiamata in italiano. Prima call gratuita.',
  h1='Psicologo italiano online in Spagna: Barcellona, Madrid e non solo',
  tag='Per italiani che vivono in Spagna',
  lead='Barcellona, Madrid, Valencia, Malaga, le Canarie: la Spagna sembra la scelta più facile, con il sole, la lingua vicina, uno stile di vita simile. Poi la vita quotidiana porta anche lavori precari, stipendi più bassi del previsto e affitti alti. Qui puoi parlare di ciò che stai vivendo in italiano, in videochiamata.',
  bullets=[
   ('Il sogno e la realtà', 'una scelta fatta per stare meglio, che a volte non è andata come immaginavi.'),
   ('Lavoro e stipendi', 'contratti precari, stipendi bassi, il bisogno di reinventarti.'),
   ('Vita sociale, poca intimità', 'tante persone intorno, pochi legami in cui ti senti davvero te stesso.'),
   ('Lingue diverse', 'lo spagnolo lo impari presto, ma a Barcellona c\'è anche il catalano.'),
   ('Lavoro da remoto', 'giornate davanti allo schermo in una città che non è la tua.'),
   ('Restare o tornare?', 'qualità della vita da una parte, carriera e famiglia dall\'altra.'),
  ],
  tz='La Spagna continentale e le Baleari hanno lo stesso fuso orario dell\'Italia; le Canarie sono un\'ora indietro. Trovare un orario è semplice e lo concordiamo nella call gratuita.',
  tz_q='C\'è differenza di fuso orario?', tz_a='No, la Spagna continentale ha lo stesso fuso orario dell\'Italia; le Canarie sono un\'ora indietro. Concordiamo l\'orario nella call gratuita.',
  lang_q='Parlo spagnolo: perché un colloquio in italiano?', lang='lo spagnolo',
  svc='In Spagna esistono servizi di supporto psicologico, in spagnolo o nella lingua della regione.',
  where_q='In quali città lavori?',
  where_a='Ovunque in Spagna: Barcellona, Madrid, Valencia, Malaga, Siviglia, le Baleari o le Canarie. Ti serve solo una connessione stabile.',
  emerg='Se sei in pericolo chiama il 112. Il 024 è il numero nazionale gratuito di aiuto per chi ha pensieri suicidi, attivo a qualsiasi ora.',
  near=['parigi', 'londra', 'dubai'],
  related=[('/momenti-di-cambiamento-online/', 'momenti di cambiamento'), ('/autostima-online/', 'autostima')],
 ),
 dict(
  slug='dubai', name='Dubai', prep='a Dubai', place_type='City', area='Dubai, Emirati Arabi Uniti',
  title='Psicologo italiano online a Dubai | F. Maragliulo',
  desc='Psicologo italiano online per chi vive a Dubai o negli Emirati: colloqui in videochiamata in italiano, poche ore di fuso. Prima call conoscitiva gratuita.',
  h1='Psicologo italiano online a Dubai e negli Emirati',
  tag='Per italiani che vivono negli Emirati',
  lead='Dubai e Abu Dhabi attirano professionisti italiani con opportunità di carriera e stipendi alti. Ma una città che corre, una comunità che cambia di continuo e una cultura molto diversa possono rendere difficile sentirsi a casa. Qui puoi parlare di ciò che stai vivendo in italiano, in videochiamata.',
  bullets=[
   ('Una vita a tempo', 'il visto legato al lavoro: restare non dipende solo da te.'),
   ('Successo e solitudine', 'la carriera cresce, ma i legami veri restano pochi.'),
   ('Una comunità di passaggio', 'amici che arrivano e ripartono dopo pochi anni.'),
   ('Ritmi e aspettative alte', 'lavoro intenso, settimane piene, poco spazio per fermarti.'),
   ('Famiglia lontano da casa', 'figli che crescono in una scuola internazionale, nonni a ore di volo.'),
   ('Restare o tornare?', 'opportunità economiche da una parte, affetti e radici dall\'altra.'),
  ],
  tz='Gli Emirati sono 3 ore avanti rispetto all\'Italia in inverno e 2 ore in estate, perché lì l\'ora legale non c\'è. Trovare un orario è semplice e lo concordiamo nella call gratuita.',
  tz_q='Che differenza di orario c\'è tra Dubai e l\'Italia?', tz_a='Dubai è 3 ore avanti rispetto all\'Italia in inverno e 2 ore in estate. Concordiamo l\'orario nella call gratuita.',
  lang_q='Lavoro in inglese: perché un colloquio in italiano?', lang='l\'inglese',
  svc='Negli Emirati esistono servizi di supporto psicologico, soprattutto in inglese o in arabo.',
  where_q='Vivo ad Abu Dhabi: va bene lo stesso?',
  where_a='Sì. Abu Dhabi, Sharjah o un altro emirato: ti servono solo una connessione stabile e un posto riservato.',
  emerg='Se sei in pericolo chiama il 999 (polizia) o il 998 (ambulanza).',
  near=['londra', 'australia', 'svizzera'],
  related=[('/psicologo-per-manager/', 'psicologo online per manager'), ('/stress-lavoro-burnout-online/', 'stress da lavoro e burnout')],
 ),
 dict(
  slug='stati-uniti', name='Stati Uniti', prep='negli Stati Uniti', place_type='Country', area='Stati Uniti',
  title='Psicologo italiano online negli Stati Uniti | F. Maragliulo',
  desc='Psicologo italiano online per chi vive in America, da New York a San Francisco: colloqui in videochiamata in italiano. Prima call conoscitiva gratuita.',
  h1='Psicologo italiano online negli Stati Uniti',
  tag='Per italiani che vivono in America',
  lead='New York, Boston, Chicago, Miami, Los Angeles, San Francisco: vivere negli Stati Uniti vuol dire spesso opportunità grandi e distanza grande. Un oceano di mezzo, diverse ore di fuso, voli lunghi. Qui puoi parlare di ciò che stai vivendo in italiano, in videochiamata, con uno psicologo italiano.',
  bullets=[
   ('Un oceano di distanza', 'tornare in Italia richiede tempo e organizzazione, e certi momenti li vivi da lontano.'),
   ('Il fuso orario come barriera', 'quando tu hai tempo, in Italia dormono: anche sentire famiglia e amici diventa complicato.'),
   ('Ritmi di lavoro intensi', 'aspettative alte, poche ferie, la sensazione di dover sempre dimostrare qualcosa.'),
   ('Incertezza sul futuro', 'visti, permessi, contratti: restare non dipende solo da te.'),
   ('Restare o tornare?', 'una domanda che cambia forma con gli anni, i figli, i genitori che invecchiano.'),
   ('Famiglia tra due mondi', 'figli che crescono americani, una coppia che vive la distanza in modo diverso.'),
  ],
  tz='Dalla East Coast (New York, Boston, Miami) sei di solito 6 ore indietro rispetto all\'Italia, da Chicago 7, dalla West Coast (Los Angeles, San Francisco, Seattle) 9. Per qualche settimana all\'anno la differenza cambia di un\'ora, perché l\'ora legale inizia e finisce in date diverse. ' + FLEX,
  tz_q='Come gestiamo il fuso orario?', tz_a='Dalla East Coast sei di solito 6 ore indietro rispetto all\'Italia, dalla West Coast 9. ' + FLEX,
  lang_q='Perché un colloquio in italiano se vivo in America?', lang='l\'inglese',
  svc='Negli Stati Uniti il supporto psicologico è in inglese e passa spesso dall\'assicurazione sanitaria.',
  where_q='In quali città lavori?',
  where_a='Ovunque negli Stati Uniti: New York, Boston, Chicago, Miami, Los Angeles, San Francisco o una città più piccola. Ti serve solo una connessione stabile.',
  emerg='Se sei in pericolo chiama il 911. Per parlare subito con qualcuno puoi chiamare o scrivere un SMS al 988, attivo a qualsiasi ora.',
  near=['canada', 'londra', 'australia'],
  related=[('/psicologo-per-manager/', 'psicologo online per manager'), ('/momenti-di-cambiamento-online/', 'momenti di cambiamento')],
 ),
 dict(
  slug='canada', name='Canada', prep='in Canada', place_type='Country', area='Canada',
  title='Psicologo italiano online in Canada | F. Maragliulo',
  desc='Psicologo italiano online per chi vive in Canada, da Toronto a Montréal e Vancouver: colloqui in videochiamata in italiano. Prima call gratuita.',
  h1='Psicologo italiano online in Canada',
  tag='Per italiani che vivono in Canada',
  lead='Toronto, Montréal, Vancouver, Calgary: il Canada accoglie tanti italiani, da chi è arrivato da poco con un permesso di lavoro a chi ci vive da anni. Spazi immensi, inverni lunghi, un oceano tra te e casa. Qui puoi parlare di ciò che stai vivendo in italiano, in videochiamata.',
  bullets=[
   ('Ricominciare da capo', 'titoli da far riconoscere, lavori di passaggio, la fatica di ripartire.'),
   ('Permessi e incertezza', 'visti, residenza permanente, attese: il futuro dipende anche da una pratica.'),
   ('Inverni lunghi', 'mesi di freddo e buio che pesano sull\'umore e sulla vita sociale.'),
   ('Due lingue, nessuna tua', 'inglese o francese tutto il giorno, l\'italiano solo per le telefonate a casa.'),
   ('Lontano da tutto', 'distanze enormi, voli lunghi, fusi orari che complicano anche una telefonata.'),
   ('Restare o tornare?', 'opportunità e spazi da una parte, affetti e radici dall\'altra.'),
  ],
  tz='Da Toronto e Montréal sei di solito 6 ore indietro rispetto all\'Italia, da Calgary 8, da Vancouver 9. Per qualche settimana all\'anno la differenza cambia di un\'ora, perché l\'ora legale inizia e finisce in date diverse. ' + FLEX,
  tz_q='Come gestiamo il fuso orario?', tz_a='Da Toronto e Montréal sei di solito 6 ore indietro rispetto all\'Italia, da Vancouver 9. ' + FLEX,
  lang_q='Parlo inglese o francese: perché in italiano?', lang='l\'inglese o il francese',
  svc='In Canada esistono servizi di supporto psicologico, in inglese o in francese.',
  where_q='In quali città lavori?',
  where_a='Ovunque in Canada: Toronto, Montréal, Vancouver, Calgary, Ottawa o una città più piccola. Ti serve solo una connessione stabile.',
  emerg='Se sei in pericolo chiama il 911. Per parlare subito con qualcuno puoi chiamare o scrivere un SMS al 988, attivo a qualsiasi ora.',
  near=['stati-uniti', 'dublino', 'australia'],
  related=[('/momenti-di-cambiamento-online/', 'momenti di cambiamento'), ('/ansia-online/', 'ansia')],
 ),
 dict(
  slug='australia', name='Australia', prep='in Australia', place_type='Country', area='Australia',
  title='Psicologo italiano online in Australia | F. Maragliulo',
  desc='Psicologo italiano online per chi vive in Australia, da Sydney a Melbourne e Perth: colloqui in videochiamata in italiano. Prima call gratuita.',
  h1='Psicologo italiano online in Australia',
  tag='Per italiani che vivono in Australia',
  lead='Sydney, Melbourne, Brisbane, Perth, Adelaide: l\'Australia è il posto più lontano dall\'Italia in cui si possa vivere. Che tu sia arrivato con un working holiday o ci viva da anni, la distanza si sente: voli di oltre venti ore, stagioni invertite, la famiglia che si sveglia quando tu vai a dormire. Qui puoi parlare di ciò che stai vivendo in italiano, in videochiamata.',
  bullets=[
   ('La distanza più grande', 'tornare è un viaggio lungo e costoso, e certi momenti li vivi da lontano.'),
   ('Giorno e notte invertiti', 'quando tu hai tempo, in Italia dormono: anche una telefonata va pianificata.'),
   ('Visti e incertezza', 'working holiday, sponsorizzazioni, residenza: il futuro dipende anche da una pratica.'),
   ('Ricominciare da capo', 'lavori diversi da quelli per cui hai studiato, la fatica di ripartire.'),
   ('Una nuova vita, vecchi legami', 'amicizie nuove che crescono e legami in Italia che si allentano.'),
   ('Restare o tornare?', 'una scelta che pesa di più quando in mezzo c\'è mezzo mondo.'),
  ],
  tz='A Sydney e Melbourne sei tra 8 e 10 ore avanti rispetto all\'Italia, a seconda del periodo dell\'anno; a Brisbane 8 o 9; a Perth 6 o 7. ' + FLEX,
  tz_q='Come gestiamo un fuso orario così grande?', tz_a='Da Sydney e Melbourne sei tra 8 e 10 ore avanti rispetto all\'Italia, da Perth 6 o 7. ' + FLEX,
  lang_q='Perché un colloquio in italiano se vivo in Australia?', lang='l\'inglese',
  svc='In Australia il supporto psicologico è in inglese e passa spesso dal medico di base.',
  where_q='In quali città lavori?',
  where_a='Ovunque in Australia: Sydney, Melbourne, Brisbane, Perth, Adelaide o un posto più remoto. Ti serve solo una connessione stabile.',
  emerg='Se sei in pericolo chiama lo 000. Per parlare subito con qualcuno puoi chiamare Lifeline al 13 11 14, attivo a qualsiasi ora.',
  near=['dubai', 'stati-uniti', 'canada'],
  related=[('/momenti-di-cambiamento-online/', 'momenti di cambiamento'), ('/relazioni-coppia-online/', 'relazioni e coppia')],
 ),
]


def esc(s): return html.escape(s, quote=True)
def A(href, text): return f'<a href="{href}" style="color:var(--accent)">{text}</a>'
def join_it(items): return items[0] if len(items) == 1 else ', '.join(items[:-1]) + ' e ' + items[-1]

BY_SLUG = {c['slug']: c for c in CITIES}


def faq_of(c):
    return [
        (c['tz_q'], c['tz_a']),
        (c['lang_q'], LANG_Q.format(lang=c['lang'])),
        ('Posso rivolgermi anche ai servizi del posto?', LOCAL_A.format(svc=c['svc'])),
        (c['where_q'], c['where_a']),
        ('E se sto molto male?', EMERG + c['emerg']),
    ]


def build(c, tpl, today):
    css = tpl[tpl.index('<style>'):tpl.index('</style>') + len('</style>')]
    fonts = tpl[tpl.index('<link rel="preconnect"'):tpl.index('<script type="application/ld+json">')].strip()
    header = tpl[tpl.index('<header class="nav"'):tpl.index('</header>') + len('</header>')]
    footer = tpl[tpl.index('<footer class="site-footer">'):]
    s, url = c['slug'], f'{ORIGIN}/{HUB}/{c["slug"]}/'
    faq = faq_of(c)
    service_name = f"Sostegno psicologico online in italiano per italiani che vivono {c['prep']}"
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "@id": url + "#webpage", "url": url, "name": c['h1'], "inLanguage": "it-IT",
         "isPartOf": {"@id": ORIGIN + "/#website"}, "about": {"@id": url + "#service"},
         "author": {"@id": ORIGIN + "/#person"}, "reviewedBy": {"@id": ORIGIN + "/#person"},
         "dateModified": today, "breadcrumb": {"@id": url + "#breadcrumb"}},
        {"@type": "BreadcrumbList", "@id": url + "#breadcrumb", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": ORIGIN + "/"},
            {"@type": "ListItem", "position": 2, "name": "Italiani all'estero", "item": f"{ORIGIN}/{HUB}/"},
            {"@type": "ListItem", "position": 3, "name": c['name'], "item": url}]},
        {"@type": "Service", "@id": url + "#service", "name": service_name, "serviceType": "Sostegno psicologico online",
         "provider": {"@id": ORIGIN + "/#person"}, "areaServed": {"@type": c['place_type'], "name": c['area']},
         "availableLanguage": ["it"]},
        {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]},
    ]}
    bullets = '\n'.join(f'      <li><b>{esc(b)}</b>: {esc(t)}</li>' for b, t in c['bullets'])
    faq_html = '\n'.join(f'      <details{" open" if i == 0 else ""}><summary>{esc(q)}</summary><p>{esc(a)}</p></details>' for i, (q, a) in enumerate(faq))
    near = join_it([A(f'/{HUB}/{n}/', BY_SLUG[n]['prep']) for n in c['near']])
    rel = ' e '.join(A(h, t) for h, t in c['related'])
    return f'''<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(c['title'])}</title>
<meta name="description" content="{esc(c['desc'])}">
<meta name="author" content="Francesco Maragliulo">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{esc(c['h1'])}">
<meta property="og:description" content="{esc(c['desc'])}">
<meta property="og:image" content="https://www.updateyourlife.it/img/og-psicologo-online.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="it_IT">
<meta property="og:site_name" content="Update Your Life">
<meta name="twitter:card" content="summary_large_image">
{fonts}
<script type="application/ld+json">
{json.dumps(ld, ensure_ascii=False, indent=2)}
</script>
{css}
<script>document.documentElement.classList.add('js');</script>
</head>
<body>

{header}

<main>

<section class="page-hero">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/{HUB}/">Italiani all'estero</a> › <span>{esc(c['name'])}</span></nav>
    <p class="tag">{esc(c['tag'])}</p>
    <h1>{esc(c['h1'])}</h1>
    <p class="lead">{esc(c['lead'])}</p>
    <div class="trust">
      <span>Psicologo iscritto all'Albo della Lombardia n. 27664</span>
      <span>Colloqui online solo in italiano</span>
      <span>Prima call gratuita di 20 minuti</span>
    </div>
    <div class="cta-row">
      <a class="btn" data-contatto="whatsapp-hero-{s}" href="{WA}" target="_blank" rel="noopener">Prenota la call gratuita</a>
    </div>
  </div>
</section>

<section class="section" id="ti-riconosci">
  <div class="wrap">
    <div class="reveal prose">
      <p class="tag">Ti riconosci?</p>
      <h2>Quando la distanza si fa sentire</h2>
      <p>Ognuno la vive a modo suo. Alcune situazioni che capitano spesso:</p>
    </div>
    <ul class="checks reveal">
{bullets}
    </ul>
  </div>
</section>

<section class="section" id="vivere-qui" style="background:var(--bg-alt)">
  <div class="wrap">
    <div class="reveal prose">
      <p class="tag">Orari e servizi</p>
      <h2>Vivere {esc(c['prep'])}, parlare in italiano</h2>
      <p>{esc(c['tz'])}</p>
      <p>{esc(LOCAL_P.format(svc=c['svc']))}</p>
      <p>Ci vediamo in videochiamata su una piattaforma sicura, tramite un link. I colloqui non vengono registrati. Se la connessione cade, troviamo subito un modo per proseguire senza intoppi: la sessione non si perde. Tutti i dettagli sono nella {A('/psicologo-online/', 'guida al colloquio online')}.</p>
    </div>
  </div>
</section>

<section class="section dark" id="cosa-facciamo">
  <div class="wrap">
    <div class="reveal prose">
      <p class="tag">Il percorso</p>
      <h2>Cosa facciamo insieme</h2>
      <p class="lead">Parto da come stai vivendo la tua situazione, non da un modello fisso. Il lavoro si adatta alla tua vita e ai tuoi ritmi.</p>
    </div>
    <div class="cards three">
      <article class="card reveal">
        <p class="num" style="color:var(--accent-light)">01</p>
        <h3>Fare spazio</h3>
        <p>Hai uno spazio in italiano dove dire ciò che negli altri contesti non dici, senza doverlo giustificare.</p>
      </article>
      <article class="card reveal">
        <p class="num" style="color:var(--warm)">02</p>
        <h3>Capire</h3>
        <p>Guardiamo cosa ti ha portato lì, cosa ti trattiene e cosa è cambiato in te e nelle tue relazioni.</p>
      </article>
      <article class="card reveal">
        <p class="num" style="color:oklch(72% 0.10 330)">03</p>
        <h3>Scegliere</h3>
        <p>Se hai una decisione aperta, la mettiamo a fuoco insieme, con più chiarezza su ciò di cui hai bisogno.</p>
      </article>
    </div>
    <div class="reveal prose" style="margin-top:36px">
      <p style="color:var(--on-dark-muted)">Lavoro con strumenti della Gestalt, dell'Analisi Transazionale, della mindfulness e del coaching, scelti in base a te. Se emerge un altro bisogno, lo valutiamo insieme e ti indico il professionista più adatto.</p>
    </div>
  </div>
</section>

<section class="section" id="come-iniziare">
  <div class="wrap">
    <div class="reveal prose">
      <p class="tag">Come iniziare</p>
      <h2>Dalla call gratuita al percorso</h2>
    </div>
    <div class="steps">
      <div class="step reveal"><h3>Mi scrivi</h3><p>Su WhatsApp, per telefono o via email. Ti rispondo personalmente.</p></div>
      <div class="step reveal"><h3>Call gratuita</h3><p>20 minuti per raccontarmi cosa ti porta e trovare un orario che funzioni con il tuo.</p></div>
      <div class="step reveal"><h3>Primi colloqui</h3><p>Mettiamo a fuoco la situazione e gli obiettivi del lavoro.</p></div>
      <div class="step reveal"><h3>Il percorso</h3><p>Incontri settimanali o quindicinali, senza pacchetti, con un confronto periodico su come sta andando.</p></div>
    </div>
  </div>
</section>

<section class="section" id="altri-temi" style="background:var(--bg-alt)">
  <div class="wrap">
    <div class="reveal prose">
      <p class="tag">Altri temi</p>
      <h2>Vivere lontano dall'Italia</h2>
      <p>Tutto quello che riguarda la vita all'estero, in generale, è nella pagina sullo {A(f'/{HUB}/', "psicologo online per italiani all'estero")}. Colloqui in italiano anche per chi vive {near}.</p>
      <p>Temi che chi vive all'estero porta spesso: {rel}.</p>
    </div>
  </div>
</section>

<section class="section" id="domande">
  <div class="wrap">
    <div class="reveal" style="text-align:center">
      <p class="tag">Domande frequenti</p>
      <h2>Le domande più comuni</h2>
    </div>
    <div class="faq reveal">
{faq_html}
    </div>
  </div>
</section>

<section class="section dark" id="inizia">
  <div class="wrap grid-2">
    <div class="reveal">
      <p class="tag">Il primo passo</p>
      <h2>Parliamone in una call gratuita</h2>
      <p class="lead">20 minuti, senza impegno. Mi racconti cosa stai vivendo e troviamo un orario che funzioni per te. Rispondo personalmente, di solito in giornata.</p>
    </div>
    <div class="reveal contact-list">
      <a class="contact-btn primary" data-contatto="whatsapp-{s}" href="{WA}" target="_blank" rel="noopener">
        <span><small>Il modo più rapido</small>Scrivimi su WhatsApp</span>
      </a>
      <a class="contact-btn" data-contatto="telefono-{s}" href="tel:+393314980002">
        <span><small>Telefono</small>+39 331 498 0002</span>
      </a>
      <a class="contact-btn" data-contatto="email-{s}" href="mailto:francescomaragliulo@gmail.com?subject=Richiesta%20call%20conoscitiva">
        <span><small>Email</small>francescomaragliulo@gmail.com</span>
      </a>
    </div>
  </div>
</section>

</main>

{footer}'''


EUROPE = {'londra', 'germania', 'svizzera', 'parigi', 'bruxelles', 'amsterdam', 'dublino', 'spagna'}


def hub_block():
    def li(c): return f'        <li><a href="/{HUB}/{c["slug"]}/" style="color:var(--accent)">{esc(c["h1"])}</a></li>'
    eu = '\n'.join(li(c) for c in CITIES if c['slug'] in EUROPE)
    world = '\n'.join(li(c) for c in CITIES if c['slug'] not in EUROPE)
    return f'''<!-- citta:start (generato da scripts/build-citta.py) -->
<section class="section" id="dove-vivi" style="background:var(--bg-alt)">
  <div class="wrap">
    <div class="reveal prose">
      <p class="tag">Dove vivi?</p>
      <h2>Colloqui in italiano, in qualsiasi Paese</h2>
      <p>Lavoro con italiani che vivono in tutto il mondo. Per alcune città e Paesi ho raccolto le informazioni pratiche: fuso orario, servizi locali, numeri utili.</p>
      <h3 style="font-size:24px;margin:28px 0 8px">In Europa</h3>
      <ul style="padding-left:20px">
{eu}
      </ul>
      <h3 style="font-size:24px;margin:28px 0 8px">Nel resto del mondo</h3>
      <ul style="padding-left:20px">
{world}
      </ul>
      <p style="margin-top:20px">Vivi altrove? Va bene lo stesso: ti serve solo una connessione stabile.</p>
    </div>
  </div>
</section>
<!-- citta:end -->'''


def main():
    import datetime
    today = datetime.date.today().isoformat()
    hub_path = os.path.join(ROOT, HUB, 'index.html')
    tpl = open(hub_path, encoding='utf8').read()
    for c in CITIES:
        d = os.path.join(ROOT, HUB, c['slug'])
        os.makedirs(d, exist_ok=True)
        path = os.path.join(d, 'index.html')
        new = build(c, tpl, today)
        old = open(path, encoding='utf8').read() if os.path.exists(path) else ''
        # dateModified cambia solo se cambia il contenuto
        if old and re.sub(r'"dateModified": "[^"]+"', '', old) == re.sub(r'"dateModified": "[^"]+"', '', new):
            continue
        open(path, 'w', encoding='utf8').write(new)
        print('scritta', c['slug'])
    block = hub_block()
    if '<!-- citta:start' in tpl:
        tpl2 = re.sub(r'<!-- citta:start.*?<!-- citta:end -->', lambda m: block, tpl, flags=re.S)
    else:
        tpl2 = re.sub(r'<section class="section" id="dove-vivi".*?</section>', lambda m: block, tpl, count=1, flags=re.S)
    if tpl2 != tpl:
        open(hub_path, 'w', encoding='utf8').write(tpl2)
        print('aggiornato hub')


if __name__ == '__main__':
    main()
