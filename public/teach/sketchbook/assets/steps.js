// Step checklist: <ol class="steps" data-key="unique-id"> — adds a "Done" toggle per <li>,
// remembers progress in localStorage, and updates any [data-progress-for="unique-id"] element.
document.querySelectorAll("ol.steps[data-key]").forEach((list) => {
  const key = "steps:" + list.dataset.key;
  const saved = new Set(JSON.parse(localStorage.getItem(key) || "[]"));
  const items = [...list.children];
  const progress = document.querySelector(`[data-progress-for="${list.dataset.key}"]`);

  const render = () => {
    items.forEach((li, i) => {
      li.classList.toggle("done", saved.has(i));
      li.querySelector(".step-toggle").textContent = saved.has(i) ? "Undo" : "Done";
    });
    if (progress) progress.textContent = `${saved.size} / ${items.length} steps done`;
    localStorage.setItem(key, JSON.stringify([...saved]));
  };

  items.forEach((li, i) => {
    const btn = document.createElement("button");
    btn.className = "step-toggle";
    btn.addEventListener("click", () => {
      saved.has(i) ? saved.delete(i) : saved.add(i);
      render();
    });
    li.prepend(btn);
  });
  render();
});
