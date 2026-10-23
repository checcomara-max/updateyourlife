# Uno di Uno — guida interna (v2, ottobre 2026)

Sezione riservata di updateyourlife.it: `www.updateyourlife.it/uno-di-uno/`. La pagina pubblica mostra solo "Work in progress · Available soon" con un campo password; con la password si entra nel percorso completo.

Questa cartella (`_sorgenti/`) non viene pubblicata da GitHub Pages (Jekyll ignora le cartelle che iniziano con `_`) e su Vercel rimanda a `/uno-di-uno/`.

## Libreria cifrata (da ottobre 2026)

I testi del libro non sono più in chiaro né nel repository né sul sito. Nel repo ci sono solo due file cifrati con la password dell'anteprima (PBKDF2-SHA256, 310.000 iterazioni → AES-256-GCM):

- `uno-di-uno/assets/content.js` — la libreria che il browser decifra dopo la password;
- `uno-di-uno/_sorgenti/contenuti.enc` — i file `.md` originali, per poterli riaprire e modificare.

La password **non è scritta da nessuna parte nel repository**: chi deve modificare i testi la chiede a Francesco. Dalla password si ricavano sia la chiave sia l'impronta che sta in `assets/gate.js`, quindi l'impronta non permette di risalire alla password in tempi utili.

Per modificare i testi:

```
UDU_PASSWORD='...' node scripts/build-uno-di-uno.mjs --apri     # decifra in _sorgenti/contenuti/ (cartella esclusa da git)
# modifica i file .md
UDU_PASSWORD='...' node scripts/build-uno-di-uno.mjs            # valida e ricifra content.js e contenuti.enc
node scripts/build-uno-di-uno.mjs --check                       # controllo senza password (lo fa anche il CI)
```

Per cambiare password: `UDU_PASSWORD='nuova' node scripts/build-uno-di-uno.mjs --imposta-password`, poi apri con la vecchia e ricifra con la nuova (`--apri` con la vecchia, poi build con la nuova dopo `--imposta-password`).

Attenzione: le versioni dei testi committate **prima** della cifratura (commit del 23 ottobre 2026 sul ramo `main`) restano leggibili nella cronologia di GitHub finché il repository è pubblico. Per chiuderle davvero: repository privato (GitHub Pro), oppure riscrittura della cronologia (operazione distruttiva, da fare solo consapevolmente).

## Pagine

| URL | Cosa fa |
| --- | --- |
| `/uno-di-uno/` | Pubblica. "Work in progress · Available soon" + password. Sblocca l'accesso in questo browser (localStorage). |
| `/uno-di-uno/scopri/` | Presentazione del libro (landing). |
| `/uno-di-uno/metodo/` | Il metodo: modelli, cosa è e cosa non è, come si leggono i risultati, a chi non è adatto, privacy, bibliografia. |
| `/uno-di-uno/inizia/` | Prima di iniziare: tre conferme (auto-aiuto non test, 18+, a chi rivolgersi), nome, forma F/M/neutra. |
| `/uno-di-uno/questionario/` | 55 domande in 5 parti, una per schermata, salvataggio automatico, tasti numerici. |
| `/uno-di-uno/profilo/` | Anteprima: pattern sotto carico, specifiche, cinque tratti, note di attenzione e di nitidezza, codice profilo, nome e obiettivo. |
| `/uno-di-uno/libro/` | Il libro a schermo + **Scarica il PDF** (A5, vettoriale, font incorporati, composto nel browser). |

Tutte le pagine hanno `noindex, nofollow` (anche via header su Vercel), non sono in sitemap, non caricano Google Analytics né risorse esterne.

**Password.** Nel codice c'è solo l'impronta SHA-256 di `udu|<password>` (in `assets/gate.js` e in `index.html`). Per cambiarla: `echo -n 'udu|NUOVAPASSWORD' | sha256sum` e sostituisci l'impronta nei due file. È una "tenda" per tenere fuori visitatori e motori di ricerca durante i lavori, non una protezione vera: chi legge il codice sorgente può aggirarla.

## File

