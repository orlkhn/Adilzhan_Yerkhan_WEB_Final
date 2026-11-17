/* =====================================================
   common.js — shared helpers used by every page
   - safe localStorage (JSON) with per-account scoping
   - toast notifications (jQuery fade effects)
   - form helpers: field state + "please fix these fields" toast
   - mobile menu, sticky-header shadow, FAQ accordion (jQuery slide)
   Exposes everything on window.NS.
   ===================================================== */
(function () {
  "use strict";

  /* ---------- formatting ---------- */
  const money = (value) => "₸" + new Intl.NumberFormat("en-US").format(value);

  const localDate = (offset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
  };

  const categoryName = (category) =>
    ({ slow: "Slow down", social: "Get together", outside: "Step outside" })[
      category
    ] || "All ideas";

  const formatDuration = (minutes) =>
    minutes
      ? Math.floor(minutes / 60) +
        "h " +
        String(minutes % 60).padStart(2, "0") +
        "m"
      : "0 min";

  /* ---------- localStorage (always JSON, never throws) ---------- */
  const read = (key, fallback) => {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      return saved === null ? fallback : saved;
    } catch {
      return fallback;
    }
  };

  const save = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };

  const remove = (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage blocked: nothing to remove */
    }
  };

  // Pictures switch with the theme; photos of named venues are identified honestly.
  const placeImage = (img, item) => {
    if (!img || !item) return;
    const fallback = item.image || "images/nightscape.svg";
    const currentPhoto = () => {
      if (item.photoData) return item.photoData;
      if (!window.NS_USE_PHOTOS) return null;
      return document.documentElement.dataset.theme === "light"
        ? (item.photo || item.photoNight)
        : (item.photoNight || item.photo);
    };
    let failed = false;
    const update = () => {
      const requested = currentPhoto();
      const target = failed ? fallback : (requested || fallback);
      if (img.getAttribute("src") !== target) img.src = target;
    };
    img.addEventListener("error", () => {
      if (failed) return;
      failed = true;
      img.src = fallback;
    });
    update();
    // Track theme changes without duplicating event handlers for every card.
    img.dataset.themeAware = "true";
    img._nsUpdatePhoto = () => { failed = false; update(); };
  };

  /* ---------- who is logged in? ---------- */
  const currentUser = () => {
    const email = read("ns-session", null);
    const users = read("ns-users", []);
    if (!email || !Array.isArray(users)) return null;
    return users.find((user) => user.email === email) || null;
  };

  // Data is stored per account: "ns:guest:favorites" or "ns:anna@mail.com:favorites".
  const scope = () => {
    const user = currentUser();
    return user ? user.email : "guest";
  };
  const keyFor = (name, owner = scope()) => `ns:${owner}:${name}`;

  const get = (name, fallback) => {
    const value = read(keyFor(name), fallback);
    return Array.isArray(fallback) && !Array.isArray(value) ? fallback : value;
  };

  const set = (name, value) => {
    const ok = save(keyFor(name), value);
    if (ok) document.dispatchEvent(new CustomEvent("ns:data"));
    return ok;
  };

  // Each user's own ideas behave as private catalog items across Explore, Plan and Profile.
  // No moderation claim: without a backend, they are visible only on this browser/account.
  const catalog = () => {
    const suggestions = get("suggestions", []);
    const personal = suggestions.filter(x => x && typeof x.name === "string" && ["slow","social","outside"].includes(x.category))
      .map((x, index) => ({
        id: typeof x.id === "string" && x.id.startsWith("personal-") ? x.id : "personal-legacy-"+index,
        name: x.name.slice(0,80), category: x.category, label: "MY PERSONAL PLACE",
        icon: x.category === "outside" ? "tree" : x.category === "social" ? "gamepad" : "coffee",
        price: Math.max(0, Math.min(50000, Number(x.budget)||0)),
        priceNote: "Your own estimate · private idea saved on this device",
        budget: Number(x.budget) === 0 ? 0 : Number(x.budget) <= 2500 ? 1 : Number(x.budget) <= 5500 ? 2 : 3,
        minutes: Math.max(15, Math.min(360, Number(x.minutes)||60)), people: "1–6 people",
        area: String(x.address||"Astana, Kazakhstan").slice(0,120),
        map: String(x.address || x.name + " Astana").slice(0,200),
        image: "images/park.svg", photoData: typeof x.photoData === "string" && x.photoData.startsWith("data:image/jpeg;base64,") ? x.photoData : "",
        description: String(x.reason||"A place you added to your list.").slice(0,500), featured: 100+index,
        personal: true
      }));
    return [...window.NightShiftData, ...personal];
  };

  // Downscale and center-crop large user photos to a consistent 1200:760 card shape.
  // JPEG output strips metadata and keeps each stored photo small enough for localStorage.
  const processPhoto = async file => {
    if (!file) return "";
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw Error("Choose a JPG, PNG or WebP image.");
    if (file.size > 8*1024*1024) throw Error("Photo is too large. Choose an image under 8 MB.");
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve,reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(Error("This photo cannot be opened. Try JPG or PNG."));
        el.src = objectUrl;
      });
      if (!img.naturalWidth || !img.naturalHeight) throw Error("The image is empty.");
      const canvas = document.createElement("canvas");
      canvas.width = 960; canvas.height = 608;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw Error("Image processing is unavailable on this browser.");
      const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
      ctx.drawImage(img, (canvas.width-w)/2, (canvas.height-h)/2, w, h);
      let out = "";
      for (const quality of [.83,.72,.61,.5]) {
        out=canvas.toDataURL("image/jpeg",quality);
        if (out.length <= 260000) break;
      }
      if (out.length > 320000) throw Error("Couldn't compress this photo enough. Try a different image.");
      return out;
    } finally { URL.revokeObjectURL(objectUrl); }
  };

  /* ---------- jQuery fade used by older code ---------- */
  const reveal = (element, duration = 230) => {
    element.hidden = false;
    $(element).stop(true, true).hide().fadeIn(duration);
  };

  /* ---------- toast notifications ---------- */
  const MAX_TOASTS = 3;
  const ICONS = { success: "check", error: "alert", info: "info" };

  function getStack() {
    let stack = document.getElementById("toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.id = "toast-stack";
      stack.className = "toast-stack";
      stack.setAttribute("role", "region");
      stack.setAttribute("aria-label", "Notifications");
      document.body.append(stack);
    }
    return stack;
  }

  /**
   * toast(message, { type: 'success' | 'error' | 'info', title, link: {href, text}, duration })
   * Shows a notification that stays visible while the page is scrolled.
   */
  function toast(message, options = {}) {
    const { type = "success", title = "", link = null } = options;
    const duration = options.duration || (type === "error" ? 7000 : 5000);
    const stack = getStack();

    // The same message is never shown twice at once; repeated clicks just refresh it.
    stack.querySelectorAll(".ns-toast").forEach((old) => {
      if (old.dataset.text === title + message) old.remove();
    });
    while (stack.children.length >= MAX_TOASTS)
      stack.firstElementChild.remove();

    const el = document.createElement("div");
    el.className = "ns-toast is-" + type;
    el.dataset.text = title + message;
    el.setAttribute("role", type === "error" ? "alert" : "status");

    const icon = document.createElement("span");
    icon.className = "ns-toast-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.replaceChildren(NS.icon(ICONS[type] || ICONS.info));

    const body = document.createElement("div");
    body.className = "ns-toast-body";
    if (title) {
      const strong = document.createElement("strong");
      strong.textContent = title;
      body.append(strong);
    }
    const text = document.createElement("span");
    text.textContent = message;
    body.append(text);
    if (link) {
      const a = document.createElement("a");
      a.href = link.href;
      a.textContent = link.text;
      body.append(a);
    }

    const close = document.createElement("button");
    close.type = "button";
    close.className = "toast-close";
    close.setAttribute("aria-label", "Dismiss notification");
    close.textContent = "×";

    el.append(icon, body, close);
    stack.append(el);
    $(el).hide().fadeIn(220); // jQuery effect: toast fades in

    let timer;
    const dismiss = () => {
      clearTimeout(timer);
      $(el)
        .stop(true, true)
        .fadeOut(180, () => el.remove()); // jQuery effect: fades out
    };
    const start = (ms) => {
      clearTimeout(timer);
      timer = setTimeout(dismiss, ms);
    };
    close.addEventListener("click", dismiss);
    el.addEventListener("mouseenter", () => clearTimeout(timer));
    el.addEventListener("mouseleave", () => start(2500));
    start(duration);
    return el;
  }

  // A message that must survive a page change (e.g. "Welcome back" after login).
  function flash(message, options = {}) {
    try {
      sessionStorage.setItem("ns-flash", JSON.stringify({ message, options }));
    } catch {
      /* private mode: skip */
    }
  }

  function showFlash() {
    try {
      const raw = sessionStorage.getItem("ns-flash");
      if (!raw) return;
      sessionStorage.removeItem("ns-flash");
      const data = JSON.parse(raw);
      if (data && data.message) toast(data.message, data.options || {});
    } catch {
      /* ignore broken flash */
    }
  }

  /* ---------- modal pop-up (accessible: focus trap, Esc, backdrop click) ---------- */
  function dialog({ title, message, actions = [] }) {
    const previous = document.activeElement;
    const backdrop = document.createElement("div");
    backdrop.className = "ns-modal-backdrop";
    const box = document.createElement("div");
    box.className = "ns-modal";
    box.setAttribute("role", "alertdialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "ns-modal-title");
    box.setAttribute("aria-describedby", "ns-modal-text");
    const icon = document.createElement("span");
    icon.className = "ns-modal-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.replaceChildren(NS.icon("alert"));
    const h = document.createElement("h2");
    h.id = "ns-modal-title";
    h.textContent = title;
    const p = document.createElement("p");
    p.id = "ns-modal-text";
    p.textContent = message;
    const row = document.createElement("div");
    row.className = "ns-modal-actions";
    const close = () => {
      document.removeEventListener("keydown", onKey);
      $(backdrop)
        .stop(true, true)
        .fadeOut(160, () => {
          backdrop.remove();
          if (previous && previous.focus) previous.focus();
        });
    };
    actions.forEach((action, index) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-pill " + (index === 0 ? "btn-lime" : "btn-ghost");
      b.textContent = action.text;
      b.addEventListener("click", () => {
        close();
        if (action.onClick) action.onClick();
      });
      row.append(b);
    });
    function onKey(event) {
      if (event.key === "Escape") close();
      if (event.key === "Tab") {
        const f = [...box.querySelectorAll("button")];
        const first = f[0],
          last = f[f.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) close();
    });
    document.addEventListener("keydown", onKey);
    box.append(icon, h, p, row);
    backdrop.append(box);
    document.body.append(backdrop);
    $(backdrop).hide().fadeIn(180); // jQuery effect: pop-up fades in
    const firstButton = row.querySelector("button");
    if (firstButton) firstButton.focus();
    return { close };
  }

  /* ---------- form helpers ---------- */
  function setFieldState(input, message) {
    const out = document.getElementById(input.id + "-error");
    if (out) out.textContent = message;
    input.classList.toggle("is-invalid", Boolean(message));
    const filled = input.type === "checkbox" ? false : Boolean(input.value);
    input.classList.toggle("is-valid", !message && filled);
    input.setAttribute("aria-invalid", String(Boolean(message)));
    return !message;
  }

  function clearFieldStates(form) {
    form.querySelectorAll("input, select, textarea").forEach((input) => {
      input.classList.remove("is-valid", "is-invalid");
      input.removeAttribute("aria-invalid");
      const out = document.getElementById(input.id + "-error");
      if (out) out.textContent = "";
    });
  }

  const labelOf = (form, input) => {
    if (input.dataset.label) return input.dataset.label;
    const label = form.querySelector(`label[for="${input.id}"]`);
    return label
      ? label.textContent.replace("*", "").trim()
      : input.name || input.id;
  };

  // Error toast that lists the wrong fields, in addition to the messages under each field.
  function toastFormErrors(form, invalidInputs) {
    const n = invalidInputs.length;
    toast(invalidInputs.map((input) => labelOf(form, input)).join(", "), {
      type: "error",
      title: `Not sent — please fix ${n} field${n === 1 ? "" : "s"}`,
    });
    form.classList.remove("shake");
    void form.offsetWidth; // restart the CSS animation
    form.classList.add("shake");
  }

  /* ---------- page chrome ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    showFlash();

    const header = document.querySelector(".site-header");
    if (header) {
      const onScroll = () =>
        header.classList.toggle("is-scrolled", window.scrollY > 6);
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    const toggle = document.getElementById("menu-toggle");
    const nav = document.getElementById("site-nav");
    if (toggle && nav) {
      const setOpen = (open) => {
        toggle.setAttribute("aria-expanded", String(open));
        nav.classList.toggle("open", open);
      };
      toggle.addEventListener("click", () =>
        setOpen(toggle.getAttribute("aria-expanded") !== "true"),
      );
      nav.addEventListener("click", (event) => {
        if (event.target.closest("a")) setOpen(false);
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setOpen(false);
      });
      window.addEventListener("resize", () => {
        if (window.innerWidth > 991) setOpen(false);
      });
    }

    // jQuery effect: accessible slide accordion; stop(true, true) stops queues on fast clicks.
    document.querySelectorAll(".faq-trigger").forEach((button) =>
      button.addEventListener("click", () => {
        const panel = document.getElementById(
          button.getAttribute("aria-controls"),
        );
        if (!panel) return;
        const closing = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!closing));
        if (closing) {
          $(panel)
            .stop(true, true)
            .slideUp(220, () => (panel.hidden = true));
        } else {
          panel.hidden = false;
          $(panel).stop(true, true).hide().slideDown(240);
        }
      }),
    );
  });

  window.NS = {
    money,
    placeImage,
    catalog,
    processPhoto,
    localDate,
    categoryName,
    formatDuration,
    read,
    save,
    remove,
    get,
    set,
    keyFor,
    scope,
    currentUser,
    reveal,
    toast,
    dialog,
    flash,
    setFieldState,
    clearFieldStates,
    toastFormErrors,
  };
})();
