// ==================== CONFIG ====================
const API_URL =
  "https://script.google.com/macros/s/AKfycby8ZsgjY-2TdqjwQ5RKjNNe1A6dt62o4P2cGjYG_wszOwRd9dNlcfeNgjHx2DQuFalzFw/exec";

let selectedAnime = null;
let animeModal, confirmModal;

const loader = document.getElementById("loader");
const main = document.getElementById("maincontent");
var user = { id: 1};

// ==================== INIT ====================
if (localStorage.getItem("aw_user")) {
  user = JSON.parse(localStorage.getItem("aw_user"));
}

if (
  document.getElementById("visti") &&
  document.getElementById("davedere") &&
  document.getElementById("incorso")
) {
  document.addEventListener("DOMContentLoaded", () => {
    animeModal = new bootstrap.Modal(document.getElementById("animeModal"));
    confirmModal = new bootstrap.Modal(document.getElementById("confirmModal"));

    // Filtri visualizzazione
    document.querySelectorAll("#change-state .btn-theme").forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        document
          .querySelectorAll("#change-state .btn-theme")
          .forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");

        const target = this.getAttribute("href");
        document.querySelectorAll(".show-all").forEach((section) => {
          section.style.display = target === ".show-all" ? "block" : "none";
        });

        if (target !== ".show-all") {
          const selected = document.querySelector(target);
          if (selected) selected.parentElement.style.display = "block";
        }
      });
    });
  });
  loadAnime();
} else {
  toggleLoader(false);
}

// ==================== UTILS ====================
function toggleLoader(show = true) {
  loader.style.display = show ? "flex" : "none";
  main.style.visibility = show ? "hidden" : "visible";
}

function setDate(d) {
  if (!d) return "?";
  const date = new Date(d);
  return date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function showToast(message, type = "success") {
  const toastEl = document.getElementById("toastMsg");
  toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
  toastEl.querySelector(".toast-body").textContent = message;
  new bootstrap.Toast(toastEl).show();
}

function resetSections() {
  ["visti", "davedere", "incorso"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });
}

// ==================== API HELPER ====================
async function postToAPI(payload) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    // return await res.json();
  } catch (err) {
    console.error("Errore API:", err);
    return { status: "error", message: "Errore di rete o server" };
  }
}

