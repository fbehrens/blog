/* Quiz-Komponente: Multiple Choice mit sofortigem Feedback, gemischten Antworten,
   Wiederholung falscher Fragen und Fortschritt im localStorage.
   Frageformat: {q, o:[...], a:<Index der richtigen Option>, e:<Erklärung>, l?, t?, f?} */
(function () {
  const KEY = "ni-quiz";
  const LETTERS = "ABCDEFG";

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }

  function save(id, right, total) {
    const all = load();
    const prev = all[id] || {};
    const pct = Math.round((100 * right) / total);
    all[id] = { best: Math.max(prev.best || 0, pct), last: pct, date: new Date().toISOString().slice(0, 10), runs: (prev.runs || 0) + 1 };
    try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* kein Speicher verfügbar */ }
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  // opts: {id, exam, full}  full = kompletter Durchlauf (nur dann wird gespeichert)
  function render(root, questions, opts) {
    root.innerHTML = "";
    const tally = el("div", "tally");
    root.appendChild(tally);
    let answered = 0, right = 0;
    const wrong = [];

    function update() {
      tally.textContent = `${answered} / ${questions.length} beantwortet · ${right} richtig`;
    }
    update();

    questions.forEach((q, i) => {
      const box = el("div", "q");
      if (opts.exam && q.l) box.appendChild(el("span", "q-ref", `Lektion ${q.l} · ${q.t}`));
      box.appendChild(el("p", "q-text", `<span class="n">${i + 1}.</span>${q.q}`));
      const list = el("ol", "options");
      const order = shuffle(q.o.map((text, idx) => ({ text, idx })));
      const buttons = [];
      order.forEach((opt, k) => {
        const li = el("li");
        const b = el("button", null, `<span class="l">${LETTERS[k]}</span><span>${opt.text}</span>`);
        b.type = "button";
        b.addEventListener("click", () => {
          const ok = opt.idx === q.a;
          buttons.forEach((bb) => { bb.disabled = true; });
          buttons[order.findIndex((o) => o.idx === q.a)].classList.add("ok");
          if (!ok) { b.classList.add("bad"); wrong.push(q); } else { right++; }
          answered++;
          const link = opts.exam && q.f ? ` <a href="${q.f}">→ Lektion ${q.l} wiederholen</a>` : "";
          box.appendChild(el("p", `why ${ok ? "ok" : "bad"}`, `<span class="verdict">${ok ? "Richtig." : "Leider nicht."}</span>${q.e || ""}${link}`));
          update();
          if (answered === questions.length) finish();
        });
        buttons.push(b);
        li.appendChild(b);
        list.appendChild(li);
      });
      box.appendChild(list);
      root.appendChild(box);
    });

    function finish() {
      const pct = Math.round((100 * right) / questions.length);
      if (opts.full && opts.id) save(opts.id, right, questions.length);
      const res = el("div", "result");
      const verdict = pct >= 90 ? "Prüfungsreif." : pct >= 70 ? "Gut – die falschen noch einmal." : "Lies die Zusammenfassung noch einmal und wiederhole.";
      res.innerHTML = `<span class="big">${right} / ${questions.length} · ${pct} %</span>${verdict}`;
      if (opts.exam && wrong.length) {
        const by = {};
        wrong.forEach((q) => { by[q.l] = by[q.l] || { t: q.t, f: q.f, n: 0 }; by[q.l].n++; });
        res.innerHTML += "<ul>" + Object.keys(by).sort().map((l) => `<li><a href="${by[l].f}">Lektion ${l} · ${by[l].t}</a> – ${by[l].n} falsch</li>`).join("") + "</ul>";
      }
      if (wrong.length) {
        const again = el("button", null, `Nur die ${wrong.length} falschen wiederholen`);
        again.addEventListener("click", () => { render(root, shuffle(wrong), { ...opts, full: false }); root.scrollIntoView(); });
        res.appendChild(again);
      }
      const all = el("button", null, "Alle Fragen neu mischen");
      all.addEventListener("click", () => { (opts.restart || (() => render(root, opts.exam ? shuffle(questions) : questions, { ...opts, full: true })))(); root.scrollIntoView(); });
      res.appendChild(all);
      root.appendChild(res);
      res.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  // Freitext: {q, k:[Kernpunkte], m:Musterantwort, l?, t?, f?}
  function renderFreitext(root, items, opts) {
    root.innerHTML = "";
    const tally = el("div", "tally");
    root.appendChild(tally);
    let done = 0, got = 0, max = 0;
    const update = () => { tally.textContent = `${done} / ${items.length} ausgewertet · ${got} / ${max} Kernpunkte`; };
    update();
    items.forEach((it, i) => {
      const box = el("div", "q ft");
      if (opts.exam && it.l) box.appendChild(el("span", "q-ref", `Lektion ${it.l} · ${it.t}`));
      box.appendChild(el("p", "q-text", `<span class="n">${i + 1}.</span>${it.q}`));
      const ta = el("textarea");
      ta.rows = 5;
      ta.placeholder = "Deine Antwort …";
      box.appendChild(ta);
      const show = el("button", null, "Musterlösung aufdecken");
      show.type = "button";
      box.appendChild(show);
      show.addEventListener("click", () => {
        show.remove();
        ta.readOnly = true;
        const sol = el("div", "solution");
        sol.appendChild(el("p", "label", "Kernpunkte – hake ab, was du genannt hast:"));
        const list = el("ul", "kp");
        const boxes = it.k.map((k) => {
          const li = el("li");
          const cb = el("input");
          cb.type = "checkbox";
          const lab = el("label");
          lab.appendChild(cb);
          lab.appendChild(el("span", null, " " + k));
          li.appendChild(lab);
          list.appendChild(li);
          return cb;
        });
        sol.appendChild(list);
        sol.appendChild(el("p", "model", `<strong>Musterantwort:</strong> ${it.m}`));
        const link = opts.exam && it.f ? ` <a href="${it.f}">→ Lektion ${it.l}</a>` : "";
        const rate = el("button", null, "Auswerten");
        rate.type = "button";
        rate.addEventListener("click", () => {
          const n = boxes.filter((b) => b.checked).length;
          boxes.forEach((b) => { b.disabled = true; });
          rate.remove();
          done++; got += n; max += it.k.length;
          const ok = n / it.k.length >= 0.75;
          sol.appendChild(el("p", `why ${ok ? "ok" : "bad"}`, `<span class="verdict">${n} / ${it.k.length} Kernpunkte.</span>${ok ? "Gut abgedeckt." : "Lies die Musterantwort und formuliere sie einmal laut nach."}${link}`));
          update();
        });
        sol.appendChild(rate);
        box.appendChild(sol);
      });
      root.appendChild(box);
    });
  }

  function initLesson() {
    const root = document.getElementById("quiz");
    if (!root || !window.QUIZ) return;
    render(root, window.QUIZ, { id: window.LESSON.id, full: true });
    const ft = document.getElementById("freitext");
    if (ft && window.FREITEXT && window.FREITEXT.length) renderFreitext(ft, window.FREITEXT, {});
    const t = document.querySelector(".toggle-summary");
    if (t) t.addEventListener("click", () => {
      document.body.classList.toggle("recall");
      t.textContent = document.body.classList.contains("recall") ? "Zusammenfassung einblenden" : "Zusammenfassung ausblenden";
    });
  }

  function initExam() {
    const root = document.getElementById("quiz");
    const start = document.getElementById("exam-start");
    if (!root || !start || !window.BANK) return;
    const go = () => {
      const n = parseInt(document.getElementById("exam-n").value, 10);
      const teil = document.getElementById("exam-teil").value;
      const typ = document.getElementById("exam-typ").value;
      const src = typ === "ft" ? (window.FTBANK || []) : window.BANK;
      let pool = shuffle(src.filter((q) => !teil || q.p === teil));
      if (typ === "ft") { renderFreitext(root, pool.slice(0, Math.min(n || pool.length, 10)), { exam: true }); return; }
      if (n) pool = pool.slice(0, n);
      render(root, pool, { id: "exam", exam: true, full: true, restart: go });
    };
    start.addEventListener("click", go);
    go();
  }

  function initIndex() {
    const data = load();
    document.querySelectorAll("[data-progress]").forEach((n) => {
      const d = data[n.dataset.progress];
      if (!d) return;
      n.textContent = `zuletzt ${d.last} % · best ${d.best} % · ${d.date} · ${d.runs}×`;
      if (d.last < 70) n.classList.add("low");
    });
  }

  window.NIQuiz = { render, renderFreitext, load, shuffle };
  document.addEventListener("DOMContentLoaded", () => { initLesson(); initExam(); initIndex(); });
})();
