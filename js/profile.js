/* =====================================================
   profile.js — Profile page ("Night Pass")
   Shows the account, counters, saved places (favorites), saved plans and
   shared ideas. Every list can be cleared, and items removed one by one.
   Only for logged-in users: otherwise redirects to the Log In page.
   ===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const user = NS.currentUser();
  if (!user) {
    location.replace("login.html?msg=login-required&next=profile.html");
    return;
  }
  const byId = (id) => NS.catalog().find((item) => item.id === id);
  const $id = (id) => document.getElementById(id);

  /* ---------- small DOM helper ---------- */
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // A destructive button needs a second click within 4 seconds (no alert dialogs).
  function confirmClick(button, label, action) {
    const original = button.textContent;
    let timer;
    button.addEventListener("click", () => {
      if (!button.classList.contains("is-armed")) {
        button.classList.add("is-armed");
        button.textContent = label;
        timer = setTimeout(() => {
          button.classList.remove("is-armed");
          button.textContent = original;
        }, 4000);
        return;
      }
      clearTimeout(timer);
      button.classList.remove("is-armed");
      button.textContent = original;
      action();
    });
  }

  /* ---------- pass card + counters ---------- */
  function renderPass() {
    const me = NS.currentUser();
    if (!me) return;
    $id("pass-avatar").textContent = me.name.charAt(0).toUpperCase();
    $id("pass-name").textContent = me.name;
    $id("pass-email").textContent = me.email;
    $id("pass-since").textContent =
      "Member since " +
      new Date(me.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    $id("pass-number").textContent = me.passNo || "NS-0000";
    $id("rename-name").value = me.name;
  }

  function planTotal(plan) {
    if (Number.isFinite(plan.total)) return plan.total;
    const perPerson = plan.stops
      .map(byId)
      .filter(Boolean)
      .reduce((sum, item) => sum + item.price, 0);
    return perPerson * plan.people;
  }

  function renderStats() {
    const places = NS.get("favorites", []).filter(byId);
    const plans = NS.get("plans", []);
    const ideas = NS.get("suggestions", []);
    $id("stat-places").textContent = places.length;
    $id("stat-plans").textContent = plans.length;
    $id("stat-ideas").textContent = ideas.length;
    // calculated value: money planned across all saved plans
    $id("stat-total").textContent = NS.money(
      plans.reduce((sum, plan) => sum + planTotal(plan), 0),
    );
  }

  /* ---------- saved places ---------- */
  function placeCard(item) {
    const card = el("article", "saved-card");
    const img = el("img");
    NS.placeImage(img, item);
    img.alt = item.personal ? `Your uploaded photo for ${item.name}` : `Visual for ${item.name}`;
    img.width = 1200;
    img.height = 760;
    img.loading = "lazy";
    const body = el("div", "saved-body");
    body.append(
      el("p", "eyebrow", NS.categoryName(item.category)),
      el("h3", "", item.name),
      el(
        "p",
        "",
        (item.price ? NS.money(item.price) + " / person" : "Free") +
          " · " +
          item.minutes +
          " min",
      ),
    );
    const actions = el("div", "saved-actions");
    const plan = el("a");
    plan.replaceChildren("Add to plan ", NS.icon("arrow"));
    plan.href = "compare.html?add=" + encodeURIComponent(item.id);
    const remove = el("button", "mini-btn", "Remove");
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${item.name} from saved places`);
    remove.addEventListener("click", () => {
      remove.disabled = true;
      NS.set(
        "favorites",
        NS.get("favorites", []).filter((id) => id !== item.id),
      );
      // jQuery effect: the card slides away, then the lists refresh
      $(card)
        .stop(true, true)
        .fadeOut(200, () => {
          renderPlaces();
          renderStats();
          NS.toast(`${item.name} was removed from your saved places.`, {
            type: "info",
          });
        });
    });
    actions.append(plan, remove);
    body.append(actions);
    card.append(img, body);
    return card;
  }

  function renderPlaces() {
    const places = NS.get("favorites", []).map(byId).filter(Boolean);
    const grid = $id("places-grid");
    grid.replaceChildren(...places.map(placeCard));
    $id("places-empty").hidden = places.length > 0;
    $id("clear-places").hidden = places.length === 0;
  }

  /* ---------- saved plans ---------- */
  function planCard(plan, index) {
    const card = el("article", "plan-card");
    const date = new Date(plan.date + "T00:00:00");
    const when = el("div", "plan-date");
    when.append(
      el(
        "strong",
        "",
        Number.isNaN(date.getTime()) ? "—" : String(date.getDate()),
      ),
      el(
        "span",
        "",
        Number.isNaN(date.getTime())
          ? ""
          : date
              .toLocaleDateString("en-GB", { month: "short", year: "numeric" })
              .toUpperCase(),
      ),
    );
    const info = el("div", "plan-info");
    const moodText =
      plan.mood === "mixed"
        ? "A bit of everything"
        : NS.categoryName(plan.mood);
    info.append(
      el("h3", "", `${plan.name}'s night`),
      el(
        "p",
        "",
        `${plan.time} · ${plan.people} ${plan.people === 1 ? "person" : "people"} · mood: ${moodText}`,
      ),
    );
    const chips = el("div", "chip-row");
    plan.stops
      .map(byId)
      .filter(Boolean)
      .forEach((item) => chips.append(el("span", "chip", item.name)));
    info.append(chips);
    const side = el("div", "plan-side");
    const remove = el("button", "mini-btn", "Delete");
    remove.type = "button";
    remove.setAttribute("aria-label", `Delete plan for ${plan.date}`);
    remove.addEventListener("click", () => {
      remove.disabled = true;
      const all = NS.get("plans", []);
      all.splice(index, 1);
      NS.set("plans", all);
      $(card)
        .stop(true, true)
        .slideUp(220, () => {
          renderPlans();
          renderStats();
          NS.toast("The plan was deleted.", { type: "info" });
        });
    });
    side.append(
      el("strong", "", NS.money(planTotal(plan))),
      el("span", "minor", NS.formatDuration(plan.duration || 0)),
      remove,
    );
    card.append(when, info, side);
    return card;
  }

  function renderPlans() {
    const plans = NS.get("plans", []);
    $id("plans-list").replaceChildren(...plans.map(planCard));
    $id("plans-empty").hidden = plans.length > 0;
    $id("clear-plans").hidden = plans.length === 0;
  }

  /* ---------- shared ideas ---------- */
  function renderIdeas() {
    const ideas = NS.get("suggestions", []);
    const list = $id("ideas-list");
    list.replaceChildren(
      ...ideas.map((idea) => {
        const card = el("article", "suggestion-item");
        card.append(
          el("small", "", NS.categoryName(idea.category).toUpperCase() + " · " + NS.money(Number(idea.budget) || 0)),
          el("h3", "", idea.name), el("p", "", idea.reason),
        );
        const actions=el("div","suggestion-actions");
        const see=el("a","mini-btn","Explore");see.href="explore.html?search="+encodeURIComponent(idea.name);
        const remove=el("button","mini-btn","Delete");remove.type="button";
        remove.addEventListener("click",()=>{
          NS.set("suggestions",NS.get("suggestions",[]).filter(x=>x.id!==idea.id));
          NS.set("favorites",NS.get("favorites",[]).filter(id=>id!==idea.id));
          NS.set("draft",NS.get("draft",[]).filter(id=>id!==idea.id));
          renderAll(); NS.toast("Personal place deleted.",{type:"info"});
        });
        actions.append(see,remove);card.append(actions);
        return card;
      }),
    );
    $id("ideas-empty").hidden = ideas.length > 0;
    $id("clear-ideas").hidden = ideas.length === 0;
  }

  function renderAll() {
    renderPass();
    renderStats();
    renderPlaces();
    renderPlans();
    renderIdeas();
  }

  /* ---------- clear buttons (two-click confirmation) ---------- */
  confirmClick($id("clear-places"), "Click again to clear all", () => {
    NS.set("favorites", []);
    renderPlaces();
    renderStats();
    NS.toast("All saved places were cleared.", { type: "info" });
  });
  confirmClick($id("clear-plans"), "Click again to clear all", () => {
    NS.set("plans", []);
    renderPlans();
    renderStats();
    NS.toast("All saved plans were cleared.", { type: "info" });
  });
  confirmClick($id("clear-ideas"), "Click again to clear all", () => {
    NS.set("suggestions", []);
    renderIdeas();
    renderStats();
    NS.toast("Your shared ideas were cleared.", { type: "info" });
  });

  /* ---------- rename form ---------- */
  const renameForm = $id("rename-form");
  const renameInput = $id("rename-name");
  const renameError = (value) => {
    if (!value) return "Please enter your name.";
    if (value.length < 2 || value.length > 50 || /\d/.test(value))
      return "Use 2–50 letters, without numbers.";
    return "";
  };
  renameInput.addEventListener("blur", () =>
    NS.setFieldState(renameInput, renameError(renameInput.value.trim())),
  );
  renameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!NS.setFieldState(renameInput, renameError(renameInput.value.trim()))) {
      NS.toastFormErrors(renameForm, [renameInput]);
      renameInput.focus();
      return;
    }
    if (NSAuth.renameUser(renameInput.value)) {
      renderPass();
      NSAuth.renderNav();
      NS.clearFieldStates(renameForm);
      NS.toast("Your display name was updated.", { title: "Saved" });
    } else {
      NS.toast("Browser storage is unavailable, nothing was saved.", {
        type: "error",
      });
    }
  });

  /* ---------- log out / delete account ---------- */
  $id("profile-logout").addEventListener("click", () => {
    NSAuth.logOut();
    NS.flash("You are logged out. See you soon!", { type: "info" });
    location.href = "index.html";
  });
  confirmClick($id("delete-account"), "Click again to delete", () => {
    NSAuth.deleteAccount();
    NS.flash("Your demo account and its saved data were deleted.", {
      type: "info",
    });
    location.href = "index.html";
  });

  document.addEventListener("ns:data", () => {
    renderStats();
  });
  renderAll();
});