// ==================== LOAD ANIME ====================
async function loadAnime(forceReload = false) {
  toggleLoader(true);

  try {
    let data = null;
    if (!forceReload && sessionStorage.getItem("animeData")) {
      data = JSON.parse(sessionStorage.getItem("animeData"));
    }

    if (!data) {
      const res = await fetch(API_URL);
      data = await res.json();
      data = data.filter((anime) => Number(anime.utente) === Number(user.id));
      sessionStorage.setItem("animeData", JSON.stringify(data));
    }

    resetSections();

    const grouped = data.reduce((acc, anime) => {
      const rootId = anime.stagione_id || anime.id;
      acc[rootId] = acc[rootId] || [];
      acc[rootId].push(anime);
      return acc;
    }, {});

    // ordina gruppi per il nome del primo anime
    const groupedArray = Object.values(grouped).sort((a, b) =>
      a[0].nome.localeCompare(b[0].nome)
    );

    Object.values(groupedArray).forEach((group) => {
      group.sort((a, b) => (a.stagione || 0) - (b.stagione || 0));

      let statoFinale = "Visto";
      let activeIndex = group.length - 1;

      if (group.some((a) => a.stato === "In corso")) {
        statoFinale = "In corso";
        activeIndex = group.findIndex((a) => a.stato === "In corso");
      } else if (group.some((a) => a.stato === "Da vedere")) {
        statoFinale = "Da vedere";
        activeIndex = group.findIndex((a) => a.stato === "Da vedere");
      }

      const activeSeason = group[activeIndex];
      const div = document.createElement("div");
      div.className = "col-lg-2 col-md-3 col-sm-4 col-6";

      const options = group
        .map(
          (s, i) => `<option value="${i}" ${
            i === activeIndex ? "selected" : ""
          }>
            ${
              s.tipo === "Movie"
                ? s.stagione
                  ? "" + s.stagione
                  : 0
                : s.stagione
                ? "S" + s.stagione
                : 0
            }
          </option>`
        )
        .join("");

      div.innerHTML = `
        <div class="card grid-item h-100">
          <div class="cont-img">
            <img src="${activeSeason.copertina}" class="card-img-top" alt="${
        activeSeason.nome
      }">
          </div>
          <div class="card-body p-2">
            <h5 class="card-title">${activeSeason.nome}</h5>
            ${
              group.length > 1
                ? `<select class="form-select form-select-sm card-season text-center mt-2">${options}</select>`
                : ""
            }
          </div>
        </div>
      `;

      const img = div.querySelector("img");
      const title = div.querySelector(".card-title");
      const select = div.querySelector("select");

      if (select) {
        select.addEventListener("change", (e) => {
          const s = group[e.target.value];
          img.src = s.copertina || "./assets/default.png";
          title.textContent = s.nome;
        });
      }

      div.querySelector(".card").addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() === "select") return;
        const idx = select ? select.value : activeIndex;
        selectedAnime = group[idx];
        openModal(selectedAnime);
      });

      const statoToId = {
        Visto: "visti",
        "In corso": "incorso",
        "Da vedere": "davedere",
      };
      document.getElementById(statoToId[statoFinale])?.appendChild(div);
    });

    const resultsContainer = document.getElementById("results");
    resultsContainer.classList.remove("open");
    resultsContainer.parentElement.style.display = "none";
  } catch (err) {
    console.error("Errore caricamento anime:", err);
    showToast("Errore durante il caricamento degli anime", "danger");
  } finally {
    toggleLoader(false);
  }
}

// ==================== MODAL FUNCTIONS ====================
function openModal(anime) {
  selectedAnime = anime;
  const fields = {
    modalNome: anime.nome,
    modalImg: anime.copertina || "./assets/default.png",
    modalCopertina: anime.copertina || "",
    modalStato: anime.stato,
    modalTipo: anime.tipo,
    modalStagione: anime.stagione,
    modalEpisodi: anime.episodi,
    modalEpisodiTOT: anime.episodi_tot,
    modalData: anime.data?.split("T")[0],
    modalFine: anime.fine,
  };

  for (const [id, value] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (el) el.tagName === "IMG" ? (el.src = value) : (el.value = value);
    el?.id === "modalEpisodi" &&
      el.setAttribute("max", String(fields.modalEpisodiTOT));
  }

  animeModal.show();
}

function openConfirmModal(anime) {
  selectedAnime = anime;
  document.getElementById("confirmNome").value =
    anime.title_english ?? anime.title;
  document.getElementById("confirmImg").src =
    anime.images?.jpg?.image_url || "";
  document.getElementById("confirmStato").selectedIndex = 0;
  confirmModal.show();
}

// ==================== ADD / SAVE / DELETE ====================
async function addAnime() {
  if (!selectedAnime) return;

  toggleLoader(true);
  let message = "";

  try {
    const nome = document.getElementById("confirmNome").value.trim();
    const copertina = document.getElementById("confirmImg").src;
    const stato = document.getElementById("confirmStato").value.trim();

    if (!nome || !copertina || !stato) {
      message = "Compila tutti i campi!";
      return;
    }

    const payload = {
      action: "add",
      id: selectedAnime.mal_id,
      nome,
      copertina,
      stato,
      tipo: selectedAnime.type || "",
      episodi: stato === "Visto" ? selectedAnime.episodes : 0,
      episodi_tot: selectedAnime.episodes || 0,
      data: selectedAnime.aired?.from?.split("T")[0] || "",
      fine: selectedAnime.status || "",
      utente: user.id || 1,
    };

    await postToAPI(payload);
    confirmModal.hide();
    sessionStorage.removeItem("animeData");
    await loadAnime(true);
    message = "Anime aggiunto alla lista!";
  } catch (err) {
    console.error(err);
    message = "Errore durante l'aggiunta";
  } finally {
    toggleLoader(false);
    showToast(message);
  }
}

