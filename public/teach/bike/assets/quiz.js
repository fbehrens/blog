/* Reusable quiz widget.
   Usage in a lesson:
   <div class="quiz" data-quiz></div>
   <script src="../assets/quiz.js"></script>
   <script>
     renderQuiz(document.querySelector('[data-quiz]'), [
       { prompt: "…", options: ["…","…","…"], answer: 0, why: "…" },
     ]);
   </script>
   Keep every option in a question the same word count and near-equal length —
   formatting must never leak the answer.
*/
function renderQuiz(root, questions) {
  let answered = 0, correct = 0;
  const score = document.createElement("p");
  score.className = "score";

  questions.forEach((q) => {
    const box = document.createElement("div");
    box.className = "q";

    const prompt = document.createElement("p");
    prompt.className = "prompt";
    prompt.textContent = q.prompt;
    box.appendChild(prompt);

    const fb = document.createElement("p");
    fb.className = "feedback";
    fb.textContent = q.why;

    q.options.forEach((text, i) => {
      const b = document.createElement("button");
      b.className = "opt";
      b.type = "button";
      b.textContent = text;
      b.addEventListener("click", () => {
        if (box.dataset.done) return;
        box.dataset.done = "1";
        answered++;
        if (i === q.answer) correct++;
        b.classList.add(i === q.answer ? "correct" : "wrong");
        [...box.querySelectorAll("button.opt")][q.answer].classList.add("correct");
        fb.classList.add("show");
        score.textContent = `${correct} of ${answered} correct (${questions.length} questions total).`;
      });
      box.appendChild(b);
    });

    box.appendChild(fb);
    root.appendChild(box);
  });

  root.appendChild(score);
}
