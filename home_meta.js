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

const T = I18N[LANG];

function metaEscapeHtml(str) {
  return String(str ?? "").replace(/[&<>\"]/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
  }[s]));
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
  const eventName = item.event || item.title || "-";
  const country = item.country || "-";
  const time = item.time || "--:--";
  const note = item.note || item.category || T.realtimeLinked;
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
              ? metaEscapeHtml(T.checkingReleaseDate)
              : `${metaEscapeHtml(T.releaseDateLabel)} ${metaEscapeHtml(releaseDate)}`
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
    target.innerHTML = `<div class="empty-state">${metaEscapeHtml(T.loading)}</div>`;

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
      : `<div class="empty-state">${metaEscapeHtml(T.empty)}</div>`;
  } catch (err) {
    target.innerHTML = `<div class="empty-state">${metaEscapeHtml(T.loadFail)}</div>`;
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