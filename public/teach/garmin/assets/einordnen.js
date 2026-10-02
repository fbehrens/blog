/* Verhalten für die Einordnen-Übung aus einordnen.css.
   Deklarativ, kein Init-Aufruf nötig.

   <div class="einordnen" data-a="pro Profil" data-b="geräteweit">
     <p class="einordnen-aufgabe">…</p>
     <div class="einordnen-zeile" data-loesung="a">
       <span class="einordnen-begriff">Datenseiten</span>
       <span class="einordnen-notiz">Warum – erscheint nach der Antwort.</span>
     </div>
   </div>

   data-loesung ist "a" oder "b"; die Knöpfe werden aus data-a / data-b erzeugt.
*/

(function () {
  'use strict';

  function aufbauen(block) {
    var beschriftung = { a: block.dataset.a || 'A', b: block.dataset.b || 'B' };
    var zeilen = Array.prototype.slice.call(block.querySelectorAll('.einordnen-zeile'));
    var beantwortet = 0;
    var richtig = 0;

    var stand = document.createElement('span');
    stand.className = 'einordnen-punktestand';
    stand.textContent = '0 von ' + zeilen.length + ' beantwortet';
    block.insertBefore(stand, zeilen[0]);

    zeilen.forEach(function (zeile) {
      var loesung = zeile.dataset.loesung;
      var notiz = zeile.querySelector('.einordnen-notiz');
      var knoepfe = ['a', 'b'].map(function (schluessel) {
        var k = document.createElement('button');
        k.type = 'button';
        k.className = 'einordnen-knopf';
        k.textContent = beschriftung[schluessel];
        k.dataset.wahl = schluessel;
        // Die Notiz soll am Zeilenende stehen, die Knöpfe davor.
        if (notiz) zeile.insertBefore(k, notiz); else zeile.appendChild(k);
        return k;
      });

      knoepfe.forEach(function (knopf) {
        knopf.addEventListener('click', function () {
          if (zeile.classList.contains('beantwortet')) return;
          var getroffen = knopf.dataset.wahl === loesung;

          knoepfe.forEach(function (k) {
            k.disabled = true;
            if (k.dataset.wahl === loesung) k.classList.add('treffer');
          });
          if (!getroffen) knopf.classList.add('fehler');

          zeile.classList.add('beantwortet');
          beantwortet += 1;
          if (getroffen) richtig += 1;
          stand.textContent = richtig + ' von ' + beantwortet + ' richtig' +
            (beantwortet === zeilen.length ? ' – alle durch' : '');
        });
      });
    });
  }

  function start() { document.querySelectorAll('.einordnen').forEach(aufbauen); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
