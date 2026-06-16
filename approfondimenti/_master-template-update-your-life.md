# Master template — Update Your Life

Questo file è il riferimento master per creare nuove pagine di approfondimento mantenendo la stessa struttura visiva, tono editoriale, componenti UI e standard SEO/GEO del progetto.

> **File di riferimento visivo:** `approfondimenti/finestra-johari.html`

---

## Obiettivo

Usare sempre questa struttura per nuove pagine in `/approfondimenti/`, cambiando solo contenuti, metadata SEO e sezioni specifiche del tema trattato.

---

## 1. Head SEO — Struttura obbligatoria

### Tag essenziali
- `<title>` nel formato: `Titolo pagina — Francesco Maragliulo | Update Your Life` (max 65 caratteri)
- `<meta name="description">` originale, sintetica, con keyword naturali (max 155 caratteri)
- **Non usare** `<meta name="keywords">` — Google la ignora
- `<link rel="canonical">` con URL assoluto della pagina
- `<meta name="author" content="Francesco Maragliulo">`
- `<meta name="robots" content="index, follow">`

### Open Graph + Twitter Card
- Completo con `og:type`, `og:url`, `og:title`, `og:description`, `og:image`, `og:locale`, `og:site_name`
- Twitter card `summary_large_image`
- **Nota:** idealmente creare una social card dedicata 1200×630px per ogni articolo anziché usare `foto-profilo.png`

### JSON-LD — Schema multipli obbligatori

Ogni pagina deve includere **4 blocchi schema** in un array JSON-LD:

**1. Article**
```json
{
  "@type": "Article",
  "headline": "...",
  "description": "...",
  "datePublished": "YYYY-MM-DD",
  "dateModified": "YYYY-MM-DD",
  "image": "https://www.updateyourlife.it/foto-profilo.png",
  "author": { "@type": "Person", "name": "Francesco Maragliulo", "url": "https://www.updateyourlife.it" },
  "publisher": { "@type": "Organization", "name": "Update Your Life", "url": "https://www.updateyourlife.it" },
  "mainEntityOfPage": "https://www.updateyourlife.it/approfondimenti/[slug].html"
}
```

**2. Person** (uguale in tutte le pagine)
```json
{
  "@type": "Person",
  "name": "Francesco Maragliulo",
  "url": "https://www.updateyourlife.it",
  "jobTitle": ["Psicologo", "Coach", "Counselor"],
  "knowsAbout": ["Psicologia", "Coaching", "Crescita personale", "Consapevolezza di sé"]
}
```

**3. FAQPage** — minimo 4 domande pertinenti al tema trattato
```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Domanda frequente 1?",
      "acceptedAnswer": { "@type": "Answer", "text": "Risposta completa e utile..." }
    }
  ]
}
```

