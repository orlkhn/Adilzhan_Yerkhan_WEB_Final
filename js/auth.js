/* =====================================================
   auth.js — demo accounts kept in localStorage (no backend)
   Keys:  ns-users    -> [{ name, email, passHash, passNo, createdAt }]
          ns-session  -> "email of the logged-in user"
   Each account has its own saved data: ns:<email>:favorites / plans / suggestions.
   The password is only scrambled with a simple hash, which is NOT real
   security — the Sign Up page tells the visitor not to use a real password.
   ===================================================== */
(function () {
  "use strict";
  const USERS = "ns-users";
  const SESSION = "ns-session";

  /* ---------- helpers ---------- */
  const users = () => {
    const list = NS.read(USERS, []);
    return Array.isArray(list) ? list : [];
  };

  // Simple demo hash (two FNV-style passes + salt). Not secure, but never stores the plain password.
  function hash(text) {
    const s = "nightshift-demo:" + text;
    let a = 0x811c9dc5;
    let b = 0x1b873593;
    for (let i = 0; i < s.length; i++) {
      a = Math.imul(a ^ s.charCodeAt(i), 16777619) >>> 0;
      b = Math.imul(b + s.charCodeAt(i), 2246822519) >>> 0;
    }
    return a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0");
  }

  const unique = (list) => [...new Set(list)];
  const emit = () => document.dispatchEvent(new CustomEvent("ns:data"));

  // Things saved while browsing as a guest move to the account on login.
  function mergeGuestData(email) {
    let moved = 0;
    const guestFav = NS.read(NS.keyFor("favorites", "guest"), []);
    const guestPlans = NS.read(NS.keyFor("plans", "guest"), []);
    const guestIdeas = NS.read(NS.keyFor("suggestions", "guest"), []);
    if (Array.isArray(guestFav) && guestFav.length) {
      const mine = NS.read(NS.keyFor("favorites", email), []);
      const merged = unique([
        ...(Array.isArray(mine) ? mine : []),
        ...guestFav,
      ]);
      NS.save(NS.keyFor("favorites", email), merged);
      moved += guestFav.length;
    }
    if (Array.isArray(guestPlans) && guestPlans.length) {
      const mine = NS.read(NS.keyFor("plans", email), []);
      NS.save(
        NS.keyFor("plans", email),
        [...guestPlans, ...(Array.isArray(mine) ? mine : [])].slice(0, 10),
      );
      moved += guestPlans.length;
    }
    if (Array.isArray(guestIdeas) && guestIdeas.length) {
      const mine = NS.read(NS.keyFor("suggestions", email), []);
      const combined = [...guestIdeas, ...(Array.isArray(mine) ? mine : [])];
      NS.save(NS.keyFor("suggestions", email), combined.filter((idea,index,list)=>list.findIndex(other=>other.id===idea.id)===index).slice(0,5));
      moved += guestIdeas.length;
    }
    NS.remove(NS.keyFor("suggestions", "guest"));
    NS.remove(NS.keyFor("favorites", "guest"));
    NS.remove(NS.keyFor("plans", "guest"));
    return moved;
  }

  /* ---------- account actions ---------- */
  function signUp({ name, email, password }) {
    const mail = email.trim().toLowerCase();
    if (users().some((user) => user.email === mail)) {
      return {
        ok: false,
        field: "signup-email",
        error: "An account with this email already exists. Try logging in.",
      };
    }
    const list = users();
    const user = {
      name: name.trim(),
      email: mail,
      passHash: hash(password),
      passNo:
        "NS-" +
        hash(mail).slice(0, 4).toUpperCase() +
        "-" +
        String(list.length + 1).padStart(3, "0"),
      createdAt: new Date().toISOString(),
    };
    if (!NS.save(USERS, [...list, user])) {
      return {
        ok: false,
        field: "signup-email",
        error:
          "Browser storage is unavailable, so the account cannot be saved.",
      };
    }
    NS.save(SESSION, mail);
    return { ok: true, user, moved: mergeGuestData(mail) };
  }

  function logIn(email, password) {
    const mail = email.trim().toLowerCase();
    const user = users().find((u) => u.email === mail);
    if (!user || user.passHash !== hash(password)) {
      return {
        ok: false,
        error:
          "Wrong email or password. Check your details or create an account.",
      };
    }
    NS.save(SESSION, mail);
    return { ok: true, user, moved: mergeGuestData(mail) };
  }

  function logOut() {
    NS.remove(SESSION);
    emit();
  }

  function renameUser(name) {
    const me = NS.currentUser();
    if (!me) return false;
    return NS.save(
      USERS,
      users().map((u) =>
        u.email === me.email ? { ...u, name: name.trim() } : u,
      ),
    );
  }

  function deleteAccount() {
    const me = NS.currentUser();
    if (!me) return;
    NS.save(
      USERS,
      users().filter((u) => u.email !== me.email),
    );
    ["favorites", "plans", "suggestions", "draft"].forEach((name) =>
      NS.remove(NS.keyFor(name, me.email)),
    );
    logOut();
  }

  /* ---------- navigation bar (changes for a logged-in user) ---------- */
  function savedCount() {
    return NS.get("favorites", []).length + NS.get("plans", []).length;
  }

  function renderNav() {
    const slot = document.getElementById("nav-account");
    if (!slot) return;
    const page = document.body.dataset.page;
    const user = NS.currentUser();
    slot.replaceChildren();

    if (!user) {
      const login = document.createElement("a");
      login.className = "nav-login";
      login.href = "login.html";
      login.textContent = "Log in";
      if (page === "login") login.setAttribute("aria-current", "page");
      const signup = document.createElement("a");
      signup.className = "btn btn-lime btn-pill";
      signup.href = "signup.html";
      signup.textContent = "Sign up";
      slot.append(login, signup);
      return;
    }

    const profile = document.createElement("a");
    profile.className = "nav-profile";
    profile.href = "profile.html";
    if (page === "profile") profile.setAttribute("aria-current", "page");
    const avatar = document.createElement("span");
    avatar.className = "avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = user.name.charAt(0).toUpperCase();
    const label = document.createElement("span");
    label.textContent = user.name.split(" ")[0];
    const count = savedCount();
    const badge = document.createElement("span");
    badge.className = "count-badge";
    badge.id = "nav-count";
    badge.textContent = count;
    badge.hidden = count === 0;
    badge.setAttribute(
      "aria-label",
      `${count} saved item${count === 1 ? "" : "s"}`,
    );
    profile.append(avatar, label, badge);

    const out = document.createElement("button");
    out.type = "button";
    out.className = "nav-logout";
    out.textContent = "Log out";
    out.addEventListener("click", () => {
      logOut();
      NS.flash("You are logged out. See you soon!", { type: "info" });
      location.href =
        page === "profile"
          ? "index.html"
          : location.pathname.split("/").pop() || "index.html";
    });
    slot.append(profile, out);
  }

  // "Show / Hide" button next to a password field
  function bindPasswordToggle(button, input) {
    button.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "Hide" : "Show";
      button.setAttribute("aria-pressed", String(show));
    });
  }

  window.NSAuth = {
    signUp,
    logIn,
    logOut,
    renameUser,
    deleteAccount,
    renderNav,
    savedCount,
    bindPasswordToggle,
  };

  document.addEventListener("DOMContentLoaded", renderNav);
  document.addEventListener("ns:data", renderNav);
  window.addEventListener("storage", renderNav);
})();
