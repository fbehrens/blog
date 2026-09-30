/* Prediction quiz on top of assets/tree.js.
 * Quiz.mount(el, [
 *   { prompt: "…", setup: "h[1 2 3]", focus: 2, cmd: "open new window",
 *     options: ["h[1 2 4 3]", "h[1 2 3 4]", "h[4 1 2 3]"], answer: 0, why: "…" },
 *   { prompt: "…", options: ["text a", "text b"], answer: 1, why: "…" }   // text-only question
 * ], { shuffle: true })
 * Options that look like trees ("h[…]") are rendered as mini screens, so they carry no wording clues.
 */
(function () {
  const isTree = (s) => /^[hvHV]\[/.test(s);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function mount(el, questions, { shuffle: doShuffle = true, size = [150, 90], setupSize = [260, 150] } = {}) {
    const qs = doShuffle ? shuffle([...questions]) : questions;
    let i = 0, score = 0, answered = false;
    el.classList.add("quiz");

    const render = () => {
      if (i >= qs.length) {
        el.innerHTML = `<div class="q-head"><span>done</span><span>${score} / ${qs.length}</span></div>
          <p class="q-prompt">${score === qs.length ? "All correct. Come back in a few days and do it again, cold." :
            "Retry the ones you missed. Getting it wrong now, then right, is what makes it stick."}</p>
          <button class="q-restart">again (reshuffled)</button>`;
        el.querySelector(".q-restart").onclick = () => { mount(el, questions, { shuffle: doShuffle, size, setupSize }); };
        return;
      }
      const q = qs[i]; answered = false;
      const order = shuffle(q.options.map((o, k) => k));
      el.innerHTML = `<div class="q-head"><span>predict</span><span>${i + 1} / ${qs.length}</span></div>
        <div class="q-prompt">${q.prompt}</div>
        ${q.setup ? `<div class="q-setup"><div class="q-screen"></div><pre class="aero-tree q-tree"></pre></div>` : ""}
        ${q.cmd ? `<div class="q-cmd">${q.cmd}</div>` : ""}
        <div class="q-options"></div><div class="q-feedback"></div>
        <div class="q-nav"><span class="q-score">score ${score}</span><button class="q-next" disabled>next →</button></div>`;
      if (q.setup) {
        const ws = Aero.parse(q.setup, { focus: q.focus });
        (q.prep || (() => {}))(ws);
        Aero.renderScreen(el.querySelector(".q-screen"), ws, { width: setupSize[0], height: setupSize[1] });
        Aero.renderTree(el.querySelector(".q-tree"), ws);
      }
      const box = el.querySelector(".q-options");
      order.forEach((k, pos) => {
        const o = document.createElement("div"); o.className = "q-opt";
        o.innerHTML = `<span class="lbl">${"ABCDE"[pos]}</span>`;
        if (isTree(q.options[k])) {
          const scr = document.createElement("div"); o.appendChild(scr);
          const ws = Aero.parse(q.options[k], { focus: q.optionFocus ?? "__none" });
          if (q.optionFocus == null) ws.focused = null;
          Aero.renderScreen(scr, ws, { width: size[0], height: size[1] });
        } else {
          o.insertAdjacentHTML("beforeend", `<span>${q.options[k]}</span>`);
        }
        o.onclick = () => {
          if (answered) return; answered = true;
          const fb = el.querySelector(".q-feedback");
          const right = k === q.answer;
          if (right) score++;
          o.classList.add(right ? "right" : "wrong");
          box.children[order.indexOf(q.answer)].classList.add("right");
          fb.className = "q-feedback " + (right ? "good" : "bad");
          fb.innerHTML = (right ? "✓ " : "✗ ") + q.why;
          el.querySelector(".q-next").disabled = false;
          el.querySelector(".q-score").textContent = `score ${score}`;
        };
        box.appendChild(o);
      });
      el.querySelector(".q-next").onclick = () => { i++; render(); };
    };
    render();
  }
  window.Quiz = { mount };
})();
