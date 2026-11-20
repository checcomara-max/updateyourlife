# Attivazione del modulo Psicologo per manager

È previsto un Google Apps Script SEPARATO dagli altri moduli del sito. Non riutilizzare né modificare lo script per i PDF Prima di dimenticare e Il tuo posto.

1. Accedi a https://script.google.com/ con francescomaragliulo@gmail.com.
2. Crea un nuovo progetto chiamato Update Your Life - richieste manager.
3. Copia il contenuto di scripts/manager-leads.gs nel file Code.gs e salva.
4. Vai su Esegui deployment > Nuovo deployment > Applicazione web.
5. Scegli Esegui come: Me; Accesso: Chiunque. Autorizza lo script ad inviare email.
6. L'URL /exec del deployment è stato fornito dal titolare e collegato nella costante ENDPOINT in assets/manager-form.js.
7. Non condividere il link /dev: per il sito serve soltanto /exec. Dopo ogni modifica significativa del backend, aggiorna il deployment di Apps Script se necessario. Il codice client usa /api/manager-leads su Vercel, che inoltra la richiesta all'URL /exec e ne verifica la risposta.
8. Invia un test dal modulo con dati di test di tua proprietà. Verifica che compaia il successo SOLO dopo la risposta, che l'email arrivi a Gmail, e che in caso di fallimento sia visibile solo l'alternativa WhatsApp.
9. Completa la verifica privacy professionale, quindi pubblica/mergia questa branch.

## Note importanti
- Nessun dato clinico richiesto nel form. I dati di contatto possono comunque essere indirettamente sensibili se associati a uno psicologo.
- Nessuna trasmissione dei dati a Meta Pixel. Non salvare questi dati in Analytics o parametri URL.
- Il progetto pubblicato ha accesso pubblico: honeypot e cache riducono solo parte dello spam, non sostituiscono una protezione antiabuso robusta.
- Controlla le quote giornaliere di MailApp. Non conservare le richieste più del periodo indicato nell'informativa.
- La pagina usa temporaneamente una foto professionale già presente nel repository. Le cinque foto allegate in chat non sono state caricate su GitHub tramite questa integrazione; prima di usare scene di colloquio simulate, chiarirne il carattere illustrativo.
- La privacy policy nella PR contiene la nuova sezione dedicata: verificare ruoli e garanzie dei fornitori, base giuridica e durata della conservazione con un consulente privacy.
## Aggiornamento 20/11/2026
- Unica checkbox obbligatoria, che incorpora lettura dell'informativa e consenso esplicito al trattamento dei dati indirettamente riconducibili alla richiesta di contatto a uno psicologo.
- Il frontend mantiene i due flag booleani (`contactRequested` e `sensitiveConsent`) previsti dal backend distribuito inizialmente, ricavati da questa unica richiesta esplicita non preselezionata. Non serve ridistribuire lo script per questo cambiamento.
- Eliminati i due testi ridondanti richiesti dall'utente.
- Meta Pixel NON attivato sulla pagina manager; niente eventi Lead o PageView inviati a Meta dalla landing.

## Connessione Vercel (a partire da questa PR)
- `api/manager-leads.js` riceve le richieste pubbliche, le valida e inoltra il payload a Google Apps Script dal server Vercel.
- La funzione restituisce `{ success: true }` soltanto dopo una risposta positiva dal backend Google. In caso di errore il frontend mostra il fallback WhatsApp, senza proclamare una richiesta ricevuta.
- Sulle anteprime Vercel la chiamata è same-origin a `/api/manager-leads`. Sul sito con dominio personalizzato GitHub Pages il client chiama `https://project-30hc5.vercel.app/api/manager-leads` con CORS limitato alle origini autorizzate.
- Le richieste transitano quindi anche attraverso l'hosting Vercel; la sezione dedicata della privacy policy ne dà conto. Verificare gli accordi di trattamento e l'idoneità per dati potenzialmente sensibili.
- **NON PUBBLICARE la PR senza un invio end-to-end di prova dal browser, conferma su pagina e email ricevuta.**
