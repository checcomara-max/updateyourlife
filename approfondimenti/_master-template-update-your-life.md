# Master template — Update Your Life

Questo file è il riferimento master per creare nuove pagine di approfondimento mantenendo la stessa struttura visiva, tono editoriale e componenti UI del progetto `finestra-johari.html`.

## Obiettivo

Usare sempre questa struttura per nuove pagine in `/approfondimenti/`, cambiando solo contenuti, metadata SEO e sezioni specifiche del tema trattato.

## Struttura obbligatoria della pagina

1. **Head SEO completo**
- `<title>` nel formato: `Titolo pagina — Francesco Maragliulo | Update Your Life`
- Meta description originale, sintetica e coerente col tema
- Keywords rilevanti
- Canonical assoluta
- Open Graph completo
- Twitter card completa
- JSON-LD `Article`

2. **Script analytics con consenso cookie**
- Mantieni lo script GA già presente
- Non modificare ID: `G-ZEHNGYS0Z9`
- Caricamento solo con consenso `uyl_cookie_consent === 'all'`

3. **Font**
- Sempre:
  - `Cormorant Garamond` per titoli/quote/logo
  - `DM Sans` per corpo/UI

4. **Palette e stile**
- Usa sempre queste variabili CSS:
  - `--bg: oklch(97.5% 0.008 80)`
  - `--bg-alt: oklch(94% 0.012 80)`
  - `--bg-dark: oklch(26% 0.06 155)`
  - `--text: oklch(20% 0.02 80)`
  - `--text-muted: oklch(50% 0.015 80)`
  - `--accent: oklch(52% 0.14 145)`
  - `--accent-warm: oklch(62% 0.12 50)`
  - `--border: oklch(88% 0.012 80)`

5. **Header sticky fisso**
- `nav.site-nav` sempre presente
- A sinistra:
  - logo cliccabile `Update Your Life`
  - sottotitolo `Francesco Maragliulo`
  - chip cliccabile `updateyourlife.it`
- A destra:
  - CTA WhatsApp

6. **Hero editoriale**
- Tag piccolo uppercase sopra il titolo
- Titolo serif grande e arioso
- Intro breve centrale
- Divider sotto hero

7. **Body contenuto**
Ordine consigliato:
- breadcrumb
- sezione problema/domanda iniziale
- pull quote
- sezione teorica/spiegazione
- eventuale griglia/schema/box visuale
- sezione dinamica o interpretativa
- sezione pratica (`3 passi`, `cosa puoi fare`, ecc.)
- bibliografia finale su fondo scuro

8. **CTA finale**
- fondo `--bg-alt`
- titolo serif
- bottone primario WhatsApp
- bottone secondario ritorno home

9. **Footer**
Sempre identico:
- brand `Update Your Life © 2026`
- sottotitolo `Francesco Maragliulo · Psicologo · Coach · Counselor`
- link: Privacy Policy, Cookie Policy, Note Legali
- nessun banner legale in alto

10. **Animazioni**
- Usa sempre `.reveal` con `IntersectionObserver`
- Transizione sobria, solo fade + translateY

## Regole di tono e contenuto

- Tono: elegante, chiaro, autorevole, non accademico
- Mai usare claim che implicano che Francesco sia psicoterapeuta
- Se si parla di percorsi professionali, usare formulazioni come:
  - `un percorso con uno psicologo o con un coach`
  - `un confronto professionale`
  - `uno spazio di esplorazione guidata`
- Evitare formulazioni cliniche troppo forti se non necessarie
- Linguaggio psicoeducativo, accessibile e raffinato

## Regole UI da mantenere

- Nessun banner legale in alto
- Footer sempre e solo in basso
- Spaziatura ariosa
- Max width contenuto: `780px`
- Hover molto sobri
- Border radius piccolo (`4px` circa)
- Nessun effetto vistoso o troppo commerciale

## Prompt operativo per creare una nuova pagina

Quando crei una nuova pagina, usa questa istruzione:

> Crea una nuova pagina HTML per `Update Your Life` usando come base il master template in `approfondimenti/_master-template-update-your-life.md` e come riferimento strutturale `approfondimenti/finestra-johari.html`. Mantieni identici header sticky, footer, palette, font, CTA finale, stile editoriale, animazioni reveal e impianto SEO. Cambia solo contenuti, metadata, titolo, hero, sezioni centrali e bibliografia in funzione del nuovo argomento. Evita qualsiasi riferimento a psicoterapia se attribuito a Francesco Maragliulo; usa piuttosto `psicologo`, `coach`, `counselor` o formule neutrali coerenti.

## File sorgente di riferimento

- Template visivo principale: `approfondimenti/finestra-johari.html`
- Questo documento: `approfondimenti/_master-template-update-your-life.md`

## Nota di manutenzione

Se in futuro modifichi header, footer, CTA, palette o stile base, aggiorna prima `finestra-johari.html` e poi allinea questo master file.