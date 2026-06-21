// Adds a "Copy" button to every <pre> block. No markup needed in lessons —
// just include this script. Copies the block's text (HTML tags stripped).
document.querySelectorAll("pre").forEach((pre) => {
  const btn = document.createElement("button");
  btn.className = "copy-btn";
  btn.type = "button";
  btn.textContent = "Copy";
  btn.addEventListener("click", async () => {
    const code = pre.querySelector("code") || pre;
    try {
      await navigator.clipboard.writeText(code.innerText);
      btn.textContent = "Copied ✓";
      btn.classList.add("copied");
    } catch {
      btn.textContent = "Press ⌘C";
    }
    setTimeout(() => {
      btn.textContent = "Copy";
      btn.classList.remove("copied");
    }, 1400);
  });
  pre.appendChild(btn);
});