**4. BreadcrumbList**
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.updateyourlife.it" },
    { "@type": "ListItem", "position": 2, "name": "Approfondimenti", "item": "https://www.updateyourlife.it/approfondimenti/" },
    { "@type": "ListItem", "position": 3, "name": "[Titolo articolo]", "item": "https://www.updateyourlife.it/approfondimenti/[slug].html" }
  ]
}
```

---

## 2. Script analytics

- Mantieni lo script GA già presente, **non modificare** l'ID: `G-ZEHNGYS0Z9`
- Caricamento condizionale solo con consenso `uyl_cookie_consent === 'all'`
- Il banner cookie è **solo in footer**, mai in alto

---

## 3. Font e palette

**Font (invariabili):**
- `Cormorant Garamond` — titoli, quote, logo, elementi serif
- `DM Sans` — corpo, UI, bottoni

**Variabili CSS (invariabili):**
```css
--bg: oklch(97.5% 0.008 80);
--bg-alt: oklch(94% 0.012 80);
--bg-dark: oklch(26% 0.06 155);
--text: oklch(20% 0.02 80);
--text-muted: oklch(50% 0.015 80);
--accent: oklch(52% 0.14 145);
--accent-warm: oklch(62% 0.12 50);
--border: oklch(88% 0.012 80);
```

---

## 4. Struttura della pagina — ordine fisso

### 4.1 Header sticky (`nav.site-nav`)
- A sinistra: logo `Update Your Life` + sottotitolo `Francesco Maragliulo` + chip `← updateyourlife.it`
- Separatore verticale
- A destra: CTA WhatsApp verde

### 4.2 Hero editoriale
- Tag uppercase piccolo (categoria · sottocategoria)
- `<h1>` serif grande e arioso
- Intro in `<p class="article-intro">`
- **Meta autore con data:** `<p class="article-meta">Di <strong>Francesco Maragliulo</strong> · <time datetime="YYYY-MM-DD">GG mese AAAA</time></p>`
- Divider sotto

### 4.3 Body contenuto (`max-width: 780px`)
Ordine consigliato:
1. Breadcrumb navigazionale (con **tutti i link attivi**, incluso "Approfondimenti")
2. Sezione problema/domanda iniziale
3. Pull quote letterario
4. Sezione teorica/spiegazione principale
5. Schema/griglia visuale (se presente: usare `<figure>` + `<figcaption>` descrittiva)
6. Sezione dinamica o interpretativa
7. Sezione pratica ("3 passi", "cosa puoi fare", ecc.)
8. **Sezione FAQ interattiva** (accordion — vedi regole GEO)
9. Bibliografia su fondo scuro (`--bg-dark`)

### 4.4 CTA finale
- Sfondo `--bg-alt`
- Titolo serif
- Bottone primario WhatsApp
- Bottone secondario ritorno home

### 4.5 Footer (invariabile)
```
Update Your Life © 2026
Francesco Maragliulo · Psicologo · Coach · Counselor
Privacy Policy | Cookie Policy | Note Legali
```

---

## 5. Regole GEO (Generative Engine Optimization)

La GEO ottimizza la pagina per essere **citata da AI** (ChatGPT, Perplexity, Google AI Overview).

### 5.1 FAQ section — obbligatoria
- Minimo 4 domande per pagina
- Formato accordion interattivo con `aria-expanded`
- Le domande devono riprendere le formulazioni naturali delle ricerche (`"Cos'è...", "A cosa serve...", "Chi ha..."`, ecc.)
- Il markup JSON-LD `FAQPage` deve corrispondere esattamente alle FAQ visibili

### 5.2 Struttura a domanda-risposta implicita
- Ogni `<h2>` dovrebbe rispondere a una domanda reale che qualcuno potrebbe cercare
- Le risposte devono essere **dense e auto-contenute** — una AI deve poterle estrarre come risposta completa

### 5.3 Linguaggio definitorio
- Usare frasi che definiscono concetti: *«X è un modello che...»*, *«Il termine Y indica...»*
- I modelli AI si fidano di pagine che usano linguaggio definitorio chiaro e preciso

### 5.4 Citazioni bibliografiche con fonte primaria
- Sempre con autore, anno, titolo e sede di pubblicazione
- Le AI preferiscono pagine che citano fonti accademiche verificabili

### 5.5 E-E-A-T
- Autore sempre identificato con nome, ruolo professionale e URL
- Data di pubblicazione visibile nel testo (`<time datetime="...">`) e nel JSON-LD
- `<figcaption>` su ogni schema/immagine con attribuzione a Francesco Maragliulo

---

## 6. Regole di tono e contenuto

- Tono: elegante, chiaro, autorevole, psicoeducativo — non clinico né commerciale
- **Mai usare claim che implicano che Francesco sia psicoterapeuta**
- Per percorsi professionali usare sempre:
  - `un percorso con uno psicologo o con un coach`
  - `un confronto professionale`
  - `uno spazio di esplorazione guidata`
- Evitare formulazioni cliniche forti non necessarie
- Linguaggio accessibile e raffinato

---

## 7. Regole UI

- Nessun banner legale in alto — solo footer
- Spaziatura ariosa, max-width contenuto `780px`
- Hover sobri, border-radius piccolo (`4px`)
- Nessun effetto vistoso o commerciale
- Animazioni `.reveal` con `IntersectionObserver` (fade + translateY)
- Elementi grafici complessi in `<figure>` con `<figcaption>`
- Breadcrumb con **tutti i livelli linkati**

---

## 8. Prompt operativo per creare una nuova pagina

> Crea una nuova pagina HTML per `Update Your Life` usando come base il master template `approfondimenti/_master-template-update-your-life.md` e come riferimento strutturale `approfondimenti/finestra-johari.html`. Mantieni identici: header sticky, footer, palette, font, CTA finale, stile editoriale, animazioni reveal. Includi obbligatoriamente: `<time datetime>` con data di pubblicazione, JSON-LD multiplo (Article + Person + FAQPage + BreadcrumbList), sezione FAQ interattiva con almeno 4 domande, `<figure>` + `<figcaption>` per ogni schema visuale, breadcrumb con tutti i link attivi. Aggiorna `datePublished` e `dateModified`. Evita qualsiasi riferimento a psicoterapia attribuito a Francesco Maragliulo; usa `psicologo`, `coach`, `counselor` o formule neutrali.

---

## 9. Checklist pre-pubblicazione

**SEO:**
- [ ] Title max 65 caratteri, keyword principale presente
- [ ] Meta description max 155 caratteri, nessun placeholder
- [ ] Canonical URL assoluto corretto
- [ ] `datePublished` e `dateModified` nel JSON-LD Article
- [ ] `image` property nel JSON-LD Article
- [ ] Breadcrumb con tutti i livelli linkati (anche "Approfondimenti")
- [ ] `<time datetime="YYYY-MM-DD">` visibile nella pagina
- [ ] Gerarchia heading corretta (H1 unico → H2 → H3)

**GEO:**
- [ ] JSON-LD Person presente
- [ ] JSON-LD FAQPage con min. 4 Q&A
- [ ] JSON-LD BreadcrumbList
- [ ] Sezione FAQ visibile + accordion funzionante
- [ ] `<figcaption>` su tutti gli schemi/figure
- [ ] Linguaggio definitorio nelle sezioni teoriche
- [ ] Fonti bibliografiche con autore + anno + titolo

**UI/UX:**
- [ ] Header sticky con chip home
- [ ] Meta autore + data nel hero
- [ ] CTA WhatsApp funzionante
- [ ] Footer con Privacy Policy, Cookie Policy, Note Legali
- [ ] `.reveal` su tutte le sezioni principali
- [ ] Responsive mobile (grid Johari → 1 colonna sotto 768px)

---

## 10. Nota di manutenzione

Se in futuro modifichi header, footer, CTA, palette o stile base, aggiorna prima `finestra-johari.html` e poi allinea questo master file. Le due sezioni più soggette a evoluzione sono il JSON-LD (Google aggiorna spesso le specifiche) e la FAQ (aggiungere domande migliora la copertura semantica nel tempo).
