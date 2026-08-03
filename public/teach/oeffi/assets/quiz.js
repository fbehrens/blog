/* Reusable retrieval-practice quiz component.
 *
 * Markup contract:
 *
 *   <div class="quiz" data-quiz>
 *     <p class="q">Frage?</p>
 *     <button data-answer="wrong">Antwort A</button>
 *     <button data-answer="right">Antwort B</button>
 *     <p class="why" hidden>Erklaerung, erscheint nach der Antwort.</p>
 *   </div>
 *
 * Scoring is per-page and shown in any element with id="quiz-score".
 * No dependencies, no build step.
 */
(function () {
  function init() {
    var quizzes = Array.prototype.slice.call(document.querySelectorAll("[data-quiz]"));
    var total = quizzes.length;
    var correct = 0;
    var answered = 0;

    var scoreEl = document.getElementById("quiz-score");
    function paintScore() {
      if (!scoreEl) return;
      scoreEl.textContent = answered === 0
        ? total + " Fragen"
        : correct + " von " + answered + " richtig (" + total + " Fragen)";
    }
    paintScore();

    quizzes.forEach(function (quiz) {
      var buttons = Array.prototype.slice.call(quiz.querySelectorAll("button[data-answer]"));
      var why = quiz.querySelector(".why");
      var done = false;

      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (done) return;
          done = true;
          answered++;

          var isRight = btn.dataset.answer === "right";
          if (isRight) correct++;

          buttons.forEach(function (b) {
            b.disabled = true;
            b.classList.add(b.dataset.answer === "right" ? "is-right" : "is-wrong");
            if (b === btn) b.classList.add("is-picked");
          });

          if (why) {
            why.hidden = false;
            why.classList.add(isRight ? "why-right" : "why-wrong");
          }
          quiz.classList.add("is-done");
          paintScore();
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
