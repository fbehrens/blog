/* Verhalten für die Übungs-Komponenten aus quiz.css.
   Rein deklarativ: kein Init-Aufruf nötig, einfach das Skript einbinden.

   Multiple Choice:
     <div class="quiz">
       <span class="quiz-nummer">Frage 1</span>
       <p class="quiz-frage">…</p>
       <button class="quiz-option" data-richtig>Antwort</button>
       <button class="quiz-option">Antwort</button>
       <div class="quiz-rueckmeldung" data-fuer="richtig">…</div>
       <div class="quiz-rueckmeldung" data-fuer="falsch">…</div>
     </div>

   Abfragekarte:
     <div class="abfrage">
       <p class="abfrage-aufgabe">…</p>
       <div class="abfrage-karte">
         <div class="abfrage-vorderseite">Frage</div>
         <div class="abfrage-rueckseite">Antwort</div>
       </div>
     </div>
*/

(function () {
  'use strict';

  function quizAufbauen(quiz) {
    var optionen = Array.prototype.slice.call(quiz.querySelectorAll('.quiz-option'));
    var rueckmeldungen = Array.prototype.slice.call(quiz.querySelectorAll('.quiz-rueckmeldung'));
    var nochmal = document.createElement('button');
    nochmal.className = 'quiz-nochmal';
    nochmal.type = 'button';
    nochmal.textContent = 'Nochmal versuchen';
    nochmal.hidden = true;
    quiz.appendChild(nochmal);

    function zuruecksetzen() {
      optionen.forEach(function (o) {
        o.disabled = false;
        o.classList.remove('ist-richtig', 'ist-falsch');
      });
      rueckmeldungen.forEach(function (r) { r.classList.remove('sichtbar', 'richtig', 'falsch'); });
      nochmal.hidden = true;
    }

    optionen.forEach(function (option) {
      option.type = 'button';
      option.addEventListener('click', function () {
        var richtig = option.hasAttribute('data-richtig');

        optionen.forEach(function (o) {
          o.disabled = true;
          // Nach der Antwort immer die richtige Lösung zeigen – das ist die Rückmeldung.
          if (o.hasAttribute('data-richtig')) o.classList.add('ist-richtig');
        });
        if (!richtig) option.classList.add('ist-falsch');

        rueckmeldungen.forEach(function (r) {
          var passt = r.getAttribute('data-fuer') === (richtig ? 'richtig' : 'falsch');
          r.classList.toggle('sichtbar', passt);
          r.classList.toggle(richtig ? 'richtig' : 'falsch', passt);
        });

        nochmal.hidden = richtig;
      });
    });

    nochmal.addEventListener('click', zuruecksetzen);
  }

  function abfrageAufbauen(karte) {
    var vorderseite = karte.querySelector('.abfrage-vorderseite');
    if (!vorderseite) return;
    vorderseite.setAttribute('role', 'button');
    vorderseite.setAttribute('tabindex', '0');
    function umschalten() { karte.classList.toggle('offen'); }
    vorderseite.addEventListener('click', umschalten);
    vorderseite.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); umschalten(); }
    });
  }

  function start() {
    document.querySelectorAll('.quiz').forEach(quizAufbauen);
    document.querySelectorAll('.abfrage-karte').forEach(abfrageAufbauen);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
