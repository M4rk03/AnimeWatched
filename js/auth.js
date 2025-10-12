// ==================== CONFIG ====================
const form = document.getElementById("signupForm");
const fb = document.getElementById("feedback");

// ==================== INIT ====================
form.addEventListener("submit", (e) => {
  e.preventDefault();
  fb.style.display = "none";
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const pass = form.password.value;
  const conf = form.confirm.value;
  
  if (!name || !email || !pass || !conf) return err("Compila tutti i campi");
  if (name.length < 3) return err("Nome troppo corto");
  if (!email.includes("@")) return err("Email non valida");
  if (pass.length < 6) return err("Password troppo corta");
  if (pass !== conf) return err("Le password non coincidono");

  // Mock signup success
  const user = { name, email };
  localStorage.setItem("aw_user", JSON.stringify(user));
  fb.style.display = "block";
  fb.style.color = "#bbf7d0";
  fb.textContent = "Registrazione completata! Reindirizzamento...";
  setTimeout(() => {
    window.location.href = "index.html";
  }, 1000);
});

function err(msg) {
  fb.style.display = "block";
  fb.style.color = "#fca5a5";
  fb.textContent = msg;
}