- `assets/engine.js` — domande, punteggi, codice profilo (versione `U2`). Unico punto in cui cambiano domande e regole.
- `assets/book.js` — composizione del libro: modello a blocchi → HTML (schermo) e pdfmake (PDF).
- `assets/content.js` — **generato e cifrato**: non si modifica a mano.
- `_sorgenti/contenuti/*.md` — la libreria dei testi, solo in locale dopo `--apri` (stessa sintassi del kit: `=== modulo: id ===`, `@@ sezioni`, `[[m|f|n]]`, `{{variabili}}`). File `09-tratti.md` (cinque tratti × tre fasce, con `@@ lavoro` e `@@ idea` per fascia) e moduli di cornice: `nota-carico`, `nota-metodo`, `curva-pressione`, `matrice-decisione`, `matrice-conflitto`, `fonti-intro`.
- Sezioni di arricchimento in ogni modulo di capitolo: `@@ inbreve` (3 righe), `@@ citazione` (una frase), `@@ curiosita | Titolo` (testo + riga finale `Fonte: ...`). Lo script controlla che ci siano. Le fonti finiscono da sole nella pagina "Le fonti delle curiosità" in fondo al libro.
- Regola per le curiosità: solo ricerche pubblicate e verificabili, fonte completa, nessun numero non presente nello studio, e se un risultato famoso è stato ridimensionato va detto (vedi le marmellate).
- `assets/vendor/pdfmake.min.js` — pdfmake 0.2.20 (licenza MIT), caricato solo al clic su "Scarica il PDF".
- `assets/fonts/` — Fraunces, Literata, Inter (SIL OFL): woff2 per lo schermo, ttf per il PDF.

Dopo ogni modifica ai testi: build con la password (sopra) e `node scripts/audit.mjs`.

## L'impianto teorico (v2)

Il kit v1 misurava cinque dimensioni "a interruttore" con 2 affermazioni per polo. La v2 ricostruisce la raccolta delle informazioni su modelli riconosciuti, mantenendo la libreria di 35 moduli e l'architettura in 11 capitoli.

| Parte | Domande | Modello | Punteggio | Decide |
| --- | --- | --- | --- | --- |
| 1. Il tuo momento | missione (5), ruolo (3), carico (4 livelli) | Transizioni (Schlossberg, 1981) | scelta diretta | cap. 7, note di ruolo cap. 3, nota carico |
| 2. Come sei di solito | 20 Big Five + 2 recupero | Big Five, item adattati dal Mini-IPIP (Donnellan et al., 2006; IPIP, pubblico dominio); recupero (Sonnentag e Fritz, 2007) | media 1-5 per tratto (item invertiti girati). Fasce rispetto al punto medio della scala: ≤ 2,25 bassa, ≥ 3,75 alta. NON normative | cap. 1 (cinque tratti) |
| — Energia | 4 item Estroversione + 2 recupero | | somma centrata su 3, indice −1…+1; marcata se |somma| ≥ 5, moderata se ≥ 1 | cap. 2 (a contatto / a silenzio) |
| 3. Sotto pressione | 12 Likert + 1 situazionale | Coping (Lazarus e Folkman; Carver; Endler e Parker): controllo, pensiero ripetitivo (Watkins, 2008), ritiro/disimpegno, *tend and befriend* (Taylor et al., 2000) | somma 3 item + 2 al modo scelto nella situazionale (3-17). Parità → situazionale. Secondario se ≥ 10 | cap. 3, combinazioni cap. 4-5, rischi cap. 7 |
| 4. Decisioni e disaccordi | 3+3 decisione, 3+3 disaccordi | Stili decisionali razionale e intuitivo come **due scale separate** (Scott e Bruce, 1995; Epstein et al., 1996). Disaccordi: doppio interesse, assertività vs attenzione alla relazione (Rahim, 1983) | differenza tra le medie; marcata se ≥ 1, moderata se ≥ 0,3. Se razionale e intuitivo sono entrambi ≥ 3,67 il libro aggiunge una nota | cap. 4 e 5 |
| 5. Cosa ti muove | 4 scelte forzate + frase | Autodeterminazione (Deci e Ryan, 2000) + significato/beneficenza (Martela e Ryan, 2016). La frase si ispira ai *driver* di Kahler (1975) | conteggio; parità → m4, poi m1 | cap. 6, lettera |

