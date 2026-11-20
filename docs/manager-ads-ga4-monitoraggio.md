# Monitoraggio Meta Ads + GA4: pagina Psicologo per manager

## Configurazione già presente sul sito
- ID GA4: `G-ZEHNGYS0Z9` in `assets/site.js`.
- Il tag GA4 si carica **solo dopo consenso alle statistiche** (chiave browser `uyl_cookie_consent`). Rifiutando i cookie non vengono inviate visite GA4.
- Solo nella pagina manager viene passato a GA4 il percorso della pagina **senza query string**, con referrer ridotto all'origine e UTM di campagna in elenco consentito, non email/telefono/nome e non parametri arbitrari. Nessun evento di invio del modulo viene generato nel codice del sito.
- GA4 non viene caricato sulla pagina manager nelle anteprime `.vercel.app`, per evitare di contare i test.
- Il Pixel Meta sul sito è limitato alla homepage da `data-meta-pixel`, è assente sulla landing manager. Gli eventi di form non vengono inviati a Meta.
- Lo stesso codice globale rimane in uso nelle altre pagine; il blocco specifico per la landing manager è basato sulla classe CSS `manager-landing`.
- Nota: il codice non controlla eventuali opzioni GA4 Enhanced Measurement attive **dentro Google Analytics**. Se è attivo `Interazioni con i moduli`, valutare la disattivazione in Admin → Stream dati → Misurazione avanzata, in quanto la pagina riguarda un servizio psicologico.

## Cosa si vede dove
| Canale | Report | Indicatore |
|---|---|---|
| Meta Ads Manager | Campagne, Gruppi, Inserzioni → Colonne | Impression, copertura, clic sul link, CTR, CPC, spesa |
| GA4 | Report → Coinvolgimento → Pagine e schermate | Visualizzazioni della pagina `/psicologo-per-manager/` fra gli utenti che hanno consentito |
| GA4 | Report → Acquisizione → Acquisizione traffico | Sessioni con sorgente/mezzo `meta / paid_social`, campagna e contenuto UTM |
| Gmail professionale | Email con oggetto `Nuova richiesta di contatto dal sito` | Richieste di ricontatto effettive, da verificare manualmente |

**Non confondere clic Meta con sessioni GA4:** il primo misura un clic pubblicitario, il secondo una visita raccolta con consenso. Differenze sono attese per rifiuto cookie, caricamento incompleto, blocchi browser e definizioni differenti.

## Per la prossima campagna Meta che manda al sito
La campagna corrente Click-to-WhatsApp **non apre automaticamente la pagina**. Occorre una nuova campagna o un gruppo con destinazione Sito web.

Al livello **Inserzione** impostare:
- URL sito web: `https://www.updateyourlife.it/psicologo-per-manager/`
- CTA: `Scopri di più`
- Parametri URL (sezione Monitoraggio / Parametri URL):

```text
utm_source=meta&utm_medium=paid_social&utm_campaign=manager_nov2026_sito&utm_content={{ad.id}}&utm_id={{campaign.id}}
```

In alternativa, per il solo collaudo manuale senza macros:
`https://www.updateyourlife.it/psicologo-per-manager/?utm_source=meta&utm_medium=paid_social&utm_campaign=manager_nov2026_sito&utm_content=statica`

Nelle campagne future si può aggiornare il nome campagna UTM, mantenendo una nomenclatura senza dati personali. In GA4 questi campi saranno gestiti separatamente dall'URL completo sulla landing manager. `{{ad.id}}` e `{{campaign.id}}` sono segnaposto di Ads Manager e non devono essere sostituiti a mano.

## Verifica dopo la pubblicazione definitiva
1. In browser con dati sito cancellati, visita la pagina: **prima del consenso** non deve caricarsi alcuna richiesta verso `google-analytics.com`, `googletagmanager.com/gtag/js` né `connect.facebook.net`.
2. Accetta statistiche e ricarica la pagina manager di produzione; in DevTools → Network verificare che GA4 si carichi con `G-ZEHNGYS0Z9` e non Meta Pixel.
3. Apri GA4 → Report → In tempo reale. Verifica il nuovo visitatore e la pagina manager con la stessa proprietà. I dati di report standard possono essere ritardati.
4. Visita il link UTM di test e, dopo consenso, verifica in **Acquisizione traffico** `meta / paid_social` e la campagna `manager_nov2026_sito`. Non dedurre l'efficacia da una singola sessione di test.
5. Verifica separatamente i form compilati su Gmail. Evita di creare un evento GA4 `generate_lead` e non inviare i dati personali a Meta.

## Eventuale importazione di dati Meta in GA4 (opzionale)
Google Analytics consente di importare i dati **aggregati** Meta Ads (costi, clic, impression) tramite Amministrazione → Importazione dati → Origine Meta. Serve collegare l'account pubblicitario Meta con privilegi adeguati, scegliere sorgente `meta` e mezzo `paid_social` identici alle UTM. È un'integrazione di report, NON un pixel sul sito né una conversione personale da inviare a Meta. Va configurata manualmente dal titolare dell'account GA4.
