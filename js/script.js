const API_URL =
  "https://script.google.com/macros/s/AKfycby8ZsgjY-2TdqjwQ5RKjNNe1A6dt62o4P2cGjYG_wszOwRd9dNlcfeNgjHx2DQuFalzFw/exec";

let selectedAnime = null;
let animeModal;
let confirmModal;

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
  animeModal.show();
}

function openConfirmModal(anime) {
  selectedAnime = anime;
  document.getElementById("confirmNome").value = anime.title_english ?? anime.title;
  document.getElementById("confirmImg").src = anime.images.jpg.image_url;
  document.getElementById("confirmStato").selectedIndex = 0;
  confirmModal.show();
}

// Carica gli Anime dal File DB
async function loadAnime() {
  const res = await fetch(API_URL);
  const data = await res.json();

  document.getElementById("visti").innerHTML = "";
  document.getElementById("davedere").innerHTML = "";
  document.getElementById("incorso").innerHTML = "";

  data.forEach((a) => {
    const div = document.createElement("div");
    div.className = "col-6 col-sm-4 col-md-3 col-lg-2";
    div.innerHTML = `
            <div class="card grid-item h-100">
              <div class="cont-img">
                <img src="${a.copertina}" class="card-img-top" alt="${a.nome}">
              </div>
              <div class="card-body p-2">
                <h5 class="card-title">${a.nome}</h5>
              </div>
            </div>
          `;

    div.querySelector(".card").addEventListener("click", () => openModal(a));

    if (a.stato === "Visto") document.getElementById("visti").appendChild(div);
    if (a.stato === "Da vedere")
      document.getElementById("davedere").appendChild(div);
    if (a.stato === "In corso")
      document.getElementById("incorso").appendChild(div);
  });
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
    card.className = "col-md-10 col-xl-8";

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
              <li><b>Stagione:</b> ${anime.season ?? "-"} ${
      anime.year ?? ""
    }</li>
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
            <div>${anime.synopsis ?? ""}</div>
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
}

// Aggiunge gli Anime al File DB
async function addAnime(response) {
  if (!selectedAnime) return;
  if (!response) return;

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
        stagioni: selectedAnime.season + selectedAnime.year ,
        episodi: selectedAnime.episodes
      }),
      headers: { "Content-Type": "application/json" },
    });

    // reset campi input
    stato.selectedIndex = 0;

    confirmModal.hide();
    loadAnime();
    alert("Anime aggiunto alla lista");
  } else {
    alert("Compila tutti i campi!");
  }
}

// Salva le modifiche dell'Anime sul File DB
async function saveAnime() {
  if (!selectedAnime) return;

  const nuovoNome = document.getElementById("modalNome").value;
  const nuovaCopertina = document.getElementById("modalCopertina").value;
  const nuovoStato = document.getElementById("modalStato").value;

  await fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({
      action: "update",
      id: selectedAnime.id,
      nome: nuovoNome,
      copertina: nuovaCopertina,
      stato: nuovoStato,
    }),
    headers: { "Content-Type": "application/json" },
  });

  animeModal.hide();
  loadAnime();
}

// Elimina l'Anime dal File DB
async function deleteAnime() {
  if (!selectedAnime) return;
  await fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({ action: "delete", id: selectedAnime.id }),
    headers: { "Content-Type": "application/json" },
  });

  animeModal.hide();
  loadAnime();
}

loadAnime();
