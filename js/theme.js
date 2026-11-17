/* =====================================================
   theme.js — Day shift (light) / Night shift (dark)
   The saved choice is applied by a tiny inline script in every <head>
   (so there is no flash on load); this file wires the toggle button.
   ===================================================== */
(function () {
  "use strict";
  const KEY = "ns-theme";
  const root = document.documentElement;
  const COLORS = { dark: "#10151f", light: "#f5f6ee" };

  function apply(theme) {
    root.dataset.theme = theme;
    document.querySelectorAll("img[data-theme-aware]").forEach(img => img._nsUpdatePhoto?.());
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", COLORS[theme]);
    const button = document.getElementById("theme-toggle");
    if (button) {
      const light = theme === "light";
      button.setAttribute("aria-pressed", String(light));
      button.setAttribute(
        "aria-label",
        light
          ? "Day shift is on. Switch to Night shift"
          : "Night shift is on. Switch to Day shift",
      );
      button.title = light ? "Switch to Night shift" : "Switch to Day shift";
    }
  }

  const saved = () => (NS.read(KEY, "dark") === "light" ? "light" : "dark");

  document.addEventListener("DOMContentLoaded", () => {
    apply(saved());
    const button = document.getElementById("theme-toggle");
    if (!button) return;
    button.addEventListener("click", () => {
      const next = root.dataset.theme === "light" ? "dark" : "light";
      NS.save(KEY, next);
      apply(next);
    });
  });

  // keep other open tabs in sync
  window.addEventListener("storage", (event) => {
    if (event.key === KEY) apply(saved());
  });
})();
