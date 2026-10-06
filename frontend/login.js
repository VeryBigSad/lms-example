const DEMO_PASSWORD = "python";

if (sessionStorage.getItem("diary_unlocked") === "1") {
  window.location.replace("/");
}

document.getElementById("login-form").addEventListener("submit", function (event) {
  event.preventDefault();
  const errorBox = document.getElementById("login-error");
  if (document.getElementById("password").value !== DEMO_PASSWORD) {
    errorBox.textContent = "Неверный пароль. Попробуйте ещё раз.";
    errorBox.hidden = false;
    return;
  }
  sessionStorage.setItem("diary_unlocked", "1");
  window.location.replace("/");
});
