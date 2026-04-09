const MH_META_API_BASE = "https://api.markethunters.kr/api";

const ALLOWED_ECONOMIC_IDS = new Set([
  "us-cpi",
  "us-ppi",
  "us-fed-rate",
]);

function detectLang() {
  const htmlLang = String(document.documentElement.lang || "").trim().toLowerCase();
  if (htmlLang === "en") return "en";
  if (window.location.pathname.includes("/en/")) return "en";
  return "ko";
}

const LANG = detectLang();

const I18N = {
  ko: {
    realtimeLinked: "실시간 연동",
    checkingReleaseDate: "발표일 확인 중",
    releaseDateLabel: "발표일",
    loading: "경제지표를 불러오는 중...",
    empty: "표시할 경제지표가 없습니다.",
    loadFail: "경제지표를 불러오지 못했습니다."
  },
  en: {
    realtimeLinked: "Live linked",
    checkingReleaseDate: "Checking release date",
    releaseDateLabel: "Release date",
    loading: "Loading economic indicators...",
    empty: "No economic indicators available.",
    loadFail: "Unable to load economic indicators."
  }
};

const EN_EVENT_MAP = {
  "미국 CPI": "US CPI",
  "미국 PPI": "US PPI",
  "미국 기준금리": "US Fed Rate"
};

const EN_COUNTRY_MAP = {
  "미국": "US",
  "GLOBAL": "GLOBAL"
};

const EN_NOTE_MAP = {
  "미국 · FRED / BLS · 인플레이션": "US · FRED / BLS · Inflation",
  "미국 · FRED / Fed · 통화정책": "US · FRED / Fed · Monetary Policy",
  "미국 · FRED / BLS · 소비자물가": "US · FRED / BLS · Consumer Inflation",
  "미국 · FRED / BLS · 생산자물가": "US · FRED / BLS · Producer Inflation"
};

const EN_CATEGORY_MAP = {
  "인플레이션": "Inflation",
  "통화정책": "Monetary Policy",
  "소비자물가": "Consumer Inflation",
  "생산자물가": "Producer Inflation"
};

function metaEscapeHtml(str) {
  return String(str ?? "").replace(/[&<>\"]/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
  }[s]));
}

function translateEventName(name) {
  if (LANG !== "en") return name || "-";
  return EN_EVENT_MAP[name] || name || "-";
}

function translateCountry(country) {
  if (LANG !== "en") return country || "-";
  return EN_COUNTRY_MAP[country] || country || "-";
}

function translateCategory(category) {
  if (LANG !== "en") return category || "";
  return EN_CATEGORY_MAP[category] || category || "";
}

function translateNote(item) {
  const note = item.note || "";
  const category = item.category || "";

  if (LANG !== "en") {
    return note || category || I18N.ko.realtimeLinked;
  }

  if (EN_NOTE_MAP[note]) return EN_NOTE_MAP[note];

  if (note) {
    let translated = note;
    Object.entries(EN_COUNTRY_MAP).forEach(([ko, en]) => {
      translated = translated.replaceAll(ko, en);
    });
    Object.entries(EN_CATEGORY_MAP).forEach(([ko, en]) => {
      translated = translated.replaceAll(ko, en);
    });
    return translated;
  }

  return translateCategory(category) || I18N.en.realtimeLinked;
}

function processEconomicEvents(items) {
  return (items || [])
    .filter((item) => ALLOWED_ECONOMIC_IDS.has(String(item?.id || "").trim()))
    .map((item, index) => {
      const rawDate = item.release_date || item.release_at || null;
      const parsedDate = rawDate ? new Date(rawDate) : null;
      const hasValidDate = !!parsedDate && !Number.isNaN(parsedDate.getTime());

      return {
        ...item,
        _originalIndex: index,
        _parsedDate: parsedDate,
        _hasValidDate: hasValidDate,
      };
    })
    .sort((a, b) => {
      if (a._hasValidDate && !b._hasValidDate) return -1;
      if (!a._hasValidDate && b._hasValidDate) return 1;

      if (!a._hasValidDate && !b._hasValidDate) {
        return a._originalIndex - b._originalIndex;
      }

      const diff = a._parsedDate - b._parsedDate;
      if (diff !== 0) return diff;

      return a._originalIndex - b._originalIndex;
    });
}

function normalizeDetailPath(path, id) {
  const safeId = encodeURIComponent(id || "");

  if (!path) {
    return LANG === "en"
      ? `en/economic-detail.html?id=${safeId}`
      : `economic-detail.html?id=${safeId}`;
  }

  let normalized = String(path).trim();

  if (LANG === "en") {
    if (normalized.startsWith("/en/")) return normalized;
    if (normalized.startsWith("en/")) return normalized;
    if (normalized.startsWith("/")) return `/en${normalized}`;
    return `en/${normalized}`;
  }

  if (normalized.startsWith("/en/")) {
    return normalized.replace(/^\/en\//, "/");
  }

  if (normalized.startsWith("en/")) {
    return normalized.replace(/^en\//, "");
  }

  return normalized;
}

function buildEconomicDetailHref(item) {
  const id = item.id || "";
  const detailPath = item.detail_path || "";
  return normalizeDetailPath(detailPath, id);
}

function renderEconomicRow(item) {
  const eventName = translateEventName(item.event || item.title || "-");
  const country = translateCountry(item.country || "-");
  const time = item.time || "--:--";
  const note = translateNote(item);
  const releaseDate = item.release_date || item.release_at || "-";
  const href = buildEconomicDetailHref(item);

  return `
    <a class="economic-row economic-link link-row"
       href="${metaEscapeHtml(href)}">

      <div class="economic-main">
        <div class="economic-title">${metaEscapeHtml(eventName)}</div>

        <div class="economic-note">
          ${metaEscapeHtml(country)} · ${metaEscapeHtml(note)}
        </div>

        <div class="economic-note">
          ${
            releaseDate === "-"
              ? metaEscapeHtml(I18N[LANG].checkingReleaseDate)
              : `${metaEscapeHtml(I18N[LANG].releaseDateLabel)} ${metaEscapeHtml(releaseDate)}`
          }
        </div>
      </div>

      <div class="economic-side">
        <div class="economic-time">
          ${metaEscapeHtml(time)}
        </div>
      </div>

    </a>
  `;
}

async function loadEconomicCalendar() {
  const target = document.getElementById("economic");
  if (!target) return;

  try {
    target.innerHTML = `<div class="empty-state">${metaEscapeHtml(I18N[LANG].loading)}</div>`;

    const res = await fetch(`${MH_META_API_BASE}/economic/calendar`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`calendar failed: ${res.status}`);
    }

    const data = await res.json();
    const items = data.items || data.events || [];
    const ordered = processEconomicEvents(items);

    target.innerHTML = ordered.length
      ? ordered.map(renderEconomicRow).join("")
      : `<div class="empty-state">${metaEscapeHtml(I18N[LANG].empty)}</div>`;
  } catch (err) {
    target.innerHTML = `<div class="empty-state">${metaEscapeHtml(I18N[LANG].loadFail)}</div>`;
    console.error(err);
  }
}

function initHomeMeta() {
  loadEconomicCalendar();

  setInterval(() => {
    loadEconomicCalendar();
  }, 60 * 1000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomeMeta);
} else {
  initHomeMeta();
}