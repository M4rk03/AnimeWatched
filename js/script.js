// Variabili

const API_URL =
  "https://script.google.com/macros/s/AKfycby8ZsgjY-2TdqjwQ5RKjNNe1A6dt62o4P2cGjYG_wszOwRd9dNlcfeNgjHx2DQuFalzFw/exec";

let selectedAnime = null;
let animeModal;
let confirmModal;

var loader = document.getElementById("loader");
var main = document.getElementById("maincontent");

// Funzioni

document.addEventListener("DOMContentLoaded", () => {
  animeModal = new bootstrap.Modal(document.getElementById("animeModal"));
  confirmModal = new bootstrap.Modal(document.getElementById("confirmModal"));
});

function openModal(anime) {
  selectedAnime = anime;
  document.getElementById("modalNome").value = anime.nome;
  document.getElementById("modalImg").src = anime.copertina;
  document.getElementById("modalCopertina").value = anime.copertina;
  document.getElementById("modalStato").value = anime.stato;
  document.getElementById("modalTipo").value = anime.tipo;
  document.getElementById("modalStagione").value = anime.stagione;
  document.getElementById("modalEpisodi").value = anime.episodi;
  document.getElementById("modalEpisodiTOT").value = anime.episodi_tot;
  document.getElementById("modalData").value = anime.data.split("T")[0];
  document.getElementById("modalFine").value = anime.fine;

  animeModal.show();
}

function openConfirmModal(anime) {
  selectedAnime = anime;
  document.getElementById("confirmNome").value =
    anime.title_english ?? anime.title;
  document.getElementById("confirmImg").src = anime.images.jpg.image_url;
  document.getElementById("confirmStato").selectedIndex = 0;

  confirmModal.show();
}

// Set data Anime
function setDate(d) {
  let date = new Date(d);

  return (formatted = date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }));
}

// Carica gli Anime dal File DB
async function loadAnime() {
  loader.style.display = "flex";
  main.style.visibility = "hidden";

  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    document.getElementById("visti").innerHTML = "";
    document.getElementById("davedere").innerHTML = "";
    document.getElementById("incorso").innerHTML = "";

    // Raggruppo per "serie principale"
    const grouped = {};
    data.forEach((a) => {
      const rootId = a.stagione_id === 0 ? a.id : a.stagione_id;
      if (!grouped[rootId]) grouped[rootId] = [];
      grouped[rootId].push(a);
    });

    // Creo card per ogni gruppo
    Object.values(grouped).forEach((group) => {
      group.sort((x, y) => (x.stagione || 0) - (y.stagione || 0));

      // Determino lo stato finale della card
      let statoFinale = "Visto";
      let activeIndex = group.length - 1;

      if (group.some((s) => s.stato === "In corso")) {
        statoFinale = "In corso";
        activeIndex = group.findIndex((s) => s.stato === "In corso");
      } else if (group.some((s) => s.stato === "Da vedere")) {
        statoFinale = "Da vedere";
        activeIndex = group.findIndex((s) => s.stato === "Da vedere");
      }

      const activeSeason = group[activeIndex];

      const div = document.createElement("div");
      div.className = "col-lg-2 col-md-3 col-sm-4 col-6";

      // dropdown stagioni
      let options = "";
      group.forEach((s, i) => {
        const selected = i === activeIndex ? "selected" : "";
        options += `<option value="${i}" ${selected}>${
          s.stagione ? "Stagione " + s.stagione : s.nome
        }</option>`;
      });

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
                ? `<select class="form-select form-select-sm mt-2">${options}</select>`
                : ""
            }
          </div>
        </div>
      `;

      const img = div.querySelector("img");
      const title = div.querySelector(".card-title");
      const select = div.querySelector("select");

      // Cambio stagione dal dropdown
      if (select) {
        select.addEventListener("change", (e) => {
          const s = group[e.target.value];
          img.src = s.copertina;
          title.textContent = s.nome;
        });
      }

      // Apri modal con la stagione attiva
      div.querySelector(".card").addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() === "select") return;
        const idx = select ? select.value : activeIndex;
        openModal(group[idx]);
      });

      // Append nella sezione corretta
      if (statoFinale === "Visto")
        document.getElementById("visti").appendChild(div);
      if (statoFinale === "Da vedere")
        document.getElementById("davedere").appendChild(div);
      if (statoFinale === "In corso")
        document.getElementById("incorso").appendChild(div);
    });

    document.getElementById("results").classList.remove("open");
  } catch (err) {
    console.error("Errore caricamento anime:", err);
  } finally {
    loader.style.display = "none";
    main.style.visibility = "visible";
  }
}

// Cerca l'Anime tramite API
async function searchAnime(event) {
  event.preventDefault();

  const title = document.getElementById("animeTitle").value;
  const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}`;

  const response = await fetch(url);
  const data = await response.json();

  const container = document.getElementById("results");
  container.innerHTML = "";

  data.data.forEach((anime) => {
    const card = document.createElement("div");
    card.className = "col-md-10 col-xl-6";

    card.innerHTML = `
      <div class="card search-item">
        <div class="d-grid align-items-center mb-2">
          <div class="search-img text-center">
            <img src="${anime.images.jpg.image_url}" alt="Cover">
          </div>
          <div class="search-body p-2">
            <h3 class="card-title text-start mb-3">${
              anime.title_english ?? anime.title
            } (${anime.year ?? "?"})</h3>
            <ul class="list-group">
              <li><b>Tipo:</b> ${anime.type ?? "?"}</li>
              <li><b>Episodi:</b> ${anime.episodes ?? "?"}</li>
              <li><b>Stato:</b> ${anime.status}</li>
              <li><b>Data:</b> ${setDate(anime.aired.from)}</li>
            </ul>
          </div>
        </div>
        <div class="search-desc p-2">
          <button class="btn btn-link p-0"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapse${anime.mal_id}"
                  aria-expanded="false"
                  aria-controls="collapse${anime.mal_id}">
            <b>Trama</b>
          </button>
          <div id="collapse${anime.mal_id}" class="collapse">
            <div class="py-2">${anime.synopsis ?? ""}</div>
          </div>
          <div style="float: right;">
            <button class="btn btn-gradient btn-save mt-2" style="float: right;">
              Salva
            </button>
          </div>
        </div>
      </div>
    `;

    card
      .querySelector(".btn-save")
      .addEventListener("click", () => openConfirmModal(anime));
    container.appendChild(card);
  });

  container.classList.add("open");
}

// Aggiunge gli Anime al File DB
async function addAnime(response) {
  if (!selectedAnime) return;
  if (!response) return;

  // active loader
  loader.style.display = "flex";
  main.style.visibility = "hidden";
  let message = "";

  try {
    const nome = document.getElementById("confirmNome").value;
    const copertina = document.getElementById("confirmImg").src;
    const stato = document.getElementById("confirmStato").value.trim();

    if (nome && copertina && stato) {
      const response = await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          action: "add",
          nome: nome,
          copertina: copertina,
          stato: stato,
          tipo: selectedAnime.type,
          episodi:
            selectedAnime.status == "Finished Airing"
              ? selectedAnime.episodes
              : 0,
          episodi_tot: selectedAnime.episodes,
          data: selectedAnime.aired.from.split("T")[0],
          fine: selectedAnime.status,
        }),
        headers: { "Content-Type": "application/json" },
      });

      // reset campi input
      stato.selectedIndex = 0;

      confirmModal.hide();
      loadAnime();
      message = "Anime aggiunto alla lista";
    } else {
      message = "Compila tutti i campi!";
    }
  } catch (err) {
    console.error("Errore caricamento anime:", err);
  } finally {
    // close loader
    loader.style.display = "none";
    main.style.visibility = "visible";
  }

  alert(message);
}

