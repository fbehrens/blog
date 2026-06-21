// Shared quiz widget. Markup:
// <div class="quiz" data-answer="1" data-fb="explanation">
//   <div class="q">Question?</div>
//   <button>option a</button><button>option b</button>...
// </div>
// data-answer is the 0-based index of the correct button.
document.querySelectorAll(".quiz").forEach((quiz) => {
  const answer = Number(quiz.dataset.answer);
  const fbText = quiz.dataset.fb || "";
  const fb = document.createElement("div");
  fb.className = "fb";
  quiz.appendChild(fb);
  const buttons = [...quiz.querySelectorAll("button")];
  buttons.forEach((btn, i) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => (b.disabled = true));
      if (i === answer) {
        btn.classList.add("correct");
        fb.style.color = "var(--ok)";
        fb.textContent = "✓ Correct. " + fbText;
      } else {
        btn.classList.add("wrong");
        buttons[answer].classList.add("correct");
        fb.style.color = "var(--accent)";
        fb.textContent = "✗ Not quite. " + fbText;
      }
    });
  });
});
