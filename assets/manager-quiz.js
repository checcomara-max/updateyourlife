(function () {
  'use strict';

  var panels = Array.prototype.slice.call(document.querySelectorAll('.quiz-panel'));

  function setupPixelDebug() {
    var params = new URLSearchParams(location.search);
    if (params.get('debug_pixel') !== '1' || !document.body.hasAttribute('data-meta-pixel')) return;
    var box = document.createElement('div');
    box.id = 'uyl-pixel-debug';
    box.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:99999;background:#111;color:#fff;padding:10px 12px;border-radius:8px;font:12px/1.45 monospace;max-width:300px;box-shadow:0 4px 20px rgba(0,0,0,.35)';
    document.body.appendChild(box);
    function render() {
      var d = window.uylMetaDebug || {};
      var consent = '';
      try { consent = localStorage.getItem('uyl_marketing_consent') || 'none'; } catch (_) { consent = 'unavailable'; }
      box.textContent =
        'Meta Pixel debug\n' +
        'ID: ' + (d.pixelId || document.body.getAttribute('data-meta-pixel') || '-') + '\n' +
        'consent: ' + consent + '\n' +
        'fbq: ' + (typeof window.fbq === 'function' ? 'YES' : 'NO') + '\n' +
        'script loaded: ' + (d.scriptLoaded ? 'YES' : 'NO') + '\n' +
        'PageView called: ' + (d.pageViewCalled ? 'YES' : 'NO') + '\n' +
        'Lead called: ' + (d.leadCalled ? 'YES' : 'NO');
    }
    render();
    window.addEventListener('uyl-meta-debug-update', render);
    window.addEventListener('storage', render);
    setInterval(render, 1000);
  }
  setupPixelDebug();
  var results = document.getElementById('quiz-results');
  var cards = document.getElementById('quiz-result-cards');
  var contact = document.getElementById('inizia');
  var progressLabel = document.getElementById('quiz-progress-label');
  var progressPct = document.getElementById('quiz-progress-pct');
  var progressBar = document.getElementById('quiz-progress-bar');
  var restart = document.getElementById('quiz-restart');
  var answers = [null, null, null];
  var current = 0;
  var order = new URLSearchParams(location.search).get('utm_content') === 'static_a' ? [1, 0, 2] : [0, 1, 2];
  var tracked = Object.create(null);
  var intro = document.getElementById('quiz-intro');
  var started = false;
  var completed = false;

  var reflections = {
    '1A': {
      scenario: '1 · Risultati vs relazione',
      title: 'Hai scelto di partire dal risultato.',
      choice: '“Parto dalle scadenze mancate e chiarisco cosa deve cambiare.”',
      body: 'Partire dal risultato può chiarire aspettative e responsabilità. Il possibile costo è intervenire prima di aver compreso cosa è cambiato in una persona finora affidabile.',
      prompt: 'Prima di decidere come correggere ciò che sta accadendo, ho già abbastanza elementi per capire cosa sto cercando di correggere?'
    },
    '1B': {
      scenario: '1 · Risultati vs relazione',
      title: 'Hai scelto di partire dalla comprensione.',
      choice: '“Prima provo a capire cosa è successo nelle ultime settimane.”',
      body: 'Ascoltare può far emergere informazioni che i numeri non mostrano. Il possibile costo è rimandare il confronto sulle responsabilità e sulle conseguenze.',
      prompt: 'Sto ascoltando per comprendere meglio il problema oppure anche per rimandare una conversazione difficile?'
    },
    '1C': {
      scenario: '1 · Risultati vs relazione',
      title: 'Hai scelto di chiarire prima il mandato.',
      choice: '“Prima mi allineo con il mio responsabile su ciò che si aspetta da me.”',
      body: 'Chiarire il mandato aiuta a capire quale margine di azione hai. Il possibile costo è trasformare il confronto con il collaboratore nella semplice esecuzione di una richiesta ricevuta.',
      prompt: 'Cosa mi sta chiedendo il mio capo e quale conversazione ritengo utile avere io, come responsabile di questa persona?'
    },
    '2A': {
      scenario: '2 · Priorità vs confine',
      title: 'Hai scelto di assorbire l’urgenza.',
      choice: '“La faccio. In questo momento è la priorità.”',
      body: 'Essere disponibili può proteggere il risultato immediato. Se accade sistematicamente, il costo organizzativo dell’urgenza rischia di diventare invisibile.',
      prompt: 'Che cosa sto rendendo normale ogni volta che dico sì?'
    },
    '2B': {
      scenario: '2 · Priorità vs confine',
      title: 'Hai scelto di rendere visibile il trade-off.',
      choice: '“Spiego cosa dovrei spostare e chiedo al mio responsabile di scegliere la priorità.”',
      body: 'Rendere esplicite le priorità può proteggere il confine senza creare una contrapposizione personale. Il possibile costo è dover tollerare che quel limite non venga apprezzato.',
      prompt: 'Posso dire “lo faccio” e, nello stesso momento, rendere chiaro cosa dovremo lasciare indietro?'
    },
    '2C': {
      scenario: '2 · Priorità vs confine',
      title: 'Hai scelto di gestire autonomamente la complessità.',
      choice: '“Cerco di riorganizzarmi senza coinvolgere il mio responsabile.”',
      body: 'Gestire autonomamente la complessità può proteggere il funzionamento del team. Il possibile costo è rendere invisibili le condizioni che generano il problema.',
      prompt: 'Sto risolvendo un problema oppure sto facendo in modo che il problema non si veda?'
    },
    '3A': {
      scenario: '3 · Ruolo vs posizione personale',
      title: 'Hai scelto di proteggere la coerenza del ruolo.',
      choice: '“Difendo la decisione. Una volta presa, il mio ruolo è rappresentarla.”',
      body: 'Rappresentare la decisione può proteggere la coerenza del ruolo. Il possibile costo è apparire allineati a tutti i costi, anche quando il team percepisce una distanza.',
      prompt: 'Posso assumermi la responsabilità di una decisione senza dover sostenere che è esattamente quella che avrei preso io?'
    },
    '3B': {
      scenario: '3 · Ruolo vs posizione personale',
      title: 'Hai scelto di mostrare anche la tua posizione personale.',
      choice: '“Dico al team che anch’io avevo delle perplessità, ma che la decisione è stata presa.”',
      body: 'Condividere un dubbio può proteggere l’autenticità della relazione. Il possibile costo è prendere implicitamente le distanze dalla decisione e indebolire il ruolo.',
      prompt: 'Sto raccontando il mio dissenso per aiutare il team a comprendere la complessità oppure per prendere distanza da una decisione scomoda?'
    },
    '3C': {
      scenario: '3 · Ruolo vs posizione personale',
      title: 'Hai scelto di separare la decisione dal processo che l’ha preceduta.',
      choice: '“Comunico la decisione senza entrare né nel mio punto di vista né nella discussione precedente.”',
      body: 'Separare la decisione dal dibattito può proteggere la riservatezza del processo. Il possibile costo è far sentire le persone non riconosciute nelle loro reazioni.',
      prompt: 'Posso riconoscere che una decisione è difficile da accogliere senza delegittimarla e senza raccontare tutto ciò che è avvenuto prima?'
    }
  };

  function analyticsEvent(name) {
    try {
      if (localStorage.getItem('uyl_cookie_consent') === 'all' && window.gtag) {
        if (tracked[name]) return;
        tracked[name] = true;
        window.gtag('event', name, { content_group: 'manager_quiz' });
      }
    } catch (_) {}
  }

  // Non inviare eventi di richiesta di contatto a piattaforme analitiche o pubblicitarie.
  window.uylTrackManagerLead = function () {};

  function showQuestion(index) {
    current = index;
    panels.forEach(function (panel, i) {
      panel.hidden = i !== order[index];
      panel.classList.toggle('is-active', i === order[index]);
    });
    results.hidden = true;
    var pct = Math.round(((index + 1) / 3) * 100);
    progressLabel.textContent = 'Situazione ' + (index + 1) + ' di 3';
    progressPct.textContent = pct + '%';
    progressBar.style.width = pct + '%';
    var panel = panels[order[index]];
    if (intro) intro.hidden = index !== 0;
    var backline = panel.querySelector('.quiz-backline');
    if (backline) backline.hidden = index === 0;
    var scenarioLabel = panel.querySelector('.quiz-label');
    if (scenarioLabel) scenarioLabel.textContent = (index + 1) + ' · ' + scenarioLabel.textContent.split(' · ').slice(1).join(' · ');
    var selected = answers[order[index]];
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
    if (intro) intro.hidden = true;
    panels.forEach(function (panel) { panel.hidden = true; });
    progressLabel.textContent = 'Percorso completato';
    progressPct.textContent = '100%';
    progressBar.style.width = '100%';
    cards.textContent = '';

    order.forEach(function (originalIndex, index) {
      var item = reflections[answers[originalIndex]];
      var card = document.createElement('article');
      card.className = 'quiz-result-card';

      var number = document.createElement('p');
      number.className = 'result-number';
      number.textContent = (index + 1) + ' · ' + item.scenario.split(' · ').slice(1).join(' · ');

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
        if (!started) started = true;
        analyticsEvent('manager_quiz_start');
        var position = order.indexOf(index);

        answers[index] = button.getAttribute('data-answer');
        panel.querySelectorAll('.quiz-option').forEach(function (other) {
          var selected = other === button;
          other.classList.toggle('is-selected', selected);
          other.setAttribute('aria-pressed', selected ? 'true' : 'false');
          other.disabled = true;
        });

        analyticsEvent('manager_quiz_step_' + (position + 1) + '_complete');

        window.setTimeout(function () {
          if (position < 2) showQuestion(position + 1);
          else renderResults();
        }, 180);
      });
    });

    var back = panel.querySelector('.quiz-back');
    if (back) back.addEventListener('click', function () { showQuestion(Math.max(0, order.indexOf(index) - 1)); });
  });

  restart.addEventListener('click', function () {
    answers = [null, null, null];
    completed = false;
    contact.hidden = true;
    var sticky = document.getElementById('quiz-result-sticky');
    if (sticky) sticky.hidden = true;
    showQuestion(0);
  });

  showQuestion(0);
  var sticky = document.getElementById('quiz-result-sticky');
  if (sticky && contact && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      if (!completed) return;
      sticky.hidden = entries[0].isIntersecting;
    }, { threshold: 0.08 }).observe(contact);
  }


})();