// Salva le modifiche dell'Anime sul File DB
async function saveAnime() {
  if (!selectedAnime) return;

  // active loader
  loader.style.display = "flex";
  main.style.visibility = "hidden";

  try {
    const nuovoNome = document.getElementById("modalNome").value;
    const nuovaCopertina = document.getElementById("modalCopertina").value;
    const nuovoStato = document.getElementById("modalStato").value;
    const nuovoTipo = document.getElementById("modalTipo").value;
    const nuovaStaione = document.getElementById("modalStagione").value;
    const nuovoEpisodi = document.getElementById("modalEpisodi").value;
    const nuovoEpTot = document.getElementById("modalEpisodiTOT").value;
    const nuovaData = document.getElementById("modalData").value;
    const nuovoFine = document.getElementById("modalFine").value;

    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({
        action: "update",
        id: selectedAnime.id,
        nome: nuovoNome,
        copertina: nuovaCopertina,
        stato: nuovoStato,
        tipo: nuovoTipo,
        stagione: nuovaStaione,
        stagione_id: selectedAnime.stagione_id,
        episodi: nuovoEpisodi,
        episodi_tot: nuovoEpTot,
        data: nuovaData,
        fine: nuovoFine,
      }),
      headers: { "Content-Type": "application/json" },
    });

    animeModal.hide();
    loadAnime();
  } catch (err) {
    console.error("Errore caricamento anime:", err);
  } finally {
    // close loader
    loader.style.display = "none";
    main.style.visibility = "visible";
  }

  alert("Anime modificato");
}

// Elimina l'Anime dal File DB
async function deleteAnime() {
  if (!selectedAnime) return;

  // active loader
  loader.style.display = "flex";
  main.style.visibility = "hidden";

  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({ action: "delete", id: selectedAnime.id }),
      headers: { "Content-Type": "application/json" },
    });

    animeModal.hide();
    loadAnime();
  } catch (err) {
    console.error("Errore caricamento anime:", err);
  } finally {
    // close loader
    loader.style.display = "none";
    main.style.visibility = "visible";
  }

  alert("Anime eliminato dalla lista");
}

loadAnime();
