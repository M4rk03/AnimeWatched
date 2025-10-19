// ==================== CONFIG ====================
const form = document.getElementById("authForm");
const signupBtn = document.getElementById("signup");
const loginBtn = document.getElementById("login");
const fb = document.getElementById("feedback");

// ==================== INIT ====================
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

    setTimeout(() => (window.location.href = "index.html"), 1000);
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
