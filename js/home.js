/* Home: two interactive features — mood recommendation and random picker. */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const data = NS.catalog();
  let previousId = "";
  const moodResult = document.getElementById("mood-result");
  function showMood(mood) {
    const matches = data.filter((item) => item.category === mood);
    const item = matches[Math.floor(Math.random() * matches.length)];
    document.getElementById("mood-result-name").textContent = item.name;
    document.getElementById("mood-result-desc").textContent = item.description;
    document.getElementById("mood-result-link").href =
      "explore.html?category=" + encodeURIComponent(mood);
    NS.reveal(moodResult, 260); // jQuery effect 2: fadeIn on contextual recommendation.
    document
      .querySelectorAll(".mood-card")
      .forEach((btn) =>
        btn.setAttribute("aria-pressed", String(btn.dataset.mood === mood)),
      );
  }
  document.querySelectorAll(".mood-card").forEach((button) => {
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => showMood(button.dataset.mood));
  });
  document.getElementById("surprise-btn").addEventListener("click", () => {
    let candidates = data.filter((item) => item.id !== previousId);
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    previousId = chosen.id;
    const card = $("#surprise-card");
    // jQuery effect 3: chained fadeOut/fadeIn; stop clears fast repeated clicks.
    card.stop(true, true).fadeOut(150, () => {
      document.getElementById("surprise-name").textContent = chosen.name;
      document.getElementById("surprise-description").textContent =
        chosen.description;
      const link = document.getElementById("surprise-link");
      link.href = "explore.html?search=" + encodeURIComponent(chosen.name);
      link.replaceChildren("Explore this idea ", NS.icon("arrow"));
      card.fadeIn(260);
    });
  });

  // Call-to-action: a logged-in visitor goes straight to the profile
  const user = NS.currentUser();
  const actions = document.getElementById("cta-actions");
  if (user && actions) {
    actions.replaceChildren();
    const open = document.createElement("a");
    open.className = "btn btn-lime btn-pill";
    open.href = "profile.html";
    open.replaceChildren(
      `Open ${user.name.split(" ")[0]}'s Night Pass `,
      NS.icon("arrow"),
    );
    actions.append(open);
  }

  // Ticker: repeat the text so that each half of the track is wider than the screen.
  // The CSS animation moves the track by exactly -50%, so the loop has no jump or empty gap.
  const track = document.querySelector(".ticker-track");
  if (track) {
    const unit = track.firstElementChild.cloneNode(true);
    const fillTicker = () => {
      track.replaceChildren(unit.cloneNode(true));
      const width = track.firstElementChild.getBoundingClientRect().width;
      const copies = Math.max(1, Math.ceil(window.innerWidth / width));
      const half = Array.from({ length: copies }, () => unit.cloneNode(true));
      track.replaceChildren(
        ...half,
        ...half.map((node) => node.cloneNode(true)),
      );
    };
    fillTicker();
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fillTicker, 200);
    });
  }
});
