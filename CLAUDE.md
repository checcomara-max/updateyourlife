# Update Your Life — sito di Francesco Maragliulo (psicologo online)

Sito statico (HTML/CSS/JS inline, nessun framework) su updateyourlife.it. Deploy automatico da `main` (GitHub Pages + Vercel). Un push/merge su `main` va subito online.

## Obiettivo

Diventare un riferimento online come psicologo: chi cerca "psicologo online" e vuole colloqui online deve trovare Francesco tra i primi. Orizzonte realistico 6-12 mesi, strategia long-tail + pagine per problema + E-E-A-T.

## Metodo di lavoro

1. Per modifiche strutturali o di layout: proponi e mostra anteprima. Per fix tecnici, SEO, nuovi contenuti e ottimizzazioni: procedi direttamente.
2. Push e merge su `main` autorizzati senza approvazione esplicita. Un push su `main` va subito online.
3. Dopo il push verifica online (title, H1, contenuti) e ricorda a Francesco di richiedere l'indicizzazione in Search Console e Bing (URL Inspection → Request indexing).

## Profilo e regole di contenuto

- Francesco Maragliulo, psicologo iscritto all'Albo Lombardia n. 27664. NON psicoterapeuta: mai offrire "psicoterapia" o "terapia" come servizio.
- Non "strillare" ciò che non fa: comunicare cosa fa. "Non sono psicoterapeuta" compare solo nelle FAQ. Altrove, formula neutra: "se emerge un altro bisogno, lo valutiamo insieme e ti indico il professionista più adatto".
- Colloqui solo online, solo in italiano (anche italiani all'estero).
- Counselor gestaltico ed analitico transazionale, docente SIBIG, coach ICF, mindfulness. Manager in multinazionale da 18 anni (Milano): percorsi personali + lavoro/leadership (futuro: neo manager / junior executive).
- P.IVA non ancora aperta: niente "fattura", "spesa detraibile", tariffe. Il costo si comunica nella call gratuita. Tariffe e durata seduta: non disponibili (aggiornare quando Francesco le fornisce).
- Prima call conoscitiva gratuita di 20 minuti.
- Deontologia: nessuna promessa di risultato o guarigione, nessun numero di sedute garantito, nessun claim clinico. Testimonianze reali e già presenti in home; non inventarne.
- Se la connessione cade: "troviamo subito un modo per proseguire senza intoppi, la sessione non si perde".
- Colloqui non registrati, piattaforma di videochiamata sicura con link, frequenza di solito settimanale o quindicinale, niente pacchetti.
- Stile testi: asciutto, diretto, dare del "tu", FAQ brevi.
- Bottoni e link WhatsApp: l'etichetta è sempre "Scrivimi su WhatsApp" (mai "Prenota la call", mai "Call gratuita su WhatsApp"). Accanto, la promessa: "Ci organizziamo per una call conoscitiva di 20 minuti, gratuita e senza impegno." Testo precompilato: "Ciao Francesco, vorrei organizzare la call conoscitiva di 20 minuti."
- Posizionamento: Francesco si presenta prima di tutto su emozioni e relazioni (ansia, autostima, coppia, cambiamenti), poi anche su lavoro e leadership. Home e pagine generali devono restare equilibrate: il tema manager/lavoro e il tema estero hanno le loro pagine, non vanno messi al centro della home.
- "Ti ascolto in italiano" e frasi simili sulla lingua: solo nelle pagine per italiani all'estero (hub e città), non in home.

## Regole tecniche SEO

- Ogni pagina nuova: `<title>` ≤ 60-65 caratteri, meta description ≤ 160 caratteri (Bing segnala errore oltre), un solo H1 con keyword, canonical, Open Graph, JSON-LD (WebPage, BreadcrumbList, Service, FAQPage coerente con le FAQ visibili), link interni, voce in `sitemap.xml`.
- Pagina statica HTML pre-renderizzata (niente rendering lato client). Immagini WebP leggere (<200 KB), `width`/`height`, `loading="lazy"`.
- Ogni pagina servizio/articolo deve linkare almeno 2 altre pagine del sito con anchor descrittivi (blocco "Altri temi" o CTA finale).
- Design condiviso (ottobre 2026): stile in `/assets/site.css`, script in `/assets/site.js` (cookie + GA, eventi `data-contatto`, menu mobile, barra WhatsApp mobile), font locali in `/assets/fonts/` (Newsreader per titoli e frasi, Lexend per il testo). Niente `<style>` di pagina se non serve, niente Google Fonts, niente animazioni di ingresso (`.reveal`): la pagina deve essere leggibile appena caricata.
- Per una pagina nuova copia testata (`<a class="skip">` … `</header>`), footer, banner cookie, barra `#sticky` e `<script src="/assets/site.js">` da `ansia-online/index.html`. Classi body: `home`, `svc` (pagine tema e città), `about-page`, `list-page`, `art` (articoli), `legal-page`. Hero con `data-hero`, fascia contatti con `data-contact` (servono alla barra mobile).
- Pagine tema: hero con breadcrumb, H1, `.lead`, riquadro `.author` (avatar `img/francesco-maragliulo-avatar.webp`), bottone WhatsApp + `.note`, e a destra `.opening` con la frase in prima persona del tema; riquadro `.whobox` "Chi ti risponde"; blocco `.frasi` con 3 temi collegati in "Altri temi"; `.byline` con data di aggiornamento uguale a `dateModified`.
- Immagini Open Graph: `python3 scripts/build-og.py` genera `img/og/<pagina>.jpg` (aggiungi la pagina nuova alla lista PAGES).
- Controllo mobile (nessuno scroll orizzontale) prima di proporre.
- Contatti: WhatsApp +39 331 498 0002, email [francescomaragliulo@gmail.com](mailto:francescomaragliulo@gmail.com).
- Link "Leggi le recensioni" (home e /chi-sono/): apre direttamente la vista Recensioni della scheda Google (ricerca con parametri `si` e `uds` forniti da Francesco il 19/10/2026). Se smette di funzionare, chiedere a Francesco di riaprire le recensioni dalla scheda e copiare il nuovo indirizzo (togliendo client, sxsrf, ved, biw, bih, dpr).

## Principi di design (adottati da Francesco, ottobre 2026)

Lavorare come un direttore creativo: codice di produzione, un punto di vista chiaro, cura del dettaglio.
- Il brief vince: estetica, font e palette indicati da Francesco si rispettano anche contro il gusto personale.
- Rifinire conserva (identità, comportamento, testi esistenti); riprogettare sostituisce davvero, senza mezze misure. Chiedere prima di cambiare testi fattuali o aggiungere affermazioni.
- Scegliere la modalità dalla pagina, non dal prodotto: **Persuadere** (landing, pagine servizio: attenzione e azione, impegno pieno), **Operare** (questionari, strumenti: leggibilità, coerenza, nessuna sorpresa), **Leggere** (articoli, metodo, guide: struttura per capire, piacere di leggere), **Esperienza** (vetrine: il contenuto guida).
- Verificare sempre guardando il risultato renderizzato alle misure reali (telefono 360 px, tablet ~820 px, desktop 1280 px), raggruppando i controlli: prima si corregge tutto ciò che una schermata mostra, poi si riguarda.
- Finire il lavoro: niente consegne a metà, salvo materiali che deve fornire Francesco.
- Il kit completo "impeccable" (comandi critique/audit/polish/…) non è installato in questo repository: se serve, va aggiunto come skill in `.claude/skills/`.

## Struttura pagine

- `/` home
- `/psicologo-online/` guida al colloquio online
- `/ansia-online/`
- `/azienda-di-famiglia-online/` (coach e psicologo per chi lavora in azienda di famiglia): contiene il modulo della guida «Il tuo posto» (`#guida`, stesso funzionamento di `/prima-di-dimenticare/`, stessa Google Apps Script). Il PDF viene inviato da Francesco su WhatsApp e NON è pubblicato sul sito né nel repository. Informativa in `privacy-policy.html#guida-il-tuo-posto`.
- `/coaching/` (coaching per manager e professionisti in azienda) e `/coaching-online-crescita-personale/` (coaching su temi personali: scelte, relazioni, obiettivi; non parla di lavoro per non sovrapporsi a `/coaching/`, e dice con trasparenza che Francesco è anche psicologo).
- `/relazioni-coppia-online/`, `/autostima-online/`, `/momenti-di-cambiamento-online/`, `/stress-lavoro-burnout-online/`, `/psicologo-per-manager/`, `/psicologo-online-italiani-estero/`, `/psicologo-online-milano/`
- Pagine città per italiani all'estero sotto `/psicologo-online-italiani-estero/<slug>/` (Londra, Germania, Svizzera, Parigi, Bruxelles, Amsterdam, Dublino, Spagna, Dubai, Stati Uniti, Canada, Australia). GENERATE da `scripts/build-citta.py`: per modificarle o aggiungerne una, cambia i dati nello script e rilancialo (non editare gli HTML a mano). Ogni nuova città deve avere contenuto davvero locale (fuso, servizi, numeri di emergenza verificati), mai pagine fotocopia. Non vanno in `nav.topics`: le linka l'hub (blocco "Dove vivi?").
- Fusi orari: Francesco lavora con clienti in fusi diversi e trova spazio anche in orari meno consueti (si può dire, senza indicare orari precisi).
- Il footer di home e pagine servizio contiene l'elenco dei temi (`nav.topics`): aggiungere ogni nuova pagina servizio anche lì, in sitemap e nei blocchi "Altri temi".
- `/chi-sono/` (profilo, formazione, approccio; schema ProfilePage + Person)
- `/approfondimenti/` (articoli; elenco STATICO: per ogni nuovo articolo aggiungere la card in `approfondimenti/index.html`, la voce nell'ItemList JSON-LD e in `sitemap.xml`)
- `/supervisione` (statica, pre-renderizzata da React; modificare l'HTML direttamente)
- `vercel.json`: header noindex sul dominio project-30hc5.vercel.app (duplicato). Immagini sempre WebP in `img/`, mai PNG pesanti nel repo.

## Uno di Uno (`/uno-di-uno/`, anteprima riservata)

- Prodotto separato: libro di auto-aiuto personalizzato («[Nome]. Istruzioni per l'uso») composto da un questionario di auto-osservazione. Guida completa, impianto teorico e inquadramento formale in `uno-di-uno/_sorgenti/LEGGIMI.md`: leggerla prima di toccare la sezione.
- `/uno-di-uno/` è pubblica e mostra solo "Work in progress · Available soon" + password; le sottopagine (`scopri`, `metodo`, `inizia`, `questionario`, `profilo`, `libro`) caricano `assets/gate.js` nel `<head>` e rimandano al gate senza accesso. Nel repo c'è solo l'impronta SHA-256 della password, mai la password in chiaro.
- Tutte le pagine: `noindex, nofollow`, fuori sitemap, niente `site.js`/GA, niente risorse esterne (stile proprio in `uno-di-uno/assets/udu.css`, font Fraunces/Literata/Inter locali). Le risposte restano nel browser: non aggiungere invii di dati o statistiche senza aggiornare pagina metodo, avvertenze e privacy.
- La libreria dei testi è CIFRATA con la password dell'anteprima: nel repo solo `uno-di-uno/assets/content.js` e `uno-di-uno/_sorgenti/contenuti.enc`. La password non va mai scritta in file, commit o messaggi di commit: chiederla a Francesco. Per modificare: `UDU_PASSWORD='...' node scripts/build-uno-di-uno.mjs --apri`, modifica i `.md` in `_sorgenti/contenuti/` (esclusi da git, mai committarli), poi `UDU_PASSWORD='...' node scripts/build-uno-di-uno.mjs`. Il CI esegue `--check` senza password. Domande e punteggi solo in `assets/engine.js` (se cambiano, nuova `VERSION`).
- Ogni modulo di capitolo ha `@@ inbreve`, `@@ citazione`, `@@ curiosita` (con `Fonte:`): curiosità solo da ricerche pubblicate e verificabili, mai numeri inventati.
- Regole di contenuto: mai "test", "valutazione", "diagnosi" come cosa che il prodotto fa; linguaggio di tendenza ("ti descrivi come"); nessun prezzo finché non ci sono P.IVA e pagamenti; 112 sempre presente nelle avvertenze.

## NOI (`/noi/`, percorso per coppie, area riservata)

- Due questionari separati (lei e lui, o qualunque coppia), istruzioni personali per ciascuno e una scheda di coppia. Guida completa in `noi/_sorgenti/LEGGIMI.md`: leggerla prima di toccare la sezione. Allineato al «Manuale operativo per i colloqui di coppia» (percorso NOI in otto temi).
- Stesse regole di Uno di Uno: `noindex, nofollow`, fuori sitemap, niente `site.js`/GA, niente risorse esterne (stile `noi/assets/noi.css`, font e pdfmake di Uno di Uno). Tutte le pagine caricano `noi/assets/gate.js`.
- La password dell'area non va mai scritta in file, commit o messaggi: chiederla a Francesco. Libreria testi cifrata (`noi/assets/content.js`, `noi/_sorgenti/contenuti.enc`); per modificarla `NOI_PASSWORD='...' node scripts/build-noi.mjs --apri`, modifica i `.md` in `noi/_sorgenti/contenuti/` (esclusi da git), poi `NOI_PASSWORD='...' node scripts/build-noi.mjs`. Il CI esegue `--check`.
- Le risposte partono cifrate con la chiave pubblica di Francesco (`noi/assets/chiave.js`); la chiave privata (`NOI-chiave-privata-<id>.json`) non va MAI nel repository né nel sito. Lo studio (`/noi/studio/`) apre le buste e genera i PDF.
- Linguaggio: «colloqui di coppia», «sostegno», «percorso psicoeducativo», mai «terapia di coppia». Domanda riservata sulla sicurezza: se c'è paura, controllo o violenza niente documenti di coppia (1522, 112). Prima dei documenti Francesco sente ciascuno da solo. Niente prezzi; informativa privacy in `/noi/metodo/#privacy` ancora da validare.

## Automazione e controlli (GitHub Actions)

- `node scripts/audit.mjs`: audit statico (title/description, canonical, H1 unico, JSON-LD valido e FAQPage coerente con le FAQ visibili, immagini, link interni/ancore rotti, ≥2 link interni, footer `nav.topics`, sitemap, termini vietati dal profilo). Gira su ogni push/PR (`site-audit.yml`); gli errori bloccano, i warning no. Lanciarlo in locale PRIMA di ogni push su `main`.
- `node scripts/build-sitemap.mjs`: rigenera `sitemap.xml` da tutte le pagine indicizzabili (lastmod = ultimo commit del file). `sitemap-sync.yml` lo fa da solo su `main` e committa se cambia: non serve più editare la sitemap a mano (le pagine nuove vengono incluse automaticamente).
- `node scripts/live-check.mjs`: verifica il sito pubblicato (200 senza redirect per ogni URL in sitemap, title/H1/canonical uguali al repo, robots.txt). `live-check.yml`: dopo ogni push a `main` e ogni lunedì; se fallisce, GitHub manda la notifica.
- `indexnow.yml`: dopo il deploy notifica a Bing/Yandex le pagine HTML modificate (chiave in `<key>.txt` nella root, non rimuoverla). Google non supporta IndexNow: resta la richiesta manuale in Search Console.
- Una nuova pagina servizio va comunque aggiunta a mano in `nav.topics` (home e pagine servizio), nei blocchi "Altri temi" e nell'elenco `SERVICE_DIRS` di `scripts/audit.mjs`; un nuovo articolo anche in `approfondimenti/index.html` (card + ItemList): l'audit segnala se manca.

## Prossimi step (roadmap)

8. Pagine problema: `/ansia-online/` (bozza pronta), poi relazioni/coppia, momenti di cambiamento, stress lavoro e neo manager.
9. Pagina costi (quando ci sono le tariffe).
10. Pagina città (Milano).
11. Due articoli al mese su intenti di ricerca reali, con link alle pagine servizio.
12. Link interni.
10. Scheda Google Business (un cambiamento alla volta).
15. Recensioni.
16. Directory (MioDottore, GuidaPsicologi, Psicologi Italia, Albo).
17. Instagram.
11. Report mensile da export CSV di Search Console.

Fatti: Search Console (sitemap + indicizzazione), Bing Webmaster Tools agganciato.
