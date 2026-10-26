# NOI — guida interna (v1, ottobre 2026)

Percorso per coppie di updateyourlife.it, area riservata: `www.updateyourlife.it/noi/`. Si entra con la password dell'area (la custodisce Francesco: non scriverla mai in file, commit o messaggi).

Questa cartella (`_sorgenti/`) non viene pubblicata da GitHub Pages (Jekyll ignora le cartelle che iniziano con `_`) e su Vercel rimanda a `/noi/`.

## Che cosa fa

1. **Iscrizione** (`/noi/iscrizione/`): uno dei due inserisce nomi, forma grammaticale (femminile, maschile, neutra) e un contatto per ciascuno. Il sito genera un codice coppia e due inviti personali. L'invito è un link con i dati minimi dopo il `#` (`#i=…`): la parte dopo il `#` non arriva al server. Poi la coppia avvisa Francesco (nomi, contatti, codice: nessuna risposta).
2. **Questionario** (`/noi/questionario/#i=…`): 36 domande in 7 parti (momento, vicinanza, che cosa fa sentire importanti, disaccordi, pressione, quotidiano, domanda riservata sulla sicurezza). Alla fine ognuno sceglie, per ciascuna delle 5 aree, se usarla solo nelle istruzioni per l'altro (I, predefinito), anche nella scheda di coppia (S) o per niente (N); può scrivere un messaggio per l'altro (≤ 280 caratteri) e un «grazie» (≤ 200).
3. **Busta cifrata**: il browser cifra le risposte con la chiave pubblica di Francesco (`assets/chiave.js`) e prepara un messaggio WhatsApp o email per Francesco. Formato: `NOI1.<id chiave>.<base64url(flag | chiave effimera 65 byte | iv 12 | testo cifrato)>`. Tecnica: ECDH P-256 con chiave effimera, HKDF-SHA256 (salt = chiave effimera, info `NOI1`), AES-256-GCM, contenuto compresso (deflate-raw) se il browser lo permette.
4. **Studio** (`/noi/studio/`, solo Francesco): carica la chiave privata, incolla i messaggi, apre le buste, raggruppa per coppia e mostra risposte, restituzione (temi del percorso suggeriti) e documenti. I documenti si sbloccano solo dopo le due chiamate individuali e, se c'è un segnale sulla sicurezza, solo dopo una valutazione esplicita.
5. **Documenti** (PDF A5, generati nel browser con pdfmake e i font locali di Uno di Uno):
   - «[Nome]. Istruzioni per stare bene insieme» per ciascuno, scritte a partire da quello che l'altra persona ha scelto di far arrivare (aree I e S);
   - «A e B. Istruzioni per noi», la scheda di coppia, solo con le aree S di ciascuno, i «grazie», gli accordi, le domande per una sera a settimana, la riparazione in cinque passi e la traccia del percorso.

## Allineamento al manuale per i colloqui di coppia

I materiali seguono il «Manuale operativo per i colloqui di coppia» (parte 6, percorso NOI in otto moduli):

- linguaggio: «colloqui di coppia», «sostegno», «percorso psicoeducativo»; mai «terapia di coppia», «curare», «guarire»; nessun riferimento a «Metodo Gottman», EFT o programmi protetti, solo «si ispira a ricerche pubblicate»;
- scheda: avvio morbido («Mi sento… quando… e avrei bisogno di…»), piano di pausa di almeno 20 minuti con ritorno, riunione di coppia settimanale, conversazione che scarica lo stress (20 minuti), saluto vero, riparazione in cinque passi, domande sul presente («curiosità, non correzione»), traccia degli otto temi;
- studio: temi suggeriti per la restituzione (moduli 1-8 più facoltativi), screening individuale con entrambi prima dei documenti, blocco in caso di paura, controllo o violenza, messaggio neutro identico per entrambi per fissare le chiamate;
- consenso: entrambi maggiorenni e liberi di partecipare, nessun esito garantito, ognuno può fermarsi; quello che uno dice solo a Francesco resta riservato, salvo rischi gravi per la vita o l'incolumità.

La scelta di mandare a ciascuno istruzioni separate è voluta (richiesta di Francesco) e resta coerente con la politica dei «segreti limitati»: le istruzioni contengono solo ciò che l'altra persona ha scelto di condividere, trasformato in indicazioni, mai le risposte.

## La chiave privata

