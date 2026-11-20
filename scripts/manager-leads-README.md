# Attivazione del modulo Psicologo per manager

È previsto un Google Apps Script SEPARATO dagli altri moduli del sito. Non riutilizzare né modificare lo script per i PDF Prima di dimenticare e Il tuo posto.

1. Accedi a https://script.google.com/ con francescomaragliulo@gmail.com.
2. Crea un nuovo progetto chiamato Update Your Life - richieste manager.
3. Copia il contenuto di scripts/manager-leads.gs nel file Code.gs e salva.
4. Vai su Esegui deployment > Nuovo deployment > Applicazione web.
5. Scegli Esegui come: Me; Accesso: Chiunque. Autorizza lo script ad inviare email.
6. Copia l'URL pubblico /exec (non /dev).
7. Inseriscilo nella costante ENDPOINT in assets/manager-form.js.
8. Invia un test dal modulo con dati di test di tua proprietà. Verifica che compaia il successo SOLO dopo la risposta, che l'email arrivi a Gmail, e che in caso di fallimento sia visibile solo l'alternativa WhatsApp.
9. Completa la verifica privacy professionale, quindi pubblica/mergia questa branch.

## Note importanti
- Nessun dato clinico richiesto nel form. I dati di contatto possono comunque essere indirettamente sensibili se associati a uno psicologo.
- Nessuna trasmissione dei dati a Meta Pixel. Non salvare questi dati in Analytics o parametri URL.
- Il progetto pubblicato ha accesso pubblico: honeypot e cache riducono solo parte dello spam, non sostituiscono una protezione antiabuso robusta.
- Controlla le quote giornaliere di MailApp. Non conservare le richieste più del periodo indicato nell'informativa.
- La pagina usa temporaneamente una foto professionale già presente nel repository. Le cinque foto allegate in chat non sono state caricate su GitHub tramite questa integrazione; prima di usare scene di colloquio simulate, chiarirne il carattere illustrativo.
- La privacy policy nella PR contiene la nuova sezione dedicata: verificare ruoli e garanzie dei fornitori, base giuridica e durata della conservazione con un consulente privacy.