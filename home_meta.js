const MH_META_API_BASE = "https://api.markethunters.kr/api";

const ALLOWED_ECONOMIC_IDS = new Set([
  "us-cpi",
  "us-ppi",
  "us-fed-rate",
]);

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

function buildEconomicDetailHref(item) {
  if (item.detail_path) return item.detail_path;

  const id = item.id || "";
  return `economic-detail.html?id=${encodeURIComponent(id)}`;
}

function renderEconomicRow(item) {
  const eventName = item.event || item.title || "-";
  const country = item.country || "-";
  const time = item.time || "--:--";
  const note = item.note || item.category || "실시간 연동";
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
          ${releaseDate === "-" ? "발표일 확인 중" : `발표일 ${metaEscapeHtml(releaseDate)}`}
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
    target.innerHTML = '<div class="empty-state">경제지표를 불러오는 중...</div>';

    const res = await fetch(`${MH_META_API_BASE}/economic/calendar`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`calendar failed: ${res.status}`);

    const data = await res.json();
    const items = data.items || data.events || [];
    const ordered = processEconomicEvents(items);

    target.innerHTML = ordered.length
      ? ordered.map(renderEconomicRow).join("")
      : '<div class="empty-state">표시할 경제지표가 없습니다.</div>';
  } catch (err) {
    target.innerHTML = '<div class="empty-state">경제지표를 불러오지 못했습니다.</div>';
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