- File `NOI-chiave-privata-<id>.json`, custodito da Francesco **fuori dal repository e fuori dal sito** (`.gitignore` esclude `*chiave-privata*`). Chi ha il file può leggere le risposte di tutte le coppie.
- Nello studio, il file si carica una volta: il browser lo importa come chiave non esportabile e la tiene in IndexedDB. Il file va comunque conservato in un posto sicuro (copia di backup cifrata): se si perde, le buste già ricevute non si aprono più.
- Per cambiare chiave: studio → «Genera una nuova coppia di chiavi». Scarica il nuovo file privato e mostra la riga da mettere in `noi/assets/chiave.js`. Le buste cifrate con la chiave vecchia si aprono solo con la vecchia.

## Libreria dei testi (cifrata)

I testi sono in `_sorgenti/contenuti/*.md` (cartella esclusa da git, mai committarla). Nel repo ci sono solo `noi/assets/content.js` e `noi/_sorgenti/contenuti.enc`, cifrati con la password dell'area (PBKDF2-SHA256, 310.000 iterazioni → AES-256-GCM, come Uno di Uno).

```
NOI_PASSWORD='...' node scripts/build-noi.mjs --apri        # decifra in _sorgenti/contenuti/
# modifica i file .md
NOI_PASSWORD='...' node scripts/build-noi.mjs               # valida e ricifra content.js e contenuti.enc
node scripts/build-noi.mjs --check                          # controllo senza password (lo fa anche il CI)
NOI_PASSWORD='...' node scripts/build-noi.mjs --chiaro F    # solo test: libreria in chiaro nel file F, fuori da noi/
```

Per cambiare password: `NOI_PASSWORD='nuova' node scripts/build-noi.mjs --imposta-password`, dopo aver aperto i testi con la vecchia; poi ricifra.

### Sintassi dei moduli

```
=== modulo: id ===
titolo: …
---
testo (markdown minimo: **grassetto**, *corsivo*, paragrafi)
@@ sezione | argomenti
```

- Variabili: `{{X}}` chi legge, `{{Y}}` la persona descritta, `{{P}}`/`{{Q}}` nelle combinazioni di coppia, `{{A}}`/`{{B}}` nella scheda, `{{lui}}`/`{{lo}}`/`{{gli}}` pronomi di Y (in forma neutra diventano il nome, «lo/la», «gli/le»), `{{autore}}`.
- Concordanze: `[[m|f|n]]` per Y, `[[tu:m|f|n]]` per chi legge, `[[p:…]]` e `[[q:…]]` nelle combinazioni.
- Sezioni: `inbreve` (3 righe), `gesti`, `domande`, `aiuta`, `evita` (liste); `citazione`, `breve`, `scheda`, `riparare`, `fonte` (testi); `pratica | frequenza | titolo`; `problema | titolo`; `curiosita | titolo` con riga `Fonte:` obbligatoria; `tu | lettera`, `reazione | lettera`, `accordo | chiave`.
- Il build controlla moduli e sezioni obbligatorie, variabili e concordanze sconosciute, residui di bozza, anno in ogni fonte.
- Curiosità solo da ricerche pubblicate e verificabili, mai numeri inventati.

### Regole di scelta

In `assets/engine.js` (`score`) e `assets/book.js`: vicinanza dalle medie conferme/spazio (soglia 3,25), stile nei disaccordi dalla differenza inseguire-ritirarsi (±0,75), segnali specifici (inondazione, avvio duro, primo passo), scelte dirette per gesti, ferite, dopo un litigio, tema, pressione. Se cambiano domande o punteggi: nuova `VERSION`.

## Rischi residui, detti chiaramente

- La password dell'area è una tenda: il codice delle pagine è pubblico nel repository. Sono protetti davvero i testi (cifrati) e le risposte (cifrate con la chiave di Francesco).
- Le risposte non ancora inviate restano nel browser di chi compila; il messaggio inviato resta nella chat. Il questionario invita a cancellare entrambi.
- L'informativa privacy in `/noi/metodo/#privacy` è una **bozza**: va validata (conservazione 12 mesi, consenso esplicito per dati delicati) prima di aprire il percorso. Valutare anche un parere dell'Ordine sull'uso di materiali scritti separati per i due partner.
- Prezzi: non indicati finché non c'è la P.IVA; il costo si comunica nella call conoscitiva.
