/* =====================================================
   icons.js — one consistent icon set (inline SVG, 24x24 grid, round line style)
   In HTML:  <span data-icon="arrow"></span>
   In JS:    element.append(NS.icon("heart"))
   Icons use currentColor, so they follow the text colour in both themes,
   and their size follows the font-size of the element they are in.
   ===================================================== */
(function () {
  "use strict";
  const PATHS = {
    coffee:
      '<path d="M4.5 9.5h12v4.2a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z"/><path d="M16.5 11h1.2a2.4 2.4 0 0 1 0 4.8h-1.6"/><path d="M8.5 3.5v2.3M12.5 3.5v2.3"/>',
    book: '<path d="M12 6.5C10.5 5 8 4.5 4.5 4.5v13c3.5 0 6 .5 7.5 2 1.5-1.5 4-2 7.5-2v-13C16 4.5 13.5 5 12 6.5z"/><path d="M12 6.5v13"/>',
    bowling:
      '<circle cx="12" cy="12" r="8.5"/><circle cx="10" cy="9.2" r=".7" fill="currentColor"/><circle cx="13.6" cy="9.2" r=".7" fill="currentColor"/><circle cx="11.8" cy="12.6" r=".7" fill="currentColor"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r=".8" fill="currentColor"/><circle cx="15" cy="9" r=".8" fill="currentColor"/><circle cx="12" cy="12" r=".8" fill="currentColor"/><circle cx="9" cy="15" r=".8" fill="currentColor"/><circle cx="15" cy="15" r=".8" fill="currentColor"/>',
    moon: '<path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2z"/>',
    spark:
      '<path d="M12 3.5c.7 4.7 2.6 6.6 7.5 8.5-4.9 1.9-6.8 3.8-7.5 8.5-.7-4.7-2.6-6.6-7.5-8.5 4.9-1.9 6.8-3.8 7.5-8.5z"/>',
    gamepad:
      '<rect x="3" y="7.5" width="18" height="10" rx="5"/><path d="M8 10.5v4M6 12.5h4"/><circle cx="15.5" cy="11.5" r=".8" fill="currentColor"/><circle cx="17.8" cy="13.8" r=".8" fill="currentColor"/>',
    dessert:
      '<path d="M6.2 12.5h11.6l-1.4 7h-8.8z"/><path d="M7.2 12.5a4.8 4.8 0 0 1 9.6 0"/><path d="M12 7.7V5.2"/><circle cx="12" cy="4.4" r=".9"/>',
    arrow: '<path d="M7 17 17 7M8.5 7H17v8.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    heart:
      '<path d="M12 19.5s-7.5-4.5-7.5-10.2A4.1 4.1 0 0 1 12 7a4.1 4.1 0 0 1 7.5 2.3c0 5.7-7.5 10.2-7.5 10.2z"/>',
    check: '<path d="M5 12.5l4.6 4.6L19 7.6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    reset:
      '<path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5"/><path d="M4.5 4.5v4.2h4.2"/>',
    alert: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.8v5M12 16.2v.2"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.2"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6"/>',
    tower:
      '<path d="M12 21V11"/><circle cx="12" cy="7.5" r="3.5"/><path d="M8.5 21h7"/>',
    ticket:
      '<path d="M4 8.5a2 2 0 0 0 0 7V18h16v-2.5a2 2 0 0 1 0-7V6H4z"/><path d="M14 6v12" stroke-dasharray="1.5 2"/>',
    dome: '<path d="M5 20v-6a7 7 0 0 1 14 0v6z"/><path d="M12 7V3.5M3.5 20h17"/>',
    tree: '<circle cx="12" cy="9" r="5.5"/><path d="M12 14.5V21M9 21h6"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    saved: '<path d="M6.5 4h11v16.5L12 16.5l-5.5 4z"/>',
    food: '<path d="M7 3.5v7.5M4.5 3.5V9a2.5 2.5 0 0 0 5 0V3.5M7 11v9.5"/><path d="M16.5 20.5V3.5c-2.4 1.6-3.5 4.4-3.5 7.5h3.5"/>',
    star: '<path d="M12 4v16M5.1 8l13.8 8M5.1 16l13.8-8"/>',
  };

  const svg = (name) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${PATHS[name] || ""}</svg>`;

  // NS.icon("heart") -> <span class="ico">…svg…</span> (for elements created in JS)
  NS.icon = (name) => {
    const span = document.createElement("span");
    span.className = "ico";
    span.innerHTML = svg(name);
    return span;
  };

  // <span data-icon="arrow"></span> in the HTML turns into an icon automatically
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-icon]").forEach((el) => {
      el.classList.add("ico");
      el.setAttribute("aria-hidden", "true");
      el.innerHTML = svg(el.dataset.icon);
    });
  });
})();
