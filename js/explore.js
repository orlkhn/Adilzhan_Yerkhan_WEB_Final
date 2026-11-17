/* Explore: live DOM-generated cards, search, mood/price filters, sort, favorites. */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const data = NS.catalog();
  const grid = document.getElementById("activity-grid");
  const search = document.getElementById("search-input");
  const budget = document.getElementById("budget-filter");
  const sort = document.getElementById("sort-filter");
  const empty = document.getElementById("empty-state");
  const params = new URLSearchParams(location.search);
  let activeCategory = ["slow", "social", "outside", "saved", "mine"].includes(
    params.get("category"),
  )
    ? params.get("category")
    : "all";
  search.value = (params.get("search") || "").slice(0, 60);
  let favorites = NS.get("favorites", []);
  function cardFor(item) {
    const article = document.createElement("article");
    article.className = "activity-card";
    const visual = document.createElement("div");
    visual.className = "activity-visual";
    const img = document.createElement("img");
    NS.placeImage(img, item);
    img.alt = item.personal ? `Your uploaded photo for ${item.name}` : item.photo ? `Photograph illustrating ${item.name}` : `Illustration of ${item.label.toLowerCase()}`;
    img.loading = "lazy";
    img.width = 1200;
    img.height = 760;
    visual.append(img);
    if (item.photo && !item.personal && item.photoKind === "representative") {
      const cap = document.createElement("span"); cap.className="photo-caption";
      cap.textContent="Illustrative photo"; cap.hidden=true; visual.append(cap);
      img.addEventListener("load",()=>{cap.hidden = img.getAttribute("src") !== item.photo && img.getAttribute("src") !== item.photoNight;});
      img.addEventListener("error",()=>{cap.hidden=true;});
    }
    const tag = document.createElement("span");
    tag.className = "activity-category";
    tag.replaceChildren(
      NS.icon(item.icon),
      " " + NS.categoryName(item.category).toUpperCase(),
    );
    visual.append(tag);
    const favorite = document.createElement("button");
    favorite.type = "button";
    favorite.className = "favorite-btn";
    favorite.dataset.id = item.id;
    favorite.append(NS.icon("heart")); // filled by CSS when aria-pressed="true"
    favorite.setAttribute(
      "aria-label",
      `${favorites.includes(item.id) ? "Remove" : "Save"} ${item.name} ${favorites.includes(item.id) ? "from" : "to"} favorites`,
    );
    favorite.setAttribute("aria-pressed", String(favorites.includes(item.id)));
    visual.append(favorite);
    const info = document.createElement("div");
    info.className = "activity-info";
    const label = document.createElement("span");
    label.className = "eyebrow eyebrow-sm";
    label.textContent = item.label;
    const title = document.createElement("h3");
    title.textContent = item.name;
    const description = document.createElement("p");
    description.textContent = item.description;
    const where = document.createElement("a");
    where.className = "place-where";
    where.href =
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(item.map);
    where.target = "_blank";
    where.rel = "noopener noreferrer";
    where.setAttribute(
      "aria-label",
      `${item.name}: open in Google Maps (new tab)`,
    );
    where.replaceChildren(NS.icon("pin"), " " + item.area + " · Open in Maps");
    const meta = document.createElement("div");
    meta.className = "activity-meta";
    const price = document.createElement("strong");
    price.textContent = item.price
      ? "≈ " + NS.money(item.price) + " / person"
      : "Free";
    const time = document.createElement("span");
    time.textContent = item.minutes + " min";
    meta.append(price, time);
    const note = document.createElement("small");
    note.className = "price-note";
    note.textContent = item.priceNote;
    const link = document.createElement("a");
    link.className = "activity-card-link";
    link.href = "compare.html?add=" + encodeURIComponent(item.id);
    link.replaceChildren("Add to my plan ", NS.icon("arrow"));
    info.append(label, title, description, where, meta, note, link);
    if (item.personal) {
      const mark=document.createElement("p"); mark.className="personal-tag";
      mark.textContent="Your private place · available on this browser"; info.insertBefore(mark,link);
    }
    article.append(visual, info);
    return article;
  }
  function updateFavorites() {
    document.getElementById("favorite-count").textContent = favorites.length;
  }
  function render() {
    let items = data.filter((item) => {
      const query = search.value.trim().toLowerCase();
      return (
        (activeCategory === "all" ||
          (activeCategory === "saved" ? favorites.includes(item.id) :
          activeCategory === "mine" ? item.personal : item.category === activeCategory)) &&
        (budget.value === "all" || String(item.budget) === budget.value) &&
        (!query ||
          `${item.name} ${item.description} ${item.label} ${NS.categoryName(item.category)}`
            .toLowerCase()
            .includes(query))
      );
    });
    const kinds = {
      "price-asc": (a, b) => a.price - b.price,
      "duration-asc": (a, b) => a.minutes - b.minutes,
      name: (a, b) => a.name.localeCompare(b.name),
      featured: (a, b) => a.featured - b.featured,
    };
    items.sort(kinds[sort.value] || kinds.featured);
    const fragment = document.createDocumentFragment();
    items.forEach((item) => fragment.append(cardFor(item)));
    grid.replaceChildren(fragment);
    document.getElementById("result-count").textContent = items.length;
    const emptyTitle = empty.querySelector("h3");
    const emptyText = empty.querySelector("p");
    if (activeCategory === "mine" && !data.some(x=>x.personal)) {
      emptyTitle.textContent="No personal places yet.";
      emptyText.textContent="Visit Suggest to add your first place. It will appear here and in Plan.";
    } else if (activeCategory === "saved" && !favorites.length) {
      emptyTitle.textContent = "No saved places yet.";
      emptyText.textContent =
        "Tap the heart on any card and it will appear here.";
    } else {
      emptyTitle.textContent = "Nothing found.";
      emptyText.textContent = "Try another search or clear the filters.";
    }
    document.getElementById("saved-tab-count").textContent = favorites.length;
    if (items.length) {
      empty.hidden = true;
      $(grid).stop(true, true).css("opacity", 0.4).fadeTo(180, 1);
    } // jQuery fade effect
    else {
      grid.style.opacity = "1";
      empty.hidden = false;
    }
    document.querySelectorAll(".tab-chip").forEach((button) => {
      const active = button.dataset.category === activeCategory;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    updateFavorites();
  }
  function reset() {
    search.value = "";
    budget.value = "all";
    sort.value = "featured";
    activeCategory = "all";
    render();
  }
  [search, budget, sort].forEach((input) =>
    input.addEventListener(input === search ? "input" : "change", render),
  );
  document.querySelectorAll(".tab-chip").forEach((button) =>
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      render();
    }),
  );
  document.getElementById("reset-filters").addEventListener("click", reset);
  document.getElementById("empty-reset").addEventListener("click", reset);
  grid.addEventListener("click", (event) => {
    const button = event.target.closest("button.favorite-btn");
    if (!button) return;
    const id = button.dataset.id;
    favorites = favorites.includes(id)
      ? favorites.filter((x) => x !== id)
      : [...favorites, id];
    NS.set("favorites", favorites);
    button.setAttribute("aria-pressed", String(favorites.includes(id)));
    const item = data.find((x) => x.id === id);
    const saved = favorites.includes(id);
    NS.toast(
      saved
        ? `${item.name} is in your Saved list (${favorites.length}).`
        : `${item.name} was removed from saved places.`,
      {
        type: saved ? "success" : "info",
        title: saved ? "Saved" : "Removed",
        link: saved
          ? NS.currentUser()
            ? { href: "profile.html", text: "Open my profile" }
            : { href: "login.html", text: "Log in to keep it on your profile" }
          : null,
      },
    );
    button.setAttribute(
      "aria-label",
      `${favorites.includes(id) ? "Remove" : "Save"} ${item.name} ${favorites.includes(id) ? "from" : "to"} favorites`,
    );
    updateFavorites();
    if (activeCategory === "saved" && !saved)
      render(); // the card leaves the Saved list
    else
      document.getElementById("saved-tab-count").textContent = favorites.length;
  });
  render();
});