async function saveAnime() {
  if (!selectedAnime) return;

  toggleLoader(true);
  let message = "";

  try {
    const payload = {
      action: "update",
      id: selectedAnime.id,
      nome: document.getElementById("modalNome").value.trim(),
      copertina: document.getElementById("modalCopertina").value.trim(),
      stato: document.getElementById("modalStato").value.trim(),
      tipo: document.getElementById("modalTipo").value.trim(),
      stagione: document.getElementById("modalStagione").value.trim(),
      stagione_id: selectedAnime.stagione_id || "",
      episodi:
        document.getElementById("modalStato").value.trim() === "Visto"
          ? document.getElementById("modalEpisodiTOT").value.trim()
          : document.getElementById("modalEpisodi").value.trim(),
      episodi_tot: document.getElementById("modalEpisodiTOT").value.trim(),
      data: document.getElementById("modalData").value.trim(),
      fine: document.getElementById("modalFine").value.trim(),
      utente: user.id || 1,
    };

    await postToAPI(payload);
    animeModal.hide();
    sessionStorage.removeItem("animeData");
    await loadAnime(true);
    message = "Anime modificato!";
  } catch (err) {
    console.error(err);
    message = "Errore durante il salvataggio";
  } finally {
    toggleLoader(false);
    showToast(message);
  }
}

async function deleteAnime() {
  if (!selectedAnime) return;

  toggleLoader(true);
  let message = "";

  try {
    const payload = { action: "delete", id: selectedAnime.id };
    await postToAPI(payload);
    animeModal.hide();
    sessionStorage.removeItem("animeData");
    await loadAnime(true);
    message = "Anime eliminato dalla lista!";
  } catch (err) {
    console.error(err);
    message = "Errore durante l'eliminazione";
  } finally {
    toggleLoader(false);
    showToast(message);
  }
}

