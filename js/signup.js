/* =====================================================
   signup.js — Sign Up form
   Rules: name 2-50 letters, valid email, password 8+ chars with a letter and
   a digit, matching confirmation, and the "demo only" checkbox.
   Errors appear under each field and as a toast.
   ===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  if (NS.currentUser()) {
    location.replace("profile.html");
    return;
  }

  const form = document.getElementById("signup-form");
  const inputs = [...form.querySelectorAll("input")];
  const fields = Object.fromEntries(inputs.map((el) => [el.id, el]));
  const meter = document.getElementById("strength-bar");
  const meterText = document.getElementById("strength-text");

  NSAuth.bindPasswordToggle(
    document.getElementById("signup-pw-toggle"),
    fields["signup-password"],
  );

  function errorFor(input) {
    const value = input.value.trim();
    switch (input.id) {
      case "signup-name":
        if (!value) return "Please enter your name.";
        if (value.length < 2 || value.length > 50 || /\d/.test(value))
          return "Use 2–50 letters, without numbers.";
        return "";
      case "signup-email":
        if (!value) return "Please enter your email.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value))
          return "Enter a valid email, for example you@example.com.";
        return "";
      case "signup-password":
        if (!input.value) return "Please create a password.";
        if (input.value.length < 8) return "Use at least 8 characters.";
        if (!/[A-Za-z]/.test(input.value) || !/\d/.test(input.value))
          return "Include at least one letter and one number.";
        return "";
      case "signup-confirm":
        if (!input.value) return "Please repeat the password.";
        if (input.value !== fields["signup-password"].value)
          return "The passwords do not match.";
        return "";
      case "signup-agree":
        return input.checked
          ? ""
          : "Please confirm that you will not use a real password.";
      default:
        return "";
    }
  }
  const validate = (input) => NS.setFieldState(input, errorFor(input));

  // Strength 0-4: length, upper+lower case, digit, symbol.
  function strength(password) {
    let level = 0;
    if (password.length >= 8) level++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) level++;
    if (/\d/.test(password)) level++;
    if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) level++;
    return level;
  }
  function renderStrength() {
    const password = fields["signup-password"].value;
    const level = password ? strength(password) : 0;
    meter.dataset.level = level;
    meter.firstElementChild.style.width = level * 25 + "%";
    meterText.textContent = password
      ? ["Very weak", "Weak", "Okay", "Good", "Strong"][level]
      : "Strength";
  }

  inputs.forEach((input) => {
    const event = input.type === "checkbox" ? "change" : "input";
    input.addEventListener("blur", () => validate(input));
    input.addEventListener(event, () => {
      if (input.id === "signup-password") {
        renderStrength();
        if (fields["signup-confirm"].value) validate(fields["signup-confirm"]);
      }
      if (
        input.classList.contains("is-invalid") ||
        input.classList.contains("is-valid")
      )
        validate(input);
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
    const result = NSAuth.signUp({
      name: fields["signup-name"].value,
      email: fields["signup-email"].value,
      password: fields["signup-password"].value,
    });
    if (!result.ok) {
      NS.setFieldState(fields[result.field], result.error);
      NS.toast(result.error, { type: "error", title: "Account not created" });
      fields[result.field].focus();
      return;
    }
    const first = result.user.name.split(" ")[0];
    const extra = result.moved
      ? ` ${result.moved} item${result.moved === 1 ? "" : "s"} you saved as a guest moved here.`
      : "";
    NS.flash(`Account created. Welcome to NightShift, ${first}!${extra}`, {
      title: "You are in",
    });
    location.href = "profile.html";
  });
});