Controlli di qualità delle risposte (solo informativi, mostrati nell'anteprima):

- **Incoerenze**: coppie diretta/invertita dello stesso tratto entrambe ≥ 4 o entrambe ≤ 2. Con 4 o più incoerenze su 10 il profilo è segnalato come "poco nitido".
- **Risposte tutte uguali** sulle 46 affermazioni.
- **Attenzione**: carico "molto pesante", oppure "pesante" con reattività emotiva in fascia alta → nota nell'anteprima; con carico "molto pesante" anche una pagina dedicata nel libro (modulo `nota-carico`) con il 112.

Codice profilo: `U2-` + genere, ruolo, missione, carico + 46 cifre Likert in ordine canonico + fc e m1-m4 e frase + carattere di controllo. Contiene solo risposte, niente nome né email. Serve per ricomporre un libro identico e, in futuro, per il pagamento.

Da fare dopo i primi 200 profili reali: alfa di Cronbach per scala, correlazione tra le scale (in particolare razionale/intuitivo e assertività/relazione, che ci aspettiamo poco correlate), revisione degli item più deboli. È un'ottima base per un articolo ("cosa ho imparato da 200 profili").

## Inquadramento formale (proposto, da validare)

Obiettivo: che Uno di Uno sia, nei fatti e nella comunicazione, un **prodotto editoriale di auto-aiuto** firmato da uno psicologo, e non una prestazione professionale psicologica né un test.

Scelte che reggono questo inquadramento:

1. **Natura del prodotto.** Libro di auto-aiuto personalizzato a scopo di autoconoscenza e sviluppo personale e professionale. Il questionario è uno strumento di auto-osservazione che seleziona capitoli già scritti con regole fisse e dichiarate.
2. **Nessun test.** Item non standardizzati né tarati, nessun punteggio normativo (niente percentili, fasce solo rispetto alla scala), nessun costrutto clinico, nessuna diagnosi. Linguaggio di tendenza ("ti descrivi come"), poli senza giudizio, "reattività emotiva" al posto di "nevroticismo".
3. **Nessun rapporto professionale.** Francesco non vede le risposte (restano nel browser), non le interpreta e non le restituisce: la composizione è automatica. Completare il questionario non avvia una consulenza.
4. **Trasparenza sui limiti.** Pagina "Il metodo" con modelli, bibliografia, cosa non è, come si leggono i risultati; avvertenze e nota sul metodo dentro ogni libro.
5. **Tutela delle persone.** Solo maggiorenni (conferma esplicita), esclusione dichiarata per chi è in crisi, nota dedicata se il carico è al limite, 112 sempre presente. Divieto dichiarato di usarlo per valutare o selezionare altre persone (importante per l'offerta alle aziende).
6. **Privacy by design.** Nessun dato inviato, nessuna statistica su queste pagine, cancellazione con un clic. Finché è così non c'è trattamento di dati personali da parte di Francesco.
7. **Item.** Adattati da materiale di pubblico dominio (IPIP) o originali: nessuno strumento protetto da copyright (NEO, BFQ, TKI, GDMS originale) viene riprodotto.

Da verificare prima del lancio pubblico (non sono pareri legali):

- **Ordine degli Psicologi della Lombardia**: chiedere un parere sull'inquadramento "prodotto editoriale di auto-aiuto" e sulla comunicazione (uso del titolo di psicologo e del numero di iscrizione sul prodotto).
- **Debrief a pagamento** (previsto nel piano): quello sì è una prestazione professionale. Va deciso se come psicologo (consenso informato, fatturazione sanitaria) o come coach, e comunicato di conseguenza. Fino ad allora nessun riferimento al debrief nelle pagine.
- **Pagamenti** (fase 2): servono P.IVA/posizione fiscale, termini di vendita, recesso (art. 59 Codice del Consumo per contenuti digitali personalizzati), informativa privacy per Stripe e per il codice profilo (che diventa un dato trattato).
- **Marchio "Uno di Uno"** e dominio.

## Rischio residuo

La libreria è cifrata, ma chi conosce la password la decifra nel browser, e la cronologia pubblica di GitHub contiene ancora le versioni in chiaro precedenti alla cifratura. Prima di vendere conviene:

1. rendere privato il repository (Vercel funziona anche con repository privati; GitHub Pages da repository privato richiede un piano a pagamento), e
2. con i pagamenti, spostare la composizione del PDF su una funzione server (Vercel) che riceve il codice profilo dopo il pagamento, così la libreria completa non arriva più al browser. `book.js` è già separato da pagine e motore proprio per questo: gira identico in Node.
