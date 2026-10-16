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
- Counselor Gestalt (BioGestalt) + Analisi Transazionale, docente SIBIG, coach ICF, mindfulness. Manager in multinazionale da 18 anni (Milano): percorsi personali + lavoro/leadership (futuro: neo manager / junior executive).
- P.IVA non ancora aperta: niente "fattura", "spesa detraibile", tariffe. Il costo si comunica nella call gratuita. Tariffe e durata seduta: non disponibili (aggiornare quando Francesco le fornisce).
- Prima call conoscitiva gratuita di 20 minuti.
- Deontologia: nessuna promessa di risultato o guarigione, nessun numero di sedute garantito, nessun claim clinico. Testimonianze reali e già presenti in home; non inventarne.
- Se la connessione cade: "troviamo subito un modo per proseguire senza intoppi, la sessione non si perde".
- Colloqui non registrati, piattaforma di videochiamata sicura con link, frequenza di solito settimanale o quindicinale, niente pacchetti.
- Stile testi: asciutto, diretto, dare del "tu", FAQ brevi.

## Regole tecniche SEO

- Ogni pagina nuova: `<title>` ≤ 60-65 caratteri, meta description ≤ 160 caratteri (Bing segnala errore oltre), un solo H1 con keyword, canonical, Open Graph, JSON-LD (WebPage, BreadcrumbList, Service, FAQPage coerente con le FAQ visibili), link interni, voce in `sitemap.xml`.
- Pagina statica HTML pre-renderizzata (niente rendering lato client). Immagini WebP leggere (<200 KB), `width`/`height`, `loading="lazy"`.
- Ogni pagina servizio/articolo deve linkare almeno 2 altre pagine del sito con anchor descrittivi (blocco "Altri temi" o CTA finale).
- Riusare CSS, nav, footer, cookie banner e script contatti della home / di `psicologo-online/index.html`. Eventi contatto con `data-contatto`.
- Controllo mobile (nessuno scroll orizzontale) prima di proporre.
- Contatti: WhatsApp +39 331 498 0002, email [francescomaragliulo@gmail.com](mailto:francescomaragliulo@gmail.com).

## Struttura pagine

- `/` home
- `/psicologo-online/` guida al colloquio online
- `/ansia-online/`
- `/relazioni-coppia-online/`, `/autostima-online/`, `/momenti-di-cambiamento-online/`, `/stress-lavoro-burnout-online/`, `/psicologo-per-manager/`, `/psicologo-online-italiani-estero/`, `/psicologo-online-milano/`
- Il footer di home e pagine servizio contiene l'elenco dei temi (`nav.topics`): aggiungere ogni nuova pagina servizio anche lì, in sitemap e nei blocchi "Altri temi".
- `/approfondimenti/` (articoli; elenco STATICO: per ogni nuovo articolo aggiungere la card in `approfondimenti/index.html`, la voce nell'ItemList JSON-LD e in `sitemap.xml`)
- `/supervisione` (statica, pre-renderizzata da React; modificare l'HTML direttamente)
- `vercel.json`: header noindex sul dominio project-30hc5.vercel.app (duplicato). Immagini sempre WebP in `img/`, mai PNG pesanti nel repo.

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
