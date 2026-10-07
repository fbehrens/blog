// Multiple-choice quiz. Markup:
// <div class="quiz" data-explain="Why the answer is right.">
//   <div class="q">Question?</div>
//   <button class="opt" data-correct>Right answer</button>
//   <button class="opt">Wrong answer</button> ...
// </div>
// Options are shuffled on load so position gives no clue.
document.querySelectorAll(".quiz").forEach((quiz) => {
  const opts = [...quiz.querySelectorAll("button.opt")];
  opts.sort(() => Math.random() - 0.5).forEach((o) => quiz.appendChild(o));

  const fb = document.createElement("div");
  fb.className = "fb";
  quiz.appendChild(fb);

  opts.forEach((opt) =>
    opt.addEventListener("click", () => {
      if (opt.hasAttribute("data-correct")) {
        opt.classList.add("right");
        opts.forEach((o) => (o.disabled = true));
        fb.className = "fb right";
        fb.textContent = "Correct. " + (quiz.dataset.explain || "");
      } else {
        opt.classList.add("wrong");
        opt.disabled = true;
        fb.className = "fb wrong";
        fb.textContent = "Not quite — try again.";
      }
    }),
  );
});
