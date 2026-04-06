const MH_META_API_BASE ="https://api.markethunters.kr/api";

function metaEscapeHtml(str) {
  return String(str ?? "").replace(/[&<>\"]/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
  }[s]));
}

async function loadLegalMeta() {
  const box = document.getElementById("legal-box");
  if (!box) return;

  try {
    const res = await fetch(`${MH_META_API_BASE}/meta/legal`);
    if (!res.ok) throw new Error(`legal failed: ${res.status}`);

    const data = await res.json();
    const items = [data.legal_notice, ...(data.safe_analysis_principles || [])].filter(Boolean);

    box.innerHTML = items.length
      ? items.map((item) => `<div class="bullet-item">${metaEscapeHtml(item)}</div>`).join("")
      : '<div class="empty-state">법적 문구 데이터가 없습니다.</div>';
  } catch (err) {
    box.innerHTML = '<div class="empty-state">법적 문구를 불러오지 못했습니다.</div>';
    console.error(err);
  }
}

function processEconomicEvents(items) {
  return (items || [])
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
      // 날짜 있는 항목 우선
      if (a._hasValidDate && !b._hasValidDate) return -1;
      if (!a._hasValidDate && b._hasValidDate) return 1;

      // 둘 다 날짜 없으면 원래 순서 유지
      if (!a._hasValidDate && !b._hasValidDate) {
        return a._originalIndex - b._originalIndex;
      }

      // 날짜 있으면 빠른 날짜순
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
  const note = item.note || item.category || "-";
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
          ${releaseDate === "-" ? "발표일 미정" : `발표일 ${metaEscapeHtml(releaseDate)}`}
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

    const res = await fetch(`${MH_META_API_BASE}/economic/calendar`);
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
  loadLegalMeta();
  loadEconomicCalendar();

  // 5분마다 자동 새로고침
  setInterval(() => {
    loadEconomicCalendar();
  }, 5 * 60 * 1000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomeMeta);
} else {
  initHomeMeta();
}