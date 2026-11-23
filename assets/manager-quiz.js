(function () {
  'use strict';

  var panels = Array.prototype.slice.call(document.querySelectorAll('.quiz-panel'));
  var results = document.getElementById('quiz-results');
  var cards = document.getElementById('quiz-result-cards');
  var contact = document.getElementById('inizia');
  var progressLabel = document.getElementById('quiz-progress-label');
  var progressPct = document.getElementById('quiz-progress-pct');
  var progressBar = document.getElementById('quiz-progress-bar');
  var restart = document.getElementById('quiz-restart');
  var answers = [null, null, null];
  var current = 0;
  var started = false;
  var completed = false;

  var reflections = {
    '1A': {
      scenario: '1 · Risultati vs relazione',
      title: 'Hai scelto di partire dal risultato.',
      choice: '“Parto dalle scadenze mancate e chiarisco cosa deve cambiare.”',
      body: 'Portare subito il problema sul tavolo può dare chiarezza: rende esplicito cosa non sta funzionando e delimita la responsabilità. Ma con una persona precedentemente affidabile, il cambiamento di comportamento è esso stesso un’informazione. Affrontare rapidamente una performance insoddisfacente non significa necessariamente comprenderne rapidamente la causa.',
      prompt: 'Prima di decidere come correggere ciò che sta accadendo, ho già abbastanza elementi per capire cosa sto cercando di correggere?'
    },
    '1B': {
      scenario: '1 · Risultati vs relazione',
      title: 'Hai scelto di partire dalla comprensione.',
      choice: '“Prima provo a capire cosa è successo nelle ultime settimane.”',
      body: 'Creare spazio per capire può far emergere informazioni che i numeri non mostrano. Ma ascoltare non significa sospendere il tema della responsabilità. Soprattutto quando esiste una relazione positiva, comprendere le ragioni può diventare inconsapevolmente un modo per rimandare il momento in cui occorre parlare anche delle conseguenze.',
      prompt: 'Sto ascoltando per comprendere meglio il problema oppure anche per rimandare una conversazione difficile?'
    },
    '1C': {
      scenario: '1 · Risultati vs relazione',
      title: 'Hai scelto di chiarire prima il mandato.',
      choice: '“Prima mi allineo con il mio responsabile su ciò che si aspetta da me.”',
      body: 'Sapere qual è il margine di azione può evitare promesse o decisioni che non puoi sostenere. Ma quando la pressione arriva dall’alto è facile trasformare la conversazione con il collaboratore nell’esecuzione di una richiesta ricevuta. Qui entra in gioco anche quanto spazio decisionale senti realmente tuo nel ruolo.',
      prompt: 'Cosa mi sta chiedendo il mio capo e quale conversazione ritengo utile avere io, come responsabile di questa persona?'
    },
    '2A': {
      scenario: '2 · Priorità vs confine',
      title: 'Hai scelto di assorbire l’urgenza.',
      choice: '“La faccio. In questo momento è la priorità.”',
      body: 'In certi ruoli è inevitabile essere disponibili quando la situazione lo richiede. La parte interessante è quel “non è la prima volta”. Una disponibilità eccezionale e una disponibilità sistematica possono sembrare uguali dall’esterno, ma producono effetti diversi. Se ogni urgenza viene assorbita senza rendere visibile il costo organizzativo, l’organizzazione può imparare che quel costo non esiste.',
      prompt: 'Che cosa sto rendendo normale ogni volta che dico sì?'
    },
    '2B': {
      scenario: '2 · Priorità vs confine',
      title: 'Hai scelto di rendere visibile il trade-off.',
      choice: '“Spiego cosa dovrei spostare e chiedo al mio responsabile di scegliere la priorità.”',
      body: 'Non stai dicendo semplicemente sì o no: stai riportando nella conversazione una cosa spesso invisibile, cioè che ogni nuova priorità modifica quelle precedenti. È un modo di gestire il confine senza trasformarlo in una contrapposizione personale. Richiede però di tollerare che il limite che rendi visibile possa non essere apprezzato.',
      prompt: 'Posso dire “lo faccio” e, nello stesso momento, rendere chiaro cosa dovremo lasciare indietro?'
    },
    '2C': {
      scenario: '2 · Priorità vs confine',
      title: 'Hai scelto di gestire autonomamente la complessità.',
      choice: '“Cerco di riorganizzarmi senza coinvolgere il mio responsabile.”',
      body: 'Filtrare problemi e trovare soluzioni senza riportare verso l’alto ogni difficoltà è una capacità preziosa. Ma chi diventa molto bravo a far funzionare comunque le cose può finire per nascondere proprio le condizioni organizzative che rendono il lavoro difficile. Agli occhi degli altri, il sistema continua semplicemente a funzionare.',
      prompt: 'Sto risolvendo un problema oppure sto facendo in modo che il problema non si veda?'
    },
    '3A': {
      scenario: '3 · Ruolo vs posizione personale',
      title: 'Hai scelto di proteggere la coerenza del ruolo.',
      choice: '“Difendo la decisione. Una volta presa, il mio ruolo è rappresentarla.”',
      body: 'Un gruppo dirigente che prende una decisione e poi la delegittima davanti alle proprie persone difficilmente costruisce fiducia. Ma rappresentare una decisione non significa necessariamente fingere di averla desiderata. Quando il tentativo di apparire completamente allineati diventa eccessivo, le persone possono percepire la distanza tra ciò che viene detto e ciò che realmente pensiamo.',
      prompt: 'Posso assumermi la responsabilità di una decisione senza dover sostenere che è esattamente quella che avrei preso io?'
    },
    '3B': {
      scenario: '3 · Ruolo vs posizione personale',
      title: 'Hai scelto di mostrare anche la tua posizione personale.',
      choice: '“Dico al team che anch’io avevo delle perplessità, ma che la decisione è stata presa.”',
      body: 'Può rendere la comunicazione più autentica e riconoscere che le obiezioni del team hanno una loro legittimità. Ma esiste un confine sottile: condividere un dubbio può creare vicinanza; usare il dubbio per comunicare implicitamente “io sono con voi, sono gli altri ad aver deciso” può invece spostare il costo della decisione e indebolire il ruolo.',
      prompt: 'Sto raccontando il mio dissenso per aiutare il team a comprendere la complessità oppure per prendere distanza da una decisione scomoda?'
    },
    '3C': {
      scenario: '3 · Ruolo vs posizione personale',
      title: 'Hai scelto di separare la decisione dal processo che l’ha preceduta.',
      choice: '“Comunico la decisione senza entrare né nel mio punto di vista né nella discussione precedente.”',
      body: 'Non tutte le discussioni del management devono essere trasferite al team. Ma eliminare completamente il processo può avere un costo: quando una decisione difficile viene presentata come se fosse ovvia, chi la riceve può sentirsi non soltanto in disaccordo, ma anche non riconosciuto nella legittimità delle proprie reazioni.',
      prompt: 'Posso riconoscere che una decisione è difficile da accogliere senza delegittimarla e senza raccontare tutto ciò che è avvenuto prima?'
    }
  };

  function analyticsEvent(name) {
    try {
      if (localStorage.getItem('uyl_cookie_consent') === 'all' && window.gtag) {
        window.gtag('event', name, { content_group: 'manager_quiz' });
      }
    } catch (_) {}
  }

  function showQuestion(index) {
    current = index;
    panels.forEach(function (panel, i) {
      panel.hidden = i !== index;
      panel.classList.toggle('is-active', i === index);
    });
    results.hidden = true;
    var pct = Math.round(((index + 1) / 3) * 100);
    progressLabel.textContent = 'Situazione ' + (index + 1) + ' di 3';
    progressPct.textContent = pct + '%';
    progressBar.style.width = pct + '%';
    var panel = panels[index];
    var selected = answers[index];
    panel.querySelectorAll('.quiz-option').forEach(function (button) {
      var on = button.getAttribute('data-answer') === selected;
      button.classList.toggle('is-selected', on);
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      button.disabled = false;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderResults() {
    completed = true;
    panels.forEach(function (panel) { panel.hidden = true; });
    progressLabel.textContent = 'Percorso completato';
    progressPct.textContent = '100%';
    progressBar.style.width = '100%';
    cards.textContent = '';

    answers.forEach(function (code, index) {
      var item = reflections[code];
      var card = document.createElement('article');
      card.className = 'quiz-result-card';

      var number = document.createElement('p');
      number.className = 'result-number';
      number.textContent = item.scenario;

      var title = document.createElement('h3');
      title.textContent = item.title;

      var choice = document.createElement('p');
      choice.className = 'result-choice';
      choice.textContent = 'La tua scelta: ' + item.choice;

      var body = document.createElement('p');
      body.className = 'result-body';
      body.textContent = item.body;

      var prompt = document.createElement('p');
      prompt.className = 'result-prompt';
      prompt.textContent = item.prompt;

      card.appendChild(number);
      card.appendChild(title);
      card.appendChild(choice);
      card.appendChild(body);
      card.appendChild(prompt);
      cards.appendChild(card);
    });

    results.hidden = false;
    contact.hidden = false;
    var sticky = document.getElementById('quiz-result-sticky');
    if (sticky) sticky.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    analyticsEvent('manager_quiz_complete');
  }

  panels.forEach(function (panel, index) {
    panel.querySelectorAll('.quiz-option').forEach(function (button) {
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', function () {
        if (!started) {
          started = true;
          analyticsEvent('manager_quiz_start');
        }

        answers[index] = button.getAttribute('data-answer');
        panel.querySelectorAll('.quiz-option').forEach(function (other) {
          var selected = other === button;
          other.classList.toggle('is-selected', selected);
          other.setAttribute('aria-pressed', selected ? 'true' : 'false');
          other.disabled = true;
        });

        analyticsEvent('manager_quiz_step_' + (index + 1) + '_complete');

        window.setTimeout(function () {
          if (index < 2) showQuestion(index + 1);
          else renderResults();
        }, 180);
      });
    });

    var back = panel.querySelector('.quiz-back');
    if (back) back.addEventListener('click', function () { showQuestion(index - 1); });
  });

  restart.addEventListener('click', function () {
    answers = [null, null, null];
    completed = false;
    contact.hidden = true;
    var sticky = document.getElementById('quiz-result-sticky');
    if (sticky) sticky.hidden = true;
    showQuestion(0);
  });

  var sticky = document.getElementById('quiz-result-sticky');
  if (sticky && contact && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      if (!completed) return;
      sticky.hidden = entries[0].isIntersecting;
    }, { threshold: 0.08 }).observe(contact);
  }

  var success = document.getElementById('manager-form-success');
  if (success && 'MutationObserver' in window) {
    var leadTracked = false;
    new MutationObserver(function () {
      if (!success.hidden && !leadTracked) {
        leadTracked = true;
        analyticsEvent('manager_quiz_lead_sent');
      }
    }).observe(success, { attributes: true, attributeFilter: ['hidden'] });
  }
})();