// ==================== SEARCH ====================
async function searchAnime(event) {
  event.preventDefault();
  const title = document.getElementById("animeTitle").value.trim();
  if (!title) return;

  const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}`;
  const container = document.getElementById("results");

  try {
    const response = await fetch(url);
    const data = await response.json();
    container.innerHTML = "";
    data.data.forEach((anime) =>
      container.appendChild(createSearchCard(anime))
    );
    container.classList.add("open");
    container.parentElement.style.display = "block";
  } catch (err) {
    console.error(err);
    showToast("Errore durante la ricerca anime", "danger");
  }
}

function createSearchCard(anime) {
  const card = document.createElement("div");
  card.className = "col-md-10 col-lg-6";

  const title = anime.title_english ?? anime.title;
  const year = anime.year ?? "?";
  const type = anime.type ?? "?";
  const episodes = anime.episodes ?? "?";
  const status = anime.status ?? "?";
  const date = setDate(anime.aired?.from);
  const synopsis = anime.synopsis ?? "";

  card.innerHTML = `
    <div class="card search-item">
      <div class="d-grid align-items-center mb-2">
        <div class="search-img text-center">
          <img src="${anime.images?.jpg?.image_url}" alt="${title}">
        </div>
        <div class="search-body p-2">
          <h3 class="card-title text-start mb-3">${title} (${year})</h3>
          <ul class="list-group">
            <li><b>Tipo:</b> ${type}</li>
            <li><b>Episodi:</b> ${episodes}</li>
            <li><b>Stato:</b> ${status}</li>
            <li><b>Data:</b> ${date}</li>
          </ul>
        </div>
      </div>
      <div class="search-desc p-2">
        <button class="btn btn-link p-0" data-bs-toggle="collapse"
                data-bs-target="#collapse${anime.mal_id}"
                aria-expanded="false" aria-controls="collapse${anime.mal_id}">
          <b>Trama</b>
        </button>
        <div id="collapse${anime.mal_id}" class="collapse">
          <div class="py-2">${synopsis}</div>
        </div>
        <div style="float: right;">
          <button class="btn btn-gradient btn-save">Salva</button>
        </div>
      </div>
    </div>
  `;

  card
    .querySelector(".btn-save")
    .addEventListener("click", () => openConfirmModal(anime));
  return card;
}

// ==================== UPDATE ANIME (API) ====================
async function updateSavedAnime() {
  animeModal.hide();

  // Se non esiste la barra di avanzamento, la creo dinamicamente
  let progressContainer = document.getElementById("progressContainer");
  if (!progressContainer) {
    progressContainer = document.createElement("div");
    progressContainer.id = "progressContainer";
    progressContainer.innerHTML = `
      <div class="progress my-4" style="height: 25px;">
        <div id="progressBar" class="progress-bar progress-bar-striped progress-bar-animated bg-success" 
             role="progressbar" style="width: 0%">0%</div>
      </div>
      <p id="progressText" class="text-center fw-bold mb-0">Preparazione...</p>
    `;
    document.body.appendChild(progressContainer);
  }

  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  try {
    // Carica anime dal tuo database (Google Sheet)
    const res = await fetch(API_URL);
    const savedAnime = await res.json();
    const total = savedAnime.length;
    let completed = 0;
    let updatedCount = 0;

    // Aggiorna in blocchi (evita rate limit)
    const chunkSize = 10;

    for (let i = 0; i < total; i += chunkSize) {
      const chunk = savedAnime.slice(i, i + chunkSize);

      await Promise.all(
        chunk.map(async (anime) => {
          try {
            if (!anime.id) return;

            // Ottieni dati aggiornati da Jikan API
            const apiRes = await fetch(
              `https://api.jikan.moe/v4/anime/${anime.id}`
            );
            const apiData = await apiRes.json();
            const apiAnime = apiData.data;
            if (!apiAnime) return;

            // Controlla differenze
            const changed =
              anime.episodi_tot != apiAnime.episodes ||
              anime.fine != apiAnime.status;

            if (changed) {
              updatedCount++;

              const payload = {
                action: "update",
                id: anime.id,
                nome: anime.come,
                copertina: anime.copertina,
                stato: anime.stato,
                tipo: anime.tipo,
                stagione: anime.stagione,
                stagione_id: anime.stagione_id,
                episodi: apiAnime.episodes_aired ?? anime.episodi,
                episodi_tot: apiAnime.episodes ?? anime.episodi_tot,
                data: apiAnime.aired?.from ?? anime.data,
                fine: apiAnime.status ?? anime.fine,
              };

              await fetch(API_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });

              console.log(`✅ Aggiornato: ${anime.nome}`);
            }
          } catch (err) {
            console.warn(`⚠️ Errore aggiornando ${anime.nome}`, err);
          } finally {
            completed++;
            const percent = Math.floor((completed / total) * 100);
            progressBar.style.width = percent + "%";
            progressBar.textContent = percent + "%";
            progressText.textContent = `Aggiornamento ${completed}/${total} anime...`;
          }
        })
      );

      // Pausa per non sovraccaricare l’API
      await new Promise((r) => setTimeout(r, 3000));
    }

    progressText.textContent = `✅ Aggiornamento completato: ${updatedCount} anime aggiornati su ${total}`;
    showToast(`✅ Aggiornati ${updatedCount} anime!`);
    await loadAnime(true);
  } catch (err) {
    console.error("Errore aggiornamento anime:", err);
    showToast("❌ Errore durante l'aggiornamento", "danger");
    progressText.textContent = "❌ Errore durante l'aggiornamento!";
    progressBar.classList.replace("bg-success", "bg-danger");
  } finally {
    toggleLoader(false);
    progressContainer.remove();
  }
}
