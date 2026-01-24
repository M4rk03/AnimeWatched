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
      minute,
    ),
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
  const title = anime.title_english ?? anime.title;
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
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAllSchedules() {
  let page = 1;
  let allAnime = [];
  let hasNext = true;

  while (hasNext) {
    const res = await fetch(`https://api.jikan.moe/v4/schedules?page=${page}`);

    if (!res.ok) {
      console.warn("Jikan rate limit o errore, page:", page);
      break;
    }

    const json = await res.json();

    if (!json.pagination) {
      console.warn("Pagination mancante, stop");
      break;
    }

    allAnime.push(...json.data);

    hasNext = json.pagination.has_next_page;
    page++;

    await sleep(800); // evita rate limit
  }

  return allAnime;
}

function durationToMinutes(duration) {
  if (!duration) return 0;

  let minutes = 0;

  const hourMatch = duration.match(/(\d+)\s*hr/);
  const minMatch = duration.match(/(\d+)\s*min/);

  if (hourMatch) minutes += parseInt(hourMatch[1], 10) * 60;
  if (minMatch) minutes += parseInt(minMatch[1], 10);

  return minutes;
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
      const durationMin = durationToMinutes(anime.duration);

      if (durationMin <= 3) return;

      const day = anime.broadcast?.day;
      const key = dayMap[day] ?? "generic";
      buckets[key].push(anime);
    });

    for (const [key, list] of Object.entries(buckets)) {
      list.sort((a, b) => {
        const t1 = a.broadcast?.time ?? "99:99";
        const t2 = b.broadcast?.time ?? "99:99";
        return t1.localeCompare(t2);
      });

      const container = document.getElementById(key);
      if (!container) continue;

      list.forEach((anime) => container.appendChild(createAnimeCard(anime)));
    }
  } catch (err) {
    console.error("Errore generale:", err);
  }
}

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", loadWeeklyAnime);
