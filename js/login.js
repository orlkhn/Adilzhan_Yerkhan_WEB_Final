/* =====================================================
   login.js — Log In form
   Validates fields, checks the account in localStorage, shows errors under
   the fields AND as a toast, then redirects to the Profile page.
   ===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  if (NS.currentUser()) {
    location.replace("profile.html");
    return;
  }

  const form = document.getElementById("login-form");
  const inputs = [...form.querySelectorAll("input")];
  const fields = Object.fromEntries(inputs.map((el) => [el.id, el]));
  const params = new URLSearchParams(location.search);

  if (params.get("msg") === "login-required") {
    NS.toast("Log in or create a free demo account to open your profile.", {
      type: "info",
      title: "Profile is private",
    });
  }
  NSAuth.bindPasswordToggle(
    document.getElementById("login-pw-toggle"),
    fields["login-password"],
  );

  function errorFor(input) {
    const value = input.value.trim();
    if (input.id === "login-email") {
      if (!value) return "Please enter your email.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value))
        return "Enter a valid email, for example you@example.com.";
    }
    if (input.id === "login-password" && !input.value)
      return "Please enter your password.";
    return "";
  }
  const validate = (input) => NS.setFieldState(input, errorFor(input));

  inputs.forEach((input) => {
    input.addEventListener("blur", () => validate(input));
    input.addEventListener("input", () => {
      if (input.classList.contains("is-invalid")) validate(input);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const invalid = inputs.filter((input) => !validate(input));
    if (invalid.length) {
      NS.toastFormErrors(form, invalid);
      invalid[0].focus();
      return;
    }
    const result = NSAuth.logIn(
      fields["login-email"].value,
      fields["login-password"].value,
    );
    if (!result.ok) {
      NS.setFieldState(fields["login-password"], result.error);
      NS.toast(result.error, { type: "error", title: "Login failed" });
      form.classList.remove("shake");
      void form.offsetWidth;
      form.classList.add("shake");
      fields["login-password"].focus();
      return;
    }
    const first = result.user.name.split(" ")[0];
    const extra = result.moved
      ? ` ${result.moved} item${result.moved === 1 ? "" : "s"} saved as a guest moved to your profile.`
      : "";
    NS.flash(`Welcome back, ${first}!${extra}`, { title: "Logged in" });
    const next = params.get("next");
    location.href = /^[a-z]+\.html$/.test(next || "") ? next : "profile.html";
  });
});
