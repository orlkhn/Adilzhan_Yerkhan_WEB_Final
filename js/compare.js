/* Compare: six-field validated Bootstrap form, live totals, timeline, local-only saved plan.
   jQuery effects: .animate budget meter, .slideUp/.slideDown timeline, .fadeIn status. */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const data = NS.catalog();
  const form = document.getElementById("planner-form");
  const inputs = [...form.querySelectorAll("input,select")];
  const fields = Object.fromEntries(inputs.map((el) => [el.id, el]));
  const today = NS.localDate();
  fields["plan-date"].min = today;
  fields["plan-date"].value = NS.localDate(new Date().getHours() >= 18 ? 1 : 0);
  const selectedIds = NS.get("draft", []);
  let selected = Array.isArray(selectedIds)
    ? selectedIds.filter((id) => data.some((x) => x.id === id)).slice(0, 3)
    : [];
  const status = document.getElementById("save-message");
  function fieldError(input) {
    const id = input.id;
    const v = input.value.trim();
    switch (id) {
      case "plan-name":
        if (!v) return "Please enter your name.";
        if (v.length < 2 || v.length > 50 || /\d/.test(v))
          return "Use 2–50 letters, without numbers.";
        return "";
      case "plan-date":
        if (!v) return "Choose a date.";
        if (v < today) return "The date cannot be in the past.";
        return "";
      case "plan-time":
        if (!v) return "Choose a start time.";
        if (v < "16:00" || v > "23:30")
          return "Choose a time between 16:00 and 23:30.";
        if (
          fields["plan-date"].value === today &&
          new Date(`${today}T${v}:00`).getTime() <= Date.now()
        )
          return "Choose a future time for today.";
        return "";
      case "plan-people":
        if (!v) return "Enter your group size.";
        if (!Number.isInteger(Number(v)) || Number(v) < 1 || Number(v) > 6)
          return "Choose 1 to 6 people.";
        return "";
      case "plan-budget":
        if (!v) return "Enter a budget.";
        if (!Number.isFinite(Number(v)) || Number(v) < 500 || Number(v) > 50000)
          return "Budget must be between ₸500 and ₸50,000.";
        return "";
      case "plan-mood":
        if (!v) return "Choose a mood.";
        return "";
      default:
        return "";
    }
  }
  const validate = (input) => NS.setFieldState(input, fieldError(input));
  inputs.forEach((input) => {
    input.addEventListener("blur", () => validate(input));
    input.addEventListener("input", () => {
      if (
        input.classList.contains("is-invalid") ||
        input.classList.contains("is-valid")
      )
        validate(input);
      renderSummary();
    });
    input.addEventListener("change", () => {
      if (
        input.classList.contains("is-invalid") ||
        input.classList.contains("is-valid")
      )
        validate(input);
      renderSummary();
    });
  });
  function showStatus(message, error = false) {
    status.textContent = message;
    status.classList.toggle("error", error);
    NS.reveal(status, 240);
    NS.toast(message, { type: error ? "error" : "info" }); // also a toast, so it is visible on phones
  }
  function renderChoices() {
    const root = document.getElementById("planner-choices");
    const frag = document.createDocumentFragment();
    const filter = document.getElementById("choice-filter").value;
    const sort = document.getElementById("choice-sort").value;
    const favorites = NS.get("favorites", []);
    let filtered = data.filter(item => filter === "all" ||
      filter === "saved" && favorites.includes(item.id) ||
      filter === "mine" && item.personal || item.category === filter);
    const sorts = { featured:(a,b)=>a.featured-b.featured,
      price:(a,b)=>a.price-b.price, duration:(a,b)=>a.minutes-b.minutes,
      name:(a,b)=>a.name.localeCompare(b.name) };
    filtered = filtered.slice().sort(sorts[sort] || sorts.featured);
    filtered.forEach((item) => {
      const chosen = selected.includes(item.id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-card";
      button.dataset.id = item.id;
      button.setAttribute("aria-pressed", String(chosen));
      button.setAttribute(
        "aria-label",
        (chosen ? "Remove " : "Add ") +
          item.name +
          (chosen ? " from" : " to") +
          " your plan",
      );
      const image = document.createElement("img");
      NS.placeImage(image, item);
      image.alt = "";
      image.width = 72;
      image.height = 72;
      const copy = document.createElement("span");
      copy.className = "choice-copy";
      const name = document.createElement("strong");
      name.textContent = item.name;
      const detail = document.createElement("small");
      detail.textContent =
        (item.price ? NS.money(item.price) : "Free") +
        " / person · " +
        item.minutes +
        " min";
      copy.append(name, detail);
      const icon = document.createElement("span");
      icon.className = "choice-add";
      icon.setAttribute("aria-hidden", "true");
      icon.append(NS.icon(chosen ? "check" : "plus"));
      button.append(image, copy, icon);
      frag.append(button);
    });
    root.replaceChildren(frag);
    if (!filtered.length) {
      const empty=document.createElement("div"); empty.className="planner-choices-empty";
      empty.textContent = filter === "saved" ? "No saved places yet. Open Explore and tap the heart on a card." : filter === "mine" ? "No personal places yet. Add your first place on Suggest." : "No places match this filter.";
      root.append(empty);
    }
    document.getElementById("selected-count").textContent =
      selected.length + " / 3 picked";
  }
  function renderSummary() {
    const people = Math.max(
      1,
      Math.min(6, Number(fields["plan-people"].value) || 2),
    );
    const budget = Math.max(0, Number(fields["plan-budget"].value) || 0);
    const items = selected
      .map((id) => data.find((i) => i.id === id))
      .filter(Boolean);
    const perPerson = items.reduce((sum, item) => sum + item.price, 0);
    const total = perPerson * people;
    const duration =
      items.reduce((sum, item) => sum + item.minutes, 0) +
      Math.max(0, items.length - 1) * 15;
    document.getElementById("summary-total").textContent = NS.money(total);
    document.getElementById("summary-duration").textContent = duration
      ? Math.floor(duration / 60) +
        "h " +
        String(duration % 60).padStart(2, "0") +
        "m"
      : "0 min";
    const percent = budget ? Math.round((perPerson / budget) * 100) : 0;
    const over = items.length > 0 && budget > 0 && perPerson > budget;
    const budgetLabel = document.getElementById("budget-label");
    budgetLabel.textContent = items.length
      ? over
        ? "Over by " + NS.money(perPerson - budget)
        : "Within budget · " + percent + "% used"
      : "Add your first stop";
    const track = document.getElementById("budget-track");
    track.classList.toggle("over-budget", over);
    track.setAttribute("aria-valuenow", String(Math.min(100, percent)));
    // jQuery animate: calculated progress, smoothly corrected during repeated input.
    $("#budget-progress")
      .stop(true, false)
      .animate({ width: Math.max(0, Math.min(100, percent)) + "%" }, 220);
    const timeline = document.getElementById("timeline");
    timeline.replaceChildren();
    if (!items.length) {
      const li = document.createElement("li");
      li.className = "timeline-empty";
      li.textContent = "Your selected stops will appear here.";
      timeline.append(li);
      return;
    }
    const parts = fields["plan-time"].value.split(":").map(Number);
    let cursor =
      Number.isFinite(parts[0]) && Number.isFinite(parts[1])
        ? parts[0] * 60 + parts[1]
        : 1140;
    items.forEach((item, index) => {
      const li = document.createElement("li");
      const time = document.createElement("span");
      time.className = "timeline-time";
      time.textContent =
        String(Math.floor(cursor / 60) % 24).padStart(2, "0") +
        ":" +
        String(cursor % 60).padStart(2, "0");
      const dot = document.createElement("span");
      dot.className = "timeline-dot";
      dot.setAttribute("aria-hidden", "true");
      const info = document.createElement("div");
      const name = document.createElement("span");
      name.className = "timeline-name";
      name.textContent = index + 1 + ". " + item.name;
      const sub = document.createElement("span");
      sub.className = "timeline-sub";
      sub.textContent =
        item.minutes +
        " min · " +
        (item.price ? NS.money(item.price * people) + " total" : "Free");
      info.append(name, sub);
      li.append(time, dot, info);
      timeline.append(li);
      cursor += item.minutes + 15;
    });
  }
  document
    .getElementById("planner-choices")
    .addEventListener("click", (event) => {
      const button = event.target.closest("button.choice-card");
      if (!button) return;
      const id = button.dataset.id;
      if (selected.includes(id)) selected = selected.filter((x) => x !== id);
      else if (selected.length < 3) selected.push(id);
      else {
        const wanted = data.find((x) => x.id === id);
        const last = data.find((x) => x.id === selected[2]);
        const counter = document.getElementById("selected-count");
        counter.classList.remove("shake");
        void counter.offsetWidth;
        counter.classList.add("shake");
        NS.dialog({
          title: "Your night is already full",
          message:
            "A plan has up to 3 stops, and you already picked 3. Remove one stop first, or swap your last stop (" +
            last.name +
            ") for " +
            wanted.name +
            ".",
          actions: [
            { text: "Got it" },
            {
              text: "Swap with " + last.name,
              onClick: () => {
                selected[2] = id;
                NS.set("draft", selected);
                renderChoices();
                renderSummary();
              },
            },
          ],
        });
        return;
      }
      NS.set("draft", selected);
      renderChoices();
      renderSummary();
    });
  document
    .getElementById("timeline-toggle")
    .addEventListener("click", (event) => {
      const button = event.currentTarget,
        panel = document.getElementById("timeline-panel");
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      if (expanded) $(panel).stop(true, true).slideUp(230);
      else $(panel).stop(true, true).slideDown(230);
    });
  document.getElementById("clear-plan").addEventListener("click", () => {
    selected = [];
    NS.set("draft", selected);
    renderChoices();
    renderSummary();
    showStatus("Your selected stops have been cleared.");
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const invalid = inputs.filter((input) => !validate(input));
    if (invalid.length) {
      NS.toastFormErrors(form, invalid);
      invalid[0].focus();
      return;
    }
    if (selected.length === 0) {
      showStatus("Choose at least one activity to save your night.", true);
      document
        .getElementById("planner-choices")
        .scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const chosen = selected
      .map((id) => data.find((item) => item.id === id))
      .filter(Boolean);
    const perPerson = chosen.reduce((sum, item) => sum + item.price, 0);
    const people = Number(fields["plan-people"].value);
    const savedPlan = {
      name: fields["plan-name"].value.trim(),
      date: fields["plan-date"].value,
      time: fields["plan-time"].value,
      people: Number(fields["plan-people"].value),
      budget: Number(fields["plan-budget"].value),
      mood: fields["plan-mood"].value,
      stops: [...selected],
      total: perPerson * people,
      duration:
        chosen.reduce((sum, item) => sum + item.minutes, 0) +
        Math.max(0, chosen.length - 1) * 15,
      createdAt: new Date().toISOString(),
    };
    // newest first; at most 10 plans are kept for each account
    if (!NS.set("plans", [savedPlan, ...NS.get("plans", [])].slice(0, 10))) {
      showStatus(
        "Browser storage is unavailable. Your plan was not saved.",
        true,
      );
      return;
    }
    const name = savedPlan.name;
    form.reset();
    fields["plan-date"].value = NS.localDate(
      new Date().getHours() >= 18 ? 1 : 0,
    );
    NS.clearFieldStates(form);
    selected = [];
    NS.set("draft", selected);
    renderChoices();
    renderSummary();
    status.textContent = `Nice one, ${name}! Your plan was saved. The form is ready for a new evening.`;
    status.classList.remove("error");
    NS.reveal(status, 240);
    NS.toast(
      `${name}, your night is saved: ${NS.money(savedPlan.total)} for ${savedPlan.people} ${savedPlan.people === 1 ? "person" : "people"}.`,
      {
        title: "Plan saved",
        link: NS.currentUser()
          ? { href: "profile.html", text: "See it on my profile" }
          : { href: "login.html", text: "Log in to keep it with your profile" },
      },
    );
  });
  document.getElementById("choice-filter").addEventListener("change", renderChoices);
  document.getElementById("choice-sort").addEventListener("change", renderChoices);
  const preselected = new URLSearchParams(location.search).get("add");
  if (preselected && data.some(i => i.id === preselected) && !selected.includes(preselected)) {
    if (selected.length < 3) { selected.push(preselected); NS.set("draft",selected); }
    else { // Link from Explore/Profile can also request a fourth stop.
      const wanted=data.find(i=>i.id===preselected);
      const last=data.find(i=>i.id===selected[2]);
      NS.dialog({title:"Your plan has three stops",message:`Replace ${last.name} with ${wanted.name}, or keep your current three stops.`,actions:[
        {text:"Keep my plan"},
        {text:"Replace last stop",onClick:()=>{selected[2]=preselected;NS.set("draft",selected);renderChoices();renderSummary();}}
      ]});
    }
  }
  renderChoices();
  renderSummary();
});
