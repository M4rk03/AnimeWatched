// ==================== CONFIG ====================
const form = document.getElementById("authForm");
const signupBtn = document.getElementById("signup");
const loginBtn = document.getElementById("login");
const fb = document.getElementById("feedback");

const togglePwd = document.getElementById("togglePwd");
const pwdInput = document.getElementById("password");
const eyeIcon = document.getElementById("eyeIcon");

// ==================== INIT ====================
togglePwd.addEventListener("click", () => {
  const isHidden = pwdInput.type === "password";
  pwdInput.type = isHidden ? "text" : "password";
  togglePwd.setAttribute(
    "aria-label",
    isHidden ? "Nascondi password" : "Mostra password"
  );

  // cambia l’icona
  eyeIcon.innerHTML = isHidden
    ? `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.933 13.909A4.357 4.357 0 0 1 3 12c0-1 4-6 9-6m7.6 3.8A5.068 5.068 0 0 1 21 12c0 1-3 6-9 6-.314 0-.62-.014-.918-.04M5 19 19 5m-4 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>`
    : `<path stroke="currentColor" stroke-width="2" d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z"/><path stroke="currentColor" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>`;
});

if (signupBtn) {
  signupBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    fb.style.display = "none";
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const pass = form.password.value;
    const conf = form.confirm.value;

    if (!name || !email || !pass || !conf) return err("Compila tutti i campi");
    if (name.length < 3) return err("Nome troppo corto");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return err("Email non valida");
    const pwdRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
    if (!pwdRe.test(pass))
      return err(
        "La password deve essere lunga almeno 8 caratteri e contenere minuscole, maiuscole, numeri e caratteri speciali"
      );
    if (pass !== conf) return err("Le password non coincidono");

    // Controlla se email esiste già
    const exists = await emailExists(email);
    if (exists) return err("Email già registrata!");

    try {
      const hashHex = await hashPwd(pass);

      const res = await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          username: name,
          email,
          password: hashHex,
        }),
      });

      // Controlla credenziali
      const access = await login(email, hashHex);
      success(
        access,
        "Registrazione avvenuta con successo! Accesso in corso..."
      );
    } catch (error) {
      console.error(error);
      err("Errore di connessione al server.");
    }
  });
}

if (loginBtn) {
  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    fb.style.display = "none";
    const email = form.email.value.trim();
    const pass = form.password.value;

    if (!email || !pass) return err("Compila tutti i campi");

    try {
      const hashHex = await hashPwd(pass);

      // Controlla credenziali
      const access = await login(email, hashHex);
      success(access, "Accesso in corso...");
    } catch (error) {
      console.error(error);
      err("Errore di connessione al server.");
    }
  });
}

function err(msg) {
  fb.style.display = "block";
  fb.style.color = "#fca5a5";
  fb.textContent = msg;
}

function success(access, msg) {
  if (access.success) {
    fb.style.display = "block";
    fb.style.color = "#bbf7d0";
    fb.textContent = msg;
    localStorage.setItem(
      "aw_user",
      JSON.stringify({
        id: access.user.id,
        user: access.user.user,
        email: access.user.email,
      })
    );

    setTimeout(() => (window.location.href = "../"), 1000);
  } else {
    err("Credenziali non valide.");
  }
}

// Calcola SHA-256 della password e invia l'hash (senza salt)
async function hashPwd(pass) {
  const enc = new TextEncoder();
  const data = enc.encode(pass);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ==================== EMAIL EXISITS ====================
async function emailExists(email) {
  try {
    const res = await fetch(
      `${API_URL}?action=emailExists&email=${encodeURIComponent(email)}`
    );
    const data = await res.json();
    return data.exists;
  } catch (err) {
    console.error("Errore nel controllo email:", err);
    return false;
  }
}

// ==================== LOGIN ====================
async function login(email, pwd) {
  try {
    const res = await fetch(
      `${API_URL}?action=login&email=${encodeURIComponent(
        email
      )}&pwd=${encodeURIComponent(pwd)}`
    );
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Errore di accesso:", err);
    return false;
  }
}
