// ==================== CONFIG ====================
const dayMap = {
  Mondays: "lunedi",
  Tuesdays: "martedi",
  Wednesdays: "mercoledi",
  Thursdays: "giovedi",
  Fridays: "venerdi",
  Saturdays: "sabato",
  Sundays: "domenica",
};

// ==================== TIME UTILS ====================
function convertToItalyTime(timeJP) {
  const [hour, minute] = timeJP.split(":").map(Number);
  const now = new Date();

  // Orario Tokyo → UTC → Italia
  const tokyoUTC = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hour - 9,
      minute
    )
  );

  return tokyoUTC.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  });
}

// ==================== UI ====================
function createAnimeCard(anime) {
  const col = document.createElement("div");
  col.className = "col-lg-2 col-md-3 col-sm-4 col-6 all-day";

  const image = anime.images?.jpg?.image_url ?? "";
  const title = anime.title;
  const timeJP = anime.broadcast?.time;

  let timeIT = "Orario N/D";
  if (timeJP) timeIT = convertToItalyTime(timeJP);

  col.innerHTML = `
    <div class="card grid-item h-100 shadow-sm">
      <div class="cont-img">
        <img src="${image}" class="card-img-top" alt="${title}">
      </div>
      <div class="card-body p-2">
        <h5 class="card-title">${title}</h5>
        <p class="mt-2 mb-0 text-white text-center small ${timeIT === "Orario N/D" ? "text-muted" : ""}">
          ⏰ ${timeIT}
        </p>
      </div>
    </div>
  `;

  return col;
}

// ==================== DATA ====================
async function fetchAllSchedules() {
  let page = 1;
  let allAnime = [];
  let hasNext = true;

  while (hasNext) {
    const res = await fetch(`https://api.jikan.moe/v4/schedules?page=${page}`);
    const json = await res.json();

    allAnime = allAnime.concat(json.data);

    hasNext = json.pagination.has_next_page;
    page++;
  }

  return allAnime;
}

async function loadWeeklyAnime() {
  const buckets = {
    lunedi: [],
    martedi: [],
    mercoledi: [],
    giovedi: [],
    venerdi: [],
    sabato: [],
    domenica: [],
    generic: [],
  };

  try {
    const animeList = await fetchAllSchedules();

    animeList.forEach((anime) => {
      const day = anime.broadcast?.day;
      const key = dayMap[day];
      if (key) buckets[key].push(anime);
    });

    for (const [key, list] of Object.entries(buckets)) {
      // ordina per orario
      list.sort((a, b) => {
        const t1 = a.broadcast?.time ?? "99:99";
        const t2 = b.broadcast?.time ?? "99:99";
        return t1.localeCompare(t2);
      });

      const container = document.getElementById(key);
      list.forEach((anime) => container.appendChild(createAnimeCard(anime)));
    }
  } catch (err) {
    console.error(err);
  }
}

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", loadWeeklyAnime);
