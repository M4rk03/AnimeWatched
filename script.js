const API_URL =
  "https://script.google.com/macros/s/AKfycby8ZsgjY-2TdqjwQ5RKjNNe1A6dt62o4P2cGjYG_wszOwRd9dNlcfeNgjHx2DQuFalzFw/exec";

let selectedAnime = null;
let animeModal;

document.addEventListener("DOMContentLoaded", () => {
  animeModal = new bootstrap.Modal(document.getElementById("animeModal"));
});

function openModal(anime) {
  selectedAnime = anime;
  document.getElementById("modalNome").value = anime.nome;
  document.getElementById("modalImg").src = anime.copertina;
  document.getElementById("modalCopertina").value = anime.copertina;
  document.getElementById("modalStato").value = anime.stato;
  animeModal.show();
}

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

async function addAnime() {
  const nome = document.getElementById("nome").value.trim();
  const copertina = document.getElementById("copertina").value.trim();
  const stato = document.getElementById("stato").value.trim();

  if (nome && copertina && stato) {
    const response = await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({
        action: "add",
        nome: nome,
        copertina: copertina,
        stato: stato,
      }),
      headers: { "Content-Type": "application/json" },
    });

    // reset campi input
    document.getElementById("nome").value = "";
    document.getElementById("copertina").value = "";
    document.getElementById("stato").value = "";

    loadAnime();
  } else {
    alert("Compila tutti i campi!");
  }
}

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